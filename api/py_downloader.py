#!/usr/bin/env python3
"""
Universal Python Media Downloader & Metadata Extractor using yt-dlp & FFmpeg
Supports 1,800+ platforms including YouTube, Instagram, TikTok, Facebook, Reddit, Vimeo, Google Drive, SoundCloud, and direct streams.
Downloads and merges Video + Audio at full resolution (4K, 1080p, 720p, 480p, 360p) with FFmpeg.
"""

import sys
import os
import json
import uuid
import time
import tempfile
import urllib.parse

try:
    import imageio_ffmpeg
    FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_PATH = "ffmpeg"

try:
    import yt_dlp
except ImportError:
    yt_dlp = None


def format_duration(seconds):
    if not seconds or seconds < 0:
        return "0:00"
    sec = int(seconds)
    mins = sec // 60
    rem_secs = sec % 60
    hours = mins // 60
    if hours > 0:
        rem_mins = mins % 60
        return f"{hours}:{rem_mins:02d}:{rem_secs:02d}"
    return f"{mins}:{rem_secs:02d}"


def get_ydl_opts(custom_opts=None):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "ffmpeg_location": FFMPEG_PATH,
        "nocheckcertificate": True,
        "ignoreerrors": False,
        "no_color": True,
    }
    if custom_opts:
        opts.update(custom_opts)
    return opts


def is_direct_stream(f):
    url = f.get("url") or ""
    protocol = f.get("protocol") or ""
    if not url:
        return False
    if ".m3u8" in url or "m3u8" in protocol or "mhtml" in protocol or "dash" in protocol:
        return False
    return protocol in ("https", "http") or url.startswith("http")


def cleanup_temp_dir(temp_dir, max_age_seconds=3600):
    """Removes temporary files older than max_age_seconds to prevent disk bloat."""
    try:
        now = time.time()
        for f in os.listdir(temp_dir):
            fp = os.path.join(temp_dir, f)
            if os.path.isfile(fp) and (now - os.path.getmtime(fp) > max_age_seconds):
                try:
                    os.remove(fp)
                except Exception:
                    pass
    except Exception:
        pass


