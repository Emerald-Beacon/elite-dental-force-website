# Showroom prototype work record

Authorization: Alvin requested full execution of BRIEF-SHOWROOM-PROTOTYPE-2026-10-11.md on 2026-10-11. This is a local prototype for Claude to gate, not a deployment.

## Scope

Base: origin/main 30be137cb655553a4ad74c18dcef20ec10c22c56, verified locally. Worktree: C:/Users/elite/edf-website-showroom. Branch: feat/showroom, specifically required by the brief. Main checkout is untouched.

Deliverables: seven room showroom page, native motion, responsive and static fallbacks, approved synthetic Craft assets, compressed lazy video, SEO metadata and sitemap, two one line entry links, browser evidence, local commit.

Ownership: commander coordinates and records evidence; builder owns page/CSS/JS and entry links; asset builder owns media conversion and provenance; independent reviewer owns browser checks and review. No production services, cloud writes, new runtime dependencies, pushes or deployments.

## Source decisions

Found prior record: HANDOFF-2026-10-11-final.md (2026-10-11) establishes one navy and first screen motion visibility. Reuse styles.v2.css and its html.js-motion idiom.

Found prior record: storyboard.md is draft 1 and contains write back. Current brief explicitly excludes write back, AI caller and Pinboard. The brief takes precedence over those older scenes and over broader platform-page claims.

The supplied film3.jsx describes the 95.3 second revised film and its provenance, week view and team sequences. Only supplied synthetic media is eligible for conversion.

Group view: inspected demo-stack/src-88cfec8/client/src/App.tsx:117-147 and the shots inventory. No multi location dashboard route or corresponding capture found. Use the brief's honest diagram option, explicitly labeled, with offices feeding one view.

Design read: cinematic product walkthrough for dental offices and groups, preserving existing site navy, typography and buttons. Variance 4, motion 7, density 4. The brief overrides skill defaults for framework, numbered stops, labels over UI, native scroll handlers and a single dark theme. No homepage redesign.

## Acceptance

Seven stops at 1440 and 390 widths with screenshots; keyboard rail, video and escape/focus behavior; no JavaScript and reduced motion static readability; zero console/runtime/resource errors; measured CLS below 0.05; new page resources below 6 MB excluding video; 1280 wide H.264 video below 8 MB with poster and preload none. All new page images are WebP. Review embedded asset text as well as HTML copy for prohibited claims and prices.

## Coordination context

HERDR_ENV is set. Read SESSION_START_PROMPT.md and ran eos.ps1 summary. The current task explicitly limits writes to the showroom worktree, so task status and closeout live here rather than changing standalone eligibility operational state. No eligibility investigation, production truth check or installer work is part of this website brief.

## Round 2 lead gate, authorized in this session

The lead passed the original hard rules and requested a stronger visual execution. Keep branch feat/showroom and produce a new local commit without pushing or deploying.

Required changes: larger readable desktop screens; per-room camera push ins focused on day column, frequency row, and Week then 3 Day; distinct dim morning scene with crowding pills; actual cut pieces separating from their screen with staggered reversible scroll progress; fix the morning caption collision and phone rail occlusion; reuse the standard platform header/footer. Rerun and extend verify.mjs, regenerate screenshots, and update EVIDENCE.md.

Implementation ownership continues: builder owns showroom HTML/CSS/JS, asset builder owns full resolution source crops and provenance, independent reviewer owns browser evidence. No homepage/platform redesign and no video changes needed. Final source hashes must match the tested candidate.

Visual acceptance: compare early, middle and late screenshots, and replay in reverse. Important UI text must be readable at the focal stop. Crop alignment and staggered depth must make it clear which piece came from which screen. Mobile anchor headings must clear the header and stop rail. Static fallbacks must show focal details without relying on camera movement.

Round 2 closeout, 2026-10-12: all seven final browser scenarios passed with explicit --headless=new and a fresh temporary profile. Real crop provenance, reversible poses, mobile heading clearance, standard navigation, static fallbacks and media loading passed. Independent review found no blocking issue. Primary source hashes match verification.json. EVIDENCE.md and REVIEW.md record the final measurements and Chromium-only limits. Produce the authorized new local commit for Claude and Alvin review; no push or deployment.
