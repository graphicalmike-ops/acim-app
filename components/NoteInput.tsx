import { TextInput, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { PlusIcon } from '@/components/Icons';
import { RipplePressable } from '@/components/RipplePressable';
import { Radius, BorderWidth, Spacing } from '@/constants/Tokens';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
};

// Box is always white regardless of theme, same rationale as SearchBar.
export function NoteInput({ value, onChangeText, onSubmit, placeholder = 'Ingresa una nota', autoFocus }: Props) {
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
        returnKeyType="done"
        multiline
        submitBehavior="blurAndSubmit"
        textAlignVertical="center"
      />
      {value.length > 0 && (
        <RipplePressable
          style={styles.iconWrap}
          hitSlop={10}
          centered
          instant
          rippleColor={Colors.primaryButtonPressed}
          onPress={onSubmit}
        >
          {({ pressed }) => <PlusIcon size={32} glyphSize={16} color={pressed ? Colors.ink200 : Colors.ink100} />}
        </RipplePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    minHeight: 32,
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
