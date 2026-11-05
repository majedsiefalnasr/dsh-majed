const majedSubscriptionsFactory = (require) => {
var module = { exports: {} }; var exports = module.exports;
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/skills-browser.ts
function applySkills(root) {
	const fail = (error) => console.error("dsh-majed: Skill manager setup failed", error);
	try {
		Promise.resolve(root.inject(["slots", "locale"], (ctx) => {
			try {
				setupSkills(ctx, fail);
			} catch (error) {
				fail(error);
			}
		})).catch(fail);
	} catch (error) {
		fail(error);
	}
}
function setupSkills(ctx, fail) {
	{
		const effect = (run, label) => {
			const result = ctx.effect(run, label);
			Promise.resolve(result).catch(fail);
			return result;
		};
		const React = require("react");
		const h = React.createElement;
		const dictionaries = {
			en: {
				trash: "Trash",
				moveTrash: "Move to Trash",
				restoreTrash: "Restore original",
				deleteTrash: "Delete permanently",
				confirmTrash: "Confirm permanent deletion",
				trashWarning: "This permanently deletes the recoverable files. This cannot be undone.",
				trashOrigin: "Original location",
				trashEmpty: "Trash is empty",
				"code.trash-conflict": "The original location already contains a skill",
				"code.trash-readonly": "This source is read-only",
				"code.trash-unavailable": "Trash storage is unavailable; the skill catalog is still available",
				"code.trash-linked": "Linked or special write targets are not allowed",
				"code.trash-failed": "The operation failed; check the original and Trash before retrying",
				"code.trash-cancelled": "The operation was cancelled",
				"code.trash-limit": "The skill exceeds safe processing limits",
				"code.trash-overflow": "Trash has too many entries to list safely; organization data is kept",
				"code.trash-skipped": "Some Trash records are unreadable; organization data is kept",
				"code.trash-invalid": "The original location is no longer valid",
				"code.trash-missing": "This Trash entry no longer exists",
				"code.trash-confirm": "Confirm permanent deletion first",
				"code.trash-cleanup": "Operation completed; remaining files need cleanup",
				"code.trash-recovery": "Original removal failed; the complete Trash copy was retained for recovery",
				"code.trash-state": "Files deleted, but annotation cleanup failed; reload state before retrying",
				repositories: "Repositories",
				scopeDiscover: "Discover Skills",
				tabGit: "Git Repos",
				catSourceLabel: "Discover sources",
				catSourceClawhub: "ClawHub",
				catSourceSkillsh: "skills.sh",
				catSearchClawhub: "Search ClawHub",
				catSearchSkillsh: "Search skills.sh",
				catSearch: "Search",
				catPopularNote: "ClawHub download ranking · Up to 100; sort only displayed items",
				catSkillshHint: "skills.sh offers search only; enter a query to find skills.",
				catLoading: "Loading…",
				catLoadingMore: "Loading more…",
				catLoadMore: "Load 10 more",
				catEmpty: "No skills to show",
				catSearchEmpty: "No skills match this search",
				catLoadError: "Failed to load the catalog. Check your connection and retry.",
				catRetry: "Retry",
				catDownloads: "downloads",
				catInstalls: "installs",
				catStars: "stars",
				catSort: "Sort displayed items",
				catSortDownloads: "Downloads (ranking)",
				catSortInstalls: "Installs (high to low)",
				catSortName: "Name (A–Z)",
				catStatusFilter: "Catalog status",
				catStatusAll: "All statuses",
				catStatusAvailable: "Not installed",
				catStatusInstalled: "Installed",
				catInstalled: "Installed",
				catDetails: "Catalog details",
				catInstall: "Install from catalog",
				catInstallElsewhere: "Install elsewhere",
				catUninstall: "Uninstall catalog copy",
				catForget: "Forget catalog record",
				catReassociate: "Adopt identical existing copy",
				catCopy: "Copy SKILL.md",
				catCopied: "Copied",
				catCopyFailed: "Copy failed",
				catClose: "Close",
				catOrigin: "Origin",
				catDetailLoading: "Loading details…",
				catInstallTitle: "Install from catalog",
				catInstallConfirm: "Confirm install",
				catInstallDone: "Installed from catalog",
				catCopies: "Installed copies",
				catUninstallTitle: "Uninstall catalog copy",
				catUninstallBody: "This moves \"{name}\" from {where} to Trash. You can restore it from Trash.",
				catForgetTitle: "Forget catalog record",
				catForgetBody: "This removes the catalog record for \"{name}\" only. No files are changed or deleted.",
				catSharedWarning: "This copy is in the shared agents folder. Other tools that read this folder will stop seeing it.",
				catConfirmUninstall: "Move to Trash",
				catConfirmForget: "Forget record",
				"catHint.trashed": "A copy is in Trash. Restore it from Trash, or install into a different destination.",
				"catHint.missing": "Its Trash entry no longer exists. Forget the record, then install again.",
				"catHint.invalid-root": "The copy location is unavailable. Forget the record, then install again.",
				"catStatus.installed": "Installed",
				"catStatus.modified": "Modified locally",
				"catStatus.missing": "Missing from disk",
				"catStatus.trashed": "In Trash",
				"catStatus.invalid-root": "Location unavailable",
				"code.catalog-query": "The search or paging request is not valid",
				"code.catalog-upstream": "The catalog could not be reached",
				"code.catalog-response": "The catalog returned an unusable response",
				"code.catalog-identity": "This catalog skill identity is not valid",
				"code.catalog-package": "The catalog package is not a valid skill",
				"code.catalog-confirm": "Confirm the installation first",
				"code.catalog-action": "This catalog action is not supported",
				"code.catalog-failed": "The catalog operation failed",
				repoAddTitle: "Subscribe to a repository",
				repoUrl: "Repository (owner/name, https URL or absolute folder)",
				repoRef: "Branch or tag (optional)",
				repoSubdirectory: "Subdirectory (optional)",
				repoAdd: "Subscribe",
				repoRefresh: "Refresh",
				repoRefreshAll: "Refresh all",
				repoRefreshing: "Refreshing…",
				repoUnsubscribe: "Unsubscribe (keeps installed skills)",
				repoFilter: "Filter repository skills",
				repoStatusFilter: "Filter by status",
				repoRepoFilter: "Filter by repository",
				repoAllStatuses: "All statuses",
				repoAllRepositories: "All repositories",
				repoConfirmUnsubscribe: "Unsubscribe from this repository? Installed skills and their provenance stay; the saved snapshot is removed.",
				repoConfirmUnsubscribeYes: "Unsubscribe",
				repoForget: "Forget record (deletes nothing)",
				repoConfirmForget: "Forget this installation record? Only the tracking record is removed; no files are read, moved or deleted.",
				repoConfirmForgetYes: "Forget record",
				"repoStatus.update": "Update available",
				repoUpdatePreview: "Preview update",
				repoRollbackPreview: "Preview rollback to previous version",
				repoApplyUpdate: "Apply update",
				repoApplyRollback: "Apply rollback",
				repoPreviewTitle: "Changes to the installed copy",
				repoNoChanges: "No file changes",
				repoLocalModified: "This copy was edited locally. Applying replaces those edits; the current copy is kept as the previous version.",
				repoOverwrite: "Replace local edits",
				repoApplying: "Applying…",
				repoUpdated: "Updated {name}. The previous version is kept for rollback.",
				repoRolledBack: "Rolled back {name} to the previous version.",
				repoTrackedHint: "Only file contents and the executable bit are tracked; empty folders and other file attributes are not.",
				repoUpstream: "Upstream",
				"repoChange.added": "Added",
				"repoChange.removed": "Removed",
				"repoChange.modified": "Modified",
				"code.repo-preview-stale": "The copy or the repository changed after this preview; preview again",
				"code.repo-local-modified": "The copy has local edits; confirm replacing them first",
				"code.repo-local-unsafe": "The installed copy contains links, special files or exceeds safe limits",
				"code.repo-up-to-date": "This copy already matches the repository",
				"code.repo-no-backup": "There is no previous version to roll back to",
				"code.repo-backup-changed": "The saved previous version changed; rollback refused",
				"code.repo-skill-renamed": "The skill was renamed upstream; the installed copy is unchanged",
				"code.repo-recovery": "Automatic recovery failed; the original files are kept at {recovery}. Do not repeat the operation",
				"code.repo-invalid-root": "The destination changed since install; the copy is not touched. Forget the record instead.",
				"code.repo-root-valid": "The destination is unchanged; use Uninstall to Trash",
				repoConflictIn: "Name already used in",
				repoEmpty: "No repository subscriptions",
				repoNoSkills: "No skills found in this snapshot",
				repoInstall: "Install",
				repoUninstall: "Uninstall to Trash",
				repoDestination: "Install into",
				repoTracked: "Tracked installations",
				repoSnapshot: "Snapshot",
				repoLastError: "Last refresh failed; showing the previous snapshot",
				repoBulk: "Refreshed {done} of {total}; {failed} failed",
				repoFromSource: "Source",
				repoNoInstalls: "No tracked installations",
				"repoKind.git-commit": "Git commit",
				"repoKind.archive-sha256": "Archive fingerprint (not a Git commit)",
				"repoKind.folder-sha256": "Folder content fingerprint",
				"repoStatus.available": "Available",
				"repoStatus.installed": "Installed",
				"repoStatus.modified": "Modified locally",
				"repoStatus.missing": "Missing",
				"repoStatus.conflict": "Name conflict",
				"repoStatus.invalid": "Invalid",
				"repoStatus.trashed": "In Trash",
				"repoStatus.invalid-root": "Destination changed",
				"code.repo-url": "Repository address is not supported (use owner/name, an https/http URL without credentials, or an absolute folder)",
				"code.repo-ref": "Branch or tag name is not valid",
				"code.repo-subdirectory": "Subdirectory is not valid or does not exist",
				"code.repo-host": "Local, private and link-local network hosts are not allowed",
				"code.repo-local": "The local folder is missing or is not a usable folder",
				"code.repo-git": "Git could not read this repository",
				"code.repo-git-missing": "Git is not installed or not on PATH",
				"code.repo-network": "The repository could not be reached (redirects are not followed)",
				"code.repo-notfound": "Repository, branch or tag was not found",
				"code.repo-auth": "Authentication is required; credentials are not supported",
				"code.repo-timeout": "The repository operation timed out",
				"code.repo-limit": "The repository exceeds safe size, file-count or depth limits",
				"code.repo-archive": "The repository archive is invalid or unsafe",
				"code.repo-cancelled": "The operation was cancelled",
				"code.repo-duplicate": "This repository is already subscribed",
				"code.repo-busy": "This repository is already being refreshed",
				"code.repo-not-found": "This subscription no longer exists",
				"code.repo-stale": "The repository changed; refresh the preview and try again",
				"code.repo-conflict": "A skill with this name already exists; nothing was overwritten",
				"code.repo-skill-missing": "This skill is not in the current snapshot",
				"code.repo-skill-invalid": "This skill is invalid and cannot be installed",
				"code.repo-skill-limit": "This skill exceeds safe size limits",
				"code.repo-skill-metadata": "This skill has invalid metadata",
				"code.repo-snapshot-changed": "The stored snapshot no longer matches; refresh the repository",
				"code.repo-not-installed": "This tracked installation no longer exists",
				"code.repo-trashed": "This installation is already in Trash",
				"code.repo-missing": "The installed copy is missing from disk",
				"code.repo-state-invalid": "Repository state is unreadable and was left untouched",
				"code.repo-state-write": "Repository state could not be saved",
				"code.repo-install-failed": "The skill could not be installed",
				"code.repo-failed": "The repository operation failed",
				importSkills: "Import skills",
				importPath: "Local absolute path",
				previewImport: "Preview local import",
				importNow: "Import now",
				uploadFiles: "ZIP or Markdown files",
				uploadFolder: "Skill folder",
				importConflict: "Existing skills",
				skipImport: "Skip existing",
				overwriteImport: "Overwrite existing (replace all bundled files)",
				importResult: "Import results",
				pendingImport: "Ready",
				conflictsImport: "Conflicts",
				importedImport: "Imported",
				skippedImport: "Skipped",
				failedImport: "Failed",
				warningsImport: "Cleanup warnings",
				inputsImport: "Archives processed",
				"code.import-cleanup": "Imported successfully; backup cleanup failed. Check the remaining backup path; its contents may be incomplete",
				importHint: "Copies original files. Select skip or overwrite explicitly. Local preview never writes.",
				create: "Create skill",
				skillName: "Skill name",
				skillDescription: "Routing description",
				skillBody: "Markdown instructions",
				destination: "Creation destination",
				created: "Skill created",
				"code.create-invalid": "Enter a valid name, description and instructions",
				"code.create-conflict": "A skill with this name already exists",
				"code.create-readonly": "This source is read-only",
				"code.create-linked-root": "Linked writable folders are not allowed",
				"code.create-too-large": "Skill content exceeds the size limit",
				"code.create-failed": "Unable to create the skill",
				"code.import-path": "Unsafe import path",
				"code.import-limit": "Import exceeds file, byte, depth or entry limits",
				"code.import-linked": "Linked or special files are not allowed",
				"code.import-empty": "No skill documents found",
				"code.import-metadata": "Skill metadata is invalid",
				"code.import-name": "Skill name is invalid",
				"code.import-duplicate": "Duplicate import paths or names",
				"code.import-encoding": "Invalid upload encoding",
				"code.import-archive": "Invalid or incomplete ZIP archive",
				"code.import-cancelled": "Import cancelled; unpublished changes discarded",
				"code.import-overlap": "Import source overlaps the destination",
				"code.import-conflict": "Choose skip or overwrite explicitly",
				"code.import-failed": "Unable to import this skill",
				"code.import-recovery": "Restoration failed; original backup retained in the destination for recovery",
				title: "Skill manager",
				search: "Search skills",
				all: "All sources",
				any: "All statuses",
				enabled: "Enabled",
				disabled: "Disabled",
				invalid: "Invalid",
				shadowed: "Shadowed",
				retry: "Retry",
				loading: "Loading skills…",
				error: "Unable to load skills",
				details: "Details",
				close: "Close",
				empty: "No matching skills",
				source: "Source",
				toggle: "Toggle",
				diagnostics: "Diagnostics",
				blocked: "Blocked by author",
				copyText: "Copy text",
				copyCopy: "Toggle copy",
				toggleSource: "Toggle source",
				modelInvocation: "Model invocation",
				userInvocation: "User invocation",
				allowed: "Allowed",
				denied: "Denied",
				shadowedBy: "Shadowed by",
				reloadState: "Reload state",
				stateLocked: "Skill state is invalid; changes are locked",
				"diag.discovery-truncated": "Discovery stopped at the safe limit",
				"diag.source-unavailable": "Source unavailable",
				"diag.unreadable-entries": "Some entries could not be read",
				"diag.unreadable-skill": "Skill could not be read",
				"diag.oversized-skill": "Skill exceeds the size limit",
				"diag.empty-skill": "Skill file is empty",
				"diag.invalid-frontmatter": "Invalid frontmatter",
				"diag.invalid-yaml": "Invalid YAML",
				"diag.invalid-metadata": "Invalid metadata",
				"diag.invalid-policy": "Invalid invocation policy",
				"diag.linked-outside-root": "Skill document is linked from outside its source",
				"diag.state-invalid": "Invalid skill state; managed skills are disabled",
				"diag.project-unavailable": "Project unavailable",
				"diag.project-missing": "Project folder is missing",
				"diag.project-unreadable": "Project folder is not readable",
				"diag.project-source-outside": "Project skill folder resolves outside the project",
				"diag.project-source-overlap": "Project skill folder overlaps another source",
				scope: "View",
				scopeGlobal: "Global skills",
				scopeProject: "Project skills",
				project: "Project",
				projectNone: "Select a registered project",
				projectEmpty: "No registered projects yet",
				projectHint: "Project skills are read from the project and switched only for that project",
				readOnlySource: "Project DSH skills have no source switch",
				"code.project-missing": "folder missing",
				"code.project-unreadable": "not readable",
				"code.project-unavailable": "unavailable",
				"code.project-unregistered": "Project is not registered",
				"code.project-mismatch": "The selected project does not match this item",
				"code.project-dsh-source": "Project DSH skills have no source switch",
				"code.root-not-absolute": "Enter an absolute folder path",
				"code.root-too-long": "The folder path is too long",
				"code.root-not-found": "The folder does not exist",
				"code.root-not-directory": "The path is not a folder",
				"code.root-reserved": "This folder is reserved by the Skill manager",
				"code.root-overlap": "This folder overlaps another skill source",
				"code.custom-limit": "The limit of {limit} custom sources is reached",
				"code.custom-label": "The name or group is invalid or too long",
				"code.custom-unknown": "This custom source no longer exists",
				"code.scan-aborted": "The folder preview was cancelled",
				"code.forbidden": "The request was rejected; reload the page and retry",
				"code.unsupported": "The request format is not supported",
				"code.stopping": "The Skill manager is stopping; try again shortly",
				"code.state-invalid": "Skill state is invalid; reload the state before changing sources",
				"diag.registry-unavailable": "The workspace registry is unavailable; project policy may not apply",
				addSourceNamed: "Add source",
				editNamed: "Edit",
				removeNamed: "Remove source",
				confirmNamed: "Confirm removal",
				folders: "Source folders",
				foldersHint: "Preview a folder first; nothing is registered until you add it. Removing a source never deletes files",
				folderPath: "Folder path",
				scanFolder: "Preview folder",
				addFolder: "Add folder",
				addSource: "Add source",
				candidates: "Candidate sources",
				noCandidates: "No skill folders found within two levels",
				candidateRegistered: "Registered",
				candidateConflict: "Overlaps another source",
				skillCount: "skills",
				customBadge: "Custom folder",
				edit: "Edit",
				save: "Save",
				cancel: "Cancel",
				label: "Name",
				group: "Group",
				remove: "Remove source",
				removeNote: "This removes only the source entry. Skill files are not deleted",
				confirmRemove: "Confirm removal",
				added: "Source added",
				registered: "This folder is already a source",
				categories: "Categories",
				categoryName: "Category name",
				addCategory: "Add category",
				uncategorized: "Uncategorized",
				renameCategory: "Rename category",
				deleteCategory: "Delete category",
				confirmDeleteCategory: "Confirm delete category",
				deleteCategoryNote: "Skills in this category become uncategorized. No skill files are changed",
				enableGroup: "Enable group",
				disableGroup: "Disable group",
				enableAll: "Enable all skills",
				disableAll: "Disable all skills",
				selectSkill: "Select skill",
				assignTo: "Assign selected to",
				assignSelected: "Assign selected",
				moveUp: "Move up",
				moveDown: "Move down",
				filterCategory: "Category",
				allCategories: "All categories",
				note: "Note",
				saveNote: "Save note",
				noteHint: "Notes are searchable and never change the skill description",
				noteLimit: "Up to 500 characters",
				selectAll: "Select all skills",
				bulkOverrideNote: "Bulk enable or disable applies to this source only and overrides earlier per-skill choices.",
				"code.invalid-request": "The request was not valid",
				"code.source-unknown": "This source is not available in this view",
				"code.organization-limit": "Too many categories, notes or assignments for this source",
				"code.state-too-large": "The saved organization data is too large; remove some notes or categories",
				placement: "Entry placement",
				placementHint: "Choose where the Skill manager appears: Settings, the sidebar or both",
				placementBoth: "Both",
				placementSidebar: "Sidebar only",
				placementSettings: "Settings only",
				"code.category-name": "Enter a category name of up to 24 characters",
				"code.category-duplicate": "A category with this name already exists",
				"code.category-unknown": "This category no longer exists",
				"code.category-limit": "The limit of {limit} categories is reached",
				"code.skill-unknown": "This skill is not available in this view",
				"code.order-position": "The ordering position is invalid",
				"code.order-target": "The ordering target is in another category",
				"code.note-too-long": "The note is longer than {limit} characters",
				"code.placement-invalid": "The entry placement is invalid"
			},
			ar: {
				trash: "سلة المحذوفات",
				moveTrash: "نقل إلى سلة المحذوفات",
				restoreTrash: "استعادة إلى المصدر",
				deleteTrash: "حذف نهائي",
				confirmTrash: "تأكيد الحذف النهائي",
				trashWarning: "سيتم حذف الملفات القابلة للاستعادة نهائياً. لا يمكن التراجع.",
				trashOrigin: "الموقع الأصلي",
				trashEmpty: "سلة المحذوفات فارغة",
				"code.trash-conflict": "يوجد بالفعل مهارة في الموقع الأصلي",
				"code.trash-readonly": "هذا المصدر للقراءة فقط",
				"code.trash-unavailable": "تخزين سلة المحذوفات غير متاح؛ ما زال كتالوج المهارات متاحًا",
				"code.trash-linked": "لا يُسمح بالكتابة إلى روابط أو ملفات خاصة",
				"code.trash-failed": "فشلت العملية؛ افحص المصدر والسلة قبل المحاولة مجدداً",
				"code.trash-cancelled": "أُلغيت العملية",
				"code.trash-limit": "تتجاوز المهارة حدود المعالجة الآمنة",
				"code.trash-overflow": "عدد عناصر سلة المحذوفات أكبر من أن يُعرض بأمان؛ بيانات التنظيم محفوظة",
				"code.trash-skipped": "بعض سجلات سلة المحذوفات غير قابلة للقراءة؛ بيانات التنظيم محفوظة",
				"code.trash-invalid": "لم يعد الموقع الأصلي صالحاً",
				"code.trash-missing": "لم يعد هذا العنصر في سلة المحذوفات",
				"code.trash-confirm": "أكد الحذف النهائي أولاً",
				"code.trash-cleanup": "اكتملت العملية؛ تحتاج الملفات المتبقية إلى تنظيف",
				"code.trash-recovery": "فشل حذف المصدر؛ حُفظت نسخة كاملة في السلة للاستعادة",
				"code.trash-state": "حُذفت الملفات لكن فشل تنظيف التعليقات؛ أعد تحميل الحالة",
				repositories: "المستودعات",
				scopeDiscover: "اكتشاف المهارات",
				tabGit: "مستودعات Git",
				catSourceLabel: "مصادر الاكتشاف",
				catSourceClawhub: "ClawHub",
				catSourceSkillsh: "skills.sh",
				catSearchClawhub: "ابحث في ClawHub",
				catSearchSkillsh: "ابحث في skills.sh",
				catSearch: "بحث",
				catPopularNote: "ترتيب ClawHub حسب التنزيلات · حتى 100؛ الفرز للعناصر المعروضة فقط",
				catSkillshHint: "يوفّر skills.sh البحث فقط؛ أدخل عبارة بحث للعثور على المهارات.",
				catLoading: "جارٍ التحميل…",
				catLoadingMore: "جارٍ تحميل المزيد…",
				catLoadMore: "تحميل 10 أخرى",
				catEmpty: "لا توجد مهارات للعرض",
				catSearchEmpty: "لا توجد مهارات مطابقة لهذا البحث",
				catLoadError: "تعذر تحميل الفهرس. تحقق من الاتصال وأعد المحاولة.",
				catRetry: "إعادة المحاولة",
				catDownloads: "تنزيل",
				catInstalls: "تثبيت",
				catStars: "نجمة",
				catSort: "فرز العناصر المعروضة",
				catSortDownloads: "التنزيلات (الترتيب)",
				catSortInstalls: "التثبيتات (من الأعلى)",
				catSortName: "الاسم (أ–ي)",
				catStatusFilter: "حالة الفهرس",
				catStatusAll: "كل الحالات",
				catStatusAvailable: "غير مثبتة",
				catStatusInstalled: "مثبتة",
				catInstalled: "مثبتة",
				catDetails: "تفاصيل الفهرس",
				catInstall: "تثبيت من الفهرس",
				catInstallElsewhere: "تثبيت في موضع آخر",
				catUninstall: "إزالة نسخة الفهرس",
				catForget: "نسيان سجل الفهرس",
				catReassociate: "تبنّي النسخة المطابقة الموجودة",
				catCopy: "نسخ SKILL.md",
				catCopied: "تم النسخ",
				catCopyFailed: "فشل النسخ",
				catClose: "إغلاق",
				catOrigin: "المصدر",
				catDetailLoading: "جارٍ تحميل التفاصيل…",
				catInstallTitle: "تثبيت من الفهرس",
				catInstallConfirm: "تأكيد التثبيت",
				catInstallDone: "تم التثبيت من الفهرس",
				catCopies: "النسخ المثبتة",
				catUninstallTitle: "إزالة نسخة الفهرس",
				catUninstallBody: "سيُنقل \"{name}\" من {where} إلى السلة. يمكنك استعادته من السلة.",
				catForgetTitle: "نسيان سجل الفهرس",
				catForgetBody: "سيُزال سجل الفهرس الخاص بـ \"{name}\" فقط. لن تتغير أي ملفات ولن تُحذف.",
				catSharedWarning: "هذه النسخة في مجلد الوكلاء المشترك. ستتوقف الأدوات الأخرى التي تقرأ هذا المجلد عن رؤيتها.",
				catConfirmUninstall: "نقل إلى السلة",
				catConfirmForget: "نسيان السجل",
				"catHint.trashed": "توجد نسخة في السلة. استعدها من السلة أو ثبّت في وجهة مختلفة.",
				"catHint.missing": "لم يعد عنصرها في السلة. انسَ السجل ثم ثبّت مرة أخرى.",
				"catHint.invalid-root": "موضع النسخة غير متاح. انسَ السجل ثم ثبّت مرة أخرى.",
				"catStatus.installed": "مثبتة",
				"catStatus.modified": "معدّلة محلياً",
				"catStatus.missing": "مفقودة من القرص",
				"catStatus.trashed": "في السلة",
				"catStatus.invalid-root": "الموقع غير متاح",
				"code.catalog-query": "طلب البحث أو التصفح غير صالح",
				"code.catalog-upstream": "تعذر الوصول إلى الفهرس",
				"code.catalog-response": "أعاد الفهرس استجابة غير صالحة للاستخدام",
				"code.catalog-identity": "هوية مهارة الفهرس غير صالحة",
				"code.catalog-package": "حزمة الفهرس ليست مهارة صالحة",
				"code.catalog-confirm": "أكّد التثبيت أولاً",
				"code.catalog-action": "إجراء الفهرس هذا غير مدعوم",
				"code.catalog-failed": "فشلت عملية الفهرس",
				repoAddTitle: "الاشتراك في مستودع",
				repoUrl: "المستودع (owner/name أو رابط https أو مجلد مطلق)",
				repoRef: "الفرع أو الوسم (اختياري)",
				repoSubdirectory: "المجلد الفرعي (اختياري)",
				repoAdd: "اشتراك",
				repoRefresh: "تحديث",
				repoRefreshAll: "تحديث الكل",
				repoRefreshing: "جارٍ التحديث…",
				repoUnsubscribe: "إلغاء الاشتراك (تبقى المهارات المثبتة)",
				repoFilter: "تصفية مهارات المستودع",
				repoStatusFilter: "تصفية حسب الحالة",
				repoRepoFilter: "تصفية حسب المستودع",
				repoAllStatuses: "كل الحالات",
				repoAllRepositories: "كل المستودعات",
				repoConfirmUnsubscribe: "إلغاء الاشتراك في هذا المستودع؟ تبقى المهارات المثبتة وسجل مصدرها، وتُحذف اللقطة المحفوظة.",
				repoConfirmUnsubscribeYes: "إلغاء الاشتراك",
				repoForget: "نسيان السجل (لا يحذف شيئاً)",
				repoConfirmForget: "نسيان سجل هذا التثبيت؟ يُزال سجل التتبع فقط؛ لا تُقرأ ملفات ولا تُنقل ولا تُحذف.",
				repoConfirmForgetYes: "نسيان السجل",
				"repoStatus.update": "تحديث متاح",
				repoUpdatePreview: "معاينة التحديث",
				repoRollbackPreview: "معاينة الرجوع إلى النسخة السابقة",
				repoApplyUpdate: "تطبيق التحديث",
				repoApplyRollback: "تطبيق الرجوع",
				repoPreviewTitle: "التغييرات على النسخة المثبتة",
				repoNoChanges: "لا تغييرات في الملفات",
				repoLocalModified: "عُدّلت هذه النسخة محلياً. سيستبدل التطبيق تلك التعديلات وتُحفظ النسخة الحالية كنسخة سابقة.",
				repoOverwrite: "استبدال التعديلات المحلية",
				repoApplying: "جارٍ التطبيق…",
				repoUpdated: "تم تحديث {name}. تُحفظ النسخة السابقة للرجوع إليها.",
				repoRolledBack: "تم الرجوع بـ {name} إلى النسخة السابقة.",
				repoTrackedHint: "يُتتبَّع محتوى الملفات وإذن التنفيذ فقط؛ لا تُتتبَّع المجلدات الفارغة ولا سمات الملفات الأخرى.",
				repoUpstream: "المصدر",
				"repoChange.added": "مضاف",
				"repoChange.removed": "محذوف",
				"repoChange.modified": "معدّل",
				"code.repo-preview-stale": "تغيرت النسخة أو المستودع بعد هذه المعاينة؛ أعد المعاينة",
				"code.repo-local-modified": "للنسخة تعديلات محلية؛ أكّد استبدالها أولاً",
				"code.repo-local-unsafe": "تحتوي النسخة المثبتة على روابط أو ملفات خاصة أو تتجاوز الحدود الآمنة",
				"code.repo-up-to-date": "هذه النسخة مطابقة للمستودع بالفعل",
				"code.repo-no-backup": "لا توجد نسخة سابقة للرجوع إليها",
				"code.repo-backup-changed": "تغيرت النسخة السابقة المحفوظة؛ رُفض الرجوع",
				"code.repo-skill-renamed": "أُعيدت تسمية المهارة في المصدر؛ لم تتغير النسخة المثبتة",
				"code.repo-recovery": "فشل الاسترداد التلقائي؛ الملفات الأصلية محفوظة في {recovery}. لا تكرر العملية",
				"code.repo-invalid-root": "تغيّرت الوجهة منذ التثبيت؛ لا يُمس النسخ. انسَ السجل بدلاً من ذلك.",
				"code.repo-root-valid": "الوجهة لم تتغير؛ استخدم النقل إلى سلة المحذوفات",
				repoConflictIn: "الاسم مستخدم في",
				repoEmpty: "لا توجد اشتراكات مستودعات",
				repoNoSkills: "لا توجد مهارات في هذه اللقطة",
				repoInstall: "تثبيت",
				repoUninstall: "إزالة إلى السلة",
				repoDestination: "التثبيت في",
				repoTracked: "التثبيتات المتتبعة",
				repoSnapshot: "اللقطة",
				repoLastError: "فشل آخر تحديث؛ تُعرض اللقطة السابقة",
				repoBulk: "حُدّث {done} من {total}؛ فشل {failed}",
				repoFromSource: "المصدر",
				repoNoInstalls: "لا توجد تثبيتات متتبعة",
				"repoKind.git-commit": "إيداع Git",
				"repoKind.archive-sha256": "بصمة الأرشيف (ليست إيداع Git)",
				"repoKind.folder-sha256": "بصمة محتوى المجلد",
				"repoStatus.available": "متاحة",
				"repoStatus.installed": "مثبتة",
				"repoStatus.modified": "معدلة محلياً",
				"repoStatus.missing": "مفقودة",
				"repoStatus.conflict": "تعارض اسم",
				"repoStatus.invalid": "غير صالحة",
				"repoStatus.trashed": "في السلة",
				"repoStatus.invalid-root": "تغيّرت الوجهة",
				"code.repo-url": "عنوان المستودع غير مدعوم (استخدم owner/name أو رابط https/http بلا بيانات اعتماد أو مجلداً مطلقاً)",
				"code.repo-ref": "اسم الفرع أو الوسم غير صالح",
				"code.repo-subdirectory": "المجلد الفرعي غير صالح أو غير موجود",
				"code.repo-host": "المضيفات المحلية والخاصة غير مسموحة",
				"code.repo-local": "المجلد المحلي مفقود أو غير صالح",
				"code.repo-git": "تعذرت قراءة المستودع عبر Git",
				"code.repo-git-missing": "Git غير مثبت أو غير موجود في PATH",
				"code.repo-network": "تعذر الوصول إلى المستودع (لا تُتبع إعادة التوجيه)",
				"code.repo-notfound": "لم يُعثر على المستودع أو الفرع أو الوسم",
				"code.repo-auth": "المصادقة مطلوبة؛ بيانات الاعتماد غير مدعومة",
				"code.repo-timeout": "انتهت مهلة عملية المستودع",
				"code.repo-limit": "يتجاوز المستودع حدود الحجم أو عدد الملفات أو العمق الآمنة",
				"code.repo-archive": "أرشيف المستودع غير صالح أو غير آمن",
				"code.repo-cancelled": "أُلغيت العملية",
				"code.repo-duplicate": "هذا المستودع مشترك فيه بالفعل",
				"code.repo-busy": "يجري تحديث هذا المستودع بالفعل",
				"code.repo-not-found": "لم يعد هذا الاشتراك موجوداً",
				"code.repo-stale": "تغير المستودع؛ حدّث المعاينة وأعد المحاولة",
				"code.repo-conflict": "توجد مهارة بهذا الاسم؛ لم يُستبدل شيء",
				"code.repo-skill-missing": "هذه المهارة ليست في اللقطة الحالية",
				"code.repo-skill-invalid": "هذه المهارة غير صالحة ولا يمكن تثبيتها",
				"code.repo-skill-limit": "تتجاوز هذه المهارة حدود الحجم الآمنة",
				"code.repo-skill-metadata": "بيانات هذه المهارة الوصفية غير صالحة",
				"code.repo-snapshot-changed": "لم تعد اللقطة المخزنة مطابقة؛ حدّث المستودع",
				"code.repo-not-installed": "لم يعد هذا التثبيت المتتبع موجوداً",
				"code.repo-trashed": "هذا التثبيت موجود بالفعل في السلة",
				"code.repo-missing": "النسخة المثبتة مفقودة من القرص",
				"code.repo-state-invalid": "حالة المستودعات غير مقروءة وتُركت دون تغيير",
				"code.repo-state-write": "تعذر حفظ حالة المستودعات",
				"code.repo-install-failed": "تعذر تثبيت المهارة",
				"code.repo-failed": "فشلت عملية المستودع",
				importSkills: "استيراد مهارات",
				importPath: "المسار المحلي المطلق",
				previewImport: "معاينة الاستيراد المحلي",
				importNow: "استيراد الآن",
				uploadFiles: "ملفات ZIP أو Markdown",
				uploadFolder: "مجلد مهارة",
				importConflict: "المهارات الموجودة",
				skipImport: "تخطي الموجود",
				overwriteImport: "استبدال الموجود (كل ملفات الحزمة)",
				importResult: "نتائج الاستيراد",
				pendingImport: "جاهزة",
				conflictsImport: "تعارضات",
				importedImport: "مستوردة",
				skippedImport: "متخطاة",
				failedImport: "فاشلة",
				warningsImport: "تحذيرات التنظيف",
				inputsImport: "الأرشيفات المعالجة",
				"code.import-cleanup": "تم الاستيراد بنجاح؛ تعذر تنظيف النسخة الاحتياطية. تحقق من مسار البقايا؛ قد تكون محتوياتها غير مكتملة",
				importHint: "ينسخ الملفات الأصلية. اختر التخطي أو الاستبدال صراحةً. المعاينة المحلية لا تكتب ملفات.",
				create: "إنشاء مهارة",
				skillName: "اسم المهارة",
				skillDescription: "وصف الاستخدام",
				skillBody: "تعليمات Markdown",
				destination: "وجهة الإنشاء",
				created: "تم إنشاء المهارة",
				"code.create-invalid": "أدخل اسمًا ووصفًا وتعليمات صالحة",
				"code.create-conflict": "توجد مهارة بهذا الاسم بالفعل",
				"code.create-readonly": "هذا المصدر للقراءة فقط",
				"code.create-linked-root": "لا يُسمح بمجلدات كتابة مرتبطة",
				"code.create-too-large": "محتوى المهارة يتجاوز الحد المسموح",
				"code.create-failed": "تعذر إنشاء المهارة",
				"code.import-path": "مسار الاستيراد غير آمن",
				"code.import-limit": "يتجاوز الاستيراد حدود الملفات أو الحجم أو العمق أو عدد العناصر",
				"code.import-linked": "لا يُسمح بالملفات المرتبطة أو الخاصة",
				"code.import-empty": "لم يتم العثور على مستندات مهارات",
				"code.import-metadata": "بيانات المهارة غير صالحة",
				"code.import-name": "اسم المهارة غير صالح",
				"code.import-duplicate": "مسارات أو أسماء استيراد مكررة",
				"code.import-encoding": "ترميز الرفع غير صالح",
				"code.import-archive": "أرشيف ZIP غير صالح أو غير مكتمل",
				"code.import-cancelled": "تم إلغاء الاستيراد والتخلص من التغييرات غير المنشورة",
				"code.import-overlap": "يتداخل مصدر الاستيراد مع الوجهة",
				"code.import-conflict": "اختر التخطي أو الاستبدال صراحةً",
				"code.import-failed": "تعذر استيراد هذه المهارة",
				"code.import-recovery": "فشلت الاستعادة؛ تم الاحتفاظ بالنسخة الأصلية في مجلد الوجهة لاستعادتها",
				title: "مدير المهارات",
				search: "البحث عن مهارات",
				all: "كل المصادر",
				any: "كل الحالات",
				enabled: "مفعلة",
				disabled: "معطلة",
				invalid: "غير صالحة",
				shadowed: "محجوبة بنسخة أعلى أولوية",
				retry: "إعادة المحاولة",
				loading: "جارٍ تحميل المهارات…",
				error: "تعذر تحميل المهارات",
				details: "التفاصيل",
				close: "إغلاق",
				empty: "لا توجد مهارات مطابقة",
				source: "المصدر",
				toggle: "تبديل",
				diagnostics: "التشخيصات",
				blocked: "محجوبة بقيد المؤلف",
				copyText: "نسخ النص",
				copyCopy: "تبديل النسخة",
				toggleSource: "تبديل المصدر",
				modelInvocation: "استدعاء النموذج",
				userInvocation: "استدعاء المستخدم",
				allowed: "مسموح",
				denied: "مرفوض",
				shadowedBy: "محجوبة بواسطة",
				reloadState: "إعادة قراءة الحالة",
				stateLocked: "حالة المهارات غير صالحة؛ التغييرات مقفلة",
				"diag.discovery-truncated": "توقف الاكتشاف عند الحد الآمن",
				"diag.source-unavailable": "المصدر غير متاح",
				"diag.unreadable-entries": "تعذرت قراءة بعض العناصر",
				"diag.unreadable-skill": "تعذرت قراءة المهارة",
				"diag.oversized-skill": "حجم المهارة يتجاوز الحد",
				"diag.empty-skill": "ملف المهارة فارغ",
				"diag.invalid-frontmatter": "بيانات وصفية غير صالحة",
				"diag.invalid-yaml": "بيانات YAML غير صالحة",
				"diag.invalid-metadata": "بيانات وصفية غير صالحة",
				"diag.invalid-policy": "سياسة استدعاء غير صالحة",
				"diag.linked-outside-root": "وثيقة المهارة مرتبطة من خارج مصدرها",
				"diag.state-invalid": "حالة المهارات غير صالحة؛ المهارات المُدارة معطلة",
				"diag.project-unavailable": "المشروع غير متاح",
				"diag.project-missing": "مجلد المشروع غير موجود",
				"diag.project-unreadable": "تتعذر قراءة مجلد المشروع",
				"diag.project-source-outside": "مجلد مهارات المشروع يشير إلى خارج المشروع",
				"diag.project-source-overlap": "مجلد مهارات المشروع يتداخل مع مصدر آخر",
				scope: "العرض",
				scopeGlobal: "المهارات العامة",
				scopeProject: "مهارات المشروع",
				project: "المشروع",
				projectNone: "اختر مشروعاً مسجلاً",
				projectEmpty: "لا توجد مشاريع مسجلة بعد",
				projectHint: "تُقرأ مهارات المشروع من المشروع نفسه وتُبدَّل لذلك المشروع فقط",
				readOnlySource: "مهارات DSH في المشروع بلا مفتاح تبديل للمصدر",
				"code.project-missing": "المجلد غير موجود",
				"code.project-unreadable": "تتعذر قراءته",
				"code.project-unavailable": "غير متاح",
				"code.project-unregistered": "المشروع غير مسجل",
				"code.project-mismatch": "المشروع المحدد لا يطابق هذا العنصر",
				"code.project-dsh-source": "مهارات DSH في المشروع بلا مفتاح تبديل للمصدر",
				"code.root-not-absolute": "أدخل مسار مجلد مطلقاً",
				"code.root-too-long": "مسار المجلد طويل جداً",
				"code.root-not-found": "المجلد غير موجود",
				"code.root-not-directory": "المسار ليس مجلداً",
				"code.root-reserved": "هذا المجلد محجوز لمدير المهارات",
				"code.root-overlap": "هذا المجلد يتداخل مع مصدر مهارات آخر",
				"code.custom-limit": "بلغت الحد الأقصى وهو {limit} مصدراً مخصصاً",
				"code.custom-label": "الاسم أو المجموعة غير صالح أو طويل جداً",
				"code.custom-unknown": "هذا المصدر المخصص لم يعد موجوداً",
				"code.scan-aborted": "أُلغيت معاينة المجلد",
				"code.forbidden": "رُفض الطلب؛ أعد تحميل الصفحة وحاول مجدداً",
				"code.unsupported": "صيغة الطلب غير مدعومة",
				"code.stopping": "مدير المهارات قيد الإيقاف؛ حاول بعد قليل",
				"code.state-invalid": "حالة المهارات غير صالحة؛ أعد قراءة الحالة قبل تغيير المصادر",
				"diag.registry-unavailable": "سجل مساحات العمل غير متاح؛ قد لا تُطبَّق سياسة المشاريع",
				addSourceNamed: "إضافة مصدر",
				editNamed: "تعديل",
				removeNamed: "إزالة المصدر",
				confirmNamed: "تأكيد الإزالة",
				folders: "مجلدات المصادر",
				foldersHint: "عاين المجلد أولاً؛ لا يُسجَّل شيء حتى تضيفه. إزالة المصدر لا تحذف أي ملفات",
				folderPath: "مسار المجلد",
				scanFolder: "معاينة المجلد",
				addFolder: "إضافة المجلد",
				addSource: "إضافة مصدر",
				candidates: "المصادر المرشحة",
				noCandidates: "لا توجد مجلدات مهارات ضمن مستويين",
				candidateRegistered: "مسجل",
				candidateConflict: "يتداخل مع مصدر آخر",
				skillCount: "مهارات",
				customBadge: "مجلد مخصص",
				edit: "تعديل",
				save: "حفظ",
				cancel: "إلغاء",
				label: "الاسم",
				group: "المجموعة",
				remove: "إزالة المصدر",
				removeNote: "هذا يزيل إدخال المصدر فقط ولا تُحذف ملفات المهارات",
				confirmRemove: "تأكيد الإزالة",
				added: "أُضيف المصدر",
				registered: "هذا المجلد مصدر بالفعل",
				categories: "التصنيفات",
				categoryName: "اسم التصنيف",
				addCategory: "إضافة تصنيف",
				uncategorized: "بدون تصنيف",
				renameCategory: "إعادة تسمية التصنيف",
				deleteCategory: "حذف التصنيف",
				confirmDeleteCategory: "تأكيد حذف التصنيف",
				deleteCategoryNote: "تصبح مهارات هذا التصنيف بلا تصنيف. لا تتغير أي ملفات مهارات",
				enableGroup: "تفعيل المجموعة",
				disableGroup: "تعطيل المجموعة",
				enableAll: "تفعيل كل المهارات",
				disableAll: "تعطيل كل المهارات",
				selectSkill: "تحديد المهارة",
				assignTo: "إسناد المحدد إلى",
				assignSelected: "إسناد المحدد",
				moveUp: "نقل للأعلى",
				moveDown: "نقل للأسفل",
				filterCategory: "التصنيف",
				allCategories: "كل التصنيفات",
				note: "ملاحظة",
				saveNote: "حفظ الملاحظة",
				noteHint: "الملاحظات قابلة للبحث ولا تغيّر وصف المهارة",
				noteLimit: "حتى 500 حرف",
				selectAll: "تحديد كل المهارات",
				bulkOverrideNote: "التفعيل أو التعطيل الجماعي يسري على هذا المصدر فقط ويستبدل اختيارات المهارات السابقة.",
				"code.invalid-request": "الطلب غير صالح",
				"code.source-unknown": "هذا المصدر غير متاح في هذا العرض",
				"code.organization-limit": "عدد التصنيفات أو الملاحظات أو الإسنادات لهذا المصدر كبير جدا",
				"code.state-too-large": "بيانات التنظيم المحفوظة كبيرة جدا؛ احذف بعض الملاحظات أو التصنيفات",
				placement: "موضع الدخول",
				placementHint: "اختر مكان ظهور مدير المهارات: الإعدادات أو الشريط الجانبي أو كليهما",
				placementBoth: "كلاهما",
				placementSidebar: "الشريط الجانبي فقط",
				placementSettings: "الإعدادات فقط",
				"code.category-name": "أدخل اسم تصنيف لا يتجاوز 24 حرفاً",
				"code.category-duplicate": "يوجد تصنيف بهذا الاسم بالفعل",
				"code.category-unknown": "لم يعد هذا التصنيف موجوداً",
				"code.category-limit": "بلغت الحد الأقصى وهو {limit} تصنيفاً",
				"code.skill-unknown": "هذه المهارة غير متاحة في هذا العرض",
				"code.order-position": "موضع الترتيب غير صالح",
				"code.order-target": "هدف الترتيب في تصنيف آخر",
				"code.note-too-long": "الملاحظة أطول من {limit} حرفاً",
				"code.placement-invalid": "موضع الدخول غير صالح"
			}
		};
		effect(() => ctx.locale.register("majed.skills", dictionaries), "majed-skills dictionaries");
		const t = ctx.locale.bind("majed.skills");
		const isArabic = () => ctx.locale.language?.getSnapshot?.() === "ar";
		const sourceLabel = (source) => source.label ?? source.name ?? source.id;
		const diagnosticText = (item) => {
			const label = dictionaries.en[`diag.${item.code}`] ? t(`diag.${item.code}`) : item.message ?? item.code;
			const where = item.params?.path ?? item.params?.source;
			return where ? `${label} — ${where}` : label;
		};
		const call = async (body, signal) => {
			const base = new URL(document.baseURI);
			if (!base.pathname.endsWith("/")) base.pathname += "/";
			const response = await fetch(new URL("api/majed-skills.catalog", base), {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-majed-skills": "1"
				},
				body: JSON.stringify(body),
				signal
			});
			if (!response.ok) {
				const failure = new Error(String(response.status));
				const body$1 = await response.json().catch(() => ({}));
				failure.params = body$1.params;
				failure.code = body$1.code ?? {
					403: "forbidden",
					415: "unsupported",
					503: "stopping"
				}[response.status] ?? (response.status === 409 ? "state-invalid" : void 0);
				throw failure;
			}
			return response.json();
		};
		const copyText = (text) => {
			const clipboard = typeof navigator === "undefined" ? void 0 : navigator.clipboard;
			if (!clipboard || typeof clipboard.writeText !== "function") return Promise.reject(/* @__PURE__ */ new Error("clipboard-unavailable"));
			return Promise.resolve().then(() => clipboard.writeText(text));
		};
		const errorText = (failure) => failure?.code && dictionaries.en[`code.${failure.code}`] ? t(`code.${failure.code}`).replace("{limit}", String(failure.params?.limit ?? "")).replace("{recovery}", String(failure.params?.recovery ?? "")) : t("error");
		const CATALOG_CAP = 100;
		function CatalogDialog(props) {
			const ref = React.useRef(null);
			React.useEffect(() => {
				const previous = document.activeElement;
				ref.current?.focus?.();
				return () => previous?.focus?.();
			}, []);
			return h("div", {
				role: "dialog",
				"aria-modal": true,
				"aria-label": props.label,
				dir: isArabic() ? "rtl" : void 0,
				ref,
				tabIndex: -1,
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						event.stopPropagation?.();
						props.onClose();
					}
				}
			}, props.children);
		}
		function CatalogPanel(props) {
			const { kind, data, setData, setNotice } = props;
			const [typed, setTyped] = React.useState(""), [committed, setCommitted] = React.useState(""), [items, setItems] = React.useState([]), [cursor, setCursor] = React.useState(null), [phase, setPhase] = React.useState("loading"), [more, setMore] = React.useState(false), [attempt, setAttempt] = React.useState(0), [sort, setSort] = React.useState("downloads"), [status, setStatus] = React.useState(""), [detail, setDetail] = React.useState(null), [copy, setCopy] = React.useState(""), [installing, setInstalling] = React.useState(null), [target, setTarget] = React.useState("user-dsh"), [conflict, setConflict] = React.useState(false), [confirming, setConfirming] = React.useState(null), [working, setWorking] = React.useState(""), [message, setMessage] = React.useState("");
			const request = React.useRef(null);
			const sending = React.useRef(false);
			const searching = committed !== "";
			const recordsOf = (item) => (data?.catalogInstalls ?? []).filter((entry) => entry.catalogId === item.id);
			const copiesOf = (item) => recordsOf(item).filter((entry) => entry.status === "installed" || entry.status === "modified");
			const bodyFor = (item) => item.catalog === "clawhub" ? {
				catalog: "clawhub",
				owner: item.owner,
				slug: item.slug
			} : {
				catalog: "skillsh",
				source: item.source,
				skillId: item.skillId
			};
			const load = (after) => {
				request.current?.abort();
				const current = request.current = new AbortController();
				if (after) setMore(true);
				else {
					setPhase("loading");
					setItems([]);
					setCursor(null);
				}
				return call(kind === "skillsh" ? {
					action: "catalog-skillsh-search",
					q: committed
				} : searching ? {
					action: "catalog-clawhub-search",
					q: committed
				} : {
					action: "catalog-clawhub-list",
					...after ? { cursor: after } : {}
				}, current.signal).then((value) => {
					if (request.current !== current) return;
					setItems((all) => after ? [...all, ...value.items].slice(0, CATALOG_CAP) : value.items);
					setCursor(value.nextCursor ?? null);
					setPhase("ready");
					setMore(false);
				}).catch((failure) => {
					if (failure?.name === "AbortError" || request.current !== current) return;
					setPhase("error");
					setMore(false);
				});
			};
			React.useEffect(() => {
				if (kind === "skillsh" && !committed) {
					request.current?.abort();
					setItems([]);
					setPhase("idle");
					return;
				}
				load();
				return () => request.current?.abort();
			}, [
				kind,
				committed,
				attempt
			]);
			React.useEffect(() => {
				const handle = setTimeout(() => setCommitted(typed.trim()), 300);
				return () => clearTimeout(handle);
			}, [typed]);
			const shown = items.filter((item) => {
				const copies = copiesOf(item).length;
				return !status || (status === "installed" ? copies > 0 : copies === 0);
			}).slice().sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "installs" ? (b.installs ?? 0) - (a.installs ?? 0) : 0);
			const sourceName = (id) => {
				const found = (data?.sources ?? []).find((entry) => entry.id === id);
				return found ? sourceLabel(found) : id;
			};
			const send = async (busyKey, body, done) => {
				if (working || sending.current) return;
				sending.current = true;
				setWorking(busyKey);
				setNotice("");
				setMessage("");
				try {
					const value = await call(body);
					setData(value);
					done?.(value);
				} catch (failure) {
					setNotice(errorText(failure));
					if (failure?.code === "repo-conflict") setConflict(true);
				} finally {
					sending.current = false;
					setWorking("");
				}
			};
			const openDetail = async (item) => {
				setCopy("");
				setDetail({
					item,
					loading: true
				});
				try {
					setDetail({
						item,
						value: await call({
							action: "catalog-detail",
							skill: bodyFor(item)
						})
					});
				} catch (failure) {
					setDetail(null);
					setNotice(errorText(failure));
				}
			};
			const confirmInstall = (reassociate) => send(`install:${installing.id}`, {
				action: "catalog-install",
				skill: bodyFor(installing),
				destination: target,
				confirm: true,
				...reassociate ? { reassociate: true } : {}
			}, () => {
				setInstalling(null);
				setConflict(false);
				setMessage(t("catInstallDone"));
			});
			const metadata = (item) => [h("bdi", {
				key: "origin",
				dir: "ltr"
			}, item.catalog === "clawhub" ? `${item.owner}/${item.slug}` : `${item.source}/${item.skillId}`), ...[
				item.downloads !== void 0 ? `${item.downloads} ${t("catDownloads")}` : "",
				item.installs !== void 0 ? `${item.installs} ${t("catInstalls")}` : "",
				item.stars !== void 0 ? `${item.stars} ${t("catStars")}` : ""
			].filter(Boolean).map((part) => ` · ${part}`)];
			const shared = (entry) => entry.source === "user-agents";
			const confirmAction = () => send(`${confirming.action}:${confirming.entry.id}`, {
				action: confirming.action === "uninstall" ? "catalog-uninstall" : "catalog-forget",
				installId: confirming.entry.id
			}, () => setConfirming(null));
			return h("div", { "data-majed-catalogs": true }, h("form", { onSubmit: (event) => {
				event.preventDefault();
				setCommitted(typed.trim());
				setAttempt((n) => n + 1);
			} }, h("input", {
				"aria-label": kind === "clawhub" ? t("catSearchClawhub") : t("catSearchSkillsh"),
				placeholder: kind === "clawhub" ? t("catSearchClawhub") : t("catSearchSkillsh"),
				maxLength: 100,
				value: typed,
				onChange: (event) => setTyped(event.target.value)
			}), h("button", { type: "submit" }, t("catSearch"))), kind === "clawhub" && !searching ? h("p", null, t("catPopularNote")) : null, kind === "skillsh" && !searching ? h("p", null, t("catSkillshHint")) : null, !searching || kind === "skillsh" ? h("select", {
				"aria-label": t("catStatusFilter"),
				value: status,
				onChange: (event) => setStatus(event.target.value)
			}, h("option", { value: "" }, t("catStatusAll")), h("option", { value: "available" }, t("catStatusAvailable")), h("option", { value: "installed" }, t("catStatusInstalled"))) : null, kind === "clawhub" && !searching ? h("select", {
				"aria-label": t("catSort"),
				value: sort,
				onChange: (event) => setSort(event.target.value)
			}, h("option", { value: "downloads" }, t("catSortDownloads")), h("option", { value: "installs" }, t("catSortInstalls")), h("option", { value: "name" }, t("catSortName"))) : null, message ? h("p", { role: "status" }, message) : null, phase === "loading" ? h("p", { role: "status" }, t("catLoading")) : null, phase === "error" ? h("div", { role: "alert" }, h("p", null, t("catLoadError")), h("button", { onClick: () => setAttempt((n) => n + 1) }, t("catRetry"))) : null, phase === "ready" && !shown.length ? h("p", null, searching ? t("catSearchEmpty") : t("catEmpty")) : null, h("ul", null, ...shown.map((item) => {
				const copies = copiesOf(item);
				return h("li", {
					key: item.id,
					"data-majed-catalog-item": item.id
				}, h("strong", null, item.name), item.summary ? h("p", null, item.summary) : null, h("small", null, ...metadata(item)), copies.length ? h("span", null, ` ${t("catInstalled")}`) : null, !copies.length && recordsOf(item).length ? h("p", { role: "note" }, t(`catHint.${recordsOf(item)[0].status}`)) : null, h("button", {
					"aria-label": `${t("catDetails")}: ${item.name}`,
					onClick: () => void openDetail(item)
				}, t("details")), h("button", {
					"aria-label": `${copies.length ? t("catInstallElsewhere") : t("catInstall")}: ${item.name}`,
					disabled: !!working,
					onClick: () => {
						setInstalling(item);
						setConflict(false);
						setTarget("user-dsh");
					}
				}, copies.length ? t("catInstallElsewhere") : t("catInstall")), recordsOf(item).length ? h("ul", { "aria-label": `${t("catCopies")}: ${item.name}` }, ...recordsOf(item).map((entry) => h("li", {
					key: entry.id,
					"data-majed-catalog-copy": entry.id
				}, `${sourceName(entry.source)} · `, h("bdi", { dir: "ltr" }, `${entry.root}/${entry.name}`), ` · ${t(`catStatus.${entry.status}`)}`, entry.status === "invalid-root" || entry.status === "missing" ? h("button", {
					"aria-label": `${t("catForget")}: ${item.name}`,
					disabled: !!working,
					onClick: () => setConfirming({
						action: "forget",
						entry,
						item
					})
				}, t("catForget")) : entry.status === "trashed" ? null : h("button", {
					"aria-label": `${t("catUninstall")}: ${item.name}`,
					disabled: !!working,
					onClick: () => setConfirming({
						action: "uninstall",
						entry,
						item
					})
				}, t("catUninstall"))))) : null);
			})), kind === "clawhub" && !searching && cursor && items.length < CATALOG_CAP ? h("button", {
				disabled: more,
				"aria-live": "polite",
				"aria-busy": more,
				onClick: () => void load(cursor)
			}, more ? t("catLoadingMore") : t("catLoadMore")) : null, detail ? h(CatalogDialog, {
				label: t("catDetails"),
				onClose: () => setDetail(null)
			}, h("h4", null, detail.item.name), detail.loading ? h("p", { role: "status" }, t("catDetailLoading")) : h("div", null, h("p", null, detail.value.description), h("p", null, `${t("catOrigin")}: `, h("bdi", { dir: "ltr" }, detail.value.origin)), h("textarea", {
				readOnly: true,
				"aria-label": "SKILL.md",
				value: detail.value.body
			}), h("button", { onClick: () => copyText(detail.value.body).then(() => setCopy(t("catCopied")), () => setCopy(t("catCopyFailed"))) }, t("catCopy")), copy ? h("span", { role: "status" }, copy) : null), h("button", { onClick: () => setDetail(null) }, t("catClose"))) : null, installing ? h(CatalogDialog, {
				label: t("catInstallTitle"),
				onClose: () => setInstalling(null)
			}, h("h4", null, `${t("catInstallTitle")}: ${installing.name}`), h("p", null, ...metadata(installing)), h("select", {
				"aria-label": t("repoDestination"),
				value: target,
				onChange: (event) => setTarget(event.target.value)
			}, ...["user-dsh", "user-agents"].map((id) => h("option", {
				key: id,
				value: id
			}, sourceName(id)))), h("button", {
				disabled: !!working,
				onClick: () => void confirmInstall(false)
			}, t("catInstallConfirm")), conflict ? h("button", {
				disabled: !!working,
				onClick: () => void confirmInstall(true)
			}, t("catReassociate")) : null, h("button", { onClick: () => setInstalling(null) }, t("cancel"))) : null, confirming ? h(CatalogDialog, {
				label: confirming.action === "uninstall" ? t("catUninstallTitle") : t("catForgetTitle"),
				onClose: () => setConfirming(null)
			}, h("h4", null, confirming.action === "uninstall" ? t("catUninstallTitle") : t("catForgetTitle")), h("p", null, (confirming.action === "uninstall" ? t("catUninstallBody") : t("catForgetBody")).replace("{name}", confirming.item.name).replace("{where}", `${sourceName(confirming.entry.source)} (${confirming.entry.root}/${confirming.entry.name})`)), confirming.action === "uninstall" && shared(confirming.entry) ? h("p", { role: "alert" }, t("catSharedWarning")) : null, h("button", {
				disabled: !!working,
				onClick: () => void confirmAction()
			}, confirming.action === "uninstall" ? t("catConfirmUninstall") : t("catConfirmForget")), h("button", { onClick: () => setConfirming(null) }, t("cancel"))) : null);
		}
		function Section() {
			const [data, setData] = React.useState(null), [error, setError] = React.useState(false), [query, setQuery] = React.useState(""), [source, setSource] = React.useState(""), [status, setStatus] = React.useState(""), [detail, setDetail] = React.useState(null), [detailError, setDetailError] = React.useState(false), [scope, setScope] = React.useState("global"), [tab, setTab] = React.useState("git"), [project, setProject] = React.useState(""), [folderPath, setFolderPath] = React.useState(""), [candidates, setCandidates] = React.useState(null), [editing, setEditing] = React.useState(null), [removing, setRemoving] = React.useState(""), [pendingScan, setPendingScan] = React.useState(false), [loaded, setLoaded] = React.useState(""), [notice, setNotice] = React.useState(""), [managing, setManaging] = React.useState(false), [catName, setCatName] = React.useState({}), [catEdit, setCatEdit] = React.useState(null), [catRemoving, setCatRemoving] = React.useState(""), [catFilter, setCatFilter] = React.useState(""), [picked, setPicked] = React.useState({}), [assignTarget, setAssignTarget] = React.useState({}), [noteDrafts, setNoteDrafts] = React.useState({}), [dragging, setDragging] = React.useState(null), [importing, setImporting] = React.useState(false), [importPath, setImportPath] = React.useState(""), [importFiles, setImportFiles] = React.useState([]), [importConflict, setImportConflict] = React.useState(""), [importResult, setImportResult] = React.useState(null), [importBusy, setImportBusy] = React.useState(false), [trashDeleting, setTrashDeleting] = React.useState(""), [repoForm, setRepoForm] = React.useState({
				url: "",
				ref: "",
				subdirectory: ""
			}), [repoFilter, setRepoFilter] = React.useState(""), [repoStatusFilter, setRepoStatusFilter] = React.useState(""), [repoRepoFilter, setRepoRepoFilter] = React.useState(""), [repoUnsubscribing, setRepoUnsubscribing] = React.useState(""), [repoForgetting, setRepoForgetting] = React.useState(""), [repoTarget, setRepoTarget] = React.useState("user-dsh"), [repoBusy, setRepoBusy] = React.useState(""), [repoSummary, setRepoSummary] = React.useState(""), [repoPreviews, setRepoPreviews] = React.useState({}), [repoOverwrites, setRepoOverwrites] = React.useState({}), [creating, setCreating] = React.useState(false), [createName, setCreateName] = React.useState(""), [createDescription, setCreateDescription] = React.useState(""), [createBody, setCreateBody] = React.useState(""), [createSource, setCreateSource] = React.useState("user-dsh");
			const dialog = React.useRef(null);
			React.useEffect(() => {
				if (!detail) return;
				const previous = document.activeElement;
				dialog.current?.focus?.();
				return () => previous?.focus?.();
			}, [detail]);
			const lifetime = React.useRef(new AbortController());
			const busy = React.useRef(false);
			const controller = React.useRef(null);
			const selected = scope === "project" && project ? { project } : {};
			const key = scope === "project" && project ? project : "";
			const keyRef = React.useRef(key);
			keyRef.current = key;
			const switching = loaded !== key;
			const load = () => {
				const requested = key;
				controller.current?.abort();
				const current = controller.current = new AbortController();
				setError(false);
				return call({
					action: "list",
					...selected
				}, current.signal).then((value) => {
					if (keyRef.current !== requested) return;
					setData(value);
					setLoaded(requested);
				}).catch((error$1) => {
					if (error$1.name !== "AbortError" && keyRef.current === requested) setError(true);
				});
			};
			React.useEffect(() => () => {
				controller.current?.abort();
				lifetime.current.abort();
			}, []);
			React.useEffect(() => {
				setNotice("");
				setCandidates(null);
				setPicked({});
				setCatFilter("");
				setNoteDrafts({});
				setDragging(null);
				setCatEdit(null);
				setCatRemoving("");
				load();
			}, [scope, project]);
			React.useEffect(() => {
				setDragging(null);
				setCatFilter("");
			}, [source]);
			const toggle = async (kind, id, enabled) => {
				if (busy.current || switching || lifetime.current.signal.aborted) return;
				busy.current = true;
				try {
					const requested = key;
					await call({
						action: "toggle",
						kind,
						id,
						enabled,
						...selected
					}, lifetime.current.signal);
					if (!lifetime.current.signal.aborted && keyRef.current === requested) await load();
				} catch {
					if (!lifetime.current.signal.aborted && keyRef.current === key) setError(true);
				} finally {
					busy.current = false;
				}
			};
			const mutate = async (body, done) => {
				if (busy.current || lifetime.current.signal.aborted) return;
				busy.current = true;
				setNotice("");
				const requested = key;
				try {
					const value = await call(body, lifetime.current.signal);
					if (lifetime.current.signal.aborted || keyRef.current !== requested) return;
					setData(value);
					done?.(value);
				} catch (failure) {
					if (!lifetime.current.signal.aborted && keyRef.current === requested) setNotice(errorText(failure));
				} finally {
					busy.current = false;
				}
			};
			const repoAction = async (busyKey, body, done) => {
				if (repoBusy || busy.current) return;
				setRepoBusy(busyKey);
				setRepoSummary("");
				try {
					await mutate(body, done);
				} finally {
					setRepoBusy("");
				}
			};
			const repoWarning = (value) => {
				const result = value?.result;
				const lines = [];
				if (result?.warning) lines.push(`${t(`code.${result.warning}`)} ${result.path ?? ""}`.trim());
				for (const item of result?.warnings ?? []) lines.push(`${item.name}: ${t(`code.${item.code}`)} ${(item.recovery ?? []).join(" ")}`.trim());
				if (lines.length) setNotice(lines.join(" · "));
			};
			const repoPreview = (record, kind) => void repoAction(record.id, {
				action: `repo-${kind}-preview`,
				installId: record.id
			}, (value) => {
				setRepoPreviews((all) => ({
					...all,
					[record.id]: {
						kind,
						...value.result
					}
				}));
				setRepoOverwrites((all) => ({
					...all,
					[record.id]: false
				}));
			});
			const repoApply = (record) => {
				const preview = repoPreviews[record.id];
				if (!preview) return;
				const clear = () => setRepoPreviews(({ [record.id]: _gone,...rest }) => rest);
				repoAction(`apply:${record.id}`, {
					action: `repo-${preview.kind}`,
					installId: record.id,
					current: preview.current,
					target: preview.target.digest,
					snapshot: preview.snapshot,
					overwrite: !!repoOverwrites[record.id]
				}, (value) => {
					clear();
					setNotice(t(preview.kind === "update" ? "repoUpdated" : "repoRolledBack").replace("{name}", record.name));
					repoWarning(value);
				});
			};
			const runImport = async (dryRun) => {
				if (busy.current || switching || importBusy || !importConflict) return;
				setImportBusy(true);
				const requested = key;
				try {
					const body = {
						action: "import",
						path: importPath,
						dryRun,
						conflict: importConflict,
						...selected,
						source: scope === "project" ? `project-dsh:${project}` : createSource
					};
					if (!dryRun && importFiles.length) {
						body.action = "upload";
						if (importFiles.length > 512 || importFiles.reduce((sum, file) => sum + file.size, 0) > 1048576) throw new Error(t("code.import-limit"));
						const entries = [];
						for (const file of importFiles) {
							if (lifetime.current.signal.aborted) return;
							const bytes = new Uint8Array(await file.arrayBuffer());
							let binary = "";
							for (const byte of bytes) binary += String.fromCharCode(byte);
							entries.push({
								path: file.webkitRelativePath || file.name,
								data: btoa(binary)
							});
						}
						body.archives = entries.filter((entry) => !entry.path.includes("/") && /\.zip$/i.test(entry.path));
						body.entries = entries.filter((entry) => entry.path.includes("/") || !/\.zip$/i.test(entry.path));
					}
					await mutate(body, (value) => setImportResult(value.result));
				} catch (error$1) {
					if (keyRef.current === requested) setNotice(error$1.message);
				} finally {
					setImportBusy(false);
				}
			};
			const addFolders = (items) => mutate({
				action: "custom-add",
				items
			}, (value) => {
				const result = value.results?.[0];
				setCandidates(null);
				setNotice(result?.status === "rejected" ? errorText(result) : result?.status === "registered" ? t("registered") : t("added"));
			});
			const scanFolder = async () => {
				if (pendingScan) return;
				setPendingScan(true);
				setNotice("");
				const requested = key;
				try {
					const found = await call({
						action: "custom-scan",
						path: folderPath
					}, lifetime.current.signal);
					if (!lifetime.current.signal.aborted && keyRef.current === requested) setCandidates(found.candidates);
				} catch (failure) {
					if (!lifetime.current.signal.aborted && keyRef.current === requested) {
						setCandidates(null);
						setNotice(errorText(failure));
					}
				} finally {
					setPendingScan(false);
				}
			};
			const copyStatus = (copy) => copy.metadataValid === false || !copy.policyValid ? "invalid" : !copy.eligible ? "disabled" : copy.shadowedBy ? "shadowed" : copy.author && !copy.author.modelInvocable && !copy.author.userInvocable ? "blocked" : "enabled";
			const inProject = scope === "project";
			const view = scope === "trash" || scope === "discover" ? {
				sources: [],
				copies: [],
				diagnostics: []
			} : inProject ? data?.project ?? {
				sources: [],
				copies: [],
				diagnostics: []
			} : data;
			const orgOf = (sourceId) => ({
				categories: [],
				members: {},
				order: {},
				notes: {},
				...view?.organization?.[sourceId] ?? {}
			});
			const filterCategories = source ? orgOf(source).categories : [];
			const activeCat = catFilter === "__none" || filterCategories.some((c) => c.id === catFilter) ? catFilter : "";
			const copies = (view?.copies ?? []).filter((copy) => {
				const organization = orgOf(copy.source);
				return (!source || copy.source === source) && (!query || `${copy.name} ${copy.description} ${copy.path} ${organization.notes[copy.name] ?? ""}`.toLowerCase().includes(query.toLowerCase())) && (!status || copyStatus(copy) === status) && (!activeCat || (activeCat === "__none" ? !organization.members[copy.name] : organization.members[copy.name] === activeCat));
			});
			const projects = data?.projects ?? [];
			const projectName = (id) => projects.find((x) => x.id === id)?.name ?? id;
			const destinationName = () => `${projectName(project)} — DSH`;
			const projectOption = (x) => h("option", {
				key: x.id,
				value: x.id,
				disabled: !x.available
			}, x.available ? x.name : `${x.name} · ${t(`code.${x.code}`)}`);
			const field = (label, value, set) => h("input", {
				"aria-label": label,
				placeholder: label,
				value,
				onChange: (e) => set(e.target.value)
			});
			const organize = (body, done) => mutate({
				...body,
				...selected
			}, done);
			const skillNames = (sourceId) => [...new Set((view?.copies ?? []).filter((c) => c.source === sourceId && c.metadataValid !== false).map((c) => c.name))];
			const groupNames = (sourceId, id) => {
				const organization = orgOf(sourceId);
				const available = skillNames(sourceId).filter((n) => (organization.members[n] ?? "") === id).sort((a, b) => a.localeCompare(b));
				const saved = (organization.order[id] ?? []).filter((n) => available.includes(n));
				return [...saved, ...available.filter((n) => !saved.includes(n))];
			};
			/** Selection pruned against what the source really lists now. */
			const pickedIn = (sourceId) => {
				const names = skillNames(sourceId);
				return (picked[sourceId] ?? []).filter((n) => names.includes(n));
			};
			const setPickedIn = (sourceId, names) => setPicked({
				...picked,
				[sourceId]: names
			});
			const move = (sourceId, name, category, target, position) => void organize({
				action: "category-move",
				source: sourceId,
				name,
				category,
				target,
				position
			});
			const draggedInto = (sourceId) => dragging && dragging.source === sourceId ? dragging.name : "";
			const groupBlock = (sourceId, group) => {
				const names = groupNames(sourceId, group.id);
				const marked = pickedIn(sourceId);
				const editKey = `${sourceId}/${group.id}`;
				return h("section", {
					key: group.id || "none",
					"aria-label": group.name,
					onDragOver: (e) => e.preventDefault?.(),
					onDrop: (e) => {
						e.preventDefault?.();
						const dragged = draggedInto(sourceId);
						setDragging(null);
						if (dragged) move(sourceId, dragged, group.id);
					}
				}, h("h4", null, `${group.name} (${names.length})`), h("button", {
					"aria-label": `${t("enableGroup")}: ${group.name}`,
					onClick: () => void organize({
						action: "category-toggle",
						source: sourceId,
						category: group.id,
						enabled: true
					})
				}, t("enableGroup")), h("button", {
					"aria-label": `${t("disableGroup")}: ${group.name}`,
					onClick: () => void organize({
						action: "category-toggle",
						source: sourceId,
						category: group.id,
						enabled: false
					})
				}, t("disableGroup")), group.id ? catEdit?.key === editKey ? h("span", null, field(t("renameCategory"), catEdit.name, (v) => setCatEdit({
					...catEdit,
					name: v
				})), h("button", {
					"aria-label": `${t("save")}: ${group.name}`,
					onClick: () => void organize({
						action: "category-rename",
						source: sourceId,
						category: group.id,
						name: catEdit.name
					}, () => setCatEdit(null))
				}, t("save")), h("button", {
					"aria-label": `${t("cancel")}: ${group.name}`,
					onClick: () => setCatEdit(null)
				}, t("cancel"))) : catRemoving === editKey ? h("span", null, h("p", null, t("deleteCategoryNote")), h("button", {
					"aria-label": `${t("confirmDeleteCategory")}: ${group.name}`,
					onClick: () => void organize({
						action: "category-delete",
						source: sourceId,
						category: group.id
					}, () => setCatRemoving(""))
				}, t("confirmDeleteCategory")), h("button", {
					"aria-label": `${t("cancel")}: ${group.name}`,
					onClick: () => setCatRemoving("")
				}, t("cancel"))) : h("span", null, h("button", {
					"aria-label": `${t("renameCategory")}: ${group.name}`,
					onClick: () => setCatEdit({
						key: editKey,
						id: group.id,
						name: group.name
					})
				}, t("renameCategory")), h("button", {
					"aria-label": `${t("deleteCategory")}: ${group.name}`,
					onClick: () => setCatRemoving(editKey)
				}, t("deleteCategory"))) : null, ...names.map((name, i) => h("div", {
					key: name,
					"data-skill": name,
					draggable: true,
					onDragStart: (e) => {
						e.dataTransfer?.setData?.("text/plain", name);
						if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
						setDragging({
							source: sourceId,
							name
						});
					},
					onDragEnd: () => setDragging(null),
					onDragOver: (e) => e.preventDefault?.(),
					onDrop: (e) => {
						e.stopPropagation?.();
						e.preventDefault?.();
						const dragged = draggedInto(sourceId);
						setDragging(null);
						if (dragged && dragged !== name) move(sourceId, dragged, group.id, name, "before");
					}
				}, h("input", {
					type: "checkbox",
					"aria-label": `${t("selectSkill")}: ${name}`,
					checked: marked.includes(name),
					onChange: (e) => setPickedIn(sourceId, e.target.checked ? [...marked, name] : marked.filter((x) => x !== name))
				}), h("span", null, name), h("button", {
					disabled: i === 0,
					"aria-label": `${t("moveUp")}: ${name}`,
					onClick: () => move(sourceId, name, group.id, names[i - 1], "before")
				}, t("moveUp")), h("button", {
					disabled: i === names.length - 1,
					"aria-label": `${t("moveDown")}: ${name}`,
					onClick: () => move(sourceId, name, group.id, names[i + 1], "after")
				}, t("moveDown")))));
			};
			const organizer = (sourceId, label) => {
				const organization = orgOf(sourceId);
				const marked = pickedIn(sourceId);
				const all = skillNames(sourceId);
				const name = catName[sourceId] ?? "";
				const target = assignTarget[sourceId] ?? "";
				const toggleAll = (enabled) => void organize({
					action: "category-toggle",
					source: sourceId,
					category: "*",
					enabled
				});
				return h("div", {
					"data-organizer": sourceId,
					dir: isArabic() ? "rtl" : void 0
				}, h("h3", null, `${t("categories")} · ${label}`), h("p", null, t("bulkOverrideNote")), field(`${t("categoryName")}: ${label}`, name, (v) => setCatName({
					...catName,
					[sourceId]: v
				})), h("button", {
					"aria-label": `${t("addCategory")}: ${label}`,
					onClick: () => void organize({
						action: "category-create",
						source: sourceId,
						name
					}, () => setCatName({
						...catName,
						[sourceId]: ""
					}))
				}, t("addCategory")), h("button", {
					"aria-label": `${t("enableAll")}: ${label}`,
					onClick: () => toggleAll(true)
				}, t("enableAll")), h("button", {
					"aria-label": `${t("disableAll")}: ${label}`,
					onClick: () => toggleAll(false)
				}, t("disableAll")), h("input", {
					type: "checkbox",
					"aria-label": `${t("selectAll")}: ${label}`,
					checked: !!all.length && marked.length === all.length,
					onChange: (e) => setPickedIn(sourceId, e.target.checked ? all : [])
				}), h("select", {
					"aria-label": `${t("assignTo")}: ${label}`,
					value: target,
					onChange: (e) => setAssignTarget({
						...assignTarget,
						[sourceId]: e.target.value
					})
				}, h("option", { value: "" }, t("uncategorized")), ...organization.categories.map((c) => h("option", {
					key: c.id,
					value: c.id
				}, c.name))), h("button", {
					disabled: !marked.length,
					"aria-label": `${t("assignSelected")}: ${label}`,
					onClick: () => void organize({
						action: "category-assign",
						source: sourceId,
						names: marked,
						category: target
					}, () => setPickedIn(sourceId, []))
				}, t("assignSelected")), ...[...organization.categories, {
					id: "",
					name: t("uncategorized")
				}].map((group) => groupBlock(sourceId, group)));
			};
			const manager = () => h("div", null, h("p", null, t("foldersHint")), field(t("folderPath"), folderPath, setFolderPath), h("button", {
				disabled: pendingScan,
				onClick: () => void scanFolder()
			}, t("scanFolder")), h("button", { onClick: () => void addFolders([{ path: folderPath }]) }, t("addFolder")), notice ? h("p", { role: "status" }, notice) : null, candidates ? h("div", null, h("h4", null, t("candidates")), candidates.length ? null : h("p", null, t("noCandidates")), ...candidates.map((c) => h("div", { key: c.path }, h("strong", null, c.label), h("p", null, h("bdi", { dir: "ltr" }, c.path), ` · ${c.skillCount} ${t("skillCount")}`), c.registered ? h("span", null, t("candidateRegistered")) : c.conflict ? h("span", null, t("candidateConflict")) : h("button", {
				"aria-label": `${t("addSourceNamed")}: ${c.label}`,
				onClick: () => void addFolders([{
					path: c.path,
					label: c.label,
					group: c.group
				}])
			}, t("addSource"))))) : null);
			const customControls = (x) => editing?.id === x.id ? h("div", null, field(t("label"), editing.label, (v) => setEditing({
				...editing,
				label: v
			})), field(t("group"), editing.group, (v) => setEditing({
				...editing,
				group: v
			})), field(`${t("edit")}: ${t("folderPath")}`, editing.path, (v) => setEditing({
				...editing,
				path: v
			})), h("button", {
				"aria-label": `${t("save")}: ${x.label ?? x.id}`,
				onClick: () => void mutate({
					action: "custom-update",
					id: x.id,
					label: editing.label,
					group: editing.group,
					path: editing.path
				}, () => setEditing(null))
			}, t("save")), h("button", {
				"aria-label": `${t("cancel")}: ${x.label ?? x.id}`,
				onClick: () => setEditing(null)
			}, t("cancel"))) : removing === x.id ? h("div", null, h("p", null, t("removeNote")), h("button", {
				"aria-label": `${t("confirmNamed")}: ${x.label ?? x.id}`,
				onClick: () => void mutate({
					action: "custom-remove",
					id: x.id
				}, () => setRemoving(""))
			}, t("confirmRemove")), h("button", {
				"aria-label": `${t("cancel")}: ${x.label ?? x.id}`,
				onClick: () => setRemoving("")
			}, t("cancel"))) : h("div", null, h("span", null, t("customBadge")), h("button", {
				"aria-label": `${t("editNamed")}: ${x.label ?? x.id}`,
				onClick: () => setEditing({
					id: x.id,
					label: x.label ?? "",
					group: x.group ?? "",
					path: x.path
				})
			}, t("edit")), h("button", {
				"aria-label": `${t("removeNamed")}: ${x.label ?? x.id}`,
				onClick: () => setRemoving(x.id)
			}, t("remove")));
			return h("section", {
				"data-majed-skills": true,
				dir: isArabic() ? "rtl" : void 0
			}, h("h2", null, t("title")), data?.trashError ? h("p", { role: "alert" }, t(`code.${data.trashError}`)) : null, scope === "trash" ? h("div", { "data-majed-trash": true }, h("h3", null, t("trash")), !data?.trashError && !data?.trash?.length ? h("p", null, t("trashEmpty")) : null, ...(data?.trash ?? []).map((item) => h("article", { key: item.id }, h("strong", null, item.name), h("p", null, `${t("trashOrigin")}: ${item.origin}`), item.scope !== "global" ? h("p", null, `${t("project")}: ${projectName(item.scope)}`) : null, h("p", null, `${item.source} — ${item.deletedAt}`), h("button", {
				"aria-label": `${t("restoreTrash")}: ${item.name}`,
				onClick: () => void mutate({
					action: "trash-restore",
					id: item.id
				}, (value) => {
					if (value.result?.warning) setNotice(`${t(`code.${value.result.warning}`)} ${value.result.path ?? ""}`);
				})
			}, t("restoreTrash")), h("button", {
				"aria-label": `${t("deleteTrash")}: ${item.name}`,
				onClick: () => setTrashDeleting(item.id)
			}, t("deleteTrash")), trashDeleting === item.id ? h("div", { role: "alert" }, h("p", null, item.scope !== "global" ? `${t("trashWarning")} (${projectName(item.scope)})` : t("trashWarning")), h("button", { onClick: () => void mutate({
				action: "trash-delete",
				id: item.id,
				confirm: true
			}, (value) => {
				setTrashDeleting("");
				if (value.result?.warning) setNotice(t(`code.${value.result.warning}`));
			}) }, t("confirmTrash")), h("button", { onClick: () => setTrashDeleting("") }, t("cancel"))) : null))) : null, scope === "discover" ? h("div", {
				role: "tablist",
				"aria-label": t("scopeDiscover"),
				"data-majed-discover-tabs": true
			}, ...[
				["git", t("tabGit")],
				["clawhub", t("catSourceClawhub")],
				["skillsh", t("catSourceSkillsh")]
			].map(([id, label], index, all) => h("button", {
				key: id,
				type: "button",
				role: "tab",
				id: `majed-discover-tab-${id}`,
				"aria-selected": tab === id,
				"aria-controls": "majed-discover-panel",
				tabIndex: tab === id ? 0 : -1,
				onClick: () => setTab(id),
				onKeyDown: (event) => {
					const step = event.key === "ArrowRight" ? isArabic() ? -1 : 1 : event.key === "ArrowLeft" ? isArabic() ? 1 : -1 : 0;
					const next = (event.key === "Home" ? 0 : event.key === "End" ? all.length - 1 : void 0) ?? (step ? (index + step + all.length) % all.length : void 0);
					if (next === void 0) return;
					event.preventDefault?.();
					setTab(all[next][0]);
					(document.getElementById?.(`majed-discover-tab-${all[next][0]}`))?.focus?.();
				}
			}, label))) : null, scope === "discover" && tab === "git" ? h("div", {
				id: "majed-discover-panel",
				role: "tabpanel",
				"aria-labelledby": "majed-discover-tab-git",
				"data-majed-repositories": true
			}, h("h3", null, t("repositories")), h("form", { onSubmit: (event) => {
				event.preventDefault();
				repoAction("add", {
					action: "repo-add",
					repository: { ...repoForm }
				}, () => setRepoForm({
					url: "",
					ref: "",
					subdirectory: ""
				}));
			} }, h("h4", null, t("repoAddTitle")), field(t("repoUrl"), repoForm.url, (value) => setRepoForm({
				...repoForm,
				url: value
			})), field(t("repoRef"), repoForm.ref, (value) => setRepoForm({
				...repoForm,
				ref: value
			})), field(t("repoSubdirectory"), repoForm.subdirectory, (value) => setRepoForm({
				...repoForm,
				subdirectory: value
			})), h("button", {
				type: "submit",
				disabled: !repoForm.url.trim() || !!repoBusy || switching
			}, t("repoAdd"))), h("button", {
				disabled: !data?.repositories?.length || !!repoBusy || switching,
				onClick: () => void repoAction("all", { action: "repo-refresh-all" }, (value) => setRepoSummary(t("repoBulk").replace("{done}", String(value.result.refreshed.length)).replace("{total}", String(value.result.total)).replace("{failed}", String(value.result.failed.length))))
			}, t("repoRefreshAll")), repoBusy ? h("p", { role: "status" }, t(repoBusy.startsWith("apply:") ? "repoApplying" : "repoRefreshing")) : null, repoSummary ? h("p", { role: "status" }, repoSummary) : null, data?.repoError ? h("p", { role: "alert" }, t(`code.${data.repoError}`)) : null, field(t("repoFilter"), repoFilter, setRepoFilter), h("select", {
				"aria-label": t("repoStatusFilter"),
				value: repoStatusFilter,
				onChange: (event) => setRepoStatusFilter(event.target.value)
			}, h("option", {
				key: "",
				value: ""
			}, t("repoAllStatuses")), ...[
				"available",
				"installed",
				"update",
				"conflict",
				"invalid"
			].map((id) => h("option", {
				key: id,
				value: id
			}, t(`repoStatus.${id}`)))), h("select", {
				"aria-label": t("repoRepoFilter"),
				value: repoRepoFilter,
				onChange: (event) => setRepoRepoFilter(event.target.value)
			}, h("option", {
				key: "",
				value: ""
			}, t("repoAllRepositories")), ...(data?.repositories ?? []).map((repo) => h("option", {
				key: repo.id,
				value: repo.id
			}, repo.label))), h("select", {
				"aria-label": t("repoDestination"),
				value: repoTarget,
				onChange: (event) => setRepoTarget(event.target.value)
			}, ...["user-dsh", "user-agents"].filter((id) => data?.sources?.some((x) => x.id === id)).map((id) => h("option", {
				key: id,
				value: id
			}, id === "user-dsh" ? "DSH" : "Shared Agents"))), !data?.repoError && !data?.repositories?.length ? h("p", null, t("repoEmpty")) : null, ...(data?.repositories ?? []).map((repo) => {
				const needle = repoFilter.trim().toLowerCase();
				if (repoRepoFilter && repo.id !== repoRepoFilter) return null;
				const shown = repo.skills.filter((skill) => (!repoStatusFilter || skill.status === repoStatusFilter || repoStatusFilter === "update" && skill.updateAvailable) && (!needle || `${skill.name} ${skill.description} ${skill.path}`.toLowerCase().includes(needle)));
				if ((needle || repoStatusFilter) && !shown.length) return null;
				return h("article", {
					key: repo.id,
					"data-majed-repository": repo.id
				}, h("strong", null, repo.label), h("p", null, `${t("repoFromSource")}: ${repo.kind}${repo.ref ? ` @ ${repo.ref}` : ""}${repo.subdirectory ? ` / ${repo.subdirectory}` : ""}`), h("p", null, `${t("repoSnapshot")}: ${repo.fingerprint.slice(0, 12)} — ${t(`repoKind.${repo.fingerprintKind}`)}`), repo.error ? h("p", { role: "alert" }, `${t("repoLastError")}: ${t(`code.${repo.error.code}`)}`) : null, h("button", {
					"aria-label": `${t("repoRefresh")}: ${repo.label}`,
					disabled: !!repoBusy || switching,
					onClick: () => void repoAction(repo.id, {
						action: "repo-refresh",
						id: repo.id
					})
				}, t("repoRefresh")), h("button", {
					"aria-label": `${t("repoUnsubscribe")}: ${repo.label}`,
					disabled: !!repoBusy || switching,
					onClick: () => setRepoUnsubscribing(repo.id)
				}, t("repoUnsubscribe")), repoUnsubscribing === repo.id ? h("div", { role: "alert" }, h("p", null, t("repoConfirmUnsubscribe")), h("button", {
					"aria-label": `${t("repoConfirmUnsubscribeYes")}: ${repo.label}`,
					disabled: !!repoBusy || switching,
					onClick: () => {
						setRepoUnsubscribing("");
						repoAction(repo.id, {
							action: "repo-remove",
							id: repo.id
						});
					}
				}, t("repoConfirmUnsubscribeYes")), h("button", {
					"aria-label": `${t("cancel")}: ${repo.label}`,
					onClick: () => setRepoUnsubscribing("")
				}, t("cancel"))) : null, repoBusy === repo.id ? h("p", { role: "status" }, t("repoRefreshing")) : null, !repo.skills.length ? h("p", null, t("repoNoSkills")) : null, ...shown.map((skill) => h("div", {
					key: skill.path,
					"data-majed-repo-skill": skill.path
				}, h("span", null, skill.name), h("span", null, ` — ${t(`repoStatus.${skill.status}`)}`), skill.code ? h("span", null, ` (${t(`code.${skill.code}`)})`) : null, h("p", null, skill.description), skill.conflicts?.length ? h("p", null, `${t("repoConflictIn")}: ${skill.conflicts.map((id) => id === "user-dsh" ? "DSH" : "Shared Agents").join(", ")}`) : null, (skill.status === "available" || skill.status === "conflict") && !skill.conflicts?.includes(repoTarget) ? h("button", {
					"aria-label": `${t("repoInstall")}: ${skill.name}`,
					disabled: !!repoBusy || switching,
					onClick: () => void repoAction(repo.id, {
						action: "repo-install",
						id: repo.id,
						path: skill.path,
						snapshot: repo.fingerprint,
						source: repoTarget
					}, repoWarning)
				}, t("repoInstall")) : null)));
			}), h("h4", null, t("repoTracked")), !(data?.repoInstalls ?? []).length ? h("p", null, t("repoNoInstalls")) : null, ...(data?.repoInstalls ?? []).map((record) => h("article", {
				key: record.id,
				"data-majed-repo-install": record.id
			}, h("strong", null, record.name), h("span", null, ` — ${t(`repoStatus.${record.status}`)}`), record.updateAvailable && record.status !== "update" ? h("span", null, ` — ${t("repoStatus.update")}`) : null, record.upstream ? h("p", null, `${t("repoUpstream")}: ${t(`code.${record.upstream}`)}`) : null, h("p", null, `${t("repoFromSource")}: ${record.origin.label}${record.origin.ref ? ` @ ${record.origin.ref}` : ""}${record.origin.subdirectory ? ` / ${record.origin.subdirectory}` : ""}`), h("p", null, `${t("repoSnapshot")}: ${record.fingerprint.slice(0, 12)} — ${t(`repoKind.${record.fingerprintKind}`)}`), h("p", null, record.path), record.status === "installed" || record.status === "modified" ? h("button", {
				"aria-label": `${t("repoUninstall")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => void repoAction(record.id, {
					action: "repo-uninstall",
					installId: record.id
				}, repoWarning)
			}, t("repoUninstall")) : null, (record.status === "installed" || record.status === "modified") && record.updateAvailable ? h("button", {
				"aria-label": `${t("repoUpdatePreview")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => repoPreview(record, "update")
			}, t("repoUpdatePreview")) : null, record.canRollback && (record.status === "installed" || record.status === "modified") ? h("button", {
				"aria-label": `${t("repoRollbackPreview")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => repoPreview(record, "rollback")
			}, t("repoRollbackPreview")) : null, repoPreviews[record.id] && (record.status === "installed" || record.status === "modified") ? h("div", {
				role: "group",
				"aria-labelledby": `majed-repo-preview-${record.id}`,
				"data-majed-repo-preview": record.id
			}, h("h5", { id: `majed-repo-preview-${record.id}` }, `${t("repoPreviewTitle")}: ${record.name}`), !repoPreviews[record.id].changes.length ? h("p", null, t("repoNoChanges")) : h("ul", null, ...repoPreviews[record.id].changes.map((change) => h("li", { key: change.path }, `${t(`repoChange.${change.kind}`)}: `, h("bdi", { dir: "ltr" }, change.path)))), h("p", null, t("repoTrackedHint")), repoPreviews[record.id].localModified ? h("div", { role: "alert" }, h("p", null, t("repoLocalModified")), h("label", null, h("input", {
				type: "checkbox",
				"aria-label": `${t("repoOverwrite")}: ${record.name}`,
				checked: !!repoOverwrites[record.id],
				onChange: (event) => setRepoOverwrites((all) => ({
					...all,
					[record.id]: !!event.target.checked
				}))
			}), t("repoOverwrite"))) : null, h("button", {
				"aria-label": `${t(repoPreviews[record.id].kind === "update" ? "repoApplyUpdate" : "repoApplyRollback")}: ${record.name}`,
				disabled: !!repoBusy || switching || repoPreviews[record.id].localModified && !repoOverwrites[record.id],
				onClick: () => repoApply(record)
			}, t(repoPreviews[record.id].kind === "update" ? "repoApplyUpdate" : "repoApplyRollback")), h("button", {
				"aria-label": `${t("cancel")}: ${record.name}`,
				onClick: () => setRepoPreviews(({ [record.id]: _gone,...rest }) => rest)
			}, t("cancel"))) : null, record.status === "invalid-root" ? h("button", {
				"aria-label": `${t("repoForget")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => setRepoForgetting(record.id)
			}, t("repoForget")) : null, record.status === "invalid-root" && repoForgetting === record.id ? h("div", { role: "alert" }, h("p", null, t("repoConfirmForget")), h("button", {
				"aria-label": `${t("repoConfirmForgetYes")}: ${record.name}`,
				disabled: !!repoBusy || switching,
				onClick: () => {
					setRepoForgetting("");
					repoAction(record.id, {
						action: "repo-forget",
						installId: record.id
					});
				}
			}, t("repoConfirmForgetYes")), h("button", {
				"aria-label": `${t("cancel")}: ${record.name}`,
				onClick: () => setRepoForgetting("")
			}, t("cancel"))) : null))) : null, scope === "discover" && tab !== "git" && data && data.corrupt ? h("div", {
				id: "majed-discover-panel",
				role: "tabpanel",
				"aria-labelledby": `majed-discover-tab-${tab}`
			}) : null, scope === "discover" && tab !== "git" && data && !data.corrupt ? h("div", {
				id: "majed-discover-panel",
				role: "tabpanel",
				"aria-labelledby": `majed-discover-tab-${tab}`
			}, h(CatalogPanel, {
				key: tab,
				kind: tab,
				data,
				setData,
				setNotice
			})) : null, h("button", {
				disabled: switching || data?.corrupt || scope === "project" && !project,
				onClick: () => setImporting(!importing)
			}, t("importSkills")), importing ? h("div", { "data-majed-import": true }, h("p", null, t("importHint")), scope === "global" ? h("select", {
				"aria-label": t("destination"),
				value: createSource,
				onChange: (event) => setCreateSource(event.target.value)
			}, ...["user-dsh", "user-agents"].filter((id) => data?.sources?.some((s) => s.id === id)).map((id) => h("option", {
				key: id,
				value: id
			}, id === "user-dsh" ? "DSH" : "Shared Agents"))) : h("p", null, `${t("destination")}: ${destinationName()}`), field(t("importPath"), importPath, (value) => {
				setImportPath(value);
				setImportFiles([]);
				setImportResult(null);
			}), h("input", {
				type: "file",
				multiple: true,
				accept: ".zip,.md",
				"aria-label": t("uploadFiles"),
				onChange: (event) => {
					setImportFiles(Array.from(event.target.files ?? []));
					setImportResult(null);
				}
			}), h("input", {
				type: "file",
				multiple: true,
				webkitdirectory: "",
				"aria-label": t("uploadFolder"),
				onChange: (event) => {
					setImportFiles(Array.from(event.target.files ?? []));
					setImportResult(null);
				}
			}), h("select", {
				"aria-label": t("importConflict"),
				value: importConflict,
				onChange: (event) => setImportConflict(event.target.value)
			}, h("option", { value: "" }, t("importConflict")), h("option", { value: "skip" }, t("skipImport")), h("option", { value: "overwrite" }, t("overwriteImport"))), h("button", {
				disabled: importBusy || !importPath || !importConflict,
				onClick: () => runImport(true)
			}, t("previewImport")), h("button", {
				disabled: importBusy || !importConflict || !importPath && !importFiles.length,
				onClick: () => runImport(false)
			}, t("importNow")), importResult ? h("div", {
				"aria-label": t("importResult"),
				role: "status"
			}, ...[
				"pending",
				"conflicts",
				"imported",
				"skipped",
				"failed",
				"warnings",
				"inputs"
			].map((kind) => h("div", { key: kind }, t(`${kind}Import`), ": ", (importResult[kind] ?? []).map((entry) => `${entry.name}${entry.code ? ` (${errorText(entry)})` : ""}${entry.recovery?.length ? `: ${entry.recovery.join(", ")}` : ""}${entry.names?.length ? `: ${entry.names.join(", ")}` : ""}`).join(", ")))) : null) : null, h("button", {
				disabled: switching || data?.corrupt || scope === "project" && !project,
				onClick: () => setCreating(!creating)
			}, t("create")), creating ? h("form", { onSubmit: (event) => {
				event.preventDefault();
				if (switching || data?.corrupt || scope === "project" && !project) return;
				mutate({
					action: "create",
					...selected,
					source: scope === "project" ? `project-dsh:${project}` : createSource,
					name: createName,
					description: createDescription,
					body: createBody
				}, () => {
					setCreating(false);
					setCreateName("");
					setCreateDescription("");
					setCreateBody("");
					setNotice(t("created"));
				});
			} }, scope === "global" ? h("select", {
				"aria-label": t("destination"),
				value: createSource,
				onChange: (event) => setCreateSource(event.target.value)
			}, ...["user-dsh", "user-agents"].filter((id) => data?.sources?.some((item) => item.id === id)).map((id) => h("option", {
				key: id,
				value: id
			}, id === "user-dsh" ? "DSH" : "Shared Agents"))) : h("p", null, `${t("destination")}: ${destinationName()}`), field(t("skillName"), createName, setCreateName), field(t("skillDescription"), createDescription, setCreateDescription), h("textarea", {
				"aria-label": t("skillBody"),
				value: createBody,
				maxLength: 262144,
				onChange: (event) => setCreateBody(event.target.value)
			}), h("button", { type: "submit" }, t("create")), h("button", {
				type: "button",
				onClick: () => setCreating(false)
			}, t("cancel"))) : null, h("select", {
				"aria-label": t("scope"),
				value: scope,
				onChange: (e) => {
					setScope(e.target.value);
					setSource("");
					setNotice("");
				}
			}, h("option", { value: "global" }, t("scopeGlobal")), h("option", { value: "project" }, t("scopeProject")), h("option", { value: "discover" }, t("scopeDiscover")), h("option", { value: "trash" }, t("trash"))), inProject ? h("select", {
				"aria-label": t("project"),
				value: project,
				onChange: (e) => {
					setProject(e.target.value);
					setSource("");
					setNotice("");
				}
			}, h("option", { value: "" }, projects.length ? t("projectNone") : t("projectEmpty")), ...projects.map(projectOption)) : null, inProject ? h("p", null, t("projectHint")) : null, h("input", {
				"aria-label": t("search"),
				placeholder: t("search"),
				value: query,
				onChange: (e) => setQuery(e.target.value)
			}), h("select", {
				"aria-label": t("source"),
				value: source,
				onChange: (e) => setSource(e.target.value)
			}, h("option", { value: "" }, t("all")), ...(view?.sources ?? []).map((x) => h("option", {
				key: x.id,
				value: x.id
			}, sourceLabel(x)))), h("select", {
				"aria-label": t("any"),
				value: status,
				onChange: (e) => setStatus(e.target.value)
			}, ...[
				"",
				"enabled",
				"disabled",
				"invalid",
				"shadowed",
				"blocked"
			].map((x) => h("option", {
				key: x,
				value: x
			}, t(x || "any")))), h("select", {
				"aria-label": t("filterCategory"),
				value: activeCat,
				onChange: (e) => setCatFilter(e.target.value)
			}, h("option", { value: "" }, t("allCategories")), h("option", { value: "__none" }, t("uncategorized")), ...filterCategories.map((c) => h("option", {
				key: c.id,
				value: c.id
			}, c.name))), notice && !managing ? h("p", { role: "status" }, notice) : null, error ? h("div", { role: "alert" }, t("error"), h("button", { onClick: () => call({ action: "reload" }).then(setData, load) }, t("retry"))) : !data || switching ? h("p", { role: "status" }, t("loading")) : h(React.Fragment, null, inProject ? null : h("div", null, h("button", {
				"aria-expanded": managing,
				onClick: () => setManaging(!managing)
			}, t("folders")), managing ? manager() : null), inProject && data.project && !data.project.available ? h("p", { role: "alert" }, `${data.project.name}: ${t(`code.${data.project.code}`)}`) : null, ...(view.sources ?? []).filter((x) => !source || x.id === source).map((x) => h("details", {
				key: x.id,
				open: true
			}, h("summary", null, `${sourceLabel(x)} (${view.copies.filter((c) => c.source === x.id).length})`), h("p", null, x.group ? `${x.group} · ` : null, h("bdi", { dir: "ltr" }, x.path)), x.readonly ? h("p", null, t("readOnlySource")) : h("button", { onClick: () => toggle("source", x.id, x.enabled === false) }, `${t("toggleSource")} ${sourceLabel(x)}`), x.custom ? customControls(x) : null, data.corrupt ? null : organizer(x.id, sourceLabel(x)), ...copies.filter((c) => c.source === x.id).map((copy) => h("article", { key: copy.path }, h("strong", null, copy.name), ["user-dsh", "user-agents"].includes(copy.source) || copy.source === `project-dsh:${project}` ? h("button", {
				"aria-label": `${t("moveTrash")}: ${copy.name}`,
				disabled: switching || data.corrupt,
				onClick: () => void mutate({
					action: "trash",
					id: copy.path,
					source: copy.source,
					...selected
				}, (value) => {
					if (value.result?.warning) setNotice(`${t(`code.${value.result.warning}`)} ${value.result.path ?? ""}`);
				})
			}, t("moveTrash")) : null, h("p", null, copy.description), h("span", null, t(copyStatus(copy))), orgOf(copy.source).members[copy.name] ? h("span", null, orgOf(copy.source).categories.find((c) => c.id === orgOf(copy.source).members[copy.name])?.name) : null, orgOf(copy.source).notes[copy.name] ? h("p", { "data-note": true }, `${t("note")}: ${orgOf(copy.source).notes[copy.name]}`) : null, h("input", {
				"aria-label": `${t("note")}: ${copy.name}`,
				placeholder: t("noteHint"),
				maxLength: 500,
				title: t("noteLimit"),
				value: noteDrafts[`${copy.source}/${copy.name}`] ?? orgOf(copy.source).notes[copy.name] ?? "",
				onChange: (e) => setNoteDrafts({
					...noteDrafts,
					[`${copy.source}/${copy.name}`]: e.target.value
				})
			}), h("button", {
				"aria-label": `${t("saveNote")}: ${copy.name}`,
				onClick: () => void organize({
					action: "note",
					source: copy.source,
					name: copy.name,
					note: noteDrafts[`${copy.source}/${copy.name}`] ?? orgOf(copy.source).notes[copy.name] ?? ""
				}, () => {
					const next = { ...noteDrafts };
					delete next[`${copy.source}/${copy.name}`];
					setNoteDrafts(next);
				})
			}, t("saveNote")), h("button", {
				disabled: x.enabled === false || data.corrupt,
				"aria-label": `${t("copyCopy")}: ${copy.name} — ${copy.path}`,
				onClick: () => toggle("copy", copy.path, !copy.eligible)
			}, t("toggle")), h("button", { onClick: () => call({
				action: "detail",
				id: copy.path,
				...selected
			}, lifetime.current.signal).then((value) => {
				if (!lifetime.current.signal.aborted) {
					setDetailError(false);
					setDetail(value);
				}
			}).catch(() => {
				if (!lifetime.current.signal.aborted) setDetailError(true);
			}) }, t("details")))))), data.corrupt ? h("div", { role: "alert" }, t("stateLocked"), h("button", { onClick: () => call({ action: "reload" }).then(setData, load) }, t("reloadState"))) : null, copies.length ? null : h("p", null, t("empty")), ...(view.diagnostics ?? []).map((x, i) => h("p", { key: `${x.code}:${i}` }, diagnosticText(x)))), detailError ? h("p", { role: "alert" }, t("error")) : null, detail ? h("div", {
				role: "dialog",
				"aria-label": t("details"),
				ref: dialog,
				tabIndex: -1,
				onKeyDown: (event) => {
					if (event.key === "Escape") setDetail(null);
				}
			}, h("button", { onClick: () => setDetail(null) }, t("close")), h("h3", null, detail.name), h("p", null, detail.path), h("button", { onClick: () => copyText(detail.content).catch(() => setDetailError(true)) }, t("copyText")), h("p", null, `${t("modelInvocation")}: ${detail.author?.modelInvocable ? t("allowed") : t("denied")} · ${t("userInvocation")}: ${detail.author?.userInvocable ? t("allowed") : t("denied")}`), detail.shadowedBy ? h("p", null, `${t("shadowedBy")}: ${detail.shadowedBy}`) : null, ...(detail.diagnostics ?? []).map((x, i) => h("p", { key: `${x.code}:${i}` }, diagnosticText(x))), h("pre", null, detail.content)) : null);
		}
		let placement = "settings";
		let changePlacement = async () => {};
		const placementListeners = /* @__PURE__ */ new Set();
		let layout;
		const notifyPlacement = () => {
			for (const listener of placementListeners) listener();
		};
		function PlacementControl() {
			const [, rerender] = React.useState(0);
			const [problem, setProblem] = React.useState("");
			React.useEffect(() => {
				const listener = () => rerender((n) => n + 1);
				placementListeners.add(listener);
				return () => void placementListeners.delete(listener);
			}, []);
			return h("div", {
				"data-majed-skills-placement": true,
				dir: isArabic() ? "rtl" : void 0
			}, h("strong", null, t("placement")), h("p", null, t("placementHint")), ...[
				"both",
				"sidebar",
				"settings"
			].map((value) => h("button", {
				key: value,
				"aria-pressed": placement === value,
				onClick: () => {
					setProblem("");
					changePlacement(value).catch((failure) => setProblem(errorText(failure)));
				}
			}, t(`placement${value[0].toUpperCase()}${value.slice(1)}`))), problem ? h("p", { role: "alert" }, problem) : null);
		}
		const sidebarIcon = () => h("svg", {
			viewBox: "0 0 16 16",
			width: 16,
			height: 16,
			"aria-hidden": true
		}, h("path", {
			d: "M2 3h12v2H2zM2 7h12v2H2zM2 11h8v2H2z",
			fill: "currentColor"
		}));
		effect(() => {
			let offConfig, offSettings, offMain, offSidebar, disposed = false;
			const controller = new AbortController();
			const inSettings = () => placement === "both" || placement === "settings";
			const inSidebar = () => placement === "both" || placement === "sidebar";
			const reconcile = () => {
				if (disposed) return;
				if (inSettings() && !offSettings) offSettings = ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "majed-skills",
					order: 91,
					label: () => t("title")
				}, Section));
				else if (!inSettings() && offSettings) {
					offSettings();
					offSettings = void 0;
				}
				if (inSidebar() && !offSidebar) {
					offMain = ctx.slots.register({
						name: "main",
						key: "majed-skills",
						locale: "majed.skills",
						inject: () => ({})
					}, () => h(Section));
					offSidebar = ctx.slots.register({
						name: "sidebar.panellist",
						id: "majed-skills",
						order: 92,
						label: () => t("title"),
						locale: "majed.skills"
					}, sidebarIcon);
				} else if (!inSidebar() && offSidebar) {
					try {
						if (layout?.panelInfo?.getSnapshot?.().activePanelId === "majed-skills") layout.selectPanel?.(null);
					} catch {}
					offSidebar?.();
					offMain?.();
					offSidebar = offMain = void 0;
				}
			};
			const apply = (next) => {
				if (typeof next === "string" && [
					"both",
					"sidebar",
					"settings"
				].includes(next)) {
					if (next !== placement) {
						placement = next;
						notifyPlacement();
					}
				}
				reconcile();
			};
			changePlacement = async (value) => {
				const previous = placement;
				placement = value;
				notifyPlacement();
				reconcile();
				try {
					apply((await call({
						action: "placement",
						location: value
					})).placement);
				} catch (failure) {
					placement = previous;
					notifyPlacement();
					reconcile();
					throw failure;
				}
			};
			ctx.inject?.(["layout"], (injected) => {
				layout = injected?.layout ?? injected;
			});
			let delay = 3e3;
			let timer;
			const schedule = () => {
				if (!disposed) timer = setTimeout(() => void probe(), delay);
			};
			const probe = () => call({
				action: "ping",
				include: "placement"
			}, controller.signal).then((result) => {
				delay = 3e3;
				if (disposed) return;
				if (!offConfig) offConfig = ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
					name: "plugins.bundle.config",
					key: "majed-skills",
					locale: "majed.skills"
				}, (props) => props?.view === "summary" ? null : h(PlacementControl)));
				apply(result?.placement);
			}).catch(() => {
				delay = Math.min(delay * 2, 6e4);
			}).finally(schedule);
			probe();
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
		}, "majed-skills presence");
	}
}

