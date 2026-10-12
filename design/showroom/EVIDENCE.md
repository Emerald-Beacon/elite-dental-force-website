# Showroom prototype evidence

Verdict: BUILT AND VERIFIED locally. Ready for Claude gate and Alvin review. No push, merge or deployment.

## Changed files

- pages/showroom.html: seven stop walkthrough, numbered rail, keyboard navigation, accessible video dialog, metadata and canonical.
- css/showroom.css: existing site typography and one navy (#0a1d47), desktop sticky rooms and tilted screens, stacked phone and static fallbacks.
- js/showroom.js: passive scroll with requestAnimationFrame, camera and lift movement, illustrative verification count, keyboard rail and lazy video.
- index.html and pages/platform.html: exactly one added Take the tour link each.
- sitemap.xml: showroom URL.
- images/showroom/: 34 optimized WebP files including responsive variants, poster and 1200x630 OG.
- media/showroom/tour.mp4: compressed, sanitized explainer.
- design/showroom/: reproducible preparation and verification scripts, provenance manifests, review and screenshots.

## Rooms

1. Morning: Phones, Portals and Hold music recede around the actual synthetic schedule.
2. Schedule: Open Dental schedule with an explicitly illustrative Verify All sequence; three rows turn green and the count advances with scroll.
3. Patient: actual maximum and deductible labels, coverage percentages and frequency rules, with a review before treatment annotation. Currency values omitted.
4. Sources: Craft P, O, C and S source tiles around confirmed facts and Not set.
5. Week: actual Week and 3 Day captures, with production, confirmation and alert cards lifted into view.
6. Groups: an explicitly labeled concept diagram of three offices feeding one EDiFi view. No fake product dashboard.
7. People: approved Matalena, Richard and Siona portraits, Book a demo and video close.

## Craft provenance and intentional substitutions

Product captures from f4, frequency and source tiles from f3, benefit and coverage panels from f2 as used in film3.jsx, and approved people portraits. Full crop, mask, size and source details are recorded in asset-manifest.json.

The lower resolution sw contact captures were replaced by higher resolution f2 source panels already used in film3.jsx. No new product captures or production access were needed.

The master video contained excluded controls and currency figures. Those UI scenes use vetted Craft captures. The sentence implying automatic phone calls, from master time 62.933333 to 69.266667 seconds, was removed with its captions and audio. Exact scene replacements and source script/caption paths are in video-manifest.json. Final length 88.966667 seconds, labeled as the 90 second tour. Original unaffected filmed/animated scenes remain. Full audio audition is not claimed; source narration and captions were reviewed, browser playback and full-file decode were verified.

The demo route table and capture inventory had no multi location dashboard, so room 6 uses the diagram option explicitly authorized by the brief. Existing homepage/platform content received no redesign. No new runtime dependencies.

## Verification evidence

Directory for every command below: C:/Users/elite/edf-website-showroom.

- node design/showroom/verify.mjs: exit 0, failures empty. Headless Chromium with a fresh temporary user data directory. Seven scenarios cover 1440x900, 1440x650, 390x844, reduced motion and JavaScript off. Screenshots of all rooms at requested widths plus short desktop and fallback views are in shots/.
- Console/runtime errors: 0. HTTP errors: 0. Horizontal overflow: 0. No external requests from showroom.
- Maximum measured cumulative layout shift: 0.000691024, below 0.05. This conservatively sums observed shifts, rather than reducing them to a maximum session window.
- All runtime page resources after traversing rooms: desktop 467,796 bytes, phone 338,746 bytes, excluding video. Conservative union including every new image variant, OG and shared page resources: 649,276 bytes, below 6 MB.
- All 34 WebP image files: 476,966 bytes. Video: 2,701,237 bytes, below 8 MB, H.264/AAC, 1280x720.
- Video network requests before opening: 0. Native video playback, dimensions and duration verified. Dialog closes with Escape, returns focus and prevents focus on background links.
- Rail Arrow keys, Home and End verified. Static fallbacks retain every room. Single navy room backgrounds and visible HTML copy checks passed.
- Homepage and platform entry link smoke checks at 1440 and 390: link present exactly once and no layout overflow introduced. External services were not exercised.
- node --check js/showroom.js: exit 0.
- git diff --check: exit 0.
- Python sitemap/OG/WebP checks: exit 0; exactly one showroom sitemap URL, OG 1200x630, all new runtime images WebP.
- Asset builder verified image manifest dimensions/bytes and decoded full video with ffmpeg: exit 0. Native image and video contact sheets plus transition boundaries visually checked.

Detailed performance readings, source SHA256 values, browser assertions and entry link results: verification.json. Independent gate: REVIEW.md. No Lighthouse package was installed, so no Lighthouse score is claimed. Browser readings are local laboratory evidence, not a guarantee for every device or network.

## Closeout

Local preview: http://127.0.0.1:8765/pages/showroom.html, bound only to 127.0.0.1. HTTP 200 verified.

Next single action: Claude reviews the committed local candidate and presents it to Alvin. Human gate remains required before publication. Main, production configuration, office systems, archive sources and AI harness configuration were not changed.
