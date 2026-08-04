import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

// CUSTOMIZED — do not re-run `npx @react-native-reusables/cli add button` on
// this file. It will overwrite these changes with zero merging: `destructive`
// variant removed (no app color backs it), `size.default` renamed to
// `size.md`. If a future RNR release fixes something here, port that one
// fix in by hand instead of re-pulling the whole file.
//
// mainHero / mainHome / toolDrawer variants below mirror Figma node 648:5754
// (file w4OSlFQqdU4zdzNKvoj8tD), component set "Button" (Type × State × Mode).
// Colors are raw hex, not Tailwind tokens — Tailwind has no brand/ink/gold
// scale yet (see tailwind.config.js), and components/ is exempt from the
// token-only rule in AGENTS.md. Each hex mirrors a constants/Colors.ts entry
// 1:1 (noted inline) — if that palette changes, update these to match.
// Tailwind's `rounded-xl` (12px) = our Radius.lg; `rounded-md` (6px) =
// Radius.md — naming doesn't line up between the two scales, just the pixel
// value. Press/dark states use NativeWind's `active:`/`dark:` pseudo-classes
// (same pattern as the `outline`/`secondary` variants above), driven by the
// app's manual isDark → colorScheme.set() bridge in utils/theme.tsx — no
// separate "pressed" prop needed. compoundVariants below only cover
// size="md" (the default) since that's the only size these three are used
// at; add more entries if a caller ever needs mainHero/mainHome/toolDrawer
// at another size.

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-primary/90' })
        ),
        outline: cn(
          'border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50',
          })
        ),
        secondary: cn(
          'bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-secondary/80' })
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        link: '',

        // Type=Main Hero — "Comienza el Curso" / "Sigue leyendo" on Home.
        // Default: transparent, Brand 100 border, same in light & dark.
        // Pressed: Brand 200 fill / Brand 400 border in light; Gold 100 fill
        // (border unchanged) in dark.
        mainHero: 'border border-[#F7F4F2] bg-transparent active:bg-[#EDE6E1] active:border-[#DED5CE] dark:active:bg-[#A6875B] dark:active:border-[#F7F4F2]',

        // Type=Main Home — the book-section buttons on Home.
        // Default: white fill, Brand 400 border, subtle shadow. Dark: Dark 200
        // fill (overridden from Figma's Dark 100 per product decision), Brand
        // 100 border. Pressed: Brand 200 fill (light) / Gold 100 fill (dark)
        // — border unchanged in both.
        mainHome: 'border border-[#DED5CE] bg-white shadow-sm shadow-black/10 active:bg-[#EDE6E1] dark:bg-[#302C59] dark:border-[#F7F4F2] dark:active:bg-[#A6875B]',

        // Type=Tool drawer — save/share buttons in the reader tool drawer.
        // Same in light & dark per Figma (no dark-mode variants defined
        // there yet). Pressed: Brand 400 fill (border already Brand 400).
        toolDrawer: 'border border-[#DED5CE] bg-white active:bg-[#DED5CE]',
      },
      size: {
        md: cn('h-10 px-4 py-2 sm:h-9', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-9 gap-1.5 rounded-md px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-11 rounded-md px-6 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-10 w-10 sm:h-9 sm:w-9',
      },
    },
    compoundVariants: [
      // Figma: padding vertical/8, no horizontal padding, radius/lg (12px).
      { variant: 'mainHero', size: 'md', class: 'h-auto rounded-xl gap-1.5 px-0 py-2' },
      // Figma says radius/md (6px), but overridden to radius/lg (12px) per
      // product decision. Padding 32/12, left padding overridden to 20px,
      // content left-aligned (not centered — Figma's own Main Home
      // component uses primaryAxisAlignItems: MIN). icon-label gap
      // overridden to 12px (Figma says itemSpacing/6).
      // px-0 first: tailwind-merge doesn't strip an earlier px-4 (from
      // size="md") when only pl-*/pr-* follow it — only a later px-*
      // clears an earlier pl-*/pr-*, not the reverse — so without this
      // both classes land in the output and NativeWind picks one
      // unpredictably. Zeroing px first leaves nothing to conflict with.
      // has-[>svg]:px-* repeated for the same reason: size="md" also
      // carries a web-only `has-[>svg]:px-3` (real browser :has() rule,
      // shrinks padding whenever the button contains an <svg> — true for
      // every variant here, they all render an icon) that beats plain
      // px-0/pl-5/pr-8 in the browser regardless of class-string order,
      // since it's a different variant/selector twMerge won't reconcile
      // against a plain class — only a matching has-[>svg]: prefix does.
      { variant: 'mainHome', size: 'md', class: 'h-auto rounded-xl gap-3 px-0 pl-5 pr-8 py-3 justify-start has-[>svg]:px-0 has-[>svg]:pl-5 has-[>svg]:pr-8' },
      // Figma: padding 16/12, radius/lg (12px).
      { variant: 'toolDrawer', size: 'md', class: 'h-auto rounded-xl gap-1.5 px-4 py-3 has-[>svg]:px-4' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),

        // font-sans = NotoSans_500Medium (see tailwind.config.js) — matches
        // the Medium weight on all three Figma button types.
        mainHero: 'font-sans text-sm leading-[19px] text-[#F7F4F2] group-active:text-[#333333] dark:group-active:text-[#F7F4F2]',
        mainHome: 'font-sans text-base leading-[22px] text-[#333333] dark:text-[#F7F4F2]',
        toolDrawer: 'font-sans text-sm leading-[19px] text-[#333333]',
      },
      size: {
        md: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
