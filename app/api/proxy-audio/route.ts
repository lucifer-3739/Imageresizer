import { NextRequest, NextResponse } from 'next/server';
import { Innertube, UniversalCache } from 'youtubei.js';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let ytClientPromise: Promise<Innertube> | null = null;

async function getYtClient(): Promise<Innertube> {
  if (!ytClientPromise) {
    ytClientPromise = Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
  }
  return ytClientPromise;
}

/**
 * Executes local Python yt-dlp extractor & downloader helper
 */
async function runPythonDownloader(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'py_downloader.py');
    execFile('python', [scriptPath, ...args], { maxBuffer: 25 * 1024 * 1024, timeout: 60000 }, (error, stdout) => {
      if (error) return reject(error);
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Extracts YouTube Video ID from any YouTube URL
 */
function extractYouTubeId(url: string): string | null {
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Extracts Google Drive File ID
 */
function extractGoogleDriveFileId(url: string): string | null {
  const fileIdMatch =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);

  return fileIdMatch && fileIdMatch[1] ? fileIdMatch[1] : null;
}

/**
 * Multi-stage Google Drive file downloader
 */
async function resolveGoogleDriveMedia(fileId: string): Promise<{ response: Response; title?: string } | null> {
  const candidates = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://docs.google.com/uc?export=download&id=${fileId}`,
  ];

  for (const candidateUrl of candidates) {
    try {
      const res = await fetch(candidateUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'video/*,audio/*,application/octet-stream,*/*',
        },
        redirect: 'follow',
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const text = await res.text();
          const confirmMatch =
            text.match(/confirm=([0-9A-Za-z_]+)/) ||
            text.match(/name="confirm" value="([^"]+)"/);

          const token = confirmMatch ? confirmMatch[1] : 't';
          const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${token}`;

          const confirmRes = await fetch(confirmUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'video/*,audio/*,application/octet-stream,*/*',
            },
            redirect: 'follow',
          });

          if (confirmRes.ok && !confirmRes.headers.get('content-type')?.includes('text/html')) {
            return { response: confirmRes };
          }
          continue;
        }

        return { response: res };
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

/**
 * Transforms Dropbox links into direct binary download endpoints
 */
function transformDropboxUrl(url: string): string {
  let direct = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  if (direct.includes('?dl=0')) {
    direct = direct.replace('?dl=0', '?dl=1');
  } else if (!direct.includes('?dl=1') && !direct.includes('&dl=1')) {
    direct += (direct.includes('?') ? '&' : '?') + 'dl=1';
  }
  return direct;
}

/**
 * Transforms OneDrive links into direct binary download endpoints
 */
function transformOneDriveUrl(url: string): string {
  let direct = url;
  if (!direct.includes('download=1')) {
    direct += (direct.includes('?') ? '&' : '?') + 'download=1';
  }
  return direct;
}

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '0:00';
  const mins = Math.floor(sec / 60);
  const secs = Math.floor(sec % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const isInfoOnly = searchParams.get('info') === 'true';
  const itagParam = searchParams.get('itag');
  const formatIdParam = searchParams.get('format_id') || itagParam;
  const qualityParam = searchParams.get('quality') || '';
  const mediaType = searchParams.get('type') || 'auto'; // 'video' | 'audio' | 'auto'

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing "url" parameter.' }, { status: 400 });
  }

  const targetUrl = rawUrl.trim();

  // -------------------------------------------------------------
  // PRIMARY ENGINE: PYTHON yt-dlp & FFMPEG UNIVERSAL EXTRACTOR & MERGER
  // -------------------------------------------------------------
  try {
    if (isInfoOnly) {
      const pyInfo = await runPythonDownloader(['info', targetUrl]);
      if (pyInfo && !pyInfo.error && pyInfo.formats && pyInfo.formats.length > 0) {
        return NextResponse.json(pyInfo);
      }
    } else {
      // 1. Primary path: Download and merge Video + Audio with FFmpeg
      const dlRes = await runPythonDownloader([
        'download',
        targetUrl,
        formatIdParam || 'best',
        mediaType,
        qualityParam,
      ]);

      if (dlRes && !dlRes.error && dlRes.filePath && fs.existsSync(dlRes.filePath)) {
        const title = dlRes.title || 'media';
        const cleanTitle = title.replace(/[^\w\d_ -]/g, '_').substring(0, 80);
        const duration = dlRes.duration || 0;
        const ext = dlRes.ext || (mediaType === 'video' ? 'mp4' : 'mp3');
        const mime = dlRes.mime || (mediaType === 'video' ? 'video/mp4' : 'audio/mpeg');
        const stat = fs.statSync(dlRes.filePath);

        const nodeStream = fs.createReadStream(dlRes.filePath);
        nodeStream.on('close', () => {
          try {
            if (fs.existsSync(dlRes.filePath)) {
              fs.unlinkSync(dlRes.filePath);
            }
          } catch {}
        });

        const webStream = Readable.toWeb(nodeStream) as ReadableStream;

        const headers = new Headers();
        headers.set('Content-Type', mime);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set(
          'Access-Control-Expose-Headers',
          'Content-Disposition, X-Media-Title, X-Media-Duration, X-Media-Type, Content-Type, Content-Length'
        );
        headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.${ext}"`);
        headers.set('X-Media-Title', encodeURIComponent(title));
        headers.set('X-Media-Duration', duration.toString());
        headers.set('X-Media-Type', mime.includes('video') ? 'video' : 'audio');
        headers.set('Content-Length', stat.size.toString());
        headers.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(webStream, {
          status: 200,
          headers,
        });
      }

      // 2. Secondary fallback: Stream direct URL if available
      const streamRes = await runPythonDownloader([
        'stream',
        targetUrl,
        formatIdParam || 'best',
        mediaType,
      ]);

      if (streamRes && !streamRes.error && streamRes.streamUrl) {
        const title = streamRes.title || 'media';
        const cleanTitle = title.replace(/[^\w\d_ -]/g, '_').substring(0, 80);
        const duration = streamRes.duration || 0;
        const ext = streamRes.ext || (mediaType === 'video' ? 'mp4' : 'mp3');
        const mime = streamRes.mime || (mediaType === 'video' ? 'video/mp4' : 'audio/mpeg');

        const streamFetch = await fetch(streamRes.streamUrl, {
          headers: {
            'User-Agent':
              streamRes.http_headers?.['User-Agent'] ||
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: '*/*',
            ...(streamRes.http_headers || {}),
          },
        });

        if (streamFetch.ok && streamFetch.body) {
          const headers = new Headers();
          headers.set('Content-Type', mime);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set(
            'Access-Control-Expose-Headers',
            'Content-Disposition, X-Media-Title, X-Media-Duration, X-Media-Type, Content-Type, Content-Length'
          );
          headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.${ext}"`);
          headers.set('X-Media-Title', encodeURIComponent(title));
          headers.set('X-Media-Duration', duration.toString());
          headers.set('X-Media-Type', mime.includes('video') ? 'video' : 'audio');
          headers.set('Cache-Control', 'public, max-age=3600');

          const cl = streamFetch.headers.get('content-length');
          if (cl) headers.set('Content-Length', cl);

          return new NextResponse(streamFetch.body, {
            status: 200,
            headers,
          });
        }
      }
    }
  } catch (pyErr) {
    // Python not available or encountered site-specific restriction, proceed to fallback handlers
  }

  // -------------------------------------------------------------
  // FALLBACK ENGINE 1: YouTube Handler (Innertube)
  // -------------------------------------------------------------
  const ytId = extractYouTubeId(targetUrl);
  if (ytId) {
    try {
      const yt = await getYtClient();

      // IF USER IS REQUESTING VIDEO FORMAT INFO & QUALITY LIST
      if (isInfoOnly) {
        const info = await yt.getBasicInfo(ytId, { client: 'ANDROID' });
        const iosInfo = await yt.getBasicInfo(ytId, { client: 'IOS' });

        const title = info.basic_info.title || 'YouTube Media';
        const author = info.basic_info.author || '';
        const duration = info.basic_info.duration || 0;
        const thumbnail =
          info.basic_info.thumbnail?.[info.basic_info.thumbnail.length - 1]?.url ||
          `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;

        const progressive = info.streaming_data?.formats || [];
        const adaptive = info.streaming_data?.adaptive_formats || [];
        const iosAdaptive = iosInfo.streaming_data?.adaptive_formats || [];

        // Build formats array matching user's visual mockup
        const formatsList: any[] = [];

        // Progressive Video (Video + Audio)
        formatsList.push({
          id: 'mp4-720',
          itag: 22,
          label: 'MP4',
          quality: '720',
          type: 'video',
          hasAudio: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-480',
          itag: 18,
          label: 'MP4',
          quality: '480',
          type: 'video',
          hasAudio: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-360',
          itag: 18,
          label: 'MP4',
          quality: '360',
          type: 'video',
          hasAudio: true,
          mime: 'video/mp4',
        });

        // Audio Formats
        formatsList.push({
          id: 'audio-opus-164',
          itag: 251,
          label: 'Audio OPUS',
          quality: '164',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/webm',
        });
        formatsList.push({
          id: 'audio-opus-82',
          itag: 250,
          label: 'Audio OPUS',
          quality: '82',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/webm',
        });
        formatsList.push({
          id: 'audio-opus-62',
          itag: 249,
          label: 'Audio OPUS',
          quality: '62',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/webm',
        });
        formatsList.push({
          id: 'audio-m4a-131',
          itag: 140,
          label: 'Audio M4A',
          quality: '131',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/mp4',
        });
        formatsList.push({
          id: 'audio-m4a-50',
          itag: 139,
          label: 'Audio M4A',
          quality: '50',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/mp4',
        });
        formatsList.push({
          id: 'audio-mp3',
          itag: 140,
          label: 'Audio MP3',
          quality: '320',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/mpeg',
        });
        formatsList.push({
          id: 'audio-wav',
          itag: 140,
          label: 'Audio WAV',
          quality: 'Lossless',
          type: 'audio',
          hasAudio: true,
          mime: 'audio/wav',
        });

        // High Quality Video Streams
        formatsList.push({
          id: 'mp4-4320',
          itag: 571,
          label: 'MP4',
          quality: '4320',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-2160',
          itag: 313,
          label: 'MP4',
          quality: '2160',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-1440',
          itag: 271,
          label: 'MP4',
          quality: '1440',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-1080',
          itag: 137,
          label: 'MP4',
          quality: '1080',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-720-mute',
          itag: 136,
          label: 'MP4',
          quality: '720',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });
        formatsList.push({
          id: 'mp4-480-mute',
          itag: 135,
          label: 'MP4',
          quality: '480',
          type: 'video',
          hasAudio: false,
          isMuted: true,
          mime: 'video/mp4',
        });

        return NextResponse.json({
          title,
          author,
          duration,
          durationFormatted: formatDuration(duration),
          thumbnail,
          provider: 'youtube',
          formats: formatsList,
        });
      }

      // DOWNLOADING A SELECTED STREAM (BY ITAG, QUALITY, OR TYPE)
      const [androidInfo, iosInfo] = await Promise.all([
        yt.getBasicInfo(ytId, { client: 'ANDROID' }).catch(() => null),
        yt.getBasicInfo(ytId, { client: 'IOS' }).catch(() => null),
      ]);

      const title =
        androidInfo?.basic_info?.title ||
        iosInfo?.basic_info?.title ||
        'YouTube Media';
      const duration =
        androidInfo?.basic_info?.duration ||
        iosInfo?.basic_info?.duration ||
        0;
      const cleanTitle = title.replace(/[^\w\d_ -]/g, '_').substring(0, 80);

      const progressiveFormats = androidInfo?.streaming_data?.formats || [];
      const iosAdaptive = iosInfo?.streaming_data?.adaptive_formats || [];
      const androidAdaptive = androidInfo?.streaming_data?.adaptive_formats || [];
      const allFormats = [...progressiveFormats, ...iosAdaptive, ...androidAdaptive];

      let chosenFormat: any = null;
      let isIOSStream = false;

      if (itagParam) {
        const requestedItag = parseInt(itagParam, 10);
        chosenFormat = allFormats.find((f) => f.itag === requestedItag && f.url);

        // If exact itag not found, match by quality / type
        if (!chosenFormat) {
          if (requestedItag === 22) {
            chosenFormat = progressiveFormats.find((f) => f.quality_label?.includes('720') && f.url) || progressiveFormats[0];
          } else if (requestedItag === 18) {
            chosenFormat = progressiveFormats.find((f) => f.url);
          } else if ([251, 250, 249, 140, 139].includes(requestedItag)) {
            chosenFormat = iosAdaptive.find((f) => f.mime_type?.includes('audio') && f.url);
          } else {
            // video quality matching
            const qualityParam = searchParams.get('quality');
            if (qualityParam) {
              chosenFormat = allFormats.find((f) => f.quality_label?.includes(qualityParam) && f.url);
            }
          }
        }
      }

      if (chosenFormat && chosenFormat.url) {
        isIOSStream = iosAdaptive.some((f) => f.itag === chosenFormat.itag);
        const userAgent = isIOSStream
          ? 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
          : 'com.google.android.youtube/19.29.37';

        const streamResponse = await fetch(chosenFormat.url, {
          headers: {
            'User-Agent': userAgent,
            Accept: '*/*',
          },
        });

        if (streamResponse.ok && streamResponse.body) {
          const mime = (chosenFormat.mime_type || '').split(';')[0];
          let fileExt = 'mp4';
          if (mime.includes('audio')) {
            fileExt = mime.includes('webm') || mime.includes('opus') ? 'opus' : 'm4a';
          } else if (mime.includes('webm')) {
            fileExt = 'webm';
          }

          const qualitySuffix = chosenFormat.quality_label ? `_${chosenFormat.quality_label}` : '';
          const finalFilename = `${encodeURIComponent(cleanTitle)}${qualitySuffix}.${fileExt}`;

          const headers = new Headers();
          headers.set('Content-Type', mime || 'application/octet-stream');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set(
            'Access-Control-Expose-Headers',
            'Content-Disposition, X-Media-Title, X-Media-Duration, X-Media-Type, Content-Type, Content-Length'
          );
          headers.set('Content-Disposition', `attachment; filename="${finalFilename}"`);
          headers.set('X-Media-Title', encodeURIComponent(title));
          headers.set('X-Media-Duration', duration.toString());
          headers.set('X-Media-Type', mime.includes('video') ? 'video' : 'audio');
          headers.set('Cache-Control', 'public, max-age=3600');

          const cl = streamResponse.headers.get('content-length');
          if (cl) headers.set('Content-Length', cl);

          return new NextResponse(streamResponse.body, {
            status: 200,
            headers,
          });
        }
      }

      // Fallback 1: If video mode or general video fallback
      if (mediaType === 'video') {
        let progFormat = progressiveFormats.find((f) => f.url) || iosAdaptive.find((f) => f.mime_type?.includes('video') && f.url);
        if (progFormat && progFormat.url) {
          const isIOS = iosAdaptive.some((f) => f.itag === progFormat.itag);
          const userAgent = isIOS
            ? 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
            : 'com.google.android.youtube/19.29.37';

          const videoResponse = await fetch(progFormat.url, {
            headers: {
              'User-Agent': userAgent,
              Accept: '*/*',
            },
          });

          if (videoResponse.ok && videoResponse.body) {
            const mime = (progFormat.mime_type || '').split(';')[0] || 'video/mp4';
            const fileExt = mime.includes('webm') ? 'webm' : 'mp4';
            const headers = new Headers();
            headers.set('Content-Type', mime);
            headers.set('Access-Control-Allow-Origin', '*');
            headers.set(
              'Access-Control-Expose-Headers',
              'Content-Disposition, X-Media-Title, X-Media-Duration, X-Media-Type, Content-Type, Content-Length'
            );
            headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.${fileExt}"`);
            headers.set('X-Media-Title', encodeURIComponent(title));
            headers.set('X-Media-Duration', duration.toString());
            headers.set('X-Media-Type', 'video');
            headers.set('Cache-Control', 'public, max-age=3600');

            const cl = videoResponse.headers.get('content-length');
            if (cl) headers.set('Content-Length', cl);

            return new NextResponse(videoResponse.body, {
              status: 200,
              headers,
            });
          }
        }
      }

      // Fallback 2: Audio stream directly from iOS adaptive formats or iOS download
      const audioFormat = iosAdaptive.find((f) => f.mime_type?.includes('audio') && f.url);
      if (audioFormat && audioFormat.url) {
        const audioResponse = await fetch(audioFormat.url, {
          headers: {
            'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)',
            Accept: '*/*',
          },
        });

        if (audioResponse.ok && audioResponse.body) {
          const mime = (audioFormat.mime_type || '').split(';')[0] || 'audio/mp4';
          const fileExt = mime.includes('webm') ? 'opus' : 'm4a';
          const headers = new Headers();
          headers.set('Content-Type', mime);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set(
            'Access-Control-Expose-Headers',
            'Content-Disposition, X-Audio-Title, X-Audio-Duration, X-Media-Title, X-Media-Duration, X-Media-Type'
          );
          headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.${fileExt}"`);
          headers.set('X-Audio-Title', encodeURIComponent(title));
          headers.set('X-Audio-Duration', duration.toString());
          headers.set('X-Media-Title', encodeURIComponent(title));
          headers.set('X-Media-Duration', duration.toString());
          headers.set('X-Media-Type', 'audio');
          headers.set('Cache-Control', 'public, max-age=3600');

          const cl = audioResponse.headers.get('content-length');
          if (cl) headers.set('Content-Length', cl);

          return new NextResponse(audioResponse.body, {
            status: 200,
            headers,
          });
        }
      }

      // Fallback 3: Innertube iOS download stream
      const audioStream = await yt.download(ytId, {
        type: 'audio',
        quality: 'best',
        client: 'IOS',
      });

      const headers = new Headers();
      headers.set('Content-Type', 'audio/mp4');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set(
        'Access-Control-Expose-Headers',
        'Content-Disposition, X-Audio-Title, X-Audio-Duration, X-Media-Title, X-Media-Duration, X-Media-Type'
      );
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanTitle)}.m4a"`);
      headers.set('X-Audio-Title', encodeURIComponent(title));
      headers.set('X-Audio-Duration', duration.toString());
      headers.set('X-Media-Title', encodeURIComponent(title));
      headers.set('X-Media-Duration', duration.toString());
      headers.set('X-Media-Type', 'audio');
      headers.set('Cache-Control', 'public, max-age=3600');

      return new NextResponse(audioStream as any, {
        status: 200,
        headers,
      });
    } catch (ytError: any) {
      console.error('YouTube extraction error:', ytError);
      return NextResponse.json(
        { error: `YouTube extraction failed: ${ytError.message || 'Stream could not be loaded.'}` },
        { status: 422 }
      );
    }
  }

  // 2. Google Drive Links
  const gDriveId = extractGoogleDriveFileId(targetUrl);
  if (gDriveId) {
    if (isInfoOnly) {
      return NextResponse.json({
        title: 'Google Drive Media File',
        author: 'Google Drive',
        duration: 0,
        durationFormatted: 'Drive File',
        thumbnail: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png',
        provider: 'googledrive',
        formats: [
          { id: 'drive-direct', itag: 1, label: 'MP4 / Original', quality: 'Original', type: 'video', hasAudio: true },
          { id: 'drive-audio', itag: 2, label: 'Audio WAV', quality: 'WAV', type: 'audio', hasAudio: true },
        ],
      });
    }

    const driveResult = await resolveGoogleDriveMedia(gDriveId);
    if (driveResult && driveResult.response.body) {
      const resp = driveResult.response;
      const ct = resp.headers.get('content-type') || 'application/octet-stream';
      const headers = new Headers();
      headers.set('Content-Type', ct);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set(
        'Access-Control-Expose-Headers',
        'Content-Disposition, Content-Type, Content-Length, X-Media-Type'
      );
      headers.set('X-Media-Type', ct.includes('video') ? 'video' : 'audio');
      headers.set('Cache-Control', 'public, max-age=3600');

      const cl = resp.headers.get('content-length');
      if (cl) headers.set('Content-Length', cl);
      const cd = resp.headers.get('content-disposition');
      if (cd) headers.set('Content-Disposition', cd);

      return new NextResponse(resp.body, { status: 200, headers });
    } else {
      return NextResponse.json(
        {
          error:
            "This Google Drive file is private or requires authentication. Please set the file's share permissions in Google Drive to 'Anyone with the link can view' or upload the file directly.",
        },
        { status: 403 }
      );
    }
  }

  // 3. Cloud Storage (Dropbox, OneDrive)
  let resolvedUrl = targetUrl;
  if (targetUrl.includes('dropbox.com')) {
    resolvedUrl = transformDropboxUrl(targetUrl);
  } else if (targetUrl.includes('1drv.ms') || targetUrl.includes('onedrive.live.com')) {
    resolvedUrl = transformOneDriveUrl(targetUrl);
  }

  if (isInfoOnly) {
    const dotIdx = targetUrl.lastIndexOf('.');
    const cleanExt = dotIdx !== -1 ? targetUrl.substring(dotIdx + 1).split('?')[0].toUpperCase() : 'MP4';
    return NextResponse.json({
      title: 'Media Stream',
      author: 'Web Media',
      duration: 0,
      durationFormatted: 'Direct Stream',
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&auto=format&fit=crop&q=80',
      provider: 'direct',
      formats: [
        { id: 'direct-video', itag: 1, label: cleanExt, quality: 'Direct', type: 'video', hasAudio: true },
        { id: 'direct-audio', itag: 2, label: 'Audio Track', quality: 'WAV/MP3', type: 'audio', hasAudio: true },
      ],
    });
  }

  // 4. General Universal Stream Proxy
  try {
    const parsed = new URL(resolvedUrl);
    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'video/*,audio/*,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: parsed.origin,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote host returned HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const contentDisposition = response.headers.get('content-disposition');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set(
      'Access-Control-Expose-Headers',
      'Content-Disposition, Content-Type, Content-Length, X-Media-Type'
    );
    headers.set('X-Media-Type', contentType.includes('video') ? 'video' : 'audio');
    headers.set('Cache-Control', 'public, max-age=3600');

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('API proxy-audio error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download stream from this provider.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
