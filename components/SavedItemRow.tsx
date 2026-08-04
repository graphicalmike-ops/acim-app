import { View, Text, StyleSheet, Share, ToastAndroid, Platform } from 'react-native';
import { MenuView } from '@react-native-menu/menu';
import { RipplePressable } from '@/components/RipplePressable';
import { TertiaryButton } from '@/components/TertiaryButton';
import { ActionsIcon } from '@/components/Icons';
import { useThemeColors } from '@/utils/theme';
import { useBookmarks, SavedBookmark } from '@/utils/bookmarks';
import { getVersesText } from '@/utils/content';
import { UIFonts } from '@/constants/Typography';
import { Spacing } from '@/constants/Tokens';

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatSavedDate(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_ES[date.getMonth()];
  return `${day} ${month} ${date.getFullYear()}`;
}

type Props = {
  item: SavedBookmark;
  onPress: () => void;
};

export function SavedItemRow({ item, onPress }: Props) {
  const t = useThemeColors();
  const { deleteBookmark } = useBookmarks();

  const handleShare = () => {
    const verseText = getVersesText(item.bookId, item.anchor, item.paragraph, item.verses ?? []);
    const message = verseText ? `${verseText}\n\n${item.notation}` : `${item.notation} — ${item.note}`;
    Share.share({ message });
  };

  const handleDelete = () => {
    deleteBookmark(item.id);
    if (Platform.OS === 'android') ToastAndroid.show('Eliminado', ToastAndroid.SHORT);
  };

  return (
    <RipplePressable style={styles.item} rippleColor={t.darkerBackgroundColor} onPress={onPress}>
      {() => (
        <>
          <View style={styles.itemRow}>
            <View style={styles.itemText}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemDate, { color: t.fontColorPrimary }]}>{formatSavedDate(item.date)}</Text>
                <Text style={[styles.itemLabel, { color: t.fontColorPrimary }]}>
                  {item.name ? `${item.notation} - ${item.name}` : item.notation}
                </Text>
              </View>
              <Text style={[styles.itemSubtitle, { color: t.fontColorGray }]}>{item.note}</Text>
            </View>
            {/* Captures the touch responder before the row's own RipplePressable can, so
                opening the menu never also fires the row's onPress (navigate/close). */}
            <View onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
              <MenuView
                onPressAction={({ nativeEvent }) => {
                  if (nativeEvent.event === 'share') handleShare();
                  else if (nativeEvent.event === 'delete') handleDelete();
                }}
                actions={[
                  { id: 'share', title: 'Compartir' },
                  { id: 'delete', title: 'Eliminar', attributes: { destructive: true } },
                ]}
              >
                <TertiaryButton hitSize={40} rippleColor={t.darkerBackgroundColor}>
                  {(pressed) => <ActionsIcon size={16} color={pressed ? t.pressedIconColor : t.fontColorPrimary} />}
                </TertiaryButton>
              </MenuView>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: t.darkOutline }]} />
        </>
      )}
    </RipplePressable>
  );
}

const styles = StyleSheet.create({
  item: {
    overflow: 'hidden',
    paddingLeft: Spacing[24],
    paddingRight: Spacing[24],
    paddingTop: 14,
    gap: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  divider: {
    height: 2,
  },
  itemText: {
    flex: 1,
    gap: Spacing[2],
  },
  itemHeader: {
    gap: Spacing[2],
  },
  itemLabel: {
    fontFamily: UIFonts.bodyXsRegular.fontFamily,
    fontSize: UIFonts.bodyXsRegular.fontSize,
  },
  itemSubtitle: {
    fontFamily: UIFonts.body2xsRegular.fontFamily,
    fontSize: UIFonts.body2xsRegular.fontSize,
  },
  itemDate: {
    fontFamily: UIFonts.body3xsRegular.fontFamily,
    fontSize: UIFonts.body3xsRegular.fontSize,
  },
});
