# Independent showroom review, round 2

Verdict: BUILT AND VERIFIED as a local prototype. The complete final run passed all seven scenarios with no failed assertions. Ready for Claude and Alvin to review. No push or deployment was performed.

Reviewed the frozen files in `C:/Users/elite/edf-website-showroom`, branch `feat/showroom`. The final run started at `2026-10-12T06:12:50.351Z`. Primary HTML, CSS, JavaScript and video SHA256 values are recorded in `verification.json`.

## Changes reviewed

`pages/showroom.html`, `css/showroom.css` and `js/showroom.js` now contain larger camera moves, real product crops that lift from source regions, staggered reversible motion, a distinct dim opening that resolves into EDiFi, readable static fallbacks, corrected mobile anchor positioning, and the standard platform navigation and footer. `round2-asset-manifest.json` records the added product crops and responsive variants. The round 1 safe video is unchanged.

The home and platform entry links remain one added line each. Canonical, social metadata and sitemap entry remain present. The group stop remains explicitly labeled a concept diagram. The standard footer's Voice AI destination is retained as requested; the showroom narrative introduces no caller capability, writeback, Pinboard, price or customer outcome claim.

## Final executed verification

Directory for all commands: `C:/Users/elite/edf-website-showroom`.

`node design/showroom/verify.mjs` exited 0. The harness used installed Playwright Chromium with `headless: true`, explicit `--headless=new`, and a fresh temporary user data directory. Its static server bound only to 127.0.0.1. It did not trigger booking, social or other external actions. All seven scenarios completed and `failures` is empty.

`node --check js/showroom.js`, `node --check design/showroom/verify.mjs` and `git diff --check` exited 0. Primary deliverable hashes were checked against the final report after verification.

| Check | Final result |
| --- | --- |
| Normal viewports | 1440 by 900, 390 by 844, 1440 by 650 |
| Static fallbacks | Reduced motion and JavaScript disabled at desktop and phone widths |
| Room evidence | Seven normal desktop room shots, seven phone shots with headings visible, seven short desktop room shots, plus docked, early, middle and late samples for all seven desktop rooms |
| Runtime, console, HTTP and failed requests | 0 in all seven scenarios |
| External requests | 0 |
| Horizontal overflow and hidden room copy | 0 in all seven scenarios |
| Desktop CLS, 900 high | 0.00833240125 |
| Phone CLS | 0 |
| Short desktop CLS | 0.00273473613 |
| Reduced motion CLS | 0 at both widths |
| Video requests before dialog opens | 0 in all scenarios |
| Desktop resource file bytes, excluding video | 651,524 |
| Desktop measured transfer bytes, excluding video | 661,124 |
| Phone resource file bytes, excluding video | 443,110 |
| Phone measured transfer bytes, excluding video | 452,110 |
| Conservative total page weight | 1,373,410 bytes, below 6 MB |
| All new image assets | 81 WebP files, 1,173,284 bytes including unused variants and OG |
| Selected image sizing | 0 violations against twice the maximum displayed box for each selected file |
| Video | 2,701,237 bytes, H.264 and AAC, 1280 by 720, 88.966667 seconds |
| Video playback | Real playback and metadata passed at both desktop heights |
| Dialog keyboard behavior | Focus entered dialog, background focus blocked, Tab remained in controls, Escape closed and restored opener focus |
| Rail keyboard behavior | Enter, next arrow, Home and End passed |
| Standard navigation equivalence | All 22 header and 26 footer link/button records exactly match platform destinations and labels |
| Standard navigation interaction | Desktop dropdown keyboard entry, mobile toggle and submenu, Escape and focus restoration, static no JavaScript navigation passed |
| Footer destinations | All local linked files exist |
| Original home and platform links | One visible tour link each at 1440 and 390, no clipping or overflow |
| Copy scan | No prohibited dashes, currency pricing or excluded feature phrases |

`navigation-equivalence.json` contains the full platform versus showroom comparison. The screenshot contact sheets `shots/1440-review-contact.png` and `shots/390-review-contact.png` were rebuilt from this final run and visually inspected. The older round 1 contact sheets were replaced.

The phone anchor checks separately exercised a click to Patient, Enter to Week, a fresh direct hash to Sources, and a reload after that hash had settled. All passed with the entire heading inside the viewport and below the sticky header and rail. With JavaScript the obstruction ends at 125 px and headings begin around 208 px. No JavaScript navigation also passed. The instant mobile scroll fix removes the long smooth transition that previously put a heading behind the rail during arrival.

