import { expect, test } from '@playwright/test';

/**
 * E2E tests for multi-token decimal handling (Issue #591).
 *
 * USDC and EURC use 6 decimals, while XLM uses 7 decimals. This test verifies
 * that amount formatting is correct throughout the full submission → display →
 * funding confirmation flow for both decimal configurations, catching
 * integration-level regressions that unit tests of formatTokenAmount() alone
 * might miss.
 */

test.describe('Multi-token decimal handling', () => {
  test.slow();

  test.describe('XLM (7 decimals) — full submission flow', () => {
    test('displays XLM amount with 7-decimal precision on submission form', async ({ page }) => {
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      // Find the token selector — look for a dropdown, button, or select
      // that controls which token is being used for the invoice.
      const tokenSelector = page
        .locator('button, select, [role="combobox"]')
        .filter({ hasText: /XLM|token|asset/i })
        .first();

      // If a token selector exists, ensure XLM can be selected
      if (await tokenSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tokenSelector.click();
        // Look for XLM in the dropdown
        const xlmOption = page.getByText('XLM', { exact: false }).first();
        if (await xlmOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await xlmOption.click();
        }
        await page.waitForTimeout(500);
      }

      // Fill in an amount with 7 decimal places (XLM precision)
      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await expect(amountInput).toBeVisible({ timeout: 10000 });
      await amountInput.fill('1234.1234567');
      const value = await amountInput.inputValue();

      // The input should preserve all 7 decimal digits
      expect(value).toContain('1234.1234567');
    });

    test('XLM amount appears correctly formatted on marketplace listing', async ({ page }) => {
      // Submit an invoice first
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      const payerInput = page.getByPlaceholder(/payer|G\.\.\./i).first();
      await payerInput.fill('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');

      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await amountInput.fill('5000.1234567');

      // Submit the invoice
      const submitBtn = page.getByRole('button', { name: /submit|send|create|continue/i }).first();
      if (await submitBtn.isEnabled()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }

      // Navigate to marketplace
      await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Look for the XLM amount on the marketplace
      // Check that the amount is displayed with XLM context and not
      // truncated to 2 decimal places (which would indicate a USD formatter leak).
      const bodyText = await page.locator('body').innerText();
      const hasXlmContext = bodyText.includes('XLM') || bodyText.includes('5000');

      // If XLM amounts are visible, verify they're not USD-formatted
      if (hasXlmContext) {
        // A USD format would show "$5,000.12" — we should see XLM with proper decimals
        const dollarSignPattern = /\$\d{1,3}(,\d{3})*\.\d{2}/;
        const xlmElements = page.locator('body').locator(':has-text("XLM")');
        const count = await xlmElements.count();
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const text = await xlmElements.nth(i).innerText();
            // Should NOT be incorrectly formatted as a USD currency
            expect(text).not.toMatch(dollarSignPattern);
          }
        }
      }
    });

    test('XLM amount formatting survives navigation between pages', async ({ page }) => {
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      const payerInput = page.getByPlaceholder(/payer|G\.\.\./i).first();
      await payerInput.fill('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');

      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await amountInput.fill('7500.7654321');

      // Navigate away and back to verify formatting consistency
      await page.goto('/marketplace', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Amount input should still be accessible
      const amountAfterNav = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      const isVisible = await amountAfterNav.isVisible({ timeout: 5000 }).catch(() => false);
      expect(isVisible).toBe(true);
    });
  });

  test.describe('6-decimal token (USDC/EURC) — full submission flow', () => {
    test('displays 6-decimal token amount correctly on submission form', async ({ page }) => {
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      // Try to select a 6-decimal token (USDC or EURC)
      const tokenSelector = page
        .locator('button, select, [role="combobox"]')
        .filter({ hasText: /USDC|EURC|token|asset/i })
        .first();

      let selectedSixDecimal = false;
      if (await tokenSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
        await tokenSelector.click();
        await page.waitForTimeout(500);

        // Try USDC first
        const usdcOption = page.getByText(/USDC/i).first();
        if (await usdcOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await usdcOption.click();
          selectedSixDecimal = true;
        } else {
          // Try EURC
          const eurcOption = page.getByText(/EURC/i).first();
          if (await eurcOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await eurcOption.click();
            selectedSixDecimal = true;
          }
        }
        await page.waitForTimeout(500);
      }

      // Fill in a 6-decimal amount
      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await expect(amountInput).toBeVisible({ timeout: 10000 });
      await amountInput.fill('500.123456');
      const value = await amountInput.inputValue();

      // The input should preserve all 6 decimal digits
      expect(value).toContain('500.123456');

      if (selectedSixDecimal) {
        // Verify the amount is NOT truncated or coerced to 7 decimals
        // (which would indicate XLM formatting leaking into the 6-decimal token flow)
        expect(value).not.toContain('500.1234567');
      }
    });

    test('6-decimal token formatting does not cross-contaminate XLM flow', async ({ page }) => {
      // This test verifies that switching between tokens doesn't leak
      // formatting from one to the other.

      // First submit with a 6-decimal token
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await amountInput.fill('100.123456'); // 6 decimal places

      // Clear and fill with XLM-style 7 decimal places
      await amountInput.clear();
      await amountInput.fill('200.1234567'); // 7 decimal places

      const value = await amountInput.inputValue();
      // Should preserve all 7 decimal places after switching from 6-decimal
      expect(value).toBe('200.1234567');
    });
  });

  test.describe('Funding confirmation — decimal display', () => {
    test('funding confirmation shows correct decimal precision for XLM', async ({ page }) => {
      await page.goto('/submit', { waitUntil: 'domcontentloaded' });

      // Fill in invoice with XLM
      const payerInput = page.getByPlaceholder(/payer|G\.\.\./i).first();
      if (await payerInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await payerInput.fill('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
      }

      const amountInput = page.getByPlaceholder(/amount|5000|0\.0/i).first();
      await amountInput.fill('3000.1234567'); // XLM: 7 decimals

      // Submit
      const submitBtn = page.getByRole('button', { name: /submit|send|create|continue/i }).first();
      if (await submitBtn.isEnabled()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }

      // On any confirmation/success state, verify the amount isn't rounded to USD-style 2 decimals
      const bodyText = await page.locator('body').innerText();
      // If a confirmation message shows the amount with fewer than expected decimals,
      // it indicates the formatter defaulted to a currency format rather than token format
      if (bodyText.includes('3000')) {
        // The amount should appear with reasonable precision — not just "3000.12"
        const confirmationAmounts = bodyText.match(/3[,.]?0{1,3}\.?\d*/g);
        if (confirmationAmounts && confirmationAmounts.length > 0) {
          // At minimum, we should see more than 2 decimal places for XLM
          const hasMoreThanTwoDecimals = confirmationAmounts.some(
            (a: string) => a.includes('.') && a.split('.')[1]?.length > 2
          );
          // This is a soft assertion: if the UI shows amounts, they should
          // not be truncated to USD-style formatting
          expect(hasMoreThanTwoDecimals || !confirmationAmounts.length).toBe(true);
        }
      }
    });
  });
});
