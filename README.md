# New Monk

Static D2C landing page for New Monk, with a Netlify Function for approximate city detection.

## Blinkit city routing

Set the `IPINFO_TOKEN` environment variable in Netlify. The token is used only by `netlify/functions/detect-city.js` and is never exposed to the browser. The frontend calls `/api/detect-city`, caches the returned city for the session, and keeps every CTA pointed at `https://blinkit.com/` until a resolved destination is available.

Edit `config/blinkit-urls.json` when the Blinkit destination model is confirmed:

- For city-specific product URLs, fill the `cities` values and aliases.
- For one universal India product URL, fill `IN_DEFAULT` and leave city values blank.
- Leave unavailable destinations blank so visitors safely use the general Blinkit homepage.

Client confirmation required: does Blinkit provide distinct product URLs per city, or one universal product URL that resolves delivery availability from the user's saved address? No live product URLs were provided, so the checked-in config intentionally uses safe fallbacks.

## Deploy

### Vercel

Import the GitHub repository and use:

- Framework preset: Other
- Build command: empty
- Output directory: `.`
- Production branch: `main`

The repository includes `vercel.json` with static hosting and security headers.

### Netlify

Import the GitHub repository with:

- Build command: empty
- Publish directory: `.`
- Branch: `main`

The repository includes `netlify.toml` with the same publish configuration.

# finalmonk
# finalnewmonk
