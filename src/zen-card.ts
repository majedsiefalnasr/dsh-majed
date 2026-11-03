import {
  controlCss,
  providerDisclosure,
  providerStatus,
  styles,
} from './codex-card.js';
import { callSubscriptionsAuth } from './subscriptions-rpc.js';
/** Login-less lane; independent presentation using the existing owned card styles and RPC. */
export function createZenCard(
  React: any,
  primitives: any,
  rpc: any,
  t: (key: string) => string,
) {
  const h = React.createElement;
  return function ZenCard() {
    const [status, setStatus] = React.useState(null);
    const [failed, setFailed] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);
    const alive = React.useRef(true);
    const refresh = async () => {
      setPending(true);
      try {
        const value = await callSubscriptionsAuth<object>(rpc, 'zenStatus', {});
        if (alive.current) {
          setStatus(value);
          setFailed(false);
        }
      } catch {
        if (alive.current) setFailed(true);
      } finally {
        if (alive.current) setPending(false);
      }
    };
    React.useEffect(() => {
      alive.current = true;
      void refresh();
      return () => {
        alive.current = false;
      };
    }, []);
    const enabled = status?.enabled !== false;
    const toggle = async () => {
      setPending(true);
      try {
        const value = await callSubscriptionsAuth<object>(
          rpc,
          'setZenEnabled',
          { enabled: !enabled },
        );
        if (alive.current) {
          setStatus(value);
          setFailed(false);
        }
      } catch {
        if (alive.current) setFailed(true);
      } finally {
        if (alive.current) setPending(false);
      }
    };
    const state = !enabled
      ? 'warning'
      : pending || (!status && !failed)
        ? 'checking'
        : failed || status?.registrationError
          ? 'error'
          : status.reachable
            ? 'ready'
            : 'warning';
    const label =
      state === 'checking'
        ? 'checking'
        : state === 'error'
          ? 'zenUnavailable'
          : state === 'ready'
            ? 'zenReachable'
            : 'zenUnreachable';
    return h(
      'div',
      {
        style: {
          ...styles.section,
          maxWidth: 'none',
          maxInlineSize: 'none',
          width: '100%',
          textAlign: 'start',
        },
        className: 'majed-subscriptions-settings',
        'data-majed-zen-card': true,
      },
      h('style', null, controlCss),
      h(
        'div',
        { style: styles.card },
        h(
          'div',
          { style: styles.cardHeader },
          providerStatus(h, t, state, !enabled ? 'zenDisabled' : label),
          h(
            'div',
            { className: 'majed-provider-identity' },
            h('span', { style: styles.name }, 'OpenCode Zen'),
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'switch',
              'aria-checked': enabled,
              'aria-label': t('zenEnabled'),
              disabled: pending || !status,
              onClick: () => void toggle(),
              style: {
                padding: 2,
                height: 20,
                minHeight: 20,
                minWidth: 36,
                width: 36,
                flexShrink: 0,
                border: 0,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                background: enabled
                  ? 'var(--dsw-alias-brand-primary)'
                  : 'var(--dsw-alias-interactive-bg-hover)',
              },
            },
            h('span', {
              'aria-hidden': true,
              style: {
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: enabled
                  ? 'var(--dsw-alias-bg-base)'
                  : 'var(--dsw-alias-label-secondary)',
                marginInlineStart: enabled ? 'auto' : 0,
                marginInlineEnd: enabled ? 0 : 'auto',
              },
            }),
          ),
          providerDisclosure(h, t, 'OpenCode Zen', expanded, () =>
            setExpanded(!expanded),
          ),
        ),
        expanded
          ? h(
              'div',
              { style: { ...styles.usage, gap: 8 } },
              h(
                'p',
                { role: 'status', style: styles.statusLine },
                t(!enabled ? 'zenDisabled' : label),
              ),
              status
                ? h(
                    'p',
                    { style: styles.statusLine },
                    `${t('zenModelCount')}: ${status.modelCount} · ${t('zenSource_' + status.source)}`,
                  )
                : null,
              h(
                'div',
                { style: { ...styles.actions, justifyContent: 'flex-end' } },
                h(
                  primitives.Button ?? 'button',
                  {
                    type: 'button',
                    disabled: pending,
                    onClick: () => void refresh(),
                  },
                  t('zenRefresh'),
                ),
              ),
            )
          : null,
      ),
    );
  };
}
