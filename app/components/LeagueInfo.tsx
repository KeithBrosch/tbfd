"use client";

import { ComprehensiveLeagueData } from "@/lib/sleeper";
import PlayerRoster from "./PlayerRoster";

interface LeagueInfoProps {
  data: ComprehensiveLeagueData;
}

export default function LeagueInfo({ data }: LeagueInfoProps) {
  const { league, rosters, users } = data;

  return (
    <div className="w-full space-y-6">
      {/* League Header Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            {league.name}
          </h2>
          <p className="text-gray-600 text-sm">Season {league.season}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Total Teams
            </p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {league.total_rosters}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Season
            </p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">
              {league.season}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Status
            </p>
            <p className="text-xl font-bold text-green-900 mt-1 capitalize">
              {league.status}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
              ID
            </p>
            <p className="text-lg font-mono text-purple-900 mt-1 truncate">
              {league.league_id}
            </p>
          </div>
        </div>
      </div>

      {/* Player Rosters Section */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        <PlayerRoster data={data} />
      </div>

      {/* Data Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-blue-600">
            ✓ Data saved to session storage
          </span>
          <br />
          Your league data is cached for this browser session. It will be
          cleared when you close the browser.
        </p>
      </div>
    </div>
  );
}
