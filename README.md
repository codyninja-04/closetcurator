# ClosetCurator

A digital wardrobe that helps you wear what you already own instead of buying more.

Photograph each piece once and Claude catalogs it (type, colour, pattern, style, seasons, warmth). Then ask for outfits built only from your actual closet, for an occasion, the day's weather, or around one piece you want to wear. Log what you put on with one tap, and over time you see which pieces you reach for and which ones haven't left the hanger in months.

## What's in it

- **Add items** from one photo or a whole batch. Photos are shrunk in the browser, uploaded to a private bucket and read two at a time. Every field Claude fills in can be changed before saving. If the new piece looks like something you already own (same category, colour and type), you get a heads up with photos, which also works as a "do I already have this?" check in a shop: snap it, look, discard.
- **Closet** as a photo grid. Filter by category, search by colour, type or brand, and sort by newest, most worn, least worn or longest on the hanger. Each card shows a wear count and when it was last worn, green when it's in rotation and amber after 90 days. The tick on a card logs it as worn today, with an undo.
- **Item page** with a 12 week wear calendar, history (remove a wrong entry), logging for an earlier day (up to 60 days back) and an optional occasion tag, editing, archiving (keeps the history) and deleting.
- **Outfit suggestions.** Pick Work, Casual, Date, Formal event or Gym. Weather comes from your location if you've allowed it, your home city otherwise, or you set it by hand (hot, warm, mild, cool, cold, plus rain). Optionally build around a piece and add a note ("lots of walking"). The result is a photo grid with a reason for each piece, an overall note and, when the closet is missing something, a plain note saying so. "Wearing this today" logs every piece at once, "Try another" avoids the last pieces, and recent outfits stay in a side list.
- **Insights.** Share of the closet in rotation, the list of pieces not worn in 90+ days (wear it this week, or archive it), wear frequency by category (total or per piece), most worn, weekly logging, what you own vs what you wear by style, colours and occasions.
- **Settings.** Temperature unit, home city for weather, plan, JSON export and account deletion (photos included).
- **PWA.** Installable from the browser menu, opens on the closet.

## Stack

Next.js 14 (App Router), TypeScript strict, Supabase (Postgres with RLS, Google OAuth, private Storage bucket), Claude API with vision, OpenWeather, Recharts, Tailwind.

## Running it

```bash
npm install
cp .env.local.example .env.local   # fill in the values
npm run dev
```

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor. It creates the tables, RLS policies, the wear count trigger, the profile trigger and the private `closet-photos` bucket with its storage policies.
2. Turn on the Google provider under Authentication and add `http://localhost:3000/auth/callback` (and your production URL) to the redirect URLs.
3. Set `ANTHROPIC_API_KEY`. `CLAUDE_MODEL` is optional and defaults to `claude-sonnet-5-5`.
4. `OPENWEATHER_API_KEY` is optional. Without it the outfit page just asks you to pick the conditions.

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## How a few things work

**Photos.** Stored under `{user_id}/items/` in a private bucket. Storage policies only allow access to your own folder, the database stores the path rather than a URL, and pages sign paths for an hour when they render. The API checks any path a client sends against that folder before using it.

**Wear counts.** `wear_count` and `last_worn_date` are kept in sync from `wear_log` by a trigger. Users can't write those two columns directly (column level grants). There's one wear per piece per day, so double taps don't inflate anything.

**Today.** Wears are calendar days. The app sets a time zone cookie from the browser so the server agrees with you on what "today" is.

**Outfits.** Claude gets the closet as short aliases (`p1`, `p2`...) with category, description, style, warmth, seasons and wear history, and answers through a forced tool call. The reply is mapped back to real ids, and anything that isn't in the closet, repeats, or clashes (two pairs of shoes, a dress plus a skirt) is dropped. If you asked to build around a piece and it's missing, it's put back. The prompt nudges toward pieces that haven't been worn lately, without forcing them where they don't fit.

**Plans.** Free holds 40 active items. Pro is $5 a month for unlimited items, outfit suggestions and analytics. Limits only apply when `ENFORCE_PRO=true`, so everything is unlocked until billing is wired up. `profiles.plan` can't be changed by users. There are also daily caps for everyone: 80 photo reads and 30 outfits, tracked in `ai_calls`, which users can insert into but not delete from.

## Not building

No shopping or purchase integration, and no social outfit sharing in v1.
