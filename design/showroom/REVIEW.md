# Independent showroom review, round 3

Verdict: BUILT AND VERIFIED as a local prototype. All seven scenarios completed with no failed assertions on the final frozen code and assets. Ready for Claude and Alvin to review. No push or deployment was performed.

Worktree: `C:/Users/elite/edf-website-showroom`, branch `feat/showroom`. Final command: `node design/showroom/verify.mjs`, exit 0. Run started `2026-10-13T14:41:24.751Z`. `verification.json` records SHA256 values for HTML, CSS, JavaScript, video and all 81 image assets. These hashes were independently checked again after the run.

## Changes reviewed

`pages/showroom.html`, `css/showroom.css` and `js/showroom.js` now keep the opening pills inside their stage, fit lifted appointment and frequency pieces to visible content, and show the frequency review flag by the middle of room 3. A stable top anchor removes the frequency image jump when its caption appears. Live untransformed layout coordinates preserve the reversible detachment geometry as piece content changes.

`images/showroom/` restores the original synthetic benefit values and removes internal frequency metadata. `media/showroom/tour.mp4` changes only the sanitized frequency artwork. `round3-asset-manifest.json` records those asset edits and source provenance. No new runtime dependency was added. Home and platform tour links remain one added line each, and canonical, social metadata and sitemap entry remain present.

The user explicitly permitted original demo benefit amounts. Annual maximum, remaining benefits and deductibles are product data. EDF pricing remains excluded. Standard platform navigation and footer remain intact, including the requested existing Voice AI destination, without introducing a caller claim in the showroom narrative.

## Round 3 evidence

| Requested correction | Independent result |
| --- | --- |
| Opening pills contained and clear of copy | 101 poses from 0 to 1 in steps of .01 at each desktop height, 202 total; all five pill rectangles remain inside the stage and clear of the room copy |
| Guard sensitivity | Deliberately moved a pill outside the stage in the isolated browser, observed the bounds guard detect it, then restored its original style |
| Tight lifted pieces | Sampled schedule and patient pieces at .35, .50, .60, .75 and .90; zero empty image bands; excess figure height consists of approximately 2 px of border |
| Olivia middle pose | Visible card fits its real image with the hidden caption removed from layout; no blank navy reserve |
| Patient middle flag | Effective opacity 1; both “Frequency already used” and “Review before treatment” fully inside the viewport at both desktop heights |
| Week caption stability | Eleven poses at each desktop height, with zero change in grid height; captions remain displayed and enter with their parent piece opacity |
| Caption appearance stability | 31 additional poses around .360 to .390 at each desktop height; maximum image movement per .001 step is 0.4904 px at 900 high and 1.0516 px at 650 high |
| Original benefit values | Annual maximum $1,500; remaining conflict $1,125 and $980; individual deductible $50; deductible remaining $0; deductible met Yes |
| Benefit source integrity | Exact decoded RGB equality to the original source crop with the existing punctuation mask; exact equality to its Lanczos mobile resize |
| Engineering metadata removed | Native frequency variants and video frame inspected; 20 interior regions of erased metadata lines independently sampled, all pixels at least 250 in each RGB channel |
| Video continuity | 88.966667 seconds, 1280 by 720 H.264/AAC, 2,693,868 bytes; asset audit confirms unchanged AAC payload and successful complete decode |

The independent source comparison is saved in `pixel-verification.json`. The original source is `C:/Users/elite/EDF-Creative/projects/edifi-explainer/f2/amounts.png`, with crop `[50,125,1279,483]`. Both restored benefit files use lossless WebP. The six frequency metadata lines included OD CodeGroupNum, BenefitNum and Not writable; all were removed before resizing. The tight rule crop is 660 by 54 and contains only the source rule. The DOM scan also rejects those engineering phrases.

Viewed original source values, final native benefit and frequency crops, the round 3 asset contact, all room contacts, full size schedule and patient middle poses, phone patient view, and the final video frequency frame at 66 seconds. `shots/video-frequency-round3.png` records that video view. Monetary values remain masked in the video, while the requested room 3 stills restore them. No new benefit value was invented.

## Full regression verification

The verifier served only 127.0.0.1 and launched installed Playwright Chromium with `headless: true`, explicit `--headless=new`, and a fresh temporary user data directory. No booking, social or external action was triggered.

