import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { HeroLogo } from './HeroLogo';
import { Colors } from '@/constants/Colors';

// HeroLogo's title text is hardcoded to Colors.brand100 (a light cream) —
// it's only ever placed over the dark hero photo/overlay in the app, not a
// flat light background, so it needs a dark backdrop here to be visible.
const meta: Meta<typeof HeroLogo> = {
  title: 'components/HeroLogo',
  component: HeroLogo,
  decorators: [
    (Story) => (
      <View style={{ backgroundColor: Colors.dark100, padding: 32, borderRadius: 12 }}>
        <Story />
      </View>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof HeroLogo>;

export const Default: Story = {};