CLS is the conservative sum of observed shifts without recent input during loading and scripted interaction. The standard session window maximum cannot exceed this sum. No CLS claim is made for JavaScript disabled scenarios because the observer cannot run there. Phone measurements include the fresh hash and reload checks.

Local scroll sampling recorded 180 animation frames per enabled scenario. Median was 16.7 ms, largest frame gap 16.8 ms, and no gap exceeded 50 ms. Initial page work produced one long task per enabled scenario, ranging from 52 to 103 ms; no scroll long task was recorded. These are Chromium lab measurements, not device or field guarantees. Lighthouse was unavailable in the project and global command environment and was not installed.

The image limit is evaluated against the largest actual display box reached by each selected image across responsive and motion samples. A source crop intentionally begins smaller while docked and grows during lift. It is not required to stay below twice its tiny initial docked size. All selected files passed this maximum display check after the Liam crop's unused bottom was removed. Conservative weight includes both generations of all new variants plus requested shared documents, fonts, logos and styles, excluding only video.

## Per room visual and motion review

| Room | Observed result |
| --- | --- |
| 1 Morning | Early state has scattered phone, portal and hold music labels over a dim EDiFi screen. Labels move away and the screen resolves clearly. Caption and floating labels no longer collide in the final composition. |
| 2 Schedule | Camera moves from the schedule toward a real day column. Actual appointment crops lift in sequence and change to vetted green verified states. Late composition reserves space beside the day for the cards; names are readable at full size. |
| 3 Patient | Camera pushes toward the actual frequency table and flags the used rule. Benefit and frequency crops lift separately. Late rule text and benefit labels are visibly readable; no competing duplicate source remains over the lifted crop. |
| 4 Sources | Actual P, O, C and S chips move from their source positions into the provenance composition. Unconfirmed values remain unset. The Phone call chip denotes the supplied provenance category. |
| 5 Week | Week transitions to 3 Day and then a focused day view. Production, confirmation and alert crops lift with visible separation. Original side panels fade as copies lift, avoiding duplicate alert text. Static layouts stack Week, 3 Day and the day focus. |
| 6 Groups | Office tiles and connectors move out from the EDiFi hub. The caption explicitly identifies the view as a concept diagram. |
| 7 People | Real supplied team portraits move apart in sequence from their starting composition. Names and final demo action remain readable. |

The harness records docked, 12%, 50% and 90% poses, then scrolls back to 50% and 12%. All seven rooms changed on forward scroll and returned to exactly matching transform, opacity and other sampled style signatures on reverse. This checks for cumulative transform drift as well as reversibility. `verification.json` includes every sampled rectangle and style.

For the three appointment crops and two patient crops sharing an original source, the harness independently derives normalized crop fractions from the asset manifest and compares them with the production origin boxes. All five match. Other pieces use separately extracted tiles or portraits; their docked rectangles and full motion samples are recorded, and their placement was visually reviewed. Border and caption framing makes some image rectangles a few pixels smaller than the full declared source region, so this is source region alignment rather than a claim of pixel identical compositing.

Viewed the final contacts and full size key product, mobile anchor and footer evidence. The page keeps one navy background; light areas are product captures. The phone layout is intentionally long and stacked. Some product detail continues below each heading screenshot. All room text and static piece labels remain available with no JavaScript and reduced motion.

## Corrections and limits

Intermediate runs were not counted as passes: lazy hidden image decoding and empty currentSrc handling initially interrupted the test harness; these were corrected. QA also found an oversized Liam mobile crop and premature mobile anchor arrival, both fixed before the final passing run. The direct hash test now distinguishes fresh navigation from a settled reload rather than racing a same document navigation against immediate reload. Caption overlap, mobile heading obstruction and the earlier small product focus are resolved in this review.

Found prior record: the supplied draft storyboard contains a writeback scene, while the current brief excludes it. The prior video review also identified a narration sentence implying phone acquisition. The asset builder removed the entire relevant audio and video interval and replaced unsafe UI scenes with vetted Craft crops. `video-manifest.json` records provenance and exact edits. Source narration and caption text, safe asset contact sheets and the final video contact sheet were reviewed; the asset builder also checked boundaries and decoded the full file with ffmpeg. Browser playback is verified. A complete human audio audition is not claimed.

No open blocking issue was found in the final local review. Real Safari, physical phones, assistive technology and field network conditions remain outside this Chromium evidence. No production API or new runtime dependency was introduced.

Next action: Claude and Alvin review the local walkthrough and evidence, then decide whether to accept the merge candidate. Do not push or deploy from this session.
