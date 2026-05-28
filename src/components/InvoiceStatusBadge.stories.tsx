import type { Meta, StoryObj } from '@storybook/react';
import InvoiceStatusBadge from './InvoiceStatusBadge';

const meta: Meta<typeof InvoiceStatusBadge> = {
  title: 'Components/InvoiceStatusBadge',
  component: InvoiceStatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['Open', 'Funded', 'Paid', 'Defaulted', 'Cancelled'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    status: 'Open',
  },
};

export const Funded: Story = {
  args: {
    status: 'Funded',
  },
};

export const Paid: Story = {
  args: {
    status: 'Paid',
  },
};

export const Defaulted: Story = {
  args: {
    status: 'Defaulted',
  },
};

export const Cancelled: Story = {
  args: {
    status: 'Cancelled',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <InvoiceStatusBadge status="Open" />
      <InvoiceStatusBadge status="Funded" />
      <InvoiceStatusBadge status="Paid" />
      <InvoiceStatusBadge status="Defaulted" />
      <InvoiceStatusBadge status="Cancelled" />
    </div>
  ),
};