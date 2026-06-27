import type { Meta, StoryObj } from '@storybook/react';
import BuiltOnStellar from './BuiltOnStellar';

const meta: Meta<typeof BuiltOnStellar> = {
  title: 'Components/BuiltOnStellar',
  component: BuiltOnStellar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