//#endregion
//#region src/ImageGallery.tsx
/** Display box for a lone image (platform rule): long edge 240px with the
* rendered aspect ratio clamped to [0.25, 4] — the overflow is cropped by
* `object-fit: cover` — and never upscaled past the image's natural size. The
* crop anchor keeps the top of very tall images and the left of very wide
* ones, where the informative content usually starts. */
function singleFit(attachment) {
	const natural = attachment.width / attachment.height;
	const ratio = Math.min(4, Math.max(.25, natural));
	const box = ratio >= 1 ? {
		width: 240,
		height: 240 / ratio
	} : {
		width: 240 * ratio,
		height: 240
	};
	const scale = Math.min(1, attachment.width / box.width, attachment.height / box.height);
	return {
		width: Math.max(1, Math.round(box.width * scale)),
		height: Math.max(1, Math.round(box.height * scale)),
		objectPosition: natural < .25 ? "center top" : natural > 4 ? "left center" : "center"
	};
}
const styles$6 = {
	gallery: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		justifyContent: "flex-start"
	},
	frame: {
		display: "grid",
		placeItems: "center",
		overflow: "hidden",
		padding: 0,
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "var(--dsw-alias-interactive-bg-hover-solid)",
		cursor: "zoom-in"
	},
	tile: {
		width: 64,
		height: 64
	},
	img: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		display: "block"
	},
	loading: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)",
		padding: "0 8px"
	},
	error: {
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)",
		cursor: "pointer",
		border: "1px solid var(--dsw-alias-border-l2-darkmode-thin)",
		borderRadius: 8,
		background: "transparent",
		padding: "6px 10px"
	},
	overlay: {
		position: "fixed",
		inset: 0,
		zIndex: 1e3,
		display: "grid",
		placeItems: "center",
		background: "var(--dsw-alias-bg-mask-1)",
		padding: 24
	},
	overlayImg: {
		maxWidth: "92vw",
		maxHeight: "92vh",
		objectFit: "contain",
		borderRadius: 4
	},
	close: {
		position: "absolute",
		insetBlockStart: 12,
		insetInlineEnd: 12,
		width: 32,
		height: 32,
		display: "grid",
		placeItems: "center",
		border: "none",
		borderRadius: "50%",
		cursor: "pointer",
		background: "var(--dsw-alias-bg-layer-1)",
		color: "var(--dsw-alias-label-primary)",
		font: "var(--dsw-font-s-13)"
	}
};
/**
* Full-viewport original-image preview: backdrop or close-control click and
* Escape all dismiss; the image itself is inert so a click on it does not
* fall through to the backdrop dismissal.
*/
function ImageLightbox({ src, alt, labels, onClose }) {
	const closeButton = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		const opener = document.activeElement;
		closeButton.current?.focus();
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
			if (event.key === "Tab") {
				event.preventDefault();
				closeButton.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			opener?.focus();
		};
	}, [onClose]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": true,
		"aria-label": labels.dialog,
		style: styles$6.overlay,
		onClick: onClose,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt,
			style: styles$6.overlayImg,
			onClick: (event) => {
				event.stopPropagation();
			}
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
			ref: closeButton,
			type: "button",
			"aria-label": labels.close,
			style: styles$6.close,
			onClick: onClose,
			children: "×"
		})]
	});
}
/**
* Compact history renderer with retryable loading and click-to-open original
* preview. A lone image renders at its `singleFit` size; an image among
* several renders as a fixed 64px square tile.
*/
function MessageImage({ attachment, load, variant, labels }) {
	const [src, setSrc] = (0, react.useState)(null);
	const [error, setError] = (0, react.useState)(false);
	const [open, setOpen] = (0, react.useState)(false);
	const [attempt, setAttempt] = (0, react.useState)(0);
	const retry = (0, react.useCallback)(() => {
		setAttempt((a) => a + 1);
	}, []);
	const close = (0, react.useCallback)(() => {
		setOpen(false);
	}, []);
	const fit = (0, react.useMemo)(() => variant === "single" ? singleFit(attachment) : void 0, [attachment, variant]);
	(0, react.useEffect)(() => {
		let live = true;
		setError(false);
		setSrc(null);
		load(attachment).then((url) => {
			if (live) setSrc(url);
		}).catch(() => {
			if (live) setError(true);
		});
		return () => {
			live = false;
		};
	}, [
		attachment,
		load,
		attempt
	]);
	const label = attachment.name ?? labels.image;
	if (error) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: styles$6.error,
		onClick: retry,
		children: labels.loadFailed
	});
	const box = fit === void 0 ? styles$6.tile : {
		width: fit.width,
		height: fit.height
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		style: {
			...styles$6.frame,
			...box
		},
		title: labels.open,
		"aria-label": labels.openNamed(label),
		onClick: () => {
			if (src !== null) setOpen(true);
		},
		children: src === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
			style: styles$6.loading,
			children: labels.loading
		}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
			src,
			alt: label,
			style: {
				...styles$6.img,
				objectPosition: fit?.objectPosition
			},
			onError: () => {
				setOpen(false);
				setError(true);
			}
		})
	}), open && src !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageLightbox, {
		src,
		alt: label,
		labels: labels.lightbox,
		onClose: close
	})] });
}
/** Wrapping image group: a lone image renders large, several render as 64px
* square tiles (same rule as the platform gallery). */
function ImageGallery({ images, load, labels }) {
	if (images.length === 0) return null;
	const variant = images.length === 1 ? "single" : "tile";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		style: styles$6.gallery,
		children: images.map((image, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MessageImage, {
			attachment: image.attachment,
			load,
			variant,
			labels
		}, `${image.attachment.attachmentId}:${index}`))
	});
}

