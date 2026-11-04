// Independently authored global catalog UI; reference same-origin API transport.
export function applySkills(root: any): void {
  const fail = (error: unknown) =>
    // A failing optional Component must never disturb sibling registrations.
    console.error('dsh-majed: Skill manager setup failed', error);
  try {
    Promise.resolve(
      root.inject(['slots', 'locale'], (ctx: any) => {
        try {
          setupSkills(ctx, fail);
        } catch (error) {
          fail(error);
        }
      }),
    ).catch(fail);
  } catch (error) {
    fail(error);
  }
}

function setupSkills(ctx: any, fail: (error: unknown) => void): void {
  {
    const effect = (run: () => any, label: string) => {
      const result = ctx.effect(run, label);
      Promise.resolve(result).catch(fail);
      return result;
    };
    const React = require('react');
    const h = React.createElement;
    const dictionaries = {
      en: {
        title: 'Skill manager',
        search: 'Search skills',
        all: 'All sources',
        any: 'All statuses',
        enabled: 'Enabled',
        disabled: 'Disabled',
        invalid: 'Invalid',
        shadowed: 'Shadowed',
        retry: 'Retry',
        loading: 'Loading skills…',
        error: 'Unable to load skills',
        details: 'Details',
        close: 'Close',
        empty: 'No matching skills',
        source: 'Source',
        toggle: 'Toggle',
        diagnostics: 'Diagnostics',
        blocked: 'Blocked by author',
        copyText: 'Copy text',
        copyCopy: 'Toggle copy',
        toggleSource: 'Toggle source',
        modelInvocation: 'Model invocation',
        userInvocation: 'User invocation',
        allowed: 'Allowed',
        denied: 'Denied',
        shadowedBy: 'Shadowed by',
        reloadState: 'Reload state',
        stateLocked: 'Skill state is invalid; changes are locked',
        'diag.discovery-truncated': 'Discovery stopped at the safe limit',
        'diag.source-unavailable': 'Source unavailable',
        'diag.unreadable-entries': 'Some entries could not be read',
        'diag.unreadable-skill': 'Skill could not be read',
        'diag.oversized-skill': 'Skill exceeds the size limit',
        'diag.empty-skill': 'Skill file is empty',
        'diag.invalid-frontmatter': 'Invalid frontmatter',
        'diag.invalid-yaml': 'Invalid YAML',
        'diag.invalid-metadata': 'Invalid metadata',
        'diag.invalid-policy': 'Invalid invocation policy',
        'diag.linked-outside-root':
          'Skill document is linked from outside its source',
        'diag.state-invalid':
          'Invalid skill state; managed skills are disabled',
      },
      ar: {
        title: 'مدير المهارات',
        search: 'البحث عن مهارات',
        all: 'كل المصادر',
        any: 'كل الحالات',
        enabled: 'مفعلة',
        disabled: 'معطلة',
        invalid: 'غير صالحة',
        shadowed: 'محجوبة بنسخة أعلى أولوية',
        retry: 'إعادة المحاولة',
        loading: 'جارٍ تحميل المهارات…',
        error: 'تعذر تحميل المهارات',
        details: 'التفاصيل',
        close: 'إغلاق',
        empty: 'لا توجد مهارات مطابقة',
        source: 'المصدر',
        toggle: 'تبديل',
        diagnostics: 'التشخيصات',
        blocked: 'محجوبة بقيد المؤلف',
        copyText: 'نسخ النص',
        copyCopy: 'تبديل النسخة',
        toggleSource: 'تبديل المصدر',
        modelInvocation: 'استدعاء النموذج',
        userInvocation: 'استدعاء المستخدم',
        allowed: 'مسموح',
        denied: 'مرفوض',
        shadowedBy: 'محجوبة بواسطة',
        reloadState: 'إعادة قراءة الحالة',
        stateLocked: 'حالة المهارات غير صالحة؛ التغييرات مقفلة',
        'diag.discovery-truncated': 'توقف الاكتشاف عند الحد الآمن',
        'diag.source-unavailable': 'المصدر غير متاح',
        'diag.unreadable-entries': 'تعذرت قراءة بعض العناصر',
        'diag.unreadable-skill': 'تعذرت قراءة المهارة',
        'diag.oversized-skill': 'حجم المهارة يتجاوز الحد',
        'diag.empty-skill': 'ملف المهارة فارغ',
        'diag.invalid-frontmatter': 'بيانات وصفية غير صالحة',
        'diag.invalid-yaml': 'بيانات YAML غير صالحة',
        'diag.invalid-metadata': 'بيانات وصفية غير صالحة',
        'diag.invalid-policy': 'سياسة استدعاء غير صالحة',
        'diag.linked-outside-root': 'وثيقة المهارة مرتبطة من خارج مصدرها',
        'diag.state-invalid': 'حالة المهارات غير صالحة؛ المهارات المُدارة معطلة',
      },
    };
    effect(
      () => ctx.locale.register('majed.skills', dictionaries),
      'majed-skills dictionaries',
    );
    const t = ctx.locale.bind('majed.skills');
    const isArabic = () => ctx.locale.language?.getSnapshot?.() === 'ar';
    const sourceLabel = (source: any) =>
      source.label ?? source.name ?? source.id;
    const diagnosticText = (item: any) => {
      const label = (dictionaries.en as Record<string, string>)[
        `diag.${item.code}`
      ]
        ? t(`diag.${item.code}`)
        : (item.message ?? item.code);
      const where = item.params?.path ?? item.params?.source;
      return where ? `${label} — ${where}` : label;
    };
    const call = async (body: any, signal?: AbortSignal) => {
      const base = new URL(document.baseURI);
      if (!base.pathname.endsWith('/')) base.pathname += '/';
      const response = await fetch(new URL('api/majed-skills.catalog', base), {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-majed-skills': '1' },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    };
    function Section() {
      const [data, setData] = React.useState(null),
        [error, setError] = React.useState(false),
        [query, setQuery] = React.useState(''),
        [source, setSource] = React.useState(''),
        [status, setStatus] = React.useState(''),
        [detail, setDetail] = React.useState(null),
        [detailError, setDetailError] = React.useState(false);
      const dialog = React.useRef(null);
      React.useEffect(() => {
        if (!detail) return;
        const previous = document.activeElement as HTMLElement | null;
        dialog.current?.focus?.();
        return () => previous?.focus?.();
      }, [detail]);
      const lifetime = React.useRef(new AbortController());
      const busy = React.useRef(false);
      const controller = React.useRef(null);
      const load = () => {
        controller.current?.abort();
        controller.current = new AbortController();
        setError(false);
        return call({ action: 'list' }, controller.current.signal)
          .then(setData)
          .catch((error: any) => {
            if (error.name !== 'AbortError') setError(true);
          });
      };
      React.useEffect(() => {
        void load();
        return () => {
          controller.current?.abort();
          lifetime.current.abort();
        };
      }, []);
      const toggle = async (kind: string, id: string, enabled: boolean) => {
        if (busy.current || lifetime.current.signal.aborted) return;
        busy.current = true;
        try {
          await call(
            { action: 'toggle', kind, id, enabled },
            lifetime.current.signal,
          );
          if (!lifetime.current.signal.aborted) await load();
        } catch {
          if (!lifetime.current.signal.aborted) setError(true);
        } finally {
          busy.current = false;
        }
      };
      const copyStatus = (copy: any) =>
        copy.metadataValid === false || !copy.policyValid
          ? 'invalid'
          : !copy.eligible
            ? 'disabled'
            : copy.shadowedBy
              ? 'shadowed'
              : copy.author &&
                  !copy.author.modelInvocable &&
                  !copy.author.userInvocable
                ? 'blocked'
                : 'enabled';
      const copies = (data?.copies ?? []).filter(
        (copy: any) =>
          (!source || copy.source === source) &&
          (!query ||
            `${copy.name} ${copy.description} ${copy.path}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!status || copyStatus(copy) === status),
      );
      return h(
        'section',
        {
          'data-majed-skills': true,
          dir: isArabic() ? 'rtl' : undefined,
        },
        h('h2', null, t('title')),
        h('input', {
          'aria-label': t('search'),
          placeholder: t('search'),
          value: query,
          onChange: (e: any) => setQuery(e.target.value),
        }),
        h(
          'select',
          {
            'aria-label': t('source'),
            value: source,
            onChange: (e: any) => setSource(e.target.value),
          },
          h('option', { value: '' }, t('all')),
          ...(data?.sources ?? []).map((x: any) =>
            h('option', { key: x.id, value: x.id }, sourceLabel(x)),
          ),
        ),
        h(
          'select',
          {
            'aria-label': t('any'),
            value: status,
            onChange: (e: any) => setStatus(e.target.value),
          },
          ...['', 'enabled', 'disabled', 'invalid', 'shadowed', 'blocked'].map(
            (x) => h('option', { key: x, value: x }, t(x || 'any')),
          ),
        ),
        error
          ? h(
              'div',
              { role: 'alert' },
              t('error'),
              h(
                'button',
                {
                  onClick: () => call({ action: 'reload' }).then(setData, load),
                },
                t('retry'),
              ),
            )
          : !data
            ? h('p', { role: 'status' }, t('loading'))
            : h(
                React.Fragment,
                null,
                ...(data.sources ?? [])
                  .filter((x: any) => !source || x.id === source)
                  .map((x: any) =>
                    h(
                      'details',
                      { key: x.id, open: true },
                      h(
                        'summary',
                        null,
                        `${sourceLabel(x)} (${data.copies.filter((c: any) => c.source === x.id).length})`,
                      ),
                      h('p', null, x.path),
                      h(
                        'button',
                        {
                          onClick: () =>
                            toggle('source', x.id, x.enabled === false),
                        },
                        `${t('toggleSource')} ${sourceLabel(x)}`,
                      ),
                      ...copies
                        .filter((c: any) => c.source === x.id)
                        .map((copy: any) =>
                          h(
                            'article',
                            { key: copy.path },
                            h('strong', null, copy.name),
                            h('p', null, copy.description),
                            h('span', null, t(copyStatus(copy))),
                            h(
                              'button',
                              {
                                disabled: x.enabled === false || data.corrupt,
                                'aria-label': `${t('copyCopy')}: ${copy.name} — ${copy.path}`,
                                onClick: () =>
                                  toggle('copy', copy.path, !copy.eligible),
                              },
                              t('toggle'),
                            ),
                            h(
                              'button',
                              {
                                onClick: () =>
                                  call(
                                    { action: 'detail', id: copy.path },
                                    lifetime.current.signal,
                                  )
                                    .then((value: any) => {
                                      if (!lifetime.current.signal.aborted) {
                                        setDetailError(false);
                                        setDetail(value);
                                      }
                                    })
                                    .catch(() => {
                                      if (!lifetime.current.signal.aborted)
                                        setDetailError(true);
                                    }),
                              },
                              t('details'),
                            ),
                          ),
                        ),
                    ),
                  ),
                data.corrupt
                  ? h(
                      'div',
                      { role: 'alert' },
                      t('stateLocked'),
                      h(
                        'button',
                        {
                          onClick: () =>
                            call({ action: 'reload' }).then(setData, load),
                        },
                        t('reloadState'),
                      ),
                    )
                  : null,
                copies.length ? null : h('p', null, t('empty')),
                ...(data.diagnostics ?? []).map((x: any, i: number) =>
                  h('p', { key: `${x.code}:${i}` }, diagnosticText(x)),
                ),
              ),
        detailError ? h('p', { role: 'alert' }, t('error')) : null,
        detail
          ? h(
              'div',
              {
                role: 'dialog',
                'aria-label': t('details'),
                ref: dialog,
                tabIndex: -1,
                onKeyDown: (event: any) => {
                  if (event.key === 'Escape') setDetail(null);
                },
              },
              h('button', { onClick: () => setDetail(null) }, t('close')),
              h('h3', null, detail.name),
              h('p', null, detail.path),
              h(
                'button',
                {
                  onClick: () =>
                    navigator.clipboard
                      .writeText(detail.content)
                      .catch(() => setDetailError(true)),
                },
                t('copyText'),
              ),
              h(
                'p',
                null,
                `${t('modelInvocation')}: ${detail.author?.modelInvocable ? t('allowed') : t('denied')} · ${t('userInvocation')}: ${detail.author?.userInvocable ? t('allowed') : t('denied')}`,
              ),
              detail.shadowedBy
                ? h('p', null, `${t('shadowedBy')}: ${detail.shadowedBy}`)
                : null,
              ...(detail.diagnostics ?? []).map((x: any, i: number) =>
                h('p', { key: `${x.code}:${i}` }, diagnosticText(x)),
              ),
              h('pre', null, detail.content),
            )
          : null,
      );
    }
    effect(() => {
      let off: any,
        disposed = false;
      const controller = new AbortController();
      // Cheap presence check: the host ping never scans sources. Backs off (3s doubling to 60s) while failing.
      let delay = 3000;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        if (!disposed) timer = setTimeout(() => void probe(), delay);
      };
      const probe = () =>
        call({ action: 'ping' }, controller.signal)
          .then(() => {
            delay = 3000;
            if (!disposed && !off)
              off = ctx.slots.inject('settings.section', () =>
                ctx.slots.register(
                  {
                    name: 'settings.section',
                    id: 'majed-skills',
                    order: 91,
                    label: () => t('title'),
                  },
                  Section,
                ),
              );
          })
          .catch(() => {
            delay = Math.min(delay * 2, 60000);
            off?.();
            off = undefined;
          })
          .finally(schedule);
      void probe();
      return () => {
        disposed = true;
        controller.abort();
        clearTimeout(timer);
        off?.();
      };
    }, 'majed-skills presence');
  }
}
