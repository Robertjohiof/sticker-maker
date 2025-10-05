Sticker Maker (Next.js + Replicate + OpenAI)

Generate glossy, transparent-background sticker PNG/WebP images from text prompts.
Includes a one-click Enhance button powered by OpenAI to improve the prompt automatically.


Alle linkene:
**Live demo:** https://sticker-maker.vercel.app  
**Repository:** https://github.com/Robertjohiof/sticker-maker
**ChatGPT:** https://chatgpt.com/share/68e153cd-b99c-800b-8ce3-d977fc1c92d7


***AI-verktøy og teknologier brukt i prosjektet***

Dette prosjektet ble utviklet med hjelp av flere ulike AI-verktøy og API-er som samarbeidet for å både bygge applikasjonen og generere de ferdige klistremerkebildene.

**ChatGPT (GPT-5) – fungerte som hovedutviklingsverktøyet, med ansvar for strukturering av Next.js + TypeScript-applikasjonen, oppsett av API-logikk, optimalisering av brukergrensesnitt og implementering av TailwindCSS-designsystemet.

**Claude.ai – bidro med finpuss av utseende og visuell balanse, og hjalp til med tekstpresentasjon og siste detaljer i layouten.

**GitHub Copilot – ga automatiske kodeforslag og små syntaks-forbedringer direkte i VS Code under utviklingen.

**Replicate API – håndterte AI-bildemotoren, og koblet frontend-applikasjonen opp mot avanserte generative modeller.

**fofr/sticker-maker-modellen (hostet på Replicate) – selve bildegeneratoren som laget klistremerker med gjennomsiktig bakgrunn basert på brukerens prompt.

**AlbedoBase XL (av albedobond, publisert på CivitAI) – en grunnmodell basert på Stable Diffusion XL 1.0, som benyttes som en del av trenings- og modellgrunnlaget for sticker-maker-modellen, og som bidrar til lyssetting, fargetoner og fotorealistiske detaljer.

**OpenAI-modeller – ble brukt til forbedring av prompt-tekst, slik at brukeren kunne raffinere beskrivelsen før bildegenerering.

Sammen sørget disse AI-systemene for en komplett prosess – der ChatGPT stod for logikk og struktur, Claude.ai finjusterte det visuelle uttrykket, Copilot effektiviserte koden, og Replicate med fofr/sticker-maker (bygget på AlbedoBase XL) sto for selve bildegenereringen – noe som resulterte i et funksjonelt, kreativt og læringsrettet AI Sticker Maker bygget med Next.js, TypeScript og TailwindCSS.


Prosjektet er laget av Robert Johannessen, med støtte fra flere AI-verktøy.



✨ Features

Text-to-sticker via Replicate model fofr/sticker-maker:<version>

“Enhance” button (server action) that rewrites your prompt with OpenAI (gpt-4o-mini)

Negative prompt presets & style toggles

Transparent background and download button

Works locally and on Vercel (Serverless functions, Node runtime)

🚀 Quick Start
Prerequisites

Node 18+ (or 20+)

pnpm (recommended) or npm/yarn

Accounts & API keys for:

Replicate → https://replicate.com/account/api-tokens

OpenAI → https://platform.openai.com/api-keys

1) Clone and install
git clone https://github.com/<your-username>/sticker-maker.git
cd sticker-maker
pnpm install
# or: npm install / yarn

2) Configure environment

Create .env.local in the project root (this file is git-ignored) and fill it in:

REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini


An example is provided in .env.example.
OPENAI_MODEL can be any model you have access to (e.g. gpt-4o-mini).

3) Run locally
pnpm dev
# open http://localhost:3000

🔧 Environment Variables (summary)
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini


On Vercel: go to Project → Settings → Environment Variables and add the same three variables for each environment you use (Production/Preview/Development). Then redeploy.

Tip: After adding/updating env vars on Vercel, hit “Redeploy” so the functions see the changes.

🧠 How it Works

UI (src/app/page.tsx)
You enter a prompt, pick size and presets, and click Generate. The page calls our API routes.

Prompt Helper (src/app/api/prompt-helper/route.ts)
When you click Enhance, this route uses OpenAI (OPENAI_API_KEY / OPENAI_MODEL) to rewrite and expand your prompt.

Image Generation (src/app/api/generate/route.ts)
This route runs the Replicate model fofr/sticker-maker:<version> with your prompt + negative presets.
It returns a data URL (WebP by default) which is displayed on the page and can be downloaded.

Diagnostics (src/app/api/diag/route.ts)
A tiny health check route to confirm your server can read both Replicate and OpenAI env vars.
Visit /api/diag to see JSON like { hasReplicate: true, replicateStatus: 200, ... }.

We force the Node runtime in our server routes:
export const runtime = "nodejs";
This avoids “ReadableStream”/Edge runtime issues when decoding model output.

🧱 Project Structure
src/
  app/
    page.tsx                    # UI (form, styles, preview, download)
    api/
      generate/route.ts         # Replicate sticker generation (Node runtime)
      prompt-helper/route.ts    # OpenAI prompt enhancer (Node runtime)
      diag/route.ts             # Diagnostics (Node runtime)
public/
README.md
.env.example

☁️ Deploy on Vercel

Import the repo into Vercel (use the “Import Git Repository” flow).

In Project → Settings → Environment Variables, add:

REPLICATE_API_TOKEN → your token

OPENAI_API_KEY → your key

OPENAI_MODEL → gpt-4o-mini (or the model you prefer)

Redeploy the project.

Visit your domain (e.g. https://sticker-maker.vercel.app) and test:

/api/diag should return hasReplicate: true, hasOpenAI: true, and replicateStatus: 200.

The Enhance button should improve prompts.

Generate should return a sticker image.

🛠 Troubleshooting

“Unauthorized” on Generate
Usually means REPLICATE_API_TOKEN isn’t set (or not exposed in this environment).
Add the var in Vercel → Settings → Environment Variables → Redeploy.
If you use another key name on Vercel, we also read REPLICATE_TOKEN as a fallback.

“402 Payment Required / 429 Too Many Requests” from Replicate
You may be out of credit or rate-limited. See your Replicate billing.

OpenAI quota error (429)
Add billing or increase quota at https://platform.openai.com/account/billing
.

Edge/runtime stream errors
We already set export const runtime = "nodejs"; in API routes. If you add new routes that deal with binary streams, add that line there too.

ESLint blocking Vercel build
We relaxed TypeScript “no-explicit-any”/ban-ts-comment in eslint.config.mjs and disabled problematic Next.js rules in next.config.ts. If you re-enable them, fix errors locally before pushing.

🔒 Security Notes

Never commit real secrets.
.env.local is git-ignored (see .gitignore). Keep your API keys out of Git.

Provide an example for others in .env.example (no secrets inside).

🧾 Credits

Sticker model: fofr/sticker-maker:<version> on Replicate

Prompt helper: OpenAI (default gpt-4o-mini)

UI: Next.js App Router + Tailwind styling classes

📄 License

MIT — do whatever, just be nice. Add attribution where appropriate.



 
 
