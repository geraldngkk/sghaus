---
date: 2026-11-25
topic: sgpf-seed-community-service
---

# SGHaus as a community service (SG Partnerships Fund, Seed tier)

## Problem Frame

Gerald is applying to the SG Partnerships Fund Seed tier (up to $5,000, up to 100% of supportable costs, one year, open all year). Reviewers check three things: the project is non-commercial, citizen-led, and engages other citizens for community benefit. The fund "does not fund commercial projects".

Today SGHaus reads like a startup funnel: results sit behind an email gate, the seller emails push towards listing, and the site description says "Don't wing it". The change repositions it as a free community service that helps HDB buyers and sellers, especially older homeowners, check a price before they take an agent's word for it, and adds online community activity that other citizens take part in.

Gerald confirmed on 25 Nov 2026 that SGHaus will not be commercialised.

## Requirements

**Positioning and copy**
- R1. The landing page, the site description and the share image drop "Don't wing it" and present SGHaus as a free community tool for Singapore homeowners. New headline direction: know what a flat is worth before you make or accept an offer.
- R2. A short line under the hero reads "Free for every Singaporean". Nothing about agent fees, ads or data is added.
- R3. The About page tells the founder story: the founders, in their thirties, saw their elderly parents take an agent's word at face value and risk losing money on advice from agents who wanted to close fast. It says who SGHaus is for: first-time buyers, older owners selling or right-sizing, and the families who help them.
- R4. No disclaimer is added anywhere.
- R5. The rule against naming data sources stays in force on every surface, the new pages and translations included. Copy says "based on real resale transactions" or similar.
- R6. No Beta badge appears anywhere (the current header already has none; keep it that way).

**Access without barriers**
- R7. Analysis results show immediately for buyers and sellers, with no email gate, popup or timer.
- R8. An optional "Email me this report" action remains for people who want a copy, and joining it is the only way into an email sequence.

**Languages**
- R9. A language dropdown in the header switches between English, Chinese, Malay and Tamil, and the choice persists across pages and visits. Each language sets the page language attribute (en, zh-Hans, ms, ta) and uses a font that covers its script, while prices keep the Latin tabular figures.
- R10. Translated in all three languages: the landing page, the buy and sell flows with their results, the About page, the "How we work out the numbers" page (R13), the Learn hub guides and the help-your-parents kit. Town, insights and other SEO pages stay English only.
- R11. Numbers, prices and block or street names stay as they are in every language.
- R12. Each language is read by a fluent speaker before it goes live.

**Explaining the numbers**
- R13. A "How we work out the numbers" page explains comparables, how the three prices are set, COV, lease decay and what the tool can't see (condition beyond the renovation questions), without naming any data source.
- R14. The Learn hub grows from the three current guides to cover at least lease decay and CPF use, buyer's stamp duty, and how to check an agent's suggested price. Every rule stated in a guide is checked against the current official rule before publishing.

**Seller help**
- R15. Offer evaluation mode: a seller types in an offer they have received and sees where it sits against their floor, target and opening ask, with a plain suggestion and its reason (for example "below your floor, consider countering at $X") and what to check before deciding: the buyer's financing, timing and the flat's condition. It never shows a bare one-word verdict. It sits on the seller results and on reopened saved reports, and an empty entry shows nothing.
- R16. The seller email sequence becomes education: what COV means, what to check before accepting an offer, how lease affects buyers' financing, and a reminder to log the outcome. No email pushes listing or urgency. The buyer sequence gets the same review.

**Online community**
- R17. Help-your-parents kit: a page plus a WhatsApp-ready message that adult children send to a parent, or use together, to run the flat's numbers before agreeing to an agent's price. It works on a phone, in all four languages, and links straight into the buy or sell flow. The buy and sell pages read the existing share-link parameters and prefill the form, so a parent who taps the link lands on their flat already entered.
- R18. Monthly live online clinic: a 45-minute live session where volunteers run listings sent in by viewers. Before the first clinic, the site has a clinic page with the next date, a sign-up form and a way to submit a listing ahead of time. After the first clinic, the page adds past recordings, and recordings feed the Learn hub.
- R19. Clinic sign-ups and submitted listings are stored so Gerald can count attendees and reply; submitters agree that their listing may be shown, with personal details removed. Submissions are validated on the server, written to the sheet as plain text (never as formulas), protected against bots, and never shown on the site without escaping. A failed save shows the person an error.

**Data handling**
- R20. Internal lead scoring is switched off before the application goes in, and no seller-to-listing hand-off remains.
- R21. Every form that collects an email or a listing carries one line saying what it is used for and how to ask for deletion, in the page's language. This is a collection notice, not a disclaimer. Clinic sign-up emails are used only for clinic reminders and replies, never for the email sequences.
- R22. Clinic submissions sit in a sheet only Gerald can open, never shared by link. Gerald redacts each listing before the session (name, contact, unit number and exact floor removed) and volunteers see only the redacted copy. The sign-up and the session opening say the clinic is recorded and published, and names, faces and chat are cut from recordings before they go up. Raw submissions are deleted 90 days after their clinic.

