---
name: SwissTool Alpine Mint
colors:
  surface: '#f7fbf0'
  surface-dim: '#d7dbd2'
  surface-bright: '#f7fbf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5eb'
  surface-container: '#ebefe5'
  surface-container-high: '#e5eadf'
  surface-container-highest: '#e0e4da'
  on-surface: '#181d17'
  on-surface-variant: '#40493d'
  inverse-surface: '#2d322b'
  inverse-on-surface: '#eef2e8'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#556158'
  on-secondary: '#ffffff'
  secondary-container: '#d9e6da'
  on-secondary-container: '#5b675e'
  tertiary: '#1d622b'
  on-tertiary: '#ffffff'
  tertiary-container: '#387b41'
  on-tertiary-container: '#c7ffc5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#d9e6da'
  secondary-fixed-dim: '#bdcabe'
  on-secondary-fixed: '#131e17'
  on-secondary-fixed-variant: '#3e4a41'
  tertiary-fixed: '#abf4ac'
  tertiary-fixed-dim: '#90d792'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#07521d'
  background: '#f7fbf0'
  on-background: '#181d17'
  surface-variant: '#e0e4da'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 40px
  gutter: 24px
---

## Brand & Style
The design system is rooted in the principles of Swiss Design: precision, legibility, and objectivity. It targets professionals who value efficiency and high-grade utility. The aesthetic is a refined take on **Minimalism**, prioritizing content through generous whitespace and a rigid underlying grid.

The emotional response should be one of "quiet confidence"—a tool that is reliable, surgically precise, and refreshing to use. By blending functionalism with a crisp, botanical-inspired color palette, the UI feels both high-tech and grounded in the clarity of the Alpine environment.

## Colors
The palette utilizes high-utility greens to represent growth and precision against a clean, "Mint White" backdrop. 

- **Primary (Deep Green):** Reserved for core actions, branding, and high-priority status indicators.
- **Secondary (Mint White):** Used for large surface areas to provide a bright, airy feel without the harshness of pure white.
- **Accent (Soft Green):** Used for hover states, progress bars, and secondary visual interest.
- **Surface (Alpine Green Tint):** Provides subtle contrast for container backgrounds and grouped content.
- **Text (Slate Gray):** Ensures maximum legibility with a softer, more professional contrast than pure black.

## Typography
Hanken Grotesk is the sole typeface, chosen for its geometric clarity and contemporary feel. 

- **Hierarchy:** Use bold weights strictly for headlines and functional labels. 
- **Body Text:** Always use the Regular weight for long-form content to maintain the "Swiss" editorial look.
- **Labels:** Small labels and captions should use the SemiBold weight with increased letter spacing and uppercase styling to denote a "technical" specification feel.
- **Scale:** Maintain strict alignment to the baseline grid to ensure vertical rhythm across multi-column layouts.

## Layout & Spacing
This design system utilizes a **Fixed Grid** model for desktop to maintain structural integrity, transitioning to a fluid model for mobile devices.

- **Desktop (1440px+):** 12-column grid, 1120px max-width, 24px gutters.
- **Tablet (768px - 1439px):** 8-column fluid grid, 24px margins.
- **Mobile (Up to 767px):** 4-column fluid grid, 16px margins.

Spacing is strictly mathematical, based on a 4px baseline. Every margin and padding value must be a multiple of the base unit to ensure a "precision-engineered" appearance.

## Elevation & Depth
In keeping with the minimalist philosophy, depth is communicated through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Base):** Mint White (#E8F5E9) surface.
- **Level 1 (Cards/Containers):** Pure White (#FFFFFF) with a subtle 1px border in Alpine Green Tint (#F1F8E9).
- **Interactive Depth:** Only the highest priority elements (like primary Modals) receive a shadow. This shadow should be extremely diffused: `0px 4px 20px rgba(38, 50, 56, 0.05)`.
- **Active States:** Use inset borders or a 1px downward shift to simulate a physical mechanical press.

## Shapes
The shape language is "Soft" yet disciplined. While the overall feel is architectural and sharp, a 4px corner radius (`rounded-sm`) is applied to buttons and input fields to prevent the UI from feeling hostile or aggressive.

- **Standard Elements:** 4px (0.25rem) radius.
- **Large Containers:** 8px (0.5rem) radius for cards and modals.
- **Icons:** Use linear, 2px stroke icons with square caps to match the typography's precision.

## Components
- **Buttons:** Primary buttons use Deep Green background with white text. Secondary buttons use a Deep Green 1px border with transparent background. No gradients.
- **Input Fields:** 1px Slate Gray border (30% opacity). On focus, border changes to Deep Green 2px. Labels sit strictly above the field in Label-MD style.
- **Chips/Tags:** Use Alpine Green Tint background with Deep Green text. Corners remain at 4px (not pill-shaped) to maintain the professional aesthetic.
- **Cards:** No shadows. Use 1px borders in Alpine Green Tint. Header sections should be separated by a subtle horizontal rule.
- **Lists:** High-density layout. Use 1px dividers between items. Icons in lists should always be Deep Green or Slate Gray to avoid visual clutter.
- **Data Tables:** A core component for this system. Use Zebra striping with Alpine Green Tint on even rows. Header row should be Slate Gray with White text.