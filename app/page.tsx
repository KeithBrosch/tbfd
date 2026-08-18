"use client";

import { useEffect, useState } from "react";
import LeagueForm from "@/components/LeagueForm";
import LeagueInfo from "@/components/LeagueInfo";
import { ComprehensiveLeagueData, getLastLeagueData } from "@/lib/sleeper";

export default function Home() {
  const [leagueData, setLeagueData] = useState<ComprehensiveLeagueData | null>(
    null,
  );

  useEffect(() => {
    const savedLeagueData = getLastLeagueData();
    if (savedLeagueData) {
      setLeagueData(savedLeagueData);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col py-12 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-full text-sm font-semibold text-blue-300 backdrop-blur-sm">
              Dynasty Football Intelligence
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Sleeper League Finder
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Instantly access comprehensive league data, team standings, and
            ownership details
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="flex items-start justify-center">
              <LeagueForm onLeagueLoaded={setLeagueData} />
            </div>

            {/* Info Section */}
            {leagueData && (
              <div className="flex items-start justify-center">
                <LeagueInfo data={leagueData} />
              </div>
            )}

            {/* Empty State */}
            {!leagueData && (
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-slate-400 text-lg">
                    Enter a league ID to see details
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Rosters • Standings • League Settings
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto text-center text-sm text-slate-400">
          <p className="mb-3">
            Data is stored in your browser's session storage and cleared when
            you close the browser.
          </p>
          <p>
            <a
              href="https://docs.sleeper.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Sleeper API Docs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
