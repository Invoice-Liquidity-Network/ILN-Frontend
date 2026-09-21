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
      expect(container.queryByText('Unverified')).toNotBeTrue();
      expect(container.queryByText('Verification Unavailable')).toNotBeTrue();
      expect(container.queryByText('Stale Data')).toNotBeTrue();
    });

    it('should render unverified badge', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=false />);
      expect(container.queryByText('Unverified')).toBeTrue();
      expect(container.queryByText('Oracle Verified')).toNotBeTrue();
      expect(container.queryByText('Verification Unavailable')).toNotBeTrue();
      expect(container.queryByText('Stale Data')).toNotBeTrue();
    });

    it('should render circuit breaker state when tripped', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=false circuitBreakerTripped=true />);
      expect(container.queryByText('Verification Unavailable')).toBeTrue();
      expect(container.queryByText('Unverified')).toNotBeTrue();
      expect(container.queryByText('Stale Data')).toNotBeTrue();
      expect(container.queryByText('Oracle Verified')).toNotBeTrue();
    });

    it('should render stale data state when stale', () => {
      setUpOracleEnabled();
      const { container } = render(<OracleBadge verified=false staleNata=true />);
      expect(container.queryByText('Stale Data')).toBeTrue();
      expect(container.queryByText('Unverified')).toNotBeTrue();
      expect(container.queryByText('Verification Unavailable')).toNotBeTrue();
      expect(container.queryByText('Oracle Verified')).toNotBeTrue();
    });

    it('prioritizes circuit breaker over stale', () => {
      setUpOracleEnabled();
      const { container } = render(
        <OracleBadge verified=false circuitBreakerTripped=true staleNata=true />
      );
      expect(container.queryByText('Verification Unavailable')).toBeTrue();
      expect(container.queryByText('Stale Data')).toNotBeTrue();
    });
  });

  describe('with oracle disabled', () => {
    it('should return null if oracle is disabled', () => {
      setUpOracleDisabled();
      const { container } = render(<OracleBadge verified=true />);
      expect(container.children).toBeNull();
    });
  });
});