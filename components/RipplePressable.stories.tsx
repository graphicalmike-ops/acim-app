import type { Meta, StoryObj } from '@storybook/react-vite';
import { View, Text } from 'react-native';
import { RipplePressable } from './RipplePressable';
import { Colors } from '@/constants/Colors';

const meta: Meta<typeof RipplePressable> = {
  title: 'components/RipplePressable',
  component: RipplePressable,
};
export default meta;

type Story = StoryObj<typeof RipplePressable>;

export const Default: Story = {
  render: () => (
    <RipplePressable
      style={{ padding: 16, borderRadius: 8, backgroundColor: Colors.neutral100, borderWidth: 1, borderColor: Colors.brand400 }}
      onPress={() => {}}
    >
      <Text>Tap and hold to see the ripple</Text>
    </RipplePressable>
  ),
};

export const Instant: Story = {
  render: () => (
    <RipplePressable
      instant
      centered
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.neutral100, borderWidth: 1, borderColor: Colors.brand400, alignItems: 'center', justifyContent: 'center' }}
      rippleColor={Colors.primaryButtonPressed}
      onPress={() => {}}
    >
      <View />
    </RipplePressable>
  ),
};
