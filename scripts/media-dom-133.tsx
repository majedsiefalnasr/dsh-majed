// Controlled browser fixture: no host or provider requests, synthetic media only.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MessageImage } from '../src/ImageGallery.js';
import { VideoGenerateToolview } from '../src/VideoGenerateToolview.js';
import en from '../locale/en.json';
import ar from '../locale/ar.json';
const params = new URLSearchParams(location.search);
const locale = params.get('locale') === 'ar' ? 'ar' : 'en';
const dark = params.get('theme') === 'dark';
const dictionary = locale === 'ar' ? ar.subscriptions : en.subscriptions;
document.documentElement.lang = locale; document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
document.body.style.cssText = `background:${dark ? '#15171c' : '#fff'};color:${dark ? '#fff' : '#202124'};padding:24px`;
document.documentElement.style.cssText = `--dsw-font-s-12:12px/18px sans-serif;--dsw-font-s-13:13px/20px sans-serif;--dsw-alias-label-primary:${dark ? '#fff' : '#202124'};--dsw-alias-label-tertiary:${dark ? '#aaa' : '#555'};--dsw-alias-state-error-primary:${dark ? '#f99' : '#a22'};--dsw-alias-bg-mask-1:#0009;--dsw-alias-bg-layer-1:${dark ? '#15171c' : '#fff'};--dsw-alias-fill-tertiary:#8883`;
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="teal"/></svg>');
const t = (key: keyof typeof dictionary, values?: Record<string, unknown>) => Object.entries(values ?? {}).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), dictionary[key]);
createRoot(document.getElementById('root')!).render(<><MessageImage attachment={{ attachmentId: 'fixture', mediaType: 'image/png', bytes: 1, width: 120, height: 80 }} variant="single" load={async () => image} labels={{ image: dictionary.image, open: dictionary.viewImage, openNamed: name => dictionary.viewImageNamed.replace('{name}', name), loading: dictionary.imageLoading, loadFailed: dictionary.imageLoadFailed, lightbox: { dialog: dictionary.imagePreview, close: dictionary.close } }} /><VideoGenerateToolview t={t} block={{ kind: 'result', call: { argsRaw: '{"prompt":"fixture"}' }, content: [{ type: 'text', text: 'Saved video to /fixture/video-dom.mp4' }], isError: false } as never} loadVideo={async () => ({ mediaType: 'video/mp4', dataBase64: 'AAAAAGZ0eXA=' })} /></>);
