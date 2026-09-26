/* eslint-disable no-console */
import fs from 'fs';

/**
 * CI Gate: Detect fake transaction hashes and in-memory mock mutations
 * in money- and vote-moving code paths (soroban.ts, governance.ts).
 *
 * Prevents regressions where tracking issues close with client-side mocks
 * rather than live Soroban contract transactions.
 */

const TARGET_FILES = ['src/utils/governance.ts', 'src/utils/soroban.ts'];

/**
 * Explicit allowlist of known remaining stubbed instances.
 * Each entry is strictly tied to a tracking issue and MUST be removed
 * when the corresponding real on-chain transaction issue lands.
 */
const ALLOWLIST = [
  {
    file: 'src/utils/governance.ts',
    fn: 'castVote',
    pattern: 'fake-tx-hash',
    trackingIssue: '#10',
    description:
      'castVote returns Math.random() transaction hash until on-chain Soroban voting lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'castVote',
    pattern: 'mock-mutation',
    trackingIssue: '#10',
    description:
      'castVote mutates in-memory MOCK_PROPOSALS votes until on-chain Soroban voting lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'executeProposal',
    pattern: 'fake-tx-hash',
    trackingIssue: '#10',
    description:
      'executeProposal returns Math.random() transaction hash until on-chain execution lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'executeProposal',
    pattern: 'mock-mutation',
    trackingIssue: '#10',
    description:
      'executeProposal mutates MOCK_PROPOSALS status to Executed until on-chain execution lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'vetoProposal',
    pattern: 'mock-mutation',
    trackingIssue: '#10',
    description: 'vetoProposal mutates MOCK_PROPOSALS status to Vetoed until on-chain veto lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'createProposal',
    pattern: 'fake-tx-hash',
    trackingIssue: '#10',
    description:
      'createProposal returns Math.random() txHash until on-chain proposal creation lands',
  },
  {
    file: 'src/utils/governance.ts',
    fn: 'createProposal',
    pattern: 'mock-mutation',
    trackingIssue: '#10',
    description:
      'createProposal pushes newProposal to MOCK_PROPOSALS until on-chain proposal creation lands',
  },
];

function findFunctionScope(lines, lineIdx) {
  for (let i = lineIdx; i >= 0; i--) {
    const match = lines[i].match(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/);
    if (match) return match[1];
    const constFnMatch = lines[i].match(
      /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/
    );
    if (constFnMatch) return constFnMatch[1];
  }
  return 'global';
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return; // Skip comments
    }

    // Pattern 1: Math.random() used for hashes or fake IDs
    if (line.includes('Math.random()')) {
      const isHashRelated =
        /hash|tx|id|proposal/i.test(line) ||
        (idx > 0 && /hash|tx/i.test(lines[idx - 1])) ||
        (idx > 1 && /hash|tx/i.test(lines[idx - 2])) ||
        (idx < lines.length - 1 && /hash|tx/i.test(lines[idx + 1])) ||
        (idx < lines.length - 2 && /hash|tx/i.test(lines[idx + 2]));

      if (isHashRelated) {
        const fnName = findFunctionScope(lines, idx);
        findings.push({
          file: filePath,
          line: idx + 1,
          fn: fnName,
          code: trimmed,
          pattern: 'fake-tx-hash',
        });
      }
    }

    // Pattern 2: MOCK_ array mutations inside exported or contract functions
    const mockMutationMatch = line.match(
      /MOCK_[A-Z0-9_]+\s*\.\s*(push|unshift|splice|pop|shift|fill|reverse|sort)/
    );
    if (mockMutationMatch) {
      const fnName = findFunctionScope(lines, idx);
      findings.push({
        file: filePath,
        line: idx + 1,
        fn: fnName,
        code: trimmed,
        pattern: 'mock-mutation',
      });
    }

    // Pattern 3: Mutating properties of MOCK_ entries (e.g. proposal.votesFor +=, proposal.status =)
    const isMockPropMutation =
      /proposal\.(votesFor|votesAgainst|votesAbstain)\s*(\+=|=)/.test(line) ||
      /proposal\.status\s*=\s*['"][A-Za-z]+['"]/.test(line);

    if (isMockPropMutation) {
      const fnName = findFunctionScope(lines, idx);
      findings.push({
        file: filePath,
        line: idx + 1,
        fn: fnName,
        code: trimmed,
        pattern: 'mock-mutation',
      });
    }
  });

  return findings;
}

let hasUnallowlistedErrors = false;
const allFindings = [];

for (const file of TARGET_FILES) {
  const fileFindings = scanFile(file);
  allFindings.push(...fileFindings);
}

// Group findings by file, function, and pattern
const groupedFindings = new Map();
for (const finding of allFindings) {
  const key = `${finding.file}:${finding.fn}:${finding.pattern}`;
  if (!groupedFindings.has(key)) {
    groupedFindings.set(key, []);
  }
  groupedFindings.get(key).push(finding);
}

console.log('--- CI Gate: Mock Transaction & Fake Hash Scanner ---');

// Check findings against allowlist
for (const [key, instances] of groupedFindings.entries()) {
  const [file, fn, pattern] = key.split(':');
  const allowlisted = ALLOWLIST.find(
    (entry) => entry.file === file && entry.fn === fn && entry.pattern === pattern
  );

  if (allowlisted) {
    console.log(
      `[ALLOWLISTED] ${file} -> function ${fn}() [${pattern}] (Tracking Issue: ${allowlisted.trackingIssue})`
    );
  } else {
    console.error(`\n[VIOLATION] Disallowed mock transaction pattern found!`);
    console.error(`  File:     ${file}`);
    console.error(`  Function: ${fn}()`);
    console.error(`  Pattern:  ${pattern}`);
    instances.forEach((inst) => {
      console.error(`  Line ${inst.line}: ${inst.code}`);
    });
    console.error(
      `  Action: Real transaction building and signing (signTx) must be implemented, or explicitly allowlisted with a tracking issue.`
    );
    hasUnallowlistedErrors = true;
  }
}

// Check for stale allowlist entries
console.log('\n--- Checking for Stale Allowlist Entries ---');
for (const entry of ALLOWLIST) {
  const key = `${entry.file}:${entry.fn}:${entry.pattern}`;
  if (!groupedFindings.has(key)) {
    console.log(
      `[PRUNED] Allowlist entry resolved: ${entry.file} -> ${entry.fn}() [${entry.pattern}] (${entry.trackingIssue}) is no longer in codebase. Clean up ALLOWLIST in this script!`
    );
  }
}

if (hasUnallowlistedErrors) {
  console.error('\nFAIL: Unallowlisted mock transaction patterns detected.');
  process.exit(1);
} else {
  console.log(
    `\nPASS: ${allFindings.length} mock pattern instances detected, all verified against allowlist.`
  );
  process.exit(0);
}
