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
  args: {
    label: 'Label',
    placeholder: 'Enter a value',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Value',
    placeholder: 'Enter a value',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Task title',
    placeholder: 'Review pull request…',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Field with error',
    placeholder: 'Invalid value',
    'aria-invalid': true,
  },
};