//#endregion
//#region src/subscriptions-rpc.ts
async function callSubscriptionsAuth$1(rpc, endpoint, payload) {
	const result = await rpc.call("/api", `majed-subscriptions.${endpoint}`, payload);
	if (!result?.ok) throw new Error(result?.error?.message ?? "Subscriptions unavailable");
	return result.value;
}

//#endregion
//#region locale/en.json
var subscriptions$1 = {
	"pageSettings": "Settings",
	"providerConfigured": "Account configured (inference not verified)",
	"providerAttention": "Provider needs attention",
	"freeProviders": "Free providers",
	"apiSubscription": "Subscription",
	"zenEnabled": "Enable OpenCode Zen",
	"zenDisabled": "Disabled — new requests are blocked",
	"zenRefresh": "Refresh status",
	"zenNoLogin": "Free models · no login required",
	"zenUnavailable": "OpenCode Zen is unavailable.",
	"zenReachable": "Gateway reachable (catalog only; inference not verified)",
	"zenUnreachable": "Gateway unreachable; fallback models may not be available.",
	"zenModelCount": "Available models",
	"zenSource_gateway": "Gateway catalog",
	"zenSource_static": "Static fallback",
	"zenSource_cache": "Cached fallback",
	"apiUnavailable": "Native API-provider remotes are unavailable. Browser admission must be verified before use.",
	"apiRefresh": "Refresh API providers",
	"apiLoading": "Loading native providers…",
	"apiFailed": "The native operation failed. Your draft is retained; refresh or retry. No remote diagnostic is displayed because it may contain sensitive data.",
	"apiConflict": "Settings changed underneath this editor. Your draft was not overwritten or applied. Cancel, refresh and reopen to reconcile your changes.",
	"apiPartial": "Provider settings were saved, but the key operation failed. Your key intent is retained; retry saves only the outstanding key operation.",
	"apiInvalid": "Check the route, HTTP(S) URL and model JSON. Custom endpoints need a base URL and at least one model.",
	"apiSaved": "Saved to native DSH settings.",
	"apiKeySet": "Key configured",
	"apiKeyMissing": "No key configured",
	"apiKeyUnknown": "Key status unavailable",
	"apiAccountUnknown": "Account status unavailable",
	"apiAdd": "Add provider",
	"apiEdit": "Edit provider",
	"apiDelete": "Delete added provider",
	"apiCustom": "Custom API",
	"apiCatalog": "Provider catalog",
	"apiChoose": "Choose a provider",
	"apiModelID": "Model ID",
	"apiModelName": "Model name",
	"apiModelAdd": "Add model",
	"apiModelRemove": "Remove model",
	"apiEditor": "API provider editor",
	"apiRoute": "Provider route (lowercase words separated by hyphens)",
	"apiName": "Display name",
	"apiURL": "Base URL",
	"apiProtocol": "Protocol",
	"apiKeyAction": "Key action",
	"apiKey_keep": "Keep current key",
	"apiKey_set": "Set or replace key",
	"apiKey_unset": "Remove stored key",
	"apiKey": "New key (write only)",
	"apiKeyLimit": "Stored keys are never read back. Settings and key writes are separate native operations, not a transaction. Removing a stored key may reveal an environment fallback. Deleting a provider does not delete shared credentials.",
	"apiFetch": "Fetch available models",
	"apiModels": "Models",
	"apiModelsHint": "Edit model IDs and names. Existing model capabilities and metadata are preserved. Fetch replaces this draft only; Apply saves it.",
	"apiSave": "Apply",
	"apiCancel": "Cancel provider edit",
	"antigravitySetupRequired": "Antigravity OAuth client configuration is malformed. Correct the configured client pair; stored accounts are retained.",
	"copilotDeviceHint": "Enter this code on the GitHub verification page.",
	"copyDeviceCode": "Copy code",
	"copilotProviderUnavailable": "Copilot is unavailable. Disable the reference component first.",
	"title": "AI Providers",
	"accounts": "Subscription accounts",
	"providers": "Model providers",
	"subscriptionProviders": "Subscription providers",
	"apiProviders": "API providers",
	"subscriptionAdd": "Add subscription provider",
	"accountCount": "account(s)",
	"subscriptionDetails": "Provider details",
	"providersHint": "Manage subscription accounts and usage. Use Add account below to sign in.",
	"accountsEmpty": "No subscription accounts yet.",
	"providersEmpty": "No API providers yet.",
	"unreachable": "The Subscriptions host component cannot be reached. Reconnect or check the component on the Plugins page.",
	"coexistence": "The reference plugin dsh-plugin-subscriptions is running too. Only one plugin can serve the shared provider ids (codex, claude, grok, copilot, antigravity) at a time; switch the reference plugin off before using providers from this component.",
	"loginProgress": "Login in progress…",
	"connected": "account(s) connected",
	"notLoggedIn": "Not logged in",
	"clientVersion": "Client version",
	"source_npm": "latest on npm",
	"source_local": "local CLI",
	"source_fallback": "built-in",
	"source_config": "configured",
	"addAccount": "Add account",
	"openAuthorization": "Open authorization page",
	"pasteCallback": "Paste callback URL or code",
	"submitCallback": "Submit",
	"cancelLogin": "Cancel",
	"unknownPlan": "Unknown plan",
	"expires": "Expires",
	"defaultAccount": "Default account",
	"makeDefault": "Make default",
	"logout": "Log out",
	"refreshUsage": "Refresh",
	"usageNotLoaded": "Loading usage…",
	"usageUnavailable": "No usage windows reported.",
	"window_session": "5-hour window",
	"window_weekly": "Weekly",
	"window_other": "Window",
	"resets": "resets",
	"resetCredits": "Usage limit resets",
	"creditExpiryUnknown": "Expiry unknown",
	"creditExpired": "Expired",
	"creditsUnavailable": "Reset credits could not be verified.",
	"useReset": "Use…",
	"confirmLogout": "Log this account out? Its stored credentials will be removed.",
	"confirmReset": "Confirm full reset",
	"resetAcknowledge": "I understand that one credit will be consumed.",
	"cancel": "Cancel",
	"confirm": "Consume 1 reset",
	"login": "Log in",
	"checking": "Checking…",
	"usageTitle": "Usage",
	"plan": "Plan",
	"available": "available",
	"fullReset": "Full reset",
	"providerUnavailable": "Codex unavailable: provider id already registered.",
	"clientVersionHint": "Requests present this CLI version, and newer models may require a recent one.",
	"manualSummary": "Browser flow not working? Paste the callback URL or code",
	"addAccountHint": "Browser authorization signs in whichever account the browser currently uses — switch accounts there first (or use an incognito window with the manual code below) to add a different one.",
	"resetGuard": "You can use this reset when weekly usage reaches at least 80%.",
	"resetRefresh": "Refresh usage to verify current limits and reset availability.",
	"resetReady": "Use this reset — the earliest-expiring credit. Confirmation required.",
	"resetWarning": "This consumes one credit and resets weekly + 5-hour limits. This interface cannot undo it. Confirmation expires in 60 seconds.",
	"intro": "Log a subscription provider in or out. Login opens the provider’s authorization page in a new tab; headless setups can paste the callback URL or code instead.",
	"proxyTestOk": "OK · HTTP {status} · {ms} ms",
	"proxyUsernamePlaceholder": "Proxy username",
	"accountsModels": "Pool model allowlist",
	"modelsContextInvalid": "Enter a positive whole number of tokens for {model}.",
	"proxyLoadFailed": "Failed to load proxy settings: {message}",
	"modelsSave": "Save changes",
	"modelsContextHint": "Leave blank to follow the provider. The requested window is capped by the account’s advertised maximum; account pools use the smallest member window. This controls local history and compaction, not the API’s capacity.",
	"usageRefresh": "Refresh",
	"accountsAlias": "Alias (optional)",
	"accountsSaveFailed": "Could not save changes: {message}",
	"proxyUrlPlaceholder": "http://localhost:7890",
	"proxyPasswordPlaceholder": "Leave blank to keep the saved password",
	"accountsModelsCount": "{count} selected",
	"modelDefaultsTitle": "Default reasoning effort",
	"proxyDialogTitle": "Proxy settings",
	"accountsIndependent": "Show an independent entry in the model picker",
	"modelDefaultsFilterEmpty": "No model matches “{query}”.",
	"modelsSubagentSpeed": "Subagent default speed",
	"accountsPoolEnabled": "Include in the LLM account pool",
	"modelsPartialSave": "Some reasoning defaults were saved. Remaining changes are still in the draft; retry to finish.",
	"accountsModelsAutomatic": "Allow all models, including future models",
	"proxySaveFailed": "Save failed: {message}",
	"proxyStatusError": "Config error: {message}",
	"proxyLoading": "Loading proxy settings…",
	"modelsEdit": "Edit model list",
	"proxyPassword": "Password",
	"proxyBypassPlaceholder": "127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "Subscription display name",
	"modelDisplayName": "Model display name",
	"accountsLoading": "Loading accounts…",
	"accountsLoadFailed": "Could not load account settings: {message}",
	"proxyUrlHint": "HTTP or HTTPS proxy only (Clash/mihomo, v2rayN…); socks is not supported.",
	"accountsIndependentHint": "Independent LLM routes use only this account, with no fallback to another account. This does not isolate tools or the whole session.",
	"modelsToolsHint": "Changes apply only to sessions created after saving. Existing sessions keep their tools. Shared tools remain available if any supporting provider is enabled.",
	"proxySaving": "Saving…",
	"subscriptionDisplayNameHint": "Used in the quota bar and subscription headings. Leave blank for the default.",
	"modelsUnavailable": "Currently unavailable",
	"speedFast": "Fast",
	"proxyClearPassword": "Clear the saved password",
	"proxyDialogClose": "Close",
	"proxySave": "Save",
	"modelsSelectAll": "Select all",
	"proxyUrl": "Proxy URL",
	"accountsCatalogUnavailable": "Model discovery is currently unavailable. Saved model selections are preserved.",
	"modelsAutomatic": "Automatically show all models, including new models",
	"speedStandard": "Standard",
	"modelsHint": "Configure model visibility, default reasoning effort, subagent speed, context and tools here; Save changes below submits them together with the account settings. Hidden models remain usable by existing sessions; tool changes apply to new sessions.",
	"modelDefaultsSaving": "Saving…",
	"accountsHint": "Choose which accounts serve pooled LLM requests. Pool exclusion applies only to LLM routing, not tools or session-wide isolation.",
	"accountsNoModels": "No models reported for this account.",
	"proxyUsername": "Username (optional)",
	"modelDefaultsFilterPlaceholder": "Filter models",
	"modelDefaultsLoading": "Loading models…",
	"proxyConfigure": "Configure…",
	"proxyTestFail": "Failed: {message}",
	"proxyTestOkDirect": "OK (DSH network settings) · HTTP {status} · {ms} ms",
	"modelsContextBounds": "Default {default} · Maximum {max}",
	"proxyStatusEnabled": "Enabled · {url}",
	"accountsModelsAll": "All models",
	"imageClose": "Close",
	"proxyStatusNone": "Plugin proxy disabled — using DSH network settings.",
	"modelDisplayNameHint": "Leave blank for the original name. Reasoning effort stays separate.",
	"proxyEnabled": "Route subscription requests through a proxy",
	"accountsTitle": "Manage {provider}",
	"proxyNote": "On DSH v0.1.3-alpha.1, prefer the host HTTP_PROXY / HTTPS_PROXY / ALL_PROXY / NO_PROXY settings and leave this plugin proxy disabled. This optional override is retained for older hosts and subscription-only routing. Disabled or bypassed requests use DSH network settings; they are not necessarily direct. Applies to token exchange, model APIs, usage and tools. Browser OAuth follows the browser/system proxy.",
	"proxyBypassHint": "Comma-separated hostnames that skip this plugin proxy and use DSH network settings.",
	"proxyCancel": "Cancel",
	"modelsContext": "Context (tokens)",
	"displayNameReset": "Restore default",
	"modelsTools": "Provider tools",
	"proxySaved": "Saved — new requests use the updated network settings.",
	"modelDefaultsRetry": "Retry",
	"proxyBypass": "Bypass hosts",
	"modelsSelectNone": "Clear selection",
	"modelDefaultsFollowProvider": "Follow provider",
	"proxyTesting": "Testing…",
	"accountsManage": "Manage",
	"accountsModelsHint": "Applies only to pooled LLM routing, not independent entries. An empty selection allows no models. Turning off pool participation keeps this selection for later.",
	"proxyTitle": "Proxy",
	"modelsSubagentSpeedHint": "Applies to subsequent subagent requests using this model, regardless of the parent model. Main conversations keep their own Speed setting. Fast requires model support.",
	"proxyTest": "Test",
	"proxyUsernameHint": "Username is optional",
	"proxyPasswordHint": "Leave blank to keep the saved password",
	"modelsWebSearch": "Web search",
	"modelsImage": "Image generation",
	"modelsVideo": "Video generation",
	"modelsSearch": "X search",
	"modelDefaultsLoadFailed": "Failed to load models: {message}",
	"modelDefaultsRefresh": "Refresh model lists",
	"modelDefaultsNoModels": "This provider reports no models.",
	"modelDefaultsNoAccount": "No connected accounts. Connect one on the provider card first.",
	"modelDefaultsDiscoveryFailed": "Model discovery failed or timed out. Use Refresh to try again.",
	"modelDefaultsSaveFailedNamed": "Save failed for {model}: {message}",
	"speed": "Speed",
	"speedStandardDescription": "Default speed",
	"speedFastDescription": "1.5x speed, more usage",
	"commandFast": "Switch the Codex speed tier (Standard/Fast)",
	"commandFastUnavailable": "The current model has no fast tier; /fast only works on Codex models whose catalog advertises one",
	"usageSessionShort": "5h",
	"usageWeeklyShort": "Wk",
	"usageBadgeReset": "Resets in {time}",
	"usageBadgeOpenDetails": "Open all accounts and quotas",
	"usageBadgeClose": "Close usage details",
	"usageBadgeTitle": "Subscription usage",
	"usageBadgeCurrent": "current",
	"usageBadgeMoreWindows": "More quota windows ({count})",
	"usageBadgeModelCount": "{count} model quotas",
	"usageBadgeModelUnavailable": "Current model quota unavailable",
	"usageBadgeDisplay": "Status-bar quota display",
	"usageBadgeDisplayRecent": "Current / most recent subscription only",
	"usageBadgeDisplayHidden": "Hidden",
	"usageBadgeDisplayHint": "Saved automatically in this browser. At most one subscription is shown; non-subscription models keep the most recent subscription selected in this view, or show nothing. Hiding does not affect usage details here.",
	"usageBadgeDisplaySaveFailed": "Could not save the display preference. Check browser storage permissions.",
	"usagePlan": "Plan: {plan}",
	"usageSession": "5-hour window",
	"usageWeekly": "Weekly",
	"usageWindow": "Window",
	"claudeProviderUnavailable": "Claude unavailable: provider id already registered.",
	"addAccountOAuth": "Browser authorization",
	"addAccountKeychain": "Import Claude Code",
	"claudeAddAccountHint": "Browser authorization signs in whichever account the browser currently uses. Import Claude Code copies the account Claude Code is signed in to and keeps it in sync; sign in with the claude command first.",
	"claudePromptCacheTtl": "Prompt cache lifetime",
	"claudePromptCacheTtlHint": "How long Anthropic keeps the conversation cache after its last use. Cache reads cost the same either way; a one-hour cache write costs 2× base input instead of 1.25×. Applies from the next turn.",
	"claudePromptCacheTtlDefault": "Follow config ({ttl})",
	"claudePromptCacheTtl5m": "5 minutes",
	"claudePromptCacheTtl1h": "1 hour",
	"usageEmpty": "No usage quotas reported.",
	"usageNoVisibleModels": "No quotas for the shown models.",
	"antigravityProviderUnavailable": "Antigravity registration is unavailable.",
	"grokProviderUnavailable": "Grok registration is unavailable.",
	"image": "Image",
	"viewImage": "View image",
	"viewImageNamed": "View {name}",
	"imageLoading": "Loading image…",
	"imageLoadFailed": "Could not load image. Retry",
	"imagePreview": "Image preview",
	"generating": "Generating image…",
	"generatingVideo": "Generating video…",
	"videoLoading": "Loading video…",
	"videoLoadFailed": "Could not load video: {message}",
	"videoPlaybackFailed": "The browser could not play this video."
};

