"use client";

import { useState } from "react";
import { ComprehensiveLeagueData, getPlayerName } from "@/lib/sleeper";

interface PlayerRosterProps {
  data: ComprehensiveLeagueData;
}

export default function PlayerRoster({ data }: PlayerRosterProps) {
  const { rosters, users, players, ktcValues } = data;
  const [expandedRosterId, setExpandedRosterId] = useState<number | null>(null);

  const getPositionColor = (position?: string): string => {
    switch (position) {
      case "QB":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "RB":
        return "bg-green-100 text-green-800 border-green-300";
      case "WR":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "TE":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "K":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "DEF":
      case "D/ST":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Team Rosters</h3>

      <div className="space-y-3">
        {rosters.map((roster, rosterIndex) => {
          const owner = users[roster.owner_id];
          const isExpanded = expandedRosterId === roster.roster_id;
          const rosterPlayers = roster.players || [];
          const playerCount = rosterPlayers.length;

          return (
            <div
              key={roster.roster_id}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              <button
                onClick={() =>
                  setExpandedRosterId(isExpanded ? null : roster.roster_id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {rosterIndex + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {owner?.display_name || `Team ${roster.roster_id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {playerCount} players • {roster.wins || 0}W-
                      {roster.losses || 0}L
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {roster.fpts !== undefined && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">
                        {roster.fpts.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">PF</p>
                    </div>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {rosterPlayers.length > 0 ? (
                    <div className="grid gap-2">
                      {rosterPlayers.map((playerId) => {
                        const player = players[playerId];
                        if (!player) return null;

                        const playerName = getPlayerName(player);
                        const position = player.position || "N/A";
                        const team = player.team || player.nfl_team || "FA";
                        const ktcMatch = ktcValues?.[playerId];
                        const playerHref = ktcMatch?.ktcUrl
                          ? `/players/${ktcMatch.ktcUrl.split("/").pop()}`
                          : null;

                        return (
                          <div
                            key={playerId}
                            role={playerHref ? "link" : undefined}
                            tabIndex={playerHref ? 0 : undefined}
                            onClick={() => {
                              if (playerHref) window.location.href = playerHref;
                            }}
                            onKeyDown={(event) => {
                              if (
                                playerHref &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                window.location.href = playerHref;
                              }
                            }}
                            className={`flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 ${
                              playerHref
                                ? "cursor-pointer transition hover:border-blue-300 hover:shadow-md"
                                : ""
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`font-medium text-gray-800 text-sm ${playerHref ? "hover:text-blue-600" : ""}`}
                                >
                                  {playerName}
                                </p>
                                {ktcMatch?.value !== null &&
                                  ktcMatch?.value !== undefined && (
                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                      KTC {ktcMatch.value}
                                    </span>
                                  )}
                                {ktcMatch?.positionalRank !== null &&
                                  ktcMatch?.positionalRank !== undefined && (
                                    <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
                                      {position}
                                      {ktcMatch.positionalRank}
                                    </span>
                                  )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {team} • {position}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPositionColor(
                                  position,
                                )}`}
                              >
                                {position}
                              </span>
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                                {team}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No players on roster
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
