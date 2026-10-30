// Adapted from V1ki/dsh-plugin-subscriptions v0.9.12 (b802311) src/client/SpeedSelect.tsx, MIT; see src/PROVENANCE.md.
// Local changes: owned `majed-subscriptions.*` RPC helper, majed class/CSS-variable names, structural prop types,
// logical (RTL-safe) alignment. Behavior is otherwise the reference's.
/**
 * Codex Speed toggle: one small control in the composer's right tool row
 * (`conversation.input.right`), switching the session between standard routing
 * and the fast (priority) service tier — the Codex desktop app's Speed menu.
 * The choice is per session and lives in the node half (in-memory); this
 * component holds only viewing state. The control renders nothing until the
 * first load proves the session's current model is a codex model whose catalog
 * advertises the fast tier.
 *
 * Every color resolves through a `--dsw-alias-*` design token and every
 * user-visible string goes through the locale `t` of the
 * 'settings.subscriptions' namespace, same as the settings section.
 */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { callSubscriptionsAuth } from '../settings/subscriptions-rpc.js'
import { subscriptionChromeCss } from '../settings/provider-settings-styles.js'
import en from '../../locale/en.json' with { type: 'json' }
import type { ModelDirectoriesLike, Translate } from '../usage-badge/usage-types.js'
import type { ConnectionLike } from '../usage-badge/slot-types.js'

export type { ModelDirectoriesLike }

/** One session's speed choice: standard routing or the fast (priority) tier. */
export type SpeedTier = 'standard' | 'fast'

/** `speed` endpoint value, mirrored from the node half. */
export interface SpeedState {
  tier: SpeedTier
  fastModels: string[]
}

/** What {@link SpeedSelect} renders from: visibility plus the current tier. */
export interface SpeedSelectState {
  visible: boolean
  tier: SpeedTier
}

/** Injected dependencies of {@link SpeedSelect} (slot `inject`, session-bound). */
export interface SpeedSelectInjected {
  /** Load the session's speed state; `visible` false keeps the control hidden. */
  loadSpeed: () => Promise<SpeedSelectState>
  /** Set the session's speed tier; resolves false when the write failed. */
  setSpeed: (tier: SpeedTier) => Promise<boolean>
}

/**
 * Props delivered by the slot outlet: the framework session kit and InputZone
 * owner share (unused — everything arrives session-bound through the inject
 * face), the injected callbacks, and the locale seat.
 */
export type SpeedSelectProps = Partial<SpeedSelectInjected> & { t?: Translate }

/**
 * The `loadSpeed` half of the inject face: the plugin's own speed state plus
 * the host's current model selection (the visibility gate). A model-RPC
 * failure throws rather than answering "hidden" — the caller keeps its last
 * known state, so a transient failure never locks the toggle away.
 *
 * `sessionId` is a plain string: slot and command contexts brand it through
 * different dsh-session copies, and only the service boundary needs one.
 *
 * `models` resolves lazily per call: the ui-model-selection service may
 * register after this plugin applies, and a shell without it (no model seat
 * at all) simply keeps the toggle hidden.
 */
export function createSpeedLoader(
  connection: ConnectionLike,
  models: () => ModelDirectoriesLike | undefined,
  sessionId: string,
): SpeedSelectInjected['loadSpeed'] {
  return async () => {
    const directories = models()
    const current = directories === undefined ? null : (await directories.directoryFor(sessionId).load()).current
    const state = await callSubscriptionsAuth<SpeedState>(connection.rpc, 'speed', {
      sessionId, ...(current?.provider === 'codex' ? { model: current.model } : {}),
    })
    const visible = current !== null && current.provider === 'codex'
      && state.fastModels.includes(current.model)
    return { visible, tier: state.tier }
  }
}

/** The `setSpeed` half of the inject face: boolean outcome for the component's busy state. */
export function createSpeedSetter(
  connection: ConnectionLike,
  sessionId: string,
): SpeedSelectInjected['setSpeed'] {
  return tier => callSubscriptionsAuth(connection.rpc, 'setSpeed', { sessionId, tier })
    .then(() => true, () => false)
}

/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate(key: string): string {
  return (en.subscriptions as Record<string, string>)[key] ?? key
}

const TIERS: readonly SpeedTier[] = ['standard', 'fast']

/**
 * The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
 * that opens a two-row menu (standard/fast with descriptions, check mark on
 * the current tier). Mount and every open reload the host state so a model
 * switch made since the last open self-corrects.
 */
/** How often the control re-reads the host state (model switches arrive only by asking). */
const POLL_INTERVAL_MS = 3000

