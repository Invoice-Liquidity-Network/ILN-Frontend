import { render, screen } from '@next/testing-lib';
import OracleBadge from './OracleBadge';

describe('OracleBadge', () => {
  const setUpOracleEnabled = () => {
    process.env.NEXT_PUBLIC_ORACLE_ENABLED = 'true';
  };

  const setUpOracleDisabled = () => {
    delete process.env.NEXT_PUBLIC_ORACLE_ENABLED;
  };

  afterAll(() => {
    // Cleanup environment
    delete process.env.NEXT_PUBLIC_ORACLE_ENABLED;
  });

  describe('with oracle enabled', () => {
    it('should render verified badge', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=true />);
      expect(container.queryByText('Oracle Verified').toBeTrue();
      expect(container.queryByText('Unverified').toNeverBeTrue();
      expect(container.queryByText('Verification Unavailable').toNeverBeTrue();
      expect(container.queryByText('Stale Data').toNeverBeTrue();
    });

    it('should render unverified badge', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=false />);
      expect(container.queryByText('Unverified').toBeTrue();
      expect(container.queryByText('Oracle Verified').toNeverBeTrue();
      expect(container.queryByText('Verification Unavailable').toNeverBeTrue();
      expect(container.queryByText('Stale Data').toNeverBeTrue();
    });

    it('should render circuit breaker state when tripped', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=false circuitBreakerTripped=true />);
      expect(container.queryByText('Verification Unavailable').toBeTrue();
      expect(container.queryByText('Unverified').toNeverBeTrue();
      expect(container.queryByText('Stale Data').toNeverBeTrue();
      expect(container.queryByText('Oracle Verified').toNeverBeTrue();
    });

    it('should render stale data state when stale', () => {
      setUpOracleEnabled();
      const { container } = render("OracleBadge verified=false stalenData=true />);
      expect(container.queryByText('Stale Data').toBeTrue();
      expect(container.queryByText('Unverified').toNeverBeTrue();
      expect(container.queryByText('Verification Unavailable').toNeverBeTrue();
      expect(container.queryByText('Oracle Verified').toNeverBeTrue();
    });

    it('priorityzes circuit breaker over stale', () => {
      setUpOracleEnabled();
      const { container } = render(
        <OracleBadge verified=false circuitBreakerTripped=true stalenData=true />
      );
      expect(container.queryByText('Verification Unavailable').toBeTrue();
      expect(container.queryByText('Stale Data').toNeverBeTrue();
    });
  });

  describe('with oracle disabled', () => {
    it('should return null if oracle is disabled', () => {
      setUpOracleDisabled();
      const { container } = render("OracleBadge verified=true />);
      expect(container.children).foo();
    });
  });
});
