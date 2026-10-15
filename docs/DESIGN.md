---
name: Kinetic Arcade
colors:
  surface: '#11131d'
  surface-dim: '#11131d'
  surface-bright: '#373844'
  surface-container-lowest: '#0c0e18'
  surface-container-low: '#191b26'
  surface-container: '#1d1f2a'
  surface-container-high: '#282934'
  surface-container-highest: '#32343f'
  on-surface: '#e1e1f0'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e1e1f0'
  inverse-on-surface: '#2e303b'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00885d'
  on-tertiary-container: '#000703'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#11131d'
  on-background: '#e1e1f0'
  surface-variant: '#32343f'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an electric, high-momentum gaming universe designed for modern digital play, progression, and social competition. Merging the refined curation of Apple Arcade, the systematic telemetry of Google Play Games, and the dopamine-fueled tactility of Duolingo, the experience feels fluid, inviting, and visually kinetic.

### Target Audience & Psychological Response
- **Target Audience:** Modern casual and mid-core mobile and desktop gamers, collectors, competitive rank climbers, and community-driven players.
- **Emotional Response:** Instant engagement, rewarding feedback loops, modern tech sophistication, and tactile satisfaction. Every tap, swipe, and level progression feels weightful, fluid, and celebratory without descending into chaotic clutter.

### Design Style: Neo-Tactile Glassmorphism
The aesthetic combines deep, cinematic space backgrounds with translucent glass overlays, radiant color accents, and physically satisfying geometry. It balances structural utility with playful energy:
- **Atmospheric Base:** Layered violet-black depth sets an immersive, premium stage where interactive elements pop with luminescence.
- **Electric Energy:** High-saturation accents direct focus, highlight achievements, and fuel state-changes.
- **Physical Tactility:** Surfaces respond with subtle bounce physics, depth-cast volumetric shadows, and generous touch boundaries built for intuitive, thumb-first navigation.

## Colors

The color palette is built exclusively around a default dark canvas that radiates energy through purposeful luminescence rather than flat contrast.

### Color Tiers & Semantics
- **Background Root (`#0B0D17`):** Deep Obsidian Void. Anchors the viewport canvas and frames fluid game artwork.
- **Surface Layer 1 (`#131728`):** Deep Slate Violet. Used for root cards, structural rails, and structural modules.
- **Surface Layer 2 (`#1E2238`):** Elevated Interactive Slate. Houses lists, inner cards, and interactive trays.
- **Primary Accent (`#6366F1` - Electric Indigo):** Primary action drivers, active state highlights, XP bars, and key navigation nodes.
- **Secondary Accent (`#06B6D4` - Cyber Cyan):** Secondary actions, telemetry badges, live stream pulses, and unlock alerts.
- **Tertiary Accent (`#10B981` - Neon Lime):** Success notifications, completed quests, currency boosts, and streak indicators.
- **Alert / Destructive Accent (`#F43F5E` - Sunset Coral):** Urgent calls-to-action, raid alerts, critical timers, hearts/lives depleted, and direct battles.

### Translucency & Overlay Rules
- Floating bars and navigation headers utilize `rgba(19, 23, 40, 0.72)` combined with a 20px blur filter.
- Inner card highlights utilize a directional gradient running from `rgba(255, 255, 255, 0.08)` at top-left to `rgba(255, 255, 255, 0.00)` at bottom-right.

## Typography

Typography blends the energetic geometric roundness of Plus Jakarta Sans for titles, calls-to-action, and level metrics with the hyper-legible neutral clarity of Inter for dense mechanics, descriptions, and stat readouts.

