// Figma: node 711:2579, component set "Modal card" (file w4OSlFQqdU4zdzNKvoj8tD),
// variants Mode=Light / Mode=Dark. The design is a generic two-button
// confirm/cancel dialog (title + body copy + Cancelar/Eliminar), so this is
// named for what it actually is — a confirm dialog — rather than the more
// generic Figma component-set name. Sample copy in the design ("¿Eliminar
// verso guardado?" / "Esta acción no se puede deshacer.") reads like a
// delete-bookmark confirmation, but nothing in the app currently shows a
// confirm step before deleting a saved verse (app/bookmarks.tsx and
// app/reader.tsx's handleDeleteBookmark call deleteBookmark directly, no
// Alert.alert stand-in) — wiring one in would be a behavior change beyond
// "build the component," so this is left unwired. Built on top of the RNR
// alert-dialog primitive (@rn-primitives/alert-dialog, pulled via
// `npx @react-native-reusables/cli add alert-dialog` into
// components/ui/alert-dialog.tsx) rather than shadcn's pre-styled
// AlertDialogContent/Header/Footer/Title/Description/Action/Cancel — those
// bake in shadcn defaults (bg-background, rounded-lg, p-6 border, etc.) that
// don't match this card's look closely enough to override cleanly, so this
// file talks to the unstyled @rn-primitives/alert-dialog primitives directly
// and only reuses AlertDialogOverlay/AlertDialogPortal (generic backdrop +
// portal plumbing, no Figma-specific styling baked in).
//
// Values below are raw (components/ is exempt from the app/ token-only
// rule), cross-referenced to constants/Colors.ts and constants/Tokens.ts
// where they match:
//   card bg      #EDE6E1 light / #302C59 dark  = Colors.brand200 / Colors.dark200
//   title text   #333333 light / #F7F4F2 dark  = Colors.ink100 / Colors.brand100
//   body text    #666666 light / #F0E6DF dark  = Colors.ink200 / Colors.brand300
//   card radius  20                            = Radius.xl
//   button radius 12                           = Radius.lg
//   card padding 24 / gap 24 / gap 8 / gap 12   = Spacing[24] / Spacing[24] / Spacing[8] / Spacing[12]
// Button box styling (fill/border, both light & dark) is copied from the
// `toolDrawer` variant in components/ui/button.tsx, which is the exact
// Figma "Type=Tool drawer" button instance used inside this modal —
// duplicated by hand rather than composed via <Button asChild> because
// Button doesn't forward a ref, so @rn-primitives' Slot can't merge the
// AlertDialog Cancel/Action press handler onto it. If toolDrawer's box
// styling changes in button.tsx, mirror the change here too. Pressed-state
// FILL is a RipplePressable ripple now (like toolDrawer itself, 2026-08-06),
// wrapped via Cancel/Action's own `asChild` (which — unlike Button — these
// two primitives support, so RipplePressable's ref forwarding works fine
// here even though it wouldn't through Button).
// Card shadow matches Tokens.Shadows.menu (constants/Tokens.ts) exactly —
// shared with components/UIMenu.tsx's popup, both drop down over their
// backdrop/trigger. (Previously approximated via Tailwind's `shadow-sm`
// preset; switched to the exact arbitrary-value class once `menu` existed
// as a defined token to match precisely instead.)
// Body-text weight is Noto Sans Regular (400) — tailwind.config.js only
// defines `font-sans` (500 Medium) and `font-sans-bold` (700 Bold) font
// families, no regular-weight one, so the description text sets fontFamily
// via inline style, same as components/HeroLogo.tsx does for a one-off font.

import { AlertDialogOverlay, AlertDialogPortal } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { RipplePressable } from '@/components/RipplePressable';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/utils/theme';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import * as React from 'react';
import { Text, View } from 'react-native';

const ConfirmDialog = AlertDialogPrimitive.Root;
const ConfirmDialogTrigger = AlertDialogPrimitive.Trigger;

