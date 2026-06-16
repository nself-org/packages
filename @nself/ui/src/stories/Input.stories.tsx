/**
 * Input stories — states and variants.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../Input.js';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter a value',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '20rem' }}>
      <label htmlFor="demo-input" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
        Task title
      </label>
      <Input id="demo-input" placeholder="Review pull request…" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: 'Invalid value',
    'aria-invalid': true,
  },
};
