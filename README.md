# DreamScapes
Just relax.

Live 3D nature wallpapers that run in the browser (Three.js). Every grass blade is a curved spline with its own
spring physics, grown in tufts of different species; gusts roll across the field, and the light follows the time of day.

| Page | Scene |
|---|---|
| `grass3d.html` | Close-up meadow grass in golden light |
| `meadow.html` | Rolling hills with wildflower drifts (pink globes, violet spikes, white dots) |
| `hills-photo.html` | The real wildflower-hills photo animated with a Depth Anything V2 depth map (`photo/hills_depth.png`: 16-bit disparity in R = high byte, G = low byte) |
| `prairie.html` | Tall wind-combed prairie grass to the horizon under a shader-drawn sky with cumulus towers |

## Run
Serve this folder (the sound files load from `audio/`), then open a page:

```sh
npx serve .        # or: python3 -m http.server
```

Opening the HTML straight from disk shows the scene but stays silent: browsers block `file://` pages from loading the audio.

## Controls (bottom panel)
- **Time of day** slider, or **Live** to follow the device clock (dawn → night lighting, dew, moonlight).
- **Wind**: Calm / Breeze / Gusty / Storm, a direction dial, and fine-tune sliders for strength, gusts and turbulence.
- **Sound**: field recordings of grass, birds and insects, mixed live by how fast the nearby blades are moving.
- **Export loop**: a seamless 6 s or 10 s MP4 (with sound) or GIF, rendered on the device.

URL options: `?ui=0` hides the panel, `?time=18.5`, `?wind=gusty`, `?blades=50000` (performance budget).

`capture.mjs` renders a loop headlessly with Playwright + ffmpeg: `node capture.mjs --page meadow.html --seconds 10`.

## Credits
Sounds are field recordings from radio aporee ::: maps (Internet Archive) — see `audio/CREDITS.md`.
Two of them are CC BY-SA 3.0; files derived from them are shared under the same licence.