// Shared box styling for both buttons — mirrors components/ui/button.tsx's
// `toolDrawer` variant + its size="md" compound variant exactly. Pressed
// FILL comes from RipplePressable's rippleColor prop at the call site now,
// not a class here — only the border's press color stays a class (ripples
// can't animate a border). overflow-hidden clips the ripple to rounded-xl.
const dialogButtonClass =
  'group flex-1 shrink-0 flex-row items-center justify-center overflow-hidden rounded-xl border border-[#DED5CE] bg-white px-4 py-3 shadow-none dark:border-[#F7F4F2] dark:bg-transparent dark:active:border-[#A6875B]';

// Matches toolDrawer's own RIPPLE_COLORS entry in components/ui/button.tsx.
const dialogRippleColor = { light: Colors.brand400, dark: Colors.gold100 };

type ConfirmDialogContentProps = {
  /** Bold title line, e.g. "¿Eliminar verso guardado?" */
  title: string;
  /** Optional regular-weight body line, e.g. "Esta acción no se puede deshacer." */
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** Called after the dialog closes when Cancelar is pressed. */
  onCancel?: () => void;
  /** Called after the dialog closes when the confirm button is pressed. */
  onConfirm: () => void;
  /**
   * Confirm-button text color: destructive (Ink 300 / Gold 300, matches the
   * Figma "Eliminar" sample) or neutral (same color as Cancelar). Figma only
   * shows the destructive case — default true matches the design as-is.
   */
  destructive?: boolean;
  portalHost?: string;
};

function ConfirmDialogContent({
  title,
  description,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Eliminar',
  onCancel,
  onConfirm,
  destructive = true,
  portalHost,
}: ConfirmDialogContentProps) {
  const { isDark } = useTheme();
  const rippleColor = isDark ? dialogRippleColor.dark : dialogRippleColor.light;

  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <AlertDialogPrimitive.Content
          // Card itself is a plain View, so without this a tap anywhere
          // inside it (title text, padding — not just the buttons, which
          // already capture their own touches via RipplePressable) would
          // bubble up to AlertDialogOverlay's new tap-to-close and dismiss
          // the dialog. Claims the responder first so only taps that land
          // outside the card (on the backdrop itself) reach it.
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          className={cn(
            // Figma: 320 wide, padding/24, gap/24, radius/xl (20), Brand 200 / Dark 200 bg.
            // Shadow matches Tokens.Shadows.menu exactly (constants/Tokens.ts)
            // — spelled out literally since NativeWind needs the class string
            // itself statically written out, not a JS value plugged in at
            // runtime.
            'flex w-[320px] max-w-full flex-col gap-6 rounded-[20px] bg-[#EDE6E1] p-6',
            'shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] dark:bg-[#302C59]'
          )}>
          <View className="flex flex-col gap-2">
            <Text className="text-center font-sans-bold text-base leading-[22px] text-[#333333] dark:text-[#F7F4F2]">
              {title}
            </Text>
            {description ? (
              <Text
                style={{ fontFamily: 'NotoSans_400Regular' }}
                className="text-center text-sm leading-[19px] text-[#666666] dark:text-[#F0E6DF]">
                {description}
              </Text>
            ) : null}
          </View>
          <View className="flex flex-row gap-3">
            <AlertDialogPrimitive.Cancel asChild onPress={onCancel}>
              <RipplePressable className={dialogButtonClass} rippleColor={rippleColor}>
                <Text className="font-sans text-sm leading-[19px] text-[#333333] dark:text-white dark:group-active:text-[#F7F4F2]">
                  {cancelLabel}
                </Text>
              </RipplePressable>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild onPress={onConfirm}>
              <RipplePressable className={dialogButtonClass} rippleColor={rippleColor}>
                <Text
                  className={cn(
                    'font-sans text-sm leading-[19px]',
                    destructive
                      ? 'text-[#803300] group-active:text-white dark:text-[#B27E36] dark:group-active:text-white'
                      : 'text-[#333333] dark:text-white'
                  )}>
                  {confirmLabel}
                </Text>
              </RipplePressable>
            </AlertDialogPrimitive.Action>
          </View>
        </AlertDialogPrimitive.Content>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
}

export { ConfirmDialog, ConfirmDialogContent, ConfirmDialogTrigger };
export type { ConfirmDialogContentProps };
