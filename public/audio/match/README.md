# Match audio assets

`ancient-arena-combat-loop.ogg` is the two-minute looping dark-fantasy combat bed used during matchmaking and gameplay. It is an original, fully synthesized asset generated for this project; it contains no third-party samples or recordings.

Run `powershell -ExecutionPolicy Bypass -File scripts/generate-match-audio.ps1` from the frontend root to regenerate it. The source oscillators and modulation periods are phase-aligned to the 120-second duration for a clean loop, while playback fades are handled by `src/composables/useMatchAudio.ts`.

To replace the track, keep the filename or update `COMBAT_MUSIC_URL` in the composable. Replacement music should be a locally hosted, loop-ready OGG file between two and four minutes long with a clear commercial-use license recorded alongside this file.
