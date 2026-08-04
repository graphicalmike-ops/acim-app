import type { Meta, StoryObj } from '@storybook/react-vite';
import { View } from 'react-native';
import { TertiaryButton } from './TertiaryButton';
import { BackIcon, ActionsIcon, TipLightIcon } from './Icons';
import { Colors } from '@/constants/Colors';

const meta: Meta<typeof TertiaryButton> = {
  title: 'components/TertiaryButton',
  component: TertiaryButton,
};
export default meta;

type Story = StoryObj<typeof TertiaryButton>;

// Every real call site in the app uses hitSize={40} with a custom icon via
// the children render-prop — the component's own size="md"/"lg" presets go
// unused in practice.
export const NavIcon: Story = {
  render: () => (
    <TertiaryButton hitSize={40} onPress={() => {}}>
      {(pressed) => <BackIcon size={16} color={pressed ? Colors.gold100 : Colors.ink100} />}
    </TertiaryButton>
  ),
};

export const OverflowMenu: Story = {
  render: () => (
    <TertiaryButton hitSize={40} rippleColor={Colors.brand100} onPress={() => {}}>
      {(pressed) => <ActionsIcon size={16} color={pressed ? Colors.gold100 : Colors.ink100} />}
    </TertiaryButton>
  ),
};

// Built-in fallback glyphs — unused by any real call site (every one passes
// its own icon), shown here for completeness.
export const DefaultMdGlyph: Story = {
  render: () => <TertiaryButton onPress={() => {}} />,
};

export const DefaultLgGlyph: Story = {
  render: () => <TertiaryButton size="lg" onPress={() => {}} />,
};

export const AllSizes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
      <TertiaryButton hitSize={32} onPress={() => {}}>
        {() => <TipLightIcon size={16} />}
      </TertiaryButton>
      <TertiaryButton hitSize={40} onPress={() => {}}>
        {() => <TipLightIcon size={20} />}
      </TertiaryButton>
      <TertiaryButton hitSize={48} onPress={() => {}}>
        {() => <TipLightIcon size={24} />}
      </TertiaryButton>
    </View>
  ),
};
