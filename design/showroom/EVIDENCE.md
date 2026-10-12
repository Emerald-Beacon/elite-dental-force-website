# Showroom prototype evidence, Round 2

Verdict: BUILT AND VERIFIED locally. Ready for Claude gate and Alvin review. No push, merge or deployment.

## Changed files

- pages/showroom.html: distinct opening scene, real source crops and verified card states, standard platform header navigation and footer.
- css/showroom.css: larger desktop product stage, readable focal details, room for detached panels beside the schedule, separate morning caption, phone anchor clearance and static fallbacks.
- js/showroom.js: camera push ins, staggered source aligned panel lifts with depth shadows and labels, reversible scroll progress, verified card transitions, accessible standard navigation and lazy video.
- images/showroom/: 47 additional optimized WebP files from supplied synthetic captures. The original 34 files, poster and 1200x630 OG remain available.
- design/showroom/: Round 2 reproducible asset script and crop manifest, expanded motion and mobile anchor checks, regenerated screenshots and independent review.

The Round 1 entry links in index.html and pages/platform.html, sitemap URL and sanitized video are unchanged in Round 2.

## Rooms

1. Morning: five crowded pills recede from a dim EDiFi gateway as the screen brightens. The schedule is reserved for room 2. The closing caption sits separately below the first patient card.
2. Schedule: the large tilted 3 Day capture pushes into one day. Real appointment fragments detach beside it, then transition into matching verified captures for Avery Thompson, Olivia Martinez and Liam O'Connor. Scroll controls the count and reverses the sequence.
3. Patient: camera moves toward real frequency rules. The actual benefit panel and frequency rule detach, with a clearly separate Bitewings review annotation. Currency values are omitted.
4. Sources: real Craft P, O, C and S source tiles lift from their source positions around confirmed facts and Not set.
5. Week: actual Week and 3 Day captures move into readable day detail. Production, confirmation and alert panels rise from matching source panels; originals fade as detached copies separate.
6. Groups: an explicitly labeled concept diagram of three offices feeding one EDiFi view. Office tiles separate with scroll and connectors appear. No fabricated product dashboard.
7. People: approved Matalena, Richard and Siona portraits separate from their source stack, followed by Book a demo and video close.

## Craft provenance and intentional substitutions

Product captures from original 3840x2400 f4 sources, frequency and source tiles from f3, benefit and coverage panels from f2 as used in film3.jsx, and approved people portraits. Full crop, mask, size and source details are recorded in asset-manifest.json and round2-asset-manifest.json. The latter records original pixel crop coordinates and normalized positions for docking the lifted pieces.

Matching green verification cards come from approved ui/02-board captures of the same synthetic appointments. The transition is labeled illustrative; it does not connect to a live verification service. The frequency review label is an editorial annotation, not altered product pixels. The opening gateway and group diagram are intentionally composed scenes.

The lower resolution sw contact captures were replaced by higher resolution f2 source panels already used in film3.jsx. No new product captures or production access were needed.

The master video contained excluded controls and currency figures. Those UI scenes use vetted Craft captures. The sentence implying automatic phone calls, from master time 62.933333 to 69.266667 seconds, was removed with its captions and audio. Exact scene replacements and source script/caption paths are in video-manifest.json. Final length 88.966667 seconds, labeled as the 90 second tour. Original unaffected filmed/animated scenes remain. Full audio audition is not claimed; source narration and captions were reviewed, browser playback and full-file decode were verified.

The demo route table and capture inventory had no multi location dashboard, so room 6 uses the diagram option explicitly authorized by the brief. Existing homepage/platform content received no redesign. No new runtime dependencies.

## Verification evidence

Directory for every command below: C:/Users/elite/edf-website-showroom.

- node design/showroom/verify.mjs: exit 0, failures empty. Chromium launched with explicit --headless=new and a fresh temporary user data directory. Seven scenarios cover 1440x900, 1440x650, 390x844, reduced motion and JavaScript off. All room screenshots, docked/early/middle/late desktop motion states, phone anchor positions, standard footers and refreshed contact sheets are in shots/.
- Console/runtime errors: 0. HTTP errors: 0. Horizontal overflow: 0. No external requests from showroom.
- Maximum measured cumulative layout shift: 0.00833240125, below 0.05. Phone: 0. Short desktop: 0.00273473613. This conservatively sums observed shifts, rather than reducing them to a maximum session window.
- All runtime page resources after traversing rooms: desktop 651,524 bytes, phone 443,110 bytes, excluding video. Conservative union including every original and Round 2 image variant, OG and shared page resources: 1,373,410 bytes, below 6 MB.
- All 81 WebP image files: 1,173,284 bytes, including 696,318 bytes added in Round 2. Selected sources stay within twice their maximum displayed dimensions across motion and responsive views. Video: 2,701,237 bytes, below 8 MB, H.264/AAC, 1280x720. Video SHA256 is unchanged from Round 1.
- Video network requests before opening: 0. Native video playback, dimensions and duration verified. Dialog closes with Escape, returns focus and prevents focus on background links.
- All seven desktop rooms change with forward scroll and exactly restore sampled middle and early transforms on reverse scroll. Real crop coordinates independently match the original source manifest. Labels and source fadeouts were visually reviewed.
- Rail Arrow keys, Home and End verified. On the phone, click, Enter, fresh direct hash and settled hash reload all place the heading and eyebrow below the 125px combined header and rail, with the entire heading in the viewport. Inherited smooth scrolling is disabled for compact layouts so long jumps land immediately.
- Standard platform header and footer contents match exactly: 22 header links/buttons and 26 footer items. Desktop keyboard dropdowns, mobile open/close/Escape/focus restoration and no-JavaScript navigation passed. Details: navigation-equivalence.json.
- Static fallbacks retain every room and focal details. Single navy room backgrounds and visible HTML copy checks passed.
- Homepage and platform entry link smoke checks at 1440 and 390: link present exactly once and no layout overflow introduced. External services were not exercised.
- node --check js/showroom.js: exit 0.
- git diff --check: exit 0.
- Round 2 asset manifest dimensions and bytes were verified against all 47 files. Native crops and the rebuilt asset contact sheet were visually inspected. Original sitemap, OG and video validation from Round 1 remain applicable because those files are unchanged.

The expanded run initially caught an oversized Liam verification crop and phone samples taken during long inherited smooth scrolls. The asset was cropped from the original capture, and compact navigation now uses immediate jumps. The test also checks fresh hash loading separately from settled hash reload. Hidden lazy images are excluded from forced decoding and empty currentSrc values are handled. Only the subsequent complete passing run is acceptance evidence.

Detailed performance readings, source SHA256 values, browser assertions and entry link results: verification.json. Independent gate: REVIEW.md. No Lighthouse package was installed, so no Lighthouse score is claimed. Browser readings are local laboratory evidence, not a guarantee for every device or network.

## Closeout

Local preview: http://127.0.0.1:8765/pages/showroom.html, bound only to 127.0.0.1. HTTP 200 verified.

Next single action: Claude reviews the committed local candidate and presents it to Alvin. Human gate remains required before publication. Main, production configuration, office systems, archive sources and AI harness configuration were not changed.
