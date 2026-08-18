import { ComprehensiveLeagueData, getPlayerName } from "./sleeper";

const KTC_RANKINGS_URL = "https://keeptradecut.com/dynasty-rankings";
const PAGE_SIZE = 50;
const MAX_PAGES = 100;

export interface KeepTradeCutPlayer {
  name: string;
  age: number | null;
  value: number;
  rank: number | null;
  positionalRank: number | null;
  position: string | null;
  url: string;
}

export interface PlayerValueMatch {
  sleeperPlayerId: string;
  sleeperName: string;
  ktcName: string | null;
  ktcUrl: string | null;
  value: number | null;
  positionalRank: number | null;
  age: number | null;
  confidence: "exact" | "fuzzy" | "unmatched";
}

export interface KeepTradeCutResult {
  players: KeepTradeCutPlayer[];
  matches: Record<string, PlayerValueMatch>;
}

export interface KeepTradeCutPlayerDetail {
  name: string;
  age: number | null;
  position: string | null;
  team: string | null;
  value: number | null;
  rank: number | null;
  positionalRank: number | null;
  profileUrl: string;
  history: {
    overallValue: unknown;
    overallRank: unknown;
    positionalRank: unknown;
  };
  metadata: Record<string, unknown>;
}

interface EmbeddedKtcPlayer {
  playerName: string;
  slug: string;
  position: string;
  age: number;
  superflexValues?: {
    value?: number;
    rank?: number;
    positionalRank?: number;
  };
}

