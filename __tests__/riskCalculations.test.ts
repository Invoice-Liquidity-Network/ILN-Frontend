import { describe, it, expect } from 'vitest';
import {
  calculateRiskFactors,
  calculateInvoiceRiskScore,
  calculatePortfolioRiskMetrics,
  generateRiskTrendData,
} from '@/utils/riskCalculations';
import { PayerScore } from '@/utils/risk';

describe('Risk Calculations', () => {
  describe('calculateRiskFactors', () => {
    it('calculates risk factors for a payer with history', () => {
      const payer: PayerScore = {
        score: 75,
        settled_on_time: 8,
        defaults: 2,
      };
      const fundedDate = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60; // 30 days ago

      const factors = calculateRiskFactors(payer, fundedDate);

      expect(factors.onTimePaymentRate).toBe(80); // 8 / 10
      expect(factors.defaultCount).toBe(2);
      expect(factors.fundingAge).toBe(30);
    });

    it('returns 0 payment rate for unknown payer', () => {
      const factors = calculateRiskFactors(null, Math.floor(Date.now() / 1000));
      expect(factors.onTimePaymentRate).toBe(0);
      expect(factors.defaultCount).toBe(0);
    });
  });

  describe('calculateInvoiceRiskScore', () => {
    it('returns 50 for unknown payers', () => {
      const score = calculateInvoiceRiskScore(null, 10);
      expect(score).toBe(50);
    });

    it('returns score between 0 and 100', () => {
      const payer: PayerScore = {
        score: 85,
        settled_on_time: 15,
        defaults: 1,
      };

      const score = calculateInvoiceRiskScore(payer, 5);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('penalizes for defaults', () => {
      const payerWithDefaults: PayerScore = {
        score: 85,
        settled_on_time: 10,
        defaults: 3,
      };
      const payerNoDefaults: PayerScore = {
        score: 85,
        settled_on_time: 13,
        defaults: 0,
      };

      const scoreWith = calculateInvoiceRiskScore(payerWithDefaults, 5);
      const scoreWithout = calculateInvoiceRiskScore(payerNoDefaults, 5);

      expect(scoreWith).toBeLessThan(scoreWithout);
    });

    it('penalizes for funding age', () => {
      const payer: PayerScore = {
        score: 80,
        settled_on_time: 10,
        defaults: 0,
      };

      const scoreYoung = calculateInvoiceRiskScore(payer, 10);
      const scoreOld = calculateInvoiceRiskScore(payer, 90);

      expect(scoreYoung).toBeGreaterThan(scoreOld);
    });
  });

  describe('calculatePortfolioRiskMetrics', () => {
    it('returns zero metrics for empty portfolio', () => {
      const metrics = calculatePortfolioRiskMetrics([]);

      expect(metrics.averageRiskScore).toBe(0);
      expect(metrics.highRiskCount).toBe(0);
      expect(metrics.mediumRiskCount).toBe(0);
      expect(metrics.lowRiskCount).toBe(0);
      expect(metrics.totalFunded).toBe(0n);
    });

    it('calculates correct metrics for mixed risk portfolio', () => {
      const risks = [
        {
          id: 1n,
          freelancer: 'G1',
          amount: 1000000000n,
          discount_rate: 500n,
          due_date: 0,
          status: 'Funded',
          payerScore: null,
          riskLevel: 'Low' as const,
          riskScore: 75,
          riskFactors: {
            onTimePaymentRate: 100,
            defaultCount: 0,
            fundingAge: 10,
          },
        },
        {
          id: 2n,
          freelancer: 'G2',
          amount: 1000000000n,
          discount_rate: 500n,
          due_date: 0,
          status: 'Funded',
          payerScore: null,
          riskLevel: 'High' as const,
          riskScore: 25,
          riskFactors: {
            onTimePaymentRate: 20,
            defaultCount: 3,
            fundingAge: 60,
          },
        },
      ];

      const metrics = calculatePortfolioRiskMetrics(risks);

      expect(metrics.averageRiskScore).toBe(50);
      expect(metrics.lowRiskCount).toBe(1);
      expect(metrics.highRiskCount).toBe(1);
      expect(metrics.totalFunded).toBe(2000000000n);
    });
  });

  describe('generateRiskTrendData', () => {
    it('generates trend data for specified days', () => {
      const risks = [
        {
          id: 1n,
          freelancer: 'G1',
          amount: 1000000000n,
          discount_rate: 500n,
          due_date: 0,
          status: 'Funded',
          payerScore: null,
          riskLevel: 'Low' as const,
          riskScore: 75,
          riskFactors: {
            onTimePaymentRate: 100,
            defaultCount: 0,
            fundingAge: 10,
          },
        },
      ];

      const trendData = generateRiskTrendData(risks, 7);

      expect(trendData).toHaveLength(7);
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('averageRisk');
      expect(trendData[0]).toHaveProperty('lowRiskCount');
      expect(trendData[0]).toHaveProperty('highRiskCount');
    });

    it('generates data with valid dates in ascending order', () => {
      const risks = [];
      const trendData = generateRiskTrendData(risks, 5);

      const dates = trendData.map((d) => new Date(d.date).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
      }
    });
  });
});
