# Visitor geography in Vercel

Open the project's Analytics tab → Events → visitor_location. Inspect the state or city property. `US-NY` means New York state; `US-NY / New York` is the city. Country prefixes keep places with the same name distinct. Country remains available in the standard Countries panel.

This custom event records each viewed route in production using approximate Vercel IP geography. It does not record IP addresses, coordinates, names, email addresses or persistent identifiers, and does not request device location. VPNs and mobile networks can affect accuracy. Missing location remains unrecorded. Reports begin after deployment; historical state/city data is not backfilled.

The `/api/visitor-location` response is private and never cached. Pages retain their existing rendering and design. Analytics failure does not block the site.

Pro supports two custom properties, so this uses only state and city. No Analytics Plus add-on or new provider is needed. It adds one custom event per viewed route with known geography, in addition to the existing pageview. Vercel prices collected Pro events at $0.03 per 1,000, subject to the team's usage credit. See https://vercel.com/docs/analytics/limits-and-pricing.
