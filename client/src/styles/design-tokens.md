# Design Tokens

This document outlines the design tokens used in the MarketingOS application. All design decisions should follow these tokens to ensure consistency across the codebase.

## Color System

### Primary Colors (HSL)

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--primary` | 217 91% 60% | 217 91% 68% | Primary actions, links, brand color |
| `--primary-foreground` | 0 0% 100% | 0 0% 100% | Text on primary background |
| `--secondary` | 220 13% 91% | 220 17% 22% | Secondary elements, backgrounds |
| `--secondary-foreground` | 220 13% 18% | 210 20% 92% | Text on secondary background |
| `--accent` | 220 12% 90% | 262 83% 70% | Accent highlights |
| `--accent-foreground` | 220 13% 18% | 0 0% 100% | Text on accent background |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--destructive` | 0 84% 60% | 0 84% 60% | Error states, delete actions |
| `--destructive-foreground` | 0 0% 100% | 0 0% 100% | Text on destructive |
| `--muted` | 220 9% 93% | 220 17% 20% | Muted backgrounds |
| `--muted-foreground` | 220 13% 35% | 220 9% 58% | Secondary text, captions |
| `--success` | 142 71% 45% | 142 71% 58% | Success states |
| `--warning` | 38 92% 50% | 38 92% 65% | Warning states |
| `--info` | 199 89% 48% | 199 89% 65% | Info states |

### Chart Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--chart-1` | 217 91% 60% | 217 91% 70% | Charts, graphs |
| `--chart-2` | 25 95% 53% | 25 95% 65% | Charts, graphs |
| `--chart-3` | 142 71% 45% | 142 71% 58% | Charts, graphs |
| `--chart-4` | 38 92% 50% | 38 92% 65% | Charts, graphs |
| `--chart-5` | 199 89% 48% | 199 89% 65% | Charts, graphs |

### Neutral Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | 0 0% 98% | 222 47% 11% | Page background |
| `--foreground` | 220 13% 18% | 210 20% 92% | Primary text |
| `--border` | 220 13% 91% | 220 13% 15% | Borders |
| `--input` | 220 13% 75% | 220 13% 35% | Form inputs |
| `--ring` | 217 91% 60% | 217 91% 68% | Focus rings |

### Card Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--card` | 0 0% 100% | 217 33% 17% | Card background |
| `--card-foreground` | 220 13% 18% | 210 20% 92% | Card text |
| `--card-border` | 220 13% 94% | 220 10% 12% | Card borders |

### Popover Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--popover` | 0 0% 99% | 217 33% 17% | Popover background |
| `--popover-foreground` | 220 13% 18% | 210 20% 92% | Popover text |

### Sidebar Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--sidebar` | 220 13% 96% | 220 26% 14% | Sidebar background |
| `--sidebar-foreground` | 220 13% 18% | 210 20% 92% | Sidebar text |
| `--sidebar-border` | 220 13% 89% | 220 13% 20% | Sidebar borders |
| `--sidebar-primary` | 217 91% 60% | 217 91% 68% | Active sidebar items |
| `--sidebar-primary-foreground` | 0 0% 100% | 0 0% 100% | Active sidebar text |

### Premium Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--orange` | 25 95% 53% | Accent color |
| `--purple` | 250 70% 60% | Premium accent |
| `--pink` | 330 81% 60% | Highlight color |

## Spacing Scale

Base unit: 4px (0.25rem)

| Token | Value | px | Usage |
|-------|-------|----|-------|
| `--spacing-xs` | 0.25rem | 4px | Tight spacing |
| `--spacing-sm` | 0.5rem | 8px | Small spacing |
| `--spacing-md` | 0.75rem | 12px | Medium spacing |
| `--spacing-lg` | 1rem | 16px | Default spacing |
| `--spacing-xl` | 1.5rem | 24px | Large spacing |
| `--spacing-2xl` | 2rem | 32px | Extra large |
| `--spacing-3xl` | 3rem | 48px | Section spacing |
| `--spacing-4xl` | 4rem | 64px | Page section |

### Standard Spacing Patterns

```css
/* Page container padding */
--page-padding: 1rem sm:1.5rem lg:2rem xl:3rem;

/* Card internal padding */
--card-padding: 1.5rem;

/* Section gaps */
--section-gap: 1.5rem lg:2rem;

/* Element gaps */
--element-gap: 1rem;

/* Tight gaps */
--tight-gap: 0.5rem;
```

## Typography Scale

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system-ui | Primary font |
| `--font-serif` | Georgia | Serif accents |
| `--font-mono` | SF Mono, Consolas | Code, technical |

### Font Sizes

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `--text-xs` | 0.75rem | 1.5 | normal | Captions, metadata |
| `--text-sm` | 0.875rem | 1.5 | normal | Secondary text |
| `--text-base` | 1rem | 1.5 | normal | Body text |
| `--text-lg` | 1.125rem | 1.6 | normal | Large body text |
| `--text-xl` | 1.25rem | 1.4 | normal | Small headings |
| `--text-2xl` | 1.5rem | 1.3 | -0.01em | Card titles |
| `--text-3xl` | 1.875rem | 1.2 | -0.01em | Page headings |
| `--text-4xl` | 2.25rem | 1.1 | -0.02em | Hero titles |

### Extended Typography Classes

```css
.text-heading-xl { font-size: 2.25rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
.text-heading-lg { font-size: 1.875rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.01em; }
.text-heading-md { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
.text-heading-sm { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }
.text-body-lg { font-size: 1.125rem; line-height: 1.6; }
.text-body { font-size: 1rem; line-height: 1.5; }
.text-body-sm { font-size: 0.875rem; line-height: 1.5; }
.text-body-xs { font-size: 0.75rem; line-height: 1.5; }
```

