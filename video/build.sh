#!/bin/bash
# Build the GlassBox 1-min demo: say voiceover per frame + ffmpeg assembly.
set -e
cd "$(dirname "$0")"
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-178}"
mkdir -p seg
rm -f seg/*.aiff seg/*.mp4 list.txt

N=$(/tmp/pptenv/bin/python -c "import json;print(len(json.load(open('manifest.json'))))")
echo "segments: $N"

for i in $(seq 0 $((N-1))); do
  IMG=$(/tmp/pptenv/bin/python -c "import json;print(json.load(open('manifest.json'))[$i]['image'])")
  TXT=$(/tmp/pptenv/bin/python -c "import json;print(json.load(open('manifest.json'))[$i]['narration'])")
  AIFF="seg/n$i.aiff"
  say -v "$VOICE" -r "$RATE" -o "$AIFF" "$TXT" 2>/dev/null || say -r "$RATE" -o "$AIFF" "$TXT"
  ADUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AIFF")
  DUR=$(/tmp/pptenv/bin/python -c "print(round($ADUR + 0.85, 2))")
  echo "seg $i: ${ADUR}s audio -> ${DUR}s clip"
  ffmpeg -y -loglevel error -loop 1 -i "$IMG" -i "$AIFF" -t "$DUR" \
    -filter_complex "[0:v]scale=1920:1080,fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=$(/tmp/pptenv/bin/python -c "print(round($DUR-0.4,2))"):d=0.4[v];[1:a]adelay=250|250,apad[a]" \
    -map "[v]" -map "[a]" -t "$DUR" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k "seg/c$i.mp4"
  echo "file 'seg/c$i.mp4'" >> list.txt
done

echo "concatenating…"
ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k GlassBox-demo.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 GlassBox-demo.mp4)
SIZE=$(ls -lh GlassBox-demo.mp4 | awk '{print $5}')
echo "DONE: GlassBox-demo.mp4  (${DUR}s, ${SIZE})"
