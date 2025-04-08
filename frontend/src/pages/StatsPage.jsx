import React, { useEffect, useState } from "react";
import { getStats } from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StatsPage() {
  // State variables for stats
  const [overallStats, setOverallStats] = useState(null);
  const [cumulativeGrowth, setCumulativeGrowth] = useState([]);
  const [gradedWordRuns, setGradedWordRuns] = useState([]);
  const [gradedConjRuns, setGradedConjRuns] = useState([]);
  const [ungradedWordRuns, setUngradedWordRuns] = useState([]);
  const [ungradedConjRuns, setUngradedConjRuns] = useState([]);
  const [bestWords, setBestWords] = useState([]);
  const [worstWords, setWorstWords] = useState([]);
  const [bestConjugations, setBestConjugations] = useState([]);
  const [worstConjugations, setWorstConjugations] = useState([]);

  // Date range: "all", "week", or "month"
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const data = await getStats(dateRange);
      setOverallStats(data.overallStats);
      setCumulativeGrowth(data.cumulativeGrowth);
      setGradedWordRuns(data.gradedWordRuns);
      setGradedConjRuns(data.gradedConjRuns);
      setUngradedWordRuns(data.ungradedWordRuns);
      setUngradedConjRuns(data.ungradedConjRuns);
      setBestWords(data.bestWords);
      setWorstWords(data.worstWords);
      setBestConjugations(data.bestConjugations);
      setWorstConjugations(data.worstConjugations);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // 1) Build chart data for graded runs (accuracy).
  //    We'll pass a color scheme in the arguments so we can reuse this function.
  const buildAccuracyChartData = (runs, label, borderColor, bgColor) => {
    const labels = runs.map((run) =>
      new Date(run.run_date).toLocaleDateString()
    );
    return {
      labels,
      datasets: [
        {
          label,
          data: runs.map((run) => run.accuracy),
          tension: 0.2,
          borderWidth: 2,
          borderColor,
          backgroundColor: bgColor,
        },
      ],
    };
  };

  // 2) Build chart data for ungraded runs (score/time).
  const buildUngradedChartData = (runs, label, borderColor, bgColor) => {
    const labels = runs.map((run) =>
      new Date(run.run_date).toLocaleDateString()
    );
    return {
      labels,
      datasets: [
        {
          label,
          data: runs.map((run) => run.ratio),
          tension: 0.2,
          borderWidth: 2,
          borderColor,
          backgroundColor: bgColor,
        },
      ],
    };
  };

  // 3) Build chart data for cumulative growth (words vs conjugations).
  const buildGrowthChartData = (growth) => {
    const labels = growth.map((g) => g.date);
    return {
      labels,
      datasets: [
        {
          label: "Cumulative Words Added",
          data: growth.map((g) => g.cumulativeWords),
          tension: 0.2,
          borderWidth: 2,
          borderColor: "rgba(75, 192, 192, 1)", // teal
          backgroundColor: "rgba(75, 192, 192, 0.3)",
        },
        {
          label: "Cumulative Conjugations Added",
          data: growth.map((g) => g.cumulativeConjugations),
          tension: 0.2,
          borderWidth: 2,
          borderColor: "rgba(153, 102, 255, 1)", // purple
          backgroundColor: "rgba(153, 102, 255, 0.3)",
        },
      ],
    };
  };

  // 4) Best/Worst table rendering: show (word/verb), attempts, accuracy.
  const renderTable = (data, title, textColor, isWord) => (
    <table className="w-full border border-gray-700 text-sm">
      <thead className="bg-gray-800">
        <tr>
          <th className="p-2 border border-gray-700">{title}</th>
          <th className="p-2 border border-gray-700">Attempts</th>
          <th className="p-2 border border-gray-700">Accuracy (%)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => {
          const label = isWord ? item.word : item.verb;
          return (
            <tr
              key={idx}
              className={`bg-gray-700 ${textColor} hover:bg-gray-600`}
            >
              <td className="p-2 border border-gray-600">{label}</td>
              <td className="p-2 border border-gray-600">{item.total_attempts}</td>
              <td className="p-2 border border-gray-600">
                {item.accuracy.toFixed(1)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen w-screen flex flex-col items-center bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Your Statistics Dashboard</h1>

      {/* Date Range Controls */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={() => setDateRange("all")}
          className={`px-4 py-2 rounded ${
            dateRange === "all" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => setDateRange("week")}
          className={`px-4 py-2 rounded ${
            dateRange === "week" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          Last Week
        </button>
        <button
          onClick={() => setDateRange("month")}
          className={`px-4 py-2 rounded ${
            dateRange === "month" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          Last Month
        </button>
      </div>

      {/* Overview Stats */}
      {overallStats && (
        <div className="max-w-4xl w-full mb-8 bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Words Added</p>
              <p className="text-2xl">{overallStats.wordsAdded}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Conjugations Added</p>
              <p className="text-2xl">{overallStats.conjugationsAdded}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Word Games Played</p>
              <p className="text-2xl">{overallStats.wordGamesPlayed}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Conjugation Games Played</p>
              <p className="text-2xl">{overallStats.conjugationGamesPlayed}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Avg Accuracy</p>
              <p className="text-2xl">{overallStats.averageAccuracy}%</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold">Most Frequent Format</p>
              <p className="text-2xl">{overallStats.mostFrequentFormat}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cumulative Growth Chart */}
      <div className="max-w-5xl w-full bg-gray-900 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4">Cumulative Growth</h2>
        <div className="h-64">
          <Line
            data={buildGrowthChartData(cumulativeGrowth)}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
      </div>

      {/* Graded Game Accuracy Charts */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Word Game (graded) => blue */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">Word Game Accuracy</h2>
          <div className="h-64">
            <Line
              data={buildAccuracyChartData(
                gradedWordRuns,
                "Word Accuracy (%)",
                "rgba(54, 162, 235, 1)",       // border (blue)
                "rgba(54, 162, 235, 0.3)"     // background
              )}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } },
              }}
            />
          </div>
        </div>
        {/* Conjugation Game (graded) => purple */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">Conjugation Game Accuracy</h2>
          <div className="h-64">
            <Line
              data={buildAccuracyChartData(
                gradedConjRuns,
                "Conjugation Accuracy (%)",
                "rgba(153, 102, 255, 1)",     // border (purple)
                "rgba(153, 102, 255, 0.3)"   // background
              )}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Ungraded Game Score/Time Charts */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Word Game (ungraded) => same blue theme */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">Word Game Ungraded (Score/Time)</h2>
          <div className="h-64">
            <Line
              data={buildUngradedChartData(
                ungradedWordRuns,
                "Word Score/Time Ratio",
                "rgba(54, 162, 235, 1)",
                "rgba(54, 162, 235, 0.3)"
              )}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
        {/* Conjugation Game (ungraded) => purple theme */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">Conjugation Game Ungraded (Score/Time)</h2>
          <div className="h-64">
            <Line
              data={buildUngradedChartData(
                ungradedConjRuns,
                "Conjugation Score/Time Ratio",
                "rgba(153, 102, 255, 1)",
                "rgba(153, 102, 255, 0.3)"
              )}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      {/* Best/Worst Tables */}
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-green-400">Best Words</h3>
          {bestWords.length > 0 ? (
            renderTable(bestWords, "Word", "text-green-400", true)
          ) : (
            <p className="text-gray-400">No data</p>
          )}
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-red-400">Worst Words</h3>
          {worstWords.length > 0 ? (
            renderTable(worstWords, "Word", "text-red-400", true)
          ) : (
            <p className="text-gray-400">No data</p>
          )}
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-green-400">Best Conjugations</h3>
          {bestConjugations.length > 0 ? (
            renderTable(bestConjugations, "Conjugation", "text-green-400", false)
          ) : (
            <p className="text-gray-400">No data</p>
          )}
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-red-400">Worst Conjugations</h3>
          {worstConjugations.length > 0 ? (
            renderTable(worstConjugations, "Conjugation", "text-red-400", false)
          ) : (
            <p className="text-gray-400">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
