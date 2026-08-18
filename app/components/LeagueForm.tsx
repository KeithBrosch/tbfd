"use client";

import { useState, FormEvent } from "react";
import {
  fetchLeagueData,
  saveLeagueData,
  ComprehensiveLeagueData,
} from "@/lib/sleeper";

interface LeagueFormProps {
  onLeagueLoaded?: (data: ComprehensiveLeagueData) => void;
}

export default function LeagueForm({ onLeagueLoaded }: LeagueFormProps) {
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await fetchLeagueData(leagueId);

    if ("message" in result && result.message) {
      // It's an error
      setError(result.message);
      setLoading(false);
      return;
    }

    // It's successful data
    const leagueData = result as ComprehensiveLeagueData;

    try {
      const rosteredPlayerIds = new Set(
        leagueData.rosters.flatMap((roster) => roster.players ?? []),
      );
      const rosteredPlayers = Object.fromEntries(
        [...rosteredPlayerIds]
          .filter((playerId) => leagueData.players[playerId])
          .map((playerId) => [playerId, leagueData.players[playerId]]),
      );
      const ktcResponse = await fetch("/api/keeptradecut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...leagueData, players: rosteredPlayers }),
      });
      const ktcResult = await ktcResponse.json();
      if (!ktcResponse.ok) {
        throw new Error(ktcResult.message || "KeepTradeCut scrape failed");
      }
      leagueData.ktcValues = ktcResult.matches;
    } catch (error) {
      setError(
        error instanceof Error
          ? `League loaded, but KeepTradeCut values failed: ${error.message}`
          : "League loaded, but KeepTradeCut values failed",
      );
    }

    saveLeagueData(leagueId, leagueData);
    setSuccess(true);
    setLeagueId("");

    if (onLeagueLoaded) {
      onLeagueLoaded(leagueData);
    }

    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Find Your League
        </h2>
        <p className="text-gray-600 text-sm mb-8">
          Enter your Sleeper League ID to fetch all available data
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="leagueId"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Sleeper League ID
            </label>
            <input
              id="leagueId"
              type="text"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              placeholder="Paste your league ID here"
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              18-19 digits found at the end of your league URL or in League
              Settings
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !leagueId.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading league data...
              </span>
            ) : (
              "Fetch League Data"
            )}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ League data loaded successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
