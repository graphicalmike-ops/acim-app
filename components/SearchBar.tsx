// Search bar — Figma component set "Search bar" (node 511:1367).
// "Default" (search icon, tap to submit) vs "Searched" (close icon, tap to
// clear) — driven by whether the currently submitted query matches what's
// in the field, not just by whether the field has text.

import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { SearchIcon, CloseIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';
import { Radius, BorderWidth, Spacing } from '@/constants/Tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  searched?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
};

// The bar's box is always white (Figma: primary-button-bg, same value in both
// themes — see constants/Colors.ts) even in dark mode, so its text/icon/border
// colors are fixed to their light-mode equivalents here rather than pulled
// from useThemeColors(), which would otherwise flip them to dark-mode-on-dark-
// background colors (near-invisible against this always-white box).
export function SearchBar({ value, onChangeText, onSubmit, onClear, searched, placeholder = 'Buscar', autoFocus }: Props) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.neutral100, borderColor: Colors.brand400 }]}>
      <TextInput
        style={[styles.input, { color: Colors.ink100 }]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={Colors.ink200}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {/* Fixed to the same footprint in both states — a larger touch target
          (via hitSlop, not a bigger box) keeps the bar's height constant when
          swapping icons. A bigger *layout* box here previously made the whole
          bar grow on focus, since the row has no fixed height. The box is
          sized bigger than the 20px icon so the circular ripple clip doesn't
          cut into the icon's corners. */}
      {searched ? (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={handleClear}
        >
          {({ pressed }) => <CloseIcon size={12} color={pressed ? Colors.ink200 : Colors.ink100} />}
        </RipplePressable>
      ) : (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={onSubmit}
        >
          {({ pressed }) => <SearchIcon size={20} color={pressed ? Colors.ink200 : Colors.ink100} />}
        </RipplePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: BorderWidth.md,
    borderRadius: Radius.lg,
    paddingLeft: Spacing[12],
    paddingRight: Spacing[10],
    paddingVertical: Spacing[10],
    gap: Spacing[24],
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSans_500Medium',
    fontSize: 16,
    padding: Spacing.none,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
