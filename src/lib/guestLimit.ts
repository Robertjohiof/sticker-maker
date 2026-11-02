// Guest limits for the public demo, so visitors can't use up the paid API credit.
//
// Limits are ON by default. Set STICKER_LIMITS=off in Vercel to turn them off
// (e.g. when the app is used in production for the business).
//
// Optional env vars:
//   GUEST_DAILY_LIMIT   stickers per visitor per day      (default 3)
//   GLOBAL_DAILY_LIMIT  stickers for all visitors per day (default 25)
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN)
//     Shared counter across all server instances. Without it, counts are kept
//     in memory per instance, which is best-effort only.

type Kind = "generate" | "enhance";

export type LimitResult =
  | { allowed: true; remaining: number | null }
  | { allowed: false; message: string };

const DAY_SECONDS = 60 * 60 * 24;

const limitsEnabled = () =>
  (process.env.STICKER_LIMITS ?? "on").toLowerCase() !== "off";

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// Prompt enhancing is much cheaper than generating, so it gets more tries
function limitsFor(kind: Kind) {
  const perVisitor = numberFromEnv("GUEST_DAILY_LIMIT", 3);
  const global = numberFromEnv("GLOBAL_DAILY_LIMIT", 25);
  return kind === "generate"
    ? { perVisitor, global }
    : { perVisitor: perVisitor * 3, global: global * 3 };
}

function visitorIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// --- Counter storage ---------------------------------------------------------

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function incrementRedis(keys: string[]): Promise<number[]> {
  const commands = keys.flatMap((key) => [
    ["INCR", key],
    ["EXPIRE", key, String(DAY_SECONDS), "NX"],
  ]);
  const response = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}` },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Redis error ${response.status}`);
  const results = (await response.json()) as { result: number }[];
  return keys.map((_, i) => Number(results[i * 2].result));
}

const memoryCounts = new Map<string, number>();

function incrementMemory(keys: string[]): number[] {
  // Keep the map from growing forever: drop counters from previous days
  const today = new Date().toISOString().slice(0, 10);
  for (const key of memoryCounts.keys()) {
    if (!key.includes(today)) memoryCounts.delete(key);
  }
  return keys.map((key) => {
    const next = (memoryCounts.get(key) ?? 0) + 1;
    memoryCounts.set(key, next);
    return next;
  });
}

async function increment(keys: string[]): Promise<number[]> {
  if (redisUrl && redisToken) {
    try {
      return await incrementRedis(keys);
    } catch (err) {
      console.error("Guest limit: Redis unavailable, using memory", err);
    }
  }
  return incrementMemory(keys);
}

// --- Public API ----------------------------------------------------------------

export async function checkGuestLimit(
  request: Request,
  kind: Kind
): Promise<LimitResult> {
  if (!limitsEnabled()) return { allowed: true, remaining: null };

  const day = new Date().toISOString().slice(0, 10);
  const { perVisitor, global } = limitsFor(kind);
  const [visitorCount, globalCount] = await increment([
    `sticker:${kind}:${day}:ip:${visitorIp(request)}`,
    `sticker:${kind}:${day}:all`,
  ]);

  if (globalCount > global) {
    return {
      allowed: false,
      message:
        "The demo has reached today's limit for all visitors. Please try again tomorrow.",
    };
  }
  if (visitorCount > perVisitor) {
    return {
      allowed: false,
      message:
        kind === "generate"
          ? `This is a demo, limited to ${perVisitor} stickers per visitor per day. Please come back tomorrow.`
          : `You've used today's ${perVisitor} prompt enhancements. Please come back tomorrow.`,
    };
  }
  return { allowed: true, remaining: perVisitor - visitorCount };
}
