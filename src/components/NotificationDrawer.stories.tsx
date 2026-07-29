import type { Meta, StoryObj } from '@storybook/react';
import NotificationDrawer from './NotificationDrawer';

const meta: Meta<typeof NotificationDrawer> = {
  title: 'Components/NotificationDrawer',
  component: NotificationDrawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClose: () => {},
  },
};
