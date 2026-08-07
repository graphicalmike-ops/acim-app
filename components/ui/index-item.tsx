import * as AccordionPrimitive from '@rn-primitives/accordion';
import { Text, View } from 'react-native';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { RipplePressable } from '@/components/RipplePressable';
import { ExpandIcon, CollapseIcon } from '@/components/Icons';
import { useTheme } from '@/utils/theme';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderWidth } from '@/constants/Tokens';
import { UIFonts } from '@/constants/Typography';

// Pulled from Figma node 669:2313 (file w4OSlFQqdU4zdzNKvoj8tD), component
// set "Index-items" — variants State(Default/Pressed) x Type(Title-L1, Item,
// Accordion, Accordion-item) x Mode(Light/Dark). Wired into app/contents.tsx
// (Item/Accordion/Accordion-item) and app/search.tsx + reader.tsx's save
// drawer (Title-L1). Figma's original Title-L1 variant (book titles, e.g.
// "LIBRO DE TEORÍA") was dropped — those render via each screen's NavBar
// instead — and the former Title-L2 variant was renamed to Title-L1.
//
// Figma's "Pressed" state is this app's ripple-splash color (RipplePressable
// already renders that as a transient overlay), not a persistent background
// swap — so each row here needs only one resting background, with the
// "Pressed" color passed as `rippleColor`.

function useRowColors(elevated: boolean) {
  const { isDark } = useTheme();
  const restBg = isDark ? Colors.dark100 : Colors.brand100;
  const elevatedBg = isDark ? Colors.dark200 : Colors.brand200;
  return {
    isDark,
    backgroundColor: elevated ? elevatedBg : restBg,
    rippleColor: elevated ? restBg : elevatedBg,
    labelColor: isDark ? Colors.brand100 : Colors.ink100,
    subtitleColor: isDark ? Colors.brand300 : Colors.ink200,
    dividerColor: isDark ? Colors.neutral300 : Colors.brand400,
  };
}

type TitleRowProps = { label: string; paddingTop: number; font: (typeof UIFonts)[keyof typeof UIFonts] } & React.ComponentProps<typeof View>;

function TitleRow({ label, paddingTop, font, style, ...rest }: TitleRowProps) {
  const { isDark } = useTheme();
  const color = isDark ? Colors.brand100 : Colors.ink200;
  const bg = isDark ? Colors.dark100 : Colors.brand100;
  return (
    <View
      style={[{ backgroundColor: bg, paddingTop, paddingRight: Spacing[24], paddingBottom: Spacing[12], paddingLeft: Spacing[24], minHeight: 48 }, style]}
      {...rest}
    >
      <Text style={[font, { color }]}>{label}</Text>
    </View>
  );
}

// Type=Title-L1 — section heading (e.g. "Prefacio", "Guardados recientes").
// Replaces components/BookSectionHeading.tsx (contents.tsx, search.tsx) and
// the inline "Guardados recientes" header in reader.tsx's save/toolbar
// drawers — all former Title-L2-style headers in the app.
export function IndexTitleL1({ label, font = UIFonts.capsBodyXsSemibold, ...rest }: { label: string; font?: (typeof UIFonts)[keyof typeof UIFonts] } & React.ComponentProps<typeof View>) {
  return <TitleRow label={label} paddingTop={Spacing[32]} font={font} {...rest} />;
}

type IndexItemRowProps = {
  label: string;
  subtitle?: string;
  onPress?: () => void;
  // True for rows that sit inside an expanded accordion (Figma's
  // "Accordion-item", resting-elevated background) — false for standalone
  // rows (Figma's "Item", resting-plain background).
  elevated?: boolean;
  // 0 = base 24px left padding (Item / accordion header). Accordion
  // children start at 1 (Figma bakes in a +24px nested indent for them);
  // pass higher for deeper nested sections (see contents.tsx's
  // getChildIndentLevel for how the app currently derives this from the
  // content id).
  indentLevel?: number;
  showDivider?: boolean;
};