//#endregion
//#region src/locales.ts
const en = subscriptions$1;

//#endregion
//#region src/ImageGenerateToolview.tsx
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon$1 = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH$1 = 60;
/**
* Build the ImageGallery loader over the `image` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving an attachment ref to a data URL.
*/
function createImageLoader(rpc) {
	return (attachment) => callSubscriptionsAuth$1(rpc, "image", { ...attachment }).then((result) => `data:${result.mediaType};base64,${result.dataBase64}`);
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
* @param key - dictionary key.
* @param params - `{name}` template params.
* @returns the template with params substituted.
*/
function fallbackTranslate$3(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt$1(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH$1 ? `${line.slice(0, PROMPT_MAX_LENGTH$1)}…` : line;
}
/** Flatten a settled result's text blocks (the degraded text-only route and the error line). */
function resultText$1(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/** Image attachments of a settled result; empty while running or on the text-only route. */
function resultImages(block) {
	if (!("kind" in block)) return [];
	const images = [];
	for (const part of block.content) if (part.type === "image") images.push({ attachment: part.attachment });
	return images;
}
const styles$5 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	}
};
/**
* The `image_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the gallery / text / error body.
*/
function ImageGenerateToolview(props) {
	const { block, load } = props;
	const t = props.t ?? fallbackTranslate$3;
	if (block === void 0) return null;
	const settled = "kind" in block;
	const argsRaw = (settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "";
	let references = 0;
	try {
		const args = JSON.parse(argsRaw);
		if (Array.isArray(args?.referenceImages)) references = args.referenceImages.length;
	} catch {}
	const title = `image_generate${references > 0 ? ` (${references} ref)` : ""}: ${derivePrompt$1(argsRaw)}`;
	const images = resultImages(block);
	const text = settled ? resultText$1(block) : "";
	const labels = {
		image: t("image"),
		open: t("viewImage"),
		openNamed: (name) => t("viewImageNamed", { name }),
		loading: t("imageLoading"),
		loadFailed: t("imageLoadFailed"),
		lightbox: {
			dialog: t("imagePreview"),
			close: t("imageClose")
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$5.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$5.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon$1, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$5.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.subtle,
				children: t("generating")
			}),
			settled && block.isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !block.isError && images.length > 0 && load !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ImageGallery, {
				images,
				load,
				labels
			}),
			settled && !block.isError && images.length === 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$5.output,
				children: text
			})
		]
	});
}

//#endregion
//#region src/VideoGenerateToolview.tsx
/** DSH 0.1.7 renamed IconSparkle16; resolving it by name keeps older hosts working too. */
const SparkleIcon = (_props) => null;
/** Title prompt truncation budget (characters). */
const PROMPT_MAX_LENGTH = 60;
/**
* Build the video loader over the `/subscriptions-auth` `video` endpoint.
* @param rpc - Connection RPC caller.
* @returns loader resolving a bare file name to the decoded bytes.
*/
function createVideoLoader(rpc) {
	return (name) => callSubscriptionsAuth$1(rpc, "video", { name });
}
/**
* English-dictionary fallback for a missing locale seat (standalone renders);
* the framework always supplies the namespace-bound one.
*/
function fallbackTranslate$2(key, params) {
	let text = en[key];
	for (const [name, value] of Object.entries(params ?? {})) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
/** Extract the prompt from the call's raw args JSON; falls back to the first string value, then the raw line. */
function derivePrompt(argsRaw) {
	let parsed;
	try {
		parsed = JSON.parse(argsRaw);
	} catch {
		parsed = void 0;
	}
	let prompt;
	if (typeof parsed === "object" && parsed !== null) {
		const args = parsed;
		if (typeof args.prompt === "string" && args.prompt !== "") prompt = args.prompt;
		else for (const value of Object.values(args)) if (typeof value === "string" && value !== "") {
			prompt = value;
			break;
		}
	}
	const line = (prompt ?? argsRaw).split("\n", 1)[0] ?? "";
	return line.length > PROMPT_MAX_LENGTH ? `${line.slice(0, PROMPT_MAX_LENGTH)}…` : line;
}
/** Flatten a settled result's text blocks (the fallback body and the error line). */
function resultText(block) {
	if (!("kind" in block)) return "";
	const parts = [];
	for (const part of block.content) if (part.type === "text") parts.push(part.text);
	if (parts.length === 0 && block.error !== void 0) parts.push(`${block.error.name}: ${block.error.code}`);
	return parts.join("\n");
}
/**
* The generated video's bare file name: presentation meta first (top-level
* dispatches), then the render text's "Saved video to …" line (nested
* dispatches compute no meta).
*/
function resolveFileName(block) {
	if (!("kind" in block)) return void 0;
	const meta = block.meta;
	if (typeof meta === "object" && meta !== null) {
		const fileName = meta.fileName;
		if (typeof fileName === "string" && fileName.length > 0) return fileName;
	}
	const match = /^Saved video to (.+\.mp4)/m.exec(resultText(block));
	if (match === null) return void 0;
	const path = match[1];
	return path.slice(path.lastIndexOf("/") + 1);
}
/** Decode a base64 payload into bytes (browser-side; no Buffer). */
function base64Bytes(dataBase64) {
	const binary = atob(dataBase64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
	return bytes;
}
const styles$4 = {
	container: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		padding: "4px 0"
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 6,
		minWidth: 0
	},
	icon: {
		display: "inline-flex",
		flexShrink: 0,
		color: "var(--dsw-alias-label-tertiary)"
	},
	title: {
		font: "var(--dsw-font-s-13)",
		color: "var(--dsw-alias-label-primary)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	subtle: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-tertiary)"
	},
	output: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-label-secondary)",
		whiteSpace: "pre-wrap",
		overflowWrap: "anywhere"
	},
	error: {
		margin: 0,
		font: "var(--dsw-font-s-12)",
		color: "var(--dsw-alias-state-error-primary)"
	},
	video: {
		display: "block",
		maxWidth: 480,
		width: "100%",
		borderRadius: 8,
		backgroundColor: "var(--dsw-alias-fill-tertiary)"
	}
};
/**
* The `video_generate` keyed toolview component.
* @param props - owner share, inject face, and locale seat (spread flat).
* @returns the call row plus, once settled, the player / text / error body.
*/
function VideoGenerateToolview(props) {
	const { block, loadVideo } = props;
	const t = props.t ?? fallbackTranslate$2;
	const settled = block !== void 0 && "kind" in block;
	const isError = settled && block.isError;
	const fileName = block !== void 0 && settled && !isError ? resolveFileName(block) : void 0;
	const [load, setLoad] = (0, react.useState)({ phase: "loading" });
	(0, react.useEffect)(() => {
		if (fileName === void 0 || loadVideo === void 0) return;
		let cancelled = false;
		let objectUrl;
		setLoad({ phase: "loading" });
		loadVideo(fileName).then((video) => {
			if (cancelled) return;
			objectUrl = URL.createObjectURL(new Blob([base64Bytes(video.dataBase64).slice()], { type: video.mediaType }));
			setLoad({
				phase: "ready",
				url: objectUrl
			});
		}, (error) => {
			if (cancelled) return;
			setLoad({
				phase: "failed",
				message: error instanceof Error ? error.message : String(error)
			});
		});
		return () => {
			cancelled = true;
			if (objectUrl !== void 0) URL.revokeObjectURL(objectUrl);
		};
	}, [fileName, loadVideo]);
	if (block === void 0) return null;
	const title = `video_generate: ${derivePrompt((settled ? block.call?.argsRaw : "argsRaw" in block ? block.argsRaw : void 0) ?? "")}`;
	const text = settled ? resultText(block) : "";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles$4.container,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles$4.row,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.icon,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SparkleIcon, { size: 14 })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					style: styles$4.title,
					children: title
				})]
			}),
			!settled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("generatingVideo")
			}),
			settled && isError && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: text.split("\n", 1)[0]
			}),
			settled && !isError && fileName !== void 0 && load.phase === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.subtle,
				children: t("videoLoading")
			}),
			settled && !isError && fileName !== void 0 && load.phase === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.error,
				children: t("videoLoadFailed", { message: load.message })
			}),
			settled && !isError && fileName !== void 0 && load.phase === "ready" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("video", {
				style: styles$4.video,
				src: load.url,
				controls: true,
				preload: "metadata",
				onError: () => setLoad({
					phase: "failed",
					message: t("videoPlaybackFailed")
				})
			}),
			settled && !isError && fileName === void 0 && text !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles$4.output,
				children: text
			})
		]
	});
}

//#endregion
//#region locale/ar.json
var subscriptions = {
	"pageSettings": "الإعدادات",
	"providerConfigured": "الحساب مُعدّ (لم يُتحقق من التوليد)",
	"providerAttention": "الموفّر يحتاج إلى المراجعة",
	"freeProviders": "الموفّرون المجانيون",
	"apiSubscription": "اشتراك",
	"zenEnabled": "تفعيل OpenCode Zen",
	"zenDisabled": "معطّل — لا تُقبل طلبات جديدة",
	"zenRefresh": "تحديث الحالة",
	"zenNoLogin": "نماذج مجانية · لا يلزم تسجيل الدخول",
	"zenUnavailable": "خدمة OpenCode Zen غير متاحة.",
	"zenReachable": "البوابة متاحة (قائمة النماذج فقط؛ لم يُتحقق من التوليد)",
	"zenUnreachable": "يتعذر الوصول للبوابة؛ قد لا تتاح النماذج الاحتياطية.",
	"zenModelCount": "النماذج المتاحة",
	"zenSource_gateway": "قائمة البوابة",
	"zenSource_static": "قائمة احتياطية ثابتة",
	"zenSource_cache": "قائمة احتياطية مخزنة",
	"apiUnavailable": "واجهات موفري API الأصلية غير متاحة. يجب التحقق من صلاحية المتصفح قبل الاستخدام.",
	"apiRefresh": "تحديث موفري API",
	"apiLoading": "جارٍ تحميل الموفرين الأصليين…",
	"apiFailed": "فشلت العملية الأصلية. حُفظت المسودة؛ حدّث أو أعد المحاولة. لا تُعرض تفاصيل الخطأ لأنها قد تحتوي على بيانات حساسة.",
	"apiConflict": "تغيّرت الإعدادات أثناء التحرير. لم تُستبدل مسودتك ولم تُطبّق. ألغِ التحرير وحدّث ثم افتح المحرر لمراجعة تغييراتك.",
	"apiPartial": "حُفظت إعدادات الموفر لكن عملية المفتاح فشلت. حُفظ طلب المفتاح؛ إعادة المحاولة تنفّذ عملية المفتاح المتبقية فقط.",
	"apiInvalid": "تحقق من المعرّف ورابط HTTP(S) وبيانات النماذج. الموفر المخصص يحتاج إلى رابط ونموذج واحد على الأقل.",
	"apiSaved": "حُفظ في إعدادات DSH الأصلية.",
	"apiKeySet": "المفتاح مُعدّ",
	"apiKeyMissing": "لا يوجد مفتاح مُعدّ",
	"apiKeyUnknown": "حالة المفتاح غير متاحة",
	"apiAccountUnknown": "حالة الحساب غير متاحة",
	"apiAdd": "إضافة موفر",
	"apiEdit": "تحرير الموفر",
	"apiDelete": "حذف الموفر المضاف",
	"apiCustom": "API مخصص",
	"apiCatalog": "دليل الموفرين",
	"apiChoose": "اختر موفرًا",
	"apiModelID": "معرّف النموذج",
	"apiModelName": "اسم النموذج",
	"apiModelAdd": "إضافة نموذج",
	"apiModelRemove": "إزالة النموذج",
	"apiEditor": "محرر موفر API",
	"apiRoute": "معرّف الموفر (كلمات لاتينية صغيرة تفصلها شرطات)",
	"apiName": "اسم العرض",
	"apiURL": "الرابط الأساسي",
	"apiProtocol": "البروتوكول",
	"apiKeyAction": "إجراء المفتاح",
	"apiKey_keep": "الاحتفاظ بالمفتاح الحالي",
	"apiKey_set": "تعيين المفتاح أو استبداله",
	"apiKey_unset": "إزالة المفتاح المخزّن",
	"apiKey": "مفتاح جديد (للكتابة فقط)",
	"apiKeyLimit": "لا تُقرأ المفاتيح المخزّنة مطلقًا. كتابة الإعدادات والمفتاح عمليتان أصليتان منفصلتان وليستا معاملة ذرية. إزالة المفتاح قد تكشف مفتاح البيئة البديل. حذف الموفر لا يحذف بيانات الاعتماد المشتركة.",
	"apiFetch": "جلب النماذج المتاحة",
	"apiModels": "النماذج",
	"apiModelsHint": "حرر معرّفات النماذج وأسماءها. تُحفظ القدرات والبيانات الحالية. الجلب يستبدل المسودة فقط؛ التطبيق يحفظها.",
	"apiSave": "تطبيق",
	"apiCancel": "إلغاء تحرير الموفر",
	"antigravitySetupRequired": "إعداد عميل OAuth في Antigravity غير صالح. صحّح بيانات العميل المُعدّة؛ تُحفظ الحسابات الحالية.",
	"copilotDeviceHint": "أدخل هذا الرمز في صفحة التحقق من GitHub.",
	"copyDeviceCode": "نسخ الرمز",
	"copilotProviderUnavailable": "Copilot غير متاح. أوقف المكوّن المرجعي أولًا.",
	"title": "موفّرو الذكاء الاصطناعي",
	"accounts": "حسابات الاشتراك",
	"providers": "موفّرو النماذج",
	"subscriptionProviders": "موفّرو الاشتراكات",
	"apiProviders": "موفّرو API",
	"subscriptionAdd": "إضافة موفّر اشتراك",
	"accountCount": "حساب",
	"subscriptionDetails": "تفاصيل الموفّر",
	"providersHint": "أدِر حسابات الاشتراك والاستخدام. استخدم إضافة حساب أدناه لتسجيل الدخول.",
	"accountsEmpty": "لا توجد حسابات اشتراك بعد.",
	"providersEmpty": "لا يوجد موفرو API بعد.",
	"unreachable": "يتعذر الوصول إلى مكوّن الاشتراكات على المضيف. أعد الاتصال أو تحقق من المكوّن في صفحة الإضافات.",
	"coexistence": "الإضافة المرجعية dsh-plugin-subscriptions تعمل أيضًا. يمكن لإضافة واحدة فقط تقديم معرّفات الموفّرين المشتركة (codex, claude, grok, copilot, antigravity) في الوقت نفسه؛ أوقف الإضافة المرجعية قبل استخدام الموفّرين من هذا المكوّن.",
	"loginProgress": "جارٍ تسجيل الدخول…",
	"connected": "حساب متصل",
	"notLoggedIn": "لم يتم تسجيل الدخول",
	"clientVersion": "إصدار العميل",
	"source_npm": "سجل npm",
	"source_local": "واجهة الأوامر المحلية",
	"source_fallback": "الإصدار الاحتياطي المرفق",
	"source_config": "الإعدادات",
	"addAccount": "إضافة حساب",
	"openAuthorization": "فتح صفحة التفويض",
	"pasteCallback": "ألصق رابط العودة أو الرمز",
	"submitCallback": "إرسال",
	"cancelLogin": "إلغاء",
	"unknownPlan": "خطة غير معروفة",
	"expires": "تنتهي الصلاحية",
	"defaultAccount": "الحساب الافتراضي",
	"makeDefault": "تعيين كافتراضي",
	"logout": "تسجيل الخروج",
	"refreshUsage": "تحديث",
	"usageNotLoaded": "جارٍ تحميل الاستخدام…",
	"usageUnavailable": "لم تُبلّغ أي فترات استخدام.",
	"window_session": "فترة خمس ساعات",
	"window_weekly": "أسبوعي",
	"window_other": "فترة الاستخدام",
	"resets": "إعادة التعيين",
	"resetCredits": "إعادات تعيين حدود الاستخدام",
	"creditExpiryUnknown": "انتهاء الصلاحية غير معروف",
	"creditExpired": "منتهي الصلاحية",
	"creditsUnavailable": "تعذر التحقق من أرصدة إعادة التعيين.",
	"useReset": "استخدام…",
	"confirmLogout": "هل تريد تسجيل خروج هذا الحساب؟ ستُحذف بيانات اعتماده المخزنة.",
	"confirmReset": "تأكيد إعادة التعيين الكاملة",
	"resetAcknowledge": "أفهم أن هذا سيستهلك رصيد إعادة تعيين واحدًا.",
	"cancel": "إلغاء",
	"confirm": "استهلاك رصيد واحد",
	"login": "تسجيل الدخول",
	"checking": "جارٍ التحقق…",
	"usageTitle": "الاستخدام",
	"plan": "الخطة",
	"available": "متاح",
	"fullReset": "إعادة تعيين كاملة",
	"providerUnavailable": "Codex غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"clientVersionHint": "تستخدم الطلبات إصدار واجهة الأوامر هذا؛ قد تتطلب النماذج الأحدث إصدارًا حديثًا.",
	"manualSummary": "هل تعذّر مسار المتصفح؟ ألصق رابط العودة أو الرمز",
	"addAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح — بدّل الحساب هناك أولًا (أو استخدم نافذة خاصة مع الرمز اليدوي أدناه) لإضافة حساب آخر.",
	"resetGuard": "يمكنك استخدام إعادة التعيين عندما يبلغ الاستخدام الأسبوعي 80٪ على الأقل.",
	"resetRefresh": "حدّث الاستخدام للتحقق من الحدود الحالية وتوفّر إعادة التعيين.",
	"resetReady": "استخدم الرصيد الأقرب لانتهاء الصلاحية. يلزم التأكيد.",
	"resetWarning": "يستهلك هذا رصيدًا واحدًا ويعيد تعيين الحد الأسبوعي وحد الخمس ساعات. لا يمكن التراجع من هذه الواجهة. ينتهي التأكيد بعد 60 ثانية.",
	"intro": "سجّل الدخول إلى موفّر اشتراك أو اخرج منه. يفتح تسجيل الدخول صفحة تفويض الموفّر في تبويب جديد؛ ويمكن لصق رابط العودة أو الرمز في الأنظمة بلا متصفح.",
	"proxyTestOk": "نجح · HTTP {status} · {ms} مللي ثانية",
	"proxyUsernamePlaceholder": "اسم مستخدم الوكيل",
	"accountsModels": "قائمة النماذج المسموح بها للمجموعة",
	"modelsContextInvalid": "أدخل عدداً صحيحاً موجباً لرموز {model}.",
	"proxyLoadFailed": "تعذر تحميل إعدادات الوكيل: {message}",
	"modelsSave": "حفظ التغييرات",
	"modelsContextHint": "اتركه فارغاً لاتباع المزوّد. يُقيّد بالحجم الأقصى المعلن للحساب؛ تستخدم المجموعة أصغر نافذة. يضبط السجل والضغط المحليين وليس سعة الواجهة.",
	"usageRefresh": "تحديث",
	"accountsAlias": "اسم مستعار (اختياري)",
	"accountsSaveFailed": "تعذر حفظ التغييرات: {message}",
	"proxyUrlPlaceholder": "مثال: http://localhost:7890",
	"proxyPasswordPlaceholder": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"accountsModelsCount": "{count} محدد",
	"modelDefaultsTitle": "مستوى الاستدلال الافتراضي",
	"proxyDialogTitle": "إعدادات الوكيل الشبكي",
	"accountsIndependent": "عرض إدخال مستقل في منتقي النماذج",
	"modelDefaultsFilterEmpty": "لا نموذج يطابق «{query}».",
	"modelsSubagentSpeed": "السرعة الافتراضية للوكيل الفرعي",
	"accountsPoolEnabled": "تضمين في مجموعة حسابات النماذج",
	"modelsPartialSave": "حُفظت بعض افتراضيات الاستدلال. التغييرات المتبقية ما زالت في المسودة؛ أعد المحاولة.",
	"accountsModelsAutomatic": "السماح بكل النماذج بما فيها المستقبلية",
	"proxySaveFailed": "تعذر الحفظ: {message}",
	"proxyStatusError": "خطأ إعداد: {message}",
	"proxyLoading": "جارٍ تحميل إعدادات الوكيل…",
	"modelsEdit": "تحرير قائمة النماذج",
	"proxyPassword": "كلمة المرور",
	"proxyBypassPlaceholder": "مثال: 127.0.0.1, localhost, *.example.com",
	"subscriptionDisplayName": "اسم عرض الاشتراك",
	"modelDisplayName": "اسم عرض النموذج",
	"accountsLoading": "جارٍ تحميل الحسابات…",
	"accountsLoadFailed": "تعذر تحميل إعدادات الحسابات: {message}",
	"proxyUrlHint": "وكيل HTTP أو HTTPS فقط؛ SOCKS غير مدعوم.",
	"accountsIndependentHint": "يستخدم المسار المستقل هذا الحساب فقط دون الرجوع إلى حساب آخر. لا يعزل الأدوات أو الجلسة.",
	"modelsToolsHint": "تنطبق التغييرات على الجلسات المنشأة بعد الحفظ فقط. تحتفظ الجلسات الحالية بأدواتها. تبقى الأدوات المشتركة متاحة إذا كان أي مزوّد داعم مفعّلاً.",
	"proxySaving": "جارٍ الحفظ…",
	"subscriptionDisplayNameHint": "يُستخدم في عناوين الاشتراك وشريط الحصة. اتركه فارغاً للاسم الافتراضي.",
	"modelsUnavailable": "غير متاح حالياً",
	"speedFast": "سريعة",
	"proxyClearPassword": "مسح كلمة المرور المحفوظة",
	"proxyDialogClose": "إغلاق",
	"proxySave": "حفظ",
	"modelsSelectAll": "تحديد الكل",
	"proxyUrl": "عنوان الوكيل",
	"accountsCatalogUnavailable": "اكتشاف النماذج غير متاح حالياً. تُحفظ التحديدات السابقة.",
	"modelsAutomatic": "إظهار كل النماذج تلقائياً بما فيها الجديدة",
	"speedStandard": "عادية",
	"modelsHint": "اضبط ظهور النماذج والاستدلال الافتراضي وسرعة الوكيل الفرعي والسياق والأدوات. يحفظ الزر أدناه هذه التغييرات مع إعدادات الحسابات. تبقى النماذج المخفية قابلة للاستخدام في الجلسات الحالية؛ تغييرات الأدوات للجلسات الجديدة.",
	"modelDefaultsSaving": "جارٍ الحفظ…",
	"accountsHint": "اختر الحسابات التي تخدم طلبات مجموعة النماذج. الاستبعاد لا يعزل الأدوات أو الجلسة بأكملها.",
	"accountsNoModels": "لم يُبلّغ عن نماذج لهذا الحساب.",
	"proxyUsername": "اسم المستخدم (اختياري)",
	"modelDefaultsFilterPlaceholder": "تصفية النماذج",
	"modelDefaultsLoading": "جارٍ تحميل النماذج…",
	"proxyConfigure": "تهيئة…",
	"proxyTestFail": "فشل: {message}",
	"proxyTestOkDirect": "نجح (إعدادات شبكة DSH) · HTTP {status} · {ms} مللي ثانية",
	"modelsContextBounds": "الافتراضي {default} · الحد الأقصى {max}",
	"proxyStatusEnabled": "مفعّل · {url}",
	"accountsModelsAll": "كل النماذج",
	"imageClose": "إغلاق",
	"proxyStatusNone": "وكيل الإضافة معطّل — تُستخدم إعدادات شبكة DSH.",
	"modelDisplayNameHint": "اتركه فارغاً للاسم الأصلي. يبقى مستوى الاستدلال مستقلاً.",
	"proxyEnabled": "توجيه طلبات الاشتراك عبر وكيل شبكي",
	"accountsTitle": "إدارة {provider}",
	"proxyNote": "يُفضّل استخدام إعدادات شبكة DSH وترك هذا التجاوز الاختياري معطّلاً. تستخدم الطلبات المستثناة أو المعطّلة إعدادات DSH ولا تكون مباشرة بالضرورة. ينطبق على تبادل الرموز وواجهات النماذج والاستخدام والأدوات. يتبع تسجيل الدخول إعدادات المتصفح والنظام.",
	"proxyBypassHint": "أسماء مضيفين مفصولة بفواصل تتجاوز وكيل الإضافة وتستخدم إعدادات شبكة DSH.",
	"proxyCancel": "إلغاء",
	"modelsContext": "السياق (رموز)",
	"displayNameReset": "استعادة الافتراضي",
	"modelsTools": "أدوات المزوّد",
	"proxySaved": "تم الحفظ — تستخدم الطلبات الجديدة الإعدادات المحدّثة.",
	"modelDefaultsRetry": "إعادة المحاولة",
	"proxyBypass": "مضيفون مستثنون",
	"modelsSelectNone": "مسح التحديد",
	"modelDefaultsFollowProvider": "اتباع المزوّد",
	"proxyTesting": "جارٍ الاختبار…",
	"accountsManage": "إدارة",
	"accountsModelsHint": "ينطبق على توجيه المجموعة فقط، لا الإدخالات المستقلة. التحديد الفارغ لا يسمح بأي نموذج. يُحفظ التحديد عند تعطيل المشاركة.",
	"proxyTitle": "الوكيل الشبكي",
	"modelsSubagentSpeedHint": "ينطبق على طلبات الوكيل الفرعي اللاحقة بهذا النموذج. تحتفظ المحادثات الرئيسية بسرعتها. تتطلب السرعة العالية دعم النموذج.",
	"proxyTest": "اختبار",
	"proxyUsernameHint": "اسم المستخدم اختياري",
	"proxyPasswordHint": "اتركها فارغة للاحتفاظ بكلمة المرور المحفوظة",
	"modelsWebSearch": "بحث الويب",
	"modelsImage": "توليد الصور",
	"modelsVideo": "توليد الفيديو",
	"modelsSearch": "بحث X",
	"modelDefaultsLoadFailed": "تعذر تحميل النماذج: {message}",
	"modelDefaultsRefresh": "تحديث قوائم النماذج",
	"modelDefaultsNoModels": "لم يُبلّغ المزوّد عن نماذج.",
	"modelDefaultsNoAccount": "لا حسابات متصلة. أضف حساباً أولاً.",
	"modelDefaultsDiscoveryFailed": "تعذر اكتشاف النماذج أو انتهت المهلة. حدّث لإعادة المحاولة.",
	"modelDefaultsSaveFailedNamed": "تعذر حفظ {model}: {message}",
	"speed": "السرعة",
	"speedStandardDescription": "السرعة الافتراضية",
	"speedFastDescription": "سرعة 1.5 ضعف، واستهلاك أكبر",
	"commandFast": "تبديل مستوى سرعة Codex (عادية/سريعة)",
	"commandFastUnavailable": "لا يدعم النموذج الحالي المستوى السريع؛ يعمل الأمر /fast فقط مع نماذج Codex التي يعلن كتالوجها عن مستوى سريع",
	"usageSessionShort": "5س",
	"usageWeeklyShort": "أسبوع",
	"usageBadgeReset": "إعادة التعيين خلال {time}",
	"usageBadgeOpenDetails": "عرض جميع الحسابات والحصص",
	"usageBadgeClose": "إغلاق تفاصيل الاستهلاك",
	"usageBadgeTitle": "استهلاك الاشتراك",
	"usageBadgeCurrent": "الحالي",
	"usageBadgeMoreWindows": "المزيد من نوافذ الحصة ({count})",
	"usageBadgeModelCount": "حصص {count} من النماذج",
	"usageBadgeModelUnavailable": "حصة النموذج الحالي غير متاحة",
	"usageBadgeDisplay": "عرض الحصة في شريط الحالة",
	"usageBadgeDisplayRecent": "الاشتراك الحالي / الأحدث فقط",
	"usageBadgeDisplayHidden": "مخفي",
	"usageBadgeDisplayHint": "يُحفظ تلقائيًا في هذا المتصفح. يُعرض اشتراك واحد على الأكثر؛ وتحتفظ النماذج غير المرتبطة باشتراك بآخر اشتراك تم اختياره في هذا العرض، أو لا تعرض شيئًا. لا يؤثر الإخفاء على تفاصيل الاستهلاك هنا.",
	"usageBadgeDisplaySaveFailed": "تعذر حفظ تفضيل العرض. تحقق من أذونات تخزين المتصفح.",
	"usagePlan": "الخطة: {plan}",
	"usageSession": "نافذة 5 ساعات",
	"usageWeekly": "أسبوعي",
	"usageWindow": "نافذة",
	"claudeProviderUnavailable": "Claude غير متاح: معرّف الموفّر مسجّل بالفعل.",
	"addAccountOAuth": "تفويض المتصفح",
	"addAccountKeychain": "استيراد من Claude Code",
	"claudeAddAccountHint": "يسجّل تفويض المتصفح الدخول بالحساب المستخدم حاليًا في المتصفح. ينسخ الاستيراد من Claude Code الحساب المسجَّل فيه ويبقيه متزامنًا؛ سجّل الدخول أولًا بالأمر claude.",
	"claudePromptCacheTtl": "مدة بقاء ذاكرة المطالبات المؤقتة",
	"claudePromptCacheTtlHint": "المدة التي تحتفظ بها Anthropic بذاكرة المحادثة المؤقتة بعد آخر استخدام. تكلفة قراءة الذاكرة واحدة في الحالتين؛ أما كتابة ذاكرة لمدة ساعة فتكلّف ضعف مدخلات الأساس بدل 1.25 ضعفًا. يسري من الدور التالي.",
	"claudePromptCacheTtlDefault": "اتباع الإعداد ({ttl})",
	"claudePromptCacheTtl5m": "5 دقائق",
	"claudePromptCacheTtl1h": "ساعة واحدة",
	"usageEmpty": "لم يتم الإبلاغ عن حصص استخدام.",
	"usageNoVisibleModels": "لا توجد حصص للنماذج المعروضة.",
	"antigravityProviderUnavailable": "تسجيل Antigravity غير متاح.",
	"grokProviderUnavailable": "تسجيل Grok غير متاح.",
	"image": "صورة",
	"viewImage": "عرض الصورة",
	"viewImageNamed": "عرض {name}",
	"imageLoading": "جارٍ تحميل الصورة…",
	"imageLoadFailed": "تعذر تحميل الصورة. أعد المحاولة",
	"imagePreview": "معاينة الصورة",
	"generating": "جارٍ إنشاء الصورة…",
	"generatingVideo": "جارٍ إنشاء الفيديو…",
	"videoLoading": "جارٍ تحميل الفيديو…",
	"videoLoadFailed": "تعذر تحميل الفيديو: {message}",
	"videoPlaybackFailed": "تعذر على المتصفح تشغيل هذا الفيديو."
};

