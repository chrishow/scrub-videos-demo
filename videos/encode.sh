#!/bin/bash


# Good quality, but 20M
# ffmpeg -i Autograph.mp4   \
#   -vf scale=1920:-1   \
#   -movflags faststart \
#   -vcodec libx264     \
#   -crf 18             \
#   -g 1                \
#   -pix_fmt yuv420p    \
#   -an                 \
#   output.mp4

# Two pass test

BITRATE='7000k'
PRESET='slow'
SCALE='1920:-1'
KEYFRAME_INTERVAL=1

# ffmpeg -i Autograph.mp4   \
#   -vf scale=$SCALE    \
#   -movflags faststart \
#   -vcodec libx264     \
#   -b:v $BITRATE       \
#   -g $KEYFRAME_INTERVAL \
#   -pix_fmt yuv420p    \
#   -an                 \
#   -pass 1             \
#   -preset $PRESET     \
#   -f null /dev/null

# ffmpeg -y -i Autograph.mp4   \
#   -vf scale=$SCALE    \
#   -movflags faststart \
#   -vcodec libx264     \
#   -b:v $BITRATE       \
#   -g $KEYFRAME_INTERVAL \
#   -pix_fmt yuv420p    \
#   -an                 \
#   -pass 2             \
#   -preset $PRESET     \
#   output.mp4

# rm ffmpeg2pass-*


PRESET='slow'
SCALE='1920:-1'
KEYFRAME_INTERVAL=1


# Output file is 16M, more jerky in FF
  ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 20             \
  -g 2                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf20-g2.mp4

  ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 20             \
  -g 5                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf20-g5.mp4

  ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 25             \
  -g 5                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf25-g5.mp4

  ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 30             \
  -g 5                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf30-g5.mp4

  ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 25             \
  -g 1                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf25-g1.mp4

ffmpeg -y -i Autograph.mp4   \
  -vf scale=1920:-1   \
  -movflags faststart \
  -vcodec libx264     \
  -crf 30             \
  -g 5                \
  -pix_fmt yuv420p    \
  -an                 \
  -preset 'slow'      \
  output-crf30-g5.mp4



# Ye olde Crush settings plus -g 1, 19M

# ffmpeg -y -i Autograph.mp4 \
#     -vcodec libx264 \
#     -an \
#     -b:v 1000k \
#     -refs 6 \
#     -coder 1 \
#     -sc_threshold 40 \
#     -flags +loop \
#     -me_range 16 \
#     -subq 7 \
#     -i_qfactor 0.71 \
#     -qcomp 0.6 \
#     -qdiff 4 \
#     -trellis 1 \
#     -b:a 128k \
#     -movflags +faststart \
#     -pix_fmt yuv420p \
#     -vf "scale=1920:-1"  \
#     -crf 18  \
#     -g 1 \
#     output.mp4