// Type=Item (elevated=false) and Type=Accordion-item (elevated=true) share
// this same row shell in Figma — only the resting background differs.
export function IndexItemRow({ label, subtitle, onPress, elevated = false, indentLevel = 0, showDivider = true }: IndexItemRowProps) {
  const { backgroundColor, rippleColor, labelColor, subtitleColor, dividerColor } = useRowColors(elevated);
  const paddingLeft = Spacing[24] * (indentLevel + 1);

  return (
    <RipplePressable
      onPress={onPress}
      rippleColor={rippleColor}
      style={{ backgroundColor, paddingRight: Spacing[24], paddingLeft, minHeight: 48, overflow: 'hidden' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: Spacing[12], paddingBottom: Spacing[12] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1, gap: Spacing[2] }}>
            <Text style={[UIFonts.bodyXsMedium, { color: labelColor }]}>{label}</Text>
            {subtitle ? <Text style={[UIFonts.body2xsRegular, { color: subtitleColor }]}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
      {showDivider ? <View style={{ height: BorderWidth.sm, backgroundColor: dividerColor }} /> : null}
    </RipplePressable>
  );
}

// Header for Type=Accordion — must render inside an AccordionItem to reach
// AccordionPrimitive.useItemContext() for expanded state.
function AccordionHeaderRow({ label, subtitle }: { label: string; subtitle?: string }) {
  const { isExpanded } = AccordionPrimitive.useItemContext();
  const { backgroundColor, rippleColor, labelColor, subtitleColor, dividerColor } = useRowColors(isExpanded);

  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger asChild>
        <RipplePressable
          rippleColor={rippleColor}
          style={{ backgroundColor, paddingRight: Spacing[24], paddingLeft: Spacing[24], minHeight: 48, overflow: 'hidden' }}
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingTop: Spacing[12], paddingBottom: Spacing[12] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ flex: 1, gap: Spacing[2] }}>
                <Text style={[UIFonts.bodyXsMedium, { color: labelColor }]}>{label}</Text>
                {subtitle ? <Text style={[UIFonts.body2xsRegular, { color: subtitleColor }]}>{subtitle}</Text> : null}
              </View>
              <View style={{ paddingRight: Spacing[12] }}>
                {isExpanded ? <CollapseIcon size={12} color={labelColor} /> : <ExpandIcon size={12} color={labelColor} />}
              </View>
            </View>
          </View>
          <View style={{ height: BorderWidth.sm, backgroundColor: dividerColor }} />
        </RipplePressable>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export type IndexAccordionChild = {
  id: string;
  label: string;
  subtitle?: string;
  indentLevel?: number;
  onPress?: () => void;
};

type IndexAccordionItemProps = {
  value: string;
  label: string;
  subtitle?: string;
  children: IndexAccordionChild[];
} & Omit<React.ComponentProps<typeof AccordionItem>, 'value' | 'children'>;

// Type=Accordion + Type=Accordion-item together — an expandable header row
// (built on RNR's Accordion primitive) plus its child rows. Must be rendered
// inside an <IndexAccordionGroup>. Extra props (e.g. `onLayout`, to track
// this item's position for scroll-preserving open/close — see
// contents.tsx) are forwarded to the underlying AccordionItem.
export function IndexAccordionItem({ value, label, subtitle, children, className, ...rest }: IndexAccordionItemProps) {
  return (
    <AccordionItem value={value} className={className ? `border-b-0 ${className}` : 'border-b-0'} {...rest}>
      <AccordionHeaderRow label={label} subtitle={subtitle} />
      <AccordionContent className="p-0">
        {children.map((child) => (
          <IndexItemRow
            key={child.id}
            label={child.label}
            subtitle={child.subtitle}
            elevated
            indentLevel={(child.indentLevel ?? 0) + 1}
            onPress={child.onPress}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  );
}

// Thin wrapper around RNR's Accordion root, defaulted to single-open +
// collapsible (matches contents.tsx's current one-open-accordion-at-a-time
// behavior). Wrap one or more <IndexAccordionItem>s in this.
export function IndexAccordionGroup({ children, ...props }: Omit<React.ComponentProps<typeof Accordion>, 'type' | 'collapsible'>) {
  return (
    <Accordion type="single" collapsible {...props}>
      {children}
    </Accordion>
  );
}