## Border Radius

| Token | Value | px | Usage |
|-------|-------|----|-------|
| `--radius-sm` | 0.1875rem | 3px | Small elements, tags |
| `--radius-md` | 0.375rem | 6px | Buttons, inputs |
| `--radius-lg` | 0.5rem | 8px | Default buttons |
| `--radius-xl` | 0.5625rem | 9px | Cards, modals |
| `--radius-2xl` | 1rem | 16px | Large containers |
| `--radius-full` | 9999px | - | Pills, avatars |

### Standard Patterns

- Cards: `rounded-xl`
- Buttons: `rounded-lg` (default), `rounded-md` (small)
- Inputs: `rounded-md`
- Badges: `rounded-full`
- Modals: `rounded-xl`

## Shadows

### Light Mode Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-2xs` | 0px 1px 2px hsl(220 13% 18% / 0.05) | Subtle |
| `--shadow-xs` | 0px 1px 3px hsl(220 13% 18% / 0.08) | Small elements |
| `--shadow-sm` | 0px 2px 4px / 0.06, 0px 1px 2px / 0.04 | Cards, buttons |
| `--shadow` | 0px 4px 6px / 0.08, 0px 2px 4px / 0.05 | Default shadows |
| `--shadow-md` | 0px 6px 12px / 0.10, 0px 3px 7px / 0.07 | Elevated |
| `--shadow-lg` | 0px 10px 20px / 0.12, 0px 6px 12px / 0.08 | Popovers |
| `--shadow-xl` | 0px 20px 25px / 0.14, 0px 10px 15px / 0.10 | Modals |
| `--shadow-2xl` | 0px 25px 50px / 0.18 | Dropdowns |

### Dark Mode Shadows

Dark mode shadows use higher opacity for better contrast against dark backgrounds.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-2xs` | 0px 1px 2px hsl(0 0% 0% / 0.30) | Subtle |
| `--shadow-xs` | 0px 1px 3px hsl(0 0% 0% / 0.35) | Small elements |
| `--shadow-sm` | 0px 2px 4px / 0.32, 0px 1px 2px / 0.28 | Cards, buttons |
| `--shadow` | 0px 4px 6px / 0.38, 0px 2px 4px / 0.30 | Default shadows |
| `--shadow-md` | 0px 6px 12px / 0.42, 0px 3px 7px / 0.34 | Elevated |
| `--shadow-lg` | 0px 10px 20px / 0.48, 0px 6px 12px / 0.38 | Popovers |
| `--shadow-xl` | 0px 20px 25px / 0.52, 0px 10px 15px / 0.42 | Modals |
| `--shadow-2xl` | 0px 25px 50px / 0.60 | Dropdowns |

## Animation Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--animate-fast` | 150ms | Quick transitions |
| `--animate-default` | 200ms | Standard transitions |
| `--animate-slow` | 300ms | Slower animations |
| `--animate-slower` | 500ms | Page transitions |

### Animation Easings

| Token | Value |
|-------|-------|
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) |
| `--ease-bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) |

## Icon Sizes

### Standard Icon Sizes

| Token | Size | Usage |
|-------|------|-------|
| `--icon-xs` | 12px | Badges, small tags |
| `--icon-sm` | 16px | Inline with text |
| `--icon-md` | 20px | Default icons |
| `--icon-lg` | 24px | Card icons, buttons |
| `--icon-xl` | 32px | Section icons |
| `--icon-2xl` | 48px | Hero icons |

### Icon Context Usage

| Context | Size | Example |
|---------|------|---------|
| Button icons | `w-4 h-4` | `size="default"` buttons |
| Card icons | `w-5 h-5` | Header icons in cards |
| Section icons | `w-6 h-6` | Page sections |
| Badge icons | `w-3 h-3` | Status badges |

## Elevation System

The elevate system provides automatic brightness adjustment on hover and active states.

### Usage

```tsx
<Card className="hover-elevate active-elevate-2">
  Content
</Card>
```

### Elevation Variables

| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Default | transparent | transparent |
| Hover | `rgba(0,0,0, 0.03)` | `rgba(255,255,255, 0.06)` |
| Active | `rgba(0,0,0, 0.08)` | `rgba(255,255,255, 0.12)` |
| Toggle | `rgba(0,0,0, 0.08)` | `rgba(255,255,255, 0.12)` |

## Touch Targets

Minimum touch target size for accessibility: 44x44px

```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

## Focus States

All interactive elements should have consistent focus states:

```css
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

## Usage Guidelines

### When to Use CSS Variables

Always use CSS variables instead of hardcoded values:

```tsx
// Good
<div className="bg-background text-foreground">

// Avoid
<div className="bg-[#fafafa] text-[#1a1a2e]">
```

### Color Usage

- Use `--primary` for main actions and brand elements
- Use `--secondary` for supporting elements
- Use `--muted-foreground` for secondary text
- Use semantic colors (`--success`, `--warning`, `--destructive`) for status indicators

### Spacing Usage

- Page padding: `p-4 sm:p-6 lg:p-8 xl:p-12`
- Card padding: `p-6`
- Section gaps: `gap-6`
- Element gaps: `gap-4`

### Typography Usage

- Page titles: `text-3xl font-bold tracking-tight`
- Section titles: `text-2xl font-semibold`
- Card titles: `text-xl font-semibold`
- Body text: `text-base text-muted-foreground`
