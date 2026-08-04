import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/utils/theme';
import { UIFonts } from '@/constants/Typography';
import { Spacing } from '@/constants/Tokens';

type Props = {
  label: string;
};

// The caps, bold, gray "book name" heading used to group content by book —
// shared by the Index (contents.tsx), Search results, and Guardados
// (bookmarks) lists so a future style change only needs to happen here.
export function BookSectionHeading({ label }: Props) {
  const t = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: t.backgroundColor }]}>
      <Text style={[styles.label, { color: t.fontColorGray }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing[32],
    paddingBottom: Spacing[12],
    paddingHorizontal: Spacing[24],
  },
  label: UIFonts.capsBodyXsSemibold,
});
