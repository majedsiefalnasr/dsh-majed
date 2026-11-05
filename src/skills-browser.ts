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
        trash: 'Trash',
        moveTrash: 'Move to Trash',
        restoreTrash: 'Restore original',
        deleteTrash: 'Delete permanently',
        confirmTrash: 'Confirm permanent deletion',
        trashWarning:
          'This permanently deletes the recoverable files. This cannot be undone.',
        trashOrigin: 'Original location',
        trashEmpty: 'Trash is empty',
        'code.trash-conflict': 'The original location already contains a skill',
        'code.trash-readonly': 'This source is read-only',
        'code.trash-unavailable':
          'Trash storage is unavailable; the skill catalog is still available',
        'code.trash-linked': 'Linked or special write targets are not allowed',
        'code.trash-failed':
          'The operation failed; check the original and Trash before retrying',
        'code.trash-cancelled': 'The operation was cancelled',
        'code.trash-limit': 'The skill exceeds safe processing limits',
        'code.trash-overflow':
          'Trash has too many entries to list safely; organization data is kept',
        'code.trash-skipped':
          'Some Trash records are unreadable; organization data is kept',
        'code.trash-invalid': 'The original location is no longer valid',
        'code.trash-missing': 'This Trash entry no longer exists',
        'code.trash-confirm': 'Confirm permanent deletion first',
        'code.trash-cleanup':
          'Operation completed; remaining files need cleanup',
        'code.trash-recovery':
          'Original removal failed; the complete Trash copy was retained for recovery',
        'code.trash-state':
          'Files deleted, but annotation cleanup failed; reload state before retrying',
        repositories: 'Repositories',
        scopeDiscover: 'Discover Skills',
        tabGit: 'Git Repos',
        catSourceLabel: 'Discover sources',
        catSourceClawhub: 'ClawHub',
        catSourceSkillsh: 'skills.sh',
        catSearchClawhub: 'Search ClawHub',
        catSearchSkillsh: 'Search skills.sh',
        catSearch: 'Search',
        catPopularNote:
          'ClawHub download ranking · Up to 100; sort only displayed items',
        catSkillshHint:
          'skills.sh offers search only; enter a query to find skills.',
        catLoading: 'Loading…',
        catLoadingMore: 'Loading more…',
        catLoadMore: 'Load 10 more',
        catEmpty: 'No skills to show',
        catSearchEmpty: 'No skills match this search',
        catLoadError:
          'Failed to load the catalog. Check your connection and retry.',
        catRetry: 'Retry',
        catDownloads: 'downloads',
        catInstalls: 'installs',
        catStars: 'stars',
        catSort: 'Sort displayed items',
        catSortDownloads: 'Downloads (ranking)',
        catSortInstalls: 'Installs (high to low)',
        catSortName: 'Name (A–Z)',
        catStatusFilter: 'Catalog status',
        catStatusAll: 'All statuses',
        catStatusAvailable: 'Not installed',
        catStatusInstalled: 'Installed',
        catInstalled: 'Installed',
        catDetails: 'Catalog details',
        catInstall: 'Install from catalog',
        catInstallElsewhere: 'Install elsewhere',
        catUninstall: 'Uninstall catalog copy',
        catForget: 'Forget catalog record',
        catReassociate: 'Adopt identical existing copy',
        catCopy: 'Copy SKILL.md',
        catCopied: 'Copied',
        catCopyFailed: 'Copy failed',
        catClose: 'Close',
        catOrigin: 'Origin',
        catDetailLoading: 'Loading details…',
        catInstallTitle: 'Install from catalog',
        catInstallConfirm: 'Confirm install',
        destPath: 'Destination folder',
        destInvalid: 'Choose an available destination to install',
        destNoProjects:
          'No registered projects: only your DSH and Shared Agents folders are available.',
        destProjectNote:
          'Written inside the project and may be committed to its repository.',
        catInstallDone: 'Installed from catalog',
        catCopies: 'Installed copies',
        catUninstallTitle: 'Uninstall catalog copy',
        catUninstallBody:
          'This moves "{name}" from {where} to Trash. You can restore it from Trash.',
        catForgetTitle: 'Forget catalog record',
        catForgetBody:
          'This removes the catalog record for "{name}" only. No files are changed or deleted.',
        catSharedWarning:
          'This copy is in the shared agents folder. Other tools that read this folder will stop seeing it.',
        catConfirmUninstall: 'Move to Trash',
        catConfirmForget: 'Forget record',
        'catHint.trashed':
          'A copy is in Trash. Restore it from Trash, or install into a different destination.',
        'catHint.missing':
          'Its Trash entry no longer exists. Forget the record, then install again.',
        'catHint.invalid-root':
          'The copy location is unavailable. Forget the record, then install again.',
        'catStatus.installed': 'Installed',
        'catStatus.modified': 'Modified locally',
        'catStatus.missing': 'Missing from disk',
        'catStatus.trashed': 'In Trash',
        'catStatus.invalid-root': 'Location unavailable',
        'code.catalog-query': 'The search or paging request is not valid',
        'code.catalog-upstream': 'The catalog could not be reached',
        'code.catalog-response': 'The catalog returned an unusable response',
        'code.catalog-identity': 'This catalog skill identity is not valid',
        'code.catalog-package': 'The catalog package is not a valid skill',
        'code.catalog-confirm': 'Confirm the installation first',
        'code.catalog-action': 'This catalog action is not supported',
        'code.catalog-failed': 'The catalog operation failed',
        repoAddTitle: 'Subscribe to a repository',
        repoUrl: 'Repository (owner/name, https URL or absolute folder)',
        repoRef: 'Branch or tag (optional)',
        repoSubdirectory: 'Subdirectory (optional)',
        repoAdd: 'Subscribe',
        repoRefresh: 'Refresh',
        repoRefreshAll: 'Refresh all',
        repoRefreshing: 'Refreshing…',
        repoUnsubscribe: 'Unsubscribe (keeps installed skills)',
        repoFilter: 'Filter repository skills',
        repoStatusFilter: 'Filter by status',
        repoRepoFilter: 'Filter by repository',
        repoAllStatuses: 'All statuses',
        repoAllRepositories: 'All repositories',
        repoConfirmUnsubscribe:
          'Unsubscribe from this repository? Installed skills and their provenance stay; the saved snapshot is removed.',
        repoConfirmUnsubscribeYes: 'Unsubscribe',
        repoForget: 'Forget record (deletes nothing)',
        repoConfirmForget:
          'Forget this installation record? Only the tracking record is removed; no files are read, moved or deleted.',
        repoConfirmForgetYes: 'Forget record',
        'repoStatus.update': 'Update available',
        repoUpdatePreview: 'Preview update',
        repoRollbackPreview: 'Preview rollback to previous version',
        repoApplyUpdate: 'Apply update',
        repoApplyRollback: 'Apply rollback',
        repoPreviewTitle: 'Changes to the installed copy',
        repoNoChanges: 'No file changes',
        repoLocalModified:
          'This copy was edited locally. Applying replaces those edits; the current copy is kept as the previous version.',
        repoOverwrite: 'Replace local edits',
        repoApplying: 'Applying…',
        repoUpdated:
          'Updated {name}. The previous version is kept for rollback.',
        repoRolledBack: 'Rolled back {name} to the previous version.',
        repoTrackedHint:
          'Only file contents and the executable bit are tracked; empty folders and other file attributes are not.',
        repoUpstream: 'Upstream',
        'repoChange.added': 'Added',
        'repoChange.removed': 'Removed',
        'repoChange.modified': 'Modified',
        'code.repo-preview-stale':
          'The copy or the repository changed after this preview; preview again',
        'code.repo-local-modified':
          'The copy has local edits; confirm replacing them first',
        'code.repo-local-unsafe':
          'The installed copy contains links, special files or exceeds safe limits',
        'code.repo-up-to-date': 'This copy already matches the repository',
        'code.repo-no-backup': 'There is no previous version to roll back to',
        'code.repo-backup-changed':
          'The saved previous version changed; rollback refused',
        'code.repo-skill-renamed':
          'The skill was renamed upstream; the installed copy is unchanged',
        'code.repo-recovery':
          'Automatic recovery failed; the original files are kept at {recovery}. Do not repeat the operation',
        'code.repo-invalid-root':
          'The destination changed since install; the copy is not touched. Forget the record instead.',
        'code.repo-root-valid':
          'The destination is unchanged; use Uninstall to Trash',
        repoConflictIn: 'Name already used in',
        repoEmpty: 'No repository subscriptions',
        repoNoSkills: 'No skills found in this snapshot',
        repoInstall: 'Install',
        repoUninstall: 'Uninstall to Trash',
        repoDestination: 'Install into',
        repoTracked: 'Tracked installations',
        repoSnapshot: 'Snapshot',
        repoLastError: 'Last refresh failed; showing the previous snapshot',
        repoBulk: 'Refreshed {done} of {total}; {failed} failed',
        repoFromSource: 'Source',
        repoInstalledAt: 'Installed in',
        repoNoInstalls: 'No tracked installations',
        'repoKind.git-commit': 'Git commit',
        'repoKind.archive-sha256': 'Archive fingerprint (not a Git commit)',
        'repoKind.folder-sha256': 'Folder content fingerprint',
        'repoStatus.available': 'Available',
        'repoStatus.installed': 'Installed',
        'repoStatus.modified': 'Modified locally',
        'repoStatus.missing': 'Missing',
        'repoStatus.conflict': 'Name conflict',
        'repoStatus.invalid': 'Invalid',
        'repoStatus.trashed': 'In Trash',
        'repoStatus.invalid-root': 'Destination changed',
        'code.repo-url':
          'Repository address is not supported (use owner/name, an https/http URL without credentials, or an absolute folder)',
        'code.repo-ref': 'Branch or tag name is not valid',
        'code.repo-subdirectory': 'Subdirectory is not valid or does not exist',
        'code.repo-host':
          'Local, private and link-local network hosts are not allowed',
        'code.repo-local':
          'The local folder is missing or is not a usable folder',
        'code.repo-git': 'Git could not read this repository',
        'code.repo-git-missing': 'Git is not installed or not on PATH',
        'code.repo-network':
          'The repository could not be reached (redirects are not followed)',
        'code.repo-notfound': 'Repository, branch or tag was not found',
        'code.repo-auth':
          'Authentication is required; credentials are not supported',
        'code.repo-timeout': 'The repository operation timed out',
        'code.repo-limit':
          'The repository exceeds safe size, file-count or depth limits',
        'code.repo-archive': 'The repository archive is invalid or unsafe',
        'code.repo-cancelled': 'The operation was cancelled',
        'code.repo-duplicate': 'This repository is already subscribed',
        'code.repo-busy': 'This repository is already being refreshed',
        'code.repo-not-found': 'This subscription no longer exists',
        'code.repo-stale':
          'The repository changed; refresh the preview and try again',
        'code.repo-conflict':
          'A skill with this name already exists; nothing was overwritten',
        'code.repo-skill-missing': 'This skill is not in the current snapshot',
        'code.repo-skill-invalid':
          'This skill is invalid and cannot be installed',
        'code.repo-skill-limit': 'This skill exceeds safe size limits',
        'code.repo-skill-metadata': 'This skill has invalid metadata',
        'code.repo-snapshot-changed':
          'The stored snapshot no longer matches; refresh the repository',
        'code.repo-not-installed': 'This tracked installation no longer exists',
        'code.repo-trashed': 'This installation is already in Trash',
        'code.repo-missing': 'The installed copy is missing from disk',
        'code.repo-state-invalid':
          'Repository state is unreadable and was left untouched',
        'code.repo-state-write': 'Repository state could not be saved',
        'code.repo-install-failed': 'The skill could not be installed',
        'code.repo-failed': 'The repository operation failed',
        importSkills: 'Import skills',
        importPath: 'Local absolute path',
        previewImport: 'Preview local import',
        importNow: 'Import now',
        uploadFiles: 'ZIP or Markdown files',
        uploadFolder: 'Skill folder',
        importConflict: 'Existing skills',
        skipImport: 'Skip existing',
        overwriteImport: 'Overwrite existing (replace all bundled files)',
        importResult: 'Import results',
        pendingImport: 'Ready',
        conflictsImport: 'Conflicts',
        importedImport: 'Imported',
        skippedImport: 'Skipped',
        failedImport: 'Failed',
        warningsImport: 'Cleanup warnings',
        inputsImport: 'Archives processed',
        'code.import-cleanup':
          'Imported successfully; backup cleanup failed. Check the remaining backup path; its contents may be incomplete',
        importHint:
          'Copies original files. Select skip or overwrite explicitly. Local preview never writes.',
        create: 'Create skill',
        skillName: 'Skill name',
        skillDescription: 'Routing description',
        skillBody: 'Markdown instructions',
        destination: 'Creation destination',
        created: 'Skill created',
        'code.create-invalid':
          'Enter a valid name, description and instructions',
        'code.create-conflict': 'A skill with this name already exists',
        'code.create-readonly': 'This source is read-only',
        'code.create-linked-root': 'Linked writable folders are not allowed',
        'code.create-too-large': 'Skill content exceeds the size limit',
        'code.create-failed': 'Unable to create the skill',
        'code.import-path': 'Unsafe import path',
        'code.import-limit': 'Import exceeds file, byte, depth or entry limits',
        'code.import-linked': 'Linked or special files are not allowed',
        'code.import-empty': 'No skill documents found',
        'code.import-metadata': 'Skill metadata is invalid',
        'code.import-name': 'Skill name is invalid',
        'code.import-duplicate': 'Duplicate import paths or names',
        'code.import-encoding': 'Invalid upload encoding',
        'code.import-archive': 'Invalid or incomplete ZIP archive',
        'code.import-cancelled':
          'Import cancelled; unpublished changes discarded',
        'code.import-overlap': 'Import source overlaps the destination',
        'code.import-conflict': 'Choose skip or overwrite explicitly',
        'code.import-failed': 'Unable to import this skill',
        'code.import-recovery':
          'Restoration failed; original backup retained in the destination for recovery',
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
        'code.project-mismatch':
          'The selected project does not match this item',
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
        categories: 'Categories',
        categoryName: 'Category name',
        addCategory: 'Add category',
        uncategorized: 'Uncategorized',
        renameCategory: 'Rename category',
        deleteCategory: 'Delete category',
        confirmDeleteCategory: 'Confirm delete category',
        deleteCategoryNote:
          'Skills in this category become uncategorized. No skill files are changed',
        enableGroup: 'Enable group',
        disableGroup: 'Disable group',
        enableAll: 'Enable all skills',
        disableAll: 'Disable all skills',
        selectSkill: 'Select skill',
        assignTo: 'Assign selected to',
        assignSelected: 'Assign selected',
        moveUp: 'Move up',
        moveDown: 'Move down',
        filterCategory: 'Category',
        allCategories: 'All categories',
        note: 'Note',
        saveNote: 'Save note',
        noteHint: 'Notes are searchable and never change the skill description',
        noteLimit: 'Up to 500 characters',
        selectAll: 'Select all skills',
        bulkOverrideNote:
          'Bulk enable or disable applies to this source only and overrides earlier per-skill choices.',
        'code.invalid-request': 'The request was not valid',
        'code.source-unknown': 'This source is not available in this view',
        'code.organization-limit':
          'Too many categories, notes or assignments for this source',
        'code.state-too-large':
          'The saved organization data is too large; remove some notes or categories',
        placement: 'Entry placement',
        placementHint:
          'Choose where the Skill manager appears: Settings, the sidebar or both',
        placementBoth: 'Both',
        placementSidebar: 'Sidebar only',
        placementSettings: 'Settings only',
        'code.category-name': 'Enter a category name of up to 24 characters',
        'code.category-duplicate': 'A category with this name already exists',
        'code.category-unknown': 'This category no longer exists',
        'code.category-limit': 'The limit of {limit} categories is reached',
        'code.skill-unknown': 'This skill is not available in this view',
        'code.order-position': 'The ordering position is invalid',
        'code.order-target': 'The ordering target is in another category',
        'code.note-too-long': 'The note is longer than {limit} characters',
        'code.placement-invalid': 'The entry placement is invalid',
      },
      ar: {
        trash: 'سلة المحذوفات',
        moveTrash: 'نقل إلى سلة المحذوفات',
        restoreTrash: 'استعادة إلى المصدر',
        deleteTrash: 'حذف نهائي',
        confirmTrash: 'تأكيد الحذف النهائي',
        trashWarning:
          'سيتم حذف الملفات القابلة للاستعادة نهائياً. لا يمكن التراجع.',
        trashOrigin: 'الموقع الأصلي',
        trashEmpty: 'سلة المحذوفات فارغة',
        'code.trash-conflict': 'يوجد بالفعل مهارة في الموقع الأصلي',
        'code.trash-readonly': 'هذا المصدر للقراءة فقط',
        'code.trash-unavailable':
          'تخزين سلة المحذوفات غير متاح؛ ما زال كتالوج المهارات متاحًا',
        'code.trash-linked': 'لا يُسمح بالكتابة إلى روابط أو ملفات خاصة',
        'code.trash-failed':
          'فشلت العملية؛ افحص المصدر والسلة قبل المحاولة مجدداً',
        'code.trash-cancelled': 'أُلغيت العملية',
        'code.trash-limit': 'تتجاوز المهارة حدود المعالجة الآمنة',
        'code.trash-overflow':
          'عدد عناصر سلة المحذوفات أكبر من أن يُعرض بأمان؛ بيانات التنظيم محفوظة',
        'code.trash-skipped':
          'بعض سجلات سلة المحذوفات غير قابلة للقراءة؛ بيانات التنظيم محفوظة',
        'code.trash-invalid': 'لم يعد الموقع الأصلي صالحاً',
        'code.trash-missing': 'لم يعد هذا العنصر في سلة المحذوفات',
        'code.trash-confirm': 'أكد الحذف النهائي أولاً',
        'code.trash-cleanup':
          'اكتملت العملية؛ تحتاج الملفات المتبقية إلى تنظيف',
        'code.trash-recovery':
          'فشل حذف المصدر؛ حُفظت نسخة كاملة في السلة للاستعادة',
        'code.trash-state':
          'حُذفت الملفات لكن فشل تنظيف التعليقات؛ أعد تحميل الحالة',
        repositories: 'المستودعات',
        scopeDiscover: 'اكتشاف المهارات',
        tabGit: 'مستودعات Git',
        catSourceLabel: 'مصادر الاكتشاف',
        catSourceClawhub: 'ClawHub',
        catSourceSkillsh: 'skills.sh',
        catSearchClawhub: 'ابحث في ClawHub',
        catSearchSkillsh: 'ابحث في skills.sh',
        catSearch: 'بحث',
        catPopularNote:
          'ترتيب ClawHub حسب التنزيلات · حتى 100؛ الفرز للعناصر المعروضة فقط',
        catSkillshHint:
          'يوفّر skills.sh البحث فقط؛ أدخل عبارة بحث للعثور على المهارات.',
        catLoading: 'جارٍ التحميل…',
        catLoadingMore: 'جارٍ تحميل المزيد…',
        catLoadMore: 'تحميل 10 أخرى',
        catEmpty: 'لا توجد مهارات للعرض',
        catSearchEmpty: 'لا توجد مهارات مطابقة لهذا البحث',
        catLoadError: 'تعذر تحميل الفهرس. تحقق من الاتصال وأعد المحاولة.',
        catRetry: 'إعادة المحاولة',
        catDownloads: 'تنزيل',
        catInstalls: 'تثبيت',
        catStars: 'نجمة',
        catSort: 'فرز العناصر المعروضة',
        catSortDownloads: 'التنزيلات (الترتيب)',
        catSortInstalls: 'التثبيتات (من الأعلى)',
        catSortName: 'الاسم (أ–ي)',
        catStatusFilter: 'حالة الفهرس',
        catStatusAll: 'كل الحالات',
        catStatusAvailable: 'غير مثبتة',
        catStatusInstalled: 'مثبتة',
        catInstalled: 'مثبتة',
        catDetails: 'تفاصيل الفهرس',
        catInstall: 'تثبيت من الفهرس',
        catInstallElsewhere: 'تثبيت في موضع آخر',
        catUninstall: 'إزالة نسخة الفهرس',
        catForget: 'نسيان سجل الفهرس',
        catReassociate: 'تبنّي النسخة المطابقة الموجودة',
        catCopy: 'نسخ SKILL.md',
        catCopied: 'تم النسخ',
        catCopyFailed: 'فشل النسخ',
        catClose: 'إغلاق',
        catOrigin: 'المصدر',
        catDetailLoading: 'جارٍ تحميل التفاصيل…',
        catInstallTitle: 'تثبيت من الفهرس',
        catInstallConfirm: 'تأكيد التثبيت',
        destPath: 'مجلد الوجهة',
        destInvalid: 'اختر وجهة متاحة للتثبيت',
        destNoProjects:
          'لا توجد مشاريع مسجلة: المتاح فقط مجلدا DSH والوكلاء المشتركين.',
        destProjectNote: 'يُكتب داخل المشروع وقد يُرفع إلى مستودعه.',
        catInstallDone: 'تم التثبيت من الفهرس',
        catCopies: 'النسخ المثبتة',
        catUninstallTitle: 'إزالة نسخة الفهرس',
        catUninstallBody:
          'سيُنقل "{name}" من {where} إلى السلة. يمكنك استعادته من السلة.',
        catForgetTitle: 'نسيان سجل الفهرس',
        catForgetBody:
          'سيُزال سجل الفهرس الخاص بـ "{name}" فقط. لن تتغير أي ملفات ولن تُحذف.',
        catSharedWarning:
          'هذه النسخة في مجلد الوكلاء المشترك. ستتوقف الأدوات الأخرى التي تقرأ هذا المجلد عن رؤيتها.',
        catConfirmUninstall: 'نقل إلى السلة',
        catConfirmForget: 'نسيان السجل',
        'catHint.trashed':
          'توجد نسخة في السلة. استعدها من السلة أو ثبّت في وجهة مختلفة.',
        'catHint.missing': 'لم يعد عنصرها في السلة. انسَ السجل ثم ثبّت مرة أخرى.',
        'catHint.invalid-root':
          'موضع النسخة غير متاح. انسَ السجل ثم ثبّت مرة أخرى.',
        'catStatus.installed': 'مثبتة',
        'catStatus.modified': 'معدّلة محلياً',
        'catStatus.missing': 'مفقودة من القرص',
        'catStatus.trashed': 'في السلة',
        'catStatus.invalid-root': 'الموقع غير متاح',
        'code.catalog-query': 'طلب البحث أو التصفح غير صالح',
        'code.catalog-upstream': 'تعذر الوصول إلى الفهرس',
        'code.catalog-response': 'أعاد الفهرس استجابة غير صالحة للاستخدام',
        'code.catalog-identity': 'هوية مهارة الفهرس غير صالحة',
        'code.catalog-package': 'حزمة الفهرس ليست مهارة صالحة',
        'code.catalog-confirm': 'أكّد التثبيت أولاً',
        'code.catalog-action': 'إجراء الفهرس هذا غير مدعوم',
        'code.catalog-failed': 'فشلت عملية الفهرس',
        repoAddTitle: 'الاشتراك في مستودع',
        repoUrl: 'المستودع (owner/name أو رابط https أو مجلد مطلق)',
        repoRef: 'الفرع أو الوسم (اختياري)',
        repoSubdirectory: 'المجلد الفرعي (اختياري)',
        repoAdd: 'اشتراك',
        repoRefresh: 'تحديث',
        repoRefreshAll: 'تحديث الكل',
        repoRefreshing: 'جارٍ التحديث…',
        repoUnsubscribe: 'إلغاء الاشتراك (تبقى المهارات المثبتة)',
        repoFilter: 'تصفية مهارات المستودع',
        repoStatusFilter: 'تصفية حسب الحالة',
        repoRepoFilter: 'تصفية حسب المستودع',
        repoAllStatuses: 'كل الحالات',
        repoAllRepositories: 'كل المستودعات',
        repoConfirmUnsubscribe:
          'إلغاء الاشتراك في هذا المستودع؟ تبقى المهارات المثبتة وسجل مصدرها، وتُحذف اللقطة المحفوظة.',
        repoConfirmUnsubscribeYes: 'إلغاء الاشتراك',
        repoForget: 'نسيان السجل (لا يحذف شيئاً)',
        repoConfirmForget:
          'نسيان سجل هذا التثبيت؟ يُزال سجل التتبع فقط؛ لا تُقرأ ملفات ولا تُنقل ولا تُحذف.',
        repoConfirmForgetYes: 'نسيان السجل',
        'repoStatus.update': 'تحديث متاح',
        repoUpdatePreview: 'معاينة التحديث',
        repoRollbackPreview: 'معاينة الرجوع إلى النسخة السابقة',
        repoApplyUpdate: 'تطبيق التحديث',
        repoApplyRollback: 'تطبيق الرجوع',
        repoPreviewTitle: 'التغييرات على النسخة المثبتة',
        repoNoChanges: 'لا تغييرات في الملفات',
        repoLocalModified:
          'عُدّلت هذه النسخة محلياً. سيستبدل التطبيق تلك التعديلات وتُحفظ النسخة الحالية كنسخة سابقة.',
        repoOverwrite: 'استبدال التعديلات المحلية',
        repoApplying: 'جارٍ التطبيق…',
        repoUpdated: 'تم تحديث {name}. تُحفظ النسخة السابقة للرجوع إليها.',
        repoRolledBack: 'تم الرجوع بـ {name} إلى النسخة السابقة.',
        repoTrackedHint:
          'يُتتبَّع محتوى الملفات وإذن التنفيذ فقط؛ لا تُتتبَّع المجلدات الفارغة ولا سمات الملفات الأخرى.',
        repoUpstream: 'المصدر',
        'repoChange.added': 'مضاف',
        'repoChange.removed': 'محذوف',
        'repoChange.modified': 'معدّل',
        'code.repo-preview-stale':
          'تغيرت النسخة أو المستودع بعد هذه المعاينة؛ أعد المعاينة',
        'code.repo-local-modified': 'للنسخة تعديلات محلية؛ أكّد استبدالها أولاً',
        'code.repo-local-unsafe':
          'تحتوي النسخة المثبتة على روابط أو ملفات خاصة أو تتجاوز الحدود الآمنة',
        'code.repo-up-to-date': 'هذه النسخة مطابقة للمستودع بالفعل',
        'code.repo-no-backup': 'لا توجد نسخة سابقة للرجوع إليها',
        'code.repo-backup-changed': 'تغيرت النسخة السابقة المحفوظة؛ رُفض الرجوع',
        'code.repo-skill-renamed':
          'أُعيدت تسمية المهارة في المصدر؛ لم تتغير النسخة المثبتة',
        'code.repo-recovery':
          'فشل الاسترداد التلقائي؛ الملفات الأصلية محفوظة في {recovery}. لا تكرر العملية',
        'code.repo-invalid-root':
          'تغيّرت الوجهة منذ التثبيت؛ لا يُمس النسخ. انسَ السجل بدلاً من ذلك.',
        'code.repo-root-valid':
          'الوجهة لم تتغير؛ استخدم النقل إلى سلة المحذوفات',
        repoConflictIn: 'الاسم مستخدم في',
        repoEmpty: 'لا توجد اشتراكات مستودعات',
        repoNoSkills: 'لا توجد مهارات في هذه اللقطة',
        repoInstall: 'تثبيت',
        repoUninstall: 'إزالة إلى السلة',
        repoDestination: 'التثبيت في',
        repoTracked: 'التثبيتات المتتبعة',
        repoSnapshot: 'اللقطة',
        repoLastError: 'فشل آخر تحديث؛ تُعرض اللقطة السابقة',
        repoBulk: 'حُدّث {done} من {total}؛ فشل {failed}',
        repoFromSource: 'المصدر',
        repoInstalledAt: 'مثبّت في',
        repoNoInstalls: 'لا توجد تثبيتات متتبعة',
        'repoKind.git-commit': 'إيداع Git',
        'repoKind.archive-sha256': 'بصمة الأرشيف (ليست إيداع Git)',
        'repoKind.folder-sha256': 'بصمة محتوى المجلد',
        'repoStatus.available': 'متاحة',
        'repoStatus.installed': 'مثبتة',
        'repoStatus.modified': 'معدلة محلياً',
        'repoStatus.missing': 'مفقودة',
        'repoStatus.conflict': 'تعارض اسم',
        'repoStatus.invalid': 'غير صالحة',
        'repoStatus.trashed': 'في السلة',
        'repoStatus.invalid-root': 'تغيّرت الوجهة',
        'code.repo-url':
          'عنوان المستودع غير مدعوم (استخدم owner/name أو رابط https/http بلا بيانات اعتماد أو مجلداً مطلقاً)',
        'code.repo-ref': 'اسم الفرع أو الوسم غير صالح',
        'code.repo-subdirectory': 'المجلد الفرعي غير صالح أو غير موجود',
        'code.repo-host': 'المضيفات المحلية والخاصة غير مسموحة',
        'code.repo-local': 'المجلد المحلي مفقود أو غير صالح',
        'code.repo-git': 'تعذرت قراءة المستودع عبر Git',
        'code.repo-git-missing': 'Git غير مثبت أو غير موجود في PATH',
        'code.repo-network': 'تعذر الوصول إلى المستودع (لا تُتبع إعادة التوجيه)',
        'code.repo-notfound': 'لم يُعثر على المستودع أو الفرع أو الوسم',
        'code.repo-auth': 'المصادقة مطلوبة؛ بيانات الاعتماد غير مدعومة',
        'code.repo-timeout': 'انتهت مهلة عملية المستودع',
        'code.repo-limit':
          'يتجاوز المستودع حدود الحجم أو عدد الملفات أو العمق الآمنة',
        'code.repo-archive': 'أرشيف المستودع غير صالح أو غير آمن',
        'code.repo-cancelled': 'أُلغيت العملية',
        'code.repo-duplicate': 'هذا المستودع مشترك فيه بالفعل',
        'code.repo-busy': 'يجري تحديث هذا المستودع بالفعل',
        'code.repo-not-found': 'لم يعد هذا الاشتراك موجوداً',
        'code.repo-stale': 'تغير المستودع؛ حدّث المعاينة وأعد المحاولة',
        'code.repo-conflict': 'توجد مهارة بهذا الاسم؛ لم يُستبدل شيء',
        'code.repo-skill-missing': 'هذه المهارة ليست في اللقطة الحالية',
        'code.repo-skill-invalid': 'هذه المهارة غير صالحة ولا يمكن تثبيتها',
        'code.repo-skill-limit': 'تتجاوز هذه المهارة حدود الحجم الآمنة',
        'code.repo-skill-metadata': 'بيانات هذه المهارة الوصفية غير صالحة',
        'code.repo-snapshot-changed':
          'لم تعد اللقطة المخزنة مطابقة؛ حدّث المستودع',
        'code.repo-not-installed': 'لم يعد هذا التثبيت المتتبع موجوداً',
        'code.repo-trashed': 'هذا التثبيت موجود بالفعل في السلة',
        'code.repo-missing': 'النسخة المثبتة مفقودة من القرص',
        'code.repo-state-invalid': 'حالة المستودعات غير مقروءة وتُركت دون تغيير',
        'code.repo-state-write': 'تعذر حفظ حالة المستودعات',
        'code.repo-install-failed': 'تعذر تثبيت المهارة',
        'code.repo-failed': 'فشلت عملية المستودع',
        importSkills: 'استيراد مهارات',
        importPath: 'المسار المحلي المطلق',
        previewImport: 'معاينة الاستيراد المحلي',
        importNow: 'استيراد الآن',
        uploadFiles: 'ملفات ZIP أو Markdown',
        uploadFolder: 'مجلد مهارة',
        importConflict: 'المهارات الموجودة',
        skipImport: 'تخطي الموجود',
        overwriteImport: 'استبدال الموجود (كل ملفات الحزمة)',
        importResult: 'نتائج الاستيراد',
        pendingImport: 'جاهزة',
        conflictsImport: 'تعارضات',
        importedImport: 'مستوردة',
        skippedImport: 'متخطاة',
        failedImport: 'فاشلة',
        warningsImport: 'تحذيرات التنظيف',
        inputsImport: 'الأرشيفات المعالجة',
        'code.import-cleanup':
          'تم الاستيراد بنجاح؛ تعذر تنظيف النسخة الاحتياطية. تحقق من مسار البقايا؛ قد تكون محتوياتها غير مكتملة',
        importHint:
          'ينسخ الملفات الأصلية. اختر التخطي أو الاستبدال صراحةً. المعاينة المحلية لا تكتب ملفات.',
        create: 'إنشاء مهارة',
        skillName: 'اسم المهارة',
        skillDescription: 'وصف الاستخدام',
        skillBody: 'تعليمات Markdown',
        destination: 'وجهة الإنشاء',
        created: 'تم إنشاء المهارة',
        'code.create-invalid': 'أدخل اسمًا ووصفًا وتعليمات صالحة',
        'code.create-conflict': 'توجد مهارة بهذا الاسم بالفعل',
        'code.create-readonly': 'هذا المصدر للقراءة فقط',
        'code.create-linked-root': 'لا يُسمح بمجلدات كتابة مرتبطة',
        'code.create-too-large': 'محتوى المهارة يتجاوز الحد المسموح',
        'code.create-failed': 'تعذر إنشاء المهارة',
        'code.import-path': 'مسار الاستيراد غير آمن',
        'code.import-limit':
          'يتجاوز الاستيراد حدود الملفات أو الحجم أو العمق أو عدد العناصر',
        'code.import-linked': 'لا يُسمح بالملفات المرتبطة أو الخاصة',
        'code.import-empty': 'لم يتم العثور على مستندات مهارات',
        'code.import-metadata': 'بيانات المهارة غير صالحة',
        'code.import-name': 'اسم المهارة غير صالح',
        'code.import-duplicate': 'مسارات أو أسماء استيراد مكررة',
        'code.import-encoding': 'ترميز الرفع غير صالح',
        'code.import-archive': 'أرشيف ZIP غير صالح أو غير مكتمل',
        'code.import-cancelled':
          'تم إلغاء الاستيراد والتخلص من التغييرات غير المنشورة',
        'code.import-overlap': 'يتداخل مصدر الاستيراد مع الوجهة',
        'code.import-conflict': 'اختر التخطي أو الاستبدال صراحةً',
        'code.import-failed': 'تعذر استيراد هذه المهارة',
        'code.import-recovery':
          'فشلت الاستعادة؛ تم الاحتفاظ بالنسخة الأصلية في مجلد الوجهة لاستعادتها',
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
        'code.project-mismatch': 'المشروع المحدد لا يطابق هذا العنصر',
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
        categories: 'التصنيفات',
        categoryName: 'اسم التصنيف',
        addCategory: 'إضافة تصنيف',
        uncategorized: 'بدون تصنيف',
        renameCategory: 'إعادة تسمية التصنيف',
        deleteCategory: 'حذف التصنيف',
        confirmDeleteCategory: 'تأكيد حذف التصنيف',
        deleteCategoryNote:
          'تصبح مهارات هذا التصنيف بلا تصنيف. لا تتغير أي ملفات مهارات',
        enableGroup: 'تفعيل المجموعة',
        disableGroup: 'تعطيل المجموعة',
        enableAll: 'تفعيل كل المهارات',
        disableAll: 'تعطيل كل المهارات',
        selectSkill: 'تحديد المهارة',
        assignTo: 'إسناد المحدد إلى',
        assignSelected: 'إسناد المحدد',
        moveUp: 'نقل للأعلى',
        moveDown: 'نقل للأسفل',
        filterCategory: 'التصنيف',
        allCategories: 'كل التصنيفات',
        note: 'ملاحظة',
        saveNote: 'حفظ الملاحظة',
        noteHint: 'الملاحظات قابلة للبحث ولا تغيّر وصف المهارة',
        noteLimit: 'حتى 500 حرف',
        selectAll: 'تحديد كل المهارات',
        bulkOverrideNote:
          'التفعيل أو التعطيل الجماعي يسري على هذا المصدر فقط ويستبدل اختيارات المهارات السابقة.',
        'code.invalid-request': 'الطلب غير صالح',
        'code.source-unknown': 'هذا المصدر غير متاح في هذا العرض',
        'code.organization-limit':
          'عدد التصنيفات أو الملاحظات أو الإسنادات لهذا المصدر كبير جدا',
        'code.state-too-large':
          'بيانات التنظيم المحفوظة كبيرة جدا؛ احذف بعض الملاحظات أو التصنيفات',
        placement: 'موضع الدخول',
        placementHint:
          'اختر مكان ظهور مدير المهارات: الإعدادات أو الشريط الجانبي أو كليهما',
        placementBoth: 'كلاهما',
        placementSidebar: 'الشريط الجانبي فقط',
        placementSettings: 'الإعدادات فقط',
        'code.category-name': 'أدخل اسم تصنيف لا يتجاوز 24 حرفاً',
        'code.category-duplicate': 'يوجد تصنيف بهذا الاسم بالفعل',
        'code.category-unknown': 'لم يعد هذا التصنيف موجوداً',
        'code.category-limit': 'بلغت الحد الأقصى وهو {limit} تصنيفاً',
        'code.skill-unknown': 'هذه المهارة غير متاحة في هذا العرض',
        'code.order-position': 'موضع الترتيب غير صالح',
        'code.order-target': 'هدف الترتيب في تصنيف آخر',
        'code.note-too-long': 'الملاحظة أطول من {limit} حرفاً',
        'code.placement-invalid': 'موضع الدخول غير صالح',
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
    const PROJECT_DEST = 'project-dsh:';
    // The project id is only a selector; the host re-resolves it from the registry for every action.
    const projectOfDest = (id: string) =>
      id.startsWith(PROJECT_DEST) ? id.slice(PROJECT_DEST.length) : undefined;
    const pathParts = (value: unknown) =>
      String(value)
        .split(/[\\/]+/)
        .filter(Boolean);
    // Registered projects can share a basename: add the shortest parent-folder suffix that tells them apart.
    const projectLabel = (data: any, id: string) => {
      const list: any[] = data?.projects ?? [];
      const found = list.find((x: any) => x.id === id);
      if (!found) return id;
      const same = list.filter((x: any) => x.name === found.name);
      if (same.length < 2) return found.name;
      const longest = Math.max(
        ...same.map((x: any) => pathParts(x.path).length),
      );
      for (let depth = 2; depth <= longest; depth++) {
        const tails = same.map((x: any) =>
          pathParts(x.path).slice(-depth, -1).join('/'),
        );
        if (tails.every(Boolean) && new Set(tails).size === tails.length)
          return `${found.name} (${pathParts(found.path).slice(-depth, -1).join('/')})`;
      }
      return `${found.name} (${found.path})`;
    };
    const projectFolder = (project: any) => {
      if (!project.available || !project.root) return undefined;
      const sep =
        project.root.includes('\\') && !project.root.includes('/') ? '\\' : '/';
      return `${project.root}${sep}.dsh${sep}skills`;
    };
    // Install destinations: the user sources plus every registered project's DSH folder; unavailable projects stay listed, disabled.
    const destinationsOf = (data: any) => [
      ...['user-dsh', 'user-agents'].flatMap((id) => {
        const found = data?.sources?.find((x: any) => x.id === id);
        return found
          ? [{ id, label: sourceLabel(found), path: found.path }]
          : [];
      }),
      ...(data?.projects ?? []).map((x: any) => ({
        id: `${PROJECT_DEST}${x.id}`,
        label: `${projectLabel(data, x.id)} — DSH`,
        path: projectFolder(x),
        project: true,
        ...(x.available
          ? {}
          : {
              disabled: true,
              reason: t(`code.${x.code ?? 'project-unavailable'}`),
            }),
      })),
    ];
    const validDestination = (data: any, id: string) =>
      destinationsOf(data).find((x: any) => x.id === id && !x.disabled);
    const destinationOption = (item: any, label = item.label) =>
      h(
        'option',
        { key: item.id, value: item.id, disabled: !!item.disabled },
        item.disabled ? `${label} · ${item.reason}` : label,
      );
    // Folder preview, project-write note and empty hints shown with every destination picker.
    const destinationInfo = (data: any, selected: any) => [
      !(data?.projects ?? []).length ? h('p', null, t('destNoProjects')) : null,
      selected
        ? selected.path
          ? h(
              'p',
              null,
              `${t('destPath')}: `,
              h('bdi', { dir: 'ltr' }, selected.path),
            )
          : null
        : h('p', null, t('destInvalid')),
      selected?.project ? h('p', null, t('destProjectNote')) : null,
    ];
    // Where a tracked copy lives: a project copy is always named by its project, never by a bare path.
    const placeName = (data: any, entry: any) => {
      if (entry.project) return `${projectLabel(data, entry.project)} — DSH`;
      const found = (data?.sources ?? []).find(
        (x: any) => x.id === entry.source,
      );
      return found ? sourceLabel(found) : entry.source;
    };
    const placeNode = (data: any, entry: any) =>
      h('bdi', { dir: 'ltr' }, placeName(data, entry));
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
    // navigator.clipboard is absent in insecure contexts and some webviews: reject so callers show a failed state.
    const copyText = (text: string): Promise<void> => {
      const clipboard =
        typeof navigator === 'undefined' ? undefined : navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== 'function')
        return Promise.reject(new Error('clipboard-unavailable'));
      return Promise.resolve().then(() => clipboard.writeText(text));
    };
    const errorText = (failure: any) =>
      failure?.code &&
      (dictionaries.en as Record<string, string>)[`code.${failure.code}`]
        ? t(`code.${failure.code}`)
            .replace('{limit}', String(failure.params?.limit ?? ''))
            .replace('{recovery}', String(failure.params?.recovery ?? ''))
        : t('error');

    // ClawHub popular/search and skills.sh search. Catalog text is untrusted: it is only ever rendered as
    // React text children (never HTML or markdown), and installs go through the host's confirmed route.
    const CATALOG_CAP = 100;
    // Modal dialog: moves focus in, restores it on close and closes on Escape.
    function CatalogDialog(props: {
      label: string;
      onClose: () => void;
      children?: any;
    }) {
      const ref = React.useRef(null as any);
      React.useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        ref.current?.focus?.();
        return () => previous?.focus?.();
      }, []);
      return h(
        'div',
        {
          role: 'dialog',
          'aria-modal': true,
          'aria-label': props.label,
          dir: isArabic() ? 'rtl' : undefined,
          ref,
          tabIndex: -1,
          onKeyDown: (event: any) => {
            if (event.key === 'Escape') {
              event.stopPropagation?.();
              props.onClose();
            }
          },
        },
        props.children,
      );
    }
    function CatalogPanel(props: {
      kind: string;
      data: any;
      setData: (value: any) => void;
      setNotice: (value: string) => void;
    }) {
      const { kind, data, setData, setNotice } = props;
      const [typed, setTyped] = React.useState(''),
        [committed, setCommitted] = React.useState(''),
        [items, setItems] = React.useState([] as any[]),
        [cursor, setCursor] = React.useState(null as string | null),
        [phase, setPhase] = React.useState('loading'),
        [more, setMore] = React.useState(false),
        [attempt, setAttempt] = React.useState(0),
        [sort, setSort] = React.useState('downloads'),
        [status, setStatus] = React.useState(''),
        [detail, setDetail] = React.useState(null as any),
        [copy, setCopy] = React.useState(''),
        [installing, setInstalling] = React.useState(null as any),
        [target, setTarget] = React.useState('user-dsh'),
        [conflict, setConflict] = React.useState(false),
        [confirming, setConfirming] = React.useState(null as any),
        [working, setWorking] = React.useState(''),
        [message, setMessage] = React.useState('');
      const request = React.useRef(null as AbortController | null);
      React.useEffect(() => {
        if (data && !validDestination(data, target)) setTarget('user-dsh');
      }, [data]);
      const sending = React.useRef(false);
      const searching = committed !== '';
      const recordsOf = (item: any) =>
        (data?.catalogInstalls ?? []).filter(
          (entry: any) => entry.catalogId === item.id,
        );
      // Only live copies make a skill "installed"; trashed, missing and unavailable records are history.
      const copiesOf = (item: any) =>
        recordsOf(item).filter(
          (entry: any) =>
            entry.status === 'installed' || entry.status === 'modified',
        );
      const bodyFor = (item: any) =>
        item.catalog === 'clawhub'
          ? { catalog: 'clawhub', owner: item.owner, slug: item.slug }
          : { catalog: 'skillsh', source: item.source, skillId: item.skillId };
      const load = (after?: string | null) => {
        request.current?.abort();
        const current = (request.current = new AbortController());
        if (after) setMore(true);
        else {
          setPhase('loading');
          setItems([]);
          setCursor(null);
        }
        const body =
          kind === 'skillsh'
            ? { action: 'catalog-skillsh-search', q: committed }
            : searching
              ? { action: 'catalog-clawhub-search', q: committed }
              : {
                  action: 'catalog-clawhub-list',
                  ...(after ? { cursor: after } : {}),
                };
        return call(body, current.signal)
          .then((value: any) => {
            if (request.current !== current) return;
            setItems((all: any[]) =>
              after
                ? [...all, ...value.items].slice(0, CATALOG_CAP)
                : value.items,
            );
            setCursor(value.nextCursor ?? null);
            setPhase('ready');
            setMore(false);
          })
          .catch((failure: any) => {
            if (failure?.name === 'AbortError' || request.current !== current)
              return;
            setPhase('error');
            setMore(false);
          });
      };
      React.useEffect(() => {
        if (kind === 'skillsh' && !committed) {
          request.current?.abort();
          setItems([]);
          setPhase('idle');
          return;
        }
        void load();
        return () => request.current?.abort();
      }, [kind, committed, attempt]);
      // Debounced live search; submitting the form searches immediately.
      React.useEffect(() => {
        const handle = setTimeout(() => setCommitted(typed.trim()), 300);
        return () => clearTimeout(handle);
      }, [typed]);
      const shown = items
        .filter((item: any) => {
          const copies = copiesOf(item).length;
          return (
            !status || (status === 'installed' ? copies > 0 : copies === 0)
          );
        })
        .slice()
        .sort((a: any, b: any) =>
          sort === 'name'
            ? a.name.localeCompare(b.name)
            : sort === 'installs'
              ? (b.installs ?? 0) - (a.installs ?? 0)
              : 0,
        );
      const sourceName = (id: string) => {
        const found = (data?.sources ?? []).find(
          (entry: any) => entry.id === id,
        );
        return found ? sourceLabel(found) : id;
      };
      const send = async (
        busyKey: string,
        body: any,
        done?: (value: any) => void,
      ) => {
        // The ref closes the window before the state update lands (two clicks in one tick).
        if (working || sending.current) return;
        sending.current = true;
        setWorking(busyKey);
        setNotice('');
        setMessage('');
        try {
          const value = await call(body);
          setData(value);
          done?.(value);
        } catch (failure: any) {
          setNotice(errorText(failure));
          if (failure?.code === 'repo-conflict') setConflict(true);
        } finally {
          sending.current = false;
          setWorking('');
        }
      };
      const openDetail = async (item: any) => {
        setCopy('');
        setDetail({ item, loading: true });
        try {
          const value = await call({
            action: 'catalog-detail',
            skill: bodyFor(item),
          });
          setDetail({ item, value });
        } catch (failure: any) {
          setDetail(null);
          setNotice(errorText(failure));
        }
      };
      const confirmInstall = (reassociate: boolean) =>
        send(
          `install:${installing.id}`,
          {
            action: 'catalog-install',
            skill: bodyFor(installing),
            destination: target,
            ...(projectOfDest(target)
              ? { project: projectOfDest(target) }
              : {}),
            confirm: true,
            ...(reassociate ? { reassociate: true } : {}),
          },
          () => {
            setInstalling(null);
            setConflict(false);
            setMessage(t('catInstallDone'));
          },
        );
      const metadata = (item: any) => [
        h(
          'bdi',
          { key: 'origin', dir: 'ltr' },
          item.catalog === 'clawhub'
            ? `${item.owner}/${item.slug}`
            : `${item.source}/${item.skillId}`,
        ),
        ...[
          item.downloads !== undefined
            ? `${item.downloads} ${t('catDownloads')}`
            : '',
          item.installs !== undefined
            ? `${item.installs} ${t('catInstalls')}`
            : '',
          item.stars !== undefined ? `${item.stars} ${t('catStars')}` : '',
        ]
          .filter(Boolean)
          .map((part) => ` · ${part}`),
      ];
      const shared = (entry: any) => entry.source === 'user-agents';
      const confirmAction = () =>
        send(
          `${confirming.action}:${confirming.entry.id}`,
          {
            action:
              confirming.action === 'uninstall'
                ? 'catalog-uninstall'
                : 'catalog-forget',
            installId: confirming.entry.id,
            ...(confirming.entry.project
              ? { project: confirming.entry.project }
              : {}),
          },
          () => setConfirming(null),
        );
      return h(
        'div',
        { 'data-majed-catalogs': true },
        h(
          'form',
          {
            onSubmit: (event: any) => {
              event.preventDefault();
              setCommitted(typed.trim());
              setAttempt((n: number) => n + 1);
            },
          },
          h('input', {
            'aria-label':
              kind === 'clawhub'
                ? t('catSearchClawhub')
                : t('catSearchSkillsh'),
            placeholder:
              kind === 'clawhub'
                ? t('catSearchClawhub')
                : t('catSearchSkillsh'),
            maxLength: 100,
            value: typed,
            onChange: (event: any) => setTyped(event.target.value),
          }),
          h('button', { type: 'submit' }, t('catSearch')),
        ),
        kind === 'clawhub' && !searching
          ? h('p', null, t('catPopularNote'))
          : null,
        kind === 'skillsh' && !searching
          ? h('p', null, t('catSkillshHint'))
          : null,
        !searching || kind === 'skillsh'
          ? h(
              'select',
              {
                'aria-label': t('catStatusFilter'),
                value: status,
                onChange: (event: any) => setStatus(event.target.value),
              },
              h('option', { value: '' }, t('catStatusAll')),
              h('option', { value: 'available' }, t('catStatusAvailable')),
              h('option', { value: 'installed' }, t('catStatusInstalled')),
            )
          : null,
        kind === 'clawhub' && !searching
          ? h(
              'select',
              {
                'aria-label': t('catSort'),
                value: sort,
                onChange: (event: any) => setSort(event.target.value),
              },
              h('option', { value: 'downloads' }, t('catSortDownloads')),
              h('option', { value: 'installs' }, t('catSortInstalls')),
              h('option', { value: 'name' }, t('catSortName')),
            )
          : null,
        message ? h('p', { role: 'status' }, message) : null,
        phase === 'loading'
          ? h('p', { role: 'status' }, t('catLoading'))
          : null,
        phase === 'error'
          ? h(
              'div',
              { role: 'alert' },
              h('p', null, t('catLoadError')),
              h(
                'button',
                { onClick: () => setAttempt((n: number) => n + 1) },
                t('catRetry'),
              ),
            )
          : null,
        phase === 'ready' && !shown.length
          ? h('p', null, searching ? t('catSearchEmpty') : t('catEmpty'))
          : null,
        h(
          'ul',
          null,
          ...shown.map((item: any) => {
            const copies = copiesOf(item);
            return h(
              'li',
              { key: item.id, 'data-majed-catalog-item': item.id },
              h('strong', null, item.name),
              item.summary ? h('p', null, item.summary) : null,
              h('small', null, ...metadata(item)),
              copies.length ? h('span', null, ` ${t('catInstalled')}`) : null,
              !copies.length && recordsOf(item).length
                ? h(
                    'p',
                    { role: 'note' },
                    t(`catHint.${recordsOf(item)[0].status}`),
                  )
                : null,
              h(
                'button',
                {
                  'aria-label': `${t('catDetails')}: ${item.name}`,
                  onClick: () => void openDetail(item),
                },
                t('details'),
              ),
              h(
                'button',
                {
                  'aria-label': `${copies.length ? t('catInstallElsewhere') : t('catInstall')}: ${item.name}`,
                  disabled: !!working,
                  onClick: () => {
                    setInstalling(item);
                    setConflict(false);
                    setTarget('user-dsh');
                  },
                },
                copies.length ? t('catInstallElsewhere') : t('catInstall'),
              ),
              recordsOf(item).length
                ? h(
                    'ul',
                    { 'aria-label': `${t('catCopies')}: ${item.name}` },
                    ...recordsOf(item).map((entry: any) =>
                      h(
                        'li',
                        { key: entry.id, 'data-majed-catalog-copy': entry.id },
                        placeNode(data, entry),
                        ' · ',
                        h('bdi', { dir: 'ltr' }, `${entry.root}/${entry.name}`),
                        ` · ${t(`catStatus.${entry.status}`)}`,
                        entry.status === 'invalid-root' ||
                          entry.status === 'missing'
                          ? h(
                              'button',
                              {
                                'aria-label': `${t('catForget')}: ${item.name} — ${placeName(data, entry)}`,
                                disabled: !!working,
                                onClick: () =>
                                  setConfirming({
                                    action: 'forget',
                                    entry,
                                    item,
                                  }),
                              },
                              t('catForget'),
                            )
                          : entry.status === 'trashed'
                            ? null
                            : h(
                                'button',
                                {
                                  'aria-label': `${t('catUninstall')}: ${item.name} — ${placeName(data, entry)}`,
                                  disabled: !!working,
                                  onClick: () =>
                                    setConfirming({
                                      action: 'uninstall',
                                      entry,
                                      item,
                                    }),
                                },
                                t('catUninstall'),
                              ),
                      ),
                    ),
                  )
                : null,
            );
          }),
        ),
        kind === 'clawhub' && !searching && cursor && items.length < CATALOG_CAP
          ? h(
              'button',
              {
                disabled: more,
                'aria-live': 'polite',
                'aria-busy': more,
                onClick: () => void load(cursor),
              },
              more ? t('catLoadingMore') : t('catLoadMore'),
            )
          : null,
        detail
          ? h(
              CatalogDialog,
              { label: t('catDetails'), onClose: () => setDetail(null) },
              h('h4', null, detail.item.name),
              detail.loading
                ? h('p', { role: 'status' }, t('catDetailLoading'))
                : h(
                    'div',
                    null,
                    h('p', null, detail.value.description),
                    h(
                      'p',
                      null,
                      `${t('catOrigin')}: `,
                      h('bdi', { dir: 'ltr' }, detail.value.origin),
                    ),
                    h('textarea', {
                      readOnly: true,
                      'aria-label': 'SKILL.md',
                      value: detail.value.body,
                    }),
                    h(
                      'button',
                      {
                        onClick: () =>
                          copyText(detail.value.body).then(
                            () => setCopy(t('catCopied')),
                            () => setCopy(t('catCopyFailed')),
                          ),
                      },
                      t('catCopy'),
                    ),
                    copy ? h('span', { role: 'status' }, copy) : null,
                  ),
              h('button', { onClick: () => setDetail(null) }, t('catClose')),
            )
          : null,
        installing
          ? h(
              CatalogDialog,
              {
                label: t('catInstallTitle'),
                onClose: () => setInstalling(null),
              },
              h('h4', null, `${t('catInstallTitle')}: ${installing.name}`),
              h('p', null, ...metadata(installing)),
              h(
                'select',
                {
                  'aria-label': t('repoDestination'),
                  value: target,
                  onChange: (event: any) => setTarget(event.target.value),
                },
                ...destinationsOf(data).map((item: any) =>
                  destinationOption(item),
                ),
              ),
              ...destinationInfo(data, validDestination(data, target)),
              h(
                'button',
                {
                  disabled: !!working || !validDestination(data, target),
                  onClick: () => void confirmInstall(false),
                },
                t('catInstallConfirm'),
              ),
              conflict
                ? h(
                    'button',
                    {
                      disabled: !!working || !validDestination(data, target),
                      onClick: () => void confirmInstall(true),
                    },
                    t('catReassociate'),
                  )
                : null,
              h('button', { onClick: () => setInstalling(null) }, t('cancel')),
            )
          : null,
        confirming
          ? h(
              CatalogDialog,
              {
                label:
                  confirming.action === 'uninstall'
                    ? t('catUninstallTitle')
                    : t('catForgetTitle'),
                onClose: () => setConfirming(null),
              },
              h(
                'h4',
                null,
                confirming.action === 'uninstall'
                  ? t('catUninstallTitle')
                  : t('catForgetTitle'),
              ),
              h(
                'p',
                null,
                ...(confirming.action === 'uninstall'
                  ? t('catUninstallBody')
                  : t('catForgetBody')
                )
                  .replace('{name}', confirming.item.name)
                  .split('{where}')
                  .flatMap((part: string, index: number) =>
                    index
                      ? [
                          placeNode(data, confirming.entry),
                          ' (',
                          h(
                            'bdi',
                            { dir: 'ltr' },
                            `${confirming.entry.root}/${confirming.entry.name}`,
                          ),
                          ')',
                          part,
                        ]
                      : [part],
                  ),
              ),
              confirming.action === 'uninstall' && shared(confirming.entry)
                ? h('p', { role: 'alert' }, t('catSharedWarning'))
                : null,
              h(
                'button',
                { disabled: !!working, onClick: () => void confirmAction() },
                confirming.action === 'uninstall'
                  ? t('catConfirmUninstall')
                  : t('catConfirmForget'),
              ),
              h('button', { onClick: () => setConfirming(null) }, t('cancel')),
            )
          : null,
      );
    }
    function Section() {
      const [data, setData] = React.useState(null),
        [error, setError] = React.useState(false),
        [query, setQuery] = React.useState(''),
        [source, setSource] = React.useState(''),
        [status, setStatus] = React.useState(''),
        [detail, setDetail] = React.useState(null),
        [detailError, setDetailError] = React.useState(false),
        [scope, setScope] = React.useState('global'),
        [tab, setTab] = React.useState('git'),
        [project, setProject] = React.useState(''),
        [folderPath, setFolderPath] = React.useState(''),
        [candidates, setCandidates] = React.useState(null),
        [editing, setEditing] = React.useState(null),
        [removing, setRemoving] = React.useState(''),
        [pendingScan, setPendingScan] = React.useState(false),
        [loaded, setLoaded] = React.useState(''),
        [notice, setNotice] = React.useState(''),
        [managing, setManaging] = React.useState(false),
        [catName, setCatName] = React.useState({}),
        [catEdit, setCatEdit] = React.useState(null),
        [catRemoving, setCatRemoving] = React.useState(''),
        [catFilter, setCatFilter] = React.useState(''),
        [picked, setPicked] = React.useState({}),
        [assignTarget, setAssignTarget] = React.useState({}),
        [noteDrafts, setNoteDrafts] = React.useState({}),
        [dragging, setDragging] = React.useState(null),
        [importing, setImporting] = React.useState(false),
        [importPath, setImportPath] = React.useState(''),
        [importFiles, setImportFiles] = React.useState([]),
        [importConflict, setImportConflict] = React.useState(''),
        [importResult, setImportResult] = React.useState(null),
        [importBusy, setImportBusy] = React.useState(false),
        [trashDeleting, setTrashDeleting] = React.useState(''),
        [repoForm, setRepoForm] = React.useState({
          url: '',
          ref: '',
          subdirectory: '',
        }),
        [repoFilter, setRepoFilter] = React.useState(''),
        [repoStatusFilter, setRepoStatusFilter] = React.useState(''),
        [repoRepoFilter, setRepoRepoFilter] = React.useState(''),
        [repoUnsubscribing, setRepoUnsubscribing] = React.useState(''),
        [repoForgetting, setRepoForgetting] = React.useState(''),
        [repoTarget, setRepoTarget] = React.useState('user-dsh'),
        [repoBusy, setRepoBusy] = React.useState(''),
        [repoSummary, setRepoSummary] = React.useState(''),
        // One open preview per tracked copy: digests from the host bind the later apply.
        [repoPreviews, setRepoPreviews] = React.useState(
          {} as Record<string, any>,
        ),
        [repoOverwrites, setRepoOverwrites] = React.useState(
          {} as Record<string, boolean>,
        ),
        [creating, setCreating] = React.useState(false),
        [createName, setCreateName] = React.useState(''),
        [createDescription, setCreateDescription] = React.useState(''),
        [createBody, setCreateBody] = React.useState(''),
        [createSource, setCreateSource] = React.useState('user-dsh');
      const dialog = React.useRef(null);
      const repoDestination = validDestination(data, repoTarget);
      // A project that leaves the registry drops out of the picker: fall back to the default destination.
      React.useEffect(() => {
        if (data && !validDestination(data, repoTarget))
          setRepoTarget('user-dsh');
      }, [data]);
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
        setPicked({});
        setCatFilter('');
        setNoteDrafts({});
        setDragging(null);
        setCatEdit(null);
        setCatRemoving('');
        void load();
      }, [scope, project]);
      React.useEffect(() => {
        setDragging(null);
        setCatFilter('');
      }, [source]);
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
      // Repository actions show per-repository progress while the host works.
      const repoAction = async (
        busyKey: string,
        body: any,
        done?: (value: any) => void,
      ) => {
        if (repoBusy || busy.current) return;
        setRepoBusy(busyKey);
        setRepoSummary('');
        try {
          await mutate(body, done);
        } finally {
          setRepoBusy('');
        }
      };
      // Install and uninstall report cleanup/recovery warnings; show them instead of dropping them.
      const repoWarning = (value: any) => {
        const result = value?.result;
        const lines: string[] = [];
        if (result?.warning)
          lines.push(
            `${t(`code.${result.warning}`)} ${result.path ?? ''}`.trim(),
          );
        for (const item of result?.warnings ?? [])
          lines.push(
            `${item.name}: ${t(`code.${item.code}`)} ${(item.recovery ?? []).join(' ')}`.trim(),
          );
        if (lines.length) setNotice(lines.join(' · '));
      };
      const repoPreview = (record: any, kind: 'update' | 'rollback') =>
        void repoAction(
          record.id,
          {
            action: `repo-${kind}-preview`,
            installId: record.id,
            ...(record.project ? { project: record.project } : {}),
          },
          (value: any) => {
            setRepoPreviews((all: any) => ({
              ...all,
              [record.id]: { kind, ...value.result },
            }));
            setRepoOverwrites((all: any) => ({ ...all, [record.id]: false }));
          },
        );
      const repoApply = (record: any) => {
        const preview = repoPreviews[record.id];
        if (!preview) return;
        const clear = () =>
          setRepoPreviews(({ [record.id]: _gone, ...rest }) => rest);
        void repoAction(
          `apply:${record.id}`,
          {
            action: `repo-${preview.kind}`,
            installId: record.id,
            current: preview.current,
            target: preview.target.digest,
            snapshot: preview.snapshot,
            overwrite: !!repoOverwrites[record.id],
            ...(record.project ? { project: record.project } : {}),
          },
          (value: any) => {
            clear();
            // Success is announced (role=status); a cleanup warning replaces it so it is not lost.
            setNotice(
              t(
                preview.kind === 'update' ? 'repoUpdated' : 'repoRolledBack',
              ).replace('{name}', record.name),
            );
            repoWarning(value);
          },
        );
      };
      const runImport = async (dryRun: boolean) => {
        if (busy.current || switching || importBusy || !importConflict) return;
        setImportBusy(true);
        const requested = key;
        try {
          const body: any = {
            action: 'import',
            path: importPath,
            dryRun,
            conflict: importConflict,
            ...selected,
            source:
              scope === 'project' ? `project-dsh:${project}` : createSource,
          };
          if (!dryRun && importFiles.length) {
            body.action = 'upload';
            if (
              importFiles.length > 512 ||
              importFiles.reduce(
                (sum: number, file: any) => sum + file.size,
                0,
              ) > 1048576
            )
              throw new Error(t('code.import-limit'));
            const entries = [];
            for (const file of importFiles) {
              if (lifetime.current.signal.aborted) return;
              const bytes = new Uint8Array(await file.arrayBuffer());
              let binary = '';
              for (const byte of bytes) binary += String.fromCharCode(byte);
              entries.push({
                path: file.webkitRelativePath || file.name,
                data: btoa(binary),
              });
            }
            body.archives = entries.filter(
              (entry) =>
                !entry.path.includes('/') && /\.zip$/i.test(entry.path),
            );
            body.entries = entries.filter(
              (entry) =>
                entry.path.includes('/') || !/\.zip$/i.test(entry.path),
            );
          }
          await mutate(body, (value: any) => setImportResult(value.result));
        } catch (error: any) {
          if (keyRef.current === requested) setNotice(error.message);
        } finally {
          setImportBusy(false);
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
      const view =
        scope === 'trash' || scope === 'discover'
          ? { sources: [], copies: [], diagnostics: [] }
          : inProject
            ? (data?.project ?? { sources: [], copies: [], diagnostics: [] })
            : data;
      const orgOf = (sourceId: string) => ({
        categories: [] as any[],
        members: {} as Record<string, string>,
        order: {} as Record<string, string[]>,
        notes: {} as Record<string, string>,
        ...(view?.organization?.[sourceId] ?? {}),
      });
      const filterCategories = source ? orgOf(source).categories : [];
      const activeCat =
        catFilter === '__none' ||
        filterCategories.some((c: any) => c.id === catFilter)
          ? catFilter
          : '';
      const copies = (view?.copies ?? []).filter((copy: any) => {
        const organization = orgOf(copy.source);
        return (
          (!source || copy.source === source) &&
          (!query ||
            `${copy.name} ${copy.description} ${copy.path} ${organization.notes[copy.name] ?? ''}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!status || copyStatus(copy) === status) &&
          (!activeCat ||
            (activeCat === '__none'
              ? !organization.members[copy.name]
              : organization.members[copy.name] === activeCat))
        );
      });
      const projects = data?.projects ?? [];
      const projectName = (id: string) =>
        projects.find((x: any) => x.id === id)?.name ?? id;
      const destinationName = () => `${projectName(project)} — DSH`;
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
      const organize = (body: any, done?: (value: any) => void) =>
        mutate({ ...body, ...selected }, done);
      const skillNames = (sourceId: string) =>
        [
          ...new Set(
            (view?.copies ?? [])
              .filter(
                (c: any) => c.source === sourceId && c.metadataValid !== false,
              )
              .map((c: any) => c.name as string),
          ),
        ] as string[];
      const groupNames = (sourceId: string, id: string) => {
        const organization = orgOf(sourceId);
        const available = skillNames(sourceId)
          .filter((n) => (organization.members[n] ?? '') === id)
          .sort((a, b) => a.localeCompare(b));
        const saved = (organization.order[id] ?? []).filter((n: string) =>
          available.includes(n),
        );
        return [...saved, ...available.filter((n) => !saved.includes(n))];
      };
      /** Selection pruned against what the source really lists now. */
      const pickedIn = (sourceId: string): string[] => {
        const names = skillNames(sourceId);
        return ((picked as any)[sourceId] ?? []).filter((n: string) =>
          names.includes(n),
        );
      };
      const setPickedIn = (sourceId: string, names: string[]) =>
        setPicked({ ...picked, [sourceId]: names });
      const move = (
        sourceId: string,
        name: string,
        category: string,
        target?: string,
        position?: string,
      ) =>
        void organize({
          action: 'category-move',
          source: sourceId,
          name,
          category,
          target,
          position,
        });
      const draggedInto = (sourceId: string) =>
        dragging && (dragging as any).source === sourceId
          ? ((dragging as any).name as string)
          : '';
      const groupBlock = (
        sourceId: string,
        group: { id: string; name: string },
      ) => {
        const names = groupNames(sourceId, group.id);
        const marked = pickedIn(sourceId);
        const editKey = `${sourceId}/${group.id}`;
        return h(
          'section',
          {
            key: group.id || 'none',
            'aria-label': group.name,
            onDragOver: (e: any) => e.preventDefault?.(),
            onDrop: (e: any) => {
              e.preventDefault?.();
              const dragged = draggedInto(sourceId);
              setDragging(null);
              if (dragged) move(sourceId, dragged, group.id);
            },
          },
          h('h4', null, `${group.name} (${names.length})`),
          h(
            'button',
            {
              'aria-label': `${t('enableGroup')}: ${group.name}`,
              onClick: () =>
                void organize({
                  action: 'category-toggle',
                  source: sourceId,
                  category: group.id,
                  enabled: true,
                }),
            },
            t('enableGroup'),
          ),
          h(
            'button',
            {
              'aria-label': `${t('disableGroup')}: ${group.name}`,
              onClick: () =>
                void organize({
                  action: 'category-toggle',
                  source: sourceId,
                  category: group.id,
                  enabled: false,
                }),
            },
            t('disableGroup'),
          ),
          group.id
            ? (catEdit as any)?.key === editKey
              ? h(
                  'span',
                  null,
                  field(t('renameCategory'), (catEdit as any).name, (v) =>
                    setCatEdit({ ...(catEdit as any), name: v }),
                  ),
                  h(
                    'button',
                    {
                      'aria-label': `${t('save')}: ${group.name}`,
                      onClick: () =>
                        void organize(
                          {
                            action: 'category-rename',
                            source: sourceId,
                            category: group.id,
                            name: (catEdit as any).name,
                          },
                          () => setCatEdit(null),
                        ),
                    },
                    t('save'),
                  ),
                  h(
                    'button',
                    {
                      'aria-label': `${t('cancel')}: ${group.name}`,
                      onClick: () => setCatEdit(null),
                    },
                    t('cancel'),
                  ),
                )
              : catRemoving === editKey
                ? h(
                    'span',
                    null,
                    h('p', null, t('deleteCategoryNote')),
                    h(
                      'button',
                      {
                        'aria-label': `${t('confirmDeleteCategory')}: ${group.name}`,
                        onClick: () =>
                          void organize(
                            {
                              action: 'category-delete',
                              source: sourceId,
                              category: group.id,
                            },
                            () => setCatRemoving(''),
                          ),
                      },
                      t('confirmDeleteCategory'),
                    ),
                    h(
                      'button',
                      {
                        'aria-label': `${t('cancel')}: ${group.name}`,
                        onClick: () => setCatRemoving(''),
                      },
                      t('cancel'),
                    ),
                  )
                : h(
                    'span',
                    null,
                    h(
                      'button',
                      {
                        'aria-label': `${t('renameCategory')}: ${group.name}`,
                        onClick: () =>
                          setCatEdit({
                            key: editKey,
                            id: group.id,
                            name: group.name,
                          }),
                      },
                      t('renameCategory'),
                    ),
                    h(
                      'button',
                      {
                        'aria-label': `${t('deleteCategory')}: ${group.name}`,
                        onClick: () => setCatRemoving(editKey),
                      },
                      t('deleteCategory'),
                    ),
                  )
            : null,
          ...names.map((name, i) =>
            h(
              'div',
              {
                key: name,
                'data-skill': name,
                draggable: true,
                onDragStart: (e: any) => {
                  e.dataTransfer?.setData?.('text/plain', name);
                  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
                  setDragging({ source: sourceId, name });
                },
                onDragEnd: () => setDragging(null),
                onDragOver: (e: any) => e.preventDefault?.(),
                onDrop: (e: any) => {
                  e.stopPropagation?.();
                  e.preventDefault?.();
                  const dragged = draggedInto(sourceId);
                  setDragging(null);
                  if (dragged && dragged !== name)
                    move(sourceId, dragged, group.id, name, 'before');
                },
              },
              h('input', {
                type: 'checkbox',
                'aria-label': `${t('selectSkill')}: ${name}`,
                checked: marked.includes(name),
                onChange: (e: any) =>
                  setPickedIn(
                    sourceId,
                    e.target.checked
                      ? [...marked, name]
                      : marked.filter((x: string) => x !== name),
                  ),
              }),
              h('span', null, name),
              h(
                'button',
                {
                  disabled: i === 0,
                  'aria-label': `${t('moveUp')}: ${name}`,
                  onClick: () =>
                    move(sourceId, name, group.id, names[i - 1], 'before'),
                },
                t('moveUp'),
              ),
              h(
                'button',
                {
                  disabled: i === names.length - 1,
                  'aria-label': `${t('moveDown')}: ${name}`,
                  onClick: () =>
                    move(sourceId, name, group.id, names[i + 1], 'after'),
                },
                t('moveDown'),
              ),
            ),
          ),
        );
      };
      const organizer = (sourceId: string, label: string) => {
        const organization = orgOf(sourceId);
        const marked = pickedIn(sourceId);
        const all = skillNames(sourceId);
        const name = (catName as any)[sourceId] ?? '';
        const target = (assignTarget as any)[sourceId] ?? '';
        const toggleAll = (enabled: boolean) =>
          void organize({
            action: 'category-toggle',
            source: sourceId,
            category: '*',
            enabled,
          });
        return h(
          'div',
          {
            'data-organizer': sourceId,
            dir: isArabic() ? 'rtl' : undefined,
          },
          h('h3', null, `${t('categories')} · ${label}`),
          h('p', null, t('bulkOverrideNote')),
          field(`${t('categoryName')}: ${label}`, name, (v) =>
            setCatName({ ...catName, [sourceId]: v }),
          ),
          h(
            'button',
            {
              'aria-label': `${t('addCategory')}: ${label}`,
              onClick: () =>
                void organize(
                  { action: 'category-create', source: sourceId, name },
                  () => setCatName({ ...catName, [sourceId]: '' }),
                ),
            },
            t('addCategory'),
          ),
          h(
            'button',
            {
              'aria-label': `${t('enableAll')}: ${label}`,
              onClick: () => toggleAll(true),
            },
            t('enableAll'),
          ),
          h(
            'button',
            {
              'aria-label': `${t('disableAll')}: ${label}`,
              onClick: () => toggleAll(false),
            },
            t('disableAll'),
          ),
          h('input', {
            type: 'checkbox',
            'aria-label': `${t('selectAll')}: ${label}`,
            checked: !!all.length && marked.length === all.length,
            onChange: (e: any) =>
              setPickedIn(sourceId, e.target.checked ? all : []),
          }),
          h(
            'select',
            {
              'aria-label': `${t('assignTo')}: ${label}`,
              value: target,
              onChange: (e: any) =>
                setAssignTarget({
                  ...assignTarget,
                  [sourceId]: e.target.value,
                }),
            },
            h('option', { value: '' }, t('uncategorized')),
            ...organization.categories.map((c: any) =>
              h('option', { key: c.id, value: c.id }, c.name),
            ),
          ),
          h(
            'button',
            {
              disabled: !marked.length,
              'aria-label': `${t('assignSelected')}: ${label}`,
              onClick: () =>
                void organize(
                  {
                    action: 'category-assign',
                    source: sourceId,
                    names: marked,
                    category: target,
                  },
                  () => setPickedIn(sourceId, []),
                ),
            },
            t('assignSelected'),
          ),
          ...[
            ...organization.categories,
            { id: '', name: t('uncategorized') },
          ].map((group) => groupBlock(sourceId, group)),
        );
      };
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
        data?.trashError
          ? h('p', { role: 'alert' }, t(`code.${data.trashError}`))
          : null,
        scope === 'trash'
          ? h(
              'div',
              { 'data-majed-trash': true },
              h('h3', null, t('trash')),
              !data?.trashError && !data?.trash?.length
                ? h('p', null, t('trashEmpty'))
                : null,
              ...(data?.trash ?? []).map((item: any) =>
                h(
                  'article',
                  { key: item.id },
                  h('strong', null, item.name),
                  h('p', null, `${t('trashOrigin')}: ${item.origin}`),
                  item.scope !== 'global'
                    ? h(
                        'p',
                        null,
                        `${t('project')}: ${projectName(item.scope)}`,
                      )
                    : null,
                  h('p', null, `${item.source} — ${item.deletedAt}`),
                  h(
                    'button',
                    {
                      'aria-label': `${t('restoreTrash')}: ${item.name}`,
                      onClick: () =>
                        void mutate(
                          { action: 'trash-restore', id: item.id },
                          (value: any) => {
                            if (value.result?.warning)
                              setNotice(
                                `${t(`code.${value.result.warning}`)} ${value.result.path ?? ''}`,
                              );
                          },
                        ),
                    },
                    t('restoreTrash'),
                  ),
                  h(
                    'button',
                    {
                      'aria-label': `${t('deleteTrash')}: ${item.name}`,
                      onClick: () => setTrashDeleting(item.id),
                    },
                    t('deleteTrash'),
                  ),
                  trashDeleting === item.id
                    ? h(
                        'div',
                        { role: 'alert' },
                        h(
                          'p',
                          null,
                          item.scope !== 'global'
                            ? `${t('trashWarning')} (${projectName(item.scope)})`
                            : t('trashWarning'),
                        ),
                        h(
                          'button',
                          {
                            onClick: () =>
                              void mutate(
                                {
                                  action: 'trash-delete',
                                  id: item.id,
                                  confirm: true,
                                },
                                (value: any) => {
                                  setTrashDeleting('');
                                  if (value.result?.warning)
                                    setNotice(
                                      t(`code.${value.result.warning}`),
                                    );
                                },
                              ),
                          },
                          t('confirmTrash'),
                        ),
                        h(
                          'button',
                          { onClick: () => setTrashDeleting('') },
                          t('cancel'),
                        ),
                      )
                    : null,
                ),
              ),
            )
          : null,
        scope === 'discover'
          ? h(
              'div',
              {
                role: 'tablist',
                'aria-label': t('scopeDiscover'),
                'data-majed-discover-tabs': true,
              },
              ...[
                ['git', t('tabGit')],
                ['clawhub', t('catSourceClawhub')],
                ['skillsh', t('catSourceSkillsh')],
              ].map(([id, label], index, all) =>
                h(
                  'button',
                  {
                    key: id,
                    type: 'button',
                    role: 'tab',
                    id: `majed-discover-tab-${id}`,
                    'aria-selected': tab === id,
                    'aria-controls': 'majed-discover-panel',
                    tabIndex: tab === id ? 0 : -1,
                    onClick: () => setTab(id),
                    onKeyDown: (event: any) => {
                      const step =
                        event.key === 'ArrowRight'
                          ? isArabic()
                            ? -1
                            : 1
                          : event.key === 'ArrowLeft'
                            ? isArabic()
                              ? 1
                              : -1
                            : 0;
                      const edge =
                        event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? all.length - 1
                            : undefined;
                      const next =
                        edge ??
                        (step
                          ? (index + step + all.length) % all.length
                          : undefined);
                      if (next === undefined) return;
                      event.preventDefault?.();
                      setTab(all[next][0]);
                      (
                        document.getElementById?.(
                          `majed-discover-tab-${all[next][0]}`,
                        ) as HTMLElement | null
                      )?.focus?.();
                    },
                  },
                  label,
                ),
              ),
            )
          : null,
        scope === 'discover' && tab === 'git'
          ? h(
              'div',
              {
                id: 'majed-discover-panel',
                role: 'tabpanel',
                'aria-labelledby': 'majed-discover-tab-git',
                'data-majed-repositories': true,
              },
              h('h3', null, t('repositories')),
              h(
                'form',
                {
                  onSubmit: (event: any) => {
                    event.preventDefault();
                    void repoAction(
                      'add',
                      { action: 'repo-add', repository: { ...repoForm } },
                      () => setRepoForm({ url: '', ref: '', subdirectory: '' }),
                    );
                  },
                },
                h('h4', null, t('repoAddTitle')),
                field(t('repoUrl'), repoForm.url, (value: string) =>
                  setRepoForm({ ...repoForm, url: value }),
                ),
                field(t('repoRef'), repoForm.ref, (value: string) =>
                  setRepoForm({ ...repoForm, ref: value }),
                ),
                field(
                  t('repoSubdirectory'),
                  repoForm.subdirectory,
                  (value: string) =>
                    setRepoForm({ ...repoForm, subdirectory: value }),
                ),
                h(
                  'button',
                  {
                    type: 'submit',
                    disabled: !repoForm.url.trim() || !!repoBusy || switching,
                  },
                  t('repoAdd'),
                ),
              ),
              h(
                'button',
                {
                  disabled:
                    !data?.repositories?.length || !!repoBusy || switching,
                  onClick: () =>
                    void repoAction(
                      'all',
                      { action: 'repo-refresh-all' },
                      (value: any) =>
                        setRepoSummary(
                          t('repoBulk')
                            .replace(
                              '{done}',
                              String(value.result.refreshed.length),
                            )
                            .replace('{total}', String(value.result.total))
                            .replace(
                              '{failed}',
                              String(value.result.failed.length),
                            ),
                        ),
                    ),
                },
                t('repoRefreshAll'),
              ),
              repoBusy
                ? h(
                    'p',
                    { role: 'status' },
                    t(
                      repoBusy.startsWith('apply:')
                        ? 'repoApplying'
                        : 'repoRefreshing',
                    ),
                  )
                : null,
              repoSummary ? h('p', { role: 'status' }, repoSummary) : null,
              data?.repoError
                ? h('p', { role: 'alert' }, t(`code.${data.repoError}`))
                : null,
              field(t('repoFilter'), repoFilter, setRepoFilter),
              h(
                'select',
                {
                  'aria-label': t('repoStatusFilter'),
                  value: repoStatusFilter,
                  onChange: (event: any) =>
                    setRepoStatusFilter(event.target.value),
                },
                h('option', { key: '', value: '' }, t('repoAllStatuses')),
                ...[
                  'available',
                  'installed',
                  'update',
                  'conflict',
                  'invalid',
                ].map((id) =>
                  h('option', { key: id, value: id }, t(`repoStatus.${id}`)),
                ),
              ),
              h(
                'select',
                {
                  'aria-label': t('repoRepoFilter'),
                  value: repoRepoFilter,
                  onChange: (event: any) =>
                    setRepoRepoFilter(event.target.value),
                },
                h('option', { key: '', value: '' }, t('repoAllRepositories')),
                ...(data?.repositories ?? []).map((repo: any) =>
                  h('option', { key: repo.id, value: repo.id }, repo.label),
                ),
              ),
              h(
                'select',
                {
                  'aria-label': t('repoDestination'),
                  value: repoTarget,
                  onChange: (event: any) => setRepoTarget(event.target.value),
                },
                ...destinationsOf(data).map((item: any) =>
                  destinationOption(
                    item,
                    item.id === 'user-dsh'
                      ? 'DSH'
                      : item.id === 'user-agents'
                        ? 'Shared Agents'
                        : item.label,
                  ),
                ),
              ),
              ...destinationInfo(data, repoDestination),
              !data?.repoError && !data?.repositories?.length
                ? h('p', null, t('repoEmpty'))
                : null,
              ...(data?.repositories ?? []).map((repo: any) => {
                const needle = repoFilter.trim().toLowerCase();
                if (repoRepoFilter && repo.id !== repoRepoFilter) return null;
                const shown = repo.skills.filter(
                  (skill: any) =>
                    (!repoStatusFilter ||
                      skill.status === repoStatusFilter ||
                      (repoStatusFilter === 'update' &&
                        skill.updateAvailable)) &&
                    (!needle ||
                      `${skill.name} ${skill.description} ${skill.path}`
                        .toLowerCase()
                        .includes(needle)),
                );
                if ((needle || repoStatusFilter) && !shown.length) return null;
                return h(
                  'article',
                  { key: repo.id, 'data-majed-repository': repo.id },
                  h('strong', null, repo.label),
                  h(
                    'p',
                    null,
                    `${t('repoFromSource')}: ${repo.kind}${repo.ref ? ` @ ${repo.ref}` : ''}${repo.subdirectory ? ` / ${repo.subdirectory}` : ''}`,
                  ),
                  h(
                    'p',
                    null,
                    `${t('repoSnapshot')}: ${repo.fingerprint.slice(0, 12)} — ${t(`repoKind.${repo.fingerprintKind}`)}`,
                  ),
                  repo.error
                    ? h(
                        'p',
                        { role: 'alert' },
                        `${t('repoLastError')}: ${t(`code.${repo.error.code}`)}`,
                      )
                    : null,
                  h(
                    'button',
                    {
                      'aria-label': `${t('repoRefresh')}: ${repo.label}`,
                      disabled: !!repoBusy || switching,
                      onClick: () =>
                        void repoAction(repo.id, {
                          action: 'repo-refresh',
                          id: repo.id,
                        }),
                    },
                    t('repoRefresh'),
                  ),
                  h(
                    'button',
                    {
                      'aria-label': `${t('repoUnsubscribe')}: ${repo.label}`,
                      disabled: !!repoBusy || switching,
                      onClick: () => setRepoUnsubscribing(repo.id),
                    },
                    t('repoUnsubscribe'),
                  ),
                  repoUnsubscribing === repo.id
                    ? h(
                        'div',
                        { role: 'alert' },
                        h('p', null, t('repoConfirmUnsubscribe')),
                        h(
                          'button',
                          {
                            'aria-label': `${t('repoConfirmUnsubscribeYes')}: ${repo.label}`,
                            disabled: !!repoBusy || switching,
                            onClick: () => {
                              setRepoUnsubscribing('');
                              void repoAction(repo.id, {
                                action: 'repo-remove',
                                id: repo.id,
                              });
                            },
                          },
                          t('repoConfirmUnsubscribeYes'),
                        ),
                        h(
                          'button',
                          {
                            'aria-label': `${t('cancel')}: ${repo.label}`,
                            onClick: () => setRepoUnsubscribing(''),
                          },
                          t('cancel'),
                        ),
                      )
                    : null,
                  repoBusy === repo.id
                    ? h('p', { role: 'status' }, t('repoRefreshing'))
                    : null,
                  !repo.skills.length ? h('p', null, t('repoNoSkills')) : null,
                  ...shown.map((skill: any) =>
                    h(
                      'div',
                      { key: skill.path, 'data-majed-repo-skill': skill.path },
                      h('span', null, skill.name),
                      h('span', null, ` — ${t(`repoStatus.${skill.status}`)}`),
                      skill.code
                        ? h('span', null, ` (${t(`code.${skill.code}`)})`)
                        : null,
                      h('p', null, skill.description),
                      skill.conflicts?.length
                        ? h(
                            'p',
                            null,
                            `${t('repoConflictIn')}: ${skill.conflicts
                              .map((id: string) =>
                                id === 'user-dsh' ? 'DSH' : 'Shared Agents',
                              )
                              .join(', ')}`,
                          )
                        : null,
                      skill.valid !== false &&
                        !skill.conflicts?.includes(repoTarget) &&
                        !skill.installedIn?.includes(repoTarget)
                        ? h(
                            'button',
                            {
                              'aria-label': `${t('repoInstall')}: ${skill.name}`,
                              disabled:
                                !!repoBusy || switching || !repoDestination,
                              onClick: () =>
                                void repoAction(
                                  repo.id,
                                  {
                                    action: 'repo-install',
                                    id: repo.id,
                                    path: skill.path,
                                    snapshot: repo.fingerprint,
                                    source: repoTarget,
                                    ...(projectOfDest(repoTarget)
                                      ? { project: projectOfDest(repoTarget) }
                                      : {}),
                                  },
                                  repoWarning,
                                ),
                            },
                            t('repoInstall'),
                          )
                        : null,
                    ),
                  ),
                );
              }),
              h('h4', null, t('repoTracked')),
              !(data?.repoInstalls ?? []).length
                ? h('p', null, t('repoNoInstalls'))
                : null,
              ...(data?.repoInstalls ?? []).map((record: any) =>
                h(
                  'article',
                  { key: record.id, 'data-majed-repo-install': record.id },
                  h('strong', null, record.name),
                  h('span', null, ` — ${t(`repoStatus.${record.status}`)}`),
                  record.updateAvailable && record.status !== 'update'
                    ? h('span', null, ` — ${t('repoStatus.update')}`)
                    : null,
                  record.upstream
                    ? h(
                        'p',
                        null,
                        `${t('repoUpstream')}: ${t(`code.${record.upstream}`)}`,
                      )
                    : null,
                  h(
                    'p',
                    null,
                    `${t('repoFromSource')}: ${record.origin.label}${record.origin.ref ? ` @ ${record.origin.ref}` : ''}${record.origin.subdirectory ? ` / ${record.origin.subdirectory}` : ''}`,
                  ),
                  h(
                    'p',
                    null,
                    `${t('repoSnapshot')}: ${record.fingerprint.slice(0, 12)} — ${t(`repoKind.${record.fingerprintKind}`)}`,
                  ),
                  h(
                    'p',
                    null,
                    `${t('repoInstalledAt')}: `,
                    h('bdi', { dir: 'ltr' }, placeName(data, record)),
                  ),
                  h('p', null, h('bdi', { dir: 'ltr' }, record.path)),
                  record.status === 'installed' || record.status === 'modified'
                    ? h(
                        'button',
                        {
                          'aria-label': `${t('repoUninstall')}: ${record.name}`,
                          disabled: !!repoBusy || switching,
                          onClick: () =>
                            void repoAction(
                              record.id,
                              {
                                action: 'repo-uninstall',
                                installId: record.id,
                                ...(record.project
                                  ? { project: record.project }
                                  : {}),
                              },
                              repoWarning,
                            ),
                        },
                        t('repoUninstall'),
                      )
                    : null,
                  (record.status === 'installed' ||
                    record.status === 'modified') &&
                    record.updateAvailable
                    ? h(
                        'button',
                        {
                          'aria-label': `${t('repoUpdatePreview')}: ${record.name}`,
                          disabled: !!repoBusy || switching,
                          onClick: () => repoPreview(record, 'update'),
                        },
                        t('repoUpdatePreview'),
                      )
                    : null,
                  record.canRollback &&
                    (record.status === 'installed' ||
                      record.status === 'modified')
                    ? h(
                        'button',
                        {
                          'aria-label': `${t('repoRollbackPreview')}: ${record.name}`,
                          disabled: !!repoBusy || switching,
                          onClick: () => repoPreview(record, 'rollback'),
                        },
                        t('repoRollbackPreview'),
                      )
                    : null,
                  repoPreviews[record.id] &&
                    (record.status === 'installed' ||
                      record.status === 'modified')
                    ? h(
                        'div',
                        {
                          role: 'group',
                          'aria-labelledby': `majed-repo-preview-${record.id}`,
                          'data-majed-repo-preview': record.id,
                        },
                        h(
                          'h5',
                          { id: `majed-repo-preview-${record.id}` },
                          `${t('repoPreviewTitle')}: ${record.name}`,
                        ),
                        !repoPreviews[record.id].changes.length
                          ? h('p', null, t('repoNoChanges'))
                          : h(
                              'ul',
                              null,
                              ...repoPreviews[record.id].changes.map(
                                (change: any) =>
                                  h(
                                    'li',
                                    { key: change.path },
                                    `${t(`repoChange.${change.kind}`)}: `,
                                    h('bdi', { dir: 'ltr' }, change.path),
                                  ),
                              ),
                            ),
                        h('p', null, t('repoTrackedHint')),
                        repoPreviews[record.id].localModified
                          ? h(
                              'div',
                              { role: 'alert' },
                              h('p', null, t('repoLocalModified')),
                              h(
                                'label',
                                null,
                                h('input', {
                                  type: 'checkbox',
                                  'aria-label': `${t('repoOverwrite')}: ${record.name}`,
                                  checked: !!repoOverwrites[record.id],
                                  onChange: (event: any) =>
                                    setRepoOverwrites((all: any) => ({
                                      ...all,
                                      [record.id]: !!event.target.checked,
                                    })),
                                }),
                                t('repoOverwrite'),
                              ),
                            )
                          : null,
                        h(
                          'button',
                          {
                            'aria-label': `${t(repoPreviews[record.id].kind === 'update' ? 'repoApplyUpdate' : 'repoApplyRollback')}: ${record.name}`,
                            disabled:
                              !!repoBusy ||
                              switching ||
                              (repoPreviews[record.id].localModified &&
                                !repoOverwrites[record.id]),
                            onClick: () => repoApply(record),
                          },
                          t(
                            repoPreviews[record.id].kind === 'update'
                              ? 'repoApplyUpdate'
                              : 'repoApplyRollback',
                          ),
                        ),
                        h(
                          'button',
                          {
                            'aria-label': `${t('cancel')}: ${record.name}`,
                            onClick: () =>
                              setRepoPreviews(
                                ({ [record.id]: _gone, ...rest }) => rest,
                              ),
                          },
                          t('cancel'),
                        ),
                      )
                    : null,
                  record.status === 'invalid-root'
                    ? h(
                        'button',
                        {
                          'aria-label': `${t('repoForget')}: ${record.name}`,
                          disabled: !!repoBusy || switching,
                          onClick: () => setRepoForgetting(record.id),
                        },
                        t('repoForget'),
                      )
                    : null,
                  record.status === 'invalid-root' &&
                    repoForgetting === record.id
                    ? h(
                        'div',
                        { role: 'alert' },
                        h('p', null, t('repoConfirmForget')),
                        h(
                          'button',
                          {
                            'aria-label': `${t('repoConfirmForgetYes')}: ${record.name}`,
                            disabled: !!repoBusy || switching,
                            onClick: () => {
                              setRepoForgetting('');
                              void repoAction(record.id, {
                                action: 'repo-forget',
                                installId: record.id,
                                ...(record.project
                                  ? { project: record.project }
                                  : {}),
                              });
                            },
                          },
                          t('repoConfirmForgetYes'),
                        ),
                        h(
                          'button',
                          {
                            'aria-label': `${t('cancel')}: ${record.name}`,
                            onClick: () => setRepoForgetting(''),
                          },
                          t('cancel'),
                        ),
                      )
                    : null,
                ),
              ),
            )
          : null,
        scope === 'discover' && tab !== 'git' && data && data.corrupt
          ? h('div', {
              id: 'majed-discover-panel',
              role: 'tabpanel',
              'aria-labelledby': `majed-discover-tab-${tab}`,
            })
          : null,
        scope === 'discover' && tab !== 'git' && data && !data.corrupt
          ? h(
              'div',
              {
                id: 'majed-discover-panel',
                role: 'tabpanel',
                'aria-labelledby': `majed-discover-tab-${tab}`,
              },
              h(CatalogPanel, {
                key: tab,
                kind: tab,
                data,
                setData,
                setNotice,
              }),
            )
          : null,
        h(
          'button',
          {
            disabled:
              switching || data?.corrupt || (scope === 'project' && !project),
            onClick: () => setImporting(!importing),
          },
          t('importSkills'),
        ),
        importing
          ? h(
              'div',
              { 'data-majed-import': true },
              h('p', null, t('importHint')),
              scope === 'global'
                ? h(
                    'select',
                    {
                      'aria-label': t('destination'),
                      value: createSource,
                      onChange: (event: any) =>
                        setCreateSource(event.target.value),
                    },
                    ...['user-dsh', 'user-agents']
                      .filter((id) =>
                        data?.sources?.some((s: any) => s.id === id),
                      )
                      .map((id) =>
                        h(
                          'option',
                          { key: id, value: id },
                          id === 'user-dsh' ? 'DSH' : 'Shared Agents',
                        ),
                      ),
                  )
                : h('p', null, `${t('destination')}: ${destinationName()}`),
              field(t('importPath'), importPath, (value: string) => {
                setImportPath(value);
                setImportFiles([]);
                setImportResult(null);
              }),
              h('input', {
                type: 'file',
                multiple: true,
                accept: '.zip,.md',
                'aria-label': t('uploadFiles'),
                onChange: (event: any) => {
                  setImportFiles(Array.from(event.target.files ?? []));
                  setImportResult(null);
                },
              }),
              h('input', {
                type: 'file',
                multiple: true,
                webkitdirectory: '',
                'aria-label': t('uploadFolder'),
                onChange: (event: any) => {
                  setImportFiles(Array.from(event.target.files ?? []));
                  setImportResult(null);
                },
              }),
              h(
                'select',
                {
                  'aria-label': t('importConflict'),
                  value: importConflict,
                  onChange: (event: any) =>
                    setImportConflict(event.target.value),
                },
                h('option', { value: '' }, t('importConflict')),
                h('option', { value: 'skip' }, t('skipImport')),
                h('option', { value: 'overwrite' }, t('overwriteImport')),
              ),
              h(
                'button',
                {
                  disabled: importBusy || !importPath || !importConflict,
                  onClick: () => runImport(true),
                },
                t('previewImport'),
              ),
              h(
                'button',
                {
                  disabled:
                    importBusy ||
                    !importConflict ||
                    (!importPath && !importFiles.length),
                  onClick: () => runImport(false),
                },
                t('importNow'),
              ),
              importResult
                ? h(
                    'div',
                    { 'aria-label': t('importResult'), role: 'status' },
                    ...[
                      'pending',
                      'conflicts',
                      'imported',
                      'skipped',
                      'failed',
                      'warnings',
                      'inputs',
                    ].map((kind) =>
                      h(
                        'div',
                        { key: kind },
                        t(`${kind}Import`),
                        ': ',
                        (importResult[kind] ?? [])
                          .map(
                            (entry: any) =>
                              `${entry.name}${entry.code ? ` (${errorText(entry)})` : ''}${entry.recovery?.length ? `: ${entry.recovery.join(', ')}` : ''}${entry.names?.length ? `: ${entry.names.join(', ')}` : ''}`,
                          )
                          .join(', '),
                      ),
                    ),
                  )
                : null,
            )
          : null,
        h(
          'button',
          {
            disabled:
              switching || data?.corrupt || (scope === 'project' && !project),
            onClick: () => setCreating(!creating),
          },
          t('create'),
        ),
        creating
          ? h(
              'form',
              {
                onSubmit: (event: any) => {
                  event.preventDefault();
                  if (
                    switching ||
                    data?.corrupt ||
                    (scope === 'project' && !project)
                  )
                    return;
                  void mutate(
                    {
                      action: 'create',
                      ...selected,
                      source:
                        scope === 'project'
                          ? `project-dsh:${project}`
                          : createSource,
                      name: createName,
                      description: createDescription,
                      body: createBody,
                    },
                    () => {
                      setCreating(false);
                      setCreateName('');
                      setCreateDescription('');
                      setCreateBody('');
                      setNotice(t('created'));
                    },
                  );
                },
              },
              scope === 'global'
                ? h(
                    'select',
                    {
                      'aria-label': t('destination'),
                      value: createSource,
                      onChange: (event: any) =>
                        setCreateSource(event.target.value),
                    },
                    ...['user-dsh', 'user-agents']
                      .filter((id) =>
                        data?.sources?.some((item: any) => item.id === id),
                      )
                      .map((id) =>
                        h(
                          'option',
                          { key: id, value: id },
                          id === 'user-dsh' ? 'DSH' : 'Shared Agents',
                        ),
                      ),
                  )
                : h('p', null, `${t('destination')}: ${destinationName()}`),
              field(t('skillName'), createName, setCreateName),
              field(
                t('skillDescription'),
                createDescription,
                setCreateDescription,
              ),
              h('textarea', {
                'aria-label': t('skillBody'),
                value: createBody,
                maxLength: 262144,
                onChange: (event: any) => setCreateBody(event.target.value),
              }),
              h('button', { type: 'submit' }, t('create')),
              h(
                'button',
                { type: 'button', onClick: () => setCreating(false) },
                t('cancel'),
              ),
            )
          : null,
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
          h('option', { value: 'discover' }, t('scopeDiscover')),
          h('option', { value: 'trash' }, t('trash')),
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
        h(
          'select',
          {
            'aria-label': t('filterCategory'),
            value: activeCat,
            onChange: (e: any) => setCatFilter(e.target.value),
          },
          h('option', { value: '' }, t('allCategories')),
          h('option', { value: '__none' }, t('uncategorized')),
          ...filterCategories.map((c: any) =>
            h('option', { key: c.id, value: c.id }, c.name),
          ),
        ),
        notice && !managing ? h('p', { role: 'status' }, notice) : null,
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
                      data.corrupt ? null : organizer(x.id, sourceLabel(x)),
                      ...copies
                        .filter((c: any) => c.source === x.id)
                        .map((copy: any) =>
                          h(
                            'article',
                            { key: copy.path },
                            h('strong', null, copy.name),
                            ['user-dsh', 'user-agents'].includes(copy.source) ||
                              copy.source === `project-dsh:${project}`
                              ? h(
                                  'button',
                                  {
                                    'aria-label': `${t('moveTrash')}: ${copy.name}`,
                                    disabled: switching || data.corrupt,
                                    onClick: () =>
                                      void mutate(
                                        {
                                          action: 'trash',
                                          id: copy.path,
                                          source: copy.source,
                                          ...selected,
                                        },
                                        (value: any) => {
                                          if (value.result?.warning)
                                            setNotice(
                                              `${t(`code.${value.result.warning}`)} ${value.result.path ?? ''}`,
                                            );
                                        },
                                      ),
                                  },
                                  t('moveTrash'),
                                )
                              : null,
                            h('p', null, copy.description),
                            h('span', null, t(copyStatus(copy))),
                            orgOf(copy.source).members[copy.name]
                              ? h(
                                  'span',
                                  null,
                                  orgOf(copy.source).categories.find(
                                    (c: any) =>
                                      c.id ===
                                      orgOf(copy.source).members[copy.name],
                                  )?.name,
                                )
                              : null,
                            orgOf(copy.source).notes[copy.name]
                              ? h(
                                  'p',
                                  { 'data-note': true },
                                  `${t('note')}: ${orgOf(copy.source).notes[copy.name]}`,
                                )
                              : null,
                            h('input', {
                              'aria-label': `${t('note')}: ${copy.name}`,
                              placeholder: t('noteHint'),
                              maxLength: 500,
                              title: t('noteLimit'),
                              value:
                                noteDrafts[`${copy.source}/${copy.name}`] ??
                                orgOf(copy.source).notes[copy.name] ??
                                '',
                              onChange: (e: any) =>
                                setNoteDrafts({
                                  ...noteDrafts,
                                  [`${copy.source}/${copy.name}`]:
                                    e.target.value,
                                }),
                            }),
                            h(
                              'button',
                              {
                                'aria-label': `${t('saveNote')}: ${copy.name}`,
                                onClick: () =>
                                  void organize(
                                    {
                                      action: 'note',
                                      source: copy.source,
                                      name: copy.name,
                                      note:
                                        noteDrafts[
                                          `${copy.source}/${copy.name}`
                                        ] ??
                                        orgOf(copy.source).notes[copy.name] ??
                                        '',
                                    },
                                    () => {
                                      const next = { ...noteDrafts } as any;
                                      delete next[
                                        `${copy.source}/${copy.name}`
                                      ];
                                      setNoteDrafts(next);
                                    },
                                  ),
                              },
                              t('saveNote'),
                            ),
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
                    copyText(detail.content).catch(() => setDetailError(true)),
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
    // ---- navigation placement: Settings, sidebar or both (sidebar-only is persisted by the host) ----
    let placement = 'settings';
    let changePlacement: (value: string) => Promise<void> = async () => {};
    const placementListeners = new Set<() => void>();
    let layout: any;
    const notifyPlacement = () => {
      for (const listener of placementListeners) listener();
    };
    function PlacementControl() {
      const [, rerender] = React.useState(0);
      const [problem, setProblem] = React.useState('');
      React.useEffect(() => {
        const listener = () => rerender((n: number) => n + 1);
        placementListeners.add(listener);
        return () => void placementListeners.delete(listener);
      }, []);
      return h(
        'div',
        {
          'data-majed-skills-placement': true,
          dir: isArabic() ? 'rtl' : undefined,
        },
        h('strong', null, t('placement')),
        h('p', null, t('placementHint')),
        ...['both', 'sidebar', 'settings'].map((value) =>
          h(
            'button',
            {
              key: value,
              'aria-pressed': placement === value,
              onClick: () => {
                setProblem('');
                void changePlacement(value).catch((failure: any) =>
                  setProblem(errorText(failure)),
                );
              },
            },
            t(`placement${value[0].toUpperCase()}${value.slice(1)}`),
          ),
        ),
        problem ? h('p', { role: 'alert' }, problem) : null,
      );
    }
    const sidebarIcon = () =>
      h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true },
        h('path', {
          d: 'M2 3h12v2H2zM2 7h12v2H2zM2 11h8v2H2z',
          fill: 'currentColor',
        }),
      );
    effect(() => {
      let offConfig: any,
        offSettings: any,
        offMain: any,
        offSidebar: any,
        disposed = false;
      const controller = new AbortController();
      const inSettings = () => placement === 'both' || placement === 'settings';
      const inSidebar = () => placement === 'both' || placement === 'sidebar';
      const reconcile = () => {
        if (disposed) return;
        if (inSettings() && !offSettings)
          offSettings = ctx.slots.inject('settings.section', () =>
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
        else if (!inSettings() && offSettings) {
          offSettings();
          offSettings = undefined;
        }
        if (inSidebar() && !offSidebar) {
          offMain = ctx.slots.register(
            {
              name: 'main',
              key: 'majed-skills',
              locale: 'majed.skills',
              inject: () => ({}),
            },
            () => h(Section),
          );
          offSidebar = ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'majed-skills',
              order: 92,
              label: () => t('title'),
              locale: 'majed.skills',
            },
            sidebarIcon,
          );
        } else if (!inSidebar() && offSidebar) {
          // Leaving the sidebar must not strand the user on a vanished panel.
          try {
            if (
              layout?.panelInfo?.getSnapshot?.().activePanelId ===
              'majed-skills'
            )
              layout.selectPanel?.(null);
          } catch {}
          offSidebar?.();
          offMain?.();
          offSidebar = offMain = undefined;
        }
      };
      const apply = (next: unknown) => {
        if (
          typeof next === 'string' &&
          ['both', 'sidebar', 'settings'].includes(next)
        ) {
          if (next !== placement) {
            placement = next;
            notifyPlacement();
          }
        }
        reconcile();
      };
      changePlacement = async (value: string) => {
        const previous = placement;
        placement = value;
        notifyPlacement();
        reconcile();
        try {
          const result = await call({ action: 'placement', location: value });
          apply(result.placement);
        } catch (failure) {
          placement = previous;
          notifyPlacement();
          reconcile();
          throw failure;
        }
      };
      void ctx.inject?.(['layout'], (injected: any) => {
        layout = injected?.layout ?? injected;
      });
      // Cheap presence check: the host ping never scans sources. Backs off (3s doubling to 60s) while failing.
      let delay = 3000;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const schedule = () => {
        if (!disposed) timer = setTimeout(() => void probe(), delay);
      };
      const probe = () =>
        call({ action: 'ping', include: 'placement' }, controller.signal)
          .then((result: any) => {
            delay = 3000;
            if (disposed) return;
            if (!offConfig)
              offConfig = ctx.slots.inject('plugins.bundle.config', () =>
                ctx.slots.register(
                  {
                    name: 'plugins.bundle.config',
                    key: 'majed-skills',
                    locale: 'majed.skills',
                  },
                  (props: any) =>
                    props?.view === 'summary' ? null : h(PlacementControl),
                ),
              );
            apply(result?.placement);
          })
          .catch(() => {
            // Transient failure: keep the last known entries and the placement control visible
            // so the user can recover; only the retry delay backs off.
            delay = Math.min(delay * 2, 60000);
          })
          .finally(schedule);
      void probe();
      return () => {
        disposed = true;
        changePlacement = async () => {};
        controller.abort();
        clearTimeout(timer);
        offConfig?.();
        offSettings?.();
        offMain?.();
        offSidebar?.();
      };
    }, 'majed-skills presence');
  }
}
