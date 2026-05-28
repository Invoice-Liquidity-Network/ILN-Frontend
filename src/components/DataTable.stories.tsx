import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', amount: 1000 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Pending', amount: 2500 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', amount: 750 },
];

const columns = [
  {
    key: 'name' as const,
    label: 'Name',
    sortable: true,
  },
  {
    key: 'email' as const,
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status' as const,
    label: 'Status',
    sortable: false,
    render: (value: string) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        value === 'Active' ? 'bg-green-100 text-green-800' :
        value === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {value}
      </span>
    ),
  },
  {
    key: 'amount' as const,
    label: 'Amount',
    sortable: true,
    render: (value: number) => `$${value.toLocaleString()}`,
  },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns,
  },
};

export const WithSelection: Story = {
  args: {
    data: sampleData,
    columns,
    selectable: true,
    selectedIds: [1, 3],
    onSelectionChange: (ids) => console.log('Selected:', ids),
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyMessage: 'No data available',
  },
};

export const WithPagination: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: ['Active', 'Pending', 'Inactive'][i % 3],
      amount: Math.floor(Math.random() * 5000) + 100,
    })),
    columns,
    pagination: {
      page: 1,
      pageSize: 10,
      total: 50,
      onPageChange: (page) => console.log('Page:', page),
    },
  },
};