# interface-bts

An agent skill that draws a **spec poster** of an interaction in your project: the real component paused at its key moments, with **dimensions**, the **easing curve**, a row of **moments** and a **specification**. Every value is read from the running component.

## Install

```bash
npx skills add nomanjack/interface-bts
```

## Use

Run it in your agent and name the interaction:

```text
/interface-bts the dropdown in components/menu.tsx
```

It studies the component, agrees the moments with you, then builds the poster as a page in your project and checks it for overlaps by measurement.

## What's inside

- `SKILL.md`: the workflow and the poster's rules.
- `references/drafting.md`: dimension, line-type and view conventions.
- `references/drivers.md`: driving gestures, pointer paths and libraries that fight a scaled poster.
- `assets/kit/`: a React and CSS-modules kit for building posters.
- `assets/example/`: a finished poster of a copy button.
- `scripts/overlaps.js`: the overlap check.

Posters are A4 portrait and scale to fit; they follow your app's own theme.
