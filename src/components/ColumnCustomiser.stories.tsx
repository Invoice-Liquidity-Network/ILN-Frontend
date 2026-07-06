import type { Meta, StoryObj } from '@storybook/react';
import ColumnCustomiser from './ColumnCustomiser';

const meta: Meta<typeof ColumnCustomiser> = {
  title: 'Components/ColumnCustomiser',
  component: ColumnCustomiser,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const allColumns = [
  { id: 'id', label: 'ID', isMandatory: true },
  { id: 'payer', label: 'Payer' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'dueDate', label: 'Due Date' },
];

export const Default: Story = {
  args: {
    allColumns,
    visibleColumns: ['id', 'payer', 'amount', 'status', 'dueDate'],
    columnOrder: ['id', 'payer', 'amount', 'status', 'dueDate'],
    onVisibilityChange: (id, visible) => console.log(id, visible),
    onOrderChange: (order) => console.log(order),
    onReset: () => {},
  },
};

export const SomeHidden: Story = {
  args: {
    allColumns,
    visibleColumns: ['id', 'payer', 'amount'],
    columnOrder: ['id', 'payer', 'amount', 'status', 'dueDate'],
    onVisibilityChange: (id, visible) => console.log(id, visible),
    onOrderChange: (order) => console.log(order),
    onReset: () => {},
  },
};