def extract_media_info(url):
    if not yt_dlp:
        return {"error": "yt-dlp is not installed in the Python environment."}

    opts = get_ydl_opts()
    with yt_dlp.YoutubeDL(opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as e:
            return {"error": str(e)}

    if not info:
        return {"error": "No media metadata could be retrieved for this URL."}

    title = info.get("title") or "Media Stream"
    author = info.get("uploader") or info.get("channel") or info.get("extractor_key") or "Web Media"
    duration = info.get("duration") or 0
    thumbnail = info.get("thumbnail") or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&auto=format&fit=crop&q=80"
    extractor = info.get("extractor_key") or info.get("extractor") or "universal"

    raw_formats = info.get("formats", [])
    formats_list = []

    itag_map = {
        2160: 313,
        1440: 271,
        1080: 137,
        720: 22,
        480: 135,
        360: 18,
        240: 133,
        144: 160
    }

    # 1. Collect all available video heights (both progressive & adaptive)
    video_heights = set()
    for f in raw_formats:
        h = f.get("height")
        vcodec = f.get("vcodec", "none")
        if vcodec != "none" and h and isinstance(h, int) and h >= 144:
            video_heights.add(h)

    available_sorted_heights = sorted(list(video_heights), reverse=True)
    target_heights = available_sorted_heights if available_sorted_heights else [1080, 720, 480, 360]

    for h in target_heights:
        if h < 240:
            continue
        formats_list.append({
            "id": f"video-{h}",
            "format_id": f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best",
            "itag": itag_map.get(h, 22),
            "label": "MP4",
            "quality": str(h),
            "type": "video",
            "hasAudio": True,
            "isMuted": False,
            "mime": "video/mp4",
            "height": h
        })

    # 2. Audio Formats
    formats_list.append({
        "id": "audio-mp3",
        "format_id": "bestaudio/best",
        "itag": 140,
        "label": "Audio MP3",
        "quality": "320",
        "type": "audio",
        "hasAudio": True,
        "isMuted": False,
        "mime": "audio/mpeg"
    })
    formats_list.append({
        "id": "audio-wav",
        "format_id": "bestaudio/best",
        "itag": 140,
        "label": "Audio WAV",
        "quality": "Lossless",
        "type": "audio",
        "hasAudio": True,
        "isMuted": False,
        "mime": "audio/wav"
    })
    formats_list.append({
        "id": "audio-m4a",
        "format_id": "bestaudio[ext=m4a]/bestaudio/best",
        "itag": 140,
        "label": "Audio M4A",
        "quality": "131",
        "type": "audio",
        "hasAudio": True,
        "isMuted": False,
        "mime": "audio/mp4"
    })
    formats_list.append({
        "id": "audio-opus",
        "format_id": "bestaudio[ext=webm]/bestaudio/best",
        "itag": 251,
        "label": "Audio OPUS",
        "quality": "164",
        "type": "audio",
        "hasAudio": True,
        "isMuted": False,
        "mime": "audio/webm"
    })

    if not formats_list:
        formats_list.append({
            "id": "default-best",
            "format_id": "bestvideo+bestaudio/best",
            "itag": 22,
            "label": "MP4 Video",
            "quality": "Best Quality",
            "type": "video",
            "hasAudio": True,
            "isMuted": False,
            "mime": "video/mp4"
        })

    return {
        "title": title,
        "author": author,
        "duration": duration,
        "durationFormatted": format_duration(duration),
        "thumbnail": thumbnail,
        "provider": extractor.lower(),
        "formats": formats_list,
    }


def download_media(url, format_id=None, media_type="video", quality=None):
    """
    Downloads and merges Video + Audio using yt-dlp & FFmpeg.
    Returns path to the merged file on local disk ready for streaming.
    """
    if not yt_dlp:
        return {"error": "yt-dlp is not installed in the Python environment."}

    temp_dir = os.path.join(tempfile.gettempdir(), "pixelshrink_downloads")
    os.makedirs(temp_dir, exist_ok=True)
    cleanup_temp_dir(temp_dir)

    rand_id = uuid.uuid4().hex[:8]
    out_tmpl = os.path.join(temp_dir, f"{rand_id}_%(title).50s.%(ext)s")

    ydl_opts = get_ydl_opts({
        "outtmpl": out_tmpl,
        "ffmpeg_location": FFMPEG_PATH,
    })

    if media_type == "audio" or str(format_id).startswith("audio-"):
        if format_id == "audio-wav" or "wav" in str(format_id).lower():
            ydl_opts.update({
                "format": "bestaudio/best",
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                }],
            })
        else:
            ydl_opts.update({
                "format": "bestaudio/best",
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "320",
                }],
            })
    else:
        ydl_opts["merge_output_format"] = "mp4"

        height_val = None
        if quality and str(quality).replace("p", "").isdigit():
            height_val = int(str(quality).replace("p", ""))
        elif format_id and str(format_id).startswith("video-"):
            try:
                height_val = int(str(format_id).replace("video-", ""))
            except ValueError:
                pass
        elif format_id and str(format_id).isdigit() and int(format_id) > 1000:
            height_val = None

        if height_val:
            ydl_opts["format"] = f"bestvideo[height<={height_val}]+bestaudio/best[height<={height_val}]/best"
        elif format_id and "+" in str(format_id):
            ydl_opts["format"] = format_id
        elif format_id and format_id not in ("best", "auto", "default-best"):
            ydl_opts["format"] = f"{format_id}+bestaudio/best/{format_id}/best"
        else:
            ydl_opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            if not info:
                return {"error": "Could not download media from the provided URL."}

            title = info.get("title") or "media"
            duration = info.get("duration") or 0

            matches = [
                os.path.join(temp_dir, f)
                for f in os.listdir(temp_dir)
                if f.startswith(rand_id) and not f.endswith(".part") and not f.endswith(".ytdl")
            ]

            if not matches:
                return {"error": "Downloaded media file could not be located."}

            final_path = matches[0]
            ext = final_path.split(".")[-1].lower()
            file_size = os.path.getsize(final_path)

            mime = f"video/{ext}" if media_type == "video" else f"audio/{ext}"
            if ext == "mp4":
                mime = "video/mp4"
            elif ext == "mp3":
                mime = "audio/mpeg"
            elif ext == "wav":
                mime = "audio/wav"
            elif ext == "webm":
                mime = "video/webm"

            return {
                "status": "ready",
                "title": title,
                "duration": duration,
                "filePath": final_path,
                "fileSize": file_size,
                "ext": ext,
                "mime": mime,
            }
        except Exception as e:
            return {"error": str(e)}


