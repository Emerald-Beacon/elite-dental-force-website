# Showroom prototype evidence, Round 3

Verdict: BUILT AND VERIFIED locally. All seven final scenarios passed. Local candidate on feat/showroom. No push, merge or deployment.

## Changed files and requested corrections

- pages/showroom.html, css/showroom.css and js/showroom.js: bounded morning pill paths; tightly fitted lifted cards; updated benefit description and frequency crop coordinates; earlier frequency warning; stable frequency card anchoring.
- images/showroom/: restored benefit values and cleaned frequency crops, generated from the original supplied synthetic captures.
- media/showroom/tour.mp4: removed engineering identifiers from the frequency scene. The audio, duration and prior exclusions remain intact.
- design/showroom/: updated asset generators and manifests, expanded verification, regenerated room screenshots and contact sheets, independent review and this evidence report.

The opening pills remain inside the stage and clear of the copy. Their centers follow bounded paths with margins for rotated extents. The lift code sizes each card around its actual image and displayed caption, rather than reserving an empty navy strip. The Olivia card is tightly fitted while pending; its verified capture and label appear later in the same reversible sequence.

The frequency lift now runs from 24% to 48% of room progress, making the rule and review warning fully visible at 50%. QA also found a real 65.86px image jump when the bottom anchored card gained its caption. Stable top anchoring removes that jump without reserving empty space. Builder measurements across 31 closely spaced poses found maximum adjacent movement of 0.49px at 1440x900 and 1.052px at 1440x650. Independent checks repeat that sweep.

The same review caught Week panel movement introduced by collapsing captions. A Week-only rule keeps those captions attached throughout each panel's lift; the parent panel opacity controls their entry. Panel heights remain constant, removing the approximately 44px jumps. Builder threshold sweeps measured at most 1.07px adjacent movement.

## Rooms retained

1. Morning: crowded phone and portal pills over a dim EDiFi gateway resolve into the bright opening screen.
2. Schedule: a real 3 Day capture pushes into one day; matching appointment crops lift and become verified.
3. Patient: real benefit amounts, frequency rules and a clearly separate frequency already used / review before treatment annotation.
4. Sources: real P, O, C and S provenance tiles and confirmed facts.
5. Week: Week, 3 Day and focused day views with production, confirmation and alert panels.
6. Groups: the explicitly labeled office concept diagram.
7. People: the approved Matalena, Richard and Siona portraits, demo action and lazy video.

The standard platform header/footer, phone anchor clearance, one navy, static fallbacks, entry links, sitemap and existing claims remain in place. No new runtime dependencies or production access.

## Source evidence

The user explicitly authorized synthetic benefit amounts, distinguishing them from EDF pricing. The first three benefit cards now show the exact f2/amounts.png values: annual maximum $1,500; remaining conflict $1,125 and $980; individual deductible $50; deductible remaining $0; deductible met Yes. Both conflicting remaining values are preserved. EDF prices remain excluded.

Restored benefit images use lossless WebP. The asset pipeline asserts decoded RGB equality against the original desktop crop, apart from the existing nonmonetary punctuation mask, and against the exact resized source for mobile. No amounts were invented or typed into the image.

All six internal frequency metadata rows, including CodeGroupNum, BenefitNum and Not writable, are removed before cropping/resizing. The lifted rule is a tight 660x54 crop around the actual rule text. Original crop coordinates, masks and source hashes are in asset-manifest.json, round2-asset-manifest.json and round3-asset-manifest.json.

The frequency crop also appeared inside the tour video, so that scene was cleaned through the existing rendering pipeline. Final video: H.264/AAC, 1280x720, 88.966667 seconds, 2,693,868 bytes. SHA256: ae8c71762cecaa8eb724d7299e8ef26397425461dfd8b5d1224760a06b996a2f. The AAC packet hash matches the prior committed video exactly. Full-file ffmpeg decode exited 0. Scene boundaries and refreshed video contact sheets were visually inspected. The earlier excluded caller sentence and unsafe controls remain removed. A complete human audio audition is not claimed.

All 81 WebP image entries validate against their manifests, totaling 1,160,024 bytes. prepare-round3-assets.py reproduces the stills, video and pixel/audio checks. No archive source was modified.

## Verification method

Directory: C:/Users/elite/edf-website-showroom. Command: node design/showroom/verify.mjs. Chromium uses explicit --headless=new and a fresh temporary user data directory; the test server binds only to 127.0.0.1.

The seven scenarios cover 1440x900, 1440x650, 390x844, reduced motion and JavaScript disabled. Expanded checks include 101 morning poses at each desktop height, copy intersections, stage boundaries, tight card geometry, midpoint warning visibility, 31 fine poses around caption reveal at each desktop height, exact reverse motion, source crop provenance, image sizing, keyboard/navigation, phone direct links, lazy video and resource errors. An intentional browser-only escaped pill proves the boundary checker rejects a defect.

CLS now uses the maximum session window defined by [the primary web.dev guidance](https://web.dev/articles/cls): less than one second between shifts, at most five seconds per window. The previous harness conservatively summed every shift over the entire repeated test session. That lifetime total remains recorded as cumulativeShiftSum, together with every event and session. The first Round 3 run failed that older lifetime-sum gate; it is not counted as passing evidence. The actual caption jump was corrected before the final rerun, independently of the metric correction.

Screenshots in shots/ include every room, docked/early/middle/late desktop states, phone anchors, standard footers and refreshed contacts. Native benefits, frequency crops and the cleaned video frame were visually compared with their source. Primary deliverable hashes are recorded in verification.json. Independent findings: REVIEW.md.

## Final measured results

The frozen run started at 2026-10-13T14:41:24.751Z. node design/showroom/verify.mjs exited 0 with seven complete scenarios and an empty failures list.

- Morning boundaries and copy clearance: all 202 sampled poses passed; the deliberately escaped pill was detected.
- Lifted image bands: zero excess empty image-container height. The frequency warning is fully visible at midpoint at both desktop heights. Reverse motion and source crop alignment passed.
- Frequency caption reveal: maximum adjacent movement 0.4904px and 1.0516px across the fine sweeps. Week caption grid height remains constant throughout the tested reveal thresholds.
- Maximum standard CLS: 0.00509528, below 0.05. Desktop 900 high: 0.00475064. Phone and reduced motion: 0. The stricter lifetime totals are also below 0.05: maximum 0.01526514 across the complete repeated QA session.
- Conservative page weight including all image variants and shared resources: 1,360,432 bytes, excluding video. Traversed desktop resource files: 634,858 bytes; phone: 443,916 bytes.
- Runtime, console, HTTP, external request and overflow errors: 0. Video requests before opening: 0. Video playback and dialog focus/keyboard checks passed.
- Source image sizing, static fallbacks, standard navigation and phone click/keyboard/direct hash/reload clearance passed. Header and footer still match the platform page.
- Independent pixel-verification.json confirms original benefit pixel equality and clean sampled metadata regions.
- node --check js/showroom.js, node --check design/showroom/verify.mjs and git diff --check exited 0. Tested deliverable hashes match the final files.

## Limits and next action

Evidence is local Chromium laboratory testing. Safari, physical phones, assistive technology and field networks remain untested. Verification states and the frequency review flag are explicitly illustrative synthetic demonstrations. No Lighthouse score is claimed.

Local preview: http://127.0.0.1:8765/pages/showroom.html, bound only to 127.0.0.1. HTTP 200 verified after restarting the local preview server.

Next single action: Claude reviews the new local commit and presents the candidate to Alvin. No publication from this session.
