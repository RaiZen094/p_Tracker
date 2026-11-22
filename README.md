# Joining Docs Tracker

A browser-local checklist for joining Pubali Bank PLC. It tracks document status, attestation, deadlines and notes, and includes a printable joining-day checklist.

Choose **My documents** to track readiness for paperwork you source yourself. Choose **Bank-provided forms** to record which blank forms have arrived. Open a bank form to track filling and signing it. Both groups appear on the final print checklist. Use **Edit document details → Form provided by the bank** to change a document’s group.

## Run locally

Use Node.js 24 and npm. From the repository root, run:

```sh
npm ci
npm run dev
```

Run `npm test` for the tracker tests and `npm run build` to create the static site in `dist/`.

## Deploy to Vercel

1. Open [Vercel's New Project page](https://vercel.com/new), connect GitHub, and import `RaiZen094/p_Tracker`.
2. Use the repository root (`./`), the **Vite** framework preset, and the **main** production branch.
3. Use `npm ci` for installation, `npm run build` for the build command, and `dist` for the output directory. Leave environment variables empty.
4. Select **Deploy**. Open the resulting URL, visit **Print list**, and refresh to verify direct routing. The included `vercel.json` serves the app on direct visits to its routes.

To transfer progress from localhost to the hosted site, choose **Settings → Export JSON** on localhost, then **Settings → Import JSON** on the hosted site.
