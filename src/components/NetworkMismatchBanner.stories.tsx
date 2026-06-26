import type { Meta, StoryObj } from '@storybook/react';
import NetworkMismatchBanner from './NetworkMismatchBanner';

const meta: Meta<typeof NetworkMismatchBanner> = {
  title: 'Components/NetworkMismatchBanner',
  component: NetworkMismatchBanner,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
