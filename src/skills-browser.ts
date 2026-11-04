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
        'diag.project-unavailable': 'Project unavailable',
        'diag.project-missing': 'Project folder is missing',
        'diag.project-unreadable': 'Project folder is not readable',
        'diag.project-source-outside':
          'Project skill folder resolves outside the project',
        'diag.project-source-overlap':
          'Project skill folder overlaps another source',
        scope: 'View',
        scopeGlobal: 'Global skills',
        scopeProject: 'Project skills',
        project: 'Project',
        projectNone: 'Select a registered project',
        projectEmpty: 'No registered projects yet',
        projectHint:
          'Project skills are read from the project and switched only for that project',
        readOnlySource: 'Project DSH skills have no source switch',
        'code.project-missing': 'folder missing',
        'code.project-unreadable': 'not readable',
        'code.project-unavailable': 'unavailable',
        'code.project-unregistered': 'Project is not registered',
        'code.project-dsh-source': 'Project DSH skills have no source switch',
        'code.root-not-absolute': 'Enter an absolute folder path',
        'code.root-too-long': 'The folder path is too long',
        'code.root-not-found': 'The folder does not exist',
        'code.root-not-directory': 'The path is not a folder',
        'code.root-reserved': 'This folder is reserved by the Skill manager',
        'code.root-overlap': 'This folder overlaps another skill source',
        'code.custom-limit': 'The limit of {limit} custom sources is reached',
        'code.custom-label': 'The name or group is invalid or too long',
        'code.custom-unknown': 'This custom source no longer exists',
        'code.scan-aborted': 'The folder preview was cancelled',
        'code.forbidden': 'The request was rejected; reload the page and retry',
        'code.unsupported': 'The request format is not supported',
        'code.stopping': 'The Skill manager is stopping; try again shortly',
        'code.state-invalid':
          'Skill state is invalid; reload the state before changing sources',
        'diag.registry-unavailable':
          'The workspace registry is unavailable; project policy may not apply',
        addSourceNamed: 'Add source',
        editNamed: 'Edit',
        removeNamed: 'Remove source',
        confirmNamed: 'Confirm removal',
        folders: 'Source folders',
        foldersHint:
          'Preview a folder first; nothing is registered until you add it. Removing a source never deletes files',
        folderPath: 'Folder path',
        scanFolder: 'Preview folder',
        addFolder: 'Add folder',
        addSource: 'Add source',
        candidates: 'Candidate sources',
        noCandidates: 'No skill folders found within two levels',
        candidateRegistered: 'Registered',
        candidateConflict: 'Overlaps another source',
        skillCount: 'skills',
        customBadge: 'Custom folder',
        edit: 'Edit',
        save: 'Save',
        cancel: 'Cancel',
        label: 'Name',
        group: 'Group',
        remove: 'Remove source',
        removeNote:
          'This removes only the source entry. Skill files are not deleted',
        confirmRemove: 'Confirm removal',
        added: 'Source added',
        registered: 'This folder is already a source',
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
        'diag.project-unavailable': 'المشروع غير متاح',
        'diag.project-missing': 'مجلد المشروع غير موجود',
        'diag.project-unreadable': 'تتعذر قراءة مجلد المشروع',
        'diag.project-source-outside':
          'مجلد مهارات المشروع يشير إلى خارج المشروع',
        'diag.project-source-overlap': 'مجلد مهارات المشروع يتداخل مع مصدر آخر',
        scope: 'العرض',
        scopeGlobal: 'المهارات العامة',
        scopeProject: 'مهارات المشروع',
        project: 'المشروع',
        projectNone: 'اختر مشروعاً مسجلاً',
        projectEmpty: 'لا توجد مشاريع مسجلة بعد',
        projectHint:
          'تُقرأ مهارات المشروع من المشروع نفسه وتُبدَّل لذلك المشروع فقط',
        readOnlySource: 'مهارات DSH في المشروع بلا مفتاح تبديل للمصدر',
        'code.project-missing': 'المجلد غير موجود',
        'code.project-unreadable': 'تتعذر قراءته',
        'code.project-unavailable': 'غير متاح',
        'code.project-unregistered': 'المشروع غير مسجل',
        'code.project-dsh-source':
          'مهارات DSH في المشروع بلا مفتاح تبديل للمصدر',
        'code.root-not-absolute': 'أدخل مسار مجلد مطلقاً',
        'code.root-too-long': 'مسار المجلد طويل جداً',
        'code.root-not-found': 'المجلد غير موجود',
        'code.root-not-directory': 'المسار ليس مجلداً',
        'code.root-reserved': 'هذا المجلد محجوز لمدير المهارات',
        'code.root-overlap': 'هذا المجلد يتداخل مع مصدر مهارات آخر',
        'code.custom-limit': 'بلغت الحد الأقصى وهو {limit} مصدراً مخصصاً',
        'code.custom-label': 'الاسم أو المجموعة غير صالح أو طويل جداً',
        'code.custom-unknown': 'هذا المصدر المخصص لم يعد موجوداً',
        'code.scan-aborted': 'أُلغيت معاينة المجلد',
        'code.forbidden': 'رُفض الطلب؛ أعد تحميل الصفحة وحاول مجدداً',
        'code.unsupported': 'صيغة الطلب غير مدعومة',
        'code.stopping': 'مدير المهارات قيد الإيقاف؛ حاول بعد قليل',
        'code.state-invalid':
          'حالة المهارات غير صالحة؛ أعد قراءة الحالة قبل تغيير المصادر',
        'diag.registry-unavailable':
          'سجل مساحات العمل غير متاح؛ قد لا تُطبَّق سياسة المشاريع',
        addSourceNamed: 'إضافة مصدر',
        editNamed: 'تعديل',
        removeNamed: 'إزالة المصدر',
        confirmNamed: 'تأكيد الإزالة',
        folders: 'مجلدات المصادر',
        foldersHint:
          'عاين المجلد أولاً؛ لا يُسجَّل شيء حتى تضيفه. إزالة المصدر لا تحذف أي ملفات',
        folderPath: 'مسار المجلد',
        scanFolder: 'معاينة المجلد',
        addFolder: 'إضافة المجلد',
        addSource: 'إضافة مصدر',
        candidates: 'المصادر المرشحة',
        noCandidates: 'لا توجد مجلدات مهارات ضمن مستويين',
        candidateRegistered: 'مسجل',
        candidateConflict: 'يتداخل مع مصدر آخر',
        skillCount: 'مهارات',
        customBadge: 'مجلد مخصص',
        edit: 'تعديل',
        save: 'حفظ',
        cancel: 'إلغاء',
        label: 'الاسم',
        group: 'المجموعة',
        remove: 'إزالة المصدر',
        removeNote: 'هذا يزيل إدخال المصدر فقط ولا تُحذف ملفات المهارات',
        confirmRemove: 'تأكيد الإزالة',
        added: 'أُضيف المصدر',
        registered: 'هذا المجلد مصدر بالفعل',
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
      if (!response.ok) {
        const failure: any = new Error(String(response.status));
        // Plain-text host rejections carry no JSON body, so the status selects the message.
        const body = await response.json().catch(() => ({}));
        failure.params = body.params;
        failure.code =
          body.code ??
          { 403: 'forbidden', 415: 'unsupported', 503: 'stopping' }[
            response.status as 403 | 415 | 503
          ] ??
          (response.status === 409 ? 'state-invalid' : undefined);
        throw failure;
      }
      return response.json();
    };
    const errorText = (failure: any) =>
      failure?.code &&
      (dictionaries.en as Record<string, string>)[`code.${failure.code}`]
        ? t(`code.${failure.code}`).replace(
            '{limit}',
            String(failure.params?.limit ?? ''),
          )
        : t('error');
    function Section() {
      const [data, setData] = React.useState(null),
        [error, setError] = React.useState(false),
        [query, setQuery] = React.useState(''),
        [source, setSource] = React.useState(''),
        [status, setStatus] = React.useState(''),
        [detail, setDetail] = React.useState(null),
        [detailError, setDetailError] = React.useState(false),
        [scope, setScope] = React.useState('global'),
        [project, setProject] = React.useState(''),
        [folderPath, setFolderPath] = React.useState(''),
        [candidates, setCandidates] = React.useState(null),
        [editing, setEditing] = React.useState(null),
        [removing, setRemoving] = React.useState(''),
        [pendingScan, setPendingScan] = React.useState(false),
        [loaded, setLoaded] = React.useState(''),
        [notice, setNotice] = React.useState(''),
        [managing, setManaging] = React.useState(false);
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
      // The project id is only a selector: the host re-resolves it against the workspace registry.
      const selected = scope === 'project' && project ? { project } : {};
      const key = scope === 'project' && project ? project : '';
      // Async callbacks read the live selection so results for a previous selection are ignored.
      const keyRef = React.useRef(key);
      keyRef.current = key;
      // Data on screen belongs to another selection until the new list arrives: no controls act on it.
      const switching = loaded !== key;
      const load = () => {
        const requested = key;
        controller.current?.abort();
        const current = (controller.current = new AbortController());
        setError(false);
        return call({ action: 'list', ...selected }, current.signal)
          .then((value: any) => {
            if (keyRef.current !== requested) return;
            setData(value);
            setLoaded(requested);
          })
          .catch((error: any) => {
            if (error.name !== 'AbortError' && keyRef.current === requested)
              setError(true);
          });
      };
      React.useEffect(
        () => () => {
          controller.current?.abort();
          lifetime.current.abort();
        },
        [],
      );
      React.useEffect(() => {
        setNotice('');
        setCandidates(null);
        void load();
      }, [scope, project]);
      const toggle = async (kind: string, id: string, enabled: boolean) => {
        if (busy.current || switching || lifetime.current.signal.aborted)
          return;
        busy.current = true;
        try {
          const requested = key;
          await call(
            { action: 'toggle', kind, id, enabled, ...selected },
            lifetime.current.signal,
          );
          // A selection change while toggling already started its own list load; reloading here would abort it.
          if (!lifetime.current.signal.aborted && keyRef.current === requested)
            await load();
        } catch {
          if (!lifetime.current.signal.aborted && keyRef.current === key)
            setError(true);
        } finally {
          busy.current = false;
        }
      };
      // Custom-source mutations: every path is validated again by the host; failures show its code.
      const mutate = async (body: any, done?: (value: any) => void) => {
        if (busy.current || lifetime.current.signal.aborted) return;
        busy.current = true;
        setNotice('');
        const requested = key;
        try {
          const value = await call(body, lifetime.current.signal);
          if (lifetime.current.signal.aborted || keyRef.current !== requested)
            return;
          setData(value);
          done?.(value);
        } catch (failure: any) {
          if (!lifetime.current.signal.aborted && keyRef.current === requested)
            setNotice(errorText(failure));
        } finally {
          busy.current = false;
        }
      };
      const addFolders = (items: any[]) =>
        mutate({ action: 'custom-add', items }, (value: any) => {
          const result = value.results?.[0];
          setCandidates(null);
          setNotice(
            result?.status === 'rejected'
              ? errorText(result)
              : result?.status === 'registered'
                ? t('registered')
                : t('added'),
          );
        });
      const scanFolder = async () => {
        if (pendingScan) return;
        setPendingScan(true);
        setNotice('');
        const requested = key;
        try {
          const found = await call(
            { action: 'custom-scan', path: folderPath },
            lifetime.current.signal,
          );
          if (!lifetime.current.signal.aborted && keyRef.current === requested)
            setCandidates(found.candidates);
        } catch (failure: any) {
          if (
            !lifetime.current.signal.aborted &&
            keyRef.current === requested
          ) {
            setCandidates(null);
            setNotice(errorText(failure));
          }
        } finally {
          setPendingScan(false);
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
      const inProject = scope === 'project';
      // Project view: sources, copies and diagnostics come from the selected project only.
      const view = inProject
        ? (data?.project ?? { sources: [], copies: [], diagnostics: [] })
        : data;
      const copies = (view?.copies ?? []).filter(
        (copy: any) =>
          (!source || copy.source === source) &&
          (!query ||
            `${copy.name} ${copy.description} ${copy.path}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!status || copyStatus(copy) === status),
      );
      const projects = data?.projects ?? [];
      const projectOption = (x: any) =>
        h(
          'option',
          { key: x.id, value: x.id, disabled: !x.available },
          x.available ? x.name : `${x.name} · ${t(`code.${x.code}`)}`,
        );
      const field = (label: string, value: string, set: (v: string) => void) =>
        h('input', {
          'aria-label': label,
          placeholder: label,
          value,
          onChange: (e: any) => set(e.target.value),
        });
      const manager = () =>
        h(
          'div',
          null,
          h('p', null, t('foldersHint')),
          field(t('folderPath'), folderPath, setFolderPath),
          h(
            'button',
            { disabled: pendingScan, onClick: () => void scanFolder() },
            t('scanFolder'),
          ),
          h(
            'button',
            { onClick: () => void addFolders([{ path: folderPath }]) },
            t('addFolder'),
          ),
          notice ? h('p', { role: 'status' }, notice) : null,
          candidates
            ? h(
                'div',
                null,
                h('h4', null, t('candidates')),
                candidates.length ? null : h('p', null, t('noCandidates')),
                ...candidates.map((c: any) =>
                  h(
                    'div',
                    { key: c.path },
                    h('strong', null, c.label),
                    h(
                      'p',
                      null,
                      h('bdi', { dir: 'ltr' }, c.path),
                      ` · ${c.skillCount} ${t('skillCount')}`,
                    ),
                    c.registered
                      ? h('span', null, t('candidateRegistered'))
                      : c.conflict
                        ? h('span', null, t('candidateConflict'))
                        : h(
                            'button',
                            {
                              'aria-label': `${t('addSourceNamed')}: ${c.label}`,
                              onClick: () =>
                                void addFolders([
                                  {
                                    path: c.path,
                                    label: c.label,
                                    group: c.group,
                                  },
                                ]),
                            },
                            t('addSource'),
                          ),
                  ),
                ),
              )
            : null,
        );
      const customControls = (x: any) =>
        editing?.id === x.id
          ? h(
              'div',
              null,
              field(t('label'), editing.label, (v) =>
                setEditing({ ...editing, label: v }),
              ),
              field(t('group'), editing.group, (v) =>
                setEditing({ ...editing, group: v }),
              ),
              field(`${t('edit')}: ${t('folderPath')}`, editing.path, (v) =>
                setEditing({ ...editing, path: v }),
              ),
              h(
                'button',
                {
                  'aria-label': `${t('save')}: ${x.label ?? x.id}`,
                  onClick: () =>
                    void mutate(
                      {
                        action: 'custom-update',
                        id: x.id,
                        label: editing.label,
                        group: editing.group,
                        path: editing.path,
                      },
                      () => setEditing(null),
                    ),
                },
                t('save'),
              ),
              h(
                'button',
                {
                  'aria-label': `${t('cancel')}: ${x.label ?? x.id}`,
                  onClick: () => setEditing(null),
                },
                t('cancel'),
              ),
            )
          : removing === x.id
            ? h(
                'div',
                null,
                h('p', null, t('removeNote')),
                h(
                  'button',
                  {
                    'aria-label': `${t('confirmNamed')}: ${x.label ?? x.id}`,
                    onClick: () =>
                      void mutate({ action: 'custom-remove', id: x.id }, () =>
                        setRemoving(''),
                      ),
                  },
                  t('confirmRemove'),
                ),
                h(
                  'button',
                  {
                    'aria-label': `${t('cancel')}: ${x.label ?? x.id}`,
                    onClick: () => setRemoving(''),
                  },
                  t('cancel'),
                ),
              )
            : h(
                'div',
                null,
                h('span', null, t('customBadge')),
                h(
                  'button',
                  {
                    'aria-label': `${t('editNamed')}: ${x.label ?? x.id}`,
                    onClick: () =>
                      setEditing({
                        id: x.id,
                        label: x.label ?? '',
                        group: x.group ?? '',
                        path: x.path,
                      }),
                  },
                  t('edit'),
                ),
                h(
                  'button',
                  {
                    'aria-label': `${t('removeNamed')}: ${x.label ?? x.id}`,
                    onClick: () => setRemoving(x.id),
                  },
                  t('remove'),
                ),
              );
      return h(
        'section',
        {
          'data-majed-skills': true,
          dir: isArabic() ? 'rtl' : undefined,
        },
        h('h2', null, t('title')),
        h(
          'select',
          {
            'aria-label': t('scope'),
            value: scope,
            onChange: (e: any) => {
              setScope(e.target.value);
              setSource('');
              setNotice('');
            },
          },
          h('option', { value: 'global' }, t('scopeGlobal')),
          h('option', { value: 'project' }, t('scopeProject')),
        ),
        inProject
          ? h(
              'select',
              {
                'aria-label': t('project'),
                value: project,
                onChange: (e: any) => {
                  setProject(e.target.value);
                  setSource('');
                  setNotice('');
                },
              },
              h(
                'option',
                { value: '' },
                projects.length ? t('projectNone') : t('projectEmpty'),
              ),
              ...projects.map(projectOption),
            )
          : null,
        inProject ? h('p', null, t('projectHint')) : null,
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
          ...(view?.sources ?? []).map((x: any) =>
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
          : !data || switching
            ? h('p', { role: 'status' }, t('loading'))
            : h(
                React.Fragment,
                null,
                inProject
                  ? null
                  : h(
                      'div',
                      null,
                      h(
                        'button',
                        {
                          'aria-expanded': managing,
                          onClick: () => setManaging(!managing),
                        },
                        t('folders'),
                      ),
                      managing ? manager() : null,
                    ),
                inProject && data.project && !data.project.available
                  ? h(
                      'p',
                      { role: 'alert' },
                      `${data.project.name}: ${t(`code.${data.project.code}`)}`,
                    )
                  : null,
                ...(view.sources ?? [])
                  .filter((x: any) => !source || x.id === source)
                  .map((x: any) =>
                    h(
                      'details',
                      { key: x.id, open: true },
                      h(
                        'summary',
                        null,
                        `${sourceLabel(x)} (${view.copies.filter((c: any) => c.source === x.id).length})`,
                      ),
                      h(
                        'p',
                        null,
                        x.group ? `${x.group} · ` : null,
                        h('bdi', { dir: 'ltr' }, x.path),
                      ),
                      x.readonly
                        ? h('p', null, t('readOnlySource'))
                        : h(
                            'button',
                            {
                              onClick: () =>
                                toggle('source', x.id, x.enabled === false),
                            },
                            `${t('toggleSource')} ${sourceLabel(x)}`,
                          ),
                      x.custom ? customControls(x) : null,
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
                                    {
                                      action: 'detail',
                                      id: copy.path,
                                      ...selected,
                                    },
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
                ...(view.diagnostics ?? []).map((x: any, i: number) =>
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
