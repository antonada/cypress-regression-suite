#!/usr/bin/env bash
# Joins the spec videos from a demo run into docs/media/demo.mp4 and a lighter demo.gif for the README.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT_DIR=docs/media
mkdir -p "$OUT_DIR"

SPECS=(workflows empty-states api-errors)

inputs=()
filter=""
for i in "${!SPECS[@]}"; do
  file="cypress/videos/${SPECS[$i]}.cy.ts.mp4"
  if [[ ! -f "$file" ]]; then
    echo "Missing $file. Run the demo config first." >&2
    exit 1
  fi
  inputs+=(-i "$file")
  # Cypress runs faster than anyone can read, so each clip is slowed down a bit
  filter+="[${i}:v]setpts=1.6*PTS,scale=1600:-2,fps=25[c${i}];"
done
for i in "${!SPECS[@]}"; do filter+="[c${i}]"; done
filter+="concat=n=${#SPECS[@]}:v=1:a=0[v]"

ffmpeg -y -loglevel error "${inputs[@]}" -filter_complex "$filter" -map "[v]" \
  -c:v libx264 -preset veryfast -crf 24 -pix_fmt yuv420p -movflags +faststart "$OUT_DIR/demo.mp4"

ffmpeg -y -loglevel error -i "$OUT_DIR/demo.mp4" \
  -vf "fps=8,scale=1000:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" \
  -loop 0 "$OUT_DIR/demo.gif"

echo "Saved $OUT_DIR/demo.mp4 and $OUT_DIR/demo.gif"
