# Palette Studio — Developer Notes

## Post-build review (2026-03-31)

### D — Prop drilling
No chains deeper than 2 levels were found. All props originate in `usePalette` and
are consumed directly in leaf tabs or components passed as a single hop. No refactoring
needed at this stage.

### F — Unused utility functions
**`tempCategory(h, s)`** in `src/utils/colourMath.js` (line 182) is exported but never
imported anywhere. It was a candidate helper for the IssuesTab warm/cool categorisation
but was superseded by inline logic in `diagnose.js`. Safe to delete if it causes confusion;
left in place for now as it carries no runtime cost.

### H — Mobile layout (390 px)
Grid `minmax` values in `AddColoursTab` and `ReadabilityTab` were lowered from 220 px / 200 px
to 160 px so cards remain readable at 390 px viewport width. The three mockup components
(WebsiteHero 100%, SocialPost 360 px, BusinessCard 504 px) are intentionally fixed-width and
sit inside an `overflowX: auto` scroll wrapper — no change needed there.
