import { styles } from './codex-card.js';
import { callSubscriptionsAuth } from './subscriptions-rpc.js';
/** Login-less lane; independent presentation using the existing owned card styles and RPC. */
export function createZenCard(React: any, primitives: any, rpc: any, t: (key: string) => string) {
  const h = React.createElement;
  return function ZenCard() {
    const [status, setStatus] = React.useState(null);
    const [failed, setFailed] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const alive = React.useRef(true);
    const refresh = async () => {
      setPending(true);
      try {
        const value = await callSubscriptionsAuth<object>(rpc, 'zenStatus', {});
        if (alive.current) { setStatus(value); setFailed(false); }
      } catch { if (alive.current) setFailed(true); }
      finally { if (alive.current) setPending(false); }
    };
    React.useEffect(() => { alive.current = true; void refresh(); return () => { alive.current = false; }; }, []);
    return h('div', { style: { ...styles.section, maxWidth: 'none', maxInlineSize: 'none', width: '100%', textAlign: 'start' }, 'data-majed-zen-card': true },
      h('div', { style: styles.card },
        h('div', { style: styles.cardHeader }, h('span', { style: styles.name }, 'OpenCode Zen'),
          h(primitives.Button ?? 'button', { type: 'button', disabled: pending, onClick: () => void refresh(), style: { marginInlineStart: 'auto' } }, t('zenRefresh'))),
        h('p', { style: styles.statusLine }, t('zenNoLogin')),
        h('p', { role: 'status', style: styles.statusLine }, failed || status?.registrationError ? t('zenUnavailable') : !status ? t('checking') : status.reachable ? t('zenReachable') : t('zenUnreachable')),
        status ? h('p', { style: styles.statusLine }, `${t('zenModelCount')}: ${status.modelCount} · ${t('zenSource_' + status.source)}`) : null));
  };
}