function extractJsonObject(html: string, variableName: string): Record<string, unknown> | null {
  const assignment = html.indexOf(`var ${variableName} =`);
  if (assignment < 0) return null;

  const start = html.indexOf("{", assignment);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      return JSON.parse(html.slice(start, index + 1)) as Record<string, unknown>;
    }
  }
  return null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function scrapeKeepTradeCutPlayer(
  slug: string
): Promise<KeepTradeCutPlayerDetail> {
  if (!/^[a-z0-9-]+$/i.test(slug)) {
    throw new Error("Invalid KeepTradeCut player slug");
  }

  const profileUrl = `${KTC_RANKINGS_URL}/players/${slug}`;
  const response = await fetch(profileUrl, {
    headers: { "User-Agent": "Mozilla/5.0 dynasty-league-value-tool" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`KeepTradeCut returned ${response.status}`);
  }

  const html = await response.text();
  const player = extractJsonObject(html, "player");
  const playerSuperflex = extractJsonObject(html, "playerSuperflex");
  if (!player) throw new Error("Player profile data was not found");

  return {
    name: typeof player.playerName === "string" ? player.playerName : slug,
    age: numberValue(player.age),
    position: typeof player.position === "string" ? player.position : null,
    team: typeof player.team === "string" ? player.team : null,
    value: numberValue((player.superflexValues as Record<string, unknown> | undefined)?.value),
    rank: numberValue((player.superflexValues as Record<string, unknown> | undefined)?.rank),
    positionalRank: numberValue((player.superflexValues as Record<string, unknown> | undefined)?.positionalRank),
    profileUrl,
    history: {
      overallValue: playerSuperflex?.overallValue ?? [],
      overallRank: playerSuperflex?.overallRankHistory ?? [],
      positionalRank: playerSuperflex?.positionalRankHistory ?? [],
    },
    metadata: { player, playerSuperflex },
  };
}

type KtcRankingParser = "embedded" | "embedded-fallback" | "html-rows";

function extractJsonArray(html: string, start: number): unknown[] | null {
  const arrayStart = html.indexOf("[", start);
  if (arrayStart < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < html.length; index += 1) {
    const character = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]" && --depth === 0) {
      try {
        return JSON.parse(html.slice(arrayStart, index + 1)) as unknown[];
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toKtcPlayers(value: unknown): KeepTradeCutPlayer[] {
  if (!Array.isArray(value)) return [];
  const embeddedPlayers = value as EmbeddedKtcPlayer[];
  return embeddedPlayers.flatMap((player) => {
    const value = player.superflexValues?.value;
    if (
      !player.playerName ||
      value === undefined ||
      !["QB", "WR", "RB", "TE"].includes(player.position)
    ) {
      return [];
    }

    return [{
      name: player.playerName,
      age: Number.isFinite(player.age) ? player.age : null,
      value,
      rank: player.superflexValues?.rank ?? null,
      positionalRank: player.superflexValues?.positionalRank ?? null,
      position: player.position || null,
      url: `${KTC_RANKINGS_URL}/players/${player.slug}`,
    }];
  });
}

function parseEmbeddedPlayers(html: string): KeepTradeCutPlayer[] {
  const assignment = html.search(/(?:var|const|let)\s+playersArray\s*=/);
  if (assignment < 0) return [];
  return toKtcPlayers(extractJsonArray(html, assignment));
}

function parseEmbeddedFallback(html: string): KeepTradeCutPlayer[] {
  const assignments = /(?:var|const|let)\s+([A-Za-z0-9_$]*(?:player|rank|data)[A-Za-z0-9_$]*)\s*=\s*\[/gi;
  let match: RegExpExecArray | null;
  while ((match = assignments.exec(html))) {
    const players = toKtcPlayers(extractJsonArray(html, match.index));
    if (players.length > 0) return players;
  }
  return [];
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHtmlRows(html: string): KeepTradeCutPlayer[] {
  const players: KeepTradeCutPlayer[] = [];
  const links = /<a\b[^>]*href=["']([^"']*\/dynasty-rankings\/players\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = links.exec(html))) {
    const context = html.slice(Math.max(0, match.index - 1200), match.index + 2200);
    if (!/rank-number|class=["'][^"']*value/i.test(context)) continue;

    const valueMatch = context.match(/class=["'][^"']*value[^"']*[\s\S]*?<p[^>]*>\s*(\d{2,5})/i);
    const ageMatch = context.match(/(\d+(?:\.\d+)?)\s*y\.o\./i);
    const positionMatch = context.match(/\b(QB|RB|WR|TE)\d*\b/i);
    const rankMatch = context.match(/rank-number[\s\S]*?<p[^>]*>\s*(\d+)/i);
    if (!valueMatch) continue;

    const href = new URL(match[1], KTC_RANKINGS_URL).toString();
    players.push({
      name: decodeHtml(match[2]),
      age: ageMatch ? Number(ageMatch[1]) : null,
      value: Number(valueMatch[1]),
      rank: rankMatch ? Number(rankMatch[1]) : null,
      positionalRank: null,
      position: positionMatch?.[1] ?? null,
      url: href,
    });
  }
  return players;
}

function detectRankingParser(html: string): KtcRankingParser | null {
  if (parseEmbeddedPlayers(html).length > 0) return "embedded";
  if (parseEmbeddedFallback(html).length > 0) return "embedded-fallback";
  if (parseHtmlRows(html).length > 0) return "html-rows";
  return null;
}

function parseRankingPage(html: string, parser: KtcRankingParser): KeepTradeCutPlayer[] {
  if (parser === "embedded") return parseEmbeddedPlayers(html);
  if (parser === "embedded-fallback") return parseEmbeddedFallback(html);
  return parseHtmlRows(html);
}

export async function scrapeKeepTradeCut(
  filters = "QB|WR|RB|TE"
): Promise<KeepTradeCutPlayer[]> {
  const players: KeepTradeCutPlayer[] = [];
  const seenUrls = new Set<string>();
  let parser: KtcRankingParser | null = null;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = `${KTC_RANKINGS_URL}?page=${page}&filters=${encodeURIComponent(filters)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 dynasty-league-value-tool" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`KeepTradeCut returned ${response.status} for page ${page}`);
    }

    const html = await response.text();
    parser ??= detectRankingParser(html);
    if (!parser) throw new Error("KeepTradeCut ranking format was not recognized");

    let pagePlayers = parseRankingPage(html, parser);
    if (pagePlayers.length === 0) {
      const fallbackParser = detectRankingParser(html);
      if (fallbackParser && fallbackParser !== parser) {
        parser = fallbackParser;
        pagePlayers = parseRankingPage(html, parser);
      }
    }

    pagePlayers = pagePlayers
      .filter((player) => !seenUrls.has(player.url));

    if (pagePlayers.length === 0) break;
    pagePlayers.forEach((player) => seenUrls.add(player.url));
    players.push(...pagePlayers);

    if (pagePlayers.length < PAGE_SIZE) break;
  }

  return players;
}

export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.'’`]/g, "")
    .replace(/[-_]/g, " ")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function findKtcPlayer(name: string, players: KeepTradeCutPlayer[]) {
  const normalized = normalizePlayerName(name);
  const exact = players.find((player) => normalizePlayerName(player.name) === normalized);
  if (exact) return { player: exact, confidence: "exact" as const };

  const candidates = players
    .map((player) => ({ player, distance: levenshtein(normalized, normalizePlayerName(player.name)) }))
    .filter(({ player, distance }) => {
      const candidate = normalizePlayerName(player.name);
      return distance <= Math.max(1, Math.floor(normalized.length * 0.16)) && candidate.split(" ").length === normalized.split(" ").length;
    })
    .sort((left, right) => left.distance - right.distance);

  return candidates[0]
    ? { player: candidates[0].player, confidence: "fuzzy" as const }
    : null;
}

export function mapKeepTradeCutValues(
  leagueData: ComprehensiveLeagueData,
  ktcPlayers: KeepTradeCutPlayer[]
): Record<string, PlayerValueMatch> {
  return Object.fromEntries(
    Object.entries(leagueData.players).map(([sleeperPlayerId, player]) => {
      const sleeperName = getPlayerName(player);
      const match = findKtcPlayer(sleeperName, ktcPlayers);
      return [
        sleeperPlayerId,
        {
          sleeperPlayerId,
          sleeperName,
          ktcName: match?.player.name ?? null,
          ktcUrl: match?.player.url ?? null,
          value: match?.player.value ?? null,
          positionalRank: match?.player.positionalRank ?? null,
          age: match?.player.age ?? null,
          confidence: match?.confidence ?? "unmatched",
        },
      ];
    })
  );
}

export async function scrapeAndMapKeepTradeCut(
  leagueData: ComprehensiveLeagueData
): Promise<KeepTradeCutResult> {
  const players = await scrapeKeepTradeCut();
  return { players, matches: mapKeepTradeCutValues(leagueData, players) };
}