def get_stream_url(url, format_id=None, media_type="video"):
    if not yt_dlp:
        return {"error": "yt-dlp is not installed."}

    opts = get_ydl_opts()
    with yt_dlp.YoutubeDL(opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            if not info:
                return {"error": "Could not extract media info."}

            title = info.get("title") or "media"
            duration = info.get("duration") or 0
            raw_formats = info.get("formats", [])
            direct_formats = [f for f in raw_formats if is_direct_stream(f)]
            if not direct_formats:
                direct_formats = raw_formats

            chosen_format = None
            if format_id and format_id not in ("best", "bestaudio/best", "bestaudio"):
                for f in direct_formats:
                    if str(f.get("format_id")) == str(format_id):
                        chosen_format = f
                        break

            if not chosen_format:
                if media_type == "audio":
                    audios = [f for f in direct_formats if f.get("vcodec") == "none" and f.get("acodec") != "none" and f.get("url")]
                    if audios:
                        audios.sort(key=lambda x: x.get("abr") or x.get("tbr") or 0, reverse=True)
                        chosen_format = audios[0]
                else:
                    progs = [f for f in direct_formats if f.get("vcodec") != "none" and f.get("acodec") != "none" and f.get("url")]
                    if progs:
                        progs.sort(key=lambda x: x.get("height") or 0, reverse=True)
                        chosen_format = progs[0]
                    else:
                        vids = [f for f in direct_formats if f.get("vcodec") != "none" and f.get("url")]
                        if vids:
                            vids.sort(key=lambda x: x.get("height") or 0, reverse=True)
                            chosen_format = vids[0]

            stream_url = chosen_format.get("url") if chosen_format else info.get("url")
            ext = chosen_format.get("ext") if chosen_format else info.get("ext") or ("mp4" if media_type == "video" else "mp3")
            mime = f"{'video' if media_type == 'video' else 'audio'}/{ext}"

            if not stream_url and direct_formats:
                stream_url = direct_formats[-1].get("url")

            return {
                "title": title,
                "duration": duration,
                "streamUrl": stream_url,
                "ext": ext,
                "mime": mime,
                "http_headers": info.get("http_headers") or (chosen_format.get("http_headers") if chosen_format else {}) or {}
            }
        except Exception as e:
            return {"error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: py_downloader.py <info|download|stream> <url> [format_id] [type] [quality]"}))
        sys.exit(1)

    command = sys.argv[1]
    target_url = sys.argv[2]
    fid = sys.argv[3] if len(sys.argv) > 3 else None
    mtype = sys.argv[4] if len(sys.argv) > 4 else "video"
    qual = sys.argv[5] if len(sys.argv) > 5 else None

    if command == "info":
        res = extract_media_info(target_url)
        print(json.dumps(res))
    elif command == "download":
        res = download_media(target_url, fid, mtype, qual)
        print(json.dumps(res))
    elif command == "stream":
        res = get_stream_url(target_url, fid, mtype)
        print(json.dumps(res))
    else:
        print(json.dumps({"error": f"Unknown command {command}"}))
