# EDF Website Release Closeout — 2026-06-08

## Release

EDF website update covering two approved PRs: resource hub trust cleanup and EDiFi Eligibility Standalone product positioning.

---

## Production State

| Item          | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Live commit   | `e86aaaf` — fix: resolve merge conflicts, keep resource cleanup + add eligibility standalone nav |
| Local HEAD    | `d5cd2cb` — feat: EDiFi Eligibility Standalone product positioning (merge commit, NOT deployed)  |
| Netlify site  | `exquisite-dango-095989`                                                                         |
| Deploy method | Manual — `netlify deploy --prod --dir .`                                                         |

`d5cd2cb` is a local reconciliation merge of PR #1 and PR #2. Production already has the approved net content via `e86aaaf`. No functional delta. No deploy needed.

---

## What Shipped

### PR #2 — Resource Hub Trust Cleanup (`fix/edf-website-resource-trust-cleanup`)

- All 13 `href="#"` resource cards routed to real pages
- Broken placeholder images replaced with real blog images
- Stale UPCOMING badges (May 15, June 5 webinars) changed to ON DEMAND
- Stale webinar dates replaced with "Recorded session · Watch anytime"
- Register Now CTAs changed to "Request Recording"
- Back-nav fixed in webinars.html: `href="index.html"` to `href="../resources.html"`
- GoHighLevel developer text removed from newsletter form
- JSON-LD Event schema updated: availability changed to `SoldOut` for past webinars

### PR #1 — EDiFi Eligibility Standalone Positioning (`feature/eligibility-standalone-website-positioning`)

- New page: `pages/eligibility-standalone.html`
- Real branded OG image: `images/og-eligibility-standalone.png` (1200x630, EDF brand colors)
- Eligibility Standalone nav link added to site-wide navigation
- OG meta tags: `og:image:width=1200`, `og:image:height=630`, canonical set

---

## Smoke Check Results — All Pass

| Check                                                          | Result                                                                                  |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Homepage loads                                                 | PASS                                                                                    |
| Eligibility Standalone nav link on homepage                    | PASS                                                                                    |
| Eligibility Standalone page loads                              | PASS                                                                                    |
| OG image file serves at production URL                         | PASS                                                                                    |
| og:image:width = 1200                                          | PASS                                                                                    |
| og:image:height = 630                                          | PASS                                                                                    |
| No UPCOMING badge on eligibility standalone                    | PASS                                                                                    |
| Canonical tag present                                          | PASS                                                                                    |
| Resource hub loads                                             | PASS                                                                                    |
| No href=# in resource hub                                      | PASS                                                                                    |
| No UPCOMING badge in resource hub                              | PASS                                                                                    |
| No developer text in resource hub                              | PASS                                                                                    |
| ON DEMAND label present                                        | PASS                                                                                    |
| Webinars page: no stale UPCOMING                               | PASS                                                                                    |
| Webinars page: Request Recording CTA                           | PASS                                                                                    |
| Webinars page: back-nav to resources                           | PASS                                                                                    |
| Webinars page: Eligibility Standalone nav                      | PASS                                                                                    |
| Investors page: Eligibility Standalone nav                     | PASS                                                                                    |
| Dev text: clean on homepage, resources, eligibility-standalone | PASS                                                                                    |
| Podcast page back-nav                                          | PASS (uses /pages/resources absolute path — resolves correctly via Netlify pretty URLs) |
| News page back-nav                                             | PASS (uses /pages/resources absolute path — resolves correctly via Netlify pretty URLs) |

Note on podcast/news back-nav: the smoke check regex checked for `../resources.html` but the live pages use `/pages/resources` (PR #1 auto-merge took the feature branch path format). Both resolve to the same destination. Not a bug.

---

## WIP Files — Safely Stashed

12 uncommitted files were stashed before the working directory was verified clean.

Stash label: `pre-existing website WIP files before production deploy`

Files stashed:

- `images/og-enterprise.png`
- `images/revnet-social/` (directory)
- `js/booking-modal.js`
- `js/monitoring.js`
- `pages/company/compliance.html`
- `pages/demo.html`
- `pages/edifi-vs-dentrix-rcm.html`
- `pages/edifi-vs-manual-billing.html`
- `pages/edifi-vs-weave.html`
- `pages/enterprise.html`
- `pages/resources/case-studies.html`
- `pages/roi-calculator.html`

---

## Recovering WIP Files

**WARNING: Do not run `git stash pop` on main.** Popping the stash on main reintroduces all WIP files into the production deploy root. If `netlify deploy --prod --dir .` is run after that, unfinished pages go to production.

Safe recovery sequence:

```bash
# 1. Confirm what is in the stash
git stash list

# 2. Create a dedicated branch for WIP work
git checkout -b wip/website-new-pages

# 3. Apply the stash to the WIP branch only
git stash apply stash@{0}

# 4. Work, commit, and open a PR when ready
```

Never apply the stash directly on main before a production deploy.

---

## Open Items (Carry-Forward, Not Blocking)

**P2**

- `pages/resources.html:174` — Featured webinar card title "Mastering Eligibility Verification: Live Q&A" contradicts its "On Demand" tag. Fix: remove ": Live Q&A" from title.

**P3**

- `webinars.html` hero CTA still reads "View Upcoming" — section is now "Recent Sessions". Fix: change to "View Sessions".
- `webinars.html` section `id="upcoming"` is stale. Can rename to `id="on-demand"` with coordinated href update.
- `webinars.html` JSON-LD: `offers.url` pointing to `contact.html` with `SoldOut` availability is semantically odd. Could remove the offers block.
