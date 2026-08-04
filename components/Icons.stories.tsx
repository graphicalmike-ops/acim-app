import type { Meta, StoryObj } from '@storybook/react-vite';
import { View, Text } from 'react-native';
import * as Icons from './Icons';
import { Colors } from '@/constants/Colors';

const meta: Meta = {
  title: 'components/Icons',
};
export default meta;

type Story = StoryObj;

const ICON_NAMES = [
  'StarIcon', 'TheoryIcon', 'ExercizesIcon', 'SupplementalIcon', 'TipLightIcon',
  'HomeIcon', 'CollapseIcon', 'ExpandIcon', 'PlusIcon', 'MinusIcon', 'TeacherIcon', 'LightModeIcon',
  'DarkModeIcon', 'SearchIcon', 'BookmarkIcon', 'ShareIcon',
  'ActionsIcon', 'CloseIcon', 'BackIcon',
] as const;

// CollapseIcon/ExpandIcon aren't referenced anywhere in the app yet — new
// in this Figma set, included here anyway for reference.
export const Gallery: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24, maxWidth: 640 }}>
      {ICON_NAMES.map((name) => {
        const IconComponent = (Icons as any)[name];
        return (
          <View key={name} style={{ alignItems: 'center', width: 88, gap: 8 }}>
            <View style={{ height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent color={Colors.ink100} />
            </View>
            <Text style={{ fontSize: 11, textAlign: 'center', color: Colors.ink200 }}>{name}</Text>
          </View>
        );
      })}
    </View>
  ),
};
