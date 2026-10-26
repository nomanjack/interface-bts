# Drivers and subjects that fight the poster

`useTransitionSpec` covers a component animated by CSS transitions or keyframes. Everything else needs a small
driver of your own, and some components behave differently once they're inside a scaled poster. These are the cases
met so far, and what to do about each.

## Writing a custom driver

Write one when the interaction is a gesture, a pointer path, a scroll position, or a JS animation library's clock.
Give it the same shape as `useTransitionSpec`: `root`, `m` (the held values), `ready`, `snapshots`, `selected`,
`select`.

- **Each moment is a run, not a time.** For each moment, reset the component (through its own API, with any
  transition finished), drive it there, then copy it with `captureEach(root, 1, () => value)`. Put the copies in one
  camera afterwards with `oneCamera(shots)`.
- **Hold a released moment part way.** After a release, wait a frame or two for the component's own transition or
  animation to start, then `pause()` it and set `currentTime` to a fraction of its duration.
- **Wait for the thing to happen; never assume a time.** Poll (a few ms at a time, with a generous cap) until the
  menu closes or the transition exists, and record when it did. If it never happens, report that instead.
- **Cancel stale runs.** Number each run. When `select` starts a new one, the old one returns without writing state.
- **Compare against the real thing once.** Drive the live component with a real browser mouse (Playwright's
  `page.mouse`) and check that your synthetic run gives the same result and roughly the same timing.

## Synthetic input that components accept

- **Pointer paths:** send `pointerout` to the element being left (`relatedTarget`: the one entered),
  `pointerover` to the one entered, then `pointermove`. React builds `onPointerEnter` and `onPointerLeave` from
  those pairs; a bare `pointerleave` is ignored. Move in steps of about 2px, as a mouse samples: the exit point of a
  coarse path is far from where a real pointer would leave.
- **Pointer type:** Radix menus act only on `pointerType: 'mouse'`.
- **Pointer capture:** `setPointerCapture` throws for a pointer id with no real pointer behind it, and a press
  handler that calls it stops half way (Vaul then reads a start position of 0 and the drawer jumps away). While the
  driver runs, let capture calls for its own pointer id through as no-ops; leave every other id alone, and put the
  originals back on unmount.
- **Hover:** if a component expands on `onMouseEnter`, a synthetic `mouseover` may not reach it; `mousemove` on the
  same element often does (Sonner's toaster expands on either).
- **Typing:** make the input controllable (its value through state) and set it; then wait for whatever the component
  measures (cmdk writes its list height a frame or two later) before looking for animations.

## Subjects that fight the poster

- **Fixed to the window:** toasters and sheets (Sonner, Vaul) position themselves `fixed`. Give them a box the size
  of their corner of the screen and override their position to `absolute` in it, with a comment saying why.
- **Placed by floating-ui** (Radix menus, popovers, tooltips): floating-ui misplaces content inside a box scaled by
  CSS `zoom`. Scale these with a transform instead, in an outer box sized to the scaled footprint:

  ```tsx
  <div className={styles.subject} style={{ width: W * Z, height: H * Z }}>
    <div style={{ transform: `scale(${Z})`, transformOrigin: '0 0', width: W }}>
      <div ref={root} style={{ display: 'inline-block' }}><Subject /></div>
    </div>
  </div>
  ```

  It also places once and only re-places on resize or scroll: after the poster lays out or rescales, dispatch a
  `resize` event before measuring.
- **Measures itself on screen:** a component that compares its `getBoundingClientRect()` size with distances in its
  own px (Vaul's close threshold, swipe and drag thresholds) decides differently when scaled. Draw it at screen scale
  1: `const Z = useScreenScale(root)`, with the transform box above. Say so in the title block ("drawn at screen
  scale 1").
- **Moves focus:** menus highlight items, and close submenus, by moving focus. The kit keeps an unready poster
  focusable (transparent, not hidden), but a driver that captures moments before `ready` must still run with the
  poster on screen: set ready first, then capture.
- **Portals:** render menus, toasters and dialogs in place (no portal, or a `container` inside the subject), so
  the moments copy them with the rest.
- **Not inert:** a component that needs focus can't sit under `inert`. Block real input with `pointer-events: none`
  on its wrapper instead, and mark the wrapper `data-subject-root` for the overlap check.

## Theme

Read the app's theme before drawing anything, and draw nothing until it's known: a poster that starts light and
flips to dark remounts mid-capture. Key the poster on the theme so a change redraws it, and its moments are copied
again in the new colours. Components with their own theme prop (Sonner's toaster) take the app's theme too.
