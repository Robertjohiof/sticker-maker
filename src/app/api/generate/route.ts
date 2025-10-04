import Replicate from "replicate";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

// 👇 Accept either env var name (works on Vercel and locally)
const REPLICATE_AUTH =
  process.env.REPLICATE_API_KEY || process.env.REPLICATE_API_TOKEN;

const replicate = new Replicate({
  auth: REPLICATE_AUTH as string,
});

const MODEL =
  "fofr/sticker-maker:4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a";

// Convert Replicate binary output to a data URL we can send to the browser
async function toDataUrl(
  output: any,
  mime: "image/webp" | "image/png" = "image/webp"
): Promise<string | null> {
  if (!output) return null;

  // Helper: web ReadableStream -> Buffer
  const streamToBuffer = async (stream: ReadableStream) => {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    // @ts-ignore - Buffer exists in Node runtime
    return Buffer.concat(chunks);
  };

  const toBuffer = async (val: any) => {
    if (!val) return null;
    // If it's already a Buffer/Uint8Array
    if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(val)) return val;
    if (val instanceof Uint8Array) {
      // @ts-ignore
      return Buffer.from(val);
    }
    // ArrayBuffer
    if (typeof ArrayBuffer !== "undefined" && val instanceof ArrayBuffer) {
      // @ts-ignore
      return Buffer.from(new Uint8Array(val));
    }
    // Blob (rare in Node here, but handle anyway)
    if (typeof Blob !== "undefined" && val instanceof Blob) {
      const ab = await val.arrayBuffer();
      // @ts-ignore
      return Buffer.from(new Uint8Array(ab));
    }
    // ReadableStream (what you're seeing)
    if (val && typeof (val as any).getReader === "function") {
      return await streamToBuffer(val as ReadableStream);
    }
    return null;
  };

  // Many Replicate models return an array; take first item
  const first = Array.isArray(output) ? output[0] : output;

  const buf = await toBuffer(first);
  if (!buf) return null;

  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

export async function POST(request: Request) {
  // Fail fast if token is missing on the server (Vercel env misconfig etc.)
  if (!REPLICATE_AUTH) {
    return NextResponse.json(
      {
        error:
          "Server is missing Replicate credentials. Set REPLICATE_API_KEY or REPLICATE_API_TOKEN in your environment.",
      },
      { status: 500 }
    );
  }

  try {
    const { prompt, width, height, seed, negativePrompt } =
      (await request.json()) as {
        prompt?: string;
        width?: number;
        height?: number;
        seed?: number;
        negativePrompt?: string;
      };

    const output = await replicate.run(MODEL, {
      input: {
        prompt: prompt ?? "a cute cyber cat sticker",
        negative_prompt:
          negativePrompt ??
          "blurry, low quality, deformed, disfigured, distorted, ugly, out of frame, too many fingers, long neck, ugly eyes, bad anatomy",
        width: width ?? 1152,
        height: height ?? 1152,
        steps: 17,
        output_format: "webp",
        output_quality: 100,
        seed: seed ?? undefined,
      },
    });

    const dataUrl = await toDataUrl(output, "image/webp");
    if (!dataUrl) {
      console.error("Unexpected Replicate output shape:", output);
      return NextResponse.json(
        { error: "Unexpected output from model." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: dataUrl });
  } catch (err: any) {
    const status = err?.response?.status || err?.status;

    let msg =
      err?.error?.message ||
      err?.response?.statusText ||
      err?.message ||
      "Unknown error calling Replicate";

    if (status === 401) {
      msg =
        "Unauthorized from Replicate. Double-check REPLICATE_API_KEY / REPLICATE_API_TOKEN in Vercel.";
    } else if (status === 402) {
      msg =
        "Insufficient credit on Replicate. Add credit at replicate.com/account/billing, then try again.";
    } else if (status === 429) {
      msg =
        "Rate limited. Wait a few seconds and try again (limit without payment method).";
    }

    console.error("Replicate error:", { status, msg, raw: err });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
