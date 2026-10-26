// bts-overlaps.js — measure a BTS overlay for crowding instead of judging it by eye.
//
// Paste into the page (console, or a browser tool's evaluate), then call:
//   btsOverlaps()                       // defaults below
//   btsOverlaps({ overlay: '#debug', subject: '.card', leaders: 'path.leader' })
//
// It returns an array of plain-language problems; an empty array means clean. It checks:
//   - overlay text that sits on the subject's box ("on the component")
//   - overlay text over the subject's own text ("over the component")
//   - overlay text over other overlay text
//   - overlay text that runs off the window
//   - leader lines that cut through any text, or that cross each other
//   - concept visuals ([data-bts-concept]: an exploded stack, a magnified detail, a curve drawn away from the
//     component) closer than `conceptGap` (55px) to the subject, with words over them, off screen, or with a
//     leader running through them on its way somewhere else
// Only visible text counts: text clipped by an overflow-hidden ancestor is clipped before measuring, and
// hidden or fully transparent text is skipped.
//
// Run it in every state (rest, mid-motion, each edge case) at more than one window size (for example
// 1280×800 and 1024×768). Overlays re-render every frame, so take a screenshot or wait a frame first if the
// page's frames only run when something drives them.
;(function () {
  function intersect(a, b) {
    const l = Math.max(a.left, b.left)
    const t = Math.max(a.top, b.top)
    return new DOMRect(l, t, Math.max(0, Math.min(a.right, b.right) - l), Math.max(0, Math.min(a.bottom, b.bottom) - t))
  }

  function area(a, b) {
    return (
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    )
  }

  function textBoxes(root, skip) {
    const out = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent && n.textContent.trim()
      if (!text || (skip && skip.contains(n))) continue
      const el = n.parentElement
      // (and not words a note is fading out of, or a note folding away)
      if (!el || el.closest('style, script, [data-bts-ghost], [data-bts-leaving]')) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
      let clip = null
      for (let a = el; a && a !== root.parentElement; a = a.parentElement) {
        const o = getComputedStyle(a)
        if (/hidden|clip|auto|scroll/.test(o.overflow + o.overflowX + o.overflowY)) {
          const ar = a.getBoundingClientRect()
          clip = clip ? intersect(clip, ar) : ar
        }
      }
      range.selectNodeContents(n)
      for (const raw of Array.from(range.getClientRects())) {
        const r = clip ? intersect(raw, clip) : raw
        if (r.width > 0 && r.height > 0) out.push({ text, r })
      }
    }
    return out
  }

  function segmentHitsRect(x1, y1, x2, y2, r) {
    if (r.r <= r.l || r.b <= r.t) return false
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2))
    for (let i = 0; i <= n; i++) {
      const x = x1 + ((x2 - x1) * i) / n
      const y = y1 + ((y2 - y1) * i) / n
      if (x > r.l && x < r.r && y > r.t && y < r.b) return true
    }
    return false
  }

  function segmentsCross(a, b, c, d) {
    const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
    return side(c, d, a) * side(c, d, b) < 0 && side(a, b, c) * side(a, b, d) < 0
  }

  // leader polylines/lines as point lists in viewport coordinates (assumes a full-viewport SVG at 0,0)
  function leaderPoints(el) {
    if (el.tagName.toLowerCase() === 'line') {
      return [[+el.getAttribute('x1'), +el.getAttribute('y1')], [+el.getAttribute('x2'), +el.getAttribute('y2')]]
    }
    return (el.getAttribute('points') || '').trim().split(/\s+/).map((p) => p.split(',').map(Number))
  }

  window.btsOverlaps = function btsOverlaps(options) {
    const o = Object.assign(
      {
        overlay: '[data-bts-overlay]',
        page: 'main',
        // the subject: the page's first child that isn't the overlay or a style tag
        subject: null,
        leaders: 'polyline[data-bts-leader]',
        concept: '[data-bts-concept]',
        conceptGap: 55,
      },
      options || {},
    )
    const overlay = document.querySelector(o.overlay)
    const page = document.querySelector(o.page)
    if (!overlay || !page) return ['overlay is off']
    const subject = o.subject
      ? document.querySelector(o.subject)
      : Array.from(page.children).find((c) => c !== overlay && c.tagName !== 'STYLE')
    const box = subject && subject.getBoundingClientRect()
    const ours = textBoxes(overlay)
    const theirs = textBoxes(page, overlay)
    const found = []

    ours.forEach((a, i) => {
      if (box && area(a.r, box) > 4) found.push(`on the component: "${a.text}"`)
      if (a.r.left < 0 || a.r.top < 0 || a.r.right > innerWidth || a.r.bottom > innerHeight) found.push(`off screen: "${a.text}"`)
      for (const b of theirs) if (area(a.r, b.r) > 4) found.push(`over the component: "${a.text}" × "${b.text}"`)
      for (const b of ours.slice(i + 1)) if (b.text !== a.text && area(a.r, b.r) > 4) found.push(`overlay × overlay: "${a.text}" × "${b.text}"`)
    })

    const leaders = Array.from(overlay.querySelectorAll(o.leaders)).map(leaderPoints)
    // concept visuals: measured by everything drawn inside them, since a tilt or a scale throws parts past their box,
    // each part cut to any ancestor inside the visual that hides its overflow (a clipped copy counts as its slice)
    for (const el of Array.from(overlay.querySelectorAll(o.concept))) {
      const rs = [el, ...Array.from(el.querySelectorAll('*'))]
        .map((e) => {
          let r = e.getBoundingClientRect()
          for (let a = e === el ? null : e.parentElement; a; a = a === el ? null : a.parentElement) {
            const cs = getComputedStyle(a)
            if (/hidden|clip|auto|scroll/.test(cs.overflowX + cs.overflowY)) r = intersect(r, a.getBoundingClientRect())
          }
          return r
        })
        .filter((r) => r.width > 0 && r.height > 0)
      if (!rs.length) continue
      const d = { left: Math.min(...rs.map((r) => r.left)), top: Math.min(...rs.map((r) => r.top)), right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) }
      if (box) {
        const gap = Math.hypot(Math.max(0, d.left - box.right, box.left - d.right), Math.max(0, d.top - box.bottom, box.top - d.bottom))
        if (gap < o.conceptGap - 1) found.push(`concept visual ${Math.round(gap)}px from the component (keep ${o.conceptGap})`)
      }
      if (d.left < 0 || d.top < 0 || d.right > innerWidth || d.bottom > innerHeight) found.push('concept visual off screen')
      const own = textBoxes(el)
      for (const t of ours.concat(theirs))
        if (!own.some((w) => w.r.x === t.r.x && w.r.y === t.r.y) && area(t.r, d) > 4) found.push(`words over the concept visual: "${t.text}"`)
      // (a leader that ends in it is pointing at it)
      for (const pts of leaders) {
        const end = pts[pts.length - 1]
        if (end[0] > d.left - 8 && end[0] < d.right + 8 && end[1] > d.top - 8 && end[1] < d.bottom + 8) continue
        if (pts.slice(1).some((q, i) => segmentHitsRect(pts[i][0], pts[i][1], q[0], q[1], { l: d.left, t: d.top, r: d.right, b: d.bottom }))) found.push('leader crosses the concept visual')
      }
    }

    const texts = theirs.concat(ours)
    for (const pts of leaders) {
      for (let i = 0; i < pts.length - 1; i++) {
        for (const t of texts) {
          const r = { l: t.r.left + 2, t: t.r.top + 2, r: t.r.right - 2, b: t.r.bottom - 2 }
          if (segmentHitsRect(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r)) {
            found.push(`leader crosses: "${t.text}"`)
            break
          }
        }
      }
    }
    const segs = leaders.flatMap((pts, k) => pts.slice(1).map((p, i) => ({ k, a: pts[i], b: p })))
    for (let i = 0; i < segs.length; i++)
      for (let j = i + 1; j < segs.length; j++)
        if (segs[i].k !== segs[j].k && segmentsCross(segs[i].a, segs[i].b, segs[j].a, segs[j].b)) found.push('two leaders cross')

    return Array.from(new Set(found))
  }
})()
