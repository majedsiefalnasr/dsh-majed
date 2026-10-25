// Client-side inline image toolview for the `image_generate` and `image_edit` tools.
//
// Renders the generated/edited image inline in the conversation: a settled success
// loads the image bytes through the image RPC loader (bare file name), builds a
// Blob URL and displays it in a native `` element. Progress, loading and error
// states are driven by the job's progressToken / errorToken so local and remote UI
// stays usable without resubmitting. Object URLs are revoked on unmount or
// cancellation.

window.__ModuleLoader__.load({
  id: 'dsh-majed/internal/image',
  factory: require => {
    const React = require('react');
    const h = React.createElement;
    const PROMPT_MAX_LENGTH = 60;
    const styles = {
      container: { display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' },
      row: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
      icon: { display: 'inline-flex', flexShrink: 0, color: 'var(--dsw-alias-label-tertiary)' },
      title: {
        fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-primary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      },
      subtle: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-tertiary)' },
      output: {
        margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-label-secondary)',
        whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
      },
      error: { margin: 0, fontSize: 12, lineHeight: '18px', color: 'var(--dsw-alias-state-error-primary)' },
      image: {
        display: 'block', maxWidth: 480, width: '100%', borderRadius: 8,
        backgroundColor: 'var(--dsw-alias-fill-tertiary)',
      },
    };

    function fallbackTranslate(key, params) {
      const table = {
        generatingImage: 'Generating image…',
        editingImage: 'Editing image…',
        imageLoading: 'Loading image…',
        imageLoadFailed: 'Failed to load image: {message}',
        imageUnknownJob: 'Unknown image job.',
        imageFailed: 'Image generation failed: {message}',
      };
      let text = table[key] ?? key;
      for (const [name, value] of Object.entries(params ?? {})) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
      return text;
    }

    function derivePrompt(argsRaw) {
      let parsed;
      try { parsed = JSON.parse(argsRaw); } catch { parsed = undefined; }
      let prompt;
      if (typeof parsed === 'object' && parsed !== null) {
        if (typeof parsed.prompt === 'string' && parsed.prompt !== '') prompt = parsed.prompt;
        else for (const value of Object.values(parsed)) {
          if (typeof value === 'string' && value !== '') { prompt = value; break; }
        }
      }
      const line = (prompt ?? argsRaw).split('\n', 1)[0] ?? '';
      return line.length > PROMPT_MAX_LENGTH ? `${line.slice(0, PROMPT_MAX_LENGTH)}…` : line;
    }

    function base64Bytes(dataBase64) {
      const binary = atob(dataBase64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
      return bytes;
    }

    function ImageToolview(props) {
      const { block, loadImage, t } = props;
      const translate = t ?? fallbackTranslate;
      const settled = block !== undefined && 'kind' in block;
      const isError = settled && block.isError;
      const fileName = settled && !isError && block.meta
        && typeof block.meta.fileName === 'string' && block.meta.fileName.length > 0
        ? block.meta.fileName : undefined;
      const toolName = settled ? (block.call && block.call.name) : (block && block.toolName);
      const [load, setLoad] = React.useState({ phase: 'loading' });
      React.useEffect(() => {
        if (fileName === undefined || typeof loadImage !== 'function') return;
        let cancelled = false;
        let objectUrl;
        setLoad({ phase: 'loading' });
        loadImage(fileName).then(image => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(new Blob([base64Bytes(image.dataBase64).slice()], { type: image.mediaType }));
          setLoad({ phase: 'ready', url: objectUrl });
        }, error => {
          if (cancelled) return;
          setLoad({ phase: 'failed', message: error instanceof Error ? error.message : String(error) });
        });
        return () => { cancelled = true; if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl); };
      }, [fileName, loadImage]);
      if (block === undefined) return null;
      const argsRaw = (settled ? block.call?.argsRaw : 'argsRaw' in block ? block.argsRaw : undefined) ?? '';
      const title = `${toolName || 'image'}: ${derivePrompt(argsRaw)}`;
      const text = settled ? (block.text ?? '') : '';
      return h('div', { style: styles.container },
        h('div', { style: styles.row },
          h('span', { style: styles.icon }, h('span', { style: { fontSize: 14 } }, '✨')),
          h('span', { style: styles.title }, title)),
        !settled && h('p', { style: styles.subtle }, modeLabel(toolName, translate)),
        settled && isError && text !== '' && h('p', { style: styles.error }, text.split('\n', 1)[0]),
        settled && !isError && fileName !== undefined && load.phase === 'loading' && h('p', { style: styles.subtle }, translate('imageLoading')),
        settled && !isError && fileName !== undefined && load.phase === 'failed' && h('p', { style: styles.error }, translate('imageLoadFailed', { message: load.message })),
        settled && !isError && fileName !== undefined && load.phase === 'ready' && h('img', {
          style: styles.image, src: load.url, alt: derivePrompt(argsRaw),
        }),
        settled && !isError && fileName === undefined && text !== '' && h('p', { style: styles.output }, text));
    }

    function modeLabel(toolName, translate) {
      return toolName === 'image_edit' ? translate('editingImage') : translate('generatingImage');
    }

    function apply(ctx, options = {}) {
      const loadImage = options.loadImage;
      if (typeof loadImage !== 'function') return;
      for (const tool of ['image_generate', 'image_edit']) {
        ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
          name: 'tool.call.toolview', id: `majed-image-${tool === 'image_generate' ? 'generate' : 'edit'}`, order: 90,
          tool,
        }, props => h(ImageToolview, { ...props, loadImage })));
      }
    }
    return { apply, ImageToolview };
  }
});
