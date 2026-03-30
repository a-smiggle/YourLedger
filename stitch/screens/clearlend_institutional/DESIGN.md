# Design System Strategy: The Institutional Architect

## 1. Overview & Creative North Star
This design system is built upon the North Star of **"The Institutional Architect."** In the transition from Commonwealth Ledger to ClearLend, we are moving away from the heavy, legacy "ledger" feel toward a digital-first, architectural approach to finance. 

The aesthetic is inspired by modern Australian high-rise architecture: heavy structural foundations (Deep Navy) paired with expansive glass, light-filled atriums, and refined tonal shifts. We reject the "standard" SaaS dashboard look. Instead, we embrace **Editorial Financialism**—a layout style that uses aggressive white space, intentional asymmetry, and layered depth to convey a sense of unshakeable stability and elite clarity.

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in `primary` (#000f3c) and `primary_container` (#012169), providing the institutional "weight" required for a banking entity.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are strictly prohibited for sectioning.** Traditional lines create visual "noise" that suggests a lack of confidence. Instead:
*   **Defining Boundaries:** Use background color shifts. A `surface_container_low` (#f2f4f6) section should sit directly against a `surface` (#f7f9fb) background to define its start and end.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. Use the `surface_container` tiers (Lowest to Highest) to create "nested" depth. For example, a high-priority data table should live on `surface_container_lowest` (#ffffff) to "pop" against a `surface_container` (#eceef0) page background.

### Glass & Signature Textures
*   **Institutional Glass:** For floating navigation or modal overlays, use `surface_container_lowest` with an 80% opacity and a 20px backdrop-blur. This ensures the deep navy of the branding feels integrated, not "pasted on."
*   **The Power Gradient:** For primary CTAs and Hero backgrounds, use a subtle linear gradient from `primary_container` (#012169) to `primary` (#000f3c) at a 135-degree angle. This adds a "monolithic" soul to the interface that flat hex codes cannot replicate.

## 3. Typography: The Manrope Hierarchy
We use **Manrope** exclusively. Its geometric yet humane construction bridges the gap between technical precision and approachable service.

*   **Display (lg/md):** Reserved for high-level "Financial Statements" or "Portfolio Value." These should be set with tight letter-spacing (-0.02em) to look like high-end architectural signage.
*   **Headline (lg/md/sm):** Used for section titles. Pair these with asymmetrical layouts—for example, a `headline-lg` left-aligned with a 4rem offset from the main content grid.
*   **Body & Labels:** `body-md` is our workhorse. Use `label-md` in all-caps with +0.05em tracking for metadata to create an "institutional" feel.

## 4. Elevation & Depth: Tonal Layering
In this design system, "Shadows are the failure of geometry." We prioritize **Tonal Layering** over drop shadows.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. The contrast in luminance provides a "soft lift" that feels architectural rather than digital.
*   **Ambient Shadows:** If a floating element (like a dropdown) requires a shadow, it must be an "Ambient Shadow": `0px 12px 32px rgba(25, 28, 30, 0.04)`. The shadow color must be a tint of `on_surface` (#191c1e), never pure black.
*   **The Ghost Border:** If a border is required for accessibility in input fields, use `outline_variant` at 20% opacity. 100% opaque borders are forbidden as they "choke" the typography.

## 5. Components: The ClearLend Primitives

### Buttons
*   **Primary:** A monolithic block using the `primary` to `primary_container` gradient. Use `roundedness-md` (0.375rem). No border.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. This feels like an integrated part of the UI rather than an external button.
*   **Tertiary:** No background. Underline on hover only using a 2px `surface_tint` offset.

### Input Fields & Checkboxes
*   **Fields:** Use `surface_container_low` as the fill. On focus, transition the background to `surface_container_lowest` and add a "Ghost Border."
*   **Checkboxes/Radios:** Use `primary` for the checked state. These should feel like small "stamps" of authority.

### Cards & Lists (The "Anti-Divider" Rule)
*   **The Rule:** Forbid the use of divider lines between list items. 
*   **The Solution:** Use `spacing-4` (1rem) of vertical white space or alternating tonal shifts (zebra-striping) between `surface` and `surface_container_low`.

### Specialized Institutional Components
*   **The Data Ribbon:** A thin, full-width `primary` container at the top of a view containing critical high-level metrics (e.g., Interest Rate, Total Balance) in `on_primary` typography.
*   **The Clarity Gauge:** Instead of standard progress bars, use a custom component with a `surface_container_highest` track and a `surface_tint` indicator, emphasizing the "Clear" in ClearLend.

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical spacing. If the left margin is `spacing-12`, the right margin can be `spacing-24` to create an editorial, airy feel.
*   **Do** stack surfaces. Treat the UI as a series of 3-4 physical sheets of paper.
*   **Do** use `on_surface_variant` (#444651) for secondary text to maintain a high-end "Slate" look.

### Don’t
*   **Don’t** use pure black (#000000) or pure grey. Always use the provided Navy-tinted neutrals.
*   **Don’t** use "Standard" 12-column grids. Experiment with 3-column "Golden Ratio" grids for financial summaries.
*   **Don’t** use shadows to hide poor layout logic. If elements are confusing, change their background tone, don't just "lift" them.