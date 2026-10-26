---
name: interface-bts
description: Draws a spec poster of an interaction you point it at, with the real component paused at its key moments and every duration, curve and size read from it and drawn in place.
disable-model-invocation: true
---

# interface-bts

This skill turns one interaction in a project into an A4 spec poster: the behind-the-scenes drawing of how it moves. The poster has:
- **Figure 1:** the real component, frozen mid-motion, with its sizes dimensioned on it.
- **Callouts:** numbered parts, with a note for each saying what changes and why.
- **Figure 2:** the curve or mapping that drives it.
- **Moments:** a row you can pick to re-drive the component.
- **Specification:** trigger, properties, duration, easing and reduced motion.

A reader should leave with one sentence about how it works.

The poster documents what the interface does now. It isn't a redesign, a live debug overlay or a video. If someone wants a component changed, say so and leave the poster out of it. Every number on the poster comes from the running component; anything that can't be read is marked as an estimate, never filled in.

Example: `/interface-bts the dropdown in components/menu.tsx`

## 1. Study the interaction

- Find the component, its callers, its styles, its handlers and its animation code. Run it and use the interaction yourself.
- Trace input → decision → output:
  - What triggers it?
  - What changes?
  - Which values drive the change (durations, easings, thresholds, sizes)?
  - Where does each value live?
- Probe the cases that show the rules: a slow input, a reversal, an interruption, the resting state, and reduced motion.

**Done when** you can name the mechanism in one sentence and point to the source of each value it uses.

## 2. Agree the poster in chat

List these and wait for a yes before building:

- **Headline:** the mechanism in plain words ("The pill catches up: its left edge and width ease on one curve").
- **Hero moment:** the frame where the mechanism shows most. Usually mid-motion or just past a threshold, rarely at rest.
- **Moments:** 3–5 in story order (rest, start, the hero, past it, settled).
- **Callouts:** 2–4 numbered parts on figure 1, with what each note will say.
- **Figure 2:** pick from the table below.
- **Measurements:** the one or two sizes the headline depends on.

| To explain | Figure 2 draws |
| --- | --- |
| How a value travels over time (most transitions) | The easing curve, with the held moment marked on it |
| Two things on one clock (a cross-fade, an icon swap) | Both curves on one time axis |
| A value that follows input (a drag, a scroll) | Input mapped to output, with the clamp and snap points |
| Keyframes or a loop | The keyframe stops over one cycle |
| A threshold or snap | The decision regions, with the current input inside them |

**Done when** the user has agreed the headline and the moments.

## 3. Freeze the real component

- **Figure 1 is the real component.** Drive it with its own handlers, and freeze it by pausing its real animations: `getAnimations()`, then `pause()` and set `currentTime`, or seek the animation library's own timeline. Never rebuild it, and never run a second animation to imitate it.
- **Read every number from the running component:** computed style, `getAnimations()`, its timeline, or data attributes it publishes. Never type a duration, an easing or a threshold into the poster. Take the first timing function with `firstEasing()`: splitting a computed list on commas cuts `cubic-bezier()` in half.
- **A component that isn't a CSS transition needs its own driver,** and some fight the poster: anything placed by floating-ui (Radix menus, popovers, tooltips), fixed to the window (toasters, sheets), measuring itself on screen (drag and swipe thresholds), or moving focus. Read [references/drivers.md](references/drivers.md) before building one of these.
- **Check that channels agree before you show them as one mechanism,** for example that opacity follows the same curve as scale. If they don't, the poster shows its error state rather than a wrong drawing.
- **Moments are copies:** static DOM snapshots with computed styles inlined, and inert. Use one camera for all of them, so growth never reads as shrinkage.
- **Report what you measured,** even when it contradicts what the code intends.

**Done when** each moment re-drives the component to the same frame every time, the held values match the source, and (for a driven gesture or pointer path) one run has been checked against a real browser mouse or touch.

## 4. Compose the poster

- **Always A4 portrait.** Lay it out once on a 794 × 1123 artboard (A4 at 96 dpi), then scale the whole poster to fit the space, centred. Never reflow at a breakpoint: a resize changes the scale, not the arrangement.
- **Order:** the component's name, figure 1 with its moments under it, then the foot. In the foot, the notes and figure 2 sit side by side, and the specification spans the width below them. A title block at the very bottom states the units, the drawing scale and the line types, once.
- **Type:**
  - the name at 16px, weight 500, as the only heading;
  - notes and specification at 13/18;
  - 12px inside drawings;
  - one font, sentence case, nothing heavier than 600;
  - tabular digits, with units lighter than their numbers.
- **Padding:** 20px top and bottom, 32px at the sides.
- **Size each drawing to its slot.** Measure the free height, then pick the drawing scale so the component and its dimensions fit. State it ("drawn at 3×").
- **No housing.** No cards or boxes round notes or figures; use hairlines and flat fills. No glows, no large blurred shadows, no gradients for depth.
- **Accent:**
  - Each poster takes one iOS 26 system colour (`IOS26` in the kit), unique across the project's posters. Record it in `SPEC_ACCENTS`.
  - Once all twelve are taken, reuse the least-used one.
  - The accent marks lines and fills, with a 12% tint under the run. Words use a darker ink of the same hue (lightness capped at 0.52), so yellow and mint stay readable.
