import { StyleProp, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BookmarkIcon, ShareIcon } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import { Text as ButtonText } from '@/components/ui/text';
import { useTheme } from '@/utils/theme';

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

// Icon color now follows the theme (Ink 100 light / white dark), matching
// the toolDrawer button's own text color — previously fixed at Ink 100 in
// both modes, which read as invisible against the dark-mode box's
// transparent/dark background (see components/ui/button.tsx's toolDrawer
// gap note).
export function ReaderToolButton({ variant, onPress, style }: Props) {
  const { isDark } = useTheme();
  const Icon = variant === 'save' ? BookmarkIcon : ShareIcon;

  return (
    <Button variant="toolDrawer" style={style} onPress={onPress}>
      <Icon size={16} color={isDark ? Colors.neutral100 : Colors.ink100} />
      <ButtonText>{LABELS[variant]}</ButtonText>
    </Button>
  );
}
