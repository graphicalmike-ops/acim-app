import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { Portal } from '@rn-primitives/portal';
import { IconButton } from '@/components/ui/icon-button';
import { ActionsIcon } from '@/components/Icons';
import { Spacing, BorderWidth } from '@/constants/Tokens';
import { cn } from '@/lib/utils';

// The "Compartir"/"Eliminar" dropdown menu opened from the ellipsis (⋮)
// button on saved-item rows — app/bookmarks.tsx and app/reader.tsx's
// recent-saves drawer + saved-verse sheet. A from-scratch popup: measures
// the trigger, positions a Portal'd View manually (flips above the trigger
// if there's no room below, clamps to screen edges).
//
// CONFIRMED ROOT CAUSE (2026-08, after 3 attempts): this component's first
// two incarnations — one built on @rn-primitives/dropdown-menu with
// hand-matched Figma styling, one a from-scratch Portal'd popup like this
// one but styled via plain `style`/`StyleSheet.create()` — both rendered
// on-device with no padding and square corners, for reasons never fully
// explained at the RN-internals level. Ruled out along the way: the
// dropdown-menu primitive itself (version 2 didn't use it either and still
// failed), the drop shadow/elevation (removed, no change), and Portal in
// general (ConfirmDialog — components/ui/alert-dialog.tsx + ConfirmDialog.tsx
// — goes through the same Portal/PortalHost plumbing and always rendered
// fine). The one remaining variable was styling mechanism: ConfirmDialog is
// styled entirely via NativeWind `className` (Tailwind arbitrary-value
// classes), never plain `style` objects. Switching this component to the
// same className-based approach (mirroring ConfirmDialog's exact class
// patterns/hex-value conventions below) fixed it — confirmed on-device.
// Conclusion: plain `style`/`StyleSheet.create()` on Portal-rendered,
// absolutely-positioned views was not reliably applying on this device/
// build; NativeWind `className` does. If a future component needs a custom
// Portal'd overlay, style it with `className`, not `style`.
//
// A native-OS-menu version (wrapping @react-native-menu/menu's MenuView)
// was tried in between versions 2 and 3 as a working fallback while this was
// unsolved — correctly padded/rounded (it's the OS's own chrome) but with
// no control over corner radius/padding/shadow/exact colors to match Figma.
// No longer used anywhere now that the real root cause is fixed; not kept
// in the repo.

export type UIMenuAction = {
  id: string;
  title: string;
  /** Figma: destructive item ("Eliminar") — Ink 300 (light) / Gold 300 (dark) text. */
  destructive?: boolean;
  onPress: () => void;
};

export type UIMenuProps = {
  actions: UIMenuAction[];
  /** Static color, or a pressed-aware function (site 3's icon swaps color while pressed). Omit to use IconButton's own solid-surface default. */
  iconColor?: string | ((pressed: boolean) => string);
  /** Menu horizontal alignment relative to the trigger. Every current call site's trigger sits at the row's right edge, so only "end" is exercised — "start"/"center" are supported but unverified. */
  align?: 'start' | 'end' | 'center';
};

const MENU_WIDTH = 150;
const ITEM_HEIGHT = 11 * 2 + 22; // paddingVertical*2 + Figma's 22px line-height
const EDGE_MARGIN = Spacing[8];

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

export function UIMenu({ actions, iconColor, align = 'end' }: UIMenuProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const portalName = React.useId();
  const triggerRef = useRef<View>(null);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const menuHeight = actions.length * ITEM_HEIGHT + (actions.length - 1) * BorderWidth.sm;
      const left = Math.min(
        Math.max(
          align === 'start' ? x : align === 'center' ? x + width / 2 - MENU_WIDTH / 2 : x + width - MENU_WIDTH,
          EDGE_MARGIN
        ),
        screenWidth - MENU_WIDTH - EDGE_MARGIN
      );
      // Opens below the trigger by default; flips above it if there isn't
      // room below (mirrors the collision-avoidance the dropdown-menu
      // primitive used to handle internally).
      const top = y + height + EDGE_MARGIN + menuHeight <= screenHeight
        ? y + height + EDGE_MARGIN
        : y - menuHeight - EDGE_MARGIN;
      setPosition({ top, left });
      setOpen(true);
    });
  }, [align, actions.length, screenWidth, screenHeight]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeMenu();
      return true;
    });
    return () => sub.remove();
  }, [open, closeMenu]);

  return (
    <>
      {/* Grabs the touch responder before the row's own RipplePressable can,
          so opening the menu never also fires the row's onPress (navigate
          away). */}
      <View onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
        <IconButton ref={triggerRef} icon={ActionsIcon} iconSize={16} surface="solid" color={iconColor} onPress={openMenu} />
      </View>

      {open && position && (
        <Portal name={`ui-menu-${portalName}`}>
          <FullWindowOverlay>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
            {/* 150 wide, radius/lg (12). Shadow matches Tokens.Shadows.menu
                exactly (constants/Tokens.ts) — spelled out here as a literal
                arbitrary-value class rather than referencing that constant,
                since NativeWind needs the class string itself statically
                written out to extract it, not a JS value plugged in at
                runtime. `top`/`left` stay inline `style` since they're
                computed at runtime from the trigger's measured position. */}
            <View
              className="absolute w-[150px] rounded-xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)]"
              style={{ top: position.top, left: position.left }}
            >
              <View className="overflow-hidden rounded-xl bg-[#EDE6E1] dark:bg-[#302C59]">
                {actions.map((action, index) => (
                  <React.Fragment key={action.id}>
                    {index > 0 && <View className="h-px bg-[#DED5CE] dark:bg-[#CCCCCC]" />}
                    <Pressable
                      onPress={() => {
                        closeMenu();
                        action.onPress();
                      }}
                      className="w-full px-4 py-[11px] active:bg-[#F7F4F2] dark:active:bg-[#A6875B]"
                    >
                      <Text
                        style={{ fontFamily: 'NotoSans_400Regular' }}
                        className={cn(
                          'text-base leading-[22px]',
                          action.destructive
                            ? 'text-[#803300] dark:text-[#B27E36]'
                            : 'text-[#333333] dark:text-[#F7F4F2]'
                        )}
                      >
                        {action.title}
                      </Text>
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </FullWindowOverlay>
        </Portal>
      )}
    </>
  );
}
