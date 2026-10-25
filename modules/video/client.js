// Client-side inline video toolview for the `video_generate` tool.
//
// Renders the generated video inline in the conversation: a settled success
// loads the MP4 bytes through the `/api/subscriptions-auth.video` endpoint
// (bare file name), builds a Blob URL and plays it in a native
// `<video controls>` element. Progress, loading and error states are driven by
// the job's progressToken / errorToken so local and remote UI stays usable
// without resubmitting. Object URLs are revoked on unmount or cancellation.

window.__ModuleLoader__.load({
  id: 'dsh-majed/internal/video',
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
      video: {
        display: 'block', maxWidth: 480, width: '100%', borderRadius: 8,
        backgroundColor: 'var(--dsw-alias-fill-tertiary)',
      },
    };

    function fallbackTranslate(key, params) {
      const table = {
        generatingVideo: 'Generating video…',
        videoLoading: 'Loading video…',
        videoLoadFailed: 'Failed to load video: {message}',
        videoUnknownJob: 'Unknown video job.',
        videoFailed: 'Video generation failed: {message}',
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

    function VideoGenerateToolview(props) {
      const { block, loadVideo, t } = props;
      const translate = t ?? fallbackTranslate;
      const settled = block !== undefined && 'kind' in block;
      const isError = settled && block.isError;
      const fileName = settled && !isError && block.meta
        && typeof block.meta.fileName === 'string' && block.meta.fileName.length > 0
        ? block.meta.fileName : undefined;
      const [load, setLoad] = React.useState({ phase: 'loading' });
      React.useEffect(() => {
        if (fileName === undefined || typeof loadVideo !== 'function') return;
        let cancelled = false;
        let objectUrl;
        setLoad({ phase: 'loading' });
        loadVideo(fileName).then(video => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(new Blob([base64Bytes(video.dataBase64).slice()], { type: video.mediaType }));
          setLoad({ phase: 'ready', url: objectUrl });
        }, error => {
          if (cancelled) return;
          setLoad({ phase: 'failed', message: error instanceof Error ? error.message : String(error) });
        });
        return () => { cancelled = true; if (objectUrl !== undefined) URL.revokeObjectURL(objectUrl); };
      }, [fileName, loadVideo]);
      if (block === undefined) return null;
      const argsRaw = (settled ? block.call?.argsRaw : 'argsRaw' in block ? block.argsRaw : undefined) ?? '';
      const title = `video_generate: ${derivePrompt(argsRaw)}`;
      const text = settled ? (block.text ?? '') : '';
      return h('div', { style: styles.container },
        h('div', { style: styles.row },
          h('span', { style: styles.icon }, h('span', { style: { fontSize: 14 } }, '✨')),
          h('span', { style: styles.title }, title)),
        !settled && h('p', { style: styles.subtle }, translate('generatingVideo')),
        settled && isError && text !== '' && h('p', { style: styles.error }, text.split('\n', 1)[0]),
        settled && !isError && fileName !== undefined && load.phase === 'loading' && h('p', { style: styles.subtle }, translate('videoLoading')),
        settled && !isError && fileName !== undefined && load.phase === 'failed' && h('p', { style: styles.error }, translate('videoLoadFailed', { message: load.message })),
        settled && !isError && fileName !== undefined && load.phase === 'ready' && h('video', {
          style: styles.video, src: load.url, controls: true, preload: 'metadata',
        }),
        settled && !isError && fileName === undefined && text !== '' && h('p', { style: styles.output }, text));
    }

    function apply(ctx, options = {}) {
      const loadVideo = options.loadVideo;
      if (typeof loadVideo !== 'function') return;
      ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
        name: 'tool.call.toolview', id: 'majed-video-generate', order: 90,
        tool: 'video_generate',
      }, props => h(VideoGenerateToolview, { ...props, loadVideo })));
    }
    return { apply, VideoGenerateToolview };
  }
});
