import { useEffect, useRef, useState } from 'react'
import { callSubscriptionsAuth } from './subscriptions-rpc.js'

/** Draft/test/save behavior ported from v0.9.12 SubscriptionsSection. Password never pre-fills. */
export function ProxySettings({ rpc, t }: { rpc: any; t: (key: string, params?: any) => string }) {
  const [view, setView] = useState<any>()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<any>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState<any>()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { let alive = true; callSubscriptionsAuth(rpc, 'proxyGet', {}).then(value => { if (alive) setView(value) }).catch(reason => { if (alive) setError(String(reason.message)) }); return () => { alive = false } }, [rpc])
  useEffect(() => { if (!open) return; const previous = document.activeElement; dialog.current?.showModal(); return () => { dialog.current?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() } }, [open])
  const field = (key: string, value: any) => setDraft((old: any) => ({ ...old, [key]: value }))
  const run = async (test: boolean) => {
    if (busy) return
    setBusy(test ? 'test' : 'save'); setError(''); setResult(undefined)
    const password = draft.clearPassword ? { password: null } : draft.password ? { password: draft.password } : {}
    try {
      if (test) setResult(await callSubscriptionsAuth(rpc, 'proxyTest', { proxy: { url: draft.url.trim(), ...(draft.username.trim() ? { username: draft.username.trim() } : {}), ...(draft.password ? { password: draft.password } : {}) } }))
      else {
        const saved = await callSubscriptionsAuth(rpc, 'proxySet', { enabled: draft.enabled, url: draft.url.trim(), username: draft.username, ...password, bypass: draft.bypass.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean) })
        setView(saved); setOpen(false)
      }
    } catch (reason: any) { setError(reason.message) } finally { setBusy('') }
  }
  return <section className="majed-proxy-settings">
    <header><strong>{t('proxyTitle')}</strong> <button type="button" disabled={!view} onClick={() => { setDraft({ ...view, password: '', clearPassword: false, bypass: view.bypass.join(', ') }); setError(''); setResult(undefined); setOpen(true) }}>{t('proxyConfigure')}</button></header>
    <p role="status">{view ? view.error ? t('proxyStatusError', { message: view.error }) : view.enabled ? t('proxyStatusEnabled', { url: view.url }) : t('proxyStatusNone') : t('proxyLoading')}</p>
    {error && !open && <p role="alert">{error}</p>}
    {open && <dialog ref={dialog} aria-labelledby="majed-proxy-title" onCancel={() => setOpen(false)} style={{ maxInlineSize: 560, inlineSize: 'calc(100% - 32px)' }}>
      <h3 id="majed-proxy-title">{t('proxyDialogTitle')}</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <label><input type="checkbox" checked={draft.enabled} onChange={event => field('enabled', event.target.checked)} />{t('proxyEnabled')}</label>
        {['url', 'username', 'password', 'bypass'].map(key => <label key={key} style={{ display: 'grid', gap: 4 }}>{t(`proxy${key[0].toUpperCase()}${key.slice(1)}`)}<input type={key === 'password' ? 'password' : 'text'} autoComplete="off" dir={key === 'url' ? 'ltr' : undefined} value={draft[key]} onChange={event => field(key, event.target.value)} /><small>{t(`proxy${key[0].toUpperCase()}${key.slice(1)}Hint`)}</small></label>)}
        <label><input type="checkbox" checked={draft.clearPassword} onChange={event => field('clearPassword', event.target.checked)} />{t('proxyClearPassword')}</label>
        <p>{t('proxyNote')}</p>
        {error && <p role="alert">{error}</p>}
        {result && <p role="status">{result.ok ? t(result.viaProxy ? 'proxyTestOk' : 'proxyTestOkDirect', { status: String(result.status), ms: String(result.latencyMs) }) : t('proxyTestFail', { message: result.error ?? '' })}</p>}
        <footer><button type="button" disabled={!!busy} onClick={() => void run(true)}>{t(busy === 'test' ? 'proxyTesting' : 'proxyTest')}</button> <button type="button" disabled={!!busy} onClick={() => void run(false)}>{t(busy === 'save' ? 'proxySaving' : 'proxySave')}</button> <button type="button" onClick={() => setOpen(false)}>{t('proxyCancel')}</button></footer>
      </div>
    </dialog>}
  </section>
}
