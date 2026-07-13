# Prebuilts.co

Prebuilts.co is a spec-first search engine for prebuilt PCs. A shopper chooses the components and minimum specifications they want; Prebuilts.co returns the closest systems across retailers and sends qualified traffic through disclosed affiliate links.

## Current prototype

- Interactive CPU, GPU, RAM, storage, motherboard, and budget search
- Explainable match scoring with exact, strong, and close matches
- Field-level uncertainty surfaced directly in result cards
- Affiliate-ready outbound redirect layer
- Responsive landing and results experience
- Sample inventory clearly labeled as non-live
- Primary-use weighting for gaming, editing, 3D, AI/ML, and general use
- Exact, close, and worth-considering result groups
- Upgradeability badges for case, PSU, memory configuration, and cooling
- Shareable build-brief URLs
- Best Buy Products API adapter with code-only normalization
- D1-backed listings, raw provenance snapshots, and ingestion run records
- Daily catalog refresh with a clearly labeled sample fallback
- Core-page sitemap, canonical URLs, and noindex handling for shared search permutations
- Privacy-conscious outbound click logging and merchant-specific affiliate transforms
- Public ingestion health reporting for operational verification
- Incorrect-spec reporting with privacy-conscious D1 storage and review status

## Product boundary

The matching engine is deterministic. AI belongs in retailer ingestion, where it converts inconsistent listings into normalized fields with confidence values. The retailer page remains the final source of truth.

## Next implementation slice

1. Configure the Best Buy API key when approval arrives and verify the first production refresh.
2. Add merchant-specific affiliate transformers and real program IDs.
3. Review incoming specification reports against retailer snapshots.
4. Add saved-search email alerts after the live catalog is stable.

## Local development

Install dependencies and run the development server with the scripts in `package.json`. Run the production build before publishing.
