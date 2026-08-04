import type { Meta, StoryObj } from '@storybook/react-vite';
import { View, Text } from 'react-native';
import { AppScrollView } from './AppScrollView';
import { Colors } from '@/constants/Colors';

const meta: Meta<typeof AppScrollView> = {
  title: 'components/AppScrollView',
  component: AppScrollView,
};
export default meta;

type Story = StoryObj<typeof AppScrollView>;

// Fixed-height wrapper so content overflows and the custom thumb-only
// scrollbar (fades in on scroll, fades out after 2s idle) has something to
// scroll — try scrolling inside the box below.
export const Default: Story = {
  render: () => (
    <View style={{ height: 320, width: 280, borderWidth: 1, borderColor: Colors.brand400 }}>
      <AppScrollView>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.brand400 }}>
            <Text>Row {i + 1}</Text>
          </View>
        ))}
      </AppScrollView>
    </View>
  ),
};
