"use client";

import { useState } from "react";
import { Sparkles, Wand2, Download, AlertCircle, Loader2 } from "lucide-react";

type Opt = { id: string; label: string; prompt: string };

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
  const [negIds, setNegIds] = useState<string[]>(["text", "edges", "anatomy"]);

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
      setImgUrl(data.url);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Simplified static background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-4xl px-6 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Sticker Maker
          </h1>
          <p className="text-slate-400 text-lg">
            Create amazing AI-powered stickers in seconds
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-300">
              Describe your sticker
            </label>
            <div className="relative">
              <textarea
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4 pr-24 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A majestic dragon breathing colorful flames..."
                rows={3}
              />
              <button
                type="button"
                onClick={enhancePrompt}
                disabled={loading}
                className="absolute right-3 top-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
              >
                <Wand2 className="w-4 h-4" />
                Enhance
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Width
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                type="number"
                min={512}
                max={1536}
                step={64}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Height
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                type="number"
                min={512}
                max={1536}
                step={64}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Seed <span className="text-slate-500">(optional)</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                type="number"
                value={seed}
                onChange={(e) =>
                  setSeed(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="1234"
              />
            </div>
          </div>

          <div>
            <label className="block mb-3 text-sm font-medium text-slate-300">
              Style
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(styleIds, o.id, setStyleIds)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    styleIds.includes(o.id)
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-3 text-sm font-medium text-slate-300">
              Quality controls
            </label>
            <div className="flex flex-wrap gap-2">
              {NEGATIVE_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(negIds, o.id, setNegIds)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    negIds.includes(o.id)
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/50"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-lg font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating magic...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Sticker
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-300 text-sm">{error}</p>
          </div>
        )}

        {imgUrl && (
          <div className="mt-8 space-y-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700">
                <div className="relative overflow-hidden rounded-2xl">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)`,
                      backgroundSize: "20px 20px",
                      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                    }}
                  />
                  <img
                    src={imgUrl}
                    alt="AI generated sticker"
                    className="relative z-10 block w-full max-w-2xl mx-auto drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Download button — fixed like the other file */}
            <div className="flex justify-center not-prose">
              <a
                href={imgUrl!}
                download="sticker.webp"
                className="no-url-after inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download WebP
              </a>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            Powered by Replicate & OpenAI • For educational use
          </p>
        </div>
      </main>
    </div>
  );
}
