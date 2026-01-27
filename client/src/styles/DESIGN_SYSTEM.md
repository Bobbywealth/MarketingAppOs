# MarketingOS Design System

A comprehensive design system for building consistent, accessible, and beautiful user interfaces.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Design Tokens](#design-tokens)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Components](#components)
7. [Layout Patterns](#layout-patterns)
8. [Animation](#animation)
9. [Accessibility](#accessibility)
10. [Best Practices](#best-practices)

---

## Quick Start

### Installation

The design system is already integrated into the project. All components use Tailwind CSS with custom design tokens.

### Basic Usage

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Buttons
<Button variant="default">Click me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>

// Cards
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>

// Badges
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
```

---

## Design Tokens

Design tokens are the foundation of our design system. They ensure consistency across all UI elements.

### CSS Variables

All tokens are defined as CSS variables in `client/src/index.css`:

```css
:root {
  /* Colors */
  --primary: 217 91% 60%;
  --background: 0 0% 98%;
  --foreground: 220 13% 18%;
  
  /* Spacing */
  --spacing-4: 1rem;
  
  /* Typography */
  --font-sans: Inter, system-ui;
}
```

### Usage in Components

```tsx
// Using Tailwind classes (recommended)
<div className="bg-primary text-primary-foreground">

// Using CSS variables directly
<div style={{ backgroundColor: "hsl(var(--primary))" }}>
```

---

## Color System

### Semantic Colors

Use semantic colors for their intended purpose:

| Color | Token | Usage |
|-------|-------|-------|
| Primary | `bg-primary` | Main actions, brand elements |
| Secondary | `bg-secondary` | Supporting elements |
| Destructive | `bg-destructive` | Error states, delete actions |
| Success | `bg-success` | Success states |
| Warning | `bg-warning` | Warning states |
| Muted | `bg-muted` | Backgrounds, disabled states |

### Color Modifiers

All colors support HSL alpha for transparency:

```tsx
// With opacity
<div className="bg-primary/10">  // 10% opacity
<div className="bg-primary/50">  // 50% opacity

// Dark mode variants
<div className="bg-background dark:bg-background">
```

### Text Colors

```tsx
// Primary text
<p className="text-foreground">Main content</p>

// Secondary text
<p className="text-muted-foreground">Captions, metadata</p>
```

---

## Typography

### Font Families

| Font | Token | Usage |
|------|-------|-------|
| Sans | `font-sans` | Primary UI text |
| Serif | `font-serif` | Headlines, decorative |
| Mono | `font-mono` | Code, data display |

### Font Sizes

```tsx
// Headings
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-3xl font-semibold">Section</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>
<h4 className="text-xl font-medium">Card Title</h4>

// Body text
<p className="text-base">Regular text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
<p className="text-xs text-muted-foreground">Captions</p>
```

### Typography Utilities

Custom typography classes are available:

```tsx
// Heading styles
<div className="text-heading-xl">Hero Title</div>
<div className="text-heading-lg">Page Title</div>
<div className="text-heading-md">Section Title</div>
<div className="text-heading-sm">Card Title</div>

// Body styles
<div className="text-body-lg">Large body text</div>
<div className="text-body">Regular body text</div>
<div className="text-body-sm">Small body text</div>
<div className="text-body-xs">Caption text</div>
```

---

## Spacing

### Spacing Scale

| Token | Value | px | Usage |
|-------|-------|----|-------|
| `p-0` | 0rem | 0 | No padding |
| `p-1` | 0.25rem | 4px | Tight |
| `p-2` | 0.5rem | 8px | Small |
| `p-3` | 0.75rem | 12px | Medium |
| `p-4` | 1rem | 16px | Default |
| `p-5` | 1.25rem | 20px | - |
| `p-6` | 1.5rem | 24px | Large |
| `p-8` | 2rem | 32px | X-Large |
| `p-10` | 2.5rem | 40px | XX-Large |
| `p-12` | 3rem | 48px | Section |

### Standard Spacing Patterns

```tsx
// Page container
<div className="page-container">

// Card internal padding
<div className="card-padding">  // p-6
<div className="card-padding-sm">  // p-4
<div className="card-padding-lg">  // p-8

// Element gaps
<div className="element-spacing">  // gap-4
<div className="element-spacing-tight">  // gap-2
<div className="element-spacing-loose">  // gap-6

// Section gaps
<div className="section-spacing">  // gap-6 lg:gap-8
```

---

## Components

### Button

The button component supports multiple variants and sizes.

#### Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
<Button variant="link">Link</Button>
```

#### Sizes

```tsx
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

#### With Icons

```tsx
<Button>
  <Icon className="h-4 w-4 mr-2" />
  With Icon
</Button>
```

### Card

Cards are used to group related content.

#### Basic Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

#### With Footer

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

#### Compact Card

For tighter spaces, use the compact variant:

```tsx
<CardCompact>
  <CardCompactHeader>
    <CardTitle>Compact Card</CardTitle>
  </CardCompactHeader>
  <CardCompactContent>
    Content
  </CardCompactContent>
</CardCompact>
```

### Badge

Badges are used for labels, statuses, and counters.

#### Variants

```tsx
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Input

Form inputs with consistent styling:

```tsx
<Input placeholder="Enter text..." />
<Input type="email" placeholder="Email" />
<Input disabled placeholder="Disabled" />
```

#### With Label

```tsx
<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" placeholder="Enter email" />
</div>
```

---

## Layout Patterns

### Page Layout

```tsx
import { PageContainer, Section, FlexRow } from "@/components/layout/page-layout";

function MyPage() {
  return (
    <PageContainer>
      <Section>
        <h1 className="text-heading-lg">Page Title</h1>
        
        {/* Grid of cards */}
        <div className="grid-cards">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
          <Card>Card 3</Card>
        </div>
      </Section>
    </PageContainer>
  );
}
```

### Grid Utilities

```tsx
// Cards grid (responsive)
<div className="grid-cards">
  {/* 1 col mobile, 2 cols sm, 3 cols lg, 4 cols xl */}
</div>

// Stats grid
<div className="grid-stats">
  {/* 1 col mobile, 2 cols sm, 4 cols lg */}
</div>

// Dashboard grid
<div className="grid-dashboard">
  {/* 1 col mobile, 2 cols lg, 3 cols xl */}
</div>

// Simple 2-column
<div className="grid-2-col">
  <div>Left</div>
  <div>Right</div>
</div>

// Simple 3-column
<div className="grid-3-col">
  <div>Left</div>
  <div>Center</div>
  <div>Right</div>
</div>
```

### Flex Utilities

```tsx
import { FlexRow, FlexCol, Center } from "@/components/layout/page-layout";

// Row with space between
<FlexRow justify="between">
  <span>Left</span>
  <span>Right</span>
</FlexRow>

// Centered content
<Center>
  <Content />
</Center>

// Vertical stack
<FlexCol gap="default">
  <Item1 />
  <Item2 />
</FlexCol>
```

### Section Pattern

```tsx
<Section variant="compact">  // gap-4
<Section variant="default">  // gap-6
<Section variant="loose">    // gap-8
```

---

## Animation

### Animation Utilities

```tsx
// Smooth transitions
<div className="transition-smooth">  // duration-200
<div className="transition-fast">    // duration-150
<div className="transition-slow">    // duration-300

// Keyframe animations
<div className="fade-in">
<div className="slide-up">
<div className="slide-in-left">
<div className="slide-in-right">
```

### Animation Duration Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--animate-fast` | 150ms | Quick interactions |
| `--animate-default` | 200ms | Standard transitions |
| `--animate-slow` | 300ms | Page transitions |
| `--animate-slower` | 500ms | Complex animations |

### Hover Effects

```tsx
// Card hover lift
<Card className="card-hover-lift">

// Button elevation
<Button className="hover-elevate active-elevate-2">
```

---

## Accessibility

### Focus States

All interactive elements have consistent focus states:

```tsx
// Focus ring utility
<button className="focus-ring">

// Custom focus
:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### Touch Targets

Minimum touch target size of 44x44px:

```tsx
// Touch target utility
<button className="touch-target">
```

### ARIA Labels

Always provide accessible names:

```tsx
// Icon button
<Button aria-label="Close">
  <X className="h-4 w-4" />
</Button>

// Form input
<Input aria-label="Email address" />

// Interactive card
<div role="button" aria-label="View details">
```

### Color Contrast

All text colors meet WCAG AA standards:

- Primary text: 4.5:1 minimum
- Secondary text: 3:1 minimum
- Interactive elements: 3:1 minimum

---

## Best Practices

### Do's

1. **Use design tokens** - Always use CSS variables instead of hardcoded values
2. **Follow spacing patterns** - Use standard spacing utilities
3. **Be consistent** - Use the same patterns across similar components
4. **Test in dark mode** - Ensure all components work in both themes
5. **Use semantic HTML** - Choose appropriate HTML elements
6. **Add ARIA labels** - Make all interactive elements accessible

### Don'ts

1. **Don't use hardcoded colors** - Use semantic tokens instead
2. **Don't mix patterns** - Pick one pattern and use it consistently
3. **Don't skip focus states** - All interactive elements need focus styles
4. **Don't use magic numbers** - Use design tokens for sizes and spacing
5. **Don't forget mobile** - Test all layouts on small screens

### Code Patterns

#### Good

```tsx
<Card className="hover-elevate">
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
    <CardDescription>Manage your account settings</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="element-spacing">
      <Input aria-label="Name" />
      <Input aria-label="Email" type="email" />
    </div>
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

#### Avoid

```tsx
<div className="p-6 bg-white rounded-xl border border-gray-200">
  <h2 className="text-2xl font-bold mb-2 text-gray-900">User Profile</h2>
  <p className="text-gray-600 mb-4">Manage your account settings</p>
  <div className="space-y-4">
    <input className="border p-2 rounded" />
    <input className="border p-2 rounded" />
  </div>
  <div className="flex justify-end gap-2 mt-4">
    <button className="px-4 py-2 border rounded">Cancel</button>
    <button className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
  </div>
</div>
```

---

## Common ClassName Combinations

### Card Wrapper

```tsx
<Card className="hover-elevate transition-all duration-200">
```

### Primary Button

```tsx
<Button className="shadow-sm hover:shadow-md">
```

### Input Field

```tsx
<div className="grid gap-2">
  <Label>Label</Label>
  <Input className="focus-ring" />
</div>
```

### Page Header

```tsx
<PageContainer>
  <FlexRow justify="between" align="center">
    <h1 className="text-heading-lg">Page Title</h1>
    <Button>Action</Button>
  </FlexRow>
</PageContainer>
```

### Stat Card

```tsx
<Card className="card-hover-lift">
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <span className="text-body-sm text-muted-foreground">Label</span>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="text-3xl font-bold mt-2">Value</div>
  </CardContent>
</Card>
```

### List Item

```tsx
<FlexRow className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
  <Icon className="h-5 w-5" />
  <span>Item text</span>
</FlexRow>
```

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Framer Motion](https://www.framer.com/motion)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Contributing

When adding new components or modifying existing ones:

1. Follow the design tokens
2. Use the established patterns
3. Test in both light and dark modes
4. Ensure accessibility
5. Update documentation
