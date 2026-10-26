'use client'

import { useRef } from 'react'
import { SourceCopy } from './source-copy'
import { type SetController, startWithout } from '../kit/source-kit'
import { Callout, Curve, Dim, easeAt, easeWords, type Held, markClass, Moments, Overlay, r1, SpecPage, Timeline, U, useCrisp, useDrawingScale, useTransitionSpec, Ut } from '../kit/spec-kit'
import styles from '../kit/spec.module.css'

// The copy button, held 40ms into its swap: the copy icon half gone and soft, the check half arrived.

type Base = { size: number; icon: number; radius: number; blur: number; scale: number }
type Read = { outO: number; inO: number; outB: number; inB: number }
const FRACTIONS = [0.08, 0.2, 1] as const

const blurOf = (f: string) => parseFloat(f.match(/blur\(([^)]+)\)/)?.[1] ?? '0')

function Drawing({ m, z: Z }: { m: Held<Base, Read>; z: number }) {
  const { ref, snap } = useCrisp()
  const S = m.size * Z, i = m.icon * Z, o = (S - i) / 2
  const box = (className: string, part?: string) => <rect x={snap(o, 'x')} y={snap(o, 'y')} width={snap(o + i, 'x') - snap(o, 'x')} height={snap(o + i, 'y') - snap(o, 'y')} className={className} data-part={part} />
  return (
    <Overlay w={S} h={S} svgRef={ref}>
      {/* the one spot both icons share, and the button round it */}
      {box(markClass.reference, 'n1 n2')}
      <rect x={0.5} y={0.5} width={S - 1} height={S - 1} rx={m.radius * Z} className={`${markClass.mark} ${markClass.hlOnly} ${markClass.show1}`} />
      {box(`${markClass.mark} ${markClass.hlOnly} ${markClass.show2}`)}
      <Dim snap={snap} x1={0} x2={S} y={S + 21} from={S} label={m.size} below part="none" />
      <Dim snap={snap} x1={o} x2={o + i} y={-21} from={o} label={m.icon} part="n1" />
      <Callout n={1} x={o} y={o + i * 0.3} dir="w" len={o + 34} />
      <Callout n={2} x={o + i} y={o + i * 0.7} dir="e" len={o + 34} />
    </Overlay>
  )
}

export function CopySpecSheet() {
  const button = useRef<HTMLButtonElement>(null)
  const controller = useRef<SetController | null>(null)
  const drv = useTransitionSpec<Base, Read>({
    fractions: FRACTIONS,
    setup: (root) => {
      const src = root.querySelector<HTMLElement>('[data-source-copy]')!
      const out = src.querySelector<SVGElement>('[data-copy-icon]')!, inn = src.querySelector<SVGElement>('[data-check-icon]')!
      startWithout([out, inn], () => controller.current!.set(false))
      const c = getComputedStyle(inn)
      return {
        base: { size: src.offsetWidth, icon: 16, radius: parseFloat(getComputedStyle(src).borderTopLeftRadius), blur: blurOf(c.filter), scale: new DOMMatrixReadOnly(c.transform).a },
        easing: getComputedStyle(out).transitionTimingFunction.split(',')[0].match(/cubic-bezier\([^)]+\)/)?.[0] ?? c.transitionTimingFunction.match(/cubic-bezier\([^)]+\)/)?.[0] ?? 'ease',
        trigger: () => controller.current!.set(true),
        read: () => {
          const a = getComputedStyle(out), b = getComputedStyle(inn)
          return { outO: parseFloat(a.opacity), inO: parseFloat(b.opacity), outB: blurOf(a.filter), inB: blurOf(b.filter) }
        },
      }
    },
  })
  const Z = useDrawingScale(7)
  const m = drv.m
  const ease = (t: number) => (m ? easeAt(Math.min(1, t / m.duration), m.easing) : 0)
  return (
    <SpecPage
      accent="copy" label="Copy button specification" name="Copy button"
      ready={drv.ready} error={drv.error} onRetry={drv.retry}
      drawing={<>
        <div className={styles.subject} style={{ zoom: Z }} inert><div ref={drv.root} style={{ display: 'inline-block' }}><SourceCopy rootRef={button} controllerRef={controller} /></div></div>
        {m && !m.reduced && <Drawing m={m} z={Z} />}
      </>}
      moments={m && !m.reduced && <Moments snapshots={drv.snapshots} labels={['Copy', 'Swapping', 'Copied']} selected={drv.selected} onSelect={drv.select}
        timeline={<Timeline value={m.elapsed} max={m.duration} f={ease} marks={FRACTIONS.map((f) => f * m.duration)} selected={drv.selected} label={<Ut v={m.elapsed} u="ms" />} />} />}
      notes={[
        { part: 'n1', head: 'The old icon dissolves.', body: <>It fades out while blurring to {m?.blur ?? 4}px and shrinking to {m ? Math.round(m.scale * 100) : 80}%, so it goes soft rather than popping off. Now: {m ? Math.round(m.outO * 100) : 0}% there, {m ? r1(m.outB) : 0}px blur.</> },
        { part: 'n2', head: 'The new one arrives sharp.', body: 'The check does the reverse on the same clock, in the same spot. They cross in the middle, so the button is never empty.' },
      ]}
      spec={m ? [
        ['Trigger', 'Click', 'none'],
        ['Animates', 'opacity, blur, scale', 'n1'],
        ['Button', <><U v={m.size} u="px" />, radius <U v={m.radius} u="px" /></>, 'none'],
        ['Icons', <><U v={m.icon} u="px" />, one spot</>, 'n2'],
        ['Duration', m.reduced ? 'None' : <U v={m.duration} u="ms" />, 'curve'],
        ['Easing', m.reduced ? 'None' : easeWords(m.easing), 'curve'],
        ['Reduced motion', 'Swaps without a transition', 'none'],
      ] : []}
      fig2={m && !m.reduced ? { node: <Curve x={m.elapsed} max={m.duration} series={[{ f: ease }, { f: (t) => 1 - ease(t), className: styles.easeAlt }]} end={<Ut v={m.duration} u="ms" />} unit="ms" /> } : undefined}
      units={`Dimensions in px at 1×, drawn at ${Z}×`}
    />
  )
}
