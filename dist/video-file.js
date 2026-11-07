import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { join } from 'node:path';
import { legacyMediaDirectory } from './storage-migration.js';
import { VIDEO_FILE_ROUTE } from './video-route.js';
import { videosDirectory } from './tools/video-generate.js';
/** Largest video the Waycraft endpoints will serve. */
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_NAME = /^video-[a-zA-Z0-9_-]+\.mp4$/;
/**
 * Open one generated video for reading after the ownership, type, size and
 * MP4-signature checks. The caller owns (and must close) the handle.
 * @param file - bare file name produced by the video tool.
 */
export async function openVideoFile(file) {
    if (!VIDEO_NAME.test(file))
        throw new Error('Invalid video name');
    // Lazy media migration: a video generated before the rename is served from the
    // untouched legacy directory (never copied, never modified).
    let directory = videosDirectory();
    const legacyDirectory = legacyMediaDirectory(directory);
    if (legacyDirectory !== undefined &&
        !(await lstat(join(directory, file)).then(() => true, () => false)))
        directory = legacyDirectory;
    const directoryStat = await lstat(directory);
    if (!directoryStat.isDirectory() ||
        (process.getuid && directoryStat.uid !== process.getuid()))
        throw new Error('Invalid video directory');
    const handle = await open(join(directory, file), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const stat = await handle.stat();
        if (!stat.isFile() ||
            (process.getuid && stat.uid !== process.getuid()) ||
            stat.size > VIDEO_MAX_BYTES)
            throw new Error('Invalid video file');
        const head = Buffer.alloc(8);
        const { bytesRead } = await handle.read(head, 0, 8, 0);
        if (bytesRead < 8 || head.toString('ascii', 4, 8) !== 'ftyp')
            throw new Error('Invalid MP4 file');
        return { handle, size: stat.size };
    }
    catch (error) {
        await handle.close();
        throw error;
    }
}
/** Read exactly the admitted size so a concurrently growing file cannot force an unbounded allocation. */
export async function readVideoFile(file, signal) {
    const { handle, size } = await openVideoFile(file);
    try {
        const data = Buffer.alloc(size);
        let offset = 0;
        while (offset < size) {
            signal.throwIfAborted();
            const { bytesRead } = await handle.read(data, offset, size - offset, offset);
            if (!bytesRead)
                throw new Error('Video file changed during read');
            offset += bytesRead;
        }
        signal.throwIfAborted();
        if ((await handle.stat()).size !== size)
            throw new Error('Video file changed during read');
        return data;
    }
    finally {
        await handle.close();
    }
}
/** Stream an opened video (closes the handle when done or cancelled), bounded by the admitted size. */
export function streamVideoFile(handle, size, signal) {
    let offset = 0;
    let closed = false;
    const close = async () => {
        if (closed)
            return;
        closed = true;
        await handle.close();
    };
    const body = new ReadableStream({
        async pull(controller) {
            try {
                signal.throwIfAborted();
                if (offset >= size) {
                    await close();
                    controller.close();
                    return;
                }
                const chunk = Buffer.alloc(Math.min(256 * 1024, size - offset));
                const { bytesRead } = await handle.read(chunk, 0, chunk.length, offset);
                if (!bytesRead)
                    throw new Error('Video file changed during read');
                offset += bytesRead;
                controller.enqueue(chunk.subarray(0, bytesRead));
            }
            catch (error) {
                await close();
                controller.error(error);
            }
        },
        cancel: close,
    });
    return new Response(body, {
        headers: {
            'content-type': 'video/mp4',
            'content-length': String(size),
            'x-content-type-options': 'nosniff',
            'cache-control': 'private, no-store',
        },
    });
}
export { VIDEO_FILE_ROUTE };
