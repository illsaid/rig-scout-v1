# RigScout

RigScout is a spec-first search engine for prebuilt PCs. A shopper chooses the components and minimum specifications they want; RigScout returns the closest systems across retailers and sends qualified traffic through disclosed affiliate links.

## Current prototype

- Interactive CPU, GPU, RAM, storage, motherboard, and budget search
- Explainable match scoring with exact, strong, and close matches
- Field-level uncertainty surfaced directly in result cards
- Affiliate-ready outbound redirect layer
- Responsive landing and results experience
- Sample inventory clearly labeled as non-live

## Product boundary

The matching engine is deterministic. AI belongs in retailer ingestion, where it converts inconsistent listings into normalized fields with confidence values. The retailer page remains the final source of truth.

## Next implementation slice

1. Add one retailer ingestion adapter and store normalized listings.
2. Add extraction fixtures for messy product pages.
3. Replace sample inventory with a daily catalog refresh.
4. Add merchant-specific affiliate transformers and real program IDs.
5. Record outbound clicks and user-reported specification errors.

## Local development

Install dependencies and run the development server with the scripts in `package.json`. Run the production build before publishing.
