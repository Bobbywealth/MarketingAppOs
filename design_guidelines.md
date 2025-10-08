# Marketing Team App CRM - Design Guidelines

## Design Approach: Modern SaaS Dashboard System

**Selected Approach**: Design System with Notion/Linear/HubSpot Reference  
**Justification**: Utility-focused productivity tool requiring information density, consistency, and professional aesthetics for B2B users.

**Key Design Principles**:
- Data clarity over decorative elements
- Efficient information hierarchy for multi-module navigation
- Professional trust-building through clean, structured layouts
- Responsive density (more compact on desktop, breathable on mobile)

---

## Core Design Elements

### A. Color Palette

**Primary Brand Colors**:
- Primary Blue: `217 91% 60%` - Main actions, active states, primary CTAs
- Primary Orange: `25 95% 53%` - Accent highlights, important notifications, urgent items
- Neutral Base Dark: `220 13% 18%` - Dark mode backgrounds
- Neutral Base Light: `0 0% 98%` - Light mode backgrounds

**Functional Colors**:
- Success Green: `142 71% 45%` - Completed tasks, positive status
- Warning Amber: `38 92% 50%` - Pending items, warnings
- Error Red: `0 84% 60%` - Errors, overdue items
- Info Blue: `199 89% 48%` - Informational elements

**Semantic Application**:
- Lead pipeline stages use gradient from cool blue → warm orange as leads progress
- Status badges use functional colors (green=active, amber=pending, red=overdue)
- Sidebar navigation: subtle blue highlight for active items
- Dark mode: `220 13% 18%` base with `220 13% 25%` elevated cards

### B. Typography

**Font Stack**: Inter (via Google Fonts CDN) - single family for consistency

**Hierarchy**:
- Page Headers: `text-2xl font-semibold` (24px, 600 weight)
- Section Headers: `text-lg font-semibold` (18px, 600 weight)
- Card Titles: `text-base font-medium` (16px, 500 weight)
- Body Text: `text-sm font-normal` (14px, 400 weight)
- Labels/Metadata: `text-xs font-medium text-muted-foreground` (12px, 500 weight)
- Buttons: `text-sm font-medium` (14px, 500 weight)

**Line Heights**: 
- Headers: `leading-tight` (1.25)
- Body: `leading-relaxed` (1.625)
- Dense tables: `leading-normal` (1.5)

### C. Layout System

**Spacing Scale**: Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: `p-4` (cards), `p-6` (modals), `p-8` (page containers)
- Element gaps: `gap-2` (tight groupings), `gap-4` (form fields), `gap-6` (sections)
- Margins: `mb-2` (labels), `mb-4` (form groups), `mb-8` (major sections)

**Grid Structure**:
- Sidebar: Fixed `w-64` desktop, collapsible on mobile
- Main content: `max-w-7xl mx-auto px-4 lg:px-8`
- Dashboard cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Table layouts: Full-width with `max-w-none`

### D. Component Library

**Navigation**:
- Sidebar: Dark background (`bg-slate-900`), white/blue icons, grouped by module, collapsible sections
- Top bar: Breadcrumbs, global search (⌘K), notifications bell, user avatar dropdown
- Mobile: Bottom navigation with 4-5 key modules

**Dashboard Cards**:
- White/elevated background, rounded corners `rounded-lg`
- Subtle shadow `shadow-sm`, hover lift `hover:shadow-md transition-shadow`
- Icon + metric layout (large number, small label below)
- Trend indicators (↑↓ with green/red coloring)

**Data Tables**:
- Striped rows `odd:bg-slate-50` for dark mode use `odd:bg-slate-800/50`
- Sticky headers on scroll
- Row actions appear on hover (edit, delete icons)
- Sortable columns with arrow indicators
- Pagination at bottom right

**Forms & Inputs**:
- Floating labels or top-aligned labels with `text-sm font-medium mb-2`
- Input fields: `border border-slate-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500`
- Dark mode inputs: `bg-slate-800 border-slate-700 text-white`
- Inline validation with icon + message below field
- Multi-step forms use progress indicator at top

**Kanban Board** (Lead Pipeline):
- Horizontal columns with `min-w-80`, horizontal scroll on mobile
- Column headers show count badges
- Cards drag with subtle shadow lift
- Add card button at column bottom
- Status color bar on card left edge

**Calendar View**:
- Month/week/day toggle in top right
- Campaign blocks color-coded by type (blue=social, orange=ads, green=content)
- Click to expand event details in modal
- Today highlighted with subtle background

**Modals & Overlays**:
- Centered modal with backdrop blur `backdrop-blur-sm`
- Max width `max-w-2xl`, padding `p-6`
- Close X in top right, primary action bottom right
- Slide-in panels from right for quick views (client details, task editor)

**Status Badges**:
- Pill shape `rounded-full px-3 py-1 text-xs font-medium`
- Background/text color combinations (e.g., `bg-green-100 text-green-700` for active)

**Client/Project Cards**:
- Avatar/logo on left, name + metadata center, action menu (⋮) right
- Compact height `h-20`, full-width clickable
- Last activity timestamp in muted text
- Tag chips below name (service type tags)

### E. Animations

**Minimal, Purposeful Motion**:
- Page transitions: None (instant navigation)
- Hover states: `transition-colors duration-150` for buttons/links
- Card hover: `transition-shadow duration-200` for subtle lift
- Modal enter: Fade in backdrop + scale-95 to scale-100 for content (200ms)
- Toast notifications: Slide in from top right (300ms)
- **No scroll-triggered animations, parallax, or decorative motion**

---

## Images

**Avatar & Logos**:
- Client avatars: Circular, 40px (lists) or 80px (profiles)
- Company logos: Square containers with object-fit contain
- Team member photos: Circular, 32px in sidebar/headers

**Empty States**:
- Illustration placeholders for empty modules (e.g., "No clients yet")
- Simple line art style, blue/orange accent colors, centered with CTA below

**No hero images** - This is a dashboard application, not a marketing site. Focus on data visualization and functional UI components.