**Design defaults**
- R23. Language options appear in their own script (English, 中文, Bahasa Melayu, தமிழ்). A first visit uses English unless the browser language is a supported one. Switching language keeps the form inputs and results on screen. English-only pages keep the saved choice and show one line in that language saying the page is in English.
- R24. On a phone the header holds the logo, the language dropdown and a menu with Buy, Sell, Help your parents, Clinic, Learn and About. The homepage adds one community section below the buy and sell entry, so the number stays the hero.
- R25. The kit page lets the sender pick the parent's language and buy or sell, then offers "Send on WhatsApp" with the message prefilled, plus a copy button. The link carries the language and any flat details.
- R26. The clinic page has a state for each case: no date yet ("next date coming soon" with a notify option), no recordings yet (section hidden), sign-up success (confirmation on screen and by email with the joining link and a calendar file) and sign-up failure (inline error and retry).
- R27. Body text is at least 16px, kit and offer-check text at least 18px, and touch targets at least 44px. Every translated screen is checked at 390px for overflow.

## Success Criteria

- A reviewer who opens sghaus.com sees a free community tool, with no gate, no sales push and no Beta label, and finds the founder story and the community programme within two clicks.
- The Seed application points to the live phase 1 work and asks the fund to pay for phase 2.
- Twelve months after the award: clinics held monthly, with attendance, kit shares (counted from tagged kit links) and analyses per month reported against the analyses logged in the Google Sheets "Searches" tab as the starting point.

## Phasing

| Phase | When | Requirements |
|---|---|---|
| 1. Before applying | Built and live, self-funded | R1 to R8, R13, R17, R18 (clinic page with the first date), R19 to R27, and translation (R9 to R12) of the landing page, the buy and sell flows with results, the kit and About |
| 2. Grant-funded | Over the twelve months after the award | R14 new guides and their translations, the methodology page and guide translations, R15 offer evaluation, R16 email rewrite, the monthly clinic series with recordings |

Before applying, any current email that pushes listing or urgency is paused; the full education rewrite comes in phase 2. The budget section of the application covers phase 2: fluent-speaker review of the translations, the live clinic platform, recording and editing, and promotion of the kit and clinic.

## Scope Boundaries

- No monetisation, paid tiers, agent referrals or B2B work.
- No in-person events.
- No community outcomes board and no volunteer translator programme (Gerald chose against both on 25 Nov 2026).
- No condo or private property work and no agent view.
- Town and insights SEO pages are not translated.

## Key Decisions

- Seed tier, not Sprout: no commercial track record is needed and the window is open all year.
- Keep the no-sources rule even for the grant: Gerald's brand rule outranks the transparency argument.
- No disclaimer: Gerald's call.
- Online only: the clinic and the kit replace the in-person clinics and buddies first proposed.
- Applicant: Gerald, a Singapore citizen or PR living in Singapore, applies as an individual (confirmed 25 Nov 2026).
- Split in two phases so the grant funds forward work (25 Nov 2026).
- Offer evaluation shows position and next steps, never a bare verdict, so the tool doesn't become another authority people trust blindly (25 Nov 2026).

## Dependencies / Assumptions

- The source code is not in the Drive folder: `src/`, `public/` and `scripts/` show as deleted in the Drive git working tree and sit, without git, in `C:\Users\elodi\Documents\Housing Startup Singapore\app`. Both match the last commit (9 Jul 2026). Work should start from a fresh off-Drive clone of `geraldngkk/sghaus`.
- Gerald runs the clinic and finds fluent reviewers for Chinese, Malay and Tamil. Reviewers said the citizen-engagement test is stronger with at least two named volunteer co-hosts besides Gerald, listed on the About page before applying.
- Result text is built inside the calculation code (`src/lib/negotiation.ts`, `risk-assessment.ts`, `renovation.ts`, `offer-calculator.ts`, `src/actions/analyze-seller.ts`; about 200 strings), so translating results means turning those strings into parameterised messages. This is the largest piece of phase 1.
- Every form writes to one Google Apps Script endpoint whose source is not in the repo, and today's actions report success even when the write fails. New clinic record types need script changes outside version control.
- Resend's free tier schedules at most 72 hours ahead, so a longer email sequence needs either a paid plan (a possible grant cost) or a scheduled sender.

## Outstanding Questions

### Resolve Before Planning
- (none)

### Deferred to Planning
- [Affects R9-R12][Technical] How translations are produced and stored, and whether language lives in the URL for search engines (a cookie-only choice makes static pages dynamic).
- [Affects R8, R16][Technical] Whether the report email and sequences follow the chosen language, which needs the language stored with the subscription.
- [Affects R18][Technical] Which live platform and sign-up store to use (the existing Google Sheets and Apps Script set-up is the default).
- [Affects R14][Needs research] Current CPF lease rule, stamp duty rates and HDB valuation rules to check the guides against.
- [Affects R16][Technical] Where the seller and buyer email sequences are defined and how to reschedule them without a paid Resend plan.

## Next Steps

→ `/ce:plan` for structured implementation planning
