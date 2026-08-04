import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookSectionHeading } from './BookSectionHeading';

const meta: Meta<typeof BookSectionHeading> = {
  title: 'components/BookSectionHeading',
  component: BookSectionHeading,
};
export default meta;

type Story = StoryObj<typeof BookSectionHeading>;

export const Default: Story = { args: { label: 'Texto' } };
export const WorkbookLabel: Story = { args: { label: 'Libro De Ejercicios' } };