| Check | Final result |
| --- | --- |
| Normal viewports | 1440 by 900, 390 by 844, 1440 by 650 |
| Static fallbacks | JavaScript disabled and reduced motion at desktop and phone widths |
| Runtime, console, HTTP and failed requests | 0 in all seven scenarios |
| External requests | 0 |
| Horizontal overflow and hidden room copy | 0 in all seven scenarios |
| Standard CLS, desktop | 0.00475064448 |
| Standard CLS, short desktop | 0.00509527911 |
| Standard CLS, phone and reduced motion | 0 |
| Lifetime shift sum, diagnostic only | Desktop 0.01526513954; short desktop 0.01225207890; phone and reduced motion 0 |
| Video requests before opening | 0 in all scenarios |
| Desktop local resource bytes excluding video | 634,858 |
| Desktop measured transfer bytes excluding video | 644,458 |
| Phone local resource bytes excluding video | 443,916 |
| Phone measured transfer bytes excluding video | 452,016 |
| Conservative page weight excluding video | 1,360,432 bytes, below 6 MB |
| New image files | 81 WebP files, 1,160,024 bytes |
| Image size violations | 0 against twice the maximum actual displayed box for each selected file |
| Video dialog | Actual playback at both desktop heights, background focus blocked, keyboard containment and Escape focus restoration passed |
| Rail | Enter, arrow navigation, Home and End passed |
| Mobile anchors | Click, keyboard Enter, fresh direct hash and settled reload all put the full heading below the header and rail and inside the viewport |
| Standard navigation | All 22 header and 26 footer link/button records match platform labels and destinations |
| Navigation interaction | Desktop dropdown keyboard entry, mobile toggle and submenu, Escape focus restoration and static navigation passed |
| Original page tour links | One visible link on home and platform at both widths; no clipping or overflow |
| Narrative scan | No prohibited dashes, EDF pricing, excluded capability claims or internal engineering phrases |

All seven rooms were sampled docked, early, middle and late, then revisited in reverse. Transform, opacity and other sampled style signatures matched exactly on both reverse poses. The three appointment crops and two patient crops sharing an original source also passed independently derived normalized crop coordinate comparisons. `verification.json` records style signatures, rectangles, source fractions and the new dense sweeps.

All existing browser screenshots were regenerated, including the seven normal desktop and phone views, seven short desktop views, motion samples, anchor, footer, static fallback and entry link evidence. Both `1440-review-contact.png` and `390-review-contact.png` were rebuilt from the final room shots and viewed. Phone screenshots preserve heading visibility; longer stacked product details continue below those viewports.

The image limit uses the maximum rendered box reached by each selected file across responsive and motion samples. Docked crops intentionally start smaller before they lift. The conservative page weight includes all new variants, unused images and OG plus loaded shared documents, fonts, logos and styles, excluding video.

`node --check js/showroom.js`, `node --check design/showroom/verify.mjs` and `git diff --check` exited 0. All 81 manifest file dimensions and byte sizes were independently validated. The video SHA256 is `ae8c71762cecaa8eb724d7299e8ef26397425461dfd8b5d1224760a06b996a2f`.

## CLS method correction and motion findings

Earlier reviews labeled the lifetime sum of all observed shifts as CLS. That conservative shortcut becomes misleading when a test repeatedly replays every room and adds hundreds of diagnostic poses. The final harness now measures the largest session window, with less than one second between shifts and a maximum five second window, following the [primary CLS definition](https://web.dev/articles/cls). Separate document visits are kept separate. It preserves every shift, significant source rectangles, every session and the lifetime sum for audit. No shift is discarded to obtain a pass. JavaScript disabled scenarios have no PerformanceObserver, so no CLS value is claimed for them.

The first complete round 3 run failed the former lifetime sum gate at 0.09735 and 0.08359. Investigation also found a real 65.86 px frequency image jump as the bottom anchored figure gained its caption. That production defect was corrected before the final run. The independent fine sweep now measures at most 1.052 px per step across the same threshold. Thus the final result includes both a corrected metric and a corrected visible motion defect.

The next diagnostic run exposed a separate Week panel height change of about 44 px, caused by the new global caption display toggle. A narrow Week override keeps those captions displayed from the first visible lift while the parent piece opacity controls their entry. The final 22 pose checks confirm zero Week grid height change. Both standard CLS and the stricter lifetime sum now remain below .05 after the complete repeated QA sequence. No previously observed caption shift was accepted as a residual.

Local scroll sampling recorded 180 animation frames per enabled scenario: median about 16.7 ms, maximum 16.8 ms, and zero gaps over 50 ms. Initial work produced one long task per enabled scenario, 71 to 89 ms; no scroll long task was recorded. These are local Chromium lab measurements. Lighthouse was unavailable in the project and global command environment and was not installed.

## Per room result and limits

1. Morning resolves from contained chaos labels and a dim EDiFi plane into the finished screen, with no pill crossing the copy column.
2. Schedule pushes into a readable day, lifts real appointment crops, and reveals vetted green verification states without blank image reserves.
3. Patient restores original benefit values, removes internal frequency labels and presents the review flag by the middle pose with stable image motion.
4. Sources keeps real P, O, C and S provenance chips and leaves unconfirmed values unset. Phone call describes source provenance.
5. Week retains Week, 3 Day and day focus states with separate production, confirmation and alert pieces. The caption grid now stays a constant height throughout the scroll.
6. Groups remains explicitly labeled a concept diagram.
7. People retains real supplied portraits, names and final demo action.

The navy surface, standard header/footer, readable static fallbacks and clear phone headings remain intact. No blocking issue was found in the final local review. Physical phones, Safari, assistive technology and field network conditions remain outside this evidence. A complete human audio audition is not claimed; video continuity uses source caption review, sampled pixels, unchanged audio payload, complete decode and real browser playback evidence.

Next action: Claude and Alvin inspect the local walkthrough and evidence and decide whether to accept the merge candidate. Do not push or deploy from this session.
