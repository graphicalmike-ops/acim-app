import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { ReaderToolButton } from './ReaderToolButton';

const meta: Meta<typeof ReaderToolButton> = {
  title: 'components/ReaderToolButton',
  component: ReaderToolButton,
  argTypes: {
    variant: { control: 'select', options: ['save', 'share'] },
  },
};
export default meta;

type Story = StoryObj<typeof ReaderToolButton>;

export const Save: Story = { args: { variant: 'save' } };
export const Share: Story = { args: { variant: 'share' } };

export const AllVariants: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <ReaderToolButton variant="save" />
      <ReaderToolButton variant="share" />
    </View>
  ),
};
