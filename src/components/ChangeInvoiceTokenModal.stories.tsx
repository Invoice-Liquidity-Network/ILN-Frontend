import type { Meta, StoryObj } from '@storybook/react';
import ChangeInvoiceTokenModal from './ChangeInvoiceTokenModal';

const meta: Meta<typeof ChangeInvoiceTokenModal> = {
  title: 'Components/ChangeInvoiceTokenModal',
  component: ChangeInvoiceTokenModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockInvoice = {
  id: 42n,
  token: 'USDC',
} as any;

export const Default: Story = {
  args: {
    invoice: mockInvoice,
    onClose: () => {},
    onSuccess: (tokenId: string) => console.log('Changed to:', tokenId),
  },
};
