import type { Meta, StoryObj } from '@storybook/react';
import ActivityFeed from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Components/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    invoiceId: 42n,
  },
};
