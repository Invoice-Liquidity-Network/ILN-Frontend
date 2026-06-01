"use client";

import { Proposal, VoteChoice } from "@/utils/governance";
import QuorumProgressBar from "./QuorumProgressBar";
import VoteProgressBar from "./VoteProgressBar";

interface VoteSectionProps {
  proposal: Proposal;
  isConnected: boolean;
  alreadyVoted: boolean;
  userVote?: VoteChoice;
  onVote: (choice: VoteChoice) => void;
  voteLoading: boolean;
  canVote: boolean;
  connect: () => void;
  votingPower: number;
}

function VoteButton({
  label,
  colorClass,
  onClick,
  disabled,
  loading,
}: {
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-2xl border px-5 py-4 text-sm font-semibold transition-all duration-200 ${colorClass} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.01]"}`}
    >
      {loading ? "Voting…" : label}
    </button>
  );
}

export default function VoteSection({
  proposal,
  isConnected,
  alreadyVoted,
  userVote,
  onVote,
  voteLoading,
  canVote,
  connect,
  votingPower,
}: VoteSectionProps) {
  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const quorumReached = total >= proposal.quorumRequired;
  const voteDisabled = !canVote || voteLoading;

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-semibold">Vote</h2>
            <p className="text-xs text-on-surface-variant">Cast your vote or review current results.</p>
          </div>
          <span className={`text-xs font-semibold uppercase tracking-[0.22em] ${proposal.status === "Active" ? "text-emerald-500" : "text-on-surface-variant"}`}>
            {proposal.status}
          </span>
        </div>

        <div className="mb-5">
          <p className="text-sm font-semibold text-on-surface-variant">
            {total.toLocaleString()} ILN total · {quorumReached ? "Quorum reached" : "Quorum not yet reached"}
          </p>
        </div>

        <QuorumProgressBar
          votesCast={total}
          quorumRequired={proposal.quorumRequired}
          className="mb-5"
        />

        <VoteProgressBar
          votesFor={proposal.votesFor}
          votesAgainst={proposal.votesAgainst}
          votesAbstain={proposal.votesAbstain}
          quorumRequired={proposal.quorumRequired}
        />
      </div>

      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-5 space-y-4">
        {alreadyVoted ? (
          <div className="text-sm text-on-surface-variant">
            You voted <span className="font-semibold text-on-surface">{userVote}</span>.
          </div>
        ) : !isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant">Connect your wallet to cast a vote.</p>
            <button
              type="button"
              onClick={connect}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Connect wallet to vote
            </button>
          </div>
        ) : votingPower === 0 ? (
          <p className="text-sm text-on-surface-variant">You need ILN tokens to vote.</p>
        ) : proposal.status !== "Active" ? (
          <p className="text-sm text-on-surface-variant">Voting has ended for this proposal.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              {alreadyVoted ? "Your vote is recorded." : "Select a stance below to vote."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <VoteButton
                label="Vote For"
                colorClass="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                onClick={() => onVote("For")}
                disabled={voteDisabled}
                loading={voteLoading}
              />
              <VoteButton
                label="Vote Against"
                colorClass="border-red-500 text-red-500 hover:bg-red-500/10"
                onClick={() => onVote("Against")}
                disabled={voteDisabled}
                loading={voteLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