### Hierarchy & Role Distribution
- **Plus Jakarta Sans:** Drives emotional presence. Set in heavier weights (600, 700, 800) with slight negative tracking on large displays (-0.02em) to create an authoritative, arcade-like punch.
- **Inter:** Ensures maximum scanning comfort across descriptions, patch notes, user settings, and stat screens.
- **Metrics & Numbers:** Numerical scores, timers, and coin counters always use Plus Jakarta Sans with tabular lining figures enabled (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during rapid score increments.

## Layout & Spacing

The layout is built upon an 8-point modular grid utilizing fluid columns and responsive container constraints designed for smooth carousels, responsive grid feeds, and thumb-accessible navigation zones.

### Breakpoints & Layout Adaptations
- **Mobile (< 768px):** Single-column fluid stream with horizontal swipe carousels (`gutter: 1rem`, `margin: 1rem`). Carousel cards bleed to the screen edge with trailing peak visibility (80% card width visible to prompt horizontal swiping). Persistent floating bottom action dock (64px height) keeping core tabs within the natural thumb sweep zone.
- **Tablet (768px - 1024px):** 6-column fluid grid (`gutter: 1.25rem`, `margin: 2rem`). Game modules snap into 2-up and 3-up configurations; side navigation drawer docks as an icon rail.
- **Desktop (> 1024px):** 12-column fixed-max layout (`max-width: 1440px`, `gutter: 1.5rem`, `margin: 3rem`). Expandable left navigation rail, central game stream, and persistent social/party right rail for telemetry and friend presence.

## Elevation & Depth

Visual hierarchy uses frosted glassmorphism paired with deep-tinted chromatic drop shadows to establish rich visual tiers without stark white borders.

### Depth Tiers
- **Tier 0 (Root Void):** Flat `#0B0D17` surface. Absorbs light; provides pure negative space.
- **Tier 1 (Surface Tiles & Shelves):** Solid `#131728` background with an ultra-thin top border: `1px solid rgba(255, 255, 255, 0.05)`. Shadow: `0 8px 24px -4px rgba(0, 0, 0, 0.5)`.
- **Tier 2 (Interactive Floating Cards):** Solid `#1E2238` with subtle top highlight. Shadow: `0 16px 32px -8px rgba(11, 13, 23, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.08)`.
- **Tier 3 (Modals, Overlays & HUD Bars):** Glass frosted layer (`rgba(19, 23, 40, 0.8)` with `backdrop-filter: blur(24px)`). Shadow: `0 24px 48px -12px rgba(0, 0, 0, 0.75)`.
- **Kinetic Glow (Active Accents):** Interactive elements in hovered, focused, or level-up states cast colored ambient glows:
  - Indigo Glow: `0 8px 24px -2px rgba(99, 102, 241, 0.45)`.
  - Cyan Glow: `0 8px 24px -2px rgba(6, 182, 212, 0.45)`.
  - Coral Glow: `0 8px 24px -2px rgba(244, 63, 94, 0.45)`.

## Shapes

The shape system adopts a pill-shaped, neo-tactile approach to match casual game intuitiveness and Apple-level polish. Smooth super-ellipses prevent visual fatigue and deliver immediate organic warmth.

### Geometry Hierarchy
- **Standard Controls & Tags (Pill):** Buttons, chips, category filters, and interactive badges inherit full pill rounding (`border-radius: 9999px` / `3rem`).
- **Feature Cards & Modals (`rounded-3xl`):** Primary hero cards, promotion banners, and overlay sheets use massive `1.5rem` to `2rem` curves to frame rich graphics and dynamic shaders comfortably.
- **Game Tiles & Mini Cards (`rounded-2xl`):** Quick-launch icons and inventory grids use consistent `1rem` to `1.25rem` corners, creating a continuous, squircle-inspired rhythm throughout dense lists.

## Components

### Buttons
- **Primary Action (Tactile Play):** Full pill silhouette, background set to Electric Indigo (`#6366F1`) or vibrant multi-stop linear gradient (`#6366F1` to `#8B5CF6`). Includes a 3D physical press effect: a 3px bottom inset border (`#4F46E5`), which shifts down by `2px` via CSS transform on `:active` to simulate a real, game-controller push button.
- **Secondary (Cyber Action):** Frosted dark slate surface (`#1E2238`) with Cyber Cyan text and border (`1px solid rgba(6, 182, 212, 0.3)`). Gains a Cyan glow on hover.
- **Touch Target:** Minimum mobile touch target of 48x48px across all interactive targets.

### Cards
- **Featured Arcade Hero Card:** Ultra-rounded (`rounded-3xl`) frame hosting auto-preview video or rich key art. Gradients fade to `#131728` at bottom content container. Overlaid with frosted metadata pills (tags, rating, genre).
- **Game Grid Card:** High aspect ratio (16:9 or 1:1) with subtle scale expansion (`transform: scale(1.025)`) and kinetic border glow on hover/active focus.

### Chips & Filters
- Compact pill-shaped selectors (`padding: 0.5rem 1rem`).
- **Inactive:** Semi-transparent slate (`rgba(30, 34, 56, 0.6)`) with subtle grey text.
- **Active:** Solid Electric Indigo or Neon Lime fill with contrasting bold text and active glow.

### Input Fields
- Dark enclosed stadium/pill bars (`#131728`) with recessed inner shadow (`inset 0 2px 4px rgba(0,0,0,0.4)`).
- Prefix icons (search lens, game tag) positioned comfortably with 16px horizontal spacing. Focus border pulses with a Cyber Cyan hairline ring.

### Checkboxes & Switches
- **Switches:** Duolingo-inspired chunky sliding toggles with smooth spring-physics movement. Track turns Neon Lime (`#10B981`) when activated, holding a distinct circular white thumb with drop shadow.
- **Checkboxes:** Smooth `rounded-lg` boxes filled with `#1E2238`. Checked state pops via a spring bounce into vibrant Indigo with a crisp checkmark icon.

### Carousels & Progression Trackers
- **Carousels:** Hardware-accelerated snap-scrolling rails (`scroll-snap-type: x mandatory`). Smooth momentum curves, edge bleeding indicators, and animated segmented indicator bars that fill progressively.
- **XP / Streak Bars:** Segmented, rounded track with shiny liquid gradients (Sunset Coral to Neon Lime) featuring micro-shimmer shine passes on progression updates.

KEEP THESE IN MIND :

# DESIGN_TASTE.md

This file describes the kind of UI I want and the things I refuse to ship. Read it before designing or changing any screen. It works together with AGENTS.md. It deliberately does not fix specific colors or fonts. It describes taste, quality, and behavior.

## 1. The goal

The product must look and feel like it was designed by a skilled human design studio and could win a design award. A visitor should never think "an AI made this". It should feel professional, calm, confident, and fast.

If a screen looks like a template, it is wrong, even if it works.

## 2. How it should feel

- Professional and refined, never playful-cartoonish, never loud.
- Premium and editorial. Think a well-made photography magazine or a high-end camera app.
- Calm and spacious. Confidence comes from restraint, not from adding more.
- Alive but not busy. Motion adds polish and feedback, never noise.
- Fast. If something feels slow or laggy, the design has failed.
- Everything feels intentional. Every size, gap, radius, and animation has a reason.

## 3. Principles I care about

**Content first.** The user's photos are the hero. The interface supports them and gets out of the way. Minimal chrome, generous space around images.

**Restraint.** Fewer elements, done better. If something does not earn its place, remove it.

**Consistency.** One system for spacing, radii, borders, shadows, icon style, and type scale. Nothing is ad hoc. No random pixel values.

**Hierarchy.** It must be obvious what matters most on every screen. Use scale, weight, and space to create hierarchy, not decoration.

**Precision.** Alignment, spacing, and sizing are exact. Small details are what separate a crafted product from a generated one.

**Glass effect, used with taste.** I like the liquid glass look: translucent surfaces, soft blur, thin light edges, gentle depth. It must be used only where something real sits behind it, such as overlays on photos or floating panels. It must never be applied to everything, never nested, and text on it must stay easy to read.

## 4. What makes a UI look like AI slop (avoid all of this)

**Visual tells**
- Generic gradient backgrounds, glowing blobs, aurora effects, neon highlights
- Everything wrapped in the same rounded card with the same shadow
- Emoji used as icons or decoration
- Sparkle icons, "AI-powered" badges, robot or magic-wand imagery
- Stock-looking hero sections: big headline, subtitle, two buttons
- Glass effects on plain backgrounds, or on every element
- Default component library styling left untouched
- Mixed icon styles, inconsistent corner radii, inconsistent spacing
- Heavy drop shadows, thick borders, boxed outlines everywhere
- Decorative elements that serve no purpose

**Layout tells**
- Everything centered, symmetrical three-column feature grids
- Identical card grids with no rhythm or variation in scale
- Sections that exist only to fill space (fake stats, fake testimonials, "How it works in 3 steps")
- Uniform padding everywhere with no hierarchy
- Layouts that are just a desktop page squeezed onto mobile

**Copy tells**
- Marketing filler such as "Unlock the power of", "Seamlessly", "Elevate your experience", "Welcome to our platform"
- Lorem ipsum, placeholder names, or invented numbers
- Cheerful chatbot tone, exclamation marks, "Oops!" error messages
- Generic messages like "Success!" with no context

**Behavior tells**
- No loading, empty, or error states
- Animations that bounce, float, pulse, or loop for no reason
- Spinners everywhere instead of skeletons that match the real layout
- Layout that jumps when content loads
- Hover effects that just draw a box or border around the element

## 5. Motion and interaction

I want motion that feels smooth, premium, and responsive.

- Every animation has a purpose: feedback, orientation, or delight at a key moment.
- Hover and press states should feel physical. Use movement, scale, light, and easing rather than boxes and outlines.
- No borders or outline rings appearing on hover. Show hover through motion and light.
- Keyboard focus still needs a clear visible indicator, but only for keyboard users, not on mouse hover.
- Use spring-like easing and short durations. Nothing slow, nothing floaty.
- The dock and navigation should feel alive: icons react to the pointer, the active state moves smoothly between items, and presses give tactile feedback.
- Key moments deserve a little craft: a score being revealed, a crown being won, a takeover notification arriving, a photo opening full screen.
- Page and route transitions should feel connected, not like a hard cut.
- Animate only cheap properties (transform and opacity). Never animate things that cause layout work or heavy repainting.
- Respect reduced-motion settings.

## 6. Icons

- Use one high-quality icon set with a consistent style and stroke weight. No mixing sets.
- Inactive and active states should be clearly distinguishable by the icon itself (for example outline versus filled).
- Icons can have small, tasteful micro-animations tied to their meaning.
- Never use emoji as icons.

## 7. Typography

- Choose a deliberate type pairing with a clear role for each face. Avoid the default look.
- Strong, confident headings and quiet, small supporting labels.
- Consistent type scale, line heights, and spacing between text blocks.
- Numbers that change or compare (such as scores) should align cleanly and be easy to scan.

## 8. Layout and spacing

- Use a consistent spacing scale and a clear grid.
- Vary scale on purpose to create rhythm. Not everything should be the same size.
- Photos keep a fixed aspect ratio and never cause layout shift.
- Leave breathing room. Crowded screens look cheap.
- Nothing may scroll sideways, overflow, clip, or overlap by accident.
- Mobile layouts are designed for mobile, with comfortable tap targets, not just shrunk from desktop.

## 9. Copy and tone

- Short, direct, human, and specific. Say exactly what happened.
- No marketing language inside the product.
- Errors explain what went wrong and what to do next, calmly.
- No emoji, no hype.

## 10. States and details that signal craft

Every screen needs designed states, not just the happy path:
- Loading skeletons that match the real layout
- Empty states that guide the user
- Error states with a way to retry
- Permission-denied states (camera, location)
- Success feedback that is clear and understated

Small details matter: consistent radii and borders, smooth image loading, correct focus handling, accessible contrast, and sensible keyboard support.

## 11. Performance is part of design

A beautiful UI that lags is a bad UI.
- Keep blur and glass layers limited and never nested.
- Use properly sized images and avoid layout shift.
- Keep interactions responsive and animations at a smooth frame rate, including on weaker devices.
- Prefer simple, cheap techniques over heavy effects or large libraries.

## 12. Checklist before finishing any UI work

Answer honestly. If any answer is "yes", fix it before committing.

- Does any part look like a generic template or a default component library?
- Is there any decoration that has no purpose?
- Is glass or blur used where it adds nothing, or stacked on top of itself?
- Is any text hard to read on a translucent surface?
- Is there filler copy, an emoji icon, or a vague message?
- Do hover states draw a box or border instead of using motion and light?
- Is any animation purposeless, slow, bouncy, or janky?
- Do spacing, radii, borders, and icon styles stay consistent across pages?
- Does the mobile layout feel designed, or just squeezed?
- Is every loading, empty, error, and permission state designed?
- Does anything shift, overflow, or scroll sideways?
- Does it feel fast?

## 13. When in doubt

Choose the more restrained, more minimal, more content-focused option. Do the simpler thing, and do it with precision. A quiet, well-crafted screen always beats a busy, decorated one.