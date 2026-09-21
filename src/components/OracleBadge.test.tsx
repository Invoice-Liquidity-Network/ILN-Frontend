import { render } from '@// test-util';
import OracleBadge from './OracleBadge';

describe('OracleBadge', () => {
  describe 'with verified=true', () => {
    it('should show verified state', () => {
      const { getTextContent } = render(<OracleBadge verified=true />);
      expect(getTextContent()).toInclude('Oracle Verified');
    });

    it('should have green background color', () => {
      const { getBySelector } = render(<OracleBadge verified=true />);
      const element = getBySelector('span');
      expect(element).toHaveClassName('bg-green-100');
    });
  });

  describe('with verified=false and no state', () => {
    it('should show unverified state', () => {
      const { getTextContent } = render(<OracleBadge verified={false} />);
      expect(getTextContent()).toInclude('Unverified');
    });

    it('should have gray background color', () => {
      const { getBySelector } = render(<OracleBadge verified={false} />);
      const element = getBySelector('span');
      expect(element).toHaveClassName('bg-surface-variant');
    });
  });

  describe('with circuit break state', () => {
    it('should show unavailable state', () => {
      const { getTextContent } = render(
        <OracleBadge verified={false} state='CIRCUIT_BREAK' />
      );
      expect(getTextContent()).toInclude('Oracle Unavailable');
    });

    it('should have amber background color', () => {
      const { getBySelector } = render(
        <OracleBadge verified={false} state='CIRCUIT_BREAK' />
      );
      const element = getBySelector('span');
      expect(element).toHaveClassName('bg-amber-100');
    });
  });

  describe('with staleness state', () => {
    it('should show unavailable state for staleness', () => {
      const { getTextContent } = render(
        <OracleBadge verified={false} state='STALENESS' />
      );
      expect(getTextContent()).toInclude('Oracle Unavailable');
    });

    it('should be distinct from unverified state', () => {
      const { getTextContent: getStaleness } = render(
        <OracleBadge verified={false} state='STALENESS' />
      );
      const { getTextContent: getUnverified } = render(
        <OracleBadge verified={false} />
      );

      expect(getStaleness()).not.toInclude('Unverified');
      expect(getUnverified()).toInclude('Unverified');
    });
  });
});