//#endregion
//#region src/settings/subscriptions-rpc.ts
/**
* The node half mounts every endpoint as an exact POST route on the shared
* `/api` channel (`/api/majed-subscriptions.<endpoint>`), so the browser
* reaches it through the `/api` channel with a prefixed endpoint name.
* A dedicated channel is no longer used: since dsh 0.1.5 `rpc.handle`
* cannot register one from a plugin (see `src/auth/rpc.ts`).
*/
const SUBSCRIPTIONS_AUTH_CHANNEL = "/api";
const SUBSCRIPTIONS_AUTH_PREFIX = "majed-subscriptions.";
/** Business error returned by a `subscriptions-auth` endpoint (error branch message). */
var SubscriptionsAuthError = class extends Error {};
/**
* Call one `subscriptions-auth` endpoint and unwrap the business result.
* Shared by the settings section, the composer Speed toggle, the usage
* badge, and the image/video toolviews.
* @param rpc - Connection RPC caller.
* @param endpoint - endpoint name (`status`, `usage`, `image`, ...).
* @param payload - endpoint-owned request payload.
* @returns the success value, cast by the caller to the endpoint's shape.
*/
async function callSubscriptionsAuth(rpc, endpoint, payload) {
	let result;
	try {
		result = await rpc.call(SUBSCRIPTIONS_AUTH_CHANNEL, `${SUBSCRIPTIONS_AUTH_PREFIX}${endpoint}`, payload);
	} catch (error) {
		throw new SubscriptionsAuthError(error instanceof Error ? error.message : String(error));
	}
	if (!result.ok) throw new SubscriptionsAuthError(result.error.message);
	return result.value;
}

//#endregion
//#region src/settings/account-preferences.ts
/** Missing allowlist follows discovery; explicit [] must remain empty. */
function accountPoolSelection(account, models) {
	return new Set(account.poolModels ?? models.map((model) => model.id));
}
/** Retain unavailable saved IDs so a temporary catalog failure cannot erase them. */
function accountModelRows(account, preferences) {
	const known = new Set(account.models.map((model) => model.id));
	return [...account.models.map((model) => ({
		...model,
		unavailable: false
	})), ...(preferences.poolModels ?? []).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id,
		unavailable: true
	}))];
}

//#endregion
//#region src/settings/model-filter.ts
/**
* Which empty state the model list is in.
*
* `provider-empty` means the provider shows NO rows at all — the filter box cannot match
* anything in that state, and printing `No model matches “”.` next to it reads like a broken
* control rather than like an explanation (issue #147).
*
* `filter-empty` keeps the existing message for a query that filtered everything out of a
* provider that does have rows.
*/
function modelListState(total, matched) {
	if (total === 0) return "provider-empty";
	return matched === 0 ? "filter-empty" : "rows";
}
/**
* Row ids the editor can still show when discovery returned nothing: saved visibility,
* display names and subagent speeds must count towards the total —
* otherwise a temporary catalog failure would hide the rows that edit them.
*/
function savedModelIds(visibleModels, displayNames, subagentSpeeds = void 0) {
	return [...new Set([
		...visibleModels ?? [],
		...Object.keys(displayNames ?? {}),
		...Object.keys(subagentSpeeds ?? {})
	])];
}
/**
* Why the provider has no models — read from the data the host already sends.
*
* `total === 0` alone cannot tell these apart, and guessing wrong re-creates the very
* defect issue #147 is about: telling a user who IS logged in to go and log in. The
* catalog payload carries one row per connected account with `unavailable: true` when that
* account's discovery failed or timed out (src/index.ts).
*
*  · no account at all                       → `noAccount`;
*  · accounts exist, every discovery failed  → `discoveryFailed` (retry, not log in);
*  · a connected account answered (possibly with an empty catalog) → `noModels`.
*/
function modelEditorNotice(accounts) {
	if (accounts.length === 0) return "noAccount";
	return accounts.every((account) => account.unavailable === true) ? "discoveryFailed" : "noModels";
}
/** Locale keys for the three honest empty states. */
const NOTICE_KEYS = {
	noAccount: "modelDefaultsNoAccount",
	discoveryFailed: "modelDefaultsDiscoveryFailed",
	noModels: "modelDefaultsNoModels"
};
/**
* The editor's whole empty-state decision, in one testable place: how many rows exist
* (discovered + the user's saved ids), whether a query filtered them all out, and which
* notice to show when there are none.
*/
function modelEditorState(input) {
	return {
		listState: modelListState(input.discovered + input.saved, input.matched),
		noticeKey: NOTICE_KEYS[modelEditorNotice(input.accounts)]
	};
}

//#endregion
//#region src/settings/ProviderModelEditor.tsx
const border$1 = "0.5px solid var(--dsw-alias-border-l2, #ddd)";
const actions$1 = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/**
* Embedded section of the account manager dialog. It owns the model draft
* (visibility, effort, context, tools) but not its submission: the dialog
* collects the draft through the handle and saves it with the account edits
* in one go, so there is a single Save/Cancel pair.
*/
const ProviderModelEditor = (0, react.forwardRef)(function ProviderModelEditor$1({ provider, rpc, t, disabled = false, onDirtyChange }, ref) {
	const [catalog, setCatalog] = (0, react.useState)();
	const [draft, setDraft] = (0, react.useState)({});
	const [contexts, setContexts] = (0, react.useState)({});
	const [efforts, setEfforts] = (0, react.useState)({});
	const [query, setQuery] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)(false);
	const [dirty, setDirty] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	(0, react.useEffect)(() => {
		onDirtyChange?.(dirty);
	}, [dirty]);
	function reset(data) {
		setCatalog(data);
		setDraft(data.settings);
		setEfforts(Object.fromEntries(data.models.map((model) => [model.id, model.configured ?? ""])));
		setContexts(Object.fromEntries(Object.entries(data.settings.contextWindows ?? {}).map(([id, value]) => [id, String(value)])));
		setDirty(false);
	}
	async function load(force = false) {
		const request = ++generation.current;
		setBusy(true);
		setError("");
		try {
			const data = await callSubscriptionsAuth(rpc, "providerSettings", {
				provider,
				force
			});
			if (generation.current === request) reset(data);
		} catch (error$1) {
			if (generation.current === request) setError(String(error$1 instanceof Error ? error$1.message : error$1));
		} finally {
			if (generation.current === request) setBusy(false);
		}
	}
	function edit(next) {
		setDraft(next);
		setDirty(true);
	}
	(0, react.useEffect)(() => {
		load();
	}, [provider, rpc]);
	(0, react.useImperativeHandle)(ref, () => ({ collect() {
		if (!catalog || !dirty) return { efforts: [] };
		const windows = Object.create(null);
		for (const [model, text] of Object.entries(contexts)) {
			if (!text.trim()) continue;
			const value = Number(text);
			const limits = catalog.models.find((entry) => entry.id === model);
			if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(value) || value <= 0 || limits?.maxContextWindow !== void 0 && value > limits.maxContextWindow) {
				setError(t("modelsContextInvalid", { model }));
				return;
			}
			windows[model] = value;
		}
		setError("");
		const { accounts: _accounts,...settings } = {
			...draft,
			...provider === "codex" ? { contextWindows: windows } : {}
		};
		return {
			settings,
			original: catalog.settings,
			efforts: catalog.models.flatMap((model) => {
				const effort = efforts[model.id] ?? "";
				return effort === (model.configured ?? "") || !model.efforts?.length ? [] : [{
					model: model.id,
					effort
				}];
			})
		};
	} }), [
		catalog,
		dirty,
		draft,
		contexts,
		efforts,
		provider
	]);
	const allModels = catalog?.models ?? [];
	const known = new Set(allModels.map((model) => model.id));
	const missing = savedModelIds(draft.visibleModels, draft.modelDisplayNames, draft.subagentSpeeds).filter((id) => !known.has(id)).map((id) => ({
		id,
		name: id
	}));
	const customName = (id) => Object.hasOwn(draft.modelDisplayNames ?? {}, id) ? draft.modelDisplayNames[id] : "";
	const editName = (id, value) => {
		const names = Object.assign(Object.create(null), draft.modelDisplayNames);
		if (value.trim()) names[id] = value;
		else delete names[id];
		edit({
			...draft,
			modelDisplayNames: names
		});
	};
	const models = [...allModels, ...missing].filter((model) => `${model.name} ${model.id} ${customName(model.id)}`.toLowerCase().includes(query.trim().toLowerCase()));
	const editorState = modelEditorState({
		discovered: allModels.length,
		saved: missing.length,
		matched: models.length,
		accounts: catalog?.accounts ?? []
	});
	const selected = new Set(draft.visibleModels ?? allModels.map((model) => model.id));
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			borderBlockStart: border$1,
			marginBlockStart: 12,
			paddingBlockStart: 12
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
			style: { margin: 0 },
			children: t("modelsEdit")
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				display: "grid",
				gap: 12,
				marginBlockStart: 12
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "majed-subscription-hint",
					children: t("modelsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: actions$1,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "majed-subscription-quiet",
						disabled: busy || disabled || dirty,
						onClick: () => {
							load(true);
						},
						children: t("usageRefresh")
					}), busy && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						role: "status",
						children: t("modelDefaultsLoading")
					})]
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: busy || disabled,
					style: {
						border: 0,
						padding: 0,
						margin: 0,
						minWidth: 0,
						display: "grid",
						gap: 12
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.visibleModels === void 0,
								onChange: (event) => {
									const next = { ...draft };
									if (event.target.checked) delete next.visibleModels;
									else next.visibleModels = allModels.map((model) => model.id);
									edit(next);
								}
							}),
							" ",
							t("modelsAutomatic")
						] }),
						editorState.listState === "provider-empty" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "majed-subscription-hint",
							children: t(editorState.noticeKey)
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: actions$1,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: { flex: "1 1 180px" },
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: t("modelDefaultsFilterPlaceholder"),
									"aria-label": t("modelDefaultsFilterPlaceholder")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: allModels.map((model) => model.id)
									}),
									children: t("modelsSelectAll")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => edit({
										...draft,
										visibleModels: []
									}),
									children: t("modelsSelectNone")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								maxHeight: 360,
								overflowY: "auto",
								display: "grid",
								gap: 8
							},
							children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									borderBlockEnd: border$1,
									padding: "8px 2px",
									display: "grid",
									gap: 8
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: { overflowWrap: "anywhere" },
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: selected.has(model.id),
												onChange: (event) => {
													const next = new Set(selected);
													if (event.target.checked) next.add(model.id);
													else next.delete(model.id);
													edit({
														...draft,
														visibleModels: [...next]
													});
												}
											}),
											" ",
											model.name,
											!known.has(model.id) && ` (${t("modelsUnavailable")})`
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
										style: {
											color: "var(--dsw-alias-label-tertiary)",
											overflowWrap: "anywhere"
										},
										children: ["ID: ", model.id]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: {
												display: "grid",
												gap: 6,
												flex: "1 1 200px",
												minWidth: 0
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												style: { fontSize: 12 },
												children: t("modelDisplayName")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												maxLength: 80,
												"aria-label": `${model.name} ${t("modelDisplayName")}`,
												placeholder: model.name,
												value: customName(model.id),
												onChange: (event) => editName(model.id, event.target.value)
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											style: { alignSelf: "end" },
											"aria-label": `${model.name} ${t("displayNameReset")}`,
											disabled: !customName(model.id),
											onClick: () => editName(model.id, ""),
											children: t("displayNameReset")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										style: { color: "var(--dsw-alias-label-tertiary)" },
										children: t("modelDisplayNameHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: actions$1,
										children: [(model.efforts?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelDefaultsTitle"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelDefaultsTitle")}`,
												value: efforts[model.id] ?? "",
												onChange: (event) => {
													setEfforts({
														...efforts,
														[model.id]: event.target.value
													});
													setDirty(true);
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "",
														children: t("modelDefaultsFollowProvider")
													}),
													model.configured && !model.efforts?.some((effort) => effort.id === model.configured) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
														value: model.configured,
														disabled: true,
														children: [
															model.configured,
															" (",
															t("modelsUnavailable"),
															")"
														]
													}),
													model.efforts?.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: effort.id,
														children: effort.name
													}, effort.id))
												]
											})]
										}), provider === "codex" && model.maxContextWindow !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: actions$1,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												style: actions$1,
												children: [t("modelsContext"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													style: { width: 140 },
													inputMode: "numeric",
													value: contexts[model.id] ?? "",
													"aria-label": `${model.name} ${t("modelsContext")}`,
													placeholder: String(model.defaultContextWindow),
													onChange: (event) => {
														setContexts({
															...contexts,
															[model.id]: event.target.value
														});
														setDirty(true);
													}
												})]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextBounds", {
												default: model.defaultContextWindow,
												max: model.maxContextWindow
											}) })]
										})]
									}),
									provider === "codex" && (model.fastTier || Object.hasOwn(draft.subagentSpeeds ?? {}, model.id)) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											display: "grid",
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											style: actions$1,
											children: [t("modelsSubagentSpeed"), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												"aria-label": `${model.name} ${t("modelsSubagentSpeed")}`,
												value: Object.hasOwn(draft.subagentSpeeds ?? {}, model.id) ? draft.subagentSpeeds[model.id] : "standard",
												onChange: (event) => edit({
													...draft,
													subagentSpeeds: {
														...draft.subagentSpeeds,
														[model.id]: event.target.value
													}
												}),
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "standard",
													children: t("speedStandard")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("option", {
													value: "fast",
													disabled: !model.fastTier,
													children: [t("speedFast"), !model.fastTier && ` (${t("modelsUnavailable")})`]
												})]
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsSubagentSpeedHint") })]
									})
								]
							}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("modelDefaultsFilterEmpty", { query }) })]
						})] }),
						provider === "codex" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsContextHint") }),
						catalog.tools.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "grid",
								gap: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("modelsTools") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("modelsToolsHint") }),
								catalog.tools.map((tool) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: draft.tools?.[tool] !== false,
										onChange: (event) => edit({
											...draft,
											tools: {
												...draft.tools,
												[tool]: event.target.checked
											}
										})
									}),
									" ",
									t(tool === "image_generate" ? "modelsImage" : tool === "video_generate" ? "modelsVideo" : tool === "web_search" ? "modelsWebSearch" : "modelsSearch")
								] }, tool))
							]
						})
					]
				})
			]
		})]
	});
});

//#endregion
//#region src/settings/display-name-events.ts
/** Notify mounted views after a successful save, without another quota request. */
const DISPLAY_NAME_CHANGED = "majed-subscriptions-display-name-changed";
function notifyDisplayNameChange(provider, displayName) {
	window.dispatchEvent(new CustomEvent(DISPLAY_NAME_CHANGED, { detail: {
		provider,
		...displayName?.trim() ? { displayName: displayName.trim() } : {}
	} }));
}

//#endregion
//#region src/settings/provider-settings-styles.ts
/**
* The host loads one JS client bundle, so keep this small, scoped stylesheet
* with the dialog instead of relying on a separate CSS asset. Geometry and
* theme tokens follow the host's settings-form and ui-primitives controls.
*/
const formScope = ":is(.majed-subscription-manager, .majed-subscriptions-settings)";
const providerSettingsCss = `
.majed-subscription-manager {
  box-sizing: border-box;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-panel, 16px);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  box-shadow: var(--dsw-elevation-prominent, 0 20px 70px #0004);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
.majed-subscriptions-settings {
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  color-scheme: light;
}
body[data-ds-dark-theme] ${formScope} {
  color-scheme: dark;
}
.majed-subscription-manager::backdrop {
  background: var(--dsw-alias-bg-mask-1, #0006);
  backdrop-filter: var(--dsw-mask-blur, none);
}
${formScope} h2 {
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
}
${formScope} h3 {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} strong,
${formScope} .majed-subscription-label {
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
}
${formScope} legend {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
}
${formScope} small,
${formScope} .majed-subscription-hint,
${formScope} [role="status"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
${formScope} [role="alert"] {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} input:not([type="checkbox"]),
${formScope} select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}
${formScope} input::placeholder {
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
${formScope} input:not([type="checkbox"]):focus-visible,
${formScope} select:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-brand-primary));
}
${formScope} input:not([type="checkbox"]):disabled,
${formScope} select:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
${formScope} input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary, #b42318);
}
${formScope} option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
${formScope} label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}
${formScope} input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
${formScope} label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
${formScope} button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 28px;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
${formScope} button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-3));
}
${formScope} button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-3));
}
${formScope} button:disabled {
  opacity: 0.4;
  cursor: default;
}
${formScope} button.majed-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
${formScope} :is(footer, .majed-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
${formScope} button.majed-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
${formScope} button.majed-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
${formScope} button:focus-visible,
${formScope} input[type="checkbox"]:focus-visible,
${formScope} summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
${formScope} summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
${formScope} summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
`;
/** Composer controls retain their own geometry, separate from settings forms. */
const subscriptionChromeCss = `
.majed-subscription-usage-pill { corner-shape: round; touch-action: manipulation; }
.majed-subscription-usage-pill>svg { flex-shrink: 0; }
.majed-subscription-usage-close {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  inline-size: 28px; block-size: 28px; padding: 0; border: 0; border-radius: var(--dsw-radius-sm, 8px);
  color: var(--dsw-alias-label-secondary); background: transparent; cursor: pointer;
}
.majed-subscription-usage-close:hover { background: var(--dsw-alias-interactive-bg-hover); }
.majed-subscription-usage-close:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px;
}
@media (max-width: 480px) {
  .majed-subscription-usage-pill { max-inline-size: min(220px, calc(100vw - 24px)); }
  .majed-subscription-usage-panel { padding: 12px !important; }
}
.majed-subscription-usage-tooltip,
.majed-subscription-usage-panel {
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
  backdrop-filter: var(--dsw-menu-backdrop-filter, none);
}
.majed-subscription-speed button:hover:not(:disabled) {
  --majed-subscription-speed-hover: var(--dsw-alias-interactive-bg-hover);
}
.majed-subscription-speed button:active:not(:disabled) {
  --majed-subscription-speed-hover: var(--dsw-alias-interactive-bg-active);
}
.majed-subscription-speed button:disabled { opacity: 0.4; cursor: default; }
.majed-subscription-speed button:focus-visible,
.majed-subscription-usage-pill:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
`;

//#endregion
//#region src/settings/ProviderAccountManager.tsx
const PROMPT_CACHE_TTLS = ["5m", "1h"];
const border = "0.5px solid var(--dsw-alias-border-l2)";
const stack = {
	display: "grid",
	gap: 12,
	minWidth: 0
};
const actions = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	alignItems: "center"
};
/** Native top-layer dialog provides keyboard containment, Escape and focus restoration. */
function ProviderAccountManager({ provider, name, rpc, t, onClose }) {
	const dialog = (0, react.useRef)(null);
	const title = (0, react.useId)();
	const description = (0, react.useId)();
	const cacheTtlId = (0, react.useId)();
	const [catalog, setCatalog] = (0, react.useState)();
	const [changes, setChanges] = (0, react.useState)({});
	const [loading, setLoading] = (0, react.useState)(true);
	const [saving, setSaving] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)("");
	const [saveError, setSaveError] = (0, react.useState)("");
	const [attempt, setAttempt] = (0, react.useState)(0);
	const [modelsDirty, setModelsDirty] = (0, react.useState)(false);
	const [displayName, setDisplayName] = (0, react.useState)("");
	const [nameDirty, setNameDirty] = (0, react.useState)(false);
	/** '' follows the plugin config; otherwise an explicit TTL. */
	const [cacheTtl, setCacheTtl] = (0, react.useState)("");
	const [cacheTtlDirty, setCacheTtlDirty] = (0, react.useState)(false);
	const alive = (0, react.useRef)(true);
	const saveLock = (0, react.useRef)(false);
	const editor = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		alive.current = true;
		const element = dialog.current;
		const previous = document.activeElement;
		element.showModal();
		return () => {
			alive.current = false;
			element.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, []);
	(0, react.useEffect)(() => {
		let current = true;
		setLoading(true);
		setError("");
		callSubscriptionsAuth(rpc, "providerSettings", { provider }).then((data) => {
			if (current) {
				setCatalog(data);
				setDisplayName(data.settings.displayName ?? "");
				setCacheTtl(data.settings.promptCacheTtl ?? "");
			}
		}).catch((error$1) => {
			if (current) setError(t("accountsLoadFailed", { message: error$1 instanceof Error ? error$1.message : String(error$1) }));
		}).finally(() => {
			if (current) setLoading(false);
		});
		return () => {
			current = false;
		};
	}, [
		provider,
		rpc,
		attempt
	]);
	function edit(key, next) {
		setChanges((current) => ({
			...current,
			[key]: next
		}));
	}
	/**
	* One submit for both drafts: the model editor's (visibility, effort,
	* context, tools) and this dialog's account edits. A failure keeps the
	* dialog open with every edit intact.
	*/
	async function save() {
		if (saveLock.current) return;
		const models = editor.current === null ? { efforts: [] } : editor.current.collect();
		if (models === void 0) return;
		saveLock.current = true;
		setSaving(true);
		setSaveError("");
		let savedEfforts = 0;
		try {
			for (const { model, effort } of models.efforts) {
				await callSubscriptionsAuth(rpc, "setModelDefault", {
					provider,
					model,
					...effort ? { effort } : {}
				});
				savedEfforts++;
				if (!alive.current) return;
			}
			const original = catalog?.settings ?? {};
			const { accounts: _accounts, displayName: _name, promptCacheTtl: _ttl,...unchanged } = original;
			const savedName = nameDirty ? displayName.trim() : original.displayName;
			const savedTtl = cacheTtlDirty ? cacheTtl : original.promptCacheTtl;
			const { accounts: _editorAccounts, displayName: _editorName, promptCacheTtl: _editorTtl,...editorFields } = models.settings ?? unchanged;
			const settings = {
				...editorFields,
				...original.accounts || Object.keys(changes).length ? { accounts: {
					...original.accounts,
					...changes
				} } : {},
				...savedName ? { displayName: savedName } : {},
				...savedTtl ? { promptCacheTtl: savedTtl } : {}
			};
			await callSubscriptionsAuth(rpc, "setProviderSettings", {
				provider,
				settings,
				original
			});
			notifyDisplayNameChange(provider, settings.displayName);
			if (alive.current) onClose();
		} catch (error$1) {
			if (alive.current) {
				const message = error$1 instanceof Error ? error$1.message : String(error$1);
				setSaveError((savedEfforts ? t("modelsPartialSave") + " " : "") + t("accountsSaveFailed", { message }));
			}
		} finally {
			saveLock.current = false;
			if (alive.current) setSaving(false);
		}
	}
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
		className: "majed-subscription-manager",
		ref: dialog,
		"aria-labelledby": title,
		"aria-describedby": description,
		onCancel: (event) => {
			if (saveLock.current) event.preventDefault();
		},
		onClose,
		style: {
			width: 620,
			maxWidth: "calc(100vw - 32px)",
			maxHeight: "calc(100dvh - 32px)",
			overflow: "auto"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: providerSettingsCss }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			style: {
				...stack,
				padding: 20
			},
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
					style: {
						...actions,
						justifyContent: "space-between"
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						id: title,
						style: { margin: 0 },
						children: t("accountsTitle", { provider: name })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						autoFocus: true,
						disabled: saving,
						onClick: onClose,
						children: t("imageClose")
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					id: description,
					className: "majed-subscription-hint",
					children: t("accountsHint")
				}),
				error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "alert",
					children: error
				}),
				loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					role: "status",
					className: "majed-subscription-hint",
					children: t("accountsLoading")
				}),
				!loading && !catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setAttempt((value) => value + 1),
					children: t("modelDefaultsRetry")
				}),
				catalog && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
					disabled: saving || loading,
					style: {
						...stack,
						border: 0,
						margin: 0,
						padding: 0
					},
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									...stack,
									gap: 6
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("subscriptionDisplayName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									maxLength: 80,
									value: displayName,
									placeholder: name,
									onChange: (event) => {
										setDisplayName(event.target.value);
										setNameDirty(true);
									}
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									...actions,
									justifyContent: "space-between"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "majed-subscription-hint",
									children: t("subscriptionDisplayNameHint")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: !displayName,
									onClick: () => {
										setDisplayName("");
										setNameDirty(true);
									},
									children: t("displayNameReset")
								})]
							})]
						}),
						provider === "claude" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							style: {
								...stack,
								gap: 6,
								paddingBlockEnd: 8
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: cacheTtlId,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("claudePromptCacheTtl") })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									id: cacheTtlId,
									value: cacheTtl,
									style: { justifySelf: "start" },
									onChange: (event) => {
										setCacheTtl(event.target.value);
										setCacheTtlDirty(true);
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("claudePromptCacheTtlDefault", { ttl: catalog.promptCacheTtlDefault ?? "5m" })
									}), PROMPT_CACHE_TTLS.map((ttl) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: ttl,
										children: t(`claudePromptCacheTtl${ttl}`)
									}, ttl))]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: "majed-subscription-hint",
									children: t("claudePromptCacheTtlHint")
								})
							]
						}),
						catalog.accounts.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "majed-subscription-hint",
							children: t("accountsEmpty")
						}),
						catalog.accounts.map((account) => {
							const preferences = changes[account.key] ?? catalog.settings.accounts?.[account.key] ?? {};
							const selected = accountPoolSelection(preferences, account.models);
							const models = accountModelRows(account, preferences);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								style: {
									...stack,
									border,
									borderRadius: "var(--dsw-radius-lg, 12px)",
									padding: 14,
									margin: 0
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", {
										style: {
											padding: "0 6px",
											overflowWrap: "anywhere",
											maxWidth: "100%"
										},
										children: account.label
									}),
									account.unavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "majed-subscription-hint",
										children: t("accountsCatalogUnavailable")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											...stack,
											gap: 6
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "majed-subscription-label",
											children: t("accountsAlias")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: preferences.alias ?? "",
											placeholder: account.label,
											onChange: (event) => {
												const next = { ...preferences };
												if (event.target.value.trim()) next.alias = event.target.value;
												else delete next.alias;
												edit(account.key, next);
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.poolEnabled !== false,
											onChange: (event) => edit(account.key, {
												...preferences,
												poolEnabled: event.target.checked
											})
										}),
										" ",
										t("accountsPoolEnabled")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: preferences.independentEntry === true,
											onChange: (event) => edit(account.key, {
												...preferences,
												independentEntry: event.target.checked
											})
										}),
										" ",
										t("accountsIndependent")
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "majed-subscription-hint",
										children: t("accountsIndependentHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
										style: {
											cursor: "pointer",
											fontSize: 13
										},
										children: [
											t("accountsModels"),
											" ·",
											" ",
											preferences.poolModels === void 0 ? t("accountsModelsAll") : t("accountsModelsCount", { count: preferences.poolModels.length })
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											...stack,
											marginBlockStart: 12
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "majed-subscription-hint",
												children: t("accountsModelsHint")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: preferences.poolModels === void 0,
													onChange: (event) => {
														const next = { ...preferences };
														if (event.target.checked) delete next.poolModels;
														else next.poolModels = account.models.map((model) => model.id);
														edit(account.key, next);
													}
												}),
												" ",
												t("accountsModelsAutomatic")
											] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: actions,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: models.map((model) => model.id)
													}),
													children: t("modelsSelectAll")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => edit(account.key, {
														...preferences,
														poolModels: []
													}),
													children: t("modelsSelectNone")
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													...stack,
													gap: 8,
													maxHeight: 240,
													overflowY: "auto"
												},
												children: [models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													style: { overflowWrap: "anywhere" },
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: selected.has(model.id),
															onChange: (event) => {
																const next = new Set(selected);
																if (event.target.checked) next.add(model.id);
																else next.delete(model.id);
																edit(account.key, {
																	...preferences,
																	poolModels: [...next]
																});
															}
														}),
														" ",
														model.name,
														model.unavailable && ` (${t("modelsUnavailable")})`
													]
												}, model.id)), models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: "majed-subscription-hint",
													children: t("accountsNoModels")
												})]
											})
										]
									})] })
								]
							}, account.key);
						})
					]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderModelEditor, {
					ref: editor,
					provider,
					rpc,
					t,
					disabled: saving,
					onDirtyChange: setModelsDirty
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
					style: {
						...stack,
						gap: 8,
						borderBlockStart: border,
						padding: "14px 0 8px",
						position: "sticky",
						insetBlockEnd: 0,
						background: "var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1))"
					},
					children: [saveError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: saveError
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							...actions,
							justifyContent: "flex-end"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: saving,
							onClick: onClose,
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "majed-subscription-primary",
							disabled: loading || saving || !Object.keys(changes).length && !modelsDirty && !nameDirty && !cacheTtlDirty,
							onClick: () => {
								save();
							},
							children: saving ? t("modelDefaultsSaving") : t("modelsSave")
						})]
					})]
				})
			]
		})]
	});
}

//#endregion
//#region src/codex-card.ts
/** Scoped presentation port of V1ki v0.9.12 b802311; see PROVENANCE.md. */
const styles$3 = {
	section: {
		display: "flex",
		flexDirection: "column",
		gap: 12,
		maxInlineSize: 560,
		minInlineSize: 0,
		color: "var(--dsw-alias-label-primary)"
	},
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l2))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 8,
		minInlineSize: 0
	},
	cardHeader: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
		minInlineSize: 0
	},
	dot: {
		inlineSize: 8,
		blockSize: 8,
		borderRadius: "50%",
		flexShrink: 0
	},
	name: {
		fontSize: 14,
		lineHeight: "22px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)",
		overflowWrap: "anywhere",
		minInlineSize: 0
	},
	statusLine: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		overflowWrap: "anywhere"
	},
	clientVersion: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		fontVariantNumeric: "tabular-nums",
		overflowWrap: "anywhere"
	},
	errorLine: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-state-error-primary)",
		overflowWrap: "anywhere"
	},
	actions: {
		display: "flex",
		gap: 8,
		marginBlockStart: 4,
		alignItems: "center",
		flexWrap: "wrap"
	},
	usage: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		marginBlockStart: 4,
		borderBlockStart: "0.5px solid var(--dsw-alias-border-l2)",
		paddingBlockStart: 8
	},
	usageHeader: {
		display: "flex",
		alignItems: "center",
		gap: 8
	},
	usageTitle: {
		fontSize: 12,
		lineHeight: "18px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-secondary)"
	},
	usagePlan: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)"
	},
	usageRefresh: {
		minHeight: 22,
		blockSize: 22,
		padding: "0 8px",
		marginInlineStart: "auto"
	},
	usageRow: {
		display: "flex",
		flexDirection: "column",
		gap: 3
	},
	usageMeta: {
		display: "flex",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: 8,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-secondary)",
		overflowWrap: "anywhere"
	},
	accountRow: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		minInlineSize: 0,
		borderBlockStart: "0.5px solid var(--dsw-alias-border-l2)",
		paddingBlockStart: 12,
		marginBlockStart: 4
	},
	accountHeader: {
		display: "flex",
		alignItems: "center",
		flexWrap: "wrap",
		gap: 8,
		minInlineSize: 0
	},
	accountName: {
		fontSize: 13,
		lineHeight: "20px",
		color: "var(--dsw-alias-label-primary)",
		userSelect: "all",
		overflowWrap: "anywhere",
		minInlineSize: 0
	},
	starButton: {
		border: "none",
		padding: 0,
		inlineSize: 28,
		fontSize: 14,
		lineHeight: "22px",
		cursor: "pointer",
		color: "var(--dsw-alias-state-warn-label)"
	},
	usageTrack: {
		blockSize: 6,
		borderRadius: 3,
		overflow: "hidden",
		background: "var(--dsw-alias-bg-layer-1)",
		border: "0.5px solid var(--dsw-alias-border-l2)"
	},
	usageFill: {
		blockSize: "100%",
		borderRadius: 3
	},
	manual: {
		fontSize: 13,
		lineHeight: "20px"
	},
	manualRow: {
		display: "flex",
		flexWrap: "wrap",
		gap: 8,
		alignItems: "center",
		marginBlockStart: 8
	},
	manualInput: {
		flex: "1 1 200px",
		minInlineSize: 0
	},
	modal: {
		inlineSize: 460,
		maxInlineSize: "100%",
		maxHeight: "90vh",
		overflowY: "auto",
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		gap: 12,
		padding: "16px 18px",
		borderRadius: "var(--dsw-radius-panel, 28px)",
		background: "var(--dsw-alias-bg-layer-2)",
		border: 0,
		boxShadow: "var(--dsw-elevation-prominent)"
	},
	modalTitle: {
		fontSize: 16,
		lineHeight: "24px",
		fontWeight: 500,
		color: "var(--dsw-alias-label-primary)"
	}
};
/** Shared presentation only; account/usage controllers stay in their existing cards. */
function providerIdentity(h, t, name, accounts, usage, clientVersion) {
	const account = accounts.find((value) => value.isDefault) ?? accounts[0];
	const plan = account?.plan ?? usage[account?.key]?.plan;
	return h("div", { className: "majed-provider-identity" }, h("div", { className: "majed-provider-summary" }, h("span", { style: styles$3.name }, name), h("span", { style: styles$3.statusLine }, `${accounts.length} ${t("accountCount")}`), plan ? h("bdi", { style: styles$3.usagePlan }, plan) : null), clientVersion ? h("span", {
		style: styles$3.clientVersion,
		title: t("clientVersionHint")
	}, "CLI ", h("bdi", { dir: "ltr" }, clientVersion.version), " · ", t(`source_${clientVersion.source}`)) : null);
}
function providerStatus(h, t, state, label) {
	const color = state === "ready" ? "var(--dsw-alias-state-success-primary)" : state === "error" ? "var(--dsw-alias-state-error-primary)" : state === "warning" ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-label-secondary)";
	return h("span", {
		role: "img",
		"aria-label": t(label),
		title: t(label),
		"data-majed-provider-status": state,
		style: {
			...styles$3.dot,
			background: color
		}
	});
}
function providerDisclosure(h, t, name, expanded, toggle) {
	return h("button", {
		type: "button",
		className: "majed-provider-disclosure",
		"aria-label": `${t("subscriptionDetails")}: ${name}`,
		"aria-expanded": expanded,
		onClick: toggle
	}, h("svg", {
		"aria-hidden": true,
		width: 16,
		height: 16,
		viewBox: "0 0 16 16",
		style: { transform: expanded ? "rotate(90deg)" : void 0 }
	}, h("path", {
		d: "m6 3 5 5-5 5",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.5,
		strokeLinecap: "round",
		strokeLinejoin: "round"
	})));
}
const controlCss = `.majed-subscriptions-settings button.majed-provider-disclosure{inline-size:28px;min-height:28px;padding:0;border:0;background:transparent}
.majed-provider-identity{display:flex;flex-direction:column;flex:1 1 160px;min-inline-size:0}
.majed-provider-summary{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
[dir=rtl] .majed-provider-disclosure svg{scale:-1 1}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]),
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) select {
  box-sizing: border-box;
  min-width: 0;
  height: 34px;
  padding: 0 12px;
  border: 0.5px solid var(--dsw-alias-border-l4, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input::placeholder {
  color: var(--dsw-alias-label-secondary);
  opacity: 1;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):focus-visible,
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) select:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
  border-color: var(--dsw-alias-brand-primary);
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input:not([type="checkbox"]):disabled,
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) select:disabled {
  color: var(--dsw-alias-label-secondary);
  cursor: default;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input[aria-invalid="true"] {
  border-color: var(--dsw-alias-state-error-primary);
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) option {
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));
  color: var(--dsw-alias-label-primary);
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]) {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"] {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin: 2px 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: inherit;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) label:has(> input[type="checkbox"]:disabled) {
  cursor: default;
  opacity: 0.5;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 32px;
  max-inline-size: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  padding: 0 10px;
  border: 0.5px solid var(--dsw-alias-border-l3, var(--dsw-alias-border-l2));
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-1));
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active, var(--dsw-alias-bg-layer-1));
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button:disabled {
  opacity: 0.4;
  cursor: default;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-quiet {
  border-color: transparent;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) :is(footer, .majed-subscription-dialog-actions) button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: var(--dsw-radius-md, 8px);
  font-size: 13px;
  line-height: 1.5;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary {
  border-color: transparent;
  background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary));
  color: var(--dsw-alias-label-primary-foreground, var(--dsw-alias-bg-layer-1));
  font-weight: 500;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button.majed-subscription-primary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-secondary));
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) button:focus-visible,
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) input[type="checkbox"]:focus-visible,
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) summary:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) summary {
  border-radius: var(--dsw-radius-sm, 6px);
}
:is(.majed-subscriptions-page, .majed-subscriptions-settings, .majed-reset-dialog) summary:hover {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-primary));
}

