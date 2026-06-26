import type { Meta, StoryObj } from '@storybook/react';
import InvoicePdfButton from './InvoicePdfButton';

const meta: Meta<typeof InvoicePdfButton> = {
  title: 'Components/InvoicePdfButton',
  component: InvoicePdfButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockInvoice = {
  id: 42n,
  amount: 1000000000n,
  status: 'Paid',
  payer: 'GABC12345678901234567890123456789012345678901234567890123456',
  freelancer: 'GDEF4567890123456789012345678901234567890123456789012345678',
  discount_rate: 300,
  due_date: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30),
  token: 'USDC',
} as any;

export const Default: Story = {
  args: {
    invoice: mockInvoice,
    data: {
      freelancerAddress: 'GDEF4567890123456789012345678901234567890123456789012345678',
      payerAddress: 'GABC12345678901234567890123456789012345678901234567890123456',
      amount: 1000000000n,
      tokenSymbol: 'USDC',
      discountRate: 3.0,
      dueDate: new Date(Date.now() + 86400 * 30).toISOString(),
      status: 'Paid',
    },
  },
};