/**
 * The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
 * that opens a two-row menu (standard/fast with descriptions, check mark on
 * the current tier). The host pushes nothing on a model switch, so the
 * control re-reads on a slow poll with a single-flight guard; a failed read
 * keeps the last known state, so a transient RPC failure can never lock the
 * toggle away (the earlier mount-only load had no recovery path).
 */
export function SpeedSelect({ loadSpeed, setSpeed, t }: SpeedSelectProps) {
  const translate = t ?? fallbackTranslate
  const [state, setState] = useState<SpeedSelectState | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  // The inject face may be re-evaluated (new callback identities) on re-render;
  // the poll effect mounts once and reads through this ref, so identity churn
  // neither resets the interval nor multiplies in-flight loads.
  const loadRef = useRef(loadSpeed)
  loadRef.current = loadSpeed

  useEffect(() => {
    if (loadRef.current === undefined) return
    let cancelled = false
    let inflight = false
    const reload = (): void => {
      const load = loadRef.current
      if (load === undefined || inflight) return
      inflight = true
      void load().then(
        (loaded) => { if (!cancelled) setState(loaded) },
        () => { /* keep the last known state; the next tick retries */ },
      ).finally(() => { inflight = false })
    }
    reload()
    const timer = setInterval(reload, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: MouseEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => { document.removeEventListener('mousedown', closeOutside) }
  }, [open])

  if (loadSpeed === undefined || setSpeed === undefined || state === null || !state.visible) {
    return null
  }

  const choose = (tier: SpeedTier): void => {
    if (busy) return
    if (tier === state.tier) {
      setOpen(false)
      return
    }
    setBusy(true)
    void setSpeed(tier).then((ok) => {
      setBusy(false)
      if (ok) {
        setState({ visible: true, tier })
        setOpen(false)
      }
    })
  }

  const show = (): void => {
    setOpen(true)
    const load = loadRef.current
    if (load === undefined) return
    void load().then(setState, () => { /* keep showing the last good state */ })
  }

  const tierName = (tier: SpeedTier): string =>
    translate(tier === 'fast' ? 'speedFast' : 'speedStandard')
  const tierDescription = (tier: SpeedTier): string =>
    translate(tier === 'fast' ? 'speedFastDescription' : 'speedStandardDescription')
  const triggerLabel = `${translate('speed')} · ${tierName(state.tier)}`

  return (
    <div
      ref={rootRef}
      className="majed-subscription-speed"
      style={styles.root}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          setOpen(false)
        }
      }}
    >
      <style>{subscriptionChromeCss}</style>
      {open && (
        <div style={styles.menu} role="menu" aria-label={translate('speed')}>
          {TIERS.map(tier => (
            <button
              key={tier}
              type="button"
              role="menuitemradio"
              aria-checked={tier === state.tier}
              style={styles.item}
              disabled={busy}
              onClick={() => { choose(tier) }}
            >
              <span style={styles.itemCheck}>{tier === state.tier ? '✓' : ''}</span>
              <span style={styles.itemText}>
                <span style={styles.itemName}>{tierName(tier)}</span>
                <span style={styles.itemDescription}>{tierDescription(tier)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        style={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        title={triggerLabel}
        disabled={busy}
        onClick={() => {
          if (open) setOpen(false)
          else show()
        }}
      >
        {triggerLabel}
      </button>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  root: { position: 'relative', display: 'inline-flex' },
  trigger: {
    border: '0.5px solid var(--dsw-alias-border-l3)', borderRadius: 'var(--dsw-radius-sm, 8px)',
    background: 'var(--majed-subscription-speed-hover, transparent)', color: 'var(--dsw-alias-label-secondary)',
    font: 'inherit', fontSize: 12, lineHeight: '18px',
    padding: '2px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  menu: {
    position: 'absolute', bottom: '100%', insetInlineEnd: 0, marginBottom: 4,
    minWidth: 180, padding: 4, zIndex: 20,
    background: 'var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2))', border: 0,
    boxShadow: 'var(--dsw-elevation-prominent)', borderRadius: 'var(--dsw-radius-lg, 16px)', display: 'flex', flexDirection: 'column', gap: 2,
  },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: 6, width: '100%',
    border: 'none', borderRadius: 'var(--dsw-radius-sm, 8px)', background: 'var(--majed-subscription-speed-hover, transparent)',
    padding: '6px 8px', cursor: 'pointer', font: 'inherit', textAlign: 'start',
  },
  itemCheck: {
    width: 14, flexShrink: 0, fontSize: 12, lineHeight: '18px',
    color: 'var(--dsw-alias-label-primary)',
  },
  itemText: { display: 'flex', flexDirection: 'column' },
  itemName: { fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' },
  itemDescription: { fontSize: 11, lineHeight: '16px', color: 'var(--dsw-alias-label-tertiary)' },
}