.majed-reset-credits > summary::-webkit-details-marker { display:none; }
.majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
[dir="rtl"] .majed-reset-credits > summary > svg { transform:scaleX(-1); }
[dir="rtl"] .majed-reset-credits[open] > summary > svg { transform:rotate(90deg); }
.majed-reset-dialog::backdrop { background:var(--dsw-alias-bg-mask-1); backdrop-filter:var(--dsw-mask-blur, none); }
.majed-subscriptions-settings { font:var(--dsw-font-s-13); }
.majed-subscriptions-settings a { color:var(--dsw-alias-state-business-primary); text-underline-offset: .15em; }
`;
function createCodexCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	return function CodexCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const [acknowledged, setAcknowledged] = React.useState(false);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "codex",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.codex,
				registrationError: value.registrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (error$1) {
				if (alive.current) setError(error$1 instanceof Error ? error$1.message : String(error$1));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((error$1) => {
				if (alive.current) setError(error$1.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch(() => {});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((error$1) => {
					if (alive.current) setError(error$1.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (error$1) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: error$1 instanceof Error ? error$1.message : String(error$1) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString(void 0, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		});
		const part = (name, style, ...children) => h("div", {
			style,
			"data-majed-codex-part": name
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-codex-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "codex",
			name: status?.displayName || "Codex (ChatGPT)",
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, status?.displayName || "Codex (ChatGPT)", status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, status?.displayName || "Codex (ChatGPT)"), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, status?.displayName || "Codex (ChatGPT)", expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("providerUnavailable") : busy ? t("loginProgress") : status?.accounts?.length ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const credits = [...snapshot?.resetCredits ?? []].sort((a, b) => (a.expiresAt ?? Infinity) - (b.expiresAt ?? Infinity));
			const next = credits.find((credit) => credit.id && (credit.expiresAt === void 0 || credit.expiresAt > Date.now()));
			const weekly = snapshot?.windows?.find((window$1) => window$1.kind === "weekly" && !window$1.scope);
			const resetBlocked = !weekly || !Number.isFinite(weekly.usedPercent) || !weekly.resetsAt || weekly.resetsAt <= Date.now() || snapshot?.resetCreditsError ? "resetRefresh" : weekly.usedPercent < 80 ? "resetGuard" : !next ? "resetRefresh" : null;
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-codex-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => {
				setAcknowledged(false);
				setConfirmation({
					kind: "logout",
					account: account.key,
					label: account.account
				});
			}, false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			}), snapshot?.resetCreditsError ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, t("creditsUnavailable"), " ", snapshot.resetCreditsError) : null, snapshot?.resetCredits ? h("details", {
				className: "majed-reset-credits",
				style: styles$3.usageRow
			}, h("summary", { style: {
				...styles$3.usageMeta,
				cursor: "pointer",
				listStyle: "none",
				justifyContent: "flex-start",
				gap: 6
			} }, h("svg", {
				"aria-hidden": true,
				width: 12,
				height: 12,
				viewBox: "0 0 16 16"
			}, h("path", {
				d: "m6 3 5 5-5 5",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round"
			})), h("span", null, t("resetCredits")), h("span", { style: { marginInlineStart: "auto" } }, credits.filter((c) => c.id && (c.expiresAt === void 0 || c.expiresAt > Date.now())).length, " ", t("available"))), h("div", { style: {
				paddingInlineStart: 18,
				marginBlockStart: 6
			} }, ...credits.map((credit, index) => h("div", {
				key: credit.id ?? index,
				style: {
					...styles$3.usageMeta,
					minBlockSize: 28,
					gap: 12
				}
			}, h("span", { style: {
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				flexShrink: 0
			} }, t("fullReset"), credit === next ? button(t("useReset"), () => {
				if (!resetBlocked) action(async () => {
					const prepared = await call("prepareReset", { account: account.key });
					setAcknowledged(false);
					setConfirmation({
						kind: "reset",
						account: account.key,
						label: account.account ?? account.key,
						...prepared
					});
				});
			}, false, {
				"aria-disabled": !!resetBlocked,
				title: t(resetBlocked ?? "resetReady"),
				style: {
					blockSize: 22,
					minBlockSize: 22,
					padding: "0 7px",
					opacity: resetBlocked ? .35 : 1,
					cursor: resetBlocked ? "not-allowed" : "pointer"
				}
			}) : null), h("span", { style: { textAlign: "end" } }, credit.expiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(credit.expiresAt)), credit.expiresAt <= Date.now() ? ` · ${t("creditExpired")}` : null)))))) : null));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(status?.accounts?.length ? "addAccount" : "login"), startLogin, !!status?.registrationError)), presentation !== "group" && !busy && status?.accounts?.length ? h("p", { style: styles$3.statusLine }, t("addAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t(confirmation.kind === "logout" ? "confirmLogout" : "confirmReset")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), confirmation.kind === "reset" ? part("reset-context", styles$3.usageMeta, h("span", null, t("window_weekly")), h("strong", null, `${Math.round(confirmation.weeklyUsedPercent)}%`)) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, confirmation.creditExpiresAt === void 0 ? t("creditExpiryUnknown") : h("span", null, t("expires"), " ", h("bdi", null, date(confirmation.creditExpiresAt)))) : null, confirmation.kind === "reset" ? h("p", { style: styles$3.statusLine }, t("resetWarning")) : null, confirmation.kind === "reset" ? h("label", { style: {
			display: "flex",
			gap: 8,
			alignItems: "flex-start",
			fontSize: 12,
			lineHeight: "18px"
		} }, h("input", {
			type: "checkbox",
			checked: acknowledged,
			onChange: (event) => setAcknowledged(event.target.checked)
		}), t("resetAcknowledge")) : null, h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t(confirmation.kind === "reset" ? "confirm" : "logout"), () => {
			action(async () => {
				if (confirmation.kind === "logout") await call("logout", { account: confirmation.account });
				else await call("consumeReset", {
					account: confirmation.account,
					ticket: confirmation.ticket
				});
				setConfirmation(null);
				await refreshStatus();
				if (confirmation.kind === "reset") await refreshUsage(confirmation.account, true);
			});
		}, confirmation.kind === "reset" && (!acknowledged || Date.now() >= confirmation.expiresAt), { className: confirmation.kind === "reset" ? "majed-subscription-primary" : void 0 }))) : null);
	};
}

//#endregion
//#region src/settings/ProxySettings.tsx
/** Draft/test/save behavior ported from v0.9.12 SubscriptionsSection. Password never pre-fills. */
function ProxySettings({ rpc, t }) {
	const [view, setView] = (0, react.useState)();
	const [open, setOpen] = (0, react.useState)(false);
	const [draft, setDraft] = (0, react.useState)({});
	const [error, setError] = (0, react.useState)("");
	const [busy, setBusy] = (0, react.useState)("");
	const [result, setResult] = (0, react.useState)();
	const dialog = (0, react.useRef)(null);
	const generation = (0, react.useRef)(0);
	(0, react.useEffect)(() => () => {
		generation.current++;
	}, []);
	const close = () => {
		generation.current++;
		setOpen(false);
		setBusy("");
	};
	(0, react.useEffect)(() => {
		let alive = true;
		callSubscriptionsAuth(rpc, "proxyGet", {}).then((value) => {
			if (alive) setView(value);
		}).catch((reason) => {
			if (alive) setError(String(reason.message));
		});
		return () => {
			alive = false;
		};
	}, [rpc]);
	(0, react.useEffect)(() => {
		if (!open) return;
		const previous = document.activeElement;
		dialog.current?.showModal();
		return () => {
			dialog.current?.close();
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, [open]);
	const field = (key, value) => setDraft((old) => ({
		...old,
		[key]: value
	}));
	const run = async (test) => {
		if (busy) return;
		const request = ++generation.current;
		setBusy(test ? "test" : "save");
		setError("");
		setResult(void 0);
		const password = draft.clearPassword ? { password: null } : draft.password ? { password: draft.password } : {};
		try {
			if (test) {
				const tested = await callSubscriptionsAuth(rpc, "proxyTest", { proxy: {
					enabled: draft.enabled,
					url: draft.url.trim(),
					...draft.username.trim() !== "" ? { username: draft.username.trim() } : {},
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				} });
				if (generation.current === request) setResult(tested);
			} else {
				const saved = await callSubscriptionsAuth(rpc, "proxySet", {
					enabled: draft.enabled,
					url: draft.url.trim(),
					username: draft.username,
					...password,
					bypass: draft.bypass.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
				});
				if (generation.current === request) {
					setView(saved);
					setOpen(false);
				}
			}
		} catch (reason) {
			if (generation.current === request) setError(reason.message);
		} finally {
			if (generation.current === request) setBusy("");
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "majed-proxy-settings",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("proxyTitle") }),
				" ",
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					disabled: !view,
					onClick: () => {
						setDraft({
							...view,
							username: view.username ?? "",
							password: "",
							clearPassword: false,
							bypass: view.bypass.join(", ")
						});
						setError("");
						setResult(void 0);
						setOpen(true);
					},
					children: t("proxyConfigure")
				})
			] }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "status",
				children: view ? view.error ? t("proxyStatusError", { message: view.error }) : view.enabled ? t("proxyStatusEnabled", { url: view.url }) : t("proxyStatusNone") : t("proxyLoading")
			}),
			error && !open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				children: error
			}),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dialog", {
				className: "majed-subscription-manager majed-proxy-dialog",
				ref: dialog,
				"aria-labelledby": "majed-proxy-title",
				onCancel: close,
				style: {
					width: 620,
					maxWidth: "calc(100vw - 32px)",
					maxHeight: "calc(100dvh - 32px)",
					overflow: "auto"
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: providerSettingsCss }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: 14,
						padding: 20,
						minWidth: 0
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						style: {
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: 12
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							id: "majed-proxy-title",
							style: { margin: 0 },
							children: t("proxyDialogTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: close,
							children: t("imageClose")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "grid",
							gap: 12
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.enabled,
								onChange: (event) => field("enabled", event.target.checked)
							}), t("proxyEnabled")] }),
							[
								"url",
								"username",
								"password",
								"bypass"
							].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "grid",
									gap: 6,
									minWidth: 0
								},
								children: [
									t(`proxy${key[0].toUpperCase()}${key.slice(1)}`),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: key === "password" ? "password" : "text",
										autoComplete: "off",
										dir: key === "url" ? "ltr" : void 0,
										value: draft[key],
										onChange: (event) => field(key, event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										className: "majed-subscription-hint",
										children: t(`proxy${key[0].toUpperCase()}${key.slice(1)}Hint`)
									})
								]
							}, key)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.clearPassword,
								onChange: (event) => field("clearPassword", event.target.checked)
							}), t("proxyClearPassword")] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "majed-subscription-hint",
								children: t("proxyNote")
							}),
							error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "alert",
								children: error
							}),
							result && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								role: "status",
								children: result.ok ? t(result.viaProxy ? "proxyTestOk" : "proxyTestOkDirect", {
									status: String(result.status),
									ms: String(result.latencyMs)
								}) : t("proxyTestFail", { message: result.error ?? "" })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								style: {
									display: "flex",
									justifyContent: "flex-end",
									flexWrap: "wrap",
									gap: 8
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: !!busy,
										onClick: () => void run(true),
										children: t(busy === "test" ? "proxyTesting" : "proxyTest")
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: !!busy,
										onClick: () => void run(false),
										children: t(busy === "save" ? "proxySaving" : "proxySave")
									}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: close,
										children: t("proxyCancel")
									})
								]
							})
						]
					})]
				})]
			})
		]
	});
}

//#endregion
//#region src/api-providers.ts
function createApiProviders(React, remote, t, primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives")) {
	const h = React.createElement;
	const at = (value, path) => path.reduce((v, key) => v?.[key], value);
	const refOf = (entry, profile) => profile?.apiKeyEnv ?? `${entry.provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
	const copy = (value) => JSON.parse(JSON.stringify(value));
	const subscriptionIDs = new Set([
		"codex",
		"claude",
		"grok",
		"antigravity",
		"copilot",
		"opencode-zen"
	]);
	const control = {
		font: "inherit",
		color: "inherit",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		border: "0.5px solid var(--dsw-alias-border-l2)",
		borderRadius: "var(--dsw-radius-md, 12px)",
		padding: "6px 12px",
		minHeight: "36px",
		minWidth: 0,
		boxSizing: "border-box"
	};
	return function ApiProviders({ subscriptions: subscriptions$2, showAPI = true, showSubscriptionAdd = true } = {}) {
		const [subscription, setSubscription] = React.useState("");
		const [authFlow, setAuthFlow] = React.useState(null);
		const [snapshot, setSnapshot] = React.useState(null);
		const [draft, setDraft] = React.useState(null);
		const [addOpen, setAddOpen] = React.useState(false);
		const [addMode, setAddMode] = React.useState("catalog");
		const [message, setMessage] = React.useState("");
		const [busy, setBusy] = React.useState(false);
		const generation = React.useRef(0);
		const mounted = React.useRef(true);
		const addButton = React.useRef(null);
		const subscriptionAddButton = React.useRef(null);
		const addOrigin = React.useRef("api");
		const restoreAddFocus = React.useRef(false);
		const visitedDrafts = React.useRef({});
		React.useEffect(() => {
			if (!addOpen && restoreAddFocus.current) {
				restoreAddFocus.current = false;
				(addOrigin.current === "subscription" ? subscriptionAddButton : addButton).current?.focus();
			}
		}, [addOpen]);
		const valueOf = (result) => {
			if (!result.ok) throw new Error(result.error?.code === "settings/conflict" ? "apiConflict" : "apiFailed");
			return result.value;
		};
		async function load() {
			const sequence = ++generation.current;
			if (!remote) return;
			try {
				const [settings, directory, registered] = await Promise.all([
					remote.settings.describe(),
					remote.llm.listConfigurableProviders(),
					remote.llm.listProviders()
				]);
				const described = valueOf(settings);
				const entries = valueOf(directory);
				const providers = valueOf(registered);
				const configuredIDs = Object.keys(described.namespaces.find((n) => n.ns === "llm-pi-ai")?.value?.providers ?? {});
				const occupiedIDs = new Set([
					...entries.map((entry) => entry.provider),
					...providers.map((provider) => provider.id),
					...configuredIDs
				]);
				const rows = entries.filter((entry) => !subscriptionIDs.has(entry.provider));
				for (const provider of providers) if (!subscriptionIDs.has(provider.id) && !rows.some((e) => e.provider === provider.id)) rows.push({
					provider: provider.id,
					displayName: provider.name,
					settingsNs: "",
					settingsPath: []
				});
				rows.sort((a, b) => rank(a.provider) - rank(b.provider));
				const refs = [...new Set(rows.flatMap((e) => {
					if (e.provider === "deepseek-account") return [];
					const profile = at(described.namespaces.find((n) => n.ns === e.settingsNs)?.value, e.settingsPath);
					return profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(e, profile), ...e.nativeAuth?.env ?? []];
				}))];
				const credentials = {};
				for (let i = 0; i < refs.length; i += 64) Object.assign(credentials, valueOf(await remote.credentials.describe(refs.slice(i, i + 64))));
				if (mounted.current && sequence === generation.current) setSnapshot({
					...described,
					rows,
					credentials,
					occupiedIDs
				});
			} catch {
				if (mounted.current && sequence === generation.current) setMessage("apiFailed");
			}
		}
		function rank(id) {
			return id === "deepseek-account" ? 0 : id === "deepseek-official" ? 1 : 2;
		}
		React.useEffect(() => {
			mounted.current = true;
			load();
			const refresh = () => {
				load();
			};
			const disposers = !remote ? [] : [
				"settings/document-updated",
				"credentials/reference-updated",
				"credentials/record-updated",
				"llm/adapters-updated"
			].map((event) => remote.$on(event, refresh));
			return () => {
				mounted.current = false;
				generation.current++;
				disposers.forEach((off) => off());
			};
		}, []);
		const nsOf = (e) => snapshot.namespaces.find((n) => n.ns === e.settingsNs);
		const removable = (e, ns) => e.declared === true && e.settingsPath.length > 0 && at(ns?.user, e.settingsPath) !== void 0 && at(ns?.base, e.settingsPath) === void 0;
		function edit(entry) {
			const ns = nsOf(entry);
			if (!ns) return;
			const profile = at(ns.value, entry.settingsPath) ?? {};
			setMessage("");
			setDraft({
				entry,
				revision: ns.revision,
				user: copy(at(ns.user, entry.settingsPath) ?? {}),
				profile: copy(profile),
				key: "",
				keyAction: "keep",
				models: copy(profile.models ?? []),
				isNew: at(ns.value, entry.settingsPath) === void 0,
				custom: false
			});
		}
		function custom() {
			const ns = snapshot.namespaces.find((n) => n.ns === "llm-pi-ai");
			setMessage("");
			setDraft({
				entry: {
					provider: "",
					settingsNs: "llm-pi-ai",
					settingsPath: [],
					declared: true
				},
				revision: ns.revision,
				user: {},
				profile: {
					api: "openai-completions",
					baseURL: "",
					displayName: ""
				},
				key: "",
				keyAction: "keep",
				models: [],
				isNew: true,
				custom: true
			});
		}
		function switchMode(mode) {
			if (busy || authFlow?.busy || mode === addMode) return;
			if (draft) visitedDrafts.current[addMode] = {
				...draft,
				key: "",
				keyAction: "keep"
			};
			setAuthFlow(null);
			setAddMode(mode);
			setMessage("");
			if (visitedDrafts.current[mode]) setDraft(visitedDrafts.current[mode]);
			else {
				setDraft(null);
				if (mode === "custom") custom();
				else if (mode === "catalog" && addable[0]) edit(addable[0]);
			}
		}
		const change = (field$1, value) => setDraft((d) => ({
			...d,
			[field$1]: value
		}));
		const profileChange = (field$1, value) => setDraft((d) => ({
			...d,
			profile: {
				...d.profile,
				[field$1]: value
			}
		}));
		async function run(action) {
			if (busy) return;
			setBusy(true);
			setMessage("");
			try {
				await action();
			} catch (error) {
				if (mounted.current) setMessage(error instanceof Error && [
					"apiConflict",
					"apiInvalid",
					"apiPartial"
				].includes(error.message) ? error.message : "apiFailed");
			} finally {
				if (mounted.current) setBusy(false);
			}
		}
		function parsedModels() {
			const models = draft.models;
			if (!Array.isArray(models) || models.some((m) => !m || typeof m.id !== "string" || !m.id.trim() || m.name !== void 0 && typeof m.name !== "string" || ["contextWindow", "maxTokens"].some((k) => m[k] !== void 0 && (!Number.isInteger(m[k]) || m[k] < 1)) || m.input !== void 0 && (!Array.isArray(m.input) || m.input.some((v) => !["text", "image"].includes(v))) || m.reasoningEfforts !== void 0 && m.reasoningEfforts !== false && (typeof m.reasoningEfforts !== "object" || m.reasoningEfforts === null || Array.isArray(m.reasoningEfforts)))) throw new Error("apiInvalid");
			if (new Set(models.map((m) => m.id)).size !== models.length) throw new Error("apiInvalid");
			return models;
		}
		async function save() {
			let entry = draft.entry;
			if (draft.custom) {
				if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.provider) || subscriptionIDs.has(entry.provider) || snapshot.occupiedIDs.has(entry.provider)) throw new Error("apiInvalid");
				entry = {
					...entry,
					settingsPath: ["providers", entry.provider]
				};
			}
			if (draft.profile.baseURL) try {
				const url = new URL(draft.profile.baseURL);
				if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
			} catch {
				throw new Error("apiInvalid");
			}
			const models = parsedModels();
			if (draft.custom && (!draft.profile.baseURL || models.length === 0)) throw new Error("apiInvalid");
			const next = { ...draft.user };
			for (const field$1 of ["displayName", "baseURL"]) if (draft.profile[field$1]?.trim()) next[field$1] = draft.profile[field$1].trim();
			else delete next[field$1];
			next.models = models;
			if (draft.custom) next.api = draft.profile.api;
			const ref = refOf(entry, draft.profile);
			if (draft.keyAction !== "keep" && snapshot.credentials[ref]?.writable === false) throw new Error("apiFailed");
			if (draft.keyAction === "set") {
				if (!draft.key.trim() || /[\r\n]/.test(draft.key)) throw new Error("apiInvalid");
				next.apiKeyEnv = ref;
			}
			const ops = [];
			for (const field$1 of ["displayName", "baseURL"]) if (field$1 in draft.user && !(field$1 in next)) ops.push({
				op: "unset",
				path: [...entry.settingsPath, field$1]
			});
			for (const field$1 of Object.keys(next)) if (JSON.stringify(next[field$1]) !== JSON.stringify(draft.user[field$1])) ops.push({
				op: "set",
				path: [...entry.settingsPath, field$1],
				value: next[field$1]
			});
			if (draft.isNew && ops.length === 0) ops.push({
				op: "set",
				path: entry.settingsPath,
				value: {}
			});
			let committed = false;
			if (ops.length) {
				const view = valueOf(await remote.settings.mutate(entry.settingsNs, ops, draft.revision));
				committed = true;
				if (mounted.current) setDraft((d) => ({
					...d,
					entry,
					revision: view.revision,
					user: copy(next),
					isNew: false,
					custom: false
				}));
			}
			if (draft.keyAction !== "keep") try {
				if (!(draft.keyAction === "set" ? await remote.credentials.set(ref, draft.key.trim()) : await remote.credentials.unset(ref)).ok) throw new Error("apiFailed");
			} catch {
				throw new Error(committed ? "apiPartial" : "apiFailed");
			}
			if (mounted.current) {
				restoreAddFocus.current = addOpen;
				visitedDrafts.current = {};
				setDraft(null);
				setAddOpen(false);
				setMessage("apiSaved");
			}
			await load();
		}
		async function discover() {
			const request = {
				provider: draft.entry.provider,
				baseURL: draft.profile.baseURL,
				api: draft.profile.api
			};
			if (draft.keyAction === "set" && draft.key.trim()) request.apiKey = draft.key.trim();
			const models = valueOf(await remote.llm.discoverModels(draft.entry.settingsNs, request)).map(({ inputModalities,...model }) => ({
				...model,
				...inputModalities === void 0 ? {} : { input: inputModalities }
			}));
			if (mounted.current) change("models", models);
		}
		async function remove(entry) {
			const ns = nsOf(entry);
			if (!removable(entry, ns)) throw new Error("apiInvalid");
			valueOf(await remote.settings.mutate(ns.ns, [{
				op: "unset",
				path: entry.settingsPath
			}], ns.revision));
			setMessage("apiSaved");
			await load();
		}
		const button = (key, onClick, disabled = false, cancellation = false) => h("button", {
			type: "button",
			className: key === "apiAdd" ? "majed-api-add-trigger" : void 0,
			style: {
				...control,
				...key === "apiAdd" ? {
					inlineSize: "100%",
					minHeight: 44,
					borderStyle: "dashed",
					background: "transparent"
				} : {}
			},
			onClick,
			disabled: busy || !cancellation && !!authFlow?.busy || disabled,
			...key === "apiAdd" ? { ref: addButton } : {}
		}, t(key));
		const field = (key, value, onChange, type = "text") => h("label", { className: "majed-api-field" }, t(key), h("input", {
			"aria-label": t(key),
			type,
			value,
			autoComplete: "off",
			style: control,
			disabled: busy,
			onChange: (e) => onChange(e.target.value),
			dir: [
				"apiRoute",
				"apiURL",
				"apiModelID",
				"apiKey"
			].includes(key) ? "ltr" : "auto"
		}));
		const configured = (entry) => {
			const ns = nsOf(entry);
			return ns !== void 0 && (entry.settingsPath.length === 0 || at(ns.value, entry.settingsPath) !== void 0);
		};
		const addable = snapshot?.rows.filter((entry) => nsOf(entry) && !configured(entry)) ?? [];
		const select = (key, value, onChange, options) => h("label", { className: "majed-api-field" }, t(key), h("select", {
			"aria-label": t(key),
			value,
			style: control,
			disabled: busy || key === "apiSubscription" && !!authFlow?.busy,
			onChange: (e) => onChange(e.target.value)
		}, ...options));
		React.useEffect(() => {
			if (!subscriptions$2?.request || authFlow?.busy) return;
			addOrigin.current = "subscription";
			if (subscriptions$2.request.returnFocus) subscriptionAddButton.current = subscriptions$2.request.returnFocus;
			setSubscription(subscriptions$2.request.provider);
			setAddMode("subscription");
			setDraft(null);
			setAddOpen(true);
		}, [subscriptions$2?.request]);
		const close = () => {
			setAuthFlow(null);
			restoreAddFocus.current = addOpen;
			visitedDrafts.current = {};
			setDraft(null);
			setAddOpen(false);
		};
		const editor = () => h("div", {
			role: "group",
			"aria-label": t("apiEditor"),
			className: "majed-api-editor"
		}, draft.custom ? field("apiRoute", draft.entry.provider, (v) => change("entry", {
			...draft.entry,
			provider: v
		})) : h("bdi", { className: "majed-api-muted" }, draft.entry.provider), field("apiName", draft.profile.displayName ?? "", (v) => profileChange("displayName", v)), field("apiURL", draft.profile.baseURL ?? "", (v) => profileChange("baseURL", v)), draft.custom ? select("apiProtocol", draft.profile.api, (v) => profileChange("api", v), [
			"openai-completions",
			"openai-responses",
			"anthropic-messages"
		].map((v) => h("option", {
			key: v,
			value: v
		}, v))) : null, select("apiKeyAction", draft.keyAction, (v) => change("keyAction", v), [
			"keep",
			"set",
			"unset"
		].map((v) => h("option", {
			key: v,
			value: v
		}, t(`apiKey_${v}`)))), draft.keyAction === "set" ? field("apiKey", draft.key, (v) => change("key", v), "password") : null, h("p", { className: "majed-api-muted" }, t("apiKeyLimit")), h("div", { className: "majed-api-head" }, h("strong", null, t("apiModels")), button("apiFetch", () => {
			run(discover);
		})), ...draft.models.map((model, index) => h("div", {
			key: index,
			className: "majed-api-model",
			"data-majed-api-model": index
		}, field("apiModelID", model.id, (v) => change("models", draft.models.map((m, i) => i === index ? {
			...m,
			id: v
		} : m))), field("apiModelName", model.name ?? "", (v) => change("models", draft.models.map((m, i) => i === index ? {
			...m,
			name: v
		} : m))), button("apiModelRemove", () => change("models", draft.models.filter((_, i) => i !== index))))), button("apiModelAdd", () => change("models", [...draft.models, {
			id: "",
			name: ""
		}])), h("p", { className: "majed-api-muted" }, t("apiModelsHint")), h("div", { className: "majed-api-actions" }, button("apiSave", () => {
			run(save);
		}), button("apiCancel", close, false, true)));
		const openAdd = (group) => {
			addOrigin.current = group;
			setAddOpen(true);
			setDraft(null);
			setMessage("");
			setAddMode(group === "subscription" ? "subscription" : "catalog");
			if (group === "api" && addable[0]) edit(addable[0]);
		};
		const addPanel = () => h("div", { className: `majed-api-add${addMode !== "subscription" ? " majed-api-add-open" : " majed-subscription-add-open"}` }, addOpen ? h(React.Fragment, null, addOrigin.current === "subscription" ? null : h(primitives$1.SegmentedControl, {
			id: "majed-provider-add-mode",
			value: addMode,
			label: t("apiAdd"),
			className: "majed-api-tabs",
			disabled: busy || !!authFlow?.busy,
			onChange: switchMode,
			options: ["catalog", "custom"].map((mode) => ({
				value: mode,
				label: t(mode === "catalog" ? "apiCatalog" : mode === "custom" ? "apiCustom" : "apiSubscription"),
				disabled: mode !== "subscription" && (!snapshot?.writable || mode === "custom" && !snapshot.namespaces.some((n) => n.ns === "llm-pi-ai"))
			}))
		}), h("div", {
			role: addOrigin.current === "subscription" ? "group" : "tabpanel",
			id: `majed-provider-add-mode-${addMode}-panel`,
			"aria-label": addOrigin.current === "subscription" ? t("subscriptionAdd") : void 0,
			"aria-labelledby": addOrigin.current === "subscription" ? void 0 : `majed-provider-add-mode-${addMode}`
		}, addMode === "catalog" ? select("apiCatalog", draft?.entry.provider ?? "", (v) => {
			const entry = addable.find((e) => e.provider === v);
			if (entry) edit(entry);
		}, [h("option", {
			key: "",
			value: "",
			disabled: true
		}, t("apiChoose")), ...addable.map((e) => h("option", {
			key: e.provider,
			value: e.provider
		}, e.displayName))]) : null, addMode === "subscription" ? h(React.Fragment, null, select("apiSubscription", subscription || subscriptions$2.providers[0]?.id || "", (v) => {
			if (!authFlow?.busy) {
				setAuthFlow(null);
				setSubscription(v);
			}
		}, subscriptions$2.providers.map((p) => h("option", {
			key: p.id,
			value: p.id
		}, p.name))), subscriptions$2.renderAuth(subscription || subscriptions$2.providers[0]?.id, close, setAuthFlow), h("div", { className: "majed-subscription-add-actions" }, button("cancel", () => run(async () => {
			if (!authFlow?.cancel || await authFlow.cancel()) close();
		}), false, true))) : draft ? editor() : button("apiCancel", close, false, true))) : null);
		return h("div", {
			"data-majed-api-providers": true,
			"aria-busy": busy,
			className: "majed-api-section"
		}, h("style", null, `
        .majed-provider-group{display:flex;flex-direction:column;gap:12px;min-inline-size:0}.majed-provider-group+.majed-provider-group{margin-block-start:12px}.majed-provider-title{margin:0;font-size:16px;line-height:24px;font-weight:500}
        .majed-api-section{max-inline-size:720px;min-inline-size:0;display:flex;flex-direction:column;gap:12px;text-align:start;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
        .majed-api-section *{box-sizing:border-box}.majed-api-section p{margin:0}
        .majed-api-rows{display:flex;flex-direction:column;gap:8px;margin:0;padding:0;list-style:none}.majed-api-rows>li{min-inline-size:0}
        .majed-api-row{border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2));border-radius:var(--dsw-radius-xl,20px);padding:14px 16px;min-inline-size:0}
        .majed-api-head,.majed-api-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .majed-api-identity{display:flex;flex-direction:column;align-items:flex-start;gap:4px;flex:1 1 180px;min-inline-size:0;overflow-wrap:anywhere}.majed-api-identity strong{font-weight:500}
        .majed-api-actions{margin-inline-start:auto}.majed-api-muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        .majed-api-editor{display:flex;flex-direction:column;gap:14px;padding-block:14px 4px;margin-block-start:12px;border-block-start:0.5px solid var(--dsw-alias-border-l2)}
        .majed-api-field{display:flex;flex-direction:column;gap:6px;min-inline-size:0;font-size:12px;line-height:18px;font-weight:500}.majed-api-field input,.majed-api-field select{inline-size:100%;font-size:14px;line-height:22px;font-weight:400}
        .majed-api-model{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:8px;align-items:end}
        .majed-api-add{margin-block-start:4px;min-inline-size:0}.majed-api-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-block-end:14px}.majed-api-tabs [aria-selected=true]{font-weight:500;background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-bg-layer-1))}
        .majed-api-section .majed-subscription-add-trigger{display:flex;align-items:center;justify-content:center;gap:6px;inline-size:100%;min-block-size:44px;padding:0 14px;border:1px dashed var(--dsw-alias-border-l3,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-lg,16px);background:transparent;color:inherit;font:inherit}
        .majed-api-section .majed-subscription-add-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,var(--dsw-alias-bg-layer-1))}
        .majed-subscription-add-open{padding:14px 16px;border-radius:var(--dsw-radius-lg,16px);background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-1))}
        .majed-subscription-add-actions{display:flex;justify-content:flex-end;gap:8px}
        .majed-subscription-add-actions>button{flex:0 0 auto;inline-size:auto}
        .majed-api-section .majed-subscriptions-settings :is([data-majed-codex-part=header],[data-majed-claude-part=header],[data-majed-grok-part=header],[data-majed-antigravity-part=header],[data-majed-copilot-part=header])>button:not(.majed-provider-disclosure){height:28px;block-size:28px;min-height:28px;padding:0 10px;border-radius:var(--dsw-radius-sm,8px);font-size:12px;line-height:18px}
        .majed-subscription-add-open [data-majed-codex-part=card],.majed-subscription-add-open [data-majed-claude-part=card],.majed-subscription-add-open [data-majed-grok-part=card],.majed-subscription-add-open [data-majed-antigravity-part=card],.majed-subscription-add-open [data-majed-copilot-part=card]{border:0!important;background:transparent!important;padding:0!important}
        .majed-api-add-open{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
        .majed-api-add>:is([role=tabpanel],[role=group]){display:flex;flex-direction:column;gap:14px;min-inline-size:0}.majed-api-add>:is([role=tabpanel],[role=group])>.majed-api-editor{margin-block-start:0}
        .majed-api-section button{cursor:pointer;max-inline-size:100%;white-space:normal;overflow-wrap:anywhere}.majed-api-section button:hover:not(:disabled){background:var(--dsw-alias-interactive-secondary-hover,var(--dsw-alias-bg-layer-1))}
        .majed-api-section :is(button,input,select):focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.majed-api-section :disabled{opacity:.5;cursor:not-allowed}
        @media(max-width:520px){.majed-api-model{grid-template-columns:minmax(0,1fr)}.majed-api-model button{justify-self:start}.majed-api-actions{margin-inline-start:0}}
      `), message ? h("p", { role: message === "apiSaved" ? "status" : "alert" }, t(message)) : null, subscriptions$2 ? h("section", {
			"data-majed-provider-group": "subscription",
			className: "majed-provider-group",
			"aria-label": t("subscriptionProviders")
		}, h("h3", { className: "majed-provider-title" }, t("subscriptionProviders")), h("ul", { className: "majed-api-rows" }, ...subscriptions$2.rows), addOpen && addOrigin.current === "subscription" ? addPanel() : !showSubscriptionAdd ? null : h("button", {
			type: "button",
			className: "majed-subscription-add-trigger",
			ref: subscriptionAddButton,
			disabled: busy || addOpen,
			onClick: () => openAdd("subscription")
		}, h("svg", {
			width: 16,
			height: 16,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.5,
			"aria-hidden": true
		}, h("path", { d: "M12 4v16M4 12h16" })), t("addAccount"))) : null, showAPI && h("section", {
			"data-majed-provider-group": "api",
			className: "majed-provider-group",
			"aria-label": t("apiProviders")
		}, h("div", { className: "majed-api-head" }, h("h3", { className: "majed-provider-title" }, t("apiProviders")), h("div", { className: "majed-api-actions" }, button("apiRefresh", () => {
			load();
		}))), h(React.Fragment, null, !snapshot ? h("p", null, t(remote ? message ? "apiFailed" : "apiLoading" : "apiUnavailable")) : null, h("ul", { className: "majed-api-rows" }, ...(snapshot?.rows ?? []).filter(configured).map((entry) => {
			const ns = nsOf(entry), profile = at(ns.value, entry.settingsPath);
			const metadata = (profile?.apiKeyEnv ? [profile.apiKeyEnv] : [refOf(entry, profile), ...entry.nativeAuth?.env ?? []]).map((ref) => snapshot.credentials[ref]);
			const credentialStatus = entry.provider === "deepseek-account" ? "account-unknown" : metadata.some((value) => value?.configured === true) ? "configured" : metadata.every((value) => value?.configured === false) ? "missing" : "unknown";
			const statusLabel = credentialStatus === "configured" ? "apiKeySet" : credentialStatus === "missing" ? "apiKeyMissing" : credentialStatus === "account-unknown" ? "apiAccountUnknown" : "apiKeyUnknown";
			return h("li", {
				key: entry.provider,
				"data-majed-api-provider": entry.provider,
				className: "majed-api-row"
			}, h("div", { className: "majed-api-head" }, h("span", { className: "majed-api-identity" }, h("strong", null, profile?.displayName ?? entry.displayName), h("span", {
				className: "majed-api-muted",
				"data-majed-credential-status": credentialStatus
			}, h("span", {
				"aria-hidden": true,
				style: {
					display: "inline-block",
					width: 6,
					height: 6,
					borderRadius: "50%",
					marginInlineEnd: 6,
					background: "currentColor"
				}
			}), t(statusLabel))), h("span", { className: "majed-api-actions" }, entry.provider === "deepseek-account" ? null : button("apiEdit", () => {
				setAddOpen(false);
				edit(entry);
			}, addOpen || !snapshot.writable), removable(entry, ns) ? button("apiDelete", () => {
				run(() => remove(entry));
			}, addOpen || !snapshot.writable) : null)), !addOpen && draft?.entry.provider === entry.provider ? editor() : null);
		})), addOpen && addOrigin.current === "api" ? addPanel() : button("apiAdd", () => openAdd("api"), addOpen || !snapshot?.writable))));
	};
}

