"use client";

import { useState } from "react";

type Opt = { id: string; label: string; prompt: string };

// Style options append to the *positive* prompt
const STYLE_OPTIONS: Opt[] = [
  {
    id: "cute",
    label: "Cute chibi",
    prompt: "cute chibi style, rounded shapes, big eyes",
  },
  {
    id: "neon",
    label: "Neon cyberpunk",
    prompt: "neon glow accents, cyberpunk, vibrant colors",
  },
  {
    id: "pastel",
    label: "Pastel kawaii",
    prompt: "pastel palette, kawaii aesthetic",
  },
  { id: "watercolor", label: "Watercolor", prompt: "soft watercolor look" },
  {
    id: "pixel",
    label: "Pixel art",
    prompt: "8-bit pixel art, limited palette",
  },
];

// Negative presets append to the *negative* prompt
const NEGATIVE_OPTIONS: Opt[] = [
  {
    id: "text",
    label: "No text/logos",
    prompt: "text, watermark, logo, caption, signature",
  },
  {
    id: "edges",
    label: "Clean edges",
    prompt: "jagged edges, aliasing, compression artifacts",
  },
  {
    id: "background",
    label: "No complex background",
    prompt: "busy background, clutter, scenery",
  },
  {
    id: "anatomy",
    label: "Fix anatomy",
    prompt: "extra fingers, mutated hands, bad anatomy",
  },
];

export default function Page() {
  const [prompt, setPrompt] = useState("a cute cyber cat sticker");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(1152);
  const [height, setHeight] = useState(1152);
  const [seed, setSeed] = useState<number | "">("");
  const [styleIds, setStyleIds] = useState<string[]>([]);
  const [negIds, setNegIds] = useState<string[]>(["text", "edges", "anatomy"]); // sane defaults

  const toggle = (ids: string[], id: string, setter: (v: string[]) => void) =>
    setter(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  async function enhancePrompt() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/prompt-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, styles: styleIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhance failed");
      setPrompt(data.prompt);
    } catch (e: any) {
      setError(e?.message ?? "Prompt helper failed");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setImgUrl(null);

    try {
      const styleText = STYLE_OPTIONS.filter((o) => styleIds.includes(o.id))
        .map((o) => o.prompt)
        .join(", ");

      const finalPrompt =
        styleText.length > 0 ? `${prompt}, ${styleText}` : prompt;

      const negativePrompt = NEGATIVE_OPTIONS.filter((o) =>
        negIds.includes(o.id)
      )
        .map((o) => o.prompt)
        .join(", ");

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          negativePrompt: negativePrompt || undefined,
          width,
          height,
          seed: seed === "" ? undefined : Number(seed),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setImgUrl(data.url); // WebP data URL or normal URL
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) generate();
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6 text-neutral-100">
      <h1 className="text-3xl font-bold">Sticker Maker</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm">Prompt</span>
          <div className="mt-1 flex gap-2">
            <input
              className="w-full rounded border border-neutral-700 bg-neutral-900 p-3"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your sticker..."
            />
            <button
              type="button"
              onClick={enhancePrompt}
              disabled={loading}
              className="shrink-0 rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
              title="Rewrite with AI"
            >
              Enhance
            </button>
          </div>
        </label>

        {/* Sizes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm">Width</span>
            <input
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 p-3"
              type="number"
              min={512}
              max={1536}
              step={64}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm">Height</span>
            <input
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 p-3"
              type="number"
              min={512}
              max={1536}
              step={64}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>

          <label className="block">
            <span className="text-sm">Seed (optional)</span>
            <input
              className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 p-3"
              type="number"
              value={seed}
              onChange={(e) =>
                setSeed(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 1234"
            />
          </label>
        </div>

        {/* Styles */}
        <fieldset className="grid gap-2">
          <legend className="text-sm text-neutral-300">Styles</legend>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((o) => (
              <label
                key={o.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  styleIds.includes(o.id)
                    ? "border-neutral-300 bg-neutral-200 text-black"
                    : "border-neutral-700 bg-neutral-900"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={styleIds.includes(o.id)}
                  onChange={() => toggle(styleIds, o.id, setStyleIds)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Negative presets */}
        <fieldset className="grid gap-2">
          <legend className="text-sm text-neutral-300">Negative presets</legend>
          <div className="flex flex-wrap gap-2">
            {NEGATIVE_OPTIONS.map((o) => (
              <label
                key={o.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  negIds.includes(o.id)
                    ? "border-red-300 bg-red-200 text-black"
                    : "border-neutral-700 bg-neutral-900"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={negIds.includes(o.id)}
                  onChange={() => toggle(negIds, o.id, setNegIds)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>

      {error && (
        <p
          className="text-red-500 whitespace-pre-wrap"
          role="status"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {imgUrl && (
        <div className="space-y-3">
          <div className="relative inline-block overflow-hidden rounded-xl shadow-2xl">
            {/* Checkerboard for transparency */}
            <div
              className="
                absolute inset-0
                [background-image:linear-gradient(45deg,#444_25%,transparent_25%,transparent_75%,#444_75%),linear-gradient(45deg,#444_25%,transparent_25%,transparent_75%,#444_75%)]
                [background-size:24px_24px]
                [background-position:0_0,12px_12px]
                opacity-40
              "
            />
            <img
              src={imgUrl}
              alt="AI generated sticker"
              className="relative z-10 block w-full max-w-xl"
            />
          </div>

          <a
            href={imgUrl}
            download="sticker.webp"
            className="inline-block rounded border border-neutral-700 px-3 py-1"
          >
            Download WebP
          </a>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Uses Replicate (image) + OpenAI (prompt helper). Non-commercial
        educational use.
      </p>
    </main>
  );
}
