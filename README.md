# Cornucopia

A personal finance dashboard: monthly budgets per category with rollover (overspend reduces next
month's budget, underspend adds to it), fed by bank CSV exports.

**Your data never leaves your device.** Everything you import is stored in your browser's own
storage (IndexedDB). Nothing is sent to a server, and no financial data is part of this repository.
Use **Import → Save backup** regularly to keep a copy.

## Using it

- **Import → Import Starling transactions:** load a CSV exported from the Starling app. Overlapping
  exports are fine; transactions already imported are skipped, and category choices are remembered.
- **Import → Import categories & budgets from Excel:** one-time setup from a budget sheet with a
  "Categories" / "Amount" table.
- **Dashboard:** this month's spending per category against its rollover-adjusted budget.

On iPhone, open the site in Safari and use **Share → Add to Home Screen**. Safari can clear stored
data for websites that go unused for a while; home-screen apps are not affected.

## Development

```bash
bun install
bun run dev      # local dev server
bun run test     # unit tests
bun run build    # production build into dist/
```

Pushes to `main` are tested, built and published to GitHub Pages by `.github/workflows/deploy.yml`.
