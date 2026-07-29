# Design System Strategy: The Fiscal Atelier

## 1. Overview & Creative North Star

**Creative North Star: "The Fiscal Atelier"**
This design system moves away from the sterile, "template-locked" feel of traditional fintech and into the realm of high-end editorial curation. We are building a digital workspace that feels like a bespoke financial atelier—where precision meets warmth.

By rejecting the "flat grid" in favor of intentional asymmetry, layered surfaces, and high-contrast typography, we communicate a brand that is both authoritative (Archer/Newsreader) and technologically advanced (Manrope/Linear-inspired clarity). This system is designed to feel "built," not "generated," using depth and tonal transitions to guide the eye without the clutter of traditional UI dividers.

---

## 2. Colors & Tonal Architecture

The palette is rooted in a "Warm Industrial" aesthetic. We pair the structural reliability of Navy/Slate with the organic invitation of parchment-inspired warm grays.

### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment.
Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` section sitting against a `surface` background creates a clean, architectural break that feels more premium than a stroke.

### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers—like stacked sheets of fine, heavy-stock paper.

- **Surface (Base):** `#fff8f3` — The canvas.
- **Surface-Container-Low:** `#fff2e3` — For subtle secondary content.
- **Surface-Container-High:** `#f6e6d3` — To pull elements toward the user.
- **Surface-Container-Highest:** `#f0e0cd` — For the most prominent interactive modules.

### Signature Textures & Glassmorphism

While the system avoids "neon" or "loud" effects, we utilize **Matte Glassmorphism** for floating elements (modals, dropdowns, navigation bars).

- Use semi-transparent surface colors with a `backdrop-filter: blur(20px)`.
- This allows the warmth of the underlying layers to bleed through, ensuring the UI feels integrated rather than "pasted on."

---

## 3. Typography

The typographic system is a dialogue between "The Authority" (Serif) and "The Tool" (Sans-Serif).

| Role         | Token         | Font Family               | Weight  | Size     | Purpose                       |
| :----------- | :------------ | :------------------------ | :------ | :------- | :---------------------------- |
| **Display**  | `display-lg`  | Newsreader (Archer Proxy) | Medium  | 3.5rem   | High-end editorial statements |
| **Headline** | `headline-md` | Newsreader                | Regular | 1.75rem  | Page section headers          |
| **Title**    | `title-lg`    | Manrope                   | Bold    | 1.375rem | Component-level headers       |
| **Body**     | `body-lg`     | Manrope                   | Regular | 1rem     | Long-form readability         |
| **Label**    | `label-md`    | Manrope                   | Medium  | 0.75rem  | Data points & UI metadata     |

**Editorial Contrast:** Always pair a large Serif headline with a clean, wide-tracked Sans-Serif label (`label-md`) to create the "Stripe-grade" sophisticated hierarchy.

---

## 4. Elevation & Depth

In this system, elevation is an optical illusion created by light and tone, not shadows.

### The Layering Principle

Depth is achieved by "stacking" the surface tiers. To make a card feel interactive:

1. Start with a `surface-container-low` section.
2. Place a `surface-container-lowest` (#ffffff) card on top.
3. This creates a natural "lift" without a single drop shadow.

### The "Ghost Border" Fallback

If a border is strictly necessary for accessibility (WCAG AA), use a **Ghost Border**:

- Use `outline-variant` (`#c2c7ce`) at **15% opacity**.
- This provides a "suggestion" of a container without breaking the editorial flow.

---

## 5. Components

### Buttons (The Interaction Core)

- **Primary:** Background: `primary` (#3d627f); Text: `on-primary` (#ffffff). Corner radius: `8px`.
- **Secondary/CTA:** Background: `secondary-fixed-dim` (#a9ccdb). This "soft blue" provides contrast without the aggression of a standard "Alert" color.
- **Interaction:** On hover, do not change the color value; instead, shift the elevation using a subtle `surface-container-highest` tint.

### Cards & Modules

- **Rule:** Forbid the use of divider lines.
- Use vertical white space (following the 8px grid) to separate content blocks.
- Group related data using a `surface-variant` background color block rather than a box.

### Input Fields

- **Styling:** Minimalist. No bottom-line-only inputs. Use a solid `surface-container-lowest` fill with a `Ghost Border`.
- **Focus State:** Transition the border to `primary` (#3d627f) at 100% opacity.

### Signature Component: The "Liquidity Meter"

- A geometric, clean illustration component representing cash flow. Use `primary-container` (#81a6c6) for the fill and `surface-dim` for the track. Avoid round caps; use sharp, geometric terminations to maintain the modern fintech edge.

---

## 6. Do’s and Don’ts

### Do:

- **Do** use intentional asymmetry. A left-aligned headline with a right-aligned CTA creates a dynamic, high-end feel.
- **Do** respect the 8px spacing grid religiously to maintain "Linear-level" precision.
- **Do** use `Newsreader` for all numbers in large data displays to give them a "Financial Journal" weight.

### Don’t:

- **Don’t** use pure black (#000000) for text. Use `on-background` (#221a0f) to maintain the warmth of the palette.
- **Don’t** use "Card-in-Card" layouts with multiple borders. Use background color shifts to nest information.
- **Don’t** use standard icons. Use thick-stroke (2px), geometric icon sets that mirror the weight of the Archer/Newsreader letterforms.

---

## 7. Roundedness Scale

- **sm:** 4px (Selection indicators, Tooltips)
- **DEFAULT:** 8px (Buttons, Standard Cards, Inputs)
- **lg:** 16px (Main Content Containers, Hero sections)
- **full:** 9999px (Pills, Chips, Notification Badges)

By adhering to these rules, the design system will project an aura of "Trust through Precision"—ensuring the Invoice Liquidity Network feels like a generational financial institution.
