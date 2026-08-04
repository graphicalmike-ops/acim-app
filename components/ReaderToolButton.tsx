import { StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BookmarkIcon, ShareIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import { Text as ButtonText } from '@/components/ui/text';

type Variant = 'save' | 'share';

type Props = {
  variant: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const LABELS: Record<Variant, string> = {
  save: 'Guardar',
  share: 'Compartir',
};

// Icon color is fixed (Ink 100) rather than pulled from the app's theme —
// Figma's Tool drawer button has no dark-mode variant, box stays white and
// text/icon stay Ink 100 regardless of isDark, same rationale as
// NoteInput/SearchBar.
export function ReaderToolButton({ variant, onPress, style }: Props) {
  const Icon = variant === 'save' ? BookmarkIcon : ShareIcon;

  return (
    <Button variant="toolDrawer" style={style} onPress={onPress}>
      <Icon size={16} color={Colors.ink100} />
      <ButtonText>{LABELS[variant]}</ButtonText>
    </Button>
  );
}
