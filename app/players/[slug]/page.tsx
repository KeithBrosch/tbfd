import Link from "next/link";
import { notFound } from "next/navigation";
import { scrapeKeepTradeCutPlayer } from "@/lib/keepTradeCut";

interface PlayerPageProps {
  params: Promise<{ slug: string }>;
}

function historyPoints(value: unknown): Array<{ date: string; value: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((point) => {
    if (typeof point !== "object" || point === null) return [];
    const record = point as Record<string, unknown>;
    const numericValue = typeof record.v === "number" ? record.v : record.value;
    if (typeof numericValue !== "number") return [];
    return [
      {
        date:
          typeof record.d === "string" ? record.d : String(record.date ?? ""),
        value: numericValue,
      },
    ];
  });
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { slug } = await params;
  let player;

  try {
    player = await scrapeKeepTradeCutPlayer(slug);
  } catch {
    notFound();
  }

  const valueHistory = historyPoints(player!.history.overallValue);
  const maxValue = Math.max(
    ...valueHistory.map((point) => point.value ?? 0),
    player!.value ?? 0,
    1,
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          <span aria-hidden="true">←</span> Back to league
        </Link>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 p-6 md:p-10">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  KeepTradeCut profile
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                  {player!.name}
                </h1>
                <p className="mt-3 text-slate-300">
                  {player!.team || "Free agent"} · {player!.position || "-"} ·
                  Age {player!.age ?? "-"}
                </p>
              </div>
              <a
                href={player!.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer rounded-full border border-cyan-300/40 px-4 py-2 text-center text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/10"
              >
                Open KTC profile
              </a>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-4 md:p-10">
            {[
              ["Dynasty value", player!.value ?? "-"],
              ["Overall rank", player!.rank ?? "-"],
              [
                "Positional rank",
                `${player!.position ?? ""}${player!.positionalRank ?? "-"}`,
              ],
              ["History points", valueHistory.length],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-xl backdrop-blur md:p-10">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Historical trend
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Dynasty value over time
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              {valueHistory.length} observations
            </p>
          </div>

          {valueHistory.length > 0 ? (
            <div className="flex h-64 items-end gap-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              {valueHistory.slice(-120).map((point, index) => {
                const value = point.value;
                return (
                  <div
                    key={`${point.date ?? "point"}-${index}`}
                    title={`${point.date ?? ""} ${value}`}
                    className="min-w-[3px] flex-1 cursor-crosshair rounded-t bg-gradient-to-t from-cyan-500 to-blue-300 transition hover:from-amber-400 hover:to-yellow-200"
                    style={{
                      height: `${Math.max((value / maxValue) * 100, 2)}%`,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
              Historical trend data is not available for this player.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
