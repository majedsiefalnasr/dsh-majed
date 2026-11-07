import { LEGACY_PANEL_IDS } from './legacy-names.js';
// Independently authored global catalog UI; reference same-origin API transport.
export function applySkills(root: any): void {
  const fail = (error: unknown) =>
    // A failing optional Component must never disturb sibling registrations.
    console.error('dsh-waycraft: Skill manager setup failed', error);
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
        repoFootnote:
          'Refresh checks repositories and skill updates without replacing local files. Historical backups are not cleaned automatically and use additional disk space.',
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
        dragTip: 'Drag to move this skill to another category',
        dragMoved: 'Moved to another category:',
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
        refresh: 'Refresh',
        refreshAria: 'Refresh skills',
        actionsAria: 'Skill actions',
        refreshing: 'Refreshing…',
        statsAria: 'Skill statistics',
        statSkill: 'skill',
        statSkills: 'skills',
        statEnabled: 'enabled',
        statDisabled: 'disabled',
        statDiagnostic: 'diagnostic',
        statDiagnostics: 'diagnostics',
        stateLocked: 'Skill state is invalid; changes are locked',
        'diag.discovery-truncated': 'Discovery stopped at the safe limit',
        sourceProblems: 'to review',
        linkedReadOnly: 'Linked (read-only)',
        diagWarnings: 'warnings',
        diagWarning: 'warning',
        diagNotes: 'notes',
        diagNote: 'note',
        showMoreCount: 'Show {count} more',
        diagGeneral: 'General',
        showLess: 'Show less',
        diagProblems: 'problems need attention',
        diagProblem: 'problem needs attention',
        diagEntriesCount: '{count} entries could not be read',
        diagEntriesOne: '1 entry could not be read',
        'diagReason.permission': 'Reason: permission denied',
        'diagReason.not-directory':
          'Reason: expected a folder but found a file',
        'diagReason.broken-link':
          'Reason: a link points to something that no longer exists',
        'diagReason.unknown': 'Reason: the folder could not be read',
        'diagNext.unreadable-entries':
          'Check the folder permissions. These entries are skipped; your other skills are unaffected.',
        'diagNext.source-unavailable':
          'Check that the folder exists and is readable, or change the folder.',
        'diagNext.unreadable-skill':
          'Check the file permissions or replace the file.',
        'diagNext.oversized-skill':
          'Shorten SKILL.md; very large files are skipped.',
        'diagNext.empty-skill': 'Add the skill name and description.',
        'diagNext.linked-outside-root':
          'This is allowed and read-only; nothing needs to be done.',
        diagDetails: 'Affected paths',
        diagMore: '+{count} more',
        sourceOn: 'On',
        sourceOff: 'Off',
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
        browse: 'Browse…',
        customTag: 'custom',
        addCategoryHere: 'New category in this source',
        folderTitleFor: 'Change the skills folder for',
        folderHelp:
          'DSH reads this source from the folder below. Pick another folder if you keep these skills elsewhere.',
        folderDefault: 'Default folder',
        categoryHint: 'Group skills in',
        categoryTaken: 'A category with this name already exists.',
        editFolder: 'Edit folder',
        more: 'More actions',
        newCategory: 'New category',
        addSkillsHere: 'Add selected skills',
        enabledCount: 'enabled',
        editNote: 'Edit note',
        noteAndDescription: 'Note replaces the description in this list',
        browseAria: 'Browse for a folder',
        changeFolder: 'Change folder',
        saveFolder: 'Save folder',
        resetFolder: 'Reset to default',
        folderRedirected: 'Folder changed from the default',
        'code.root-unsupported': 'This source folder cannot be changed',
        'code.project-scope-unsupported':
          'Provider folders can only be changed in Global skills',
        'diag.root-override-ignored':
          'A saved folder override was ignored because it is no longer allowed',
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
        selectSkill: 'Select skill',
        assignTo: 'Assign selected to',
        filterCategory: 'Category',
        allCategories: 'All categories',
        note: 'Note',
        saveNote: 'Save note',
        noteHint: 'Notes are searchable and never change the skill description',
        noteLimit: 'Up to 500 characters',
        confirmNote: 'Confirm',
        importDropTitle: 'Drop a skill here',
        importDropHint: 'Supports .zip, a skill folder, or one SKILL.md',
        importChooseFolder: 'Choose folder',
        importChooseFile: 'Choose file',
        importChosen: '{count} item(s) selected',
        importClear: 'Clear',
        importDropUnsupported:
          'Only .zip files, folders and SKILL.md files can be imported; other items were ignored.',
        importDropFailed: 'The dropped items could not be read.',
        skillSource: 'Skill source',
        skillSourcePick: 'Choose a source…',
        hideForm: 'Hide form',
        destLocation: 'Location',
        catHelp: 'Categories stay in this source and do not move files.',
        catEmptyHere: 'No skills yet. Use More on a skill to place it here.',
        addSkillsTo: 'Add skills to category',
        addSkillsNone: 'No other skills to add.',
        addSkillsCount: 'Add skills',
        toggleCategory: 'Toggle category',
        createHere: 'Add skill',
        createHereBlocked:
          'Skills cannot be added here: this folder is read-only for Waycraft',
        createBlockedTool:
          'Read-only for Waycraft: this folder belongs to another tool. Add skills to DSH or Agents instead.',
        createBlockedCustom:
          'Read-only for Waycraft: custom sources are only read. Add skills to DSH or Agents instead.',
        destScope: 'Scope',
        destScopeUser: 'User directory',
        destScopeProject: 'Project',
        noteSavedHint:
          'Saved in the plugin display layer without modifying SKILL.md. Clear to revert to original description.',
        copied: 'Copied',
        pathChip: 'Writes to',
        createFootnote:
          'Created skills are not linked to repository updates, and no source file is modified.',
        importReqTitle: 'File requirements',
        importReq1: 'Archives and folders must contain SKILL.md.',
        importReq2: 'SKILL.md must include a YAML name and description.',
        importReq3: 'Import copies all content and never modifies the source.',
        customSources: 'Custom sources',
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
        repoFootnote:
          'يتحقق التحديث من المستودعات وتحديثات المهارات دون استبدال الملفات المحلية. لا تُنظَّف النسخ الاحتياطية السابقة تلقائيًا وتستهلك مساحة قرص إضافية.',
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
        dragTip: 'اسحب لنقل هذه المهارة إلى تصنيف آخر',
        dragMoved: 'تم النقل إلى تصنيف آخر:',
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
        refresh: 'إعادة تحميل',
        refreshAria: 'إعادة تحميل المهارات',
        actionsAria: 'إجراءات المهارات',
        refreshing: 'جارٍ إعادة التحميل…',
        statsAria: 'إحصاءات المهارات',
        statSkill: 'مهارة',
        statSkills: 'مهارات',
        statEnabled: 'مفعلة',
        statDisabled: 'معطلة',
        statDiagnostic: 'تشخيص',
        statDiagnostics: 'تشخيصات',
        stateLocked: 'حالة المهارات غير صالحة؛ التغييرات مقفلة',
        'diag.discovery-truncated': 'توقف الاكتشاف عند الحد الآمن',
        sourceProblems: 'للمراجعة',
        linkedReadOnly: 'مرتبطة (للقراءة فقط)',
        diagWarnings: 'تحذيرات',
        diagWarning: 'تحذير',
        diagNotes: 'ملاحظات',
        diagNote: 'ملاحظة',
        showMoreCount: 'عرض {count} إضافية',
        diagGeneral: 'عام',
        showLess: 'عرض أقل',
        diagProblems: 'مشكلات تحتاج إلى انتباه',
        diagProblem: 'مشكلة تحتاج إلى انتباه',
        diagEntriesCount: 'تعذرت قراءة {count} عنصر',
        diagEntriesOne: 'تعذرت قراءة عنصر واحد',
        'diagReason.permission': 'السبب: تم رفض الإذن',
        'diagReason.not-directory': 'السبب: كان المتوقع مجلدًا لكن وُجد ملف',
        'diagReason.broken-link': 'السبب: رابط يشير إلى عنصر لم يعد موجودًا',
        'diagReason.unknown': 'السبب: تعذرت قراءة المجلد',
        'diagNext.unreadable-entries':
          'تحقق من أذونات المجلد. يتم تخطي هذه العناصر ولا تتأثر مهاراتك الأخرى.',
        'diagNext.source-unavailable':
          'تحقق من وجود المجلد وقابليته للقراءة، أو غيّر المجلد.',
        'diagNext.unreadable-skill': 'تحقق من أذونات الملف أو استبدله.',
        'diagNext.oversized-skill':
          'قصّر ملف SKILL.md؛ يتم تخطي الملفات الكبيرة جدًا.',
        'diagNext.empty-skill': 'أضف اسم المهارة ووصفها.',
        'diagNext.linked-outside-root':
          'هذا مسموح وللقراءة فقط؛ لا يلزم أي إجراء.',
        diagDetails: 'المسارات المتأثرة',
        diagMore: '+{count} أخرى',
        sourceOn: 'مفعّل',
        sourceOff: 'معطّل',
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
        browse: 'استعراض…',
        customTag: 'مخصص',
        addCategoryHere: 'تصنيف جديد في هذا المصدر',
        folderTitleFor: 'تغيير مجلد المهارات لـ',
        folderHelp:
          'يقرأ DSH هذا المصدر من المجلد أدناه. اختر مجلدًا آخر إن كنت تحتفظ بالمهارات في مكان مختلف.',
        folderDefault: 'المجلد الافتراضي',
        categoryHint: 'تجميع المهارات في',
        categoryTaken: 'يوجد تصنيف بهذا الاسم بالفعل.',
        editFolder: 'تعديل المجلد',
        more: 'مزيد من الإجراءات',
        newCategory: 'تصنيف جديد',
        addSkillsHere: 'إضافة المهارات المحددة',
        enabledCount: 'مفعلة',
        editNote: 'تعديل الملاحظة',
        noteAndDescription: 'تحل الملاحظة محل الوصف في هذه القائمة',
        browseAria: 'استعراض لاختيار مجلد',
        changeFolder: 'تغيير المجلد',
        saveFolder: 'حفظ المجلد',
        resetFolder: 'استعادة الافتراضي',
        folderRedirected: 'تم تغيير المجلد عن الافتراضي',
        'code.root-unsupported': 'لا يمكن تغيير مجلد هذا المصدر',
        'code.project-scope-unsupported':
          'لا يمكن تغيير مجلدات المزوّدين إلا في المهارات العامة',
        'diag.root-override-ignored':
          'تم تجاهل تجاوز مجلد محفوظ لأنه لم يعد مسموحًا',
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
        selectSkill: 'تحديد المهارة',
        assignTo: 'إسناد المحدد إلى',
        filterCategory: 'التصنيف',
        allCategories: 'كل التصنيفات',
        note: 'ملاحظة',
        saveNote: 'حفظ الملاحظة',
        noteHint: 'الملاحظات قابلة للبحث ولا تغيّر وصف المهارة',
        noteLimit: 'حتى 500 حرف',
        confirmNote: 'تأكيد',
        importDropTitle: 'أفلت المهارة هنا',
        importDropHint: 'يدعم ملف .zip أو مجلد مهارة أو ملف SKILL.md واحد',
        importChooseFolder: 'اختيار مجلد',
        importChooseFile: 'اختيار ملف',
        importChosen: 'تم اختيار {count} عنصر',
        importClear: 'مسح',
        importDropUnsupported:
          'يمكن استيراد ملفات .zip والمجلدات وملفات SKILL.md فقط؛ تم تجاهل العناصر الأخرى.',
        importDropFailed: 'تعذرت قراءة العناصر المُفلتة.',
        skillSource: 'مصدر المهارات',
        skillSourcePick: 'اختر مصدرًا…',
        hideForm: 'إخفاء النموذج',
        destLocation: 'الموقع',
        catHelp: 'تبقى التصنيفات داخل هذا المصدر ولا تنقل الملفات.',
        catEmptyHere:
          'لا توجد مهارات بعد. استخدم «المزيد» في مهارة لوضعها هنا.',
        addSkillsTo: 'إضافة مهارات إلى التصنيف',
        addSkillsNone: 'لا توجد مهارات أخرى للإضافة.',
        addSkillsCount: 'إضافة مهارات',
        toggleCategory: 'تبديل التصنيف',
        createHere: 'إضافة مهارة',
        createHereBlocked:
          'لا يمكن إضافة مهارات هنا: هذا المجلد للقراءة فقط في Waycraft',
        createBlockedTool:
          'للقراءة فقط في Waycraft: هذا المجلد يتبع أداة أخرى. أضف المهارات إلى DSH أو Agents بدلًا من ذلك.',
        createBlockedCustom:
          'للقراءة فقط في Waycraft: المصادر المخصصة تُقرأ فقط. أضف المهارات إلى DSH أو Agents بدلًا من ذلك.',
        destScope: 'النطاق',
        destScopeUser: 'مجلد المستخدم',
        destScopeProject: 'مشروع',
        noteSavedHint:
          'تُحفظ في طبقة العرض الخاصة بالإضافة دون تعديل SKILL.md. امسح الحقل للرجوع إلى الوصف الأصلي.',
        copied: 'تم النسخ',
        pathChip: 'يُكتب في',
        createFootnote:
          'المهارات المُنشأة غير مرتبطة بتحديثات المستودعات، ولا يتم تعديل أي ملف مصدر.',
        importReqTitle: 'متطلبات الملفات',
        importReq1: 'يجب أن تحتوي الأرشيفات والمجلدات على SKILL.md.',
        importReq2: 'يجب أن يتضمن SKILL.md اسمًا ووصفًا بصيغة YAML.',
        importReq3: 'يقوم الاستيراد بنسخ كل المحتوى ولا يعدّل المصدر أبدًا.',
        customSources: 'مصادر مخصصة',
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
      () => ctx.locale.register('waycraft.skills', dictionaries),
      'waycraft-skills dictionaries',
    );
    const t = ctx.locale.bind('waycraft.skills');
    const isArabic = () => ctx.locale.language?.getSnapshot?.() === 'ar';
    // Optional native folder picker; absent hosts keep the typed path field working.
    let pickDirectory: (() => Promise<string | null>) | undefined;
    try {
      void ctx.inject?.(['uiWorkspace'], (injected: any) => {
        const workspace = injected?.uiWorkspace ?? injected;
        if (typeof workspace?.pickDirectory === 'function')
          pickDirectory = () => workspace.pickDirectory();
      });
    } catch {
      // Safe: without DSH's directory picker the Browse button is simply not offered; paths can still be typed.
    }
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
    // The .waycraft-skills-switch rules copy the host's own control (Settings > General "Bidirectional text"):
    // same geometry, tokens and states, with a real thumb child instead of a pseudo-element.
    const SKILLS_STYLE = `
.waycraft-skills{max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.waycraft-skills *{box-sizing:border-box;min-inline-size:0}
.waycraft-skills bdi{unicode-bidi:isolate}
.waycraft-skills-path{direction:ltr;unicode-bidi:isolate;overflow-wrap:anywhere;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-header{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-title{margin:0;flex:1 1 auto;font-size:18px;line-height:26px;font-weight:600;color:var(--dsw-alias-label-primary)}
.waycraft-skills-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-skills-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.waycraft-skills-toolbar select{order:1}
.waycraft-skills-toolbar input{order:2;flex:1 1 160px}
.waycraft-skills-toolbar .waycraft-skills-iconbar{order:3}
.waycraft-skills-toolbar select{flex:0 1 150px}
.waycraft-skills button,.waycraft-skills input,.waycraft-skills select,.waycraft-skills textarea{font:inherit;color:inherit}
.waycraft-skills button{min-block-size:28px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background-color .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3))}
.waycraft-skills button:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-3))}
.waycraft-skills button:disabled{opacity:.5;cursor:not-allowed}
.waycraft-skills-header button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-skills button.waycraft-skills-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-primary:hover:not(:disabled),.waycraft-skills button.waycraft-skills-primary:active:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));border-color:transparent;color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-primary:disabled{background:var(--dsw-alias-button-primary-dimmed,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary)));opacity:.5}
.waycraft-skills button.waycraft-skills-danger{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills button.waycraft-skills-danger:hover:not(:disabled),.waycraft-skills button.waycraft-skills-danger:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-state-error-primary)}
.waycraft-skills select{appearance:none;-webkit-appearance:none;block-size:32px;min-block-size:32px;padding-block:0;padding-inline:12px 32px;border-radius:var(--dsw-radius-md,12px);background-color:var(--dsw-alias-bg-layer-1);background-repeat:no-repeat;background-position:calc(100% - 15px) 14px,calc(100% - 10px) 14px;background-size:5px 5px,5px 5px;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);max-inline-size:100%;cursor:pointer}
.waycraft-skills select:dir(rtl),.waycraft-skills [dir=rtl] select{background-position:15px 14px,10px 14px;padding-inline:32px 12px}
.waycraft-skills select{color:var(--dsw-alias-label-primary);border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2))}
.waycraft-skills select:focus{border-color:var(--dsw-alias-state-business-primary)}
.waycraft-skills select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));outline-offset:2px}
.waycraft-skills select:disabled{opacity:.6;cursor:not-allowed}
.waycraft-skills-toolbar select{max-inline-size:240px}
.waycraft-skills-dialog select,.waycraft-skills-menu select{max-inline-size:none;inline-size:100%}
.waycraft-skills input{min-block-size:32px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.waycraft-skills input::placeholder{color:var(--dsw-alias-label-tertiary)}
.waycraft-skills button:focus-visible,.waycraft-skills input:focus-visible,.waycraft-skills summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-skills-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.waycraft-skills-stat+.waycraft-skills-stat{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-stat strong{font-size:18px;line-height:26px;color:var(--dsw-alias-label-primary)}
.waycraft-skills-source{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));overflow:hidden}
.waycraft-skills-source>summary{display:flex;align-items:center;gap:8px;min-block-size:44px;padding:8px 16px;cursor:pointer;font-weight:600;list-style:none}
.waycraft-skills-source>summary::-webkit-details-marker{display:none}
.waycraft-skills-chev{flex:none;inline-size:6px;block-size:6px;margin-inline:4px;border-inline-end:1.5px solid var(--dsw-alias-label-tertiary);border-block-end:1.5px solid var(--dsw-alias-label-tertiary);transform:rotate(-45deg);transition:transform .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills-source:dir(rtl) .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills-source[open] .waycraft-skills-chev,.waycraft-skills-source:dir(rtl)[open] .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-source[data-off]>summary>.waycraft-skills-source-name,.waycraft-skills-source[data-off]>summary>.waycraft-skills-count,.waycraft-skills-source[data-off]>summary>.waycraft-skills-source-icon{opacity:.55}
.waycraft-skills-source-name{flex:0 1 auto;overflow-wrap:anywhere}
.waycraft-skills-source-icon{inline-size:16px;block-size:16px;flex:none;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-source-path{flex:1 1 0;min-inline-size:0;margin-inline-start:auto;text-align:end;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.waycraft-skills-count{flex:none;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400;white-space:nowrap}
@media (min-width:521px){.waycraft-skills-source-meta .waycraft-skills-path{display:none}}
@media (max-width:520px){.waycraft-skills-source-path{display:none}}
.waycraft-skills-badge{white-space:nowrap;display:inline-flex;align-items:center;gap:4px;padding-inline:8px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;font-weight:400}
.waycraft-skills-status{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:400}
.waycraft-skills-source-body{display:flex;flex-direction:column;gap:12px;padding:12px 16px}
.waycraft-skills-source-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between}
.waycraft-skills button.waycraft-skills-switch{box-sizing:border-box;position:relative;display:flex;align-items:center;justify-content:flex-start;flex:0 0 auto;inline-size:36px;min-inline-size:36px;block-size:20px;min-block-size:0;padding:2px;border:0;border-radius:999px;background:var(--dsw-alias-border-l3);font-size:0;line-height:0;cursor:pointer}
.waycraft-skills button.waycraft-skills-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}
.waycraft-skills button.waycraft-skills-switch:hover:not(:disabled),.waycraft-skills button.waycraft-skills-switch:active:not(:disabled){background:var(--dsw-alias-border-l3)}
.waycraft-skills button.waycraft-skills-switch[aria-checked=true]:hover:not(:disabled),.waycraft-skills button.waycraft-skills-switch[aria-checked=true]:active:not(:disabled){background:var(--dsw-alias-brand-primary)}
.waycraft-skills button.waycraft-skills-switch:disabled{cursor:default;opacity:.5}
.waycraft-skills button.waycraft-skills-switch:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.waycraft-skills-switch-thumb{display:block;flex:none;inline-size:16px;block-size:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform .12s ease}
.waycraft-skills-switch[aria-checked=false] .waycraft-skills-switch-thumb{background:var(--dsw-alias-switch-thumb)}
.waycraft-skills-switch[aria-checked=true] .waycraft-skills-switch-thumb{transform:translate(16px)}
.waycraft-skills-switch[aria-checked=true]:dir(rtl) .waycraft-skills-switch-thumb{transform:translate(-16px)}
@media (prefers-reduced-motion:reduce){.waycraft-skills-switch-thumb{transition:none}}
.waycraft-skills button.waycraft-skills-switch::after{content:"";position:absolute;inset:-6px -4px}
@media (pointer:coarse){.waycraft-skills button.waycraft-skills-icon-btn,.waycraft-skills-row-actions button:not(.waycraft-skills-switch){min-inline-size:40px;min-block-size:40px}.waycraft-skills button.waycraft-skills-switch::after{inset:-12px -8px}}
.waycraft-skills-form[hidden]{display:none}
.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:16px minmax(0,1fr) auto;column-gap:8px}
.waycraft-skills-grip{flex:none;align-self:center;cursor:grab;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1;user-select:none;inline-size:16px;text-align:center}
.waycraft-skills-grip:active{cursor:grabbing}
.waycraft-skills .waycraft-skills-row.waycraft-skills-dragging{opacity:.4}
.waycraft-skills .waycraft-skills-catsec.waycraft-skills-drop-over{box-shadow:inset 0 0 0 1.5px var(--dsw-alias-brand-primary)}
.waycraft-skills [data-waycraft-repository]{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:12px 16px}
.waycraft-skills .waycraft-skills-repohead{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.waycraft-skills .waycraft-skills-repohead>strong{flex:1 1 160px;overflow-wrap:anywhere;direction:ltr;text-align:start}
.waycraft-skills .waycraft-skills-repohead .waycraft-skills-badge{flex:none}
.waycraft-skills .waycraft-skills-repohead .waycraft-skills-cathead-actions{min-inline-size:0;flex:none;margin-inline-start:0}
.waycraft-skills [data-waycraft-repository]>p{flex:1 1 100%;margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.waycraft-skills [data-waycraft-repository]>button{min-block-size:28px}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]{flex:1 1 100%;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding-block:12px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>span:first-child{font-weight:600}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>span+span{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>p{flex:1 1 100%;margin:0;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.waycraft-skills [data-waycraft-repository]>[data-waycraft-repo-skill]>button{margin-inline-start:auto;min-block-size:28px}
.waycraft-skills-filterrow>select.waycraft-skills-first{order:-1}
.waycraft-skills-caption{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-filterrow{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-filterrow>select{flex:0 1 200px;min-inline-size:140px}
.waycraft-skills-filterrow>input,.waycraft-skills-filterrow>.waycraft-skills-searchform{flex:1 1 180px;min-inline-size:0}
.waycraft-skills-searchform{display:flex;align-items:center;gap:4px;margin:0;padding:0;border:0;background:transparent}
.waycraft-skills-searchform>input{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-emptystate{padding:24px 12px;text-align:center;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-list{display:flex;flex-direction:column;margin:0;padding:0;list-style:none}
.waycraft-skills-listrow{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:4px 12px;padding:12px 16px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-listrow:first-child{border-block-start:0}
.waycraft-skills-listrow>ul{grid-column:1/-1}
.waycraft-skills .waycraft-skills-row.waycraft-skills-discover-row{align-items:start;padding:8px 0;background:transparent;transition:none}
.waycraft-skills-discover-row .waycraft-skills-row-title{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}
.waycraft-skills-discover-row .waycraft-skills-row-title strong{font-weight:600;overflow-wrap:anywhere}
.waycraft-skills-discover-row .waycraft-skills-row-desc{margin:0;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.waycraft-skills-meta-line{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-block-start:4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-origin{overflow-wrap:anywhere}
.waycraft-skills-stat-pill{display:inline-flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-stat-pill svg{inline-size:12px;block-size:12px}
.waycraft-skills-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.waycraft-skills button.waycraft-skills-install{display:inline-flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.waycraft-skills button.waycraft-skills-install:hover:not(:disabled),.waycraft-skills button.waycraft-skills-install:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.waycraft-skills-badge-quiet{color:var(--dsw-alias-label-tertiary)}
.waycraft-skills-repolist{margin-block-start:8px}
.waycraft-skills-meta{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.waycraft-skills .waycraft-skills-listrow .waycraft-skills-row-actions{flex-wrap:nowrap;gap:4px}
.waycraft-skills .waycraft-skills-tabs button{min-block-size:32px;padding:0 16px;border-radius:999px}
@media(max-width:640px){.waycraft-skills-filterrow>select{flex:1 1 100%}}
@media(max-width:420px){.waycraft-skills-panel{padding:8px}.waycraft-skills-listrow{padding:12px 8px;column-gap:8px}}
.waycraft-skills-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:8px 0;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-row-main{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-row-title{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-row-desc{margin:0;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.waycraft-skills-row-actions{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;justify-content:flex-end}
.waycraft-skills-row-note{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}
.waycraft-skills-row-note input{flex:1 1 200px}
.waycraft-skills-diag{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);overflow:hidden;background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-diag[data-tone=issue]{border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diag>summary{display:flex;align-items:center;gap:8px;min-block-size:36px;padding:8px 12px;cursor:pointer}
.waycraft-skills-diag[data-tone=quiet]>summary{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag ul{margin:0;padding:0 12px 8px;list-style:none;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diag li{display:flex;gap:8px;align-items:baseline;overflow-wrap:anywhere}
.waycraft-skills .waycraft-skills-diag li.waycraft-skills-diag-item{flex-direction:column;align-items:stretch;gap:4px;padding-block:8px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-diag-title{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
.waycraft-skills-diag-source{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag-chip{align-self:flex-start;max-inline-size:100%;overflow-wrap:anywhere}
.waycraft-skills-diag-detail{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-diag-more{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diag-more>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-diagregion{border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);overflow:hidden;background:transparent}
.waycraft-skills-diagregion[data-tone=issue]{border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diagregion[data-tone=warning]{border-color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diagregion>summary{display:flex;align-items:center;gap:8px;min-block-size:32px;padding:4px 12px;cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary);border-radius:inherit}
.waycraft-skills-diagregion>summary:hover{background:var(--dsw-alias-interactive-bg-hover)}
.waycraft-skills-diagregion[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diagregion[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diagregion-text{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-diagregion[open]>summary .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-diagregion:dir(rtl)>summary .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills-diagregion:dir(rtl)[open]>summary .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-diagregion-body{display:flex;flex-direction:column;gap:8px;padding:0 12px 8px}
.waycraft-skills-diaggroup{display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diaggroup ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-diaggroup li{overflow-wrap:anywhere}
.waycraft-skills-diaggroup-head{display:flex;align-items:center;gap:8px;margin:0;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-diaggroup[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-diaggroup[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag-foot{padding:0 12px 12px;display:flex;justify-content:flex-start}
.waycraft-skills-diag-hint{margin:0;padding:0 12px 4px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.waycraft-skills-icon{flex:none;inline-size:16px;block-size:16px}
.waycraft-skills-diag[data-tone=warning]{border-color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=warning] .waycraft-skills-icon{color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=note]>summary{color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills-linked{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-badge-warn{border-color:var(--dsw-alias-state-warn-label);color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-diag[data-tone=issue] .waycraft-skills-icon{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-empty,.waycraft-skills-loading{margin:0;padding:16px;text-align:center;color:var(--dsw-alias-label-secondary);border:0.5px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px)}
.waycraft-skills-alert{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;border:0.5px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-lg,16px);color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-notice{margin:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills [aria-busy=true]{cursor:progress}
.waycraft-skills-inline{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.waycraft-skills-member{display:flex;align-items:center;gap:8px;min-block-size:28px;cursor:pointer}
.waycraft-skills-member-name{flex:1 1 auto;overflow-wrap:anywhere}
.waycraft-skills input[type=checkbox]{appearance:none;-webkit-appearance:none;position:relative;inline-size:16px;block-size:16px;min-block-size:0;padding:0;border:1px solid var(--dsw-alias-label-tertiary);border-radius:var(--dsw-radius-xs,4px);background:var(--dsw-alias-bg-layer-1);flex:none;cursor:pointer}
.waycraft-skills input[type=checkbox]:checked{background:var(--dsw-alias-brand-primary);border-color:transparent}
.waycraft-skills input[type=checkbox]:checked::after{content:"";position:absolute;inset-inline-start:5px;inset-block-start:2px;inline-size:4px;block-size:8px;border:solid var(--dsw-alias-label-primary-foreground);border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}
.waycraft-skills-panel{display:flex;flex-direction:column;gap:8px;padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-panel h3,.waycraft-skills-panel h4{margin:0;font-size:14px;line-height:22px;font-weight:600}
.waycraft-skills-panel p{margin:0}
.waycraft-skills-panel>button,.waycraft-skills-panel>select,.waycraft-skills-panel>input{align-self:flex-start;max-inline-size:100%}
.waycraft-skills-panel>input:not([type=file]),.waycraft-skills-panel>select{align-self:stretch}
.waycraft-skills-card{padding:8px 12px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-1);list-style:none}
.waycraft-skills-tabs{display:inline-flex;flex-wrap:wrap;gap:4px;padding:4px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);align-self:flex-start}
.waycraft-skills-tabs button{min-block-size:28px;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-tabs button[aria-selected=true],.waycraft-skills-tabs button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}
.waycraft-skills-form{display:flex;flex-direction:column;gap:8px;padding:12px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
.waycraft-skills-form p{margin:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-form button{align-self:flex-start}
.waycraft-skills-textarea{min-block-size:120px;padding:8px 12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);resize:vertical}
.waycraft-skills textarea:focus-visible,.waycraft-skills [tabindex="-1"]:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-dialog{display:flex;flex-direction:column;gap:8px;max-inline-size:min(600px,100%);padding:16px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3))}
.waycraft-skills-dialog{padding:0;gap:0;overflow:hidden}
.waycraft-skills-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:16px 24px;border-block-end:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-dialog-head h3{font-size:16px;line-height:24px;font-weight:600}
.waycraft-skills-dialog-body{display:flex;flex-direction:column;gap:16px;padding:24px;overflow:auto;min-block-size:0}
.waycraft-skills-dialog-footer{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:16px 24px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-dialog .waycraft-skills-form,.waycraft-skills-dialog .waycraft-skills-panel{padding:0;border:0;background:transparent;gap:8px}
.waycraft-skills-dialog-body .waycraft-skills-dialog-footer{margin:12px -24px -24px;inline-size:auto}
.waycraft-skills-dialog-body .waycraft-skills-form .waycraft-skills-dialog-footer button{align-self:auto}
.waycraft-skills-dialog-footer button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
.waycraft-skills-drop{display:flex;flex-direction:column;align-items:center;gap:4px;padding:24px 16px;text-align:center;cursor:pointer;border:1px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);transition:background-color .2s cubic-bezier(.4,0,.2,1),border-color .2s cubic-bezier(.4,0,.2,1)}
.waycraft-skills-drop strong{color:var(--dsw-alias-label-primary);font-weight:600}
.waycraft-skills-drop:hover,.waycraft-skills-drop[data-drag=over]{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));border-color:var(--dsw-alias-brand-primary)}
.waycraft-skills-drop:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.waycraft-skills-customlist{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.waycraft-skills-customlist li{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px}
.waycraft-skills-reqs{margin:0;padding-inline-start:24px;color:var(--dsw-alias-label-secondary);font-size:12px;display:flex;flex-direction:column;gap:4px}
.waycraft-skills-divider{margin:0;border:0;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-pathrow{display:flex;gap:8px;align-items:flex-end}
.waycraft-skills-pathrow .waycraft-skills-labeled{flex:1 1 auto;min-inline-size:0}
.waycraft-skills-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.waycraft-skills-grid>*{min-inline-size:0}
.waycraft-skills-panel>.waycraft-skills-form{border:0;padding:0;background:transparent}
.waycraft-skills-labeled{display:flex;flex-direction:column;gap:8px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.waycraft-skills-labeled input{inline-size:100%;font-size:14px;color:var(--dsw-alias-label-primary)}
.waycraft-skills-helper{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;color:var(--dsw-alias-label-secondary);font-size:12px}
.waycraft-skills button.waycraft-skills-link{min-block-size:0;padding:0;border:0;background:transparent;color:var(--dsw-alias-brand-primary);text-decoration:underline;cursor:pointer}
.waycraft-skills button.waycraft-skills-link:hover:not(:disabled),.waycraft-skills button.waycraft-skills-link:active:not(:disabled){background:transparent;color:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary))}
.waycraft-skills summary:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-1))}
.waycraft-skills input[type=file]::file-selector-button:hover{background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3))}
.waycraft-skills input[type=file]::file-selector-button:active{background:var(--dsw-alias-interactive-bg-active,var(--dsw-alias-bg-layer-3))}
.waycraft-skills-field-error{color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-dialog p,.waycraft-skills-dialog h3{margin:0;overflow-wrap:anywhere}
.waycraft-skills-dialog pre{margin:0;padding:8px 12px;max-block-size:320px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);font-family:var(--ds-font-family-code)}
.waycraft-skills button.waycraft-skills-danger:hover:not(:disabled){border-color:var(--dsw-alias-state-error-primary)}
.waycraft-skills-form button,.waycraft-skills-panel>button,.waycraft-skills-header button{min-block-size:36px;border-radius:var(--dsw-radius-md,12px)}
@media (min-width:561px){.waycraft-skills-dialog-head,.waycraft-skills-dialog-footer{padding-inline:24px}.waycraft-skills-dialog-body{padding:24px 24px}.waycraft-skills-dialog-body .waycraft-skills-dialog-footer{margin:12px -24px -24px}}
@media (max-width:520px){.waycraft-skills .waycraft-skills-row,.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:minmax(0,1fr) auto}.waycraft-skills .waycraft-skills-row[draggable=true]{grid-template-columns:16px minmax(0,1fr) auto}.waycraft-skills-toolbar select,.waycraft-skills-toolbar input{flex:1 1 100%}}
@media (prefers-reduced-motion:reduce){.waycraft-skills *,.waycraft-skills *::before{transition:none!important;animation:none!important}}
.waycraft-skills input[type=file]::file-selector-button{min-block-size:28px;margin-inline-end:8px;padding-inline:12px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer}
.waycraft-skills-row-actions button{min-block-size:28px}
.waycraft-skills-row{grid-template-columns:minmax(0,1fr) auto;align-items:center}
.waycraft-skills-ico{flex:none}
.waycraft-skills button.waycraft-skills-icon-btn{display:inline-flex;align-items:center;justify-content:center;inline-size:28px;block-size:28px;min-block-size:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-tertiary)}
.waycraft-skills button.waycraft-skills-icon-btn:hover:not(:disabled),.waycraft-skills button.waycraft-skills-icon-btn:active:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.waycraft-skills button.waycraft-skills-icon-btn:disabled{opacity:.4}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-state-error-primary)}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills button.waycraft-skills-icon-btn.waycraft-skills-icon-btn--primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-bg-base))}
.waycraft-skills-icon-btn svg{inline-size:16px;block-size:16px}
.waycraft-skills-seg{display:inline-flex;flex-wrap:wrap;max-inline-size:100%;gap:4px;padding:4px;border:0.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);min-block-size:32px;flex:0 0 auto}
.waycraft-skills-seg button{display:inline-flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;border-color:transparent;background:transparent;border-radius:var(--dsw-radius-sm,8px)}
.waycraft-skills-seg button[aria-pressed=true]{background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l3,var(--dsw-alias-border-l2))}
.waycraft-skills-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none;padding:0;border:0}
.waycraft-skills-iconbar{display:inline-flex;flex:none;align-items:stretch;block-size:32px;border:0.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,12px);background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn{inline-size:32px;block-size:100%;min-block-size:0;border-radius:0;color:var(--dsw-alias-label-secondary)}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn+button.waycraft-skills-icon-btn{border-inline-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills .waycraft-skills-iconbar button.waycraft-skills-icon-btn:focus-visible{outline-offset:-2px}
.waycraft-skills-toolbar .waycraft-skills-iconbar{margin-inline-start:auto}
.waycraft-skills-source>summary .waycraft-skills-icon-btn,.waycraft-skills-source>summary .waycraft-skills-switch{flex:none}
@media (max-width:520px){.waycraft-skills-source>summary{flex-wrap:wrap}.waycraft-skills-source-name{flex:1 1 auto;min-inline-size:4ch}.waycraft-skills-source>summary .waycraft-skills-switch{font-size:0}.waycraft-skills-source>summary .waycraft-skills-status{display:none}.waycraft-skills-source>summary>:first-child+*{white-space:nowrap}}
.waycraft-skills-pop{position:fixed;inset:auto;z-index:1000;inline-size:auto;max-inline-size:calc(100vw - 16px);display:block}
.waycraft-skills-overlay{position:fixed;inset:0;z-index:1000;inline-size:auto;max-inline-size:none;display:flex;align-items:center;justify-content:center;padding:16px;background:var(--dsw-alias-bg-base);background:color-mix(in srgb,var(--dsw-alias-bg-base) 60%,transparent);overflow:auto}
.waycraft-skills-overlay .waycraft-skills-dialog{inline-size:min(var(--waycraft-skills-w,600px),100%);min-inline-size:0;max-block-size:calc(100vh - 32px);max-block-size:calc(100dvh - 32px);overflow:hidden;overflow-wrap:anywhere}
.waycraft-skills-menu{max-block-size:calc(100vh - 16px);max-block-size:calc(100dvh - 16px);overflow:auto;box-shadow:var(--dsw-elevation-soft,var(--dsw-shadow-lv3));display:flex;flex-direction:column;gap:4px;min-inline-size:160px;padding:8px;border:0.5px solid var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-layer-2)}
.waycraft-skills-menu button,.waycraft-skills-menu select{inline-size:100%;text-align:start}
.waycraft-skills-diag,.waycraft-skills-catsec{overflow:hidden}
.waycraft-skills-diag>summary,.waycraft-skills-catsec>summary{border-radius:inherit}
.waycraft-skills button.waycraft-skills-link.waycraft-skills-danger,.waycraft-skills button.waycraft-skills-link.waycraft-skills-danger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}
@media (max-width:520px){.waycraft-skills-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){.waycraft-skills .waycraft-skills-row.waycraft-skills-discover-row{grid-template-columns:minmax(0,1fr);align-items:start}.waycraft-skills .waycraft-skills-discover-row .waycraft-skills-row-actions{justify-content:flex-end}}
.waycraft-skills-catempty{margin:0;padding-inline:32px 8px;padding-block-end:8px}
.waycraft-skills-pathrow>button{white-space:nowrap;flex:none}
.waycraft-skills-cathead{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-block-size:40px;padding-inline:8px;font-weight:600;font-size:13px}
.waycraft-skills-cathead>.waycraft-skills-source-name{flex:0 1 auto;min-inline-size:max-content;max-inline-size:100%;overflow-wrap:normal}
.waycraft-skills-cathead-actions{display:flex;align-items:center;justify-content:flex-end;gap:4px;flex:1 0 auto;margin-inline-start:auto}
.waycraft-skills-footnote{margin:0;padding:8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.waycraft-skills-catico{display:inline-flex;color:var(--dsw-alias-state-warn-label)}
.waycraft-skills-catbody>summary{display:flex;align-items:center;gap:8px;min-block-size:28px;padding-inline:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px;list-style:none}
.waycraft-skills-catbody>summary::-webkit-details-marker{display:none}
.waycraft-skills .waycraft-skills-catbody>summary .waycraft-skills-chev{transform:rotate(-45deg)}
.waycraft-skills .waycraft-skills-catbody>summary:dir(rtl) .waycraft-skills-chev{transform:rotate(135deg)}
.waycraft-skills .waycraft-skills-catbody[open]>summary .waycraft-skills-chev,.waycraft-skills .waycraft-skills-catbody[open]>summary:dir(rtl) .waycraft-skills-chev{transform:rotate(45deg)}
.waycraft-skills-picklist{display:flex;flex-direction:column;gap:4px;max-block-size:260px;overflow:auto}
.waycraft-skills-catsec{border-block-start:0.5px solid var(--dsw-alias-border-l2)}
.waycraft-skills-catsec>summary{display:flex;align-items:center;gap:8px;min-block-size:32px;cursor:pointer;font-weight:600;font-size:13px}
.waycraft-skills-catsec>summary .waycraft-skills-source-name{flex:1 1 auto}
.waycraft-skills-catsec>summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
@media (max-width:520px){.waycraft-skills-seg span:not(.waycraft-skills-badge){display:none}.waycraft-skills-toolbar .waycraft-skills-iconbar{margin-inline-start:0}}

`;
    const diagnosticText = (item: any) => {
      const label = (dictionaries.en as Record<string, string>)[
        `diag.${item.code}`
      ]
        ? t(`diag.${item.code}`)
        : (item.message ?? item.code);
      const where = item.params?.path ?? item.params?.source;
      return where ? `${label} — ${where}` : label;
    };
    // Expected-absent: a default (non-custom) tool folder that is simply not installed.
    // The host emits source-unavailable and (count 1) unreadable-entries for the
    // same missing root; only that exact pair on a non-custom source is quiet.
    const isAbsentDefault = (item: any, sources: any[], items: any[]) => {
      const id = item.params?.source;
      const known = sources.find((x: any) => x.id === id && !x.custom);
      if (!known) return false;
      if (item.code === 'source-unavailable') return true;
      return (
        item.code === 'unreadable-entries' &&
        item.params?.count === '1' &&
        items.some(
          (x: any) =>
            x.code === 'source-unavailable' && x.params?.source === id,
        )
      );
    };
    // Severity by code: a note is benign and informational, a warning needs a look, an error is a real failure.
    const NOTE_CODES = ['linked-outside-root'];
    const WARNING_CODES = [
      'discovery-truncated',
      'oversized-skill',
      'empty-skill',
      'invalid-frontmatter',
      'invalid-yaml',
      'invalid-metadata',
      'invalid-policy',
      'project-source-outside',
      'project-source-overlap',
      'root-override-ignored',
      'unreadable-entries',
    ];
    const severityOf = (item: any): 'error' | 'warning' | 'note' =>
      item.severity === 'error' ||
      item.severity === 'warning' ||
      item.severity === 'note'
        ? item.severity
        : NOTE_CODES.includes(item.code)
          ? 'note'
          : WARNING_CODES.includes(item.code)
            ? 'warning'
            : 'error';
    const DIAG_CAP = 8;
    const SEVERITY_PATHS: Record<string, string> = {
      error: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5v3.5M8 10.5v.01',
      warning: 'M8 2.5l6 10.5H2zM8 6.5v3M8 11.5v.01',
      note: 'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 7.5V11M8 5v.01',
    };
    const severityIcon = (level: string, extra: Record<string, unknown>) =>
      h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          ...extra,
        },
        h('path', { d: SEVERITY_PATHS[level] ?? SEVERITY_PATHS.note }),
      );
    function DiagGroup(props: {
      level: string;
      count: number;
      rows: any[];
      open?: boolean;
      head?: boolean;
      hint?: string;
    }) {
      const [all, setAll] = React.useState(false);
      const shown = all ? props.rows : props.rows.slice(0, DIAG_CAP);
      const key =
        props.level === 'error'
          ? props.count === 1
            ? 'diagProblem'
            : 'diagProblems'
          : props.level === 'warning'
            ? props.count === 1
              ? 'diagWarning'
              : 'diagWarnings'
            : props.count === 1
              ? 'diagNote'
              : 'diagNotes';
      // Inside a region the group is flat (no second border or disclosure): a small heading row only when the
      // region mixes severities, then the items and the quiet Show more link.
      return h(
        'div',
        {
          className: 'waycraft-skills-diaggroup',
          'data-tone': props.level === 'error' ? 'issue' : props.level,
          [`data-waycraft-skills-diag-${props.level}`]: true,
          ...(props.level === 'error'
            ? { 'data-waycraft-skills-diag-issues': true }
            : {}),
          dir: isArabic() ? 'rtl' : undefined,
        },
        props.head
          ? h(
              'p',
              { className: 'waycraft-skills-diaggroup-head' },
              severityIcon(props.level, {
                className: 'waycraft-skills-icon',
                'data-waycraft-skills-icon': props.level,
              }),
              h('bdi', null, String(props.count)),
              ' ',
              t(key),
            )
          : null,
        props.hint
          ? h('p', { className: 'waycraft-skills-diag-hint' }, props.hint)
          : null,
        h('ul', null, ...shown),
        props.rows.length > DIAG_CAP
          ? h(
              'div',
              { className: 'waycraft-skills-diag-foot' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'waycraft-skills-link',
                  onClick: () => setAll(!all),
                },
                all
                  ? t('showLess')
                  : t('showMoreCount').replace(
                      '{count}',
                      String(props.rows.length - DIAG_CAP),
                    ),
              ),
            )
          : null,
      );
    }
    // One collapsible region for ONE source (or, with id '', for items that name no source). Collapsed by default;
    // the summary row carries the worst severity icon and counts. Absent default tool folders are dropped here:
    // a tool that is not installed is not a problem and is never shown or counted.
    const diagnosticsRegion = (
      items: any[],
      sources: any[],
      id: string,
      ctl: { open: boolean; onToggle: (open: boolean) => void },
    ) => {
      const rest = items.filter(
        (x) =>
          (x.params?.source ?? '') === id &&
          !isAbsentDefault(x, sources, items),
      );
      const name = (id: string) => {
        const found = sources.find((x: any) => x.id === id);
        return found ? sourceLabel(found) : id;
      };
      const pathOf = (x: any) =>
        x.params?.path ??
        sources.find((y: any) => y.id === x.params?.source)?.path ??
        '';
      const chip = (value: string, key: string) =>
        h(
          'code',
          { key, className: 'waycraft-skills-path waycraft-skills-diag-chip' },
          h('bdi', { dir: 'ltr' }, value),
        );
      const titleOf = (x: any) => {
        if (x.code === 'unreadable-entries') {
          const n = Number(x.params?.count ?? '0');
          return n === 1
            ? t('diagEntriesOne')
            : t('diagEntriesCount').replace('{count}', String(n));
        }
        return (dictionaries.en as Record<string, string>)[`diag.${x.code}`]
          ? t(`diag.${x.code}`)
          : (x.message ?? x.code);
      };
      const hasKey = (key: string) =>
        !!(dictionaries.en as Record<string, string>)[key];
      const line = (x: any, i: number) => {
        const paths = String(x.params?.paths ?? '')
          .split('\n')
          .filter(Boolean);
        const total = Number(x.params?.count ?? paths.length);
        const reason = x.params?.reason;
        const next = hasKey(`diagNext.${x.code}`)
          ? t(`diagNext.${x.code}`)
          : '';
        const where = x.params?.path ?? (paths.length ? '' : pathOf(x));
        return h(
          'li',
          { key: `${x.code}:${i}`, className: 'waycraft-skills-diag-item' },
          h(
            'div',
            { className: 'waycraft-skills-diag-title' },
            h('strong', null, titleOf(x)),
          ),
          where ? chip(where, 'path') : null,
          reason && hasKey(`diagReason.${reason}`)
            ? h(
                'p',
                { className: 'waycraft-skills-diag-detail' },
                t(`diagReason.${reason}`),
              )
            : null,
          next
            ? h('p', { className: 'waycraft-skills-diag-detail' }, next)
            : null,
          paths.length
            ? h(
                'details',
                { className: 'waycraft-skills-diag-more' },
                h('summary', null, t('diagDetails')),
                ...paths.map((path) => chip(path, path)),
                total > paths.length
                  ? h(
                      'span',
                      { key: 'more', className: 'waycraft-skills-diag-detail' },
                      t('diagMore').replace(
                        '{count}',
                        String(total - paths.length),
                      ),
                    )
                  : null,
              )
            : null,
        );
      };
      // Identical items (same code, source and path) collapse into one row.
      const seen = new Set<string>();
      const dedupe = (list: any[]) =>
        list.filter((x) => {
          const key = `${x.code}|${x.params?.source ?? ''}|${x.params?.path ?? ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      const groups: any[] = [];
      const counts: Record<string, number> = {};
      const mixed = new Set(rest.map((x: any) => severityOf(x))).size > 1;
      for (const level of ['error', 'warning', 'note']) {
        const rows = dedupe(rest.filter((x: any) => severityOf(x) === level));
        counts[level] = rows.length;
        if (rows.length)
          groups.push(
            h(DiagGroup, {
              key: level,
              level,
              count: rows.length,
              rows: rows.map((x: any, i: number) => line(x, i)),
              head: mixed,
            }),
          );
      }
      if (!groups.length) return null;
      const worst = counts.error
        ? 'error'
        : counts.warning
          ? 'warning'
          : 'note';
      const label = (level: string, n: number) =>
        `${n} ${t(
          level === 'error'
            ? n === 1
              ? 'diagProblem'
              : 'diagProblems'
            : level === 'warning'
              ? n === 1
                ? 'diagWarning'
                : 'diagWarnings'
              : n === 1
                ? 'diagNote'
                : 'diagNotes',
        )}`;
      const summary = ['error', 'warning', 'note']
        .filter((level) => counts[level])
        .map((level) => label(level, counts[level]))
        .join(' · ');
      return h(
        'details',
        {
          key: `diag:${id}`,
          id: `waycraft-diag-${id || 'general'}`,
          className: 'waycraft-skills-diagregion',
          'data-tone': worst === 'error' ? 'issue' : worst,
          'data-waycraft-diag-source': id,
          open: ctl.open,
          onToggle: (event: any) => {
            const open = !!event.currentTarget?.open;
            if (open !== ctl.open) ctl.onToggle(open);
          },
          dir: isArabic() ? 'rtl' : undefined,
        },
        h(
          'summary',
          null,
          severityIcon(worst, {
            className: 'waycraft-skills-icon',
            'data-waycraft-skills-icon': worst,
          }),
          h(
            'span',
            { className: 'waycraft-skills-diagregion-text' },
            id ? summary : `${t('diagGeneral')} · ${summary}`,
          ),
          h('span', { className: 'waycraft-skills-chev', 'aria-hidden': true }),
        ),
        h('div', { className: 'waycraft-skills-diagregion-body' }, ...groups),
      );
    };
    const call = async (body: any, signal?: AbortSignal) => {
      const base = new URL(document.baseURI);
      if (!base.pathname.endsWith('/')) base.pathname += '/';
      const response = await fetch(
        new URL('api/waycraft-skills.catalog', base),
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
          },
          body: JSON.stringify(body),
          signal,
        },
      );
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
    const icon = (d: string, extra?: any) =>
      h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          className: 'waycraft-skills-ico',
          ...extra,
        },
        h('path', { d }),
      );
    const ICONS: Record<string, string> = {
      refresh: 'M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3',
      plus: 'M8 3v10M3 8h10',
      filePlus: 'M4 2h5l3 3v9H4zM9 2v3h3M8 8v4M6 10h4',
      folderPlus: 'M2 4.5h4l1.5 1.5H14v7H2zM8 8v3M6.5 9.5h3',
      pencil: 'M3 13l.5-3L10.5 3l2.5 2.5L6 12.5zM9 4.5L11.5 7',
      importIcon: 'M8 2v8M5 7l3 3 3-3M3 13h10',
      folder: 'M2 4.5h4l1.5 1.5H14v7H2z',
      global:
        'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM2 8h12M8 2c2.5 2.5 2.5 9.5 0 12M8 2c-2.5 2.5-2.5 9.5 0 12',
      search: 'M7 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10 10l3.5 3.5',
      trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 9h6l.5-9',
      more: 'M3.5 8h.01M8 8h.01M12.5 8h.01',
      file: 'M4 2h5l3 3v9H4zM9 2v3h3M6 9h4M6 11.5h4',
      download: 'M8 2v8M5 7l3 3 3-3M3 13h10',
      check: 'M3 8.5l3.5 3.5L13 4.5',
      star: 'M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.4 4.4 13.3l.7-4L2.2 6.5l4-.6z',
    };
    const CATALOG_CAP = 100;
    // One row for every Discover list (ClawHub, skills.sh, Git repositories): name, clamped description, a meta line
    // of chips, a ghost Details icon and ONE primary pill Install with a visible label.
    const discoverRow = (p: {
      tag?: 'li' | 'div';
      key: string;
      attrs?: Record<string, unknown>;
      name: string;
      badges?: any[];
      description?: string;
      meta?: any[];
      notes?: any[];
      details?: { label: string; onClick: () => void };
      install?: {
        aria: string;
        label: string;
        title?: string;
        disabled?: boolean;
        haspopup?: boolean;
        onClick: () => void;
      };
      after?: any[];
    }) =>
      h(
        p.tag ?? 'li',
        {
          key: p.key,
          className:
            'waycraft-skills-row waycraft-skills-listrow waycraft-skills-discover-row',
          ...p.attrs,
        },
        h(
          'div',
          { className: 'waycraft-skills-row-main' },
          h(
            'span',
            { className: 'waycraft-skills-row-title' },
            h('strong', null, p.name),
            ...(p.badges ?? []),
          ),
          p.description
            ? h('p', { className: 'waycraft-skills-row-desc' }, p.description)
            : null,
          p.meta?.length
            ? h('div', { className: 'waycraft-skills-meta-line' }, ...p.meta)
            : null,
          ...(p.notes ?? []),
        ),
        h(
          'span',
          { className: 'waycraft-skills-row-actions' },
          p.details
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'waycraft-skills-icon-btn',
                  'aria-label': p.details.label,
                  title: p.details.label.split(':')[0],
                  onClick: p.details.onClick,
                },
                icon(ICONS.file),
              )
            : null,
          p.install
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'waycraft-skills-install',
                  'aria-label': p.install.aria,
                  title: p.install.title ?? p.install.aria.split(':')[0],
                  ...(p.install.haspopup ? { 'aria-haspopup': 'dialog' } : {}),
                  disabled: p.install.disabled,
                  onClick: p.install.onClick,
                },
                icon(ICONS.download),
                h('span', null, p.install.label),
              )
            : null,
        ),
        ...(p.after ?? []),
      );
    // Compact stat pill: icon + number visually, the full words for assistive tech and copy.
    const statPill = (iconPath: string, value: string, words: string) =>
      h(
        'span',
        { className: 'waycraft-skills-stat-pill', title: `${value} ${words}` },
        icon(iconPath),
        h('span', null, value),
        h('span', { className: 'waycraft-skills-sr' }, ` ${words}`),
      );
    /** Body portal target; null without a DOM (unit tests), where overlays render inline. */
    const portalTarget = () => {
      try {
        const body = (document as any).body;
        return body ? { body, dom: require('react-dom') } : null;
      } catch {
        return null;
      }
    };
    /** On/off switch. Always our own role=switch button: the host's native Switch could not be verified to
     *  render correctly inside plugin-scoped styles (it depends on host CSS-module scope), so it is not used. */
    const switchControl = (p: {
      checked: boolean;
      label: string;
      title?: string;
      disabled?: boolean;
      bare?: boolean;
      text?: string;
      onToggle: () => void;
    }) =>
      h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': p.checked,
          className: `waycraft-skills-switch${p.bare ? ' waycraft-skills-switch-bare' : ''}`,
          disabled: p.disabled,
          'aria-label': p.label,
          title: p.title,
          onClick: p.onToggle,
        },
        h('span', {
          className: 'waycraft-skills-switch-thumb',
          'aria-hidden': true,
        }),
        p.text,
      );
    const FOCUSABLE =
      'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
    // Real modal popup: fixed overlay in the viewport (portal to document.body), focus moves in and is
    // restored, Tab is trapped, Escape closes. Without a DOM it renders the bare dialog inline.
    function CatalogDialog(props: {
      label: string;
      onClose: () => void;
      wide?: boolean;
      size?: 'sm' | 'md' | 'lg' | 'xl';
      title?: string;
      children?: any;
    }) {
      const ref = React.useRef(null as any);
      React.useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        // Initial focus: the first text field of the body, else the dialog itself.
        const first = ref.current?.querySelector?.(
          '.waycraft-skills-dialog-body input:not([type=file]):not([type=checkbox]):not([disabled]),.waycraft-skills-dialog-body textarea:not([disabled]),.waycraft-skills-dialog-body select:not([disabled])',
        );
        (first ?? ref.current)?.focus?.();
        return () => previous?.focus?.();
      }, []);
      // Structure: title (a leading h3/h4 child, else the label), body, and a footer holding every direct
      // button child (Cancel/secondary first, primary or destructive last = inline end).
      const parts = React.Children.toArray(props.children) as any[];
      const lead = parts[0];
      const heading =
        lead && (lead.type === 'h3' || lead.type === 'h4') ? lead : null;
      const rest = heading ? parts.slice(1) : parts;
      const isButton = (x: any) => x?.type === 'button';
      const strong = (x: any) =>
        /waycraft-skills-(primary|danger)/.test(
          String(x.props?.className ?? ''),
        );
      const actions = rest
        .filter(isButton)
        .sort((a: any, b: any) => Number(strong(a)) - Number(strong(b)));
      const body = rest.filter((x) => !isButton(x));
      const footer = actions.length
        ? [h('div', { className: 'waycraft-skills-dialog-footer' }, ...actions)]
        : [];
      const title = heading
        ? heading.props.children
        : (props.title ?? props.label);
      const dialog = h(
        'div',
        {
          role: 'dialog',
          className: 'waycraft-skills-dialog',
          style: {
            // Plugin-owned custom property (not a host token): the dialog width tier, with a 600px CSS fallback.
            '--waycraft-skills-w': `${{ sm: 400, md: 520, lg: 600, xl: 760 }[props.size ?? (props.wide ? 'xl' : 'lg')]}px`,
          },
          'aria-modal': true,
          'aria-label': props.label,
          dir: isArabic() ? 'rtl' : undefined,
          ref,
          tabIndex: -1,
          onKeyDown: (event: any) => {
            if (event.key === 'Escape') {
              event.stopPropagation?.();
              props.onClose();
              return;
            }
            if (
              event.key === 'Enter' &&
              event.target?.tagName === 'INPUT' &&
              !['file', 'checkbox', 'button'].includes(event.target.type)
            ) {
              const primary = ref.current?.querySelector?.(
                '.waycraft-skills-dialog-footer .waycraft-skills-primary:not([disabled]),.waycraft-skills-dialog-footer .waycraft-skills-danger:not([disabled])',
              );
              if (primary) {
                event.preventDefault?.();
                primary.click();
              }
              return;
            }
            if (event.key !== 'Tab') return;
            const items = Array.from(
              ref.current?.querySelectorAll?.(FOCUSABLE) ?? [],
            ) as HTMLElement[];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (
              event.shiftKey &&
              (active === first || active === ref.current)
            ) {
              event.preventDefault?.();
              last.focus();
            } else if (!event.shiftKey && active === last) {
              event.preventDefault?.();
              first.focus();
            }
          },
        },
        h(
          'div',
          { className: 'waycraft-skills-dialog-head' },
          h('h3', null, title),
          h(
            'button',
            {
              type: 'button',
              className: 'waycraft-skills-icon-btn waycraft-skills-dialog-x',
              'aria-label': t('close'),
              title: t('close'),
              onClick: props.onClose,
            },
            h(
              'svg',
              {
                viewBox: '0 0 16 16',
                width: 16,
                height: 16,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                'aria-hidden': true,
              },
              h('path', { d: 'M4 4l8 8M12 4l-8 8' }),
            ),
          ),
        ),
        h('div', { className: 'waycraft-skills-dialog-body' }, ...body),
        ...footer,
      );
      const host = portalTarget();
      return host
        ? host.dom.createPortal(
            h(
              'div',
              {
                className: 'waycraft-skills waycraft-skills-overlay',
                dir: isArabic() ? 'rtl' : undefined,
              },
              dialog,
            ),
            host.body,
          )
        : dialog;
    }
    /** Row action menu: an anchored popover (never pushes layout) that flips, stays in the viewport,
     *  closes after an action, on Escape and outside press, and returns focus to its trigger. */
    function MoreMenu(props: {
      label: string;
      title: string;
      trigger: any;
      children?: any;
    }) {
      const trigger = React.useRef(null as any);
      const menu = React.useRef(null as any);
      const [open, setOpen] = React.useState(false);
      const [pos, setPos] = React.useState(null as any);
      const close = (focus: boolean) => {
        setOpen(false);
        setPos(null);
        if (focus) trigger.current?.focus?.();
      };
      React.useEffect(() => {
        if (!open) return undefined;
        const place = () => {
          const rect = trigger.current?.getBoundingClientRect?.();
          const box = menu.current;
          if (!rect || !box) return;
          const root = (document as any).documentElement;
          const vh = (globalThis as any).innerHeight || root?.clientHeight || 0;
          const vw = (globalThis as any).innerWidth || root?.clientWidth || 0;
          const mh = box.offsetHeight || 0;
          const mw = box.offsetWidth || 0;
          let top = rect.bottom + 4;
          if (top + mh > vh - 8 && rect.top - 4 - mh >= 8)
            top = rect.top - 4 - mh;
          top = Math.max(8, Math.min(top, vh - mh - 8));
          let left = isArabic() ? rect.left : rect.right - mw;
          left = Math.max(8, Math.min(left, vw - mw - 8));
          setPos((old: any) =>
            old && old.top === top && old.left === left ? old : { top, left },
          );
        };
        place();
        // Menu semantics: action buttons are menu items; the first enabled item takes focus on open.
        const items = Array.from(
          menu.current?.querySelectorAll?.('button') ?? [],
        ) as HTMLElement[];
        for (const item of items) item.setAttribute?.('role', 'menuitem');
        (
          items.find((item: any) => !item.disabled) ??
          menu.current?.querySelector?.(FOCUSABLE)
        )?.focus?.();
        const away = (event: any) => {
          if (
            !trigger.current?.contains?.(event.target) &&
            !menu.current?.contains?.(event.target)
          )
            close(false);
        };
        document.addEventListener?.('pointerdown', away, true);
        document.addEventListener?.('scroll', place, true);
        (globalThis as any).addEventListener?.('resize', place);
        return () => {
          document.removeEventListener?.('pointerdown', away, true);
          document.removeEventListener?.('scroll', place, true);
          (globalThis as any).removeEventListener?.('resize', place);
        };
      }, [open]);
      const host = portalTarget();
      const list =
        open || !host
          ? h(
              'div',
              {
                ref: menu,
                role: 'menu',
                hidden: !open,
                className: 'waycraft-skills-menu',
                dir: isArabic() ? 'rtl' : undefined,
                onClick: (event: any) => {
                  if (event.target?.closest?.('button')) close(true);
                },
                onChange: () => close(true),
                onBlur: (event: any) => {
                  const next = event.relatedTarget;
                  if (
                    next &&
                    !menu.current?.contains?.(next) &&
                    !trigger.current?.contains?.(next)
                  )
                    close(false);
                },
                onKeyDown: (event: any) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation?.();
                    close(true);
                  } else if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
                    const items = Array.from(
                      menu.current?.querySelectorAll?.(FOCUSABLE) ?? [],
                    ) as HTMLElement[];
                    const at = items.indexOf(document.activeElement as any);
                    const next =
                      items[
                        (at +
                          (event.key === 'ArrowDown' ? 1 : -1) +
                          items.length) %
                          items.length
                      ];
                    if (next) {
                      event.preventDefault?.();
                      next.focus();
                    }
                  }
                },
              },
              props.children,
            )
          : null;
      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            type: 'button',
            ref: trigger,
            className: 'waycraft-skills-icon-btn',
            'aria-label': props.label,
            title: props.title,
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            onClick: () => (open ? close(false) : setOpen(true)),
            onKeyDown: (event: any) => {
              if (event.key === 'Escape' && open) {
                event.stopPropagation?.();
                close(true);
              } else if (
                !open &&
                (event.key === 'ArrowDown' || event.key === 'ArrowUp')
              ) {
                event.preventDefault?.();
                setOpen(true);
              }
            },
          },
          props.trigger,
        ),
        list && host
          ? host.dom.createPortal(
              h(
                'div',
                {
                  className: 'waycraft-skills waycraft-skills-pop',
                  style: {
                    top: pos?.top ?? 0,
                    left: pos?.left ?? 0,
                    visibility: pos ? 'visible' : 'hidden',
                  },
                },
                list,
              ),
              host.body,
            )
          : list,
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
      const num = (n: number) => Number(n).toLocaleString('en-US');
      const metadata = (item: any) =>
        [
          h(
            'bdi',
            { key: 'origin', dir: 'ltr', className: 'waycraft-skills-origin' },
            item.catalog === 'clawhub'
              ? `${item.owner}/${item.slug}`
              : `${item.source}/${item.skillId}`,
          ),
          item.downloads !== undefined
            ? statPill(ICONS.download, num(item.downloads), t('catDownloads'))
            : null,
          item.installs !== undefined
            ? statPill(ICONS.check, num(item.installs), t('catInstalls'))
            : null,
          item.stars !== undefined
            ? statPill(ICONS.star, num(item.stars), t('catStars'))
            : null,
        ].filter(Boolean);
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
        { 'data-waycraft-catalogs': true, className: 'waycraft-skills-panel' },
        h(
          'div',
          { className: 'waycraft-skills-filterrow' },
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
          h(
            'form',
            {
              className: 'waycraft-skills-searchform',
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
            h(
              'button',
              {
                type: 'submit',
                className: 'waycraft-skills-icon-btn',
                'aria-label': t('catSearch'),
                title: t('catSearch'),
              },
              icon(ICONS.search),
            ),
          ),
        ),
        kind === 'clawhub' && !searching
          ? h(
              'p',
              { className: 'waycraft-skills-caption' },
              t('catPopularNote'),
            )
          : null,
        kind === 'skillsh' && !searching
          ? h(
              'p',
              { className: 'waycraft-skills-caption' },
              t('catSkillshHint'),
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
          { className: 'waycraft-skills-list' },
          ...shown.map((item: any) => {
            const copies = copiesOf(item);
            return discoverRow({
              key: item.id,
              attrs: { 'data-waycraft-catalog-item': item.id },
              name: item.name,
              badges: copies.length
                ? [
                    h(
                      'span',
                      { key: 'installed', className: 'waycraft-skills-badge' },
                      t('catInstalled'),
                    ),
                  ]
                : [],
              description: item.summary,
              meta: metadata(item),
              notes:
                !copies.length && recordsOf(item).length
                  ? [
                      h(
                        'p',
                        {
                          key: 'hint',
                          role: 'note',
                          className: 'waycraft-skills-meta',
                        },
                        t(`catHint.${recordsOf(item)[0].status}`),
                      ),
                    ]
                  : [],
              details: {
                label: `${t('catDetails')}: ${item.name}`,
                onClick: () => void openDetail(item),
              },
              install: {
                aria: `${copies.length ? t('catInstallElsewhere') : t('catInstall')}: ${item.name}`,
                label: t('repoInstall'),
                title: copies.length
                  ? t('catInstallElsewhere')
                  : t('catInstall'),
                disabled: !!working,
                onClick: () => {
                  setInstalling(item);
                  setConflict(false);
                  setTarget('user-dsh');
                },
              },
              after: [
                recordsOf(item).length
                  ? h(
                      'ul',
                      { 'aria-label': `${t('catCopies')}: ${item.name}` },
                      ...recordsOf(item).map((entry: any) =>
                        h(
                          'li',
                          {
                            key: entry.id,
                            'data-waycraft-catalog-copy': entry.id,
                          },
                          placeNode(data, entry),
                          ' · ',
                          h(
                            'bdi',
                            { dir: 'ltr' },
                            `${entry.root}/${entry.name}`,
                          ),
                          ` · ${t(`catStatus.${entry.status}`)}`,
                          entry.status === 'invalid-root' ||
                            entry.status === 'missing'
                            ? h(
                                'button',
                                {
                                  className: 'waycraft-skills-danger',
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
                                    className: 'waycraft-skills-danger',
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
              ],
            });
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
              h(
                'button',
                {
                  className: 'waycraft-skills-primary',
                  onClick: () => setDetail(null),
                },
                t('catClose'),
              ),
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
              h(
                'p',
                { className: 'waycraft-skills-meta-line' },
                ...metadata(installing),
              ),
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
                  className: 'waycraft-skills-primary',
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
        [copiedDetail, setCopiedDetail] = React.useState(false),
        [scope, setScope] = React.useState('global'),
        [tab, setTab] = React.useState('git'),
        [project, setProject] = React.useState(''),
        [folderPath, setFolderPath] = React.useState(''),
        [candidates, setCandidates] = React.useState(null),
        [editing, setEditing] = React.useState(null),
        [removing, setRemoving] = React.useState(''),
        [rootEdit, setRootEdit] = React.useState(null),
        [pendingScan, setPendingScan] = React.useState(false),
        [loaded, setLoaded] = React.useState(''),
        [notice, setNotice] = React.useState(''),
        [managing, setManaging] = React.useState(false),
        [addOpen, setAddOpen] = React.useState(false),
        [catDialog, setCatDialog] = React.useState(null as any),
        [addTo, setAddTo] = React.useState(null as any),
        [addPick, setAddPick] = React.useState([] as string[]),
        [addQuery, setAddQuery] = React.useState(''),
        [catName, setCatName] = React.useState({}),
        [catEdit, setCatEdit] = React.useState(null),
        [catRemoving, setCatRemoving] = React.useState(''),
        [catFilter, setCatFilter] = React.useState(''),
        [noteDrafts, setNoteDrafts] = React.useState({}),
        [noteDialog, setNoteDialog] = React.useState(null),
        [orgOpen, setOrgOpen] = React.useState({}),
        [importing, setImporting] = React.useState(false),
        [importPath, setImportPath] = React.useState(''),
        [importFiles, setImportFiles] = React.useState([]),
        [importConflict, setImportConflict] = React.useState(''),
        [importResult, setImportResult] = React.useState(null),
        [importBusy, setImportBusy] = React.useState(false),
        [importDrag, setImportDrag] = React.useState(false),
        [importMsg, setImportMsg] = React.useState(''),
        [trashDeleting, setTrashDeleting] = React.useState(''),
        [repoFormOpen, setRepoFormOpen] = React.useState(false),
        dragRef = React.useRef(null as any),
        copiedTimer = React.useRef(null as any),
        [repoInstalling, setRepoInstalling] = React.useState(''),
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
        [refreshing, setRefreshing] = React.useState(false),
        [creating, setCreating] = React.useState(false),
        [createName, setCreateName] = React.useState(''),
        [createDescription, setCreateDescription] = React.useState(''),
        [createBody, setCreateBody] = React.useState(''),
        [createSource, setCreateSource] = React.useState('user-dsh');
      // A dialog opens on the page's own destination: the selected project in a project view, else a user source.
      React.useEffect(() => {
        if (!creating && !importing) return;
        setCreateSource((prev: string) =>
          scope === 'project' && project
            ? `${PROJECT_DEST}${project}`
            : projectOfDest(prev) !== undefined
              ? 'user-dsh'
              : prev,
        );
      }, [creating, importing, scope, project]);
      const fileInput = React.useRef(null as any);
      const dirInput = React.useRef(null as any);
      React.useEffect(
        () => () => {
          if (copiedTimer.current) clearTimeout(copiedTimer.current);
        },
        [],
      );
      const repoDestination = validDestination(data, repoTarget);
      // A project that leaves the registry drops out of the picker: fall back to the default destination.
      React.useEffect(() => {
        if (data && !validDestination(data, repoTarget))
          setRepoTarget('user-dsh');
      }, [data]);
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
        setCatFilter('');
        setNoteDrafts({});
        setCatEdit(null);
        setCatRemoving('');
        void load();
      }, [scope, project]);
      React.useEffect(() => {
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
          // A successful mutation (including Refresh) returns the fresh catalog, so a stale load error no longer applies.
          setError(false);
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
      // Dropped items join the same list the file/folder inputs fill, so runImport applies identical limits.
      const MAX_DROP = 600;
      const readAll = (reader: any): Promise<any[]> =>
        new Promise((resolve, reject) => {
          const out: any[] = [];
          const next = () =>
            reader.readEntries((batch: any[]) => {
              if (!batch.length) return resolve(out);
              out.push(...batch);
              next();
            }, reject);
          next();
        });
      const entryFiles = async (entry: any, out: any[]): Promise<void> => {
        if (out.length > MAX_DROP) return;
        if (entry.isFile) {
          const file: any = await new Promise((resolve, reject) =>
            entry.file(resolve, reject),
          );
          out.push({
            name: file.name,
            size: file.size,
            webkitRelativePath: String(entry.fullPath ?? file.name).replace(
              /^\/+/,
              '',
            ),
            arrayBuffer: () => file.arrayBuffer(),
          });
        } else if (entry.isDirectory) {
          for (const child of await readAll(entry.createReader()))
            await entryFiles(child, out);
        }
      };
      const dropItems = async (transfer: any) => {
        setImportDrag(false);
        // Entries must be taken synchronously: the DataTransfer is emptied after the first await.
        const taken: { entry?: any; file?: any }[] = Array.from(
          transfer?.items ?? [],
        )
          .filter((item: any) => item.kind !== 'string')
          .map((item: any) => ({
            entry: item.webkitGetAsEntry?.() ?? undefined,
            file: item.getAsFile?.() ?? undefined,
          }));
        if (!taken.length)
          for (const file of Array.from(transfer?.files ?? []))
            taken.push({ file });
        const out: any[] = [];
        let skipped = 0;
        try {
          for (const item of taken) {
            if (item.entry?.isDirectory) await entryFiles(item.entry, out);
            else {
              const name = String(item.entry?.name ?? item.file?.name ?? '');
              if (!/\.(zip|md)$/i.test(name)) {
                skipped++;
                continue;
              }
              if (item.entry) await entryFiles(item.entry, out);
              else out.push(item.file);
            }
          }
        } catch {
          setImportMsg(t('importDropFailed'));
          return;
        }
        setImportPath('');
        setImportResult(null);
        setImportFiles(out);
        setImportMsg(skipped ? t('importDropUnsupported') : '');
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
            ...destRequest(),
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
          await destMutate(body, (value: any) => setImportResult(value.result));
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
      // Reference rule: list a source only when it is a writable destination, custom,
      // holds skills, or has a real problem; absent default tool folders stay hidden.
      const visibleSources = (view?.sources ?? []).filter(
        (x: any) =>
          x.id === 'user-dsh' ||
          x.id === 'user-agents' ||
          x.kind === 'dsh' ||
          x.custom ||
          (view?.copies ?? []).some((c: any) => c.source === x.id) ||
          (view?.diagnostics ?? []).some(
            (d: any) =>
              d.params?.source === x.id &&
              !isAbsentDefault(d, view?.sources ?? [], view?.diagnostics ?? []),
          ),
      );
      // Totals cover every copy of the scope (never the search or filters), as in the reference manager.
      const totals = { total: 0, enabled: 0, disabled: 0, invalid: 0 };
      for (const copy of view?.copies ?? []) {
        const state = copyStatus(copy);
        totals.total++;
        if (state === 'enabled') totals.enabled++;
        else if (state === 'disabled') totals.disabled++;
        else if (state === 'invalid') totals.invalid++;
      }
      // Reloads the catalog through the existing reload action; a failure shows in the usual notice.
      const refresh = async () => {
        if (refreshing || switching || busy.current) return;
        setRefreshing(true);
        try {
          await mutate({ action: 'reload', ...selected });
        } finally {
          setRefreshing(false);
        }
      };
      const stat = (count: number, one: string, other: string) =>
        h(
          'div',
          { key: other, className: 'waycraft-skills-stat' },
          h('strong', null, h('bdi', null, String(count))),
          ' ',
          t(count === 1 ? one : other),
        );
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
            `${copy.name} ${copy.description} ${copy.path} ${organization.notes[copy.name] ?? ''} ${t(copyStatus(copy))} ${sourceLabel((view?.sources ?? []).find((x: any) => x.id === copy.source) ?? { id: copy.source })}`
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
      // Destination ids encode scope and source: user-dsh | user-agents | project-dsh:<id>. Create/Import send the
      // same body as before: the project id is only a selector the host re-resolves.
      const destRequest = () => {
        const p = projectOfDest(createSource);
        return { source: createSource, ...(p ? { project: p } : {}) };
      };
      // Writes into the page's own context go through mutate; another context writes, then reloads the page view.
      const destMutate = async (body: any, done?: (value: any) => void) => {
        if ((projectOfDest(createSource) ?? '') === key)
          return mutate(body, done);
        if (busy.current || lifetime.current.signal.aborted) return;
        busy.current = true;
        setNotice('');
        try {
          const value = await call(body, lifetime.current.signal);
          if (lifetime.current.signal.aborted) return;
          done?.(value);
          await load();
        } catch (failure: any) {
          if (!lifetime.current.signal.aborted) setNotice(errorText(failure));
        } finally {
          busy.current = false;
        }
      };
      /** Scope + Location selects, project hints and the resolved folder chip (path comes from the payload). */
      const destPick = () => {
        const list = destinationsOf(data);
        const isProject = projectOfDest(createSource) !== undefined;
        const users = list.filter((x: any) => !x.project);
        const projects = list.filter((x: any) => x.project);
        const chosen = validDestination(data, createSource);
        const shown = isProject ? projects : users;
        return [
          h(
            'div',
            { className: 'waycraft-skills-grid' },
            labeled(
              t('destScope'),
              h(
                'select',
                {
                  'aria-label': t('destScope'),
                  value: isProject ? 'project' : 'user',
                  disabled: switching,
                  onChange: (event: any) =>
                    setCreateSource(
                      event.target.value === 'project'
                        ? (projects.find((x: any) => !x.disabled)?.id ??
                            projects[0]?.id ??
                            PROJECT_DEST)
                        : (users[0]?.id ?? 'user-dsh'),
                    ),
                },
                h('option', { value: 'user' }, t('destScopeUser')),
                h('option', { value: 'project' }, t('destScopeProject')),
              ),
            ),
            labeled(
              t('destLocation'),
              h(
                'select',
                {
                  'aria-label': t('destination'),
                  value: createSource,
                  onChange: (event: any) => setCreateSource(event.target.value),
                },
                ...shown.map((item: any) =>
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
            ),
          ),
          isProject && !projects.length
            ? h(
                'p',
                { className: 'waycraft-skills-helper' },
                t('destNoProjects'),
              )
            : null,
          isProject && !chosen && projects.length
            ? h('p', { className: 'waycraft-skills-helper' }, t('destInvalid'))
            : null,
          chosen?.path
            ? h(
                'p',
                { className: 'waycraft-skills-helper' },
                `${t('pathChip')}: `,
                h(
                  'bdi',
                  { dir: 'ltr', className: 'waycraft-skills-path' },
                  chosen.path,
                ),
              )
            : null,
          isProject && chosen
            ? h(
                'p',
                { className: 'waycraft-skills-helper' },
                t('destProjectNote'),
              )
            : null,
        ];
      };
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
      /** A field with a visible caption (dialog forms); the input keeps its aria-label. */
      const labeled = (caption: string, input: any) =>
        h(
          'label',
          { className: 'waycraft-skills-labeled' },
          h('span', null, caption),
          input,
        );
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
      const browse = (set: (value: string) => void, label: string) =>
        pickDirectory
          ? h(
              'button',
              {
                type: 'button',
                'data-waycraft-browse': true,
                'aria-label': `${t('browseAria')}: ${label}`,
                onClick: () =>
                  void Promise.resolve()
                    .then(() => pickDirectory?.())
                    .then((value: any) => {
                      if (typeof value === 'string' && value) set(value);
                    })
                    // Safe: a cancelled or failed picker leaves the typed path untouched; the user can retry or type.
                    .catch(() => {}),
              },
              t('browse'),
            )
          : null;
      // Built-in provider folders may be redirected (and reset) on the host; DSH and Agents never.
      const rootControls = (x: any) =>
        !x.overridable
          ? null
          : h(
              'div',
              { className: 'waycraft-skills-inline' },
              x.overridden
                ? h(
                    'span',
                    {
                      className: 'waycraft-skills-badge',
                      'data-waycraft-overridden': true,
                    },
                    t('folderRedirected'),
                    ' ',
                    h('bdi', { dir: 'ltr' }, x.defaultPath),
                  )
                : null,
            );
      const manager = () =>
        h(
          'div',
          { className: 'waycraft-skills-form waycraft-skills-manager' },
          h(
            'div',
            { className: 'waycraft-skills-pathrow' },
            labeled(
              t('folderPath'),
              field(t('folderPath'), folderPath, setFolderPath),
            ),
            browse(setFolderPath, t('folderPath')),
          ),
          h(
            'div',
            { className: 'waycraft-skills-actions' },
            h(
              'button',
              { disabled: pendingScan, onClick: () => void scanFolder() },
              t('scanFolder'),
            ),
            h(
              'button',
              {
                className: 'waycraft-skills-primary',
                disabled: !folderPath.trim(),
                onClick: () => void addFolders([{ path: folderPath }]),
              },
              t('addFolder'),
            ),
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
                              className: 'waycraft-skills-primary',
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
        removing === x.id
          ? h(
              CatalogDialog,
              {
                label: `${t('confirmRemove')}: ${sourceLabel(x)}`,
                size: 'sm',
                onClose: () => setRemoving(''),
              },
              h('p', null, t('removeNote')),
              h(
                'button',
                {
                  className: 'waycraft-skills-danger',
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
                  className: 'waycraft-skills-danger',
                  'aria-label': `${t('removeNamed')}: ${x.label ?? x.id}`,
                  onClick: () => setRemoving(x.id),
                },
                t('remove'),
              ),
            );

      const foldersOpen = !inProject && (managing || !!rootEdit || !!editing);
      const closeFolders = () => {
        setManaging(false);
        setRootEdit(null);
        setEditing(null);
        setAddOpen(false);
      };
      // One dialog for every folder job: pick a source, edit its folder, then manage custom sources below.
      const foldersDialog = () => {
        const list = (data?.sources ?? []).filter(
          (x: any) => x.custom || x.overridable,
        );
        const picked = rootEdit?.id ?? editing?.id ?? '';
        const cur = list.find((x: any) => x.id === picked);
        const pick = (id: string) => {
          const x = list.find((y: any) => y.id === id);
          setRootEdit(null);
          setEditing(null);
          if (!x) return;
          if (x.custom)
            setEditing({
              id: x.id,
              label: x.label ?? '',
              group: x.group ?? '',
              path: x.path,
            });
          else setRootEdit({ id: x.id, path: x.path });
        };
        const rootDirty =
          cur && rootEdit
            ? String(rootEdit.path ?? '').trim() !== '' &&
              rootEdit.path !== cur.path
            : false;
        const customDirty =
          cur && editing
            ? String(editing.path ?? '').trim() !== '' &&
              (editing.path !== cur.path ||
                editing.label !== (cur.label ?? '') ||
                editing.group !== (cur.group ?? ''))
            : false;
        const name = cur ? sourceLabel(cur) : '';
        const customs = list.filter((x: any) => x.custom);
        return h(
          CatalogDialog,
          { label: t('folders'), size: 'md', onClose: closeFolders },
          h('h3', null, t('folders')),
          h('p', { className: 'waycraft-skills-notice' }, t('folderHelp')),
          labeled(
            t('skillSource'),
            h(
              'select',
              {
                'aria-label': t('skillSource'),
                value: picked,
                onChange: (event: any) => pick(event.target.value),
              },
              h('option', { value: '' }, t('skillSourcePick')),
              ...list.map((x: any) =>
                h('option', { key: x.id, value: x.id }, sourceLabel(x)),
              ),
            ),
          ),
          cur && rootEdit
            ? h(
                'div',
                { className: 'waycraft-skills-form' },
                h(
                  'div',
                  {
                    'data-waycraft-root-edit': cur.id,
                    className: 'waycraft-skills-pathrow',
                  },
                  labeled(
                    t('folderPath'),
                    field(`${t('changeFolder')}: ${name}`, rootEdit.path, (v) =>
                      setRootEdit({ ...rootEdit, path: v }),
                    ),
                  ),
                  browse(
                    (v) =>
                      setRootEdit((prev: any) =>
                        prev ? { ...prev, path: v } : prev,
                      ),
                    name,
                  ),
                ),
                h(
                  'p',
                  { className: 'waycraft-skills-helper' },
                  `${t('folderDefault')}: `,
                  h('bdi', { dir: 'ltr' }, cur.defaultPath ?? cur.path),
                  cur.overridden
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'waycraft-skills-link',
                          'aria-label': `${t('resetFolder')}: ${name}`,
                          onClick: () =>
                            void mutate(
                              { action: 'root-set', id: cur.id, path: '' },
                              () => setRootEdit(null),
                            ),
                        },
                        t('resetFolder'),
                      )
                    : null,
                ),
                h(
                  'div',
                  { className: 'waycraft-skills-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      'aria-label': `${t('cancel')}: ${name}`,
                      onClick: () => setRootEdit(null),
                    },
                    t('cancel'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'waycraft-skills-primary',
                      'aria-label': `${t('saveFolder')}: ${name}`,
                      disabled: !rootDirty,
                      onClick: () =>
                        void mutate(
                          {
                            action: 'root-set',
                            id: cur.id,
                            path: rootEdit.path,
                          },
                          () => setRootEdit(null),
                        ),
                    },
                    t('saveFolder'),
                  ),
                ),
              )
            : null,
          cur && editing
            ? h(
                'div',
                { className: 'waycraft-skills-form' },
                labeled(
                  t('label'),
                  field(t('label'), editing.label, (v) =>
                    setEditing({ ...editing, label: v }),
                  ),
                ),
                labeled(
                  t('group'),
                  field(t('group'), editing.group, (v) =>
                    setEditing({ ...editing, group: v }),
                  ),
                ),
                h(
                  'div',
                  { className: 'waycraft-skills-pathrow' },
                  labeled(
                    t('folderPath'),
                    field(
                      `${t('edit')}: ${t('folderPath')}`,
                      editing.path,
                      (v) => setEditing({ ...editing, path: v }),
                    ),
                  ),
                  browse(
                    (v) =>
                      setEditing((prev: any) =>
                        prev ? { ...prev, path: v } : prev,
                      ),
                    `${t('edit')}: ${t('folderPath')}`,
                  ),
                ),
                h(
                  'div',
                  { className: 'waycraft-skills-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      'aria-label': `${t('cancel')}: ${name}`,
                      onClick: () => setEditing(null),
                    },
                    t('cancel'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'waycraft-skills-primary',
                      disabled: !customDirty,
                      'aria-label': `${t('save')}: ${name}`,
                      onClick: () =>
                        void mutate(
                          {
                            action: 'custom-update',
                            id: cur.id,
                            label: editing.label,
                            group: editing.group,
                            path: editing.path,
                          },
                          () => setEditing(null),
                        ),
                    },
                    t('save'),
                  ),
                ),
              )
            : null,
          h('hr', { className: 'waycraft-skills-divider' }),
          h(
            'div',
            { className: 'waycraft-skills-pathrow' },
            h(
              'div',
              { className: 'waycraft-skills-labeled' },
              h('strong', null, t('customSources')),
              h('span', null, t('foldersHint')),
            ),
            h(
              'button',
              {
                type: 'button',
                'aria-expanded': addOpen,
                onClick: () => setAddOpen(!addOpen),
              },
              addOpen ? t('hideForm') : t('addSource'),
            ),
          ),
          addOpen ? manager() : null,
          notice && !addOpen
            ? h(
                'p',
                { role: 'status', className: 'waycraft-skills-notice' },
                notice,
              )
            : null,
          customs.length
            ? h(
                'ul',
                { className: 'waycraft-skills-customlist' },
                ...customs.map((x: any) =>
                  h(
                    'li',
                    { key: x.id },
                    h('strong', null, sourceLabel(x)),
                    h(
                      'bdi',
                      { dir: 'ltr', className: 'waycraft-skills-path' },
                      x.path,
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'waycraft-skills-link',
                        'aria-label': `${t('editNamed')}: ${sourceLabel(x)}`,
                        onClick: () => pick(x.id),
                      },
                      t('edit'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className:
                          'waycraft-skills-link waycraft-skills-danger',
                        'aria-label': `${t('removeNamed')}: ${sourceLabel(x)}`,
                        onClick: () => setRemoving(x.id),
                      },
                      t('remove'),
                    ),
                  ),
                ),
              )
            : null,
        );
      };

      const changeScope = (value: string) => {
        setScope(value);
        setSource('');
        setNotice('');
      };
      const openDetail = (copy: any) =>
        call(
          { action: 'detail', id: copy.path, ...selected },
          lifetime.current.signal,
        )
          .then((value: any) => {
            if (!lifetime.current.signal.aborted) {
              setDetailError(false);
              setDetail(value);
            }
          })
          .catch(() => {
            if (!lifetime.current.signal.aborted) setDetailError(true);
          });
      const clearDrop = (root: any) =>
        root
          ?.querySelectorAll?.('.waycraft-skills-drop-over')
          .forEach((n: any) => n.classList.remove('waycraft-skills-drop-over'));
      const dragDone = (info: any) =>
        setNotice(`${t('dragMoved')} ${info.name}`);
      const organizationOf = (id: string) => orgOf(id);
      // Drag handlers keep their state in a ref and toggle classes on the DOM
      // (as the original does) so a React re-render can never cancel a drag.
      // A skill can only be dragged to another category of its own source; rows never reorder.
      const rowDrag = (copy: any, movable: boolean) => {
        if (!movable || !orgOf(copy.source).categories.length) return {};
        const cat = orgOf(copy.source).members[copy.name] ?? '';
        return {
          draggable: true,
          onDragStart: (e: any) => {
            const info = {
              source: copy.source,
              name: copy.name,
              category: cat,
            };
            dragRef.current = info;
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', JSON.stringify(info));
            }
            e.currentTarget.classList.add('waycraft-skills-dragging');
          },
          onDragEnd: (e: any) => {
            dragRef.current = null;
            e.currentTarget.classList.remove('waycraft-skills-dragging');
            clearDrop(e.currentTarget.closest?.('[data-waycraft-skills]'));
          },
        };
      };
      const catDrop = (sourceId: string, categoryId: string) => ({
        onDragOver: (e: any) => {
          const d = dragRef.current;
          if (!d || d.source !== sourceId || d.category === categoryId) return;
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          e.currentTarget.classList.add('waycraft-skills-drop-over');
        },
        onDragLeave: (e: any) =>
          e.currentTarget.classList.remove('waycraft-skills-drop-over'),
        onDrop: (e: any) => {
          const d = dragRef.current;
          e.currentTarget.classList.remove('waycraft-skills-drop-over');
          dragRef.current = null;
          if (!d || d.source !== sourceId || d.category === categoryId) return;
          e.preventDefault();
          void organize(
            {
              action: 'category-assign',
              source: sourceId,
              names: [d.name],
              category: categoryId,
            },
            () => dragDone(d),
          );
        },
      });
      const skillRow = (x: any, copy: any) => {
        const organization = orgOf(copy.source);
        const note = organization.notes[copy.name];
        const status = copyStatus(copy);
        const movable = copy.metadataValid !== false && !data.corrupt;
        const linked = (view?.diagnostics ?? []).some(
          (d: any) =>
            d.code === 'linked-outside-root' &&
            d.params?.source === copy.source &&
            d.params?.path === copy.path,
        );
        const canTrash =
          ['user-dsh', 'user-agents'].includes(copy.source) ||
          copy.source === `project-dsh:${project}`;
        return h(
          'article',
          {
            key: copy.path,
            className: 'waycraft-skills-row',
            'data-waycraft-skill': copy.name,
            ...rowDrag(copy, movable),
          },
          movable && organizationOf(copy.source).categories.length
            ? h(
                'span',
                {
                  className: 'waycraft-skills-grip',
                  'aria-hidden': true,
                  title: t('dragTip'),
                },
                '⋮⋮',
              )
            : null,
          h(
            'div',
            { className: 'waycraft-skills-row-main' },
            h(
              'div',
              { className: 'waycraft-skills-row-title' },
              h('strong', null, copy.name),
              // On/off is the switch's job; only states the switch cannot express get a text badge.
              status === 'invalid' ||
                status === 'shadowed' ||
                status === 'blocked'
                ? h(
                    'span',
                    {
                      className:
                        'waycraft-skills-badge waycraft-skills-badge-warn',
                      'data-waycraft-skills-status': status,
                    },
                    t(status),
                  )
                : null,
              organization.members[copy.name]
                ? h(
                    'span',
                    { className: 'waycraft-skills-badge' },
                    organization.categories.find(
                      (c: any) => c.id === organization.members[copy.name],
                    )?.name,
                  )
                : null,
            ),
            h(
              'p',
              {
                className: 'waycraft-skills-row-desc',
                'data-note': note ? true : undefined,
                title: note
                  ? `${t('note')}: ${note}\n${copy.description}`
                  : copy.description,
              },
              note ?? copy.description,
            ),
            linked
              ? h(
                  'span',
                  {
                    className: 'waycraft-skills-linked',
                    'data-waycraft-linked': true,
                  },
                  severityIcon('note', {
                    className: 'waycraft-skills-icon',
                    'data-waycraft-skills-icon': 'note',
                  }),
                  t('linkedReadOnly'),
                )
              : null,
          ),
          h(
            'div',
            { className: 'waycraft-skills-row-actions' },
            h(
              MoreMenu,
              {
                label: `${t('more')}: ${copy.name}`,
                title: t('more'),
                trigger: icon(ICONS.more),
              },
              h(
                'button',
                { type: 'button', onClick: () => void openDetail(copy) },
                t('details'),
              ),
              h(
                'button',
                {
                  type: 'button',
                  'aria-label': `${t('note')}: ${copy.name}`,
                  disabled: data.corrupt,
                  onClick: () =>
                    setNoteDialog({ source: copy.source, name: copy.name }),
                },
                t('editNote'),
              ),
              organization.categories.length && movable
                ? h(
                    'select',
                    {
                      'aria-label': `${t('assignTo')}: ${copy.name}`,
                      value: organization.members[copy.name] ?? '',
                      onChange: (e: any) =>
                        void organize({
                          action: 'category-assign',
                          source: copy.source,
                          names: [copy.name],
                          category: e.target.value,
                        }),
                    },
                    h('option', { value: '' }, t('uncategorized')),
                    ...organization.categories.map((c: any) =>
                      h('option', { key: c.id, value: c.id }, c.name),
                    ),
                  )
                : null,
              canTrash
                ? h(
                    'button',
                    {
                      className: 'waycraft-skills-danger',
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
            ),
            switchControl({
              checked: !!copy.eligible,
              bare: true,
              disabled: x.enabled === false || data.corrupt,
              label: `${t('copyCopy')}: ${copy.name} — ${copy.path}`,
              text: t('toggle'),
              onToggle: () => toggle('copy', copy.path, !copy.eligible),
            }),
          ),
        );
      };
      const sourceProblems = (id: string) =>
        (view?.diagnostics ?? []).filter(
          (d: any) =>
            d.params?.source === id &&
            severityOf(d) !== 'note' &&
            !isAbsentDefault(d, view?.sources ?? [], view?.diagnostics ?? []),
        ).length;
      // Diagnostics live inside the source card they belong to; open state is per region and kept in orgOpen.
      const regionOf = (id: string) =>
        diagnosticsRegion(view?.diagnostics ?? [], view?.sources ?? [], id, {
          open: !!orgOpen['diag:' + id],
          onToggle: (open: boolean) =>
            setOrgOpen((prev: any) => ({ ...prev, ['diag:' + id]: open })),
        });
      // The header problems badge opens the source card and its diagnostics region, then scrolls to it.
      const revealProblems = (id: string) => {
        setOrgOpen((prev: any) => ({
          ...prev,
          ['src:' + id]: true,
          ['diag:' + id]: true,
        }));
        setTimeout(
          () =>
            document
              .getElementById(`waycraft-diag-${id}`)
              ?.scrollIntoView?.({ block: 'nearest' }),
          0,
        );
      };
      const filtering = !!(query || source || status || activeCat);
      const groupName = (sourceId: string, id: string) =>
        orgOf(sourceId).categories.find((c: any) => c.id === id)?.name ?? id;
      const catIconBtn = (
        label: string,
        pathD: string,
        onClick: () => void,
        extra = '',
        disabled = false,
      ) =>
        h(
          'button',
          {
            type: 'button',
            className: `waycraft-skills-icon-btn${extra}`,
            'aria-label': label,
            title: label,
            disabled,
            onClick,
          },
          icon(pathD),
        );
      // Rows of one source; each category is a head row (siblings of the disclosure, never nested controls)
      // plus a collapsible list of its skills (collapsed unless filtering).
      const sourceRows = (x: any) => {
        const mine = copies.filter((c: any) => c.source === x.id);
        const organization = orgOf(x.id);
        if (!organization.categories.length || data.corrupt)
          return mine.map((copy: any) => skillRow(x, copy));
        return [
          ...[
            ...organization.categories,
            { id: '', name: t('uncategorized') },
          ].map((group: any) => {
            const rows = mine.filter(
              (c: any) => (organization.members[c.name] ?? '') === group.id,
            );
            const allRows = (view?.copies ?? []).filter(
              (c: any) =>
                c.source === x.id &&
                (organization.members[c.name] ?? '') === group.id,
            );
            const usable = allRows.filter(
              (c: any) => c.metadataValid !== false,
            );
            const on = usable.filter((c: any) => c.eligible).length;
            const editKey = `${x.id}/${group.id}`;
            return h(
              'div',
              {
                key: `cat:${group.id}`,
                className: 'waycraft-skills-catsec',
                'data-waycraft-cat-section': editKey,
                ...catDrop(x.id, group.id),
              },
              h(
                'div',
                { className: 'waycraft-skills-cathead' },
                h(
                  'span',
                  { className: 'waycraft-skills-catico', 'aria-hidden': true },
                  icon(ICONS.folder),
                ),
                h(
                  'span',
                  { className: 'waycraft-skills-source-name' },
                  group.name,
                ),
                h(
                  'span',
                  { className: 'waycraft-skills-count' },
                  h(
                    'bdi',
                    null,
                    `${usable.length} · ${on} ${t('enabledCount')}`,
                  ),
                ),
                h(
                  'span',
                  { className: 'waycraft-skills-cathead-actions' },
                  group.id
                    ? [
                        catIconBtn(
                          `${t('addSkillsTo')}: ${group.name}`,
                          ICONS.plus,
                          () => {
                            setAddPick([]);
                            setAddQuery('');
                            setAddTo({ source: x.id, id: group.id });
                          },
                        ),
                        catIconBtn(
                          `${t('renameCategory')}: ${group.name}`,
                          ICONS.pencil,
                          () =>
                            setCatEdit({
                              key: editKey,
                              id: group.id,
                              name: group.name,
                            }),
                        ),
                        catIconBtn(
                          `${t('deleteCategory')}: ${group.name}`,
                          ICONS.trash,
                          () => setCatRemoving(editKey),
                          ' waycraft-skills-icon-btn--danger',
                        ),
                      ]
                    : null,
                  switchControl({
                    checked: usable.length > 0 && on === usable.length,
                    bare: true,
                    label: `${t('toggleCategory')}: ${group.name}`,
                    disabled: !usable.length || x.enabled === false,
                    onToggle: () =>
                      void organize({
                        action: 'category-toggle',
                        source: x.id,
                        category: group.id,
                        enabled: !(usable.length > 0 && on === usable.length),
                      }),
                  }),
                ),
              ),
              !allRows.length
                ? h(
                    'p',
                    {
                      className:
                        'waycraft-skills-helper waycraft-skills-catempty',
                    },
                    t('catEmptyHere'),
                  )
                : h(
                    'details',
                    {
                      className: 'waycraft-skills-catbody',
                      open: filtering && rows.length > 0,
                    },
                    h(
                      'summary',
                      null,
                      h('span', {
                        className: 'waycraft-skills-chev',
                        'aria-hidden': true,
                      }),
                      h(
                        'bdi',
                        null,
                        `${allRows.length} ${t(allRows.length === 1 ? 'statSkill' : 'statSkills')}`,
                      ),
                    ),
                    rows.map((copy: any) => skillRow(x, copy)),
                  ),
            );
          }),
          h(
            'p',
            { key: 'cat-help', className: 'waycraft-skills-footnote' },
            t('catHelp'),
          ),
        ];
      };
      // Rename / delete / add-skills dialogs of the in-list category rows.
      const categoryRowDialogs = () => {
        const out: any[] = [];
        const ed = catEdit as any;
        if (ed) {
          const [sid, cid] = [ed.key.slice(0, ed.key.lastIndexOf('/')), ed.id];
          const orig = groupName(sid, cid);
          out.push(
            h(
              CatalogDialog,
              {
                key: 'cat-rename',
                label: `${t('renameCategory')}: ${orig}`,
                size: 'sm',
                onClose: () => setCatEdit(null),
              },
              h('h3', null, t('renameCategory')),
              labeled(
                t('categoryName'),
                field(t('renameCategory'), ed.name, (v) =>
                  setCatEdit({ ...ed, name: v }),
                ),
              ),
              h(
                'button',
                {
                  'aria-label': `${t('cancel')}: ${orig}`,
                  onClick: () => setCatEdit(null),
                },
                t('cancel'),
              ),
              h(
                'button',
                {
                  className: 'waycraft-skills-primary',
                  'aria-label': `${t('save')}: ${orig}`,
                  disabled: !ed.name.trim() || ed.name.trim() === orig,
                  onClick: () =>
                    void organize(
                      {
                        action: 'category-rename',
                        source: sid,
                        category: cid,
                        name: ed.name,
                      },
                      () => setCatEdit(null),
                    ),
                },
                t('save'),
              ),
            ),
          );
        }
        if (catRemoving) {
          const k = catRemoving as string;
          const sid = k.slice(0, k.lastIndexOf('/'));
          const cid = k.slice(k.lastIndexOf('/') + 1);
          const nm = groupName(sid, cid);
          out.push(
            h(
              CatalogDialog,
              {
                key: 'cat-delete',
                label: `${t('deleteCategory')}: ${nm}`,
                size: 'sm',
                onClose: () => setCatRemoving(''),
              },
              h('h3', null, `${t('deleteCategory')}: ${nm}`),
              h('p', null, t('deleteCategoryNote')),
              h(
                'button',
                {
                  'aria-label': `${t('cancel')}: ${nm}`,
                  onClick: () => setCatRemoving(''),
                },
                t('cancel'),
              ),
              h(
                'button',
                {
                  className: 'waycraft-skills-danger',
                  'aria-label': `${t('confirmDeleteCategory')}: ${nm}`,
                  onClick: () =>
                    void organize(
                      { action: 'category-delete', source: sid, category: cid },
                      () => setCatRemoving(''),
                    ),
                },
                t('confirmDeleteCategory'),
              ),
            ),
          );
        }
        const at = addTo as any;
        if (at) {
          const nm = groupName(at.source, at.id);
          const members = orgOf(at.source).members;
          const q = addQuery.trim().toLowerCase();
          const candidates = skillNames(at.source).filter(
            (n) =>
              (members[n] ?? '') !== at.id &&
              (!q || n.toLowerCase().includes(q)),
          );
          const close = () => setAddTo(null);
          out.push(
            h(
              CatalogDialog,
              {
                key: 'cat-add',
                label: `${t('addSkillsTo')}: ${nm}`,
                size: 'md',
                onClose: close,
              },
              h('h3', null, `${t('addSkillsTo')}: ${nm}`),
              field(t('search'), addQuery, setAddQuery),
              h(
                'div',
                {
                  className: 'waycraft-skills-picklist',
                  role: 'group',
                  'aria-label': t('addSkillsTo'),
                },
                candidates.length
                  ? candidates.map((n) =>
                      h(
                        'label',
                        { key: n, className: 'waycraft-skills-member' },
                        h('input', {
                          type: 'checkbox',
                          'aria-label': `${t('selectSkill')}: ${n}`,
                          checked: addPick.includes(n),
                          onChange: (e: any) =>
                            setAddPick(
                              e.target.checked
                                ? [...addPick, n]
                                : addPick.filter((y: string) => y !== n),
                            ),
                        }),
                        h(
                          'span',
                          { className: 'waycraft-skills-member-name' },
                          n,
                        ),
                      ),
                    )
                  : h(
                      'p',
                      { className: 'waycraft-skills-helper' },
                      t('addSkillsNone'),
                    ),
              ),
              h('button', { onClick: close }, t('cancel')),
              h(
                'button',
                {
                  className: 'waycraft-skills-primary',
                  disabled: !addPick.length,
                  onClick: () =>
                    void organize(
                      {
                        action: 'category-assign',
                        source: at.source,
                        names: addPick,
                        category: at.id,
                      },
                      close,
                    ),
                },
                `${t('addSkillsCount')} (${addPick.length})`,
              ),
            ),
          );
        }
        return out;
      };
      const categoryDialogView = (sourceId: string) => {
        const src = (view?.sources ?? data?.sources ?? []).find(
          (y: any) => y.id === sourceId,
        );
        const label = src ? sourceLabel(src) : sourceId;
        const name = (catName as any)[sourceId] ?? '';
        const taken = orgOf(sourceId).categories.some(
          (c: any) => c.name.toLowerCase() === name.trim().toLowerCase(),
        );
        const close = () => {
          setCatName({ ...catName, [sourceId]: '' });
          setCatDialog(null);
        };
        return h(
          CatalogDialog,
          {
            label: `${t('newCategory')}: ${label}`,
            size: 'sm',
            onClose: close,
          },
          h('h3', null, t('newCategory')),
          h(
            'p',
            { className: 'waycraft-skills-notice' },
            `${t('categoryHint')} ${label}`,
          ),
          labeled(
            t('categoryName'),
            // aria-label keeps the source name for assistive tech; the visible placeholder stays short.
            h('input', {
              'aria-label': `${t('categoryName')}: ${label}`,
              placeholder: t('categoryName'),
              value: name,
              onChange: (e: any) =>
                setCatName({ ...catName, [sourceId]: e.target.value }),
            }),
          ),
          taken
            ? h(
                'p',
                { role: 'alert', className: 'waycraft-skills-field-error' },
                t('categoryTaken'),
              )
            : null,
          h('button', { type: 'button', onClick: close }, t('cancel')),
          h(
            'button',
            {
              type: 'button',
              className: 'waycraft-skills-primary',
              'aria-label': `${t('addCategory')}: ${label}`,
              disabled: !name.trim() || taken,
              onClick: () =>
                void organize(
                  { action: 'category-create', source: sourceId, name },
                  close,
                ),
            },
            t('addCategory'),
          ),
        );
      };
      const noteDialogView = () => {
        if (!noteDialog) return null;
        const nd = noteDialog as any;
        const key = `${nd.source}/${nd.name}`;
        const stored = orgOf(nd.source).notes[nd.name] ?? '';
        const value = (noteDrafts as any)[key] ?? stored;
        const close = () => {
          const next = { ...noteDrafts } as any;
          delete next[key];
          setNoteDrafts(next);
          setNoteDialog(null);
        };
        return h(
          CatalogDialog,
          { label: `${t('note')}: ${nd.name}`, size: 'sm', onClose: close },
          h('h3', null, `${t('note')} — ${nd.name}`),
          labeled(
            t('note'),
            h('textarea', {
              className: 'waycraft-skills-textarea',
              'aria-label': `${t('note')}: ${nd.name}`,
              placeholder: t('noteHint'),
              maxLength: 500,
              title: t('noteLimit'),
              value,
              onChange: (e: any) =>
                setNoteDrafts({ ...noteDrafts, [key]: e.target.value }),
            }),
          ),
          h('p', { className: 'waycraft-skills-helper' }, t('noteSavedHint')),
          h('button', { type: 'button', onClick: close }, t('cancel')),
          h(
            'button',
            {
              type: 'button',
              className: 'waycraft-skills-primary',
              'aria-label': `${t('saveNote')}: ${nd.name}`,
              disabled: value === stored,
              onClick: () =>
                void organize(
                  {
                    action: 'note',
                    source: nd.source,
                    name: nd.name,
                    note: value,
                  },
                  close,
                ),
            },
            t('confirmNote'),
          ),
        );
      };
      return h(
        'section',
        {
          'data-waycraft-skills': true,
          className: 'waycraft-skills',
          dir: isArabic() ? 'rtl' : undefined,
        },
        h('style', null, SKILLS_STYLE),
        h(
          'div',
          { className: 'waycraft-skills-header' },
          h('h2', { className: 'waycraft-skills-title' }, t('title')),
        ),
        h(
          'div',
          { className: 'waycraft-skills-toolbar' },
          h(
            'div',
            {
              role: 'group',
              className: 'waycraft-skills-seg',
              'data-waycraft-scope-tabs': true,
            },
            ...(
              [
                ['global', 'scopeGlobal', ICONS.global],
                ['project', 'scopeProject', ICONS.folder],
                ['discover', 'scopeDiscover', ICONS.search],
                ['trash', 'trash', ICONS.trash],
              ] as string[][]
            ).map(([value, label, path]) =>
              h(
                'button',
                {
                  key: value,
                  type: 'button',
                  'aria-pressed': scope === value,
                  'data-scope': value,
                  onClick: () => changeScope(value),
                },
                icon(path),
                h('span', null, t(label)),
                value === 'trash' && data?.trash?.length
                  ? h(
                      'span',
                      { className: 'waycraft-skills-badge' },
                      h('bdi', null, String(data.trash.length)),
                    )
                  : null,
              ),
            ),
          ),
          h(
            'select',
            {
              'aria-label': t('scope'),
              'aria-hidden': true,
              tabIndex: -1,
              className: 'waycraft-skills-sr',
              value: scope,
              onChange: (e: any) => changeScope(e.target.value),
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
        ),
        scope === 'global' || scope === 'project'
          ? h(
              'div',
              { className: 'waycraft-skills-toolbar waycraft-skills-filters' },
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
                ...visibleSources.map((x: any) =>
                  h(
                    'option',
                    { key: x.id, value: x.id },
                    `${sourceLabel(x)} (${(view?.copies ?? []).filter((c: any) => c.source === x.id).length})`,
                  ),
                ),
              ),
              h(
                'select',
                {
                  'aria-label': t('any'),
                  value: status,
                  onChange: (e: any) => setStatus(e.target.value),
                },
                ...[
                  '',
                  'enabled',
                  'disabled',
                  'invalid',
                  'shadowed',
                  'blocked',
                ].map((x) => h('option', { key: x, value: x }, t(x || 'any'))),
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
              scope === 'global' || scope === 'project'
                ? h(
                    'div',
                    {
                      className: 'waycraft-skills-iconbar',
                      role: 'group',
                      'aria-label': t('actionsAria'),
                    },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'waycraft-skills-icon-btn',
                        'data-waycraft-skills-refresh': true,
                        'aria-label': t('refreshAria'),
                        title: t(refreshing ? 'refreshing' : 'refresh'),
                        'aria-busy': refreshing,
                        disabled:
                          refreshing || switching || (inProject && !project),
                        onClick: () => void refresh(),
                      },
                      icon(ICONS.refresh),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'waycraft-skills-icon-btn',
                        'aria-label': t('create'),
                        title: t('create'),
                        'aria-expanded': creating,
                        disabled:
                          switching ||
                          data?.corrupt ||
                          (scope === 'project' && !project),
                        onClick: () => setCreating(!creating),
                      },
                      icon(ICONS.plus),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'waycraft-skills-icon-btn',
                        'aria-label': t('importSkills'),
                        title: t('importSkills'),
                        'aria-expanded': importing,
                        disabled:
                          switching ||
                          data?.corrupt ||
                          (scope === 'project' && !project),
                        onClick: () => setImporting(!importing),
                      },
                      icon(ICONS.importIcon),
                    ),
                    inProject
                      ? null
                      : h(
                          'button',
                          {
                            type: 'button',
                            className: 'waycraft-skills-icon-btn',
                            'aria-label': t('folders'),
                            title: t('folders'),
                            'aria-expanded': foldersOpen,
                            onClick: () => {
                              if (managing || rootEdit || editing)
                                closeFolders();
                              else {
                                setManaging(true);
                                setAddOpen(true);
                                const first = (data?.sources ?? []).find(
                                  (y: any) => y.custom || y.overridable,
                                );
                                if (first && !first.custom)
                                  setRootEdit({
                                    id: first.id,
                                    path: first.path,
                                  });
                                else if (first)
                                  setEditing({
                                    id: first.id,
                                    label: first.label ?? '',
                                    group: first.group ?? '',
                                    path: first.path,
                                  });
                              }
                            },
                          },
                          icon(ICONS.folder),
                        ),
                  )
                : null,
            )
          : null,
        data?.trashError
          ? h('p', { role: 'alert' }, t(`code.${data.trashError}`))
          : null,
        scope === 'trash'
          ? h(
              'div',
              {
                'data-waycraft-trash': true,
                className: 'waycraft-skills-panel',
              },
              h('h3', null, t('trash')),
              !data?.trashError && !data?.trash?.length
                ? h('p', null, t('trashEmpty'))
                : null,
              ...(data?.trash ?? []).map((item: any) =>
                h(
                  'article',
                  { key: item.id, className: 'waycraft-skills-card' },
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
                      className: 'waycraft-skills-danger',
                      'aria-label': `${t('deleteTrash')}: ${item.name}`,
                      onClick: () => setTrashDeleting(item.id),
                    },
                    t('deleteTrash'),
                  ),
                  trashDeleting === item.id
                    ? h(
                        CatalogDialog,
                        {
                          label: `${t('deleteTrash')}: ${item.name}`,
                          size: 'sm',
                          onClose: () => setTrashDeleting(''),
                        },
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
                            className: 'waycraft-skills-danger',
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
                'data-waycraft-discover-tabs': true,
                className: 'waycraft-skills-tabs',
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
                    id: `waycraft-discover-tab-${id}`,
                    ...(id === 'git' ? { 'aria-label': label } : {}),
                    'aria-selected': tab === id,
                    ...(tab === id
                      ? { 'aria-controls': 'waycraft-discover-panel' }
                      : {}),
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
                          `waycraft-discover-tab-${all[next][0]}`,
                        ) as HTMLElement | null
                      )?.focus?.();
                    },
                  },
                  id === 'git'
                    ? `${label} (${(data?.repositories ?? []).length})`
                    : label,
                ),
              ),
            )
          : null,
        scope === 'discover' && tab === 'git'
          ? h(
              'div',
              {
                id: 'waycraft-discover-panel',
                role: 'tabpanel',
                'aria-labelledby': 'waycraft-discover-tab-git',
                'data-waycraft-repositories': true,
                className: 'waycraft-skills-panel',
              },
              repoFormOpen
                ? h(
                    CatalogDialog,
                    {
                      label: t('repoAddTitle'),
                      size: 'md',
                      onClose: () => setRepoFormOpen(false),
                    },
                    h('h3', null, t('repoAddTitle')),
                    h(
                      'form',
                      {
                        className: 'waycraft-skills-form',
                        onSubmit: (event: any) => {
                          event.preventDefault();
                          void repoAction(
                            'add',
                            { action: 'repo-add', repository: { ...repoForm } },
                            () => {
                              setRepoForm({
                                url: '',
                                ref: '',
                                subdirectory: '',
                              });
                              setRepoFormOpen(false);
                            },
                          );
                        },
                      },
                      labeled(
                        t('repoUrl'),
                        field(t('repoUrl'), repoForm.url, (value: string) =>
                          setRepoForm({ ...repoForm, url: value }),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'waycraft-skills-grid' },
                        labeled(
                          t('repoRef'),
                          field(t('repoRef'), repoForm.ref, (value: string) =>
                            setRepoForm({ ...repoForm, ref: value }),
                          ),
                        ),
                        labeled(
                          t('repoSubdirectory'),
                          field(
                            t('repoSubdirectory'),
                            repoForm.subdirectory,
                            (value: string) =>
                              setRepoForm({ ...repoForm, subdirectory: value }),
                          ),
                        ),
                      ),
                      data?.repoError
                        ? h(
                            'p',
                            {
                              role: 'alert',
                              className: 'waycraft-skills-field-error',
                            },
                            t(`code.${data.repoError}`),
                          )
                        : null,
                    ),
                    h(
                      'button',
                      { type: 'button', onClick: () => setRepoFormOpen(false) },
                      t('cancel'),
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'waycraft-skills-primary',
                        disabled:
                          !repoForm.url.trim() || !!repoBusy || switching,
                        onClick: () => {
                          void repoAction(
                            'add',
                            { action: 'repo-add', repository: { ...repoForm } },
                            () => {
                              setRepoForm({
                                url: '',
                                ref: '',
                                subdirectory: '',
                              });
                              setRepoFormOpen(false);
                            },
                          );
                        },
                      },
                      t('repoAdd'),
                    ),
                  )
                : null,
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
              data?.repoError && !repoFormOpen
                ? h('p', { role: 'alert' }, t(`code.${data.repoError}`))
                : null,
              h(
                'div',
                { className: 'waycraft-skills-filterrow' },
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
                    className: 'waycraft-skills-first',
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
                field(t('repoFilter'), repoFilter, setRepoFilter),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'waycraft-skills-icon-btn',
                    'aria-label': t('repoRefreshAll'),
                    title: t('repoRefreshAll'),
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
                  icon(ICONS.refresh),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'waycraft-skills-icon-btn',
                    'aria-label': t('repoAddTitle'),
                    title: t('repoAddTitle'),
                    'aria-haspopup': 'dialog',
                    onClick: () => setRepoFormOpen(true),
                  },
                  icon(ICONS.plus),
                ),
              ),
              !data?.repoError && !data?.repositories?.length
                ? h(
                    'p',
                    { className: 'waycraft-skills-emptystate' },
                    t('repoEmpty'),
                  )
                : null,
              h(
                'p',
                { className: 'waycraft-skills-caption' },
                t('repoFootnote'),
              ),
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
                  {
                    key: repo.id,
                    'data-waycraft-repository': repo.id,
                    className: 'waycraft-skills-card',
                  },
                  h(
                    'div',
                    { className: 'waycraft-skills-repohead' },
                    h(
                      'span',
                      {
                        className: 'waycraft-skills-catico',
                        'aria-hidden': true,
                      },
                      icon(ICONS.folder),
                    ),
                    h('strong', null, repo.label),
                    h(
                      'span',
                      { className: 'waycraft-skills-badge' },
                      h('bdi', { dir: 'ltr' }, repo.fingerprint.slice(0, 7)),
                    ),
                    h(
                      'span',
                      { className: 'waycraft-skills-cathead-actions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'waycraft-skills-icon-btn',
                          'aria-label': `${t('repoRefresh')}: ${repo.label}`,
                          title: t('repoRefresh'),
                          disabled: !!repoBusy || switching,
                          onClick: () =>
                            void repoAction(repo.id, {
                              action: 'repo-refresh',
                              id: repo.id,
                            }),
                        },
                        icon(ICONS.refresh),
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className:
                            'waycraft-skills-icon-btn waycraft-skills-icon-btn--danger',
                          'aria-label': `${t('repoUnsubscribe')}: ${repo.label}`,
                          title: t('repoUnsubscribe'),
                          disabled: !!repoBusy || switching,
                          onClick: () => setRepoUnsubscribing(repo.id),
                        },
                        icon(ICONS.trash),
                      ),
                    ),
                  ),
                  h(
                    'p',
                    null,
                    h(
                      'bdi',
                      { dir: 'ltr' },
                      `${repo.kind}${repo.ref ? ` @ ${repo.ref}` : ''}${repo.subdirectory ? ` / ${repo.subdirectory}` : ''}`,
                    ),
                    ` · ${t(`repoKind.${repo.fingerprintKind}`)}`,
                  ),
                  repo.error
                    ? h(
                        'p',
                        { role: 'alert' },
                        `${t('repoLastError')}: ${t(`code.${repo.error.code}`)}`,
                      )
                    : null,
                  repoUnsubscribing === repo.id
                    ? h(
                        CatalogDialog,
                        {
                          label: `${t('repoUnsubscribe')}: ${repo.label}`,
                          size: 'sm',
                          onClose: () => setRepoUnsubscribing(''),
                        },
                        h('p', null, t('repoConfirmUnsubscribe')),
                        h(
                          'button',
                          {
                            className: 'waycraft-skills-danger',
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
                  h(
                    'ul',
                    {
                      className:
                        'waycraft-skills-list waycraft-skills-repolist',
                    },
                    ...shown.map((skill: any) =>
                      discoverRow({
                        key: skill.path,
                        attrs: { 'data-waycraft-repo-skill': skill.path },
                        name: skill.name,
                        badges: [
                          h(
                            'span',
                            {
                              key: 'status',
                              className:
                                skill.status === 'installed' ||
                                skill.status === 'tracked'
                                  ? 'waycraft-skills-badge'
                                  : 'waycraft-skills-badge waycraft-skills-badge-quiet',
                            },
                            t(`repoStatus.${skill.status}`),
                          ),
                          skill.code
                            ? h(
                                'span',
                                {
                                  key: 'code',
                                  className:
                                    'waycraft-skills-badge waycraft-skills-badge-warn',
                                },
                                t(`code.${skill.code}`),
                              )
                            : null,
                        ],
                        description: skill.description,
                        notes: skill.conflicts?.length
                          ? [
                              h(
                                'p',
                                {
                                  key: 'conflict',
                                  className: 'waycraft-skills-meta',
                                },
                                `${t('repoConflictIn')}: ${skill.conflicts
                                  .map((id: string) =>
                                    id === 'user-dsh' ? 'DSH' : 'Shared Agents',
                                  )
                                  .join(', ')}`,
                              ),
                            ]
                          : [],
                        install:
                          skill.valid !== false
                            ? {
                                aria: `${t('repoInstall')}: ${skill.name}`,
                                label: t('repoInstall'),
                                title: t('repoInstall'),
                                haspopup: true,
                                disabled: !!repoBusy || switching,
                                onClick: () =>
                                  setRepoInstalling(`${repo.id}/${skill.path}`),
                              }
                            : undefined,
                        after: [
                          repoInstalling === `${repo.id}/${skill.path}`
                            ? h(
                                CatalogDialog,
                                {
                                  label: `${t('repoInstall')}: ${skill.name}`,
                                  size: 'md',
                                  onClose: () => setRepoInstalling(''),
                                },
                                h(
                                  'h3',
                                  null,
                                  `${t('repoInstall')}: ${skill.name}`,
                                ),
                                labeled(
                                  t('repoDestination'),
                                  h(
                                    'select',
                                    {
                                      'aria-label': t('repoDestination'),
                                      value: repoTarget,
                                      onChange: (event: any) =>
                                        setRepoTarget(event.target.value),
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
                                ),
                                ...destinationInfo(data, repoDestination),
                                skill.installedIn?.includes(repoTarget)
                                  ? h(
                                      'p',
                                      { className: 'waycraft-skills-helper' },
                                      t('repoStatus.installed'),
                                    )
                                  : null,
                                h(
                                  'button',
                                  { onClick: () => setRepoInstalling('') },
                                  t('cancel'),
                                ),
                                h(
                                  'button',
                                  {
                                    className: 'waycraft-skills-primary',
                                    disabled:
                                      !!repoBusy ||
                                      switching ||
                                      !repoDestination ||
                                      !!skill.conflicts?.includes(repoTarget) ||
                                      !!skill.installedIn?.includes(repoTarget),
                                    onClick: () => {
                                      setRepoInstalling('');
                                      void repoAction(
                                        repo.id,
                                        {
                                          action: 'repo-install',
                                          id: repo.id,
                                          path: skill.path,
                                          snapshot: repo.fingerprint,
                                          source: repoTarget,
                                          ...(projectOfDest(repoTarget)
                                            ? {
                                                project:
                                                  projectOfDest(repoTarget),
                                              }
                                            : {}),
                                        },
                                        repoWarning,
                                      );
                                    },
                                  },
                                  t('catInstallConfirm'),
                                ),
                              )
                            : null,
                        ],
                      }),
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
                  {
                    key: record.id,
                    'data-waycraft-repo-install': record.id,
                    className: 'waycraft-skills-card',
                  },
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
                          className: 'waycraft-skills-danger',
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
                          'aria-labelledby': `waycraft-repo-preview-${record.id}`,
                          'data-waycraft-repo-preview': record.id,
                        },
                        h(
                          'h5',
                          { id: `waycraft-repo-preview-${record.id}` },
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
                          className: 'waycraft-skills-danger',
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
                        CatalogDialog,
                        {
                          label: `${t('repoForget')}: ${record.name}`,
                          size: 'sm',
                          onClose: () => setRepoForgetting(''),
                        },
                        h('p', null, t('repoConfirmForget')),
                        h(
                          'button',
                          {
                            className: 'waycraft-skills-danger',
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
              id: 'waycraft-discover-panel',
              role: 'tabpanel',
              'aria-labelledby': `waycraft-discover-tab-${tab}`,
            })
          : null,
        scope === 'discover' && tab !== 'git' && data && !data.corrupt
          ? h(
              'div',
              {
                id: 'waycraft-discover-panel',
                role: 'tabpanel',
                'aria-labelledby': `waycraft-discover-tab-${tab}`,
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
        importing
          ? h(
              CatalogDialog,
              { label: t('importSkills'), onClose: () => setImporting(false) },
              h(
                'div',
                {
                  'data-waycraft-import': true,
                  className: 'waycraft-skills-panel',
                },
                h('p', null, t('importHint')),
                h(
                  'ul',
                  {
                    className: 'waycraft-skills-reqs',
                    'aria-label': t('importReqTitle'),
                  },
                  ...['importReq1', 'importReq2', 'importReq3'].map((k) =>
                    h('li', { key: k }, t(k)),
                  ),
                ),
                ...destPick(),
                field(t('importPath'), importPath, (value: string) => {
                  setImportPath(value);
                  setImportFiles([]);
                  setImportResult(null);
                }),
                h(
                  'div',
                  {
                    className: 'waycraft-skills-drop',
                    'data-drag': importDrag ? 'over' : undefined,
                    role: 'button',
                    tabIndex: 0,
                    'aria-label': `${t('importDropTitle')}. ${t('importDropHint')}`,
                    onClick: () => fileInput.current?.click?.(),
                    onKeyDown: (event: any) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault?.();
                        fileInput.current?.click?.();
                      }
                    },
                    onDragEnter: (event: any) => {
                      event.preventDefault?.();
                      setImportDrag(true);
                    },
                    onDragOver: (event: any) => {
                      event.preventDefault?.();
                      setImportDrag(true);
                    },
                    onDragLeave: () => setImportDrag(false),
                    onDrop: (event: any) => {
                      event.preventDefault?.();
                      void dropItems(event.dataTransfer);
                    },
                  },
                  h('strong', null, t('importDropTitle')),
                  h('span', null, t('importDropHint')),
                ),
                h(
                  'div',
                  { className: 'waycraft-skills-actions' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'waycraft-skills-link',
                      onClick: () => dirInput.current?.click?.(),
                    },
                    t('importChooseFolder'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'waycraft-skills-link',
                      onClick: () => fileInput.current?.click?.(),
                    },
                    t('importChooseFile'),
                  ),
                ),
                h('input', {
                  type: 'file',
                  ref: fileInput,
                  multiple: true,
                  accept: '.zip,.md',
                  className: 'waycraft-skills-sr',
                  'aria-label': t('uploadFiles'),
                  onChange: (event: any) => {
                    setImportFiles(Array.from(event.target.files ?? []));
                    setImportMsg('');
                    setImportResult(null);
                  },
                }),
                h('input', {
                  type: 'file',
                  ref: dirInput,
                  multiple: true,
                  webkitdirectory: '',
                  className: 'waycraft-skills-sr',
                  'aria-label': t('uploadFolder'),
                  onChange: (event: any) => {
                    setImportFiles(Array.from(event.target.files ?? []));
                    setImportMsg('');
                    setImportResult(null);
                  },
                }),
                importMsg
                  ? h(
                      'p',
                      { role: 'status', className: 'waycraft-skills-helper' },
                      importMsg,
                    )
                  : null,
                importFiles.length
                  ? h(
                      'p',
                      {
                        role: 'status',
                        className: 'waycraft-skills-helper',
                        'data-waycraft-import-chosen': importFiles.length,
                      },
                      t('importChosen').replace(
                        '{count}',
                        String(importFiles.length),
                      ),
                      ' ',
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'waycraft-skills-link',
                          onClick: () => {
                            setImportFiles([]);
                            setImportMsg('');
                            if (fileInput.current) fileInput.current.value = '';
                            if (dirInput.current) dirInput.current.value = '';
                          },
                        },
                        t('importClear'),
                      ),
                    )
                  : null,
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
                  'div',
                  { className: 'waycraft-skills-dialog-footer' },
                  h(
                    'button',
                    {
                      disabled: importBusy || !importPath || !importConflict,
                      'aria-busy': importBusy,
                      onClick: () => runImport(true),
                    },
                    t('previewImport'),
                  ),
                  h(
                    'button',
                    {
                      className: 'waycraft-skills-primary',
                      disabled:
                        importBusy ||
                        !importConflict ||
                        (!importPath && !importFiles.length),
                      'aria-busy': importBusy,
                      onClick: () => runImport(false),
                    },
                    t('importNow'),
                  ),
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
              ),
            )
          : null,
        creating
          ? h(
              CatalogDialog,
              { label: t('create'), onClose: () => setCreating(false) },
              h(
                'form',
                {
                  className: 'waycraft-skills-form',
                  onSubmit: (event: any) => {
                    event.preventDefault();
                    if (
                      switching ||
                      data?.corrupt ||
                      (scope === 'project' && !project) ||
                      !validDestination(data, createSource)
                    )
                      return;
                    void destMutate(
                      {
                        action: 'create',
                        ...destRequest(),
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
                ...destPick(),
                labeled(
                  t('skillName'),
                  field(t('skillName'), createName, setCreateName),
                ),
                labeled(
                  t('skillDescription'),
                  field(
                    t('skillDescription'),
                    createDescription,
                    setCreateDescription,
                  ),
                ),
                labeled(
                  t('skillBody'),
                  h('textarea', {
                    className: 'waycraft-skills-textarea',
                    'aria-label': t('skillBody'),
                    value: createBody,
                    maxLength: 262144,
                    onChange: (event: any) => setCreateBody(event.target.value),
                  }),
                ),
                h(
                  'p',
                  { className: 'waycraft-skills-helper' },
                  t('createFootnote'),
                ),
                h(
                  'div',
                  { className: 'waycraft-skills-dialog-footer' },
                  h(
                    'button',
                    { type: 'button', onClick: () => setCreating(false) },
                    t('cancel'),
                  ),
                  h(
                    'button',
                    {
                      type: 'submit',
                      className: 'waycraft-skills-primary',
                      disabled: !createName.trim() || !createDescription.trim(),
                    },
                    t('create'),
                  ),
                ),
              ),
            )
          : null,
        inProject
          ? h('p', { className: 'waycraft-skills-notice' }, t('projectHint'))
          : null,
        notice && !foldersOpen
          ? h(
              'p',
              { role: 'status', className: 'waycraft-skills-notice' },
              notice,
            )
          : null,
        error
          ? h(
              'div',
              { role: 'alert', className: 'waycraft-skills-alert' },
              t('error'),
              h(
                'button',
                {
                  onClick: () =>
                    call({ action: 'reload' }).then((value: any) => {
                      setData(value);
                      setError(false);
                    }, load),
                },
                t('retry'),
              ),
            )
          : !data || switching
            ? h(
                'p',
                { role: 'status', className: 'waycraft-skills-loading' },
                t('loading'),
              )
            : h(
                React.Fragment,
                null,
                scope === 'global' || (inProject && data.project?.available)
                  ? h(
                      'div',
                      {
                        'data-waycraft-skills-stats': true,
                        className: 'waycraft-skills-stats',
                        role: 'group',
                        'aria-label': t('statsAria'),
                      },
                      stat(totals.total, 'statSkill', 'statSkills'),
                      stat(totals.enabled, 'statEnabled', 'statEnabled'),
                      stat(totals.disabled, 'statDisabled', 'statDisabled'),
                      stat(totals.invalid, 'statDiagnostic', 'statDiagnostics'),
                    )
                  : null,
                regionOf(''),
                foldersOpen ? foldersDialog() : null,
                inProject && data.project && !data.project.available
                  ? h(
                      'p',
                      { role: 'alert' },
                      `${data.project.name}: ${t(`code.${data.project.code}`)}`,
                    )
                  : null,
                ...visibleSources
                  .filter((x: any) => !source || x.id === source)
                  .map((x: any) =>
                    h(
                      'details',
                      {
                        key: x.id,
                        open:
                          filtering || inProject || !!orgOpen['src:' + x.id],
                        onToggle: (e: any) => {
                          const open = !!e.currentTarget?.open;
                          if (!!orgOpen['src:' + x.id] !== open)
                            setOrgOpen({ ...orgOpen, ['src:' + x.id]: open });
                        },
                        className: 'waycraft-skills-source',
                        'data-off': x.enabled === false ? true : undefined,
                        dir: isArabic() ? 'rtl' : undefined,
                      },
                      h(
                        'summary',
                        null,
                        h(SkillsNavIcon, {
                          size: 16,
                          className: 'waycraft-skills-source-icon',
                        }),
                        h(
                          'span',
                          { className: 'waycraft-skills-source-name' },
                          sourceLabel(x),
                        ),
                        h(
                          'span',
                          { className: 'waycraft-skills-count' },
                          h(
                            'bdi',
                            null,
                            String(
                              view.copies.filter((c: any) => c.source === x.id)
                                .length,
                            ),
                          ),
                          ' ',
                          t(
                            view.copies.filter((c: any) => c.source === x.id)
                              .length === 1
                              ? 'statSkill'
                              : 'statSkills',
                          ),
                        ),
                        sourceProblems(x.id)
                          ? h(
                              'span',
                              {
                                className:
                                  'waycraft-skills-badge waycraft-skills-badge-warn',
                                'data-waycraft-source-problems': true,
                                title: t('sourceProblems'),
                                onClick: (event: any) => {
                                  // The badge sits inside <summary>: reveal the region instead of just toggling the card.
                                  event.preventDefault?.();
                                  revealProblems(x.id);
                                },
                              },
                              severityIcon('error', {
                                className: 'waycraft-skills-icon',
                                'data-waycraft-skills-icon': 'error',
                              }),
                              h('bdi', null, String(sourceProblems(x.id))),
                              ' ',
                              t('sourceProblems'),
                            )
                          : null,
                        h(
                          'span',
                          {
                            className:
                              'waycraft-skills-path waycraft-skills-source-path',
                          },
                          h('bdi', { dir: 'ltr' }, x.path),
                        ),
                        x.custom
                          ? h(
                              'span',
                              { className: 'waycraft-skills-badge' },
                              t('customTag'),
                            )
                          : null,
                        data.corrupt || inProject
                          ? null
                          : (() => {
                              const writable =
                                !x.readonly && !!validDestination(data, x.id);
                              // The host only accepts user-dsh, user-agents and a registered project's DSH folder
                              // as create destinations (src/skills.ts createSkill → create-readonly). A missing
                              // folder is NOT a blocker: the host creates it. Say which case applies.
                              const blockedKey = writable
                                ? null
                                : x.custom
                                  ? 'createBlockedCustom'
                                  : x.readonly
                                    ? 'createHereBlocked'
                                    : 'createBlockedTool';
                              const label = `${t('createHere')}: ${sourceLabel(x)}`;
                              return h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'waycraft-skills-icon-btn',
                                  'aria-label': label,
                                  title: blockedKey
                                    ? t(blockedKey)
                                    : t('createHere'),
                                  disabled: !writable,
                                  onClick: () => {
                                    setCreateSource(x.id);
                                    setCreating(true);
                                  },
                                },
                                icon(ICONS.filePlus),
                              );
                            })(),
                        data.corrupt
                          ? null
                          : h(
                              'button',
                              {
                                type: 'button',
                                className: 'waycraft-skills-icon-btn',
                                'aria-label': `${t('addCategoryHere')}: ${sourceLabel(x)}`,
                                title: t('newCategory'),
                                onClick: () => setCatDialog(x.id),
                              },
                              icon(ICONS.folderPlus),
                            ),
                        x.custom || x.overridable
                          ? h(
                              'button',
                              {
                                type: 'button',
                                className: 'waycraft-skills-icon-btn',
                                'aria-label': `${t('editFolder')}: ${sourceLabel(x)}`,
                                title: t('editFolder'),
                                disabled: data.corrupt,
                                onClick: () => {
                                  setOrgOpen({
                                    ...orgOpen,
                                    ['src:' + x.id]: true,
                                  });
                                  if (x.custom)
                                    setEditing({
                                      id: x.id,
                                      label: x.label ?? '',
                                      group: x.group ?? '',
                                      path: x.path,
                                    });
                                  else setRootEdit({ id: x.id, path: x.path });
                                },
                              },
                              icon(ICONS.folder),
                            )
                          : null,
                        x.readonly
                          ? null
                          : switchControl({
                              checked: x.enabled !== false,
                              label: `${t('toggleSource')} ${sourceLabel(x)}`,
                              title: `${t('toggleSource')} ${sourceLabel(x)}`,
                              onToggle: () =>
                                toggle('source', x.id, x.enabled === false),
                            }),
                        h('span', {
                          className: 'waycraft-skills-chev',
                          'aria-hidden': true,
                        }),
                      ),
                      h(
                        'div',
                        { className: 'waycraft-skills-source-body' },
                        regionOf(x.id),
                        h(
                          'div',
                          { className: 'waycraft-skills-source-meta' },
                          h(
                            'p',
                            { className: 'waycraft-skills-path' },
                            x.group ? `${x.group} · ` : null,
                            h('bdi', { dir: 'ltr' }, x.path),
                          ),
                          x.readonly
                            ? h(
                                'p',
                                { className: 'waycraft-skills-notice' },
                                t('readOnlySource'),
                              )
                            : null,
                        ),
                        !inProject &&
                          !data.corrupt &&
                          !(!x.readonly && validDestination(data, x.id))
                          ? h(
                              'p',
                              {
                                className: 'waycraft-skills-notice',
                                'data-waycraft-create-blocked': x.id,
                              },
                              t(
                                x.custom
                                  ? 'createBlockedCustom'
                                  : x.readonly
                                    ? 'createHereBlocked'
                                    : 'createBlockedTool',
                              ),
                            )
                          : null,
                        x.custom ? customControls(x) : rootControls(x),
                        ...sourceRows(x),
                      ),
                    ),
                  ),
                data.corrupt
                  ? h(
                      'div',
                      { role: 'alert', className: 'waycraft-skills-alert' },
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
                copies.length || (scope !== 'global' && scope !== 'project')
                  ? null
                  : h('p', { className: 'waycraft-skills-empty' }, t('empty')),
              ),
        catDialog ? categoryDialogView(catDialog) : null,
        ...categoryRowDialogs(),
        noteDialogView(),
        detailError && !detail ? h('p', { role: 'alert' }, t('error')) : null,
        detail
          ? h(
              CatalogDialog,
              {
                label: t('details'),
                wide: true,
                onClose: () => setDetail(null),
              },
              h('h3', null, detail.name),
              h('p', null, h('bdi', { dir: 'ltr' }, detail.path)),
              detailError
                ? h(
                    'p',
                    { role: 'alert', className: 'waycraft-skills-field-error' },
                    t('error'),
                  )
                : null,
              h(
                'p',
                {
                  role: 'status',
                  'aria-live': 'polite',
                  className: 'waycraft-skills-helper',
                },
                copiedDetail ? t('copied') : '',
              ),
              h(
                'button',
                {
                  onClick: () =>
                    copyText(detail.content).then(
                      () => {
                        setDetailError(false);
                        setCopiedDetail(true);
                        if (copiedTimer.current)
                          clearTimeout(copiedTimer.current);
                        copiedTimer.current = setTimeout(
                          () => setCopiedDetail(false),
                          2000,
                        );
                      },
                      () => setDetailError(true),
                    ),
                },
                t('copyText'),
              ),
              h(
                'button',
                {
                  className:
                    'waycraft-skills-primary waycraft-skills-dialog-close',
                  onClick: () => setDetail(null),
                },
                t('close'),
              ),
              h(
                'p',
                null,
                `${t('modelInvocation')}: ${detail.author?.modelInvocable ? t('allowed') : t('denied')} · ${t('userInvocation')}: ${detail.author?.userInvocable ? t('allowed') : t('denied')}`,
              ),
              detail.shadowedBy
                ? h('p', null, `${t('shadowedBy')}: ${detail.shadowedBy}`)
                : null,
              detail.description
                ? h(
                    'p',
                    { className: 'waycraft-skills-row-desc-full' },
                    detail.description,
                  )
                : null,
              ...(detail.diagnostics ?? []).map((x: any, i: number) =>
                h(
                  'p',
                  {
                    key: `${x.code}:${i}`,
                    'data-waycraft-diag-level': severityOf(x),
                  },
                  severityOf(x) === 'note' && x.code === 'linked-outside-root'
                    ? t('linkedReadOnly')
                    : diagnosticText(x),
                ),
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
          'data-waycraft-skills-placement': true,
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
    // Skill-list card with sparkle (16x16 outline), adapted from dsh-skills-manager
    // v1.2.29 src/settings-nav-icon.ts (Apache-2.0); see src/PROVENANCE.md.
    const SKILL_ICON_PATHS = [
      'M12.5113 15.4067C12.4395 15.6249 12.1308 15.6249 12.059 15.4067L11.643 14.1416C11.454 13.567 11.0033 13.1164 10.4288 12.9274L9.16369 12.5113C8.94544 12.4395 8.94544 12.1308 9.16369 12.059L10.4288 11.643C11.0033 11.454 11.454 11.0033 11.643 10.4288L12.059 9.16369C12.1308 8.94544 12.4395 8.94544 12.5113 9.16369L12.9274 10.4288C13.1164 11.0033 13.567 11.454 14.1416 11.643L15.4067 12.059C15.6249 12.1308 15.6249 12.4395 15.4067 12.5113L14.1416 12.9274C13.567 13.1164 13.1164 13.567 12.9274 14.1416L12.5113 15.4067Z',
      'M9.02246 0.546878C9.9822 0.546878 10.7564 0.545403 11.374 0.612307C12.0042 0.680586 12.5515 0.826244 13.0273 1.17188C13.3052 1.37376 13.5501 1.61868 13.752 1.89649C14.0975 2.37225 14.2432 2.91984 14.3115 3.54981C14.3784 4.16727 14.377 4.94206 14.377 5.90137V8.51367C13.9611 8.29533 13.5071 8.13985 13.0273 8.06055V5.90137C13.0273 4.9121 13.0259 4.22322 12.9688 3.69532C12.9129 3.18044 12.8098 2.89782 12.6592 2.69043C12.5406 2.52724 12.3966 2.38326 12.2334 2.26465C12.026 2.11404 11.7437 2.0109 11.2285 1.95508C10.7005 1.89789 10.0122 1.89649 9.02246 1.89649H6.55371C5.56395 1.89649 4.87569 1.89787 4.34766 1.95508C3.83242 2.01092 3.55022 2.11398 3.34278 2.26465C3.17953 2.38329 3.03564 2.52719 2.91699 2.69043C2.76642 2.89782 2.66325 3.18042 2.60742 3.69532C2.55027 4.22322 2.54883 4.9121 2.54883 5.90137V10.0986C2.54883 11.0878 2.55031 11.7768 2.60742 12.3047C2.66326 12.8196 2.76642 13.1032 2.91699 13.3105C3.03558 13.4736 3.17966 13.6178 3.34278 13.7363C3.5502 13.8869 3.83265 13.9901 4.34766 14.0459C4.87568 14.1031 5.56398 14.1035 6.55371 14.1035H8.08399C8.27443 14.6025 8.55077 15.0585 8.89551 15.4541H6.55371C5.59402 15.4541 4.81976 15.4546 4.20215 15.3877C3.57204 15.3194 3.02468 15.1738 2.54883 14.8281C2.27111 14.6263 2.02606 14.3813 1.82422 14.1035C1.47883 13.6278 1.33293 13.08 1.26465 12.4502C1.19783 11.8327 1.19922 11.0579 1.19922 10.0986V5.90137C1.19922 4.94206 1.1978 4.16727 1.26465 3.54981C1.33293 2.91984 1.47883 2.37225 1.82422 1.89649C2.02606 1.61868 2.27111 1.37376 2.54883 1.17188C3.02468 0.826244 3.57204 0.680586 4.20215 0.612307C4.81976 0.545403 5.59402 0.546878 6.55371 0.546878H9.02246Z',
    ];
    const SkillsNavIcon = (props: any) =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 16 16',
          width: props?.size ?? 16,
          height: props?.size ?? 16,
          fill: 'currentColor',
          'aria-hidden': true,
          className: props?.className,
        },
        ...SKILL_ICON_PATHS.map((d) => h('path', { key: d.slice(0, 12), d })),
      );
    const sidebarIcon = () => h(SkillsNavIcon);
    effect(() => {
      let offConfig: any,
        offSettings: any,
        offSettingsIcon: any,
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
                id: 'waycraft-skills',
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
        // Dedicated nav icon: declared through inject so hosts without the slot never throw.
        if (inSettings() && !offSettingsIcon) {
          try {
            if (typeof ctx.slots?.inject === 'function')
              offSettingsIcon = ctx.slots.inject('settings.section.icon', () =>
                ctx.slots.register(
                  {
                    name: 'settings.section.icon',
                    id: 'waycraft-skills',
                    locale: 'waycraft.skills',
                  },
                  SkillsNavIcon,
                ),
              );
          } catch {
            // Safe: the settings-nav icon is cosmetic; the section works without it.
          }
        } else if (!inSettings() && offSettingsIcon) {
          try {
            offSettingsIcon();
          } catch {
            // Safe: removing a cosmetic icon registration that may already be gone.
          }
          offSettingsIcon = undefined;
        }
        if (inSidebar() && !offSidebar) {
          offMain = ctx.slots.register(
            {
              name: 'main',
              key: 'waycraft-skills',
              locale: 'waycraft.skills',
              inject: () => ({}),
            },
            () => h(Section),
          );
          offSidebar = ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'waycraft-skills',
              order: 92,
              label: () => t('title'),
              locale: 'waycraft.skills',
            },
            sidebarIcon,
          );
          mapLegacyPanel();
        } else if (!inSidebar() && offSidebar) {
          // Leaving the sidebar must not strand the user on a vanished panel.
          try {
            if (
              layout?.panelInfo?.getSnapshot?.().activePanelId ===
              'waycraft-skills'
            )
              layout.selectPanel?.(null);
          } catch {
            // Safe: closing a panel that the layout may have already closed or replaced.
          }
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
      // Saved panel state from before the rename: map a legacy active panel id to the new id.
      const mapLegacyPanel = () => {
        try {
          const active = layout?.panelInfo?.getSnapshot?.().activePanelId;
          const mapped =
            typeof active === 'string' ? LEGACY_PANEL_IDS[active] : undefined;
          if (mapped !== undefined) layout.selectPanel?.(mapped);
        } catch {
          // Safe: a stale saved panel id is left as is; the user can pick the panel again.
        }
      };
      void ctx.inject?.(['layout'], (injected: any) => {
        layout = injected?.layout ?? injected;
        mapLegacyPanel();
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
                    key: 'waycraft-skills',
                    locale: 'waycraft.skills',
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
        try {
          offSettingsIcon?.();
        } catch {
          // Safe: disposal; the host may have torn the registration down first.
        }
        offMain?.();
        offSidebar?.();
      };
    }, 'waycraft-skills presence');
  }
}
