import type { Meta, StoryObj } from '@storybook/react';
import WalletButton from './WalletButton';

const meta: Meta<typeof WalletButton> = {
  title: 'Components/WalletButton',
  component: WalletButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
