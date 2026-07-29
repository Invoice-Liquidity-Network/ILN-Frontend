import type { Meta, StoryObj } from '@storybook/react';
import PayerReminderOptIn from './PayerReminderOptIn';

const meta: Meta<typeof PayerReminderOptIn> = {
  title: 'Components/Payer/PayerReminderOptIn',
  component: PayerReminderOptIn,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