//#endregion
//#region src/copilot-card.ts
/** GitHub Copilot Settings card, adapted from pinned reference SubscriptionsSection device login and shared
* account presentation. Only sanitized status crosses RPC; see PROVENANCE.md (#134). */
function createCopilotCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	primitives$1.Input;
	const DEFAULT_NAME = "GitHub Copilot";
	return function CopilotCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "copilot",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.copilot ?? { accounts: [] },
				registrationError: value.copilotRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch(() => {});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-copilot-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-copilot-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "copilot",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("copilotProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-copilot-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccount" : "login"), () => startLogin(), !!status?.registrationError)), busy && (status.pendingAuth ?? login) ? h("div", { style: styles$3.manual }, h("p", null, t("copilotDeviceHint")), h("bdi", {
			dir: "ltr",
			"data-majed-copilot-code": true
		}, (status.pendingAuth ?? login).userCode), button(t("copyDeviceCode"), () => {
			action(async () => {
				await navigator.clipboard.writeText((status.pendingAuth ?? login).userCode);
			});
		}), h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization"))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/claude-card.ts
/**
* Claude Settings card (ticket #132). Scoped presentation port of the Claude part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createClaudeCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Claude (Subscription)";
	return function ClaudeCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "claude",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.claude ?? { accounts: [] },
				registrationError: value.claudeRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch(() => {});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-claude-part": name$1
		}, ...children);
		const startLogin = (method) => {
			action(async () => {
				const result = await call("login", method === void 0 ? {} : { method });
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-claude-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "claude",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("claudeProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-claude-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : hasAccounts ? [button(t("addAccountOAuth"), () => startLogin("oauth"), !!status?.registrationError, { key: "oauth" }), button(t("addAccountKeychain"), () => startLogin("keychain"), !!status?.registrationError, { key: "keychain" })] : button(t("login"), () => startLogin(), !!status?.registrationError)), presentation !== "group" && !busy && hasAccounts ? h("p", { style: styles$3.statusLine }, t("claudeAddAccountHint")) : null, busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/usage-badge/usage-window-filter.ts
/** Presentation only: never trim the raw snapshots used by quota/routing logic. */
function visibleUsageWindows(provider, windows, visibleModels) {
	const all = windows ?? [];
	if (provider !== "antigravity" || visibleModels === void 0) return all;
	const selected = new Set(visibleModels);
	return all.filter((window$1) => !window$1.scope || selected.has(window$1.scope));
}

//#endregion
//#region src/antigravity-card.ts
/**
* Antigravity Settings card (ticket #135). Scoped presentation port of the Antigravity part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createAntigravityCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Google Antigravity";
	return function AntigravityCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "antigravity",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.antigravity ?? { accounts: [] },
				registrationError: value.antigravityRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch(() => {});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (status?.setupRequired) return Promise.resolve();
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-antigravity-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-antigravity-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "antigravity",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError || status?.setupRequired ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError || status?.setupRequired ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError && !status?.setupRequired ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.setupRequired ? t("antigravitySetupRequired") : status?.registrationError ? t("antigravityProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail && !status?.setupRequired ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			const windows = visibleUsageWindows("antigravity", snapshot?.windows, status?.visibleModels);
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-antigravity-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, !!status?.setupRequired, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !windows.length ? h("p", { style: styles$3.statusLine }, t(snapshot.windows?.length ? "usageNoVisibleModels" : "usageEmpty")) : null, ...windows.map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccountOAuth" : "login"), () => startLogin(), !!status?.registrationError || !!status?.setupRequired)), busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/zen-card.ts
/** Login-less lane; independent presentation using the existing owned card styles and RPC. */
function createZenCard(React, primitives$1, rpc, t) {
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
				const value = await callSubscriptionsAuth$1(rpc, "zenStatus", {});
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
			refresh();
			return () => {
				alive.current = false;
			};
		}, []);
		const enabled = status?.enabled !== false;
		const toggle = async () => {
			setPending(true);
			try {
				const value = await callSubscriptionsAuth$1(rpc, "setZenEnabled", { enabled: !enabled });
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
		const state = !enabled ? "warning" : pending || !status && !failed ? "checking" : failed || status?.registrationError ? "error" : status.reachable ? "ready" : "warning";
		const label = state === "checking" ? "checking" : state === "error" ? "zenUnavailable" : state === "ready" ? "zenReachable" : "zenUnreachable";
		return h("div", {
			style: {
				...styles$3.section,
				maxWidth: "none",
				maxInlineSize: "none",
				width: "100%",
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-zen-card": true
		}, h("style", null, controlCss), h("div", { style: styles$3.card }, h("div", { style: styles$3.cardHeader }, providerStatus(h, t, state, !enabled ? "zenDisabled" : label), h("div", { className: "majed-provider-identity" }, h("span", { style: styles$3.name }, "OpenCode Zen")), h("button", {
			type: "button",
			role: "switch",
			"aria-checked": enabled,
			"aria-label": t("zenEnabled"),
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
				display: "inline-flex",
				alignItems: "center",
				background: enabled ? "var(--dsw-alias-brand-primary)" : "var(--dsw-alias-interactive-bg-hover)"
			}
		}, h("span", {
			"aria-hidden": true,
			style: {
				width: 16,
				height: 16,
				borderRadius: "50%",
				background: enabled ? "var(--dsw-alias-bg-base)" : "var(--dsw-alias-label-secondary)",
				marginInlineStart: enabled ? "auto" : 0,
				marginInlineEnd: enabled ? 0 : "auto"
			}
		})), providerDisclosure(h, t, "OpenCode Zen", expanded, () => setExpanded(!expanded))), expanded ? h("div", { style: {
			...styles$3.usage,
			gap: 8
		} }, h("p", {
			role: "status",
			style: styles$3.statusLine
		}, t(!enabled ? "zenDisabled" : label)), status ? h("p", { style: styles$3.statusLine }, `${t("zenModelCount")}: ${status.modelCount} · ${t("zenSource_" + status.source)}`) : null, h("div", { style: {
			...styles$3.actions,
			justifyContent: "flex-end"
		} }, h(primitives$1.Button ?? "button", {
			type: "button",
			disabled: pending,
			onClick: () => void refresh()
		}, t("zenRefresh")))) : null));
	};
}

//#endregion
//#region src/grok-card.ts
/**
* Grok Settings card (ticket #133). Scoped presentation port of the Grok part of V1ki v0.9.12 b802311
* SubscriptionsSection; see PROVENANCE.md. It only ever receives sanitized status from the owned RPC: account
* labels, plan and expiry, never a token or credential-store path.
*/
function createGrokCard(React, primitives$1, rpc, t) {
	const h = React.createElement;
	const Button = primitives$1.Button ?? "button";
	const Input = primitives$1.Input ?? "input";
	const DEFAULT_NAME = "Grok (Subscription)";
	return function GrokCard({ presentation, onComplete, onFlowState, onAccountsChange, revision, initialExpanded = false } = {}) {
		const [expanded, setExpanded] = React.useState(initialExpanded);
		const initialAuthRevision = React.useRef(null);
		const [manager, setManager] = React.useState(false);
		const [status, setStatus] = React.useState(null);
		const [error, setError] = React.useState("");
		const [pending, setPending] = React.useState(false);
		const [login, setLogin] = React.useState(null);
		const [input, setInput] = React.useState("");
		const [usage, setUsage] = React.useState({});
		const [confirmation, setConfirmation] = React.useState(null);
		const alive = React.useRef(true);
		const usageRequests = React.useRef(/* @__PURE__ */ new Map());
		const accountKeys = React.useRef(/* @__PURE__ */ new Set());
		const call = async (endpoint, payload = {}) => {
			const response = await rpc.call("/api", `majed-subscriptions.${endpoint}`, {
				provider: "grok",
				...payload
			});
			if (!response?.ok) throw new Error(response?.error?.message ?? t("unreachable"));
			return response.value;
		};
		const refreshStatus = async () => {
			const value = await call("status");
			if (alive.current) setStatus({
				...value.providers.grok ?? { accounts: [] },
				registrationError: value.grokRegistrationError
			});
		};
		const action = async (run) => {
			setPending(true);
			setError("");
			try {
				await run();
			} catch (failure) {
				if (alive.current) setError(failure instanceof Error ? failure.message : String(failure));
			} finally {
				if (alive.current) setPending(false);
			}
		};
		React.useEffect(() => {
			alive.current = true;
			refreshStatus().catch((failure) => {
				if (alive.current) setError(failure.message);
			});
			return () => {
				alive.current = false;
			};
		}, []);
		React.useEffect(() => {
			if (revision !== void 0) refreshStatus().catch(() => {});
		}, [revision]);
		React.useEffect(() => {
			if (!status?.busy) return;
			const timer = setInterval(() => {
				refreshStatus().catch((failure) => {
					if (alive.current) setError(failure.message);
				});
			}, 2e3);
			return () => clearInterval(timer);
		}, [status?.busy]);
		const refreshUsage = (account, force = false) => {
			if (usageRequests.current.has(account)) return usageRequests.current.get(account);
			let request;
			request = (async () => {
				try {
					const snapshot = await call("usage", {
						account,
						force
					});
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: snapshot
					}));
				} catch (failure) {
					if (alive.current && accountKeys.current.has(account) && usageRequests.current.get(account) === request) setUsage((previous) => ({
						...previous,
						[account]: { error: failure instanceof Error ? failure.message : String(failure) }
					}));
				} finally {
					if (usageRequests.current.get(account) === request) usageRequests.current.delete(account);
				}
			})();
			usageRequests.current.set(account, request);
			return request;
		};
		const reportedAccounts = React.useRef(null);
		const accountsSignature = JSON.stringify((status?.accounts ?? []).map((account) => account.key));
		React.useEffect(() => {
			if (presentation === "group" && status) {
				if (reportedAccounts.current !== null && reportedAccounts.current !== accountsSignature) onAccountsChange?.();
				reportedAccounts.current = accountsSignature;
			}
			const keys = new Set((status?.accounts ?? []).map((account) => account.key));
			const added = [...keys].filter((key) => !accountKeys.current.has(key));
			accountKeys.current = keys;
			for (const key of usageRequests.current.keys()) if (!keys.has(key)) usageRequests.current.delete(key);
			setUsage((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => keys.has(key))));
			if (presentation !== "auth") for (const key of added) refreshUsage(key);
		}, [accountsSignature]);
		const button = (label, onClick, disabled = false, props = {}) => h(Button, {
			type: "button",
			disabled: pending || disabled,
			onClick,
			...props
		}, label);
		const date = (time) => new Date(time).toLocaleString();
		const part = (name$1, style, ...children) => h("div", {
			style,
			"data-majed-grok-part": name$1
		}, ...children);
		const startLogin = () => {
			action(async () => {
				const result = await call("login");
				if (!alive.current) return;
				if (result.authorizeUrl) window.open(result.authorizeUrl, "_blank", "noopener");
				setLogin(result.authorizeUrl ? result : null);
				await refreshStatus();
			});
		};
		React.useEffect(() => {
			if (!status) return;
			const current = status.authRevision ?? 0;
			if (initialAuthRevision.current === null) initialAuthRevision.current = current;
			else if (presentation === "auth" && current > initialAuthRevision.current) {
				initialAuthRevision.current = current;
				onComplete?.();
			}
		}, [status]);
		const busy = status?.busy;
		React.useEffect(() => {
			if (presentation !== "auth") return;
			onFlowState?.({
				busy: pending || !!busy,
				cancel: async () => {
					if (pending) return false;
					if (busy) {
						await call("cancel");
						setLogin(null);
						await refreshStatus();
					}
					return true;
				}
			});
		}, [pending, busy]);
		const name = status?.displayName || DEFAULT_NAME;
		const hasAccounts = !!status?.accounts?.length;
		return h("div", {
			style: {
				...styles$3.section,
				...presentation ? {
					maxWidth: "none",
					maxInlineSize: "none",
					width: "100%"
				} : {},
				textAlign: "start"
			},
			className: "majed-subscriptions-settings",
			"data-majed-grok-card": true
		}, h("style", null, controlCss), manager ? h(ProviderAccountManager, {
			provider: "grok",
			name,
			rpc,
			t,
			onClose: () => {
				setManager(false);
				refreshStatus();
			}
		}) : null, part("card", styles$3.card, presentation !== "auth" && part("header", styles$3.cardHeader, providerStatus(h, t, error || status?.registrationError ? "error" : busy ? "warning" : !status ? "checking" : status?.accounts?.length ? "ready" : "warning", error || status?.registrationError ? "providerAttention" : busy ? "loginProgress" : !status ? "checking" : status?.accounts?.length ? "providerConfigured" : "notLoggedIn"), presentation === "group" ? providerIdentity(h, t, name, status?.accounts ?? [], usage, status?.clientVersion) : h("span", { style: styles$3.name }, name), presentation === "auth" ? null : button(t("accountsManage"), () => setManager(true), false, { style: { marginInlineStart: "auto" } }), presentation === "group" ? providerDisclosure(h, t, name, expanded, () => setExpanded(!expanded)) : status?.clientVersion ? h("span", {
			style: styles$3.clientVersion,
			title: t("clientVersionHint")
		}, "CLI ", h("bdi", { dir: "ltr" }, status.clientVersion.version), " · ", t(`source_${status.clientVersion.source}`)) : null), (presentation === "auth" || presentation === "group" && status?.accounts?.length) && !busy && !status?.registrationError ? null : h("p", {
			style: styles$3.statusLine,
			role: "status"
		}, status?.registrationError ? t("grokProviderUnavailable") : busy ? t("loginProgress") : hasAccounts ? `${status.accounts.length} ${t("connected")}` : status ? t("notLoggedIn") : t("checking")), status?.detail ? h("p", { style: styles$3.statusLine }, status.detail) : null, error ? h("p", {
			style: styles$3.errorLine,
			role: "alert"
		}, error) : null, ...(presentation === "auth" || presentation === "group" && !expanded ? [] : status?.accounts ?? []).map((account) => {
			const snapshot = usage[account.key];
			return h("div", {
				key: account.key,
				style: styles$3.accountRow,
				"data-majed-grok-part": "account"
			}, part("account-header", styles$3.accountHeader, button(account.isDefault ? "★" : "☆", () => {
				if (!account.isDefault) action(async () => {
					await call("setDefault", { account: account.key });
					await refreshStatus();
				});
			}, false, {
				style: styles$3.starButton,
				title: t(account.isDefault ? "defaultAccount" : "makeDefault"),
				"aria-label": t(account.isDefault ? "defaultAccount" : "makeDefault")
			}), h("bdi", {
				dir: "ltr",
				style: styles$3.accountName
			}, account.alias || account.account || account.key), account.plan ? h("bdi", { style: styles$3.usagePlan }, account.plan) : null, account.expiresAt ? h("span", { style: styles$3.statusLine }, t("expires"), " ", h("bdi", null, date(account.expiresAt))) : null, button(t("logout"), () => setConfirmation({
				account: account.key,
				label: account.account
			}), false, { style: { marginInlineStart: "auto" } })), snapshot?.supported === false ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : part("usage", styles$3.usage, part("usage-header", styles$3.usageHeader, h("span", { style: styles$3.usageTitle }, t("usageTitle")), button(t("refreshUsage"), () => {
				action(() => refreshUsage(account.key, true));
			}, false, { style: styles$3.usageRefresh })), !snapshot ? h("p", { style: styles$3.statusLine }, t("usageNotLoaded")) : snapshot.error ? h("p", {
				style: styles$3.errorLine,
				role: "alert"
			}, snapshot.error) : !snapshot.windows?.length ? h("p", { style: styles$3.statusLine }, t("usageUnavailable")) : null, ...(snapshot?.windows ?? []).map((window$1, index) => {
				const percent = Math.max(0, Math.min(100, window$1.usedPercent));
				const color = percent >= 95 ? "var(--dsw-alias-state-error-primary)" : percent >= 80 ? "var(--dsw-alias-state-warn-label)" : "var(--dsw-alias-state-success-primary)";
				return h("div", {
					key: index,
					style: styles$3.usageRow
				}, part("usage-meta", styles$3.usageMeta, h("span", null, t(`window_${window$1.kind}`), window$1.scope ? ` · ${window$1.scope}` : ""), h("span", null, h("bdi", null, `${Math.round(percent)}%`), window$1.resetsAt ? h("span", null, " · ", t("resets"), " ", h("bdi", null, date(window$1.resetsAt))) : null)), h("div", {
					role: "progressbar",
					"aria-label": t(`window_${window$1.kind}`),
					"aria-valuenow": percent,
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					style: styles$3.usageTrack
				}, h("div", { style: {
					...styles$3.usageFill,
					background: color,
					inlineSize: `${percent}%`
				} })));
			})));
		}), presentation !== "group" && part("actions", styles$3.actions, busy ? button(t("cancelLogin"), () => {
			action(async () => {
				await call("cancel");
				setLogin(null);
				await refreshStatus();
			});
		}) : button(t(hasAccounts ? "addAccountOAuth" : "login"), () => startLogin(), !!status?.registrationError)), busy ? h("div", null, (status.pendingAuth ?? login)?.authorizeUrl ? h("a", {
			href: (status.pendingAuth ?? login).authorizeUrl,
			target: "_blank",
			rel: "noopener noreferrer",
			style: styles$3.manual
		}, t("openAuthorization")) : null, h("details", { style: styles$3.manual }, h("summary", null, t("manualSummary")), part("manual-row", styles$3.manualRow, h(Input, {
			style: styles$3.manualInput,
			value: input,
			placeholder: t("pasteCallback"),
			"aria-label": t("pasteCallback"),
			dir: "ltr",
			onChange: (event) => setInput(event.target.value)
		}), button(t("submitCallback"), () => {
			action(async () => {
				await call("manual", { input });
				setInput("");
				await refreshStatus();
			});
		}, !input.trim())))) : null), confirmation ? h("dialog", {
			ref: (node) => {
				if (node && !node.open) node.showModal();
			},
			className: "majed-reset-dialog",
			role: "dialog",
			"aria-modal": true,
			"aria-label": t("confirmLogout"),
			onCancel: () => setConfirmation(null),
			onClose: () => setConfirmation(null),
			style: {
				...styles$3.modal,
				margin: "auto",
				color: "var(--dsw-alias-label-primary)"
			}
		}, h("h3", { style: {
			...styles$3.modalTitle,
			margin: 0
		} }, t("confirmLogout")), h("p", { style: {
			...styles$3.statusLine,
			overflowWrap: "anywhere"
		} }, h("bdi", { dir: "ltr" }, confirmation.label ?? confirmation.account)), h("div", {
			className: "majed-subscription-dialog-actions",
			style: {
				...styles$3.actions,
				justifyContent: "flex-end",
				marginBlockStart: 8
			}
		}, button(t("cancel"), () => setConfirmation(null), false, { autoFocus: true }), button(t("logout"), () => {
			action(async () => {
				await call("logout", { account: confirmation.account });
				setConfirmation(null);
				await refreshStatus();
			});
		}))) : null);
	};
}

//#endregion
//#region src/speed/SpeedSelect.tsx
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
function createSpeedLoader(connection, models, sessionId) {
	return async () => {
		const directories = models();
		const current = directories === void 0 ? null : (await directories.directoryFor(sessionId).load()).current;
		const state = await callSubscriptionsAuth(connection.rpc, "speed", {
			sessionId,
			...current?.provider === "codex" ? { model: current.model } : {}
		});
		return {
			visible: current !== null && current.provider === "codex" && state.fastModels.includes(current.model),
			tier: state.tier
		};
	};
}
/** The `setSpeed` half of the inject face: boolean outcome for the component's busy state. */
function createSpeedSetter(connection, sessionId) {
	return (tier) => callSubscriptionsAuth(connection.rpc, "setSpeed", {
		sessionId,
		tier
	}).then(() => true, () => false);
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate$1(key) {
	return subscriptions$1[key] ?? key;
}
const TIERS = ["standard", "fast"];
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). Mount and every open reload the host state so a model
* switch made since the last open self-corrects.
*/
/** How often the control re-reads the host state (model switches arrive only by asking). */
const POLL_INTERVAL_MS = 3e3;
/**
* The composer Speed control: a trigger reading `Speed · Fast`/`Speed · Standard`
* that opens a two-row menu (standard/fast with descriptions, check mark on
* the current tier). The host pushes nothing on a model switch, so the
* control re-reads on a slow poll with a single-flight guard; a failed read
* keeps the last known state, so a transient RPC failure can never lock the
* toggle away (the earlier mount-only load had no recovery path).
*/
function SpeedSelect({ loadSpeed, setSpeed, t }) {
	const translate = t ?? fallbackTranslate$1;
	const [state, setState] = (0, react.useState)(null);
	const [open, setOpen] = (0, react.useState)(false);
	const [busy, setBusy] = (0, react.useState)(false);
	const rootRef = (0, react.useRef)(null);
	const loadRef = (0, react.useRef)(loadSpeed);
	loadRef.current = loadSpeed;
	(0, react.useEffect)(() => {
		if (loadRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const load = loadRef.current;
			if (load === void 0 || inflight) return;
			inflight = true;
			load().then((loaded) => {
				if (!cancelled) setState(loaded);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	(0, react.useEffect)(() => {
		if (!open) return;
		const closeOutside = (event) => {
			if (!rootRef.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener("mousedown", closeOutside);
		return () => {
			document.removeEventListener("mousedown", closeOutside);
		};
	}, [open]);
	if (loadSpeed === void 0 || setSpeed === void 0 || state === null || !state.visible) return null;
	const choose = (tier) => {
		if (busy) return;
		if (tier === state.tier) {
			setOpen(false);
			return;
		}
		setBusy(true);
		setSpeed(tier).then((ok) => {
			setBusy(false);
			if (ok) {
				setState({
					visible: true,
					tier
				});
				setOpen(false);
			}
		});
	};
	const show = () => {
		setOpen(true);
		const load = loadRef.current;
		if (load === void 0) return;
		load().then(setState, () => {});
	};
	const tierName = (tier) => translate(tier === "fast" ? "speedFast" : "speedStandard");
	const tierDescription = (tier) => translate(tier === "fast" ? "speedFastDescription" : "speedStandardDescription");
	const triggerLabel = `${translate("speed")} · ${tierName(state.tier)}`;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "majed-subscription-speed",
		style: styles$2.root,
		onKeyDown: (event) => {
			if (event.key === "Escape" && open) {
				event.preventDefault();
				setOpen(false);
			}
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: styles$2.menu,
				role: "menu",
				"aria-label": translate("speed"),
				children: TIERS.map((tier) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "menuitemradio",
					"aria-checked": tier === state.tier,
					style: styles$2.item,
					disabled: busy,
					onClick: () => {
						choose(tier);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles$2.itemCheck,
						children: tier === state.tier ? "✓" : ""
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						style: styles$2.itemText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemName,
							children: tierName(tier)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles$2.itemDescription,
							children: tierDescription(tier)
						})]
					})]
				}, tier))
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				style: styles$2.trigger,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				title: triggerLabel,
				disabled: busy,
				onClick: () => {
					if (open) setOpen(false);
					else show();
				},
				children: triggerLabel
			})
		]
	});
}
const styles$2 = {
	root: {
		position: "relative",
		display: "inline-flex"
	},
	trigger: {
		border: "0.5px solid var(--dsw-alias-border-l3)",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--majed-subscription-speed-hover, transparent)",
		color: "var(--dsw-alias-label-secondary)",
		font: "inherit",
		fontSize: 12,
		lineHeight: "18px",
		padding: "2px 8px",
		cursor: "pointer",
		whiteSpace: "nowrap"
	},
	menu: {
		position: "absolute",
		bottom: "100%",
		insetInlineEnd: 0,
		marginBottom: 4,
		minWidth: 180,
		padding: 4,
		zIndex: 20,
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-layer-2))",
		border: 0,
		boxShadow: "var(--dsw-elevation-prominent)",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		display: "flex",
		flexDirection: "column",
		gap: 2
	},
	item: {
		display: "flex",
		alignItems: "flex-start",
		gap: 6,
		width: "100%",
		border: "none",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		background: "var(--majed-subscription-speed-hover, transparent)",
		padding: "6px 8px",
		cursor: "pointer",
		font: "inherit",
		textAlign: "start"
	},
	itemCheck: {
		width: 14,
		flexShrink: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemText: {
		display: "flex",
		flexDirection: "column"
	},
	itemName: {
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-primary)"
	},
	itemDescription: {
		fontSize: 11,
		lineHeight: "16px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/speed/fast-command.ts
/** Build the locale resolver used by the /fast command contribution. */
function fastCommandDescription(t) {
	return () => t();
}

//#endregion
//#region src/usage-badge/usage-types.ts
/** Bar fill color: success normally, warn from 80%, error from 95%. */
function usageBarColor(usedPercent$1) {
	if (usedPercent$1 >= 95) return "var(--dsw-alias-state-error-primary)";
	if (usedPercent$1 >= 80) return "var(--dsw-alias-state-warn-label)";
	return "var(--dsw-alias-state-success-primary)";
}

//#endregion
//#region src/usage-badge/host-modules.ts
let primitives;
let reactDom;
/** `@deepseek-ai/dsh-client-ui-primitives`, resolved on first use. */
function hostPrimitives() {
	return primitives ??= require("@deepseek-ai/dsh-client-ui-primitives");
}
/** `react-dom` (portals), resolved on first use. */
function hostReactDom() {
	return reactDom ??= require("react-dom");
}

//#endregion
//#region src/usage-badge/usage-badge-preferences.ts
const MODE_KEY = "majed.subscriptions.usageBadgeMode";
const MODE_EVENT = "majed:subscriptions:usage-badge-mode";
/** Read the browser preference; blocked storage retains the default display. */
function readUsageBadgeMode() {
	if (typeof window === "undefined") return "recent";
	try {
		return window.localStorage.getItem(MODE_KEY) === "hidden" ? "hidden" : "recent";
	} catch (error) {
		if (!(error instanceof DOMException) || error.name !== "SecurityError") throw error;
		return "recent";
	}
}
/** Save first, then notify; the settings control reports a rejected write. */
function setUsageBadgeMode(mode) {
	if (mode !== "recent" && mode !== "hidden") throw new TypeError("Invalid subscription usage display mode");
	window.localStorage.setItem(MODE_KEY, mode);
	window.dispatchEvent(new Event(MODE_EVENT));
}
/** Same-tab writes need a custom event; other tabs use the storage event. */
function subscribeUsageBadgeMode(notify) {
	const onStorage = (event) => {
		if (event.key === MODE_KEY || event.key === null) notify();
	};
	window.addEventListener(MODE_EVENT, notify);
	window.addEventListener("storage", onStorage);
	return () => {
		window.removeEventListener(MODE_EVENT, notify);
		window.removeEventListener("storage", onStorage);
	};
}
/** Shared React snapshot used by the settings control and every mounted badge. */
function useUsageBadgeMode() {
	return (0, react.useSyncExternalStore)(subscribeUsageBadgeMode, readUsageBadgeMode, () => "recent");
}

//#endregion
//#region src/usage-badge/SubscriptionUsageBadge.tsx
/** Owned usage chart glyph; no dependency on a host icon export. */
function UsageBadgeIcon() {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.7",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 19V13M10 19V8M16 19V4M3 21h18" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m3 8 6-4 6 2 6-4" })]
	});
}
/** How often the badge re-reads usage; the server also shares its own cache/negative-cache across UI surfaces. */
const USAGE_POLL_INTERVAL_MS = 15 * 6e4;
/** How often the badge re-reads the session's current model (model switches arrive only by asking). */
const MODEL_POLL_INTERVAL_MS = 3e3;
/** Distance between the trigger's top edge and the dialog's bottom (host stat dialogs use the same). */
const PANEL_GAP = 8;
/** Distance kept between the dialog and each viewport edge. */
const PANEL_MARGIN = 12;
/** The account the collapsed pill reads: the default one, else the first listed. */
function pillAccountOf(d) {
	return d.accounts.find((a) => a.isDefault) ?? d.accounts[0];
}
/** Brand display names (short form for the compact badge). */
const PROVIDER_NAMES = {
	codex: "Codex",
	claude: "Claude",
	grok: "Grok",
	copilot: "Copilot",
	antigravity: "Antigravity"
};
/**
* The `currentModel` half of the inject face: the session's effective
* model selection through ui-model-selection's `modelDirectories` service,
* resolved lazily per call (the service may register after this plugin, and
* a shell without it reports "unknown"; the badge keeps the most recent
* subscription selected in this view, or stays hidden).
*/
function createCurrentModelReader(models, sessionId) {
	return async () => {
		const directories = models();
		if (directories === void 0) return void 0;
		const { current } = await directories.directoryFor(sessionId).load();
		return current ?? void 0;
	};
}
/**
* Compact time-remaining label derived from the window's `resetsAt` timestamp:
* "6d 18h" (days+hours), "1h 58m" (hours+minutes), or "42m" (minutes only).
* Falls back to the scope/kind abbreviation when no reset time is known.
*/
function windowLabel(w) {
	if (w.resetsAt === void 0) {
		if (w.scope !== void 0 && w.scope !== "") return w.scope;
		switch (w.kind) {
			case "session": return "5h";
			case "weekly": return "Wk";
			default: return "W";
		}
	}
	const ms = Math.max(0, w.resetsAt - Date.now());
	const minutes = Math.floor(ms / 6e4);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	return `${Math.max(1, minutes)}m`;
}
/** Clamp and round a window's used share for display. */
function usedPercent(w) {
	return Math.round(Math.min(100, Math.max(0, w.usedPercent)));
}
/** Keep model quotas separate: matching percentages do not imply a shared pool. */
function prioritizeWindows(windows, model) {
	return model === void 0 ? [...windows] : [...windows.filter((w) => w.scope === model), ...windows.filter((w) => w.scope !== model)];
}
/** Small previews keep a live model catalog from taking over the dialog. */
const WINDOW_PREVIEW_LIMIT = 4;
function previewWindows(windows, model, provider) {
	const ordered = prioritizeWindows(windows, model);
	const limit = provider === "antigravity" ? Math.min(2, model === void 0 ? 0 : windows.filter((w) => w.scope === model).length) : WINDOW_PREVIEW_LIMIT;
	return {
		shown: ordered.slice(0, limit),
		hidden: ordered.slice(limit)
	};
}
/** Bounded readout; Antigravity quotas belong to individual models, not the account. */
function compactSegment(d, model, t = fallbackTranslate) {
	const windows = pillAccountOf(d).windows;
	if (d.provider === "antigravity") {
		const matching = model === void 0 ? [] : windows.filter((w) => w.scope === model);
		if (matching.length === 0) return `${d.name} ${t(model === void 0 ? "usageBadgeModelCount" : "usageBadgeModelUnavailable", { count: new Set(windows.map((w) => w.scope).filter(Boolean)).size })}`;
		const parts$1 = matching.slice(0, 2).map((w) => `${w.kind === "weekly" ? t("usageWeekly") : t("usageWindow")} ${usedPercent(w)}%`);
		return `${d.name} ${parts$1.join(" · ")}`;
	}
	const parts = windows.slice(0, 2).map((w) => `${w.scope || (w.kind === "session" ? t("usageSessionShort") : w.kind === "weekly" ? t("usageWeeklyShort") : t("usageWindow"))} ${usedPercent(w)}%`);
	if (windows.length > 2) parts.push(`+${windows.length - 2}`);
	return `${d.name} ${parts.join(" · ")}`;
}
/** Remember only the most recent subscription in this view, including its model scope. */
function retainSubscriptionSelection(previous, current) {
	return current !== void 0 && Object.hasOwn(PROVIDER_NAMES, current.provider) ? current : previous;
}
/** At most one provider; no known selection or no usage means no badge. */
function collapsedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? [] : [match];
}
/** Order for the expanded dialog: the current provider first, the rest in poll order. */
function expandedDisplays(displays, current) {
	const match = displays.find((d) => d.provider === current);
	return match === void 0 ? displays : [match, ...displays.filter((d) => d !== match)];
}
/**
* A provider's logged-in accounts, the effective default first. When no
* account is flagged default the first listed stands in, matching what
* direct routes fall back to.
*/
function accountsOf(status) {
	if (status == null || !Array.isArray(status.accounts) || status.accounts.length === 0) return [];
	const fallback = status.accounts.find((a) => a.isDefault) ?? status.accounts[0];
	return status.accounts.map((a) => a === fallback ? {
		...a,
		isDefault: true
	} : a).sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}
