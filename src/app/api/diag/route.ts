import { NextResponse } from "next/server";

export async function GET() {
  const rep = (
    process.env.REPLICATE_API_TOKEN ??
    process.env.REPLICATE_API_KEY ??
    ""
  ).trim();
  const openai = (process.env.OPENAI_API_KEY ?? "").trim();

  const result: any = {
    hasReplicate: Boolean(rep),
    replicateLen: rep.length,
    hasOpenAI: Boolean(openai),
    openaiLen: openai.length,
  };

  try {
    // Cheap, read-only request to verify the token works
    const r = await fetch(
      "https://api.replicate.com/v1/models/fofr/sticker-maker",
      {
        headers: {
          Authorization: `Bearer ${rep}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    result.replicateStatus = r.status; // expect 200 if token is valid
    result.replicateOk = r.ok;
  } catch (e: any) {
    result.fetchError = e?.message || String(e);
  }

  return NextResponse.json(result);
}
