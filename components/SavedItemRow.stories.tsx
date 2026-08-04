import type { Meta, StoryObj } from '@storybook/react-vite';
import { SavedItemRow } from './SavedItemRow';
import type { SavedBookmark } from '@/utils/bookmarks';

const meta: Meta<typeof SavedItemRow> = {
  title: 'components/SavedItemRow',
  component: SavedItemRow,
};
export default meta;

type Story = StoryObj<typeof SavedItemRow>;

const sampleItem: SavedBookmark = {
  id: 'sample-1',
  bookId: 'theory',
  anchor: 'theory-ch26',
  paragraph: 4,
  notation: 'T-26.IV.4:7',
  name: 'La invitación al Espíritu Santo',
  note: 'Esto me recuerda a estar presente con lo que es.',
  date: new Date().toISOString(),
  verses: [7],
};

export const Default: Story = {
  args: { item: sampleItem, onPress: () => {} },
};

export const NoNote: Story = {
  args: { item: { ...sampleItem, note: '' }, onPress: () => {} },
};
