# Independent showroom review

Verdict: BUILT AND VERIFIED as a local prototype. Ready for Claude and Alvin to review. This is not deployment approval.

Reviewed frozen HTML, CSS, native JavaScript, WebP assets and sanitized video in `C:/Users/elite/edf-website-showroom`, branch `feat/showroom`. SHA256 values for the four primary deliverables are recorded in `verification.json`.

## Changes reviewed

- `pages/showroom.html`: seven rooms, semantic headings, numbered anchor rail, direct booking links, native video dialog, canonical and social metadata.
- `css/showroom.css`: the existing navy, desktop perspective and pinned rooms, stacked phone layout and static fallbacks.
- `js/showroom.js`: scroll progress, illustrative verification sequence, rail keyboard controls and lazy dialog video.
- `images/showroom/` and `media/showroom/`: resized Craft media, prohibited text removed, 1200 by 630 OG image and compressed video.
- `index.html` and `pages/platform.html`: exactly one added line each, containing the tour link. `sitemap.xml`: showroom entry.

The group stop is explicitly a concept diagram, not a fabricated product interface (`pages/showroom.html:110`). Product source letters describe provenance, including an existing Phone call source; they do not claim an automated caller (`pages/showroom.html:89`). The new page makes no pricing, customer result or new numeric performance claims.

## Executed checks

Directory for all commands: `C:/Users/elite/edf-website-showroom`.

`node design/showroom/verify.mjs` exited 0 on the frozen deliverables. The harness binds an ephemeral static server to 127.0.0.1 only, launches Playwright Chromium headless with a fresh temporary user data directory, and records resource, layout, interaction and rendering evidence. No booking or other external action was triggered.

`node --check js/showroom.js`, `node --check design/showroom/verify.mjs` and `git diff --check` exited 0.

| Check | Result |
| --- | --- |
| Viewports | 1440 by 900, 390 by 844, 1440 by 650 |
| Static fallbacks | JavaScript disabled and reduced motion at desktop and phone widths |
| Room screenshots | Seven mid room images at each normal width, plus seven short desktop images |
| Console and runtime errors | 0 in all seven scenarios |
| HTTP errors and failed requests | 0 in all seven scenarios |
| Horizontal overflow and hidden room copy | 0 in all seven scenarios |
| Desktop CLS, 900 high | 0.000499257 |
| Phone CLS | 0.000020988 |
| Short desktop CLS | 0.000691024 |
| Reduced motion CLS | 0 at both widths |
| Initial or scroll triggered video requests | 0 before opening |
| Desktop transferred bytes excluding video | 474,696 |
| Phone transferred bytes excluding video | 345,646 |
| Conservative page weight | 649,276 bytes, including all 34 new WebP variants, unused variants, OG and shared resources |
| New image assets | 476,966 bytes total; all WebP; selected image dimensions at most twice the rendered boxes |
| Compressed video | 2,701,237 bytes, H.264 and AAC, 1280 by 720, 88.966667 seconds |
| Video playback | Actual playback and metadata passed on both desktop heights |
| Keyboard rail | Enter, arrow movement, Home and End passed |
| Video dialog | Focus entered dialog; background focus blocked; Tab stayed inside controls; Escape closed and restored opener focus |
| Original page entry links | One visible link each at 1440 and 390, no clipping or horizontal overflow |
| DOM copy scan | No prohibited dashes, currency pricing or excluded feature phrases |

CLS is a conservative sum of observed layout shifts without recent input across loading and the scripted scroll. The standard session window maximum cannot exceed this sum. JavaScript disabled scenarios do not run the PerformanceObserver, so no CLS number is claimed for them.

Local scroll sampling used 180 animation frames across the full page. The largest measured frame gap was 16.8 ms, with zero gaps over 50 ms. Observed long tasks were initial page work of 66 to 83 ms, not scroll tasks. These are local Chromium lab measurements, not field performance or a promise for every device. Lighthouse was not installed in the available project or global command environment; it was not installed for this task.

## Visual and claims review

Viewed the desktop and phone room contact sheets and full size patient, week, morning and short desktop team screenshots. The page keeps one navy background. Light regions are product screenshots. Mobile rooms remain stacked, and the long week room continues below its mid room screenshot. All content remains in the document when JavaScript is disabled or reduced motion is enabled (`css/showroom.css:112`, `css/showroom.css:207`).

Early review caught a missing favicon, distorted patient images, an enlarged status widget used as the hero, excessive image dimensions and incomplete week side panels. The builder corrected these before the frozen passing run.

Found prior record: the supplied draft `storyboard.md` contains a write back scene. The current 2026-10-11 brief forbids it. Also found the revised `vo7/script.json` phone acquisition sentence, which implied a caller capability. The asset builder removed the entire relevant audio and video interval and replaced unsafe UI scenes with vetted Craft crops. `video-manifest.json` records exact intervals, provenance and codec evidence. Reviewed the source narration and caption text, safe asset contact sheet and final video contact sheet. Asset builder separately checked scene boundaries and decoded the complete video with ffmpeg successfully. Browser verification confirms the final encoded file plays. This review does not claim a complete human audio audition.

The storyboard and film supply the schedule, patient, source and week claims. The brief explicitly authorizes the team close and the concept diagram when a real multi location capture is absent. No new API, runtime dependency or live product screen was introduced.

## Limits and next action

Local Chromium evidence does not cover Safari, real phone hardware or field network conditions. A minor decorative caption beneath the first product plane can overlap its floating label at desktop size; the main copy and action remain readable. The visual gate can decide whether that warrants a later polish pass.

Next action: Claude and Alvin inspect the local walkthrough and review evidence, then decide whether to accept the merge candidate. Do not push or deploy from this session.