- **Theme:** use the app's real theme. Pass `theme="dark"` only when the app itself is dark, read through its own mechanism. Never invent a dark theme, and never put a theme toggle on the poster. Draw nothing until the theme is known, and key the poster on it so a change redraws it and copies the moments again.

Drafting conventions (dimensions from a datum, line types, detail views, aligned views) are in [references/drafting.md](references/drafting.md). Read it before drawing.

**Done when** everything on the poster has a slot and no word sits on the component.

## 5. Polish, then verify by measurement

Polish:
- **Optical alignment:** note numbers sit on their first line's baseline, the foot's columns share a first baseline, and notes and figures share left edges.
- **Concentric radii:** an outline drawn round a part uses the part's own radius at the drawing scale. Anything nested uses the outer radius minus the gap.
- **Soft ends:** drafting grids fade out radially, and the moments row fades at both ends. Dimmed moments blur slightly as they fade.
- **Leaders** leave their parts at 45°, or run straight across where a gap is the only clear path.
- **Hovering a note** dims every part tagged with another note.

Verify:
- **Overlaps:** paste `scripts/overlaps.js` into the page and run `btsOverlaps({ overlay: '[data-poster] svg', subject: '[data-poster] [inert] > *, [data-poster] [data-subject-root]' })` for every moment at 1280×800, 1000×760 and 1030×1044. The subject is the component's own root, not the figure round it, or every label counts as on it. It must return nothing. Fix the placement rule, not the one label.
- **Fit:** no page scroll at those sizes, and a resize only changes the scale.
- **Moments:** pick each one. The component, the notes and the curve all follow, and the console stays clean.
- **One value pinned to the source,** such as the poster's duration against the stylesheet.
- **Reduced motion:** the poster tells the truth (no moments row if nothing moves). Check the claim in the specification with reduced motion on: an app-wide rule can override a library's own transitions.
- **Hidden tabs:** an embedded or background preview may not run rAF. Check `document.hidden`, and use headless Playwright for screenshots.

**Done when** every check passes. Say which ones you couldn't run.

## The kit

`assets/kit/` is a React and CSS-modules implementation of everything above. Copy it into the project (`app/specs/kit/` in Next.js, or `src/specs/kit/`) and build each poster as a page beside it. `assets/example/` is a finished poster of a copy button: start from it.

- **`spec-kit.tsx`:**
  - **`SpecPage`:** the poster. Props:
    - `accent`, `name` and `label`;
    - `drawing` (figure 1), `moments`, `notes`, `spec` rows, `fig2` and `units`;
    - `ready`, `error` and `onRetry`;
    - `theme`.
  - **`useTransitionSpec({ fractions, setup })`:** the driver for CSS transitions. `setup(root)` returns:
    - `base` (values at rest);
    - `easing`;
    - `trigger` (the component's own handler);
    - `read` (what to read while it runs);
    - optionally `pick`, to choose among the animations.

    It returns:
    - `m`: the held values, with `elapsed`, `duration`, `easing` and `reduced`;
    - `snapshots`, `selected` and `select`;
    - `ready`, `error` and `retry`;
    - `root`: the ref for the component's wrapper.
  - **Drawing:**
    - `Overlay`;
    - `Dim` and `VDim` (dimensions);
    - `Callout`;
    - `markClass` (line types and hatches);
    - `useCrisp` (hairlines snapped to device pixels);
    - `useDrawingScale`, and `useScreenScale` for a component that has to sit at screen scale 1.
  - **Figures:**
    - `Curve`;
    - `Timeline`;
    - `Moments` (with `crop`, to show just the part that changes).
  - **Reading:**
    - `firstEasing`, `easeAt` and `easeWords`;
    - `stopsOf`, `sampleStops` and `scaleOf` (keyframes: a loop uses one cycle);
    - `within` (box measures to 0.1px);
    - `U` and `Ut` (a number with a lighter unit).
- **`source-kit.ts`:**
  - `useDataState`: drive a component that keeps its state in a data attribute;
  - `startWithout`: put it at its start with no transition;
  - `ms`: parse CSS times.
- **`sheet-states.tsx`:** snapshot capture and the moments row; `oneCamera` (in `spec-kit.tsx`) puts moments captured one at a time in one frame.
- **`sheet-playback.tsx`:** play, pause and slow playback, for posters that offer it.

For scroll, gestures, pointer paths or a JS animation library, write a small driver with the same shape as `useTransitionSpec` that seeks the library's own clock: see [references/drivers.md](references/drivers.md). Outside React, port the layout and conventions; the kit is a reference, not a dependency.

## Deliver

Give the poster's URL, a screenshot of it at 1280×800, and the headline. Then list:
- what was measured;
- anything marked as an estimate;
- any check you couldn't run.
