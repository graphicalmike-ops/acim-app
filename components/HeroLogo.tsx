import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Tokens';

const TITLE_FONT_SIZE = 38;
const STAR_SIZE = 58;

export function HeroLogo() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/Star.png')} style={styles.star} resizeMode="contain" />
      <Text allowFontScaling={false} style={styles.title}>Un Curso{'\n'}De Milagros</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[16],
  },
  star: {
    width: STAR_SIZE,
    height: STAR_SIZE,
  },
  title: {
    fontFamily: 'Lora_500Medium',
    fontSize: TITLE_FONT_SIZE,
    color: Colors.brand100,
    textAlign: 'center',
    letterSpacing: 2.28,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
