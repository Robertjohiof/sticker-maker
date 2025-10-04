import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt, styles } = (await req.json()) as {
      prompt?: string;
      styles?: string[];
    };

    const styleText =
      styles && styles.length ? `Style tags: ${styles.join(", ")}.` : "";

    const system =
      "You rewrite user prompts for an AI *sticker* generator. " +
      "Return a single improved prompt string, concise (< 40 words), vivid, and safe. " +
      "Prefer: subject, pose, simple composition, clean white outline, transparent background, high quality. " +
      "Avoid: brand names, watermarks, text overlays, gore, NSFW.";

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Rewrite this into a better sticker prompt.\n${styleText}\n\nPrompt: ${
            prompt ?? ""
          }`,
        },
      ],
    });

    const improved = resp.choices[0]?.message?.content?.trim();
    if (!improved) throw new Error("No suggestion produced");

    return NextResponse.json({ prompt: improved });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Prompt helper failed" },
      { status: 500 }
    );
  }
}
