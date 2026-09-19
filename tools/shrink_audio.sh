#!/bin/sh
# Adventurer: Expeditions — re-encode synced audio for the 20 MB web build
# (GDD v0.8 §12a): music 112 kbps stereo → 48 kbps mono, voice 128 kbps → 64 kbps
# mono. Run from the folder root after tools/sync_shared.js. Idempotent: files
# already at or under the target are left alone. Needs ffmpeg + ffprobe.
cd "$(dirname "$0")/.." || exit 1
shrink() { # file target_kbps
  kbps=$(ffprobe -v error -show_entries stream=bit_rate -of csv=p=0 "$1" | head -1)
  ch=$(ffprobe -v error -show_entries stream=channels -of csv=p=0 "$1" | head -1)
  [ -n "$kbps" ] && [ "$kbps" -le $(( $2 * 1000 + 8000 )) ] && [ "$ch" = 1 ] && { echo "keep   $1"; return; }
  ffmpeg -v error -y -i "$1" -codec:a libmp3lame -ac 1 -ar 44100 -b:a "$2k" -map_metadata -1 "$1.tmp.mp3" && mv -f "$1.tmp.mp3" "$1" && echo "shrunk $1"
}
for f in audio/music/*.mp3; do [ -f "$f" ] && shrink "$f" 48; done
for f in audio/vo/*/*.mp3; do [ -f "$f" ] && shrink "$f" 64; done
du -sh audio/music audio/vo
