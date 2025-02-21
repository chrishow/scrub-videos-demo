#!/bin/bash

# Output 27M 
ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libvpx-vp9  \
  -crf 30             \
  -g 1                \
  -b:v 0              \
  -an                 \
  output.webm          

  # ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 output.webm
