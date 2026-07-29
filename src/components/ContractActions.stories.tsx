import type { Meta, StoryObj } from '@storybook/react';
import ContractActions from './ContractActions';

const meta: Meta<typeof ContractActions> = {
  title: 'Components/ContractActions',
  component: ContractActions,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
