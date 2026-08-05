param(
  [string]$OutputPath = "public/audio/match/ancient-arena-combat-loop.ogg"
)

$ErrorActionPreference = "Stop"
$outputDirectory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

# A two-minute, phase-aligned D-minor combat bed built entirely from synthesized
# source tones. Every modulation period divides evenly into 120 seconds so the
# decoded loop returns to the same musical phase at its boundary.
ffmpeg -hide_banner -loglevel warning -y `
  -f lavfi -i "sine=frequency=36.7081:sample_rate=44100:duration=120" `
  -f lavfi -i "sine=frequency=73.4162:sample_rate=44100:duration=120" `
  -f lavfi -i "sine=frequency=110:sample_rate=44100:duration=120" `
  -f lavfi -i "sine=frequency=146.8324:sample_rate=44100:duration=120" `
  -f lavfi -i "sine=frequency=174.6141:sample_rate=44100:duration=120" `
  -f lavfi -i "sine=frequency=220:sample_rate=44100:duration=120" `
  -filter_complex "[0:a]volume=0.085,tremolo=f=0.25:d=0.82,lowpass=f=95[a0];[1:a]volume=0.075,tremolo=f=0.1:d=0.32[a1];[2:a]volume=0.038,tremolo=f=0.125:d=0.44[a2];[3:a]volume=0.028,tremolo=f=0.2:d=0.5[a3];[4:a]volume=0.022,tremolo=f=0.4:d=0.4[a4];[5:a]volume=0.012,tremolo=f=0.5:d=0.58[a5];[a0][a1][a2][a3][a4][a5]amix=inputs=6:normalize=0,highpass=f=30,lowpass=f=1600,alimiter=limit=0.55,pan=stereo|c0=c0|c1=c0[out]" `
  -map "[out]" -c:a libvorbis -q:a 5 $OutputPath

if ($LASTEXITCODE -ne 0) {
  throw "FFmpeg failed with exit code $LASTEXITCODE."
}

Write-Host "Generated $OutputPath"
