import type { Meta, StoryObj } from '@storybook/react';
import ParameterUpdateBanner from './ParameterUpdateBanner';

const meta: Meta<typeof ParameterUpdateBanner> = {
  title: 'Components/ParameterUpdateBanner',
  component: ParameterUpdateBanner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