/** English-dictionary fallback for a missing inject `t` (standalone renders). */
function fallbackTranslate(key, params) {
	return (subscriptions$1[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ""));
}
/** Localized label of one usage window (kind, plus the model scope when named). */
function usageWindowLabel(t, window$1) {
	const base = window$1.kind === "session" ? t("usageSession") : window$1.kind === "weekly" ? t("usageWeekly") : t("usageWindow");
	return window$1.scope !== void 0 && window$1.scope !== "" ? `${base} · ${window$1.scope}` : base;
}
/**
* The composer subscription-usage badge: a pill reading e.g.
* `Codex 5h 25% · Wk 40%` for the current model's provider, opening a dialog with
* every provider's accounts and their windows. Returns null when no data is
* available.
*/
function SubscriptionUsageBadge({ rpc, currentModel, t }) {
	const translate = t ?? fallbackTranslate;
	const [displays, setDisplays] = (0, react.useState)([]);
	const [selection, setSelection] = (0, react.useState)(void 0);
	const [lastSubscription, setLastSubscription] = (0, react.useState)(void 0);
	const displayMode = useUsageBadgeMode();
	const current = selection?.provider;
	const badgeSelection = retainSubscriptionSelection(lastSubscription, selection);
	const [open, setOpen] = (0, react.useState)(false);
	const [hover, setHover] = (0, react.useState)(false);
	const [focused, setFocused] = (0, react.useState)(false);
	const tooltipId = (0, react.useId)();
	const panelId = (0, react.useId)();
	const tooltipRef = (0, react.useRef)(null);
	const buttonRef = (0, react.useRef)(null);
	const showTooltip = !open && (hover || focused);
	const inflightRef = (0, react.useRef)(false);
	const mountedRef = (0, react.useRef)(true);
	const rootRef = (0, react.useRef)(null);
	const panelRef = (0, react.useRef)(null);
	const seatRef = (0, react.useRef)(null);
	const currentRef = (0, react.useRef)(currentModel);
	currentRef.current = currentModel;
	const lastKnownRef = (0, react.useRef)(/* @__PURE__ */ new Map());
	const namesRevision = (0, react.useRef)(0);
	const recentNames = (0, react.useRef)(/* @__PURE__ */ new Map());
	const refresh = (0, react.useCallback)(async () => {
		if (rpc === void 0 || inflightRef.current) return;
		inflightRef.current = true;
		const revision = namesRevision.current;
		try {
			const statusResp = await callSubscriptionsAuth(rpc, "status", {});
			if (!mountedRef.current) return;
			const roster = [];
			for (const provider of Object.keys(statusResp.providers)) {
				if (!Object.hasOwn(PROVIDER_NAMES, provider)) continue;
				for (const account of accountsOf(statusResp.providers[provider])) roster.push({
					provider,
					account
				});
			}
			const keyOf = (provider, account) => `${provider}:${account.key}`;
			const lastKnown = lastKnownRef.current;
			const live = new Set(roster.map(({ provider, account }) => keyOf(provider, account)));
			for (const key of lastKnown.keys()) if (!live.has(key)) lastKnown.delete(key);
			if (roster.length === 0) {
				setDisplays([]);
				return;
			}
			const results = await Promise.allSettled(roster.map(async ({ provider, account }) => {
				return {
					provider,
					account,
					usage: await callSubscriptionsAuth(rpc, "usage", {
						provider,
						account: account.key,
						force: false
					})
				};
			}));
			if (!mountedRef.current) return;
			const plans = /* @__PURE__ */ new Map();
			for (const r of results) {
				if (r.status !== "fulfilled") continue;
				const { provider, account, usage } = r.value;
				const key = keyOf(provider, account);
				if (usage.plan !== void 0) plans.set(key, usage.plan);
				if (!usage.supported || !usage.windows || usage.windows.length === 0) {
					lastKnown.delete(key);
					continue;
				}
				lastKnown.set(key, usage.windows);
			}
			const byProvider = /* @__PURE__ */ new Map();
			for (const { provider, account } of roster) {
				const key = keyOf(provider, account);
				const windows = lastKnown.get(key);
				if (windows === void 0) continue;
				const plan = plans.get(key) ?? account.plan;
				const row = {
					key: account.key,
					isDefault: account.isDefault,
					...account.account === void 0 ? {} : { account: account.account },
					...plan === void 0 ? {} : { plan },
					windows
				};
				const display = byProvider.get(provider);
				if (display === void 0) byProvider.set(provider, {
					provider,
					name: statusResp.providers[provider]?.displayName || PROVIDER_NAMES[provider],
					accounts: [row]
				});
				else display.accounts.push(row);
			}
			setDisplays([...byProvider.values()].map((row) => {
				const saved = recentNames.current.get(row.provider);
				return saved && saved.revision > revision ? {
					...row,
					name: saved.name
				} : row;
			}));
		} catch {} finally {
			inflightRef.current = false;
		}
	}, [rpc]);
	(0, react.useEffect)(() => {
		const update = (event) => {
			const { provider, displayName } = event.detail;
			recentNames.current.set(provider, {
				revision: ++namesRevision.current,
				name: displayName || PROVIDER_NAMES[provider]
			});
			setDisplays((current$1) => current$1.map((row) => row.provider === provider ? {
				...row,
				name: displayName || PROVIDER_NAMES[provider]
			} : row));
		};
		window.addEventListener(DISPLAY_NAME_CHANGED, update);
		return () => {
			window.removeEventListener(DISPLAY_NAME_CHANGED, update);
		};
	}, []);
	(0, react.useEffect)(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") return;
		refresh();
		const timer = setInterval(() => {
			refresh();
		}, USAGE_POLL_INTERVAL_MS);
		return () => {
			clearInterval(timer);
		};
	}, [refresh, displayMode]);
	(0, react.useEffect)(() => {
		if (currentRef.current === void 0) return;
		let cancelled = false;
		let inflight = false;
		const reload = () => {
			const read = currentRef.current;
			if (read === void 0 || inflight) return;
			inflight = true;
			read().then((model) => {
				if (cancelled) return;
				setLastSubscription((previous) => retainSubscriptionSelection(previous, model));
				setSelection(model);
			}, () => {}).finally(() => {
				inflight = false;
			});
		};
		reload();
		const timer = setInterval(reload, MODEL_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);
	const { useAnchoredPosition, useDismissOnOutsidePointer } = hostPrimitives();
	const pos = useAnchoredPosition({
		open,
		anchorRef: rootRef,
		panelRef,
		side: "top",
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	const tooltipPos = useAnchoredPosition({
		open: showTooltip,
		anchorRef: rootRef,
		panelRef: tooltipRef,
		side: "top",
		gap: PANEL_GAP,
		margin: PANEL_MARGIN
	});
	useDismissOnOutsidePointer(rootRef, open, setOpen, panelRef);
	(0, react.useEffect)(() => {
		if (!open && !showTooltip) return;
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				setOpen(false);
				setHover(false);
				setFocused(false);
				if (open) buttonRef.current?.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, showTooltip]);
	const [statsRow, setStatsRow] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		const seat$1 = seatRef.current;
		if (seat$1 === null) return;
		const scope = statsScopeOf(seat$1);
		if (scope === null) return;
		const find = () => scope.querySelector("[data-composer-stats]");
		setStatsRow(find());
		const observer = new MutationObserver(() => {
			setStatsRow(find());
		});
		observer.observe(scope, {
			childList: true,
			subtree: true
		});
		return () => {
			observer.disconnect();
		};
	}, []);
	(0, react.useEffect)(() => {
		if (displayMode === "hidden") setOpen(false);
	}, [displayMode]);
	const seat = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
		ref: seatRef,
		style: styles$1.seat,
		"aria-hidden": true
	});
	const collapsed = collapsedDisplays(displays, badgeSelection?.provider);
	if (displayMode === "hidden" || collapsed.length === 0) return seat;
	const label = compactSegment(collapsed[0], badgeSelection?.model, translate);
	const expanded = expandedDisplays(displays, badgeSelection?.provider);
	const title = translate("usageBadgeTitle");
	const toggle = () => {
		const next = !open;
		setOpen(next);
		setHover(false);
		setFocused(false);
		if (next) refresh();
	};
	const close = () => {
		setOpen(false);
		setHover(false);
		setFocused(false);
		buttonRef.current?.focus();
	};
	const tooltipAccount = pillAccountOf(collapsed[0]);
	const tooltipWindows = previewWindows(tooltipAccount.windows, badgeSelection?.model, collapsed[0].provider);
	const pill = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		ref: rootRef,
		style: styles$1.anchor,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: subscriptionChromeCss }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				ref: buttonRef,
				type: "button",
				className: "majed-subscription-usage-pill",
				style: {
					...styles$1.pill,
					...hover || open ? styles$1.pillActive : {}
				},
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				"aria-label": `${title} · ${label}`,
				"aria-describedby": showTooltip ? tooltipId : void 0,
				"aria-controls": open ? panelId : void 0,
				onMouseEnter: () => {
					setHover(true);
				},
				onMouseLeave: () => {
					setHover(false);
				},
				onFocus: () => {
					if (!open) setFocused(true);
				},
				onBlur: () => {
					setFocused(false);
				},
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						setHover(false);
						setFocused(false);
					}
				},
				onClick: toggle,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", {
					style: styles$1.label,
					children: label
				})]
			}),
			showTooltip && hostReactDom().createPortal(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: tooltipRef,
				id: tooltipId,
				role: "tooltip",
				className: "majed-subscription-usage-tooltip",
				style: {
					...styles$1.tooltip,
					...tooltipPos ?? MEASURE_STYLE
				},
				onMouseEnter: () => {
					setHover(true);
				},
				onMouseLeave: () => {
					setHover(false);
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
						style: styles$1.tooltipTitle,
						children: title
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", {
						style: styles$1.tooltipHint,
						title: tooltipAccount.account,
						children: tooltipAccount.account
					}),
					tooltipWindows.shown.map((w, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles$1.tooltipRow,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: usageWindowLabel(translate, w) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("bdi", {
							style: {
								display: "inline-flex",
								alignItems: "center",
								gap: 5
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageRing, { percent: usedPercent(w) }),
								usedPercent(w),
								"%",
								w.resetsAt !== void 0 && ` · ${translate("usageBadgeReset", { time: windowLabel(w) })}`
							]
						})]
					}, i)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles$1.tooltipHint,
						children: translate("usageBadgeOpenDetails")
					})
				]
			}), document.body),
			open && hostReactDom().createPortal(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: panelRef,
				id: panelId,
				role: "dialog",
				"aria-label": title,
				className: "majed-subscription-usage-panel",
				style: {
					...styles$1.panel,
					...pos ?? MEASURE_STYLE
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles$1.title,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: styles$1.titleLabel,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UsageBadgeIcon, {}), title]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "majed-subscription-usage-close",
							"aria-label": translate("usageBadgeClose"),
							onClick: close,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
								width: "16",
								height: "16",
								viewBox: "0 0 24 24",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								"aria-hidden": true,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "m6 6 12 12M6 18 18 6" })
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: styles$1.titleRule,
						"aria-hidden": true
					}),
					expanded.map((d, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						style: index === 0 ? void 0 : styles$1.section,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: styles$1.providerRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: styles$1.providerName,
								children: [d.name, d.provider === current && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles$1.currentTag,
									children: translate("usageBadgeCurrent")
								})]
							}), d.accounts.length === 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
								account: d.accounts[0],
								translate
							})]
						}), d.accounts.map((account, accountIndex) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: accountIndex === 0 ? void 0 : styles$1.accountBlock,
							children: [d.accounts.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: styles$1.accountRow,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountMeta, {
									account,
									translate
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(AccountWindows, {
								windows: account.windows,
								model: d.provider === badgeSelection?.provider ? badgeSelection.model : void 0,
								provider: d.provider,
								translate
							}, `${d.provider}:${badgeSelection?.model ?? ""}`)]
						}, account.key))]
					}, d.provider))
				]
			}), document.body)
		]
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [seat, statsRow !== null && statsRow.isConnected ? hostReactDom().createPortal(pill, statsRow) : pill] });
}
/**
* Nearest ancestor of the dock seat that can contain the host's stats row:
* the composer bar. Bounded so a badge in an unfamiliar layout never adopts
* some other composer's pills.
*/
function statsScopeOf(seat) {
	let node = seat.parentElement;
	for (let depth = 0; node !== null && depth < 4; depth++) {
		if (node.querySelector("[data-composer-stats]") !== null) return node;
		node = node.parentElement;
	}
	return seat.parentElement;
}
/**
* One account's handle and plan: `★ user@example.com · Plan: pro`. The star
* marks the default account (the one direct routes serve and the collapsed
* pill reads), the same glyph Settings → Subscriptions uses.
*/
function AccountMeta({ account, translate }) {
	const parts = [account.account, account.plan === void 0 ? void 0 : translate("usagePlan", { plan: account.plan })].filter((part) => part !== void 0 && part !== "");
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
		style: styles$1.providerMeta,
		title: account.account,
		children: [account.isDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			style: styles$1.defaultStar,
			"aria-label": translate("defaultAccount"),
			children: ["★", " "]
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
			style: {
				display: "flex",
				flexDirection: "column",
				gap: 2
			},
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("bdi", { children: parts[0] }), parts[1] && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: parts[1] })]
		})]
	});
}
/** Preview each account independently; all remaining quotas stay accessible. */
function AccountWindows({ windows, model, provider, translate }) {
	const { shown, hidden } = previewWindows(windows, model, provider);
	const rows = (items) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
		style: styles$1.details,
		children: items.map((w, i) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WindowRow, {
			label: `${usageWindowLabel(translate, w)}${model !== void 0 && w.scope === model ? ` · ${translate("usageBadgeCurrent")}` : ""}`,
			window: w
		}, i))
	});
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [rows(shown), hidden.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
		style: styles$1.moreWindows,
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", {
			style: styles$1.moreSummary,
			children: translate("usageBadgeMoreWindows", { count: hidden.length })
		}), rows(hidden)]
	})] });
}
function UsageRing({ percent }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 20 20",
		"aria-hidden": "true",
		style: {
			flexShrink: 0,
			transform: "rotate(-90deg)"
		},
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
			cx: "10",
			cy: "10",
			r: "7",
			fill: "none",
			stroke: "var(--dsw-alias-border-l2)",
			strokeWidth: "3"
		}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
			cx: "10",
			cy: "10",
			r: "7",
			fill: "none",
			stroke: usageBarColor(percent),
			strokeWidth: "3",
			pathLength: "100",
			strokeDasharray: `${percent} 100`
		})]
	});
}
/** One `dt`/`dd` pair: window name → `25% · 6d 1h`, with the bar underneath. */
function WindowRow({ label, window: w }) {
	const percent = usedPercent(w);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", {
			style: styles$1.dt,
			children: label
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
			style: styles$1.dd,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [percent, "%"] }), w.resetsAt !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				style: styles$1.reset,
				children: [" · ", windowLabel(w)]
			})]
		}),
		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			role: "progressbar",
			"aria-label": label,
			"aria-valuenow": percent,
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			style: styles$1.bar,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { style: {
				...styles$1.barFill,
				width: `${percent}%`,
				background: usageBarColor(percent)
			} })
		})
	] });
}
/**
* Unplaced portal panel: hidden but laid out so the clamp measures real
* dimensions (the `useAnchoredPosition` measure pass).
*/
const MEASURE_STYLE = {
	visibility: "hidden",
	left: 0,
	top: 0
};
const styles$1 = {
	seat: { display: "none" },
	anchor: {
		minWidth: 0,
		maxWidth: "min(100%, 100vw - 24px)",
		display: "inline-flex",
		flexShrink: 1
	},
	pill: {
		boxSizing: "border-box",
		minWidth: 0,
		maxWidth: "100%",
		color: "var(--dsw-alias-label-tertiary)",
		font: "inherit",
		fontSize: "calc(var(--dsh-content-font-size-secondary, 13px) - 1px)",
		fontVariantNumeric: "tabular-nums",
		lineHeight: "calc(20px + var(--dsh-content-font-delta-secondary, 0px))",
		whiteSpace: "nowrap",
		background: "transparent",
		border: "none",
		borderRadius: "var(--dsw-radius-sm, 8px)",
		alignItems: "center",
		gap: 6,
		padding: "1px 8px",
		display: "inline-flex",
		cursor: "pointer"
	},
	pillActive: {
		background: "var(--dsw-alias-interactive-bg-hover)",
		color: "var(--dsw-alias-label-secondary)"
	},
	label: {
		textOverflow: "ellipsis",
		minWidth: 0,
		overflow: "hidden"
	},
	panel: {
		position: "fixed",
		zIndex: 1100,
		boxSizing: "border-box",
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-overlay))",
		width: "min(400px, 100vw - 24px)",
		minWidth: 0,
		maxWidth: "calc(100vw - 24px)",
		maxHeight: "min(560px, 100dvh - 24px)",
		overflowY: "auto",
		overscrollBehavior: "contain",
		boxShadow: "var(--dsw-elevation-prominent)",
		color: "var(--dsw-alias-label-secondary)",
		cursor: "default",
		border: 0,
		borderRadius: "var(--dsw-radius-lg, 16px)",
		padding: 16,
		fontSize: 12,
		lineHeight: "18px"
	},
	tooltip: {
		position: "fixed",
		zIndex: 1101,
		boxSizing: "border-box",
		width: "min(300px, 100vw - 24px)",
		padding: "8px 10px",
		borderRadius: "var(--dsw-radius-lg, 16px)",
		background: "var(--dsw-specific-menu, var(--dsw-alias-bg-overlay))",
		boxShadow: "var(--dsw-elevation-prominent)",
		color: "var(--dsw-alias-label-secondary)",
		fontSize: 12,
		lineHeight: "18px",
		display: "flex",
		flexDirection: "column",
		gap: 4,
		overflowWrap: "anywhere",
		maxHeight: "calc(100dvh - 24px)",
		overflowY: "auto"
	},
	tooltipTitle: {
		color: "var(--dsw-alias-label-primary)",
		fontWeight: 500
	},
	tooltipRow: {
		display: "flex",
		justifyContent: "space-between",
		flexWrap: "wrap",
		gap: "2px 8px",
		fontVariantNumeric: "tabular-nums"
	},
	tooltipHint: {
		color: "var(--dsw-alias-label-tertiary)",
		paddingBlockStart: 2
	},
	title: {
		color: "var(--dsw-alias-label-primary)",
		display: "flex",
		justifyContent: "space-between",
		gap: 16,
		marginBottom: 8,
		fontWeight: 500
	},
	titleLabel: {
		alignItems: "center",
		gap: 6,
		minWidth: 0,
		display: "inline-flex"
	},
	titleRule: {
		borderTop: "0.5px solid var(--dsw-alias-border-l2)",
		marginBottom: 10
	},
	section: {
		marginTop: 12,
		paddingTop: 10,
		borderTop: "0.5px solid var(--dsw-alias-border-l2)"
	},
	providerRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "baseline",
		flexWrap: "wrap",
		gap: "4px 12px",
		marginBottom: 8
	},
	providerName: {
		color: "var(--dsw-alias-label-primary)",
		fontWeight: 500,
		display: "inline-flex",
		flexWrap: "wrap",
		overflowWrap: "anywhere",
		alignItems: "center",
		gap: 6
	},
	currentTag: {
		fontSize: 10,
		lineHeight: "14px",
		fontWeight: 400,
		padding: "0 5px",
		borderRadius: 7,
		color: "var(--dsw-alias-label-secondary)",
		background: "var(--dsw-alias-interactive-bg-hover)"
	},
	providerMeta: {
		color: "var(--dsw-alias-label-tertiary)",
		minWidth: 0,
		overflowWrap: "anywhere",
		display: "inline-flex",
		alignItems: "baseline",
		gap: 4,
		fontSize: 11
	},
	defaultStar: { color: "var(--dsw-alias-state-warn-label)" },
	accountBlock: { marginTop: 8 },
	accountRow: {
		display: "flex",
		marginBottom: 4
	},
	details: {
		color: "var(--dsw-alias-label-tertiary)",
		display: "grid",
		gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
		gap: "4px 16px",
		margin: 0
	},
	moreWindows: { marginTop: 8 },
	moreSummary: {
		cursor: "pointer",
		color: "var(--dsw-alias-label-secondary)",
		marginBottom: 8
	},
	dt: {
		minWidth: 0,
		margin: 0,
		overflowWrap: "anywhere"
	},
	dd: {
		minWidth: 0,
		margin: 0,
		color: "var(--dsw-alias-label-secondary)",
		fontVariantNumeric: "tabular-nums",
		textAlign: "end",
		overflowWrap: "anywhere"
	},
	reset: { color: "var(--dsw-alias-label-tertiary)" },
	bar: {
		gridColumn: "1 / -1",
		height: 4,
		borderRadius: 2,
		overflow: "hidden",
		background: "var(--dsw-alias-border-l2)",
		marginBottom: 2
	},
	barFill: {
		height: "100%",
		borderRadius: 2
	}
};

//#endregion
//#region src/usage-badge/UsageBadgeDisplaySetting.tsx
/** Browser-local display preference; never changes provider or account settings. */
function UsageBadgeDisplaySetting({ t }) {
	const mode = useUsageBadgeMode();
	const [failed, setFailed] = (0, react.useState)(false);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: styles.card,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				style: styles.field,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("usageBadgeDisplay") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
					style: styles.select,
					"aria-label": t("usageBadgeDisplay"),
					value: mode,
					onChange: (event) => {
						const value = event.currentTarget.value;
						if (value !== "recent" && value !== "hidden") return;
						try {
							setUsageBadgeMode(value);
							setFailed(false);
						} catch (error) {
							if (!(error instanceof DOMException) || !["SecurityError", "QuotaExceededError"].includes(error.name)) throw error;
							setFailed(true);
						}
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "recent",
						children: t("usageBadgeDisplayRecent")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: "hidden",
						children: t("usageBadgeDisplayHidden")
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				style: styles.hint,
				children: t("usageBadgeDisplayHint")
			}),
			failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				role: "alert",
				style: {
					...styles.hint,
					color: "var(--dsw-alias-state-error-primary)"
				},
				children: t("usageBadgeDisplaySaveFailed")
			})
		]
	});
}
const styles = {
	card: {
		border: "0.5px solid var(--dsw-alias-settings-card-stroke, var(--dsw-alias-border-l4))",
		borderRadius: "var(--dsw-radius-xl, 20px)",
		background: "var(--dsw-alias-settings-card-fill, var(--dsw-alias-bg-layer-2))",
		padding: "12px 14px",
		display: "flex",
		flexDirection: "column",
		gap: 6
	},
	field: {
		display: "flex",
		flexDirection: "column",
		gap: 6,
		fontSize: 13,
		fontWeight: 500,
		lineHeight: "20px"
	},
	select: { width: "100%" },
	hint: {
		margin: 0,
		fontSize: 12,
		lineHeight: "18px",
		color: "var(--dsw-alias-label-tertiary)"
	}
};

//#endregion
//#region src/usage-badge/error-boundary.ts
function guarded(React, Component, label, report = (message, error) => console.error(message, error)) {
	class Boundary extends React.Component {
		state = { failed: false };
		static getDerivedStateFromError() {
			return { failed: true };
		}
		componentDidCatch(error) {
			report(`dsh-majed: ${label} failed to render`, error);
		}
		render() {
			return this.state.failed ? null : React.createElement(Component, this.props);
		}
	}
	const wrapped = (props) => React.createElement(Boundary, props);
	Object.defineProperty(wrapped, "name", { value: `Guarded${label.replace(/\W+/g, "")}` });
	return wrapped;
}

//#endregion
//#region src/browser.ts
function applySubscriptions(root) {
	const report = (error) => console.error("dsh-majed: Subscriptions setup failed", error);
	function isolate(callback) {
		try {
			const result = callback();
			if (result && typeof result.then === "function") return Promise.resolve(result).catch(report);
			return result;
		} catch (error) {
			report(error);
		}
	}
	isolate(() => root.inject([
		"connection",
		"slots",
		"locale"
	], (ctx) => isolate(() => {
		const connection = ctx.get("connection");
		const React = require("react");
		const h = React.createElement;
		const primitives$1 = require("@deepseek-ai/dsh-client-ui-primitives");
		const NS = "majed.subscriptions";
		isolate(() => ctx.effect(() => isolate(() => ctx.locale.register(NS, {
			en: subscriptions$1,
			ar: subscriptions
		})), "dsh-majed: subscriptions dictionaries"));
		const t = ctx.locale.bind(NS);
		const CodexCard = createCodexCard(React, primitives$1, connection.rpc, t);
		const CopilotCard = guarded(React, createCopilotCard(React, primitives$1, connection.rpc, t), "Copilot card");
		const ClaudeCard = guarded(React, createClaudeCard(React, primitives$1, connection.rpc, t), "Claude card");
		const AntigravityCard = guarded(React, createAntigravityCard(React, primitives$1, connection.rpc, t), "Antigravity card");
		const ZenCard = guarded(React, createZenCard(React, primitives$1, connection.rpc, t), "Zen card");
		const GrokCard = guarded(React, createGrokCard(React, primitives$1, connection.rpc, t), "Grok card");
		const GuardedSetting = guarded(React, UsageBadgeDisplaySetting, "usage display setting");
		const GuardedProxy = guarded(React, ProxySettings, "proxy setting");
		const GuardedSpeed = guarded(React, SpeedSelect, "Speed control");
		const GuardedBadge = guarded(React, SubscriptionUsageBadge, "usage badge");
		const listeners = /* @__PURE__ */ new Set();
		let ApiProviders;
		const SubscriptionProviders = createApiProviders(React, null, t, primitives$1);
		isolate(() => ctx.inject([
			"remote",
			"remote.settings",
			"remote.credentials",
			"remote.llm"
		], (scope) => {
			ApiProviders = guarded(React, createApiProviders(React, scope.remote, t, primitives$1), "API providers");
			listeners.forEach((listener) => listener());
			return () => {
				ApiProviders = void 0;
				listeners.forEach((listener) => listener());
			};
		}));
		const providerCards = {
			codex: CodexCard,
			claude: ClaudeCard,
			grok: GrokCard,
			antigravity: AntigravityCard,
			copilot: CopilotCard
		};
		function UnifiedProviders() {
			const [status, setStatus] = React.useState(null);
			const [revision, setRevision] = React.useState(0);
			const [error, setError] = React.useState(false);
			const alive = React.useRef(true);
			const refresh = async () => {
				try {
					const answer = await connection.rpc.call("/api", "majed-subscriptions.status", {});
					if (!answer?.ok) throw new Error();
					if (alive.current) {
						setStatus(answer.value);
						setRevision((value) => value + 1);
						setError(false);
					}
				} catch {
					if (alive.current) setError(true);
				}
			};
			React.useEffect(() => {
				alive.current = true;
				refresh();
				return () => {
					alive.current = false;
				};
			}, []);
			const providers = Object.keys(providerCards).map((id) => ({
				id,
				name: {
					codex: "Codex (ChatGPT)",
					claude: "Claude",
					grok: "Grok",
					antigravity: "Antigravity",
					copilot: "GitHub Copilot"
				}[id]
			}));
			const rows = providers.filter(({ id }) => status?.providers?.[id]?.accounts?.length).map(({ id }, index) => h("li", {
				key: id,
				"data-majed-subscription-row": id
			}, h(providerCards[id], {
				presentation: "group",
				initialExpanded: index === 0,
				revision,
				onAccountsChange: refresh
			})));
			return h(React.Fragment, null, error ? h("p", { role: "alert" }, t("unreachable")) : null, h(SubscriptionProviders, {
				showAPI: false,
				showSubscriptionAdd: true,
				subscriptions: {
					rows,
					providers,
					renderAuth: (id, done, onFlowState) => id ? h(providerCards[id], {
						key: id,
						presentation: "auth",
						onFlowState,
						onComplete: () => {
							done();
							refresh();
						}
					}) : null
				}
			}), h("section", {
				"data-majed-provider-group": "free",
				className: "majed-provider-group",
				style: { marginBlockStart: 24 },
				"aria-label": t("freeProviders")
			}, h("h3", { className: "majed-provider-title" }, t("freeProviders")), h("ul", { className: "majed-api-rows" }, h("li", null, h(ZenCard)))));
		}
		let present = false;
		let failing = false;
		let referenceEnabled = false;
		let disposed = false;
		let sequence = 0;
		let withdraw;
		function Section() {
			React.useSyncExternalStore((fn) => {
				listeners.add(fn);
				return () => listeners.delete(fn);
			}, () => `${failing}:${referenceEnabled}:${!!ApiProviders}`);
			return h("div", {
				className: "majed-subscriptions-page",
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 24,
					maxInlineSize: 720,
					minInlineSize: 0,
					textAlign: "start",
					color: "var(--dsw-alias-label-primary)",
					fontSize: 14,
					lineHeight: "22px"
				}
			}, h("style", null, controlCss + `
          .majed-subscriptions-page .majed-page-settings>h3{margin:0;font-size:16px;line-height:24px;font-weight:500}
          .majed-subscriptions-page .majed-page-settings-content{display:flex;flex-direction:column;gap:12px;padding-block-start:12px}
          .majed-subscriptions-page .majed-proxy-settings{padding:14px 16px;border:0.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-xl,20px);background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-2))}
          .majed-subscriptions-page .majed-proxy-settings header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
          .majed-subscriptions-page .majed-proxy-settings p{margin:8px 0 0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
        `), h("header", {
				className: "majed-providers-identity",
				style: {
					display: "flex",
					alignItems: "center",
					gap: 8
				}
			}, h("svg", {
				width: 20,
				height: 20,
				viewBox: "0 0 24 24",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: 1.5,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				"aria-hidden": true,
				style: { flexShrink: 0 }
			}, h("rect", {
				x: 8,
				y: 8,
				width: 8,
				height: 8,
				rx: 2
			}), h("path", { d: "M12 3v5m0 8v5M3 12h5m8 0h5M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" })), h("h2", { style: {
				margin: 0,
				fontSize: 18,
				lineHeight: "26px",
				fontWeight: 500,
				overflowWrap: "anywhere"
			} }, t("title"))), referenceEnabled ? h("p", { role: "status" }, t("coexistence")) : null, failing ? h("p", { role: "alert" }, t("unreachable")) : null, h("section", {
				"data-majed-settings": true,
				className: "majed-page-settings"
			}, h("h3", null, t("pageSettings")), h("div", { className: "majed-page-settings-content" }, h(GuardedProxy, {
				rpc: connection.rpc,
				t
			}), h(GuardedSetting, { t }))), h("section", { style: {
				display: "flex",
				flexDirection: "column",
				gap: 12,
				minInlineSize: 0
			} }, h("p", { style: {
				margin: 0,
				color: "var(--dsw-alias-label-secondary)",
				fontSize: 13,
				lineHeight: "20px"
			} }, t("providersHint")), h(UnifiedProviders)));
		}
		const models = () => ctx.get("modelDirectories");
		const surfaceWanted = () => !disposed && present && !referenceEnabled;
		const surfaces = [];
		let surfacesActive = false;
		function syncSurfaces() {
			if (surfaceWanted() && !surfacesActive) {
				surfacesActive = true;
				const add = (register) => isolate(() => {
					const off = register();
					if (typeof off === "function") surfaces.push(off);
				});
				for (const [name, view, inject] of [[
					"image_generate",
					ImageGenerateToolview,
					() => ({ load: createImageLoader(connection.rpc) })
				], [
					"video_generate",
					VideoGenerateToolview,
					() => ({ loadVideo: createVideoLoader(connection.rpc) })
				]]) for (const key of [name, `dsh_majed_${name}`]) add(() => ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
					name: "tool.call.toolview",
					id: `majed-toolview-${key}`,
					key,
					locale: NS,
					inject
				}, guarded(React, view, name))));
				add(() => ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
					name: "conversation.input.right",
					id: "majed-subscription-speed",
					order: 0,
					locale: NS,
					inject: (sessionId) => ({
						loadSpeed: createSpeedLoader(connection, models, sessionId),
						setSpeed: createSpeedSetter(connection, sessionId)
					})
				}, GuardedSpeed)));
				add(() => ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
					name: "conversation.composer.dock",
					id: "majed-subscription-usage",
					order: 10,
					locale: NS,
					inject: (sessionId) => ({
						rpc: connection.rpc,
						currentModel: createCurrentModelReader(models, sessionId)
					})
				}, GuardedBadge)));
			} else if (!surfaceWanted() && surfacesActive) {
				surfacesActive = false;
				for (const off of surfaces.splice(0)) isolate(off);
			}
		}
		isolate(() => ctx.inject(["commandUi"], (scope) => isolate(() => {
			const command = scope.get("commandUi");
			scope.effect(() => command.register({
				name: "fast",
				description: fastCommandDescription(() => t("commandFast")),
				available: () => surfaceWanted(),
				ui: {
					kind: "popupSelect",
					options: async (session) => {
						if (!surfaceWanted()) throw new Error(t("commandFastUnavailable"));
						const state = await createSpeedLoader(connection, models, session.sessionId)();
						if (!state.visible) throw new Error(t("commandFastUnavailable"));
						return [{
							id: "standard",
							label: t("speedStandard"),
							detail: t("speedStandardDescription")
						}, {
							id: "fast",
							label: t("speedFast"),
							detail: t("speedFastDescription")
						}].map((option) => ({
							...option,
							active: option.id === state.tier
						}));
					},
					onSelect: async (option, session) => {
						if (!surfaceWanted()) return;
						await createSpeedSetter(connection, session.sessionId)(option.id);
					}
				}
			}), "dsh-majed: /fast contribution");
		})));
		function update() {
			isolate(syncSurfaces);
			if (present && !withdraw) withdraw = ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "majed-subscriptions",
				order: 90,
				label: () => t("title")
			}, Section));
			else if (!present && withdraw) {
				withdraw();
				withdraw = void 0;
			}
			listeners.forEach((listener) => listener());
		}
		async function probe() {
			const current = ++sequence;
			probeReference(current);
			try {
				const result = await connection.rpc.call("/api", "majed-subscriptions.status", {});
				if (disposed || current !== sequence) return;
				present = true;
				failing = !(result?.ok && result.value?.component === "subscriptions");
			} catch (error) {
				if (disposed || current !== sequence) return;
				if (error instanceof Error && error.message === "transport failure for /api/majed-subscriptions.status: HTTP 404") {
					present = false;
					failing = false;
				} else {
					present = true;
					failing = true;
				}
			}
			isolate(update);
		}
		async function probeReference(current) {
			let enabled = false;
			try {
				enabled = (await connection.rpc.call("/api", "subscriptions-auth.proxyGet", {}))?.ok === true;
			} catch {}
			if (disposed || current !== sequence) return;
			referenceEnabled = enabled;
			isolate(update);
		}
		isolate(() => ctx.effect(() => isolate(() => {
			probe();
			const unsubscribe = connection.state.subscribe(() => {
				if (connection.state.getSnapshot() === "connected") probe();
			});
			const timer = setInterval(() => {
				probe();
			}, 3e3);
			return () => {
				disposed = true;
				sequence++;
				clearInterval(timer);
				unsubscribe();
				isolate(syncSurfaces);
				withdraw?.();
				listeners.clear();
			};
		}), "dsh-majed: subscriptions presence"));
	})));
}

//#endregion
exports.applySkills = applySkills;
exports.applySubscriptions = applySubscriptions;
return module.exports; };