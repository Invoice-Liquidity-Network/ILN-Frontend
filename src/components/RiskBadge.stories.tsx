import type { Meta, StoryObj } from '@storybook/react';
import RiskBadge from './RiskBadge';

const meta: Meta<typeof RiskBadge> = {
  title: 'Components/RiskBadge',
  component: RiskBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    risk: {
      control: { type: 'select' },
      options: ['low', 'medium', 'high', 'critical'],
    },
    showLabel: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Low: Story = {
  args: {
    risk: 'low',
    showLabel: true,
  },
};

export const Medium: Story = {
  args: {
    risk: 'medium',
    showLabel: true,
  },
};

export const High: Story = {
  args: {
    risk: 'high',
    showLabel: true,
  },
};

export const Critical: Story = {
  args: {
    risk: 'critical',
    showLabel: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    risk: 'high',
    showLabel: false,
  },
};

export const AllRiskLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <RiskBadge risk="low" showLabel />
      <RiskBadge risk="medium" showLabel />
      <RiskBadge risk="high" showLabel />
      <RiskBadge risk="critical" showLabel />
    </div>
  ),
};