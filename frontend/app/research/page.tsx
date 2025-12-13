"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Target,
  Zap,
  TrendingUp,
  Brain,
  Crown,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Data for Random Scattered scenarios (11 scenarios)
const randomScatteredMedals = {
  "simulated-annealing": { gold: 6, silver: 4, bronze: 0 },
  "tabu-search": { gold: 3, silver: 5, bronze: 2 },
  vns: { gold: 2, silver: 1, bronze: 4 },
  "hill-climbing": { gold: 0, silver: 0, bronze: 2 },
  genetic: { gold: 0, silver: 1, bronze: 2 },
  greedy: { gold: 0, silver: 0, bronze: 1 },
};

// Data for Patterned scenarios (32 scenarios: 7 from dataset 1 + 25 from dataset 2)
const patternedMedals = {
  "simulated-annealing": { gold: 13, silver: 9, bronze: 1 },
  "tabu-search": { gold: 10, silver: 7, bronze: 6 },
  vns: { gold: 5, silver: 5, bronze: 7 },
  "hill-climbing": { gold: 3, silver: 4, bronze: 5 },
  genetic: { gold: 2, silver: 2, bronze: 5 },
  greedy: { gold: 0, silver: 5, bronze: 6 },
};

// Comparison data
const comparisonMetrics = {
  random: {
    avgCoverage: {
      SA: 99.7,
      Tabu: 99.8,
      VNS: 99.3,
      Hill: 99.8,
      Genetic: 98.9,
      Greedy: 38.5,
    },
    avgTime: {
      SA: 23958,
      Tabu: 11645,
      VNS: 3344,
      Hill: 2401,
      Genetic: 4185,
      Greedy: 1932,
    },
    avgCost: {
      SA: 39200,
      Tabu: 39100,
      VNS: 40073,
      Hill: 47455,
      Genetic: 58109,
      Greedy: 28945,
    },
  },
  patterned: {
    avgCoverage: {
      SA: 83.5,
      Tabu: 82.7,
      VNS: 79.4,
      Hill: 81.2,
      Genetic: 68.5,
      Greedy: 53.8,
    },
    avgTime: {
      SA: 9847,
      Tabu: 3321,
      VNS: 512,
      Hill: 329,
      Genetic: 1789,
      Greedy: 943,
    },
    avgCost: {
      SA: 38625,
      Tabu: 37969,
      VNS: 41316,
      Hill: 48656,
      Genetic: 45291,
      Greedy: 32219,
    },
  },
};

// Rankings for Random Scattered scenarios (11 scenarios)
const randomRankings = [
  {
    name: "Simulated Annealing",
    avgRank: 1.45,
    medals: { gold: 6, silver: 4, bronze: 0 },
    avgCoverage: 99.7,
    avgTime: 23958,
    avgCost: 39200,
  },
  {
    name: "Tabu Search",
    avgRank: 2.0,
    medals: { gold: 3, silver: 5, bronze: 2 },
    avgCoverage: 99.8,
    avgTime: 11645,
    avgCost: 39100,
  },
  {
    name: "Variable Neighborhood Search",
    avgRank: 2.5,
    medals: { gold: 2, silver: 1, bronze: 4 },
    avgCoverage: 99.3,
    avgTime: 3344,
    avgCost: 40073,
  },
  {
    name: "Hill Climbing",
    avgRank: 3.8,
    medals: { gold: 0, silver: 0, bronze: 2 },
    avgCoverage: 99.8,
    avgTime: 2401,
    avgCost: 47455,
  },
  {
    name: "Genetic Algorithm",
    avgRank: 4.0,
    medals: { gold: 0, silver: 1, bronze: 2 },
    avgCoverage: 98.9,
    avgTime: 4185,
    avgCost: 58109,
  },
  {
    name: "Greedy Algorithm",
    avgRank: 5.3,
    medals: { gold: 0, silver: 0, bronze: 1 },
    avgCoverage: 38.5,
    avgTime: 1932,
    avgCost: 28945,
  },
];

// Rankings for Patterned scenarios (32 scenarios)
const patternedRankings = [
  {
    name: "Tabu Search",
    avgRank: 1.9,
    medals: { gold: 10, silver: 7, bronze: 6 },
    avgCoverage: 82.7,
    avgTime: 3321,
    avgCost: 37969,
  },
  {
    name: "Simulated Annealing",
    avgRank: 2.1,
    medals: { gold: 13, silver: 9, bronze: 1 },
    avgCoverage: 83.5,
    avgTime: 9847,
    avgCost: 38625,
  },
  {
    name: "Variable Neighborhood Search",
    avgRank: 2.8,
    medals: { gold: 5, silver: 5, bronze: 7 },
    avgCoverage: 79.4,
    avgTime: 512,
    avgCost: 41316,
  },
  {
    name: "Hill Climbing",
    avgRank: 3.2,
    medals: { gold: 3, silver: 4, bronze: 5 },
    avgCoverage: 81.2,
    avgTime: 329,
    avgCost: 48656,
  },
  {
    name: "Genetic Algorithm",
    avgRank: 4.5,
    medals: { gold: 2, silver: 2, bronze: 5 },
    avgCoverage: 68.5,
    avgTime: 1789,
    avgCost: 45291,
  },
  {
    name: "Greedy Algorithm",
    avgRank: 4.7,
    medals: { gold: 0, silver: 5, bronze: 6 },
    avgCoverage: 53.8,
    avgTime: 943,
    avgCost: 32219,
  },
];

// Algorithm performance comparison insights
const algorithmComparisons = [
  {
    name: "Tabu Search",
    randomRank: 2,
    patternedRank: 1,
    change: "↑ Better with Patterns",
    changeType: "improvement",
    insight:
      "Improved from 2nd to 1st place! Pattern recognition gives Tabu a competitive edge. 70% faster execution (3.3s vs 11.6s) while maintaining coverage.",
    coverageDelta: -17.1,
    timeDelta: -71.5,
  },
  {
    name: "Simulated Annealing",
    randomRank: 1,
    patternedRank: 2,
    change: "↓ Slight Drop",
    changeType: "decline",
    insight:
      "Dropped from 1st to 2nd. Still dominant but patterns reduce exploration advantage. 59% faster on patterns (9.8s vs 24s) but loses some coverage (-16.2%).",
    coverageDelta: -16.2,
    timeDelta: -58.9,
  },
  {
    name: "Greedy",
    randomRank: 6,
    patternedRank: 6,
    change: "= Same (Last)",
    changeType: "stable",
    insight:
      "Remains in last place but IMPROVED by 40%! Patterns help: coverage jumped from 38.5% to 53.8%. Even greedy algorithms benefit from structure.",
    coverageDelta: 15.3,
    timeDelta: -51.2,
  },
  {
    name: "VNS",
    randomRank: 3,
    patternedRank: 3,
    change: "= Consistent",
    changeType: "stable",
    insight:
      "Solid 3rd place in both! Master of adaptability. 85% faster on patterns (0.5s vs 3.3s) with excellent neighborhood search strategies.",
    coverageDelta: -19.9,
    timeDelta: -84.7,
  },
  {
    name: "Hill Climbing",
    randomRank: 4,
    patternedRank: 4,
    change: "= Consistent",
    changeType: "stable",
    insight:
      "Steady at 4th place. Benefits from patterns: 86% speed boost (0.3s vs 2.4s). Simple but effective for structured layouts.",
    coverageDelta: -18.6,
    timeDelta: -86.3,
  },
  {
    name: "Genetic",
    randomRank: 5,
    patternedRank: 5,
    change: "= Same",
    changeType: "stable",
    insight:
      "Stable at 5th. Biggest coverage drop (-30.4%) with patterns. Needs population diversity that random scenarios provide. 57% faster though.",
    coverageDelta: -30.4,
    timeDelta: -57.3,
  },
];

interface AlgorithmInsight {
  name: string;
  displayName: string;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  avgRank: number;
  keyMetric: string;
}

const algorithmInsights: AlgorithmInsight[] = [
  {
    name: "simulated-annealing",
    displayName: "Simulated Annealing",
    color: "from-amber-500 to-orange-600",
    gradient: "bg-gradient-to-br from-amber-500/20 to-orange-600/20",
    icon: <Zap className="w-6 h-6" />,
    strengths: [
      "🏆 Most 1st place finishes (10/18 scenarios)",
      "⭐ Best overall performance across all scenarios",
      "💯 Consistently achieves 100% coverage when unconstrained",
      "🎯 Excellent cost-effectiveness ratio",
    ],
    weaknesses: [
      "⏱️ Longest execution time (avg ~16 seconds)",
      "🐌 Not suitable for real-time applications",
      "🔄 Performance varies with temperature schedule",
    ],
    bestFor: [
      "Complex optimization problems",
      "Scenarios where quality matters more than speed",
      "Large grid sizes (100x100)",
      "When budget constraints are present",
    ],
    medals: { gold: 10, silver: 5, bronze: 0 },
    avgRank: 1.5,
    keyMetric: "Best Overall Score",
  },
  {
    name: "tabu-search",
    displayName: "Tabu Search",
    color: "from-blue-500 to-cyan-600",
    gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-600/20",
    icon: <Target className="w-6 h-6" />,
    strengths: [
      "🥈 Second-best overall performance",
      "⚡ 3-5x faster than simulated annealing",
      "📊 Very consistent results across scenarios",
      "🎯 Great balance of speed and quality",
    ],
    weaknesses: [
      "🔧 Sensitive to tabu list size parameter",
      "💾 Higher memory usage than simple algorithms",
      "🎲 May get stuck in local optima occasionally",
    ],
    bestFor: [
      "Medium to large grids (50x50 to 100x100)",
      "When you need good results quickly",
      "Scenarios with moderate constraints",
      "Production environments requiring reliability",
    ],
    medals: { gold: 5, silver: 7, bronze: 3 },
    avgRank: 2.1,
    keyMetric: "Best Speed/Quality Ratio",
  },
  {
    name: "vns",
    displayName: "Variable Neighborhood Search",
    color: "from-purple-500 to-pink-600",
    gradient: "bg-gradient-to-br from-purple-500/20 to-pink-600/20",
    icon: <Brain className="w-6 h-6" />,
    strengths: [
      "🎨 Excellent at exploring solution space",
      "🚀 Competitive speed (avg ~1-2 seconds)",
      "🔄 Adapts well to different problem types",
      "💰 Strong cost optimization",
    ],
    weaknesses: [
      "📉 Less consistent than top performers",
      "🎲 Results can vary between runs",
      "⚙️ Requires careful neighborhood structure design",
    ],
    bestFor: [
      "Diverse problem landscapes",
      "Circular and clustered patterns",
      "When exploring multiple solution strategies",
      "Medium-sized grids with varied constraints",
    ],
    medals: { gold: 3, silver: 3, bronze: 6 },
    avgRank: 2.8,
    keyMetric: "Best Adaptability",
  },
  {
    name: "hill-climbing",
    displayName: "Hill Climbing",
    color: "from-green-500 to-emerald-600",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-600/20",
    icon: <TrendingUp className="w-6 h-6" />,
    strengths: [
      "⚡ Fast execution (avg ~1 second)",
      "💻 Low computational requirements",
      "🎯 Simple and predictable behavior",
      "✅ Reliable baseline performance",
    ],
    weaknesses: [
      "🚫 Often converges to local optima",
      "📉 Lower coverage in complex scenarios",
      "🎯 Struggles with scattered house patterns",
      "💸 Higher costs than advanced algorithms",
    ],
    bestFor: [
      "Quick initial solutions",
      "Simple grid patterns (urban grid, downtown)",
      "Resource-constrained environments",
      "Baseline comparisons",
    ],
    medals: { gold: 0, silver: 1, bronze: 4 },
    avgRank: 3.5,
    keyMetric: "Fastest Execution",
  },
  {
    name: "genetic",
    displayName: "Genetic Algorithm",
    color: "from-red-500 to-rose-600",
    gradient: "bg-gradient-to-br from-red-500/20 to-rose-600/20",
    icon: <Award className="w-6 h-6" />,
    strengths: [
      "🧬 Good population diversity",
      "📈 Improves with longer run times",
      "🔄 Can escape local optima",
      "🎯 Often achieves high coverage %",
    ],
    weaknesses: [
      "💸 Tends to overuse expensive antennas",
      "⏱️ Moderate to slow execution time",
      "🎲 Results vary significantly between runs",
      "⚙️ Requires parameter tuning (population, mutation rate)",
    ],
    bestFor: [
      "Exploration-heavy scenarios",
      "When antenna count is constrained",
      "Problems with complex fitness landscapes",
      "Research and experimentation",
    ],
    medals: { gold: 0, silver: 1, bronze: 4 },
    avgRank: 4.1,
    keyMetric: "Best Coverage %",
  },
  {
    name: "greedy",
    displayName: "Greedy Algorithm",
    color: "from-slate-500 to-gray-600",
    gradient: "bg-gradient-to-br from-slate-500/20 to-gray-600/20",
    icon: <Zap className="w-6 h-6" />,
    strengths: [
      "⚡ Fastest execution (avg ~500ms)",
      "💻 Minimal memory usage",
      "🎯 Simple implementation",
      "📊 Predictable behavior",
    ],
    weaknesses: [
      "❌ Poor coverage in most scenarios (avg ~30%)",
      "💸 Inefficient antenna placement",
      "🚫 Cannot escape initial poor choices",
      "📉 Worst overall performance",
    ],
    bestFor: [
      "Prototyping and testing",
      "Educational purposes",
      "Extremely simple patterns",
      "When speed is the ONLY priority",
    ],
    medals: { gold: 0, silver: 0, bronze: 1 },
    avgRank: 5.2,
    keyMetric: "Baseline Reference",
  },
];

// Chart data based on research results
const medalData = algorithmInsights.map((algo) => ({
  name: algo.displayName,
  gold: algo.medals.gold,
  silver: algo.medals.silver,
  bronze: algo.medals.bronze,
  total: algo.medals.gold + algo.medals.silver + algo.medals.bronze,
}));

const rankingData = algorithmInsights.map((algo) => ({
  name: algo.displayName.split(" ")[0],
  rank: algo.avgRank,
  color: algo.color,
}));

const performanceByGridSize = [
  {
    gridSize: "25x25",
    "Simulated Annealing": 100,
    "Tabu Search": 100,
    VNS: 99.8,
    "Hill Climbing": 100,
    Genetic: 98.5,
    Greedy: 50.3,
  },
  {
    gridSize: "50x50",
    "Simulated Annealing": 99.9,
    "Tabu Search": 99.9,
    VNS: 99.5,
    "Hill Climbing": 98.2,
    Genetic: 89.8,
    Greedy: 32.4,
  },
  {
    gridSize: "100x100",
    "Simulated Annealing": 99.9,
    "Tabu Search": 99.9,
    VNS: 99.9,
    "Hill Climbing": 99.9,
    Genetic: 98.8,
    Greedy: 55.1,
  },
];

const speedVsQuality = [
  { name: "Greedy", speed: 500, quality: 30, size: 1200 },
  { name: "Hill Climbing", speed: 1000, quality: 95, size: 800 },
  { name: "VNS", speed: 1800, quality: 98, size: 600 },
  { name: "Tabu", speed: 4200, quality: 99.5, size: 500 },
  { name: "Genetic", speed: 3500, quality: 95, size: 400 },
  { name: "Sim. Anneal", speed: 16000, quality: 100, size: 300 },
];

const costEfficiency = [
  { name: "VNS", efficiency: 120.2, color: "#a855f7" },
  { name: "Simulated Annealing", efficiency: 300.4, color: "#f59e0b" },
  { name: "Tabu Search", efficiency: 300.6, color: "#3b82f6" },
  { name: "Hill Climbing", efficiency: 340.2, color: "#10b981" },
  { name: "Genetic", efficiency: 450.8, color: "#ef4444" },
  { name: "Greedy", efficiency: 620.5, color: "#64748b" },
];

const radarMetrics = [
  {
    metric: "User Coverage",
    "Sim. Anneal": 100,
    Tabu: 98,
    VNS: 96,
    "Hill Climb": 90,
    Genetic: 88,
    Greedy: 35,
  },
  {
    metric: "Speed",
    "Sim. Anneal": 20,
    Tabu: 60,
    VNS: 75,
    "Hill Climb": 95,
    Genetic: 50,
    Greedy: 100,
  },
  {
    metric: "Cost Eff.",
    "Sim. Anneal": 95,
    Tabu: 95,
    VNS: 100,
    "Hill Climb": 75,
    Genetic: 60,
    Greedy: 30,
  },
  {
    metric: "Consistency",
    "Sim. Anneal": 98,
    Tabu: 95,
    VNS: 80,
    "Hill Climb": 85,
    Genetic: 65,
    Greedy: 100,
  },
  {
    metric: "Scalability",
    "Sim. Anneal": 95,
    Tabu: 90,
    VNS: 85,
    "Hill Climb": 70,
    Genetic: 65,
    Greedy: 40,
  },
];

const scenarioWinRate = [
  { name: "Unconstrained", SA: 85, Tabu: 70, VNS: 60, Others: 25 },
  { name: "Budget Limited", SA: 75, Tabu: 80, VNS: 85, Others: 30 },
  { name: "Antenna Limited", SA: 70, Tabu: 85, VNS: 65, Others: 40 },
  { name: "Both Limited", SA: 65, Tabu: 80, VNS: 75, Others: 35 },
];

const COLORS = {
  gold: "#f59e0b",
  silver: "#94a3b8",
  bronze: "#ea580c",
  simAnneal: "#f59e0b",
  tabu: "#3b82f6",
  vns: "#a855f7",
  hillClimb: "#10b981",
  genetic: "#ef4444",
  greedy: "#64748b",
};

// Key insights from the data - Random Scattered
const randomInsights = [
  {
    title: "🏆 Simulated Annealing Dominates",
    description:
      "Won 6 out of 11 random scattered scenarios with the best average ranking. Consistently achieves 99-100% user coverage across all grid sizes.",
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "⚡ Tabu Search: Speed Champion",
    description:
      "3 gold medals with 3-5x faster execution than SA. Best choice when you need high quality results quickly (avg 3-6 seconds).",
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "📊 Grid Size Impact",
    description:
      "On 100x100 grids, SA, Tabu, and VNS all achieve 99%+ coverage with only 4 antennas. Greedy drops to just 2.87% coverage - a catastrophic failure.",
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "💰 VNS: Budget Hero",
    description:
      "VNS achieved the most cost-effective solution at $84.4/coverage point. Excels when budget constraints force creative antenna placement.",
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "🎯 Constraint Handling",
    description:
      "With antenna limits, Tabu Search and VNS shine. Genetic algorithm requires all allowed antennas, making it inflexible for constrained scenarios.",
    color: "from-red-500 to-rose-600",
  },
  {
    title: "🚀 Production Recommendation",
    description:
      "For random distributions: Use Tabu Search for production, SA for critical optimizations, VNS for tight budgets. Never use Greedy.",
    color: "from-indigo-500 to-purple-600",
  },
];

// Key insights from the data - Patterned
const patternedInsights = [
  {
    title: "🏆 Pattern Complexity Matters",
    description:
      "SA won 4/7 patterned scenarios but struggled with circular clusters (53% coverage). Different patterns favor different algorithms!",
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "🎨 VNS Excels at Clusters",
    description:
      "VNS achieved top ranking for circular_clusters (99.56% coverage) where SA failed (53%). Best algorithm for identifying pattern structures.",
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "🏙️ Hill Climbing Loves Grids",
    description:
      "Won urban_grid scenario outright. Performs exceptionally well on structured patterns with regular spacing (87-100% coverage).",
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "⚡ Tabu's Versatility",
    description:
      "Consistently strong across all patterns (80-100% coverage). Most reliable algorithm when pattern type is unknown or varies.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "📉 Genetic Struggles",
    description:
      "Poor performance on patterns (76-93% coverage). High cost ($34K-$61K) with inconsistent results. Avoid for structured problems.",
    color: "from-red-500 to-rose-600",
  },
  {
    title: "🎯 Pattern-Aware Strategy",
    description:
      "Clusters → VNS, Grids → Hill Climbing, Linear → SA/VNS, Unknown → Tabu Search. Choose your algorithm based on house distribution!",
    color: "from-indigo-500 to-purple-600",
  },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<
    "random" | "patterned" | "comparison"
  >("random");

  // Get rankings based on active tab
  const getRankingsForTab = () => {
    if (activeTab === "random") {
      return randomRankings;
    } else if (activeTab === "patterned") {
      return patternedRankings;
    }
    return randomRankings; // default
  };

  const sortedAlgorithms = [...algorithmInsights].sort(
    (a, b) => a.avgRank - b.avgRank
  );

  // Get medals based on active tab
  const getMedalsForTab = () => {
    if (activeTab === "random") {
      return Object.entries(randomScatteredMedals).map(([name, medals]) => ({
        name:
          algorithmInsights.find((a) => a.name === name)?.displayName || name,
        ...medals,
        total: medals.gold + medals.silver + medals.bronze,
      }));
    } else {
      return Object.entries(patternedMedals).map(([name, medals]) => ({
        name:
          algorithmInsights.find((a) => a.name === name)?.displayName || name,
        ...medals,
        total: medals.gold + medals.silver + medals.bronze,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all border border-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Simulator
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🔬 Algorithm Research & Insights
              </h1>
              <p className="text-slate-400 mt-2">
                Comprehensive analysis of 6 algorithms across 18 diverse
                scenarios
                <br />
                <span className="text-xs text-slate-500">
                  📍 Note: "Coverage" refers to percentage of users/houses
                  covered by antennas, not total map area
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("random")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "random"
                ? "text-blue-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            🎲 Random Scattered (11 Scenarios)
            {activeTab === "random" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("patterned")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "patterned"
                ? "text-purple-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            🏘️ Patterned Scenarios (32 Scenarios)
            {activeTab === "patterned" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === "comparison"
                ? "text-orange-400"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            ⚖️ Pattern vs No Pattern
            {activeTab === "comparison" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"></div>
            )}
          </button>
        </div>

        {/* Key Insights Grid */}
        {activeTab !== "comparison" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeTab === "random" ? randomInsights : patternedInsights).map(
              (insight, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl bg-gradient-to-br ${insight.color} bg-opacity-10 border border-slate-700 hover:border-slate-600 transition-all`}
                >
                  <h3 className="text-xl font-bold mb-3">{insight.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Comparison Tab Content */}
        {activeTab === "comparison" && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl border border-blue-700 p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  🎲 Random Scattered
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Total Scenarios:</span>
                    <span className="font-bold">11</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg Coverage:</span>
                    <span className="font-bold text-green-400">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Best Algorithm:</span>
                    <span className="font-bold text-yellow-400">
                      Simulated Annealing
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fastest:</span>
                    <span className="font-bold text-blue-400">
                      Greedy (1.9s)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-700 p-6">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  🏘️ Patterned Scenarios
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Total Scenarios:</span>
                    <span className="font-bold">32</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg Coverage:</span>
                    <span className="font-bold text-green-400">74.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Best Algorithm:</span>
                    <span className="font-bold text-yellow-400">
                      Tabu Search
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fastest:</span>
                    <span className="font-bold text-blue-400">
                      Hill Climbing (0.3s)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Change Analysis */}
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Brain className="w-7 h-7 text-orange-500" />
                Algorithm Behavior: Random vs Patterned Scenarios
              </h3>
              <div className="space-y-4">
                {algorithmComparisons.map((algo) => (
                  <div
                    key={algo.name}
                    className={`bg-slate-800/50 rounded-lg p-6 border-2 ${
                      algo.changeType === "improvement"
                        ? "border-green-500/30"
                        : algo.changeType === "decline"
                          ? "border-orange-500/30"
                          : "border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">
                          {algo.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-400">
                            Random: #{algo.randomRank}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="text-purple-400">
                            Patterned: #{algo.patternedRank}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          algo.changeType === "improvement"
                            ? "bg-green-500/20 text-green-400"
                            : algo.changeType === "decline"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {algo.change}
                      </span>
                    </div>
                    <p className="text-slate-300 mb-3">{algo.insight}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-xs text-slate-400 mb-1">
                          Coverage Change
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            algo.coverageDelta > 0
                              ? "text-green-400"
                              : "text-orange-400"
                          }`}
                        >
                          {algo.coverageDelta > 0 ? "+" : ""}
                          {algo.coverageDelta.toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-slate-900/50 rounded p-3">
                        <div className="text-xs text-slate-400 mb-1">
                          Speed Change
                        </div>
                        <div
                          className={`text-lg font-bold ${
                            algo.timeDelta < 0
                              ? "text-green-400"
                              : "text-orange-400"
                          }`}
                        >
                          {algo.timeDelta.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Box */}
              <div className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-6">
                <h4 className="font-bold text-lg text-blue-400 mb-3 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  The Pattern Effect Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-green-400 font-bold mb-2">
                      ✅ Winners with Patterns:
                    </div>
                    <ul className="text-slate-300 space-y-1">
                      <li>
                        • <strong>Tabu Search:</strong> +1 rank (2nd→1st)
                      </li>
                      <li>
                        • <strong>Greedy:</strong> +40% coverage boost
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-orange-400 font-bold mb-2">
                      ⚠️ Challenged by Patterns:
                    </div>
                    <ul className="text-slate-300 space-y-1">
                      <li>
                        • <strong>Simulated Annealing:</strong> -1 rank
                      </li>
                      <li>
                        • <strong>Genetic:</strong> -30% coverage drop
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold mb-2">
                      🔄 Consistent Performers:
                    </div>
                    <ul className="text-slate-300 space-y-1">
                      <li>
                        • <strong>VNS:</strong> Solid 3rd both times
                      </li>
                      <li>
                        • <strong>Hill Climbing:</strong> Steady 4th
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coverage Comparison */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  📊 Average User Coverage by Pattern Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { alg: "SA", Random: 99.7, Patterned: 83.5 },
                      { alg: "Tabu", Random: 99.8, Patterned: 82.7 },
                      { alg: "VNS", Random: 99.3, Patterned: 79.4 },
                      { alg: "Hill", Random: 99.8, Patterned: 81.2 },
                      { alg: "Genetic", Random: 98.9, Patterned: 68.5 },
                      { alg: "Greedy", Random: 38.5, Patterned: 53.8 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="alg" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Random" fill="#3b82f6" name="Random (11)" />
                    <Bar
                      dataKey="Patterned"
                      fill="#a855f7"
                      name="Patterned (32)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Execution Time Comparison */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  ⚡ Average Execution Time (ms)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { alg: "SA", Random: 23958, Patterned: 9847 },
                      { alg: "Tabu", Random: 11645, Patterned: 3321 },
                      { alg: "VNS", Random: 3344, Patterned: 512 },
                      { alg: "Hill", Random: 2401, Patterned: 329 },
                      { alg: "Genetic", Random: 4185, Patterned: 1789 },
                      { alg: "Greedy", Random: 1932, Patterned: 943 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="alg" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Random" fill="#3b82f6" name="Random (11)" />
                    <Bar
                      dataKey="Patterned"
                      fill="#a855f7"
                      name="Patterned (32)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Comparison */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  💰 Average Total Cost ($)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { alg: "SA", Random: 39200, Patterned: 38625 },
                      { alg: "Tabu", Random: 39100, Patterned: 37969 },
                      { alg: "VNS", Random: 40073, Patterned: 41316 },
                      { alg: "Hill", Random: 47455, Patterned: 48656 },
                      { alg: "Genetic", Random: 58109, Patterned: 45291 },
                      { alg: "Greedy", Random: 28945, Patterned: 32219 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="alg" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Random" fill="#3b82f6" name="Random (11)" />
                    <Bar
                      dataKey="Patterned"
                      fill="#a855f7"
                      name="Patterned (32)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Index */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  🎯 Performance Index (Coverage/Cost Ratio)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { alg: "SA", Random: 2.54, Patterned: 2.16 },
                      { alg: "Tabu", Random: 2.55, Patterned: 2.18 },
                      { alg: "VNS", Random: 2.48, Patterned: 1.92 },
                      { alg: "Hill", Random: 2.1, Patterned: 1.67 },
                      { alg: "Genetic", Random: 1.7, Patterned: 1.51 },
                      { alg: "Greedy", Random: 1.33, Patterned: 1.67 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="alg" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Random" fill="#3b82f6" name="Random (11)" />
                    <Bar
                      dataKey="Patterned"
                      fill="#a855f7"
                      name="Patterned (32)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl border border-green-700 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="w-7 h-7 text-green-400" />
                Production Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 rounded-lg p-6">
                  <h4 className="font-bold text-blue-400 mb-3 text-lg">
                    🎲 Random/Unknown Patterns
                  </h4>
                  <p className="text-slate-300 mb-3 text-sm">
                    When dealing with unpredictable house distributions:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">★</span>
                      <span>
                        <strong>Use Simulated Annealing</strong> - Consistently
                        achieves 99%+ coverage
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">★</span>
                      <span>
                        <strong>Budget for time</strong> - Expect 24s avg
                        execution
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">★</span>
                      <span>
                        <strong>Alternative:</strong> Tabu Search (half the
                        time, same coverage)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-6">
                  <h4 className="font-bold text-purple-400 mb-3 text-lg">
                    🏘️ Known Patterns
                  </h4>
                  <p className="text-slate-300 mb-3 text-sm">
                    When pattern is identified (clusters, grids, etc.):
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 mt-0.5">★</span>
                      <span>
                        <strong>Use Tabu Search</strong> - Best pattern
                        recognition (10 golds)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">★</span>
                      <span>
                        <strong>70% faster</strong> - Only 3.3s avg vs 9.8s SA
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">★</span>
                      <span>
                        <strong>Pattern-specific:</strong> VNS for clusters,
                        Hill for grids
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
                <h4 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  The Pattern-First Strategy
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <strong>Production Tip:</strong> Always analyze the house
                  distribution first! If you detect a pattern (clusters, grids,
                  lines, etc.), use <strong>Tabu Search</strong> to save 70%
                  execution time while maintaining high coverage. For truly
                  random distributions, invest the extra time in
                  <strong> Simulated Annealing</strong> for guaranteed results.
                  This pattern-first approach can reduce overall compute costs
                  by up to 65% across a mixed workload.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Charts Section */}
        {activeTab !== "comparison" && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <h2 className="text-3xl font-bold">Performance Analytics</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Medal Distribution */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  🏅 Medal Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getMedalsForTab()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Bar dataKey="gold" fill={COLORS.gold} name="Gold 🥇" />
                    <Bar
                      dataKey="silver"
                      fill={COLORS.silver}
                      name="Silver 🥈"
                    />
                    <Bar
                      dataKey="bronze"
                      fill={COLORS.bronze}
                      name="Bronze 🥉"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Rankings */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  📊 Average Rankings (Lower is Better)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      type="number"
                      tick={{ fill: "#94a3b8" }}
                      domain={[0, 6]}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#94a3b8" }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="rank" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Speed vs Quality Scatter */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  ⚡ Speed vs Quality Trade-off
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      type="number"
                      dataKey="speed"
                      name="Speed (ms)"
                      tick={{ fill: "#94a3b8" }}
                      label={{
                        value: "Execution Time (ms)",
                        position: "bottom",
                        fill: "#94a3b8",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="quality"
                      name="User Coverage (%)"
                      tick={{ fill: "#94a3b8" }}
                      label={{
                        value: "User Coverage (%)",
                        angle: -90,
                        position: "left",
                        fill: "#94a3b8",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                              <p className="font-bold text-white">
                                {payload[0].payload.name}
                              </p>
                              <p className="text-slate-300 text-sm">
                                Speed: {payload[0].payload.speed}ms
                              </p>
                              <p className="text-slate-300 text-sm">
                                Quality: {payload[0].payload.quality}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      name="Algorithms"
                      data={speedVsQuality}
                      fill="#8b5cf6"
                    >
                      {speedVsQuality.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(COLORS)[index]}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {speedVsQuality.map((algo, idx) => (
                    <div key={algo.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: Object.values(COLORS)[idx] }}
                      />
                      <span className="text-xs text-slate-300">
                        {algo.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Top-left corner = Best (fast + high user coverage)
                </p>
              </div>

              {/* Cost Efficiency */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  💰 Cost Efficiency ($/Coverage %)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `$${value.toFixed(1)}`}
                    />
                    <Bar dataKey="efficiency" radius={[8, 8, 0, 0]}>
                      {costEfficiency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Lower is better - Less $ per coverage point
                </p>
              </div>
            </div>

            {/* Full Width Charts */}
            <div className="grid grid-cols-1 gap-6 mt-6">
              {/* Performance by Grid Size */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  📏 User Coverage Performance by Grid Size
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={performanceByGridSize}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="gridSize" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Simulated Annealing"
                      stroke={COLORS.simAnneal}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="Tabu Search"
                      stroke={COLORS.tabu}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="VNS"
                      stroke={COLORS.vns}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="Hill Climbing"
                      stroke={COLORS.hillClimb}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Genetic"
                      stroke={COLORS.genetic}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="Greedy"
                      stroke={COLORS.greedy}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart - Multi-dimensional Performance */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  🎯 Multi-Dimensional Performance Comparison
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarMetrics}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "#94a3b8" }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <Radar
                      name="Sim. Anneal"
                      dataKey="Sim. Anneal"
                      stroke={COLORS.simAnneal}
                      fill={COLORS.simAnneal}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Tabu"
                      dataKey="Tabu"
                      stroke={COLORS.tabu}
                      fill={COLORS.tabu}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name="VNS"
                      dataKey="VNS"
                      stroke={COLORS.vns}
                      fill={COLORS.vns}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-400 text-center mt-2">
                  Larger area = Better overall performance
                </p>
              </div>

              {/* Win Rate by Scenario Type */}
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  🎪 Success Rate by Constraint Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scenarioWinRate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                    <YAxis tick={{ fill: "#94a3b8" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `${value}%`}
                    />
                    <Legend />
                    <Bar
                      dataKey="SA"
                      fill={COLORS.simAnneal}
                      name="Simulated Annealing"
                    />
                    <Bar dataKey="Tabu" fill={COLORS.tabu} name="Tabu Search" />
                    <Bar dataKey="VNS" fill={COLORS.vns} name="VNS" />
                    <Bar dataKey="Others" fill={COLORS.greedy} name="Others" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Rankings */}
        {activeTab !== "comparison" && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-8 h-8 text-amber-500" />
              <h2 className="text-3xl font-bold">
                Algorithm Power Rankings -{" "}
                {activeTab === "random"
                  ? "Random Scattered"
                  : "Patterned Scenarios"}
              </h2>
            </div>

            <div className="space-y-6">
              {getRankingsForTab().map((ranking, idx) => {
                const algo = algorithmInsights.find(
                  (a) => a.displayName === ranking.name
                );
                if (!algo) return null;
                return (
                  <div
                    key={algo.name}
                    className={`relative overflow-hidden rounded-xl border-2 ${
                      idx === 0
                        ? "border-amber-500"
                        : idx === 1
                          ? "border-slate-400"
                          : idx === 2
                            ? "border-orange-600"
                            : "border-slate-700"
                    } transition-all hover:scale-[1.02]`}
                  >
                    <div
                      className={`absolute inset-0 ${algo.gradient} opacity-50`}
                    ></div>
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-5xl font-bold ${
                              idx === 0
                                ? "text-amber-500"
                                : idx === 1
                                  ? "text-slate-300"
                                  : idx === 2
                                    ? "text-orange-500"
                                    : "text-slate-500"
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                              {algo.icon}
                              {ranking.name}
                            </h3>
                            <p className="text-sm text-slate-400">
                              Avg Rank: {ranking.avgRank.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Medal Count */}
                        <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg">
                          {ranking.medals.gold > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy className="w-5 h-5 text-amber-500" />
                              <span className="font-bold">
                                {ranking.medals.gold}
                              </span>
                            </div>
                          )}
                          {ranking.medals.silver > 0 && (
                            <div className="flex items-center gap-1">
                              <Medal className="w-5 h-5 text-slate-400" />
                              <span className="font-bold">
                                {ranking.medals.silver}
                              </span>
                            </div>
                          )}
                          {ranking.medals.bronze > 0 && (
                            <div className="flex items-center gap-1">
                              <Medal className="w-5 h-5 text-orange-600" />
                              <span className="font-bold">
                                {ranking.medals.bronze}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <div className="text-xs text-slate-400 mb-1">
                            Avg Coverage
                          </div>
                          <div className="text-lg font-bold text-green-400">
                            {ranking.avgCoverage.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <div className="text-xs text-slate-400 mb-1">
                            Avg Time
                          </div>
                          <div className="text-lg font-bold text-blue-400">
                            {(ranking.avgTime / 1000).toFixed(1)}s
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <div className="text-xs text-slate-400 mb-1">
                            Avg Cost
                          </div>
                          <div className="text-lg font-bold text-yellow-400">
                            ${(ranking.avgCost / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Strengths */}
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                            ✅ Strengths
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-300">
                            {algo.strengths.map((strength, i) => (
                              <li key={i}>{strength}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                            ⚠️ Weaknesses
                          </h4>
                          <ul className="space-y-1 text-sm text-slate-300">
                            {algo.weaknesses.map((weakness, i) => (
                              <li key={i}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Best For */}
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                          🎯 Best For
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {algo.bestFor.map((use, i) => (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${algo.color} text-white`}
                            >
                              {use}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Methodology */}
        {activeTab !== "comparison" && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              📊 Research Methodology
            </h2>
            <div className="space-y-4 text-slate-300">
              <p>
                <strong className="text-white">Dataset:</strong>{" "}
                {activeTab === "random" ? "11" : "32"} scenarios across varying
                grid sizes (25x25 to 100x100) with diverse house patterns (
                {activeTab === "random"
                  ? "random scattered distributions"
                  : "circular clusters, urban grids, linear streets, dense downtown, donut rings, coastal settlements, and more"}
                ).
              </p>
              <p>
                <strong className="text-white">Evaluation Metrics:</strong> User
                coverage percentage (% of houses/users covered by antenna
                signals), cost efficiency ($/Coverage), execution time, and
                antenna count. Rankings based on multi-criteria scoring.
              </p>
              <p>
                <strong className="text-white">Constraints Tested:</strong>{" "}
                Budget limits (25K-150K), antenna count constraints (6-35), and
                various antenna type combinations (Femto, Pico, Micro, Macro).
              </p>
              <p>
                <strong className="text-white">Scoring System:</strong> Each
                algorithm ranked 1-6 per scenario across 4 metrics (coverage,
                cost, time, efficiency). Lower total score = better overall
                performance.
              </p>
            </div>
          </div>
        )}

        {/* Decision Matrix */}
        {activeTab !== "comparison" && (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              🤔 Algorithm Decision Matrix
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 pr-4">Use Case</th>
                    <th className="pb-3 pr-4">Recommended Algorithm</th>
                    <th className="pb-3">Why?</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">
                      Production Environment
                    </td>
                    <td className="py-3 pr-4 text-blue-400">Tabu Search</td>
                    <td className="py-3">
                      Best speed/quality balance, consistent results
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">
                      Critical Optimization
                    </td>
                    <td className="py-3 pr-4 text-amber-400">
                      Simulated Annealing
                    </td>
                    <td className="py-3">
                      Highest quality solutions, worth the wait
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">Tight Budget</td>
                    <td className="py-3 pr-4 text-purple-400">VNS</td>
                    <td className="py-3">
                      Excellent cost optimization, adaptive
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">
                      Real-Time Preview
                    </td>
                    <td className="py-3 pr-4 text-green-400">Hill Climbing</td>
                    <td className="py-3">Fast enough for interactive use</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">
                      Large Grids (100x100+)
                    </td>
                    <td className="py-3 pr-4 text-amber-400">
                      Simulated Annealing
                    </td>
                    <td className="py-3">Scales well, maintains quality</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-semibold">
                      Diverse Patterns
                    </td>
                    <td className="py-3 pr-4 text-purple-400">VNS</td>
                    <td className="py-3">Adapts to different problem types</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-semibold">
                      Baseline Comparison
                    </td>
                    <td className="py-3 pr-4 text-slate-400">Greedy</td>
                    <td className="py-3">
                      Simple, fast, shows what NOT to use
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fun Facts */}
        {activeTab !== "comparison" && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4">
              🎉 Fun Facts from the Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <p className="font-semibold text-white">Speed Demon</p>
                  <p className="text-sm">
                    Greedy completed in 52ms (fastest), but with only 11.65%
                    coverage 😬
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🐌</span>
                <div>
                  <p className="font-semibold text-white">Slowpoke Champion</p>
                  <p className="text-sm">
                    Simulated Annealing took 106 seconds but achieved 100%
                    coverage ⭐
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold text-white">Budget Buster</p>
                  <p className="text-sm">
                    Genetic algorithm's priciest solution: $212,500 (ouch!)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-semibold text-white">Efficiency King</p>
                  <p className="text-sm">
                    VNS achieved $84.4/coverage point - most cost-effective
                    solution!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📡</span>
                <div>
                  <p className="font-semibold text-white">Antenna Minimalist</p>
                  <p className="text-sm">
                    Multiple algorithms achieved 100% with just 1 Macro antenna
                    🎖️
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold text-white">Perfect Score</p>
                  <p className="text-sm">
                    Simulated Annealing hit 100% coverage in 14 out of 18
                    scenarios!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Conclusion */}
        {activeTab !== "comparison" && (
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border-2 border-blue-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-10 h-10 text-amber-500" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Research Conclusions & Final Recommendations
              </h2>
            </div>

            <div className="space-y-6">
              {/* Key Finding */}
              <div className="bg-slate-900/50 rounded-lg p-6 border border-amber-500/30">
                <h3 className="text-2xl font-bold text-amber-400 mb-4">
                  🎯 Key Finding: Pattern Type Dictates Algorithm Choice
                </h3>
                <p className="text-slate-300 leading-relaxed text-lg">
                  Our research across 18 diverse scenarios reveals that{" "}
                  <strong className="text-white">
                    algorithm performance varies dramatically based on house
                    distribution patterns
                  </strong>
                  . While Simulated Annealing dominates random scattered
                  scenarios (winning 6/11), it struggles with circular clusters.
                  Conversely, VNS excels at clustered patterns but requires more
                  computational resources for random distributions.
                </p>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg p-6 border border-blue-500/30">
                  <h3 className="text-xl font-bold text-blue-400 mb-4">
                    🎲 Random Scattered Scenarios
                  </h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">
                          Best: Simulated Annealing
                        </strong>{" "}
                        - 99-100% coverage, optimal cost ($122-300/coverage)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">
                          Runner-up: Tabu Search
                        </strong>{" "}
                        - 3-5x faster with 99%+ coverage
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">
                          Budget Choice: VNS
                        </strong>{" "}
                        - Most cost-effective ($84-120/coverage)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">✗</span>
                      <div>
                        <strong className="text-white">Avoid: Greedy</strong> -
                        Catastrophic failure on large grids (2.87% coverage!)
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-lg p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-400 mb-4">
                    🏘️ Patterned Scenarios
                  </h3>
                  <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Clusters: VNS</strong> -
                        99.56% coverage on circular_clusters (SA only got 53%)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">
                          Grids: Hill Climbing
                        </strong>{" "}
                        - Won urban_grid with 100% coverage
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Linear: SA/VNS</strong> -
                        Both achieved 99-100% on linear_streets
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400 font-bold">⚠</span>
                      <div>
                        <strong className="text-white">
                          Universal: Tabu Search
                        </strong>{" "}
                        - 80-100% across all patterns (most reliable)
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Decision Framework */}
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">
                  📋 Production Decision Framework
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="font-bold text-amber-400 mb-2">
                        🎯 Know Your Pattern?
                      </p>
                      <p className="text-sm text-slate-300">
                        <strong>Random:</strong> Simulated Annealing
                        <br />
                        <strong>Clusters:</strong> VNS
                        <br />
                        <strong>Grid:</strong> Hill Climbing
                        <br />
                        <strong>Unknown:</strong> Tabu Search
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="font-bold text-blue-400 mb-2">
                        ⚡ Speed Priority?
                      </p>
                      <p className="text-sm text-slate-300">
                        <strong>Real-time:</strong> Hill Climbing (500ms)
                        <br />
                        <strong>Interactive:</strong> VNS (1-2s)
                        <br />
                        <strong>Batch:</strong> Tabu (3-6s)
                        <br />
                        <strong>Overnight:</strong> Simulated Annealing
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="font-bold text-green-400 mb-2">
                        💰 Budget Constrained?
                      </p>
                      <p className="text-sm text-slate-300">
                        <strong>Tight:</strong> VNS ($84-120/coverage)
                        <br />
                        <strong>Moderate:</strong> Simulated Annealing
                        <br />
                        <strong>Unlimited:</strong> Tabu Search
                        <br />
                        <strong>Never:</strong> Genetic ($350-2125/coverage)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Verdict */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-6 border-2 border-amber-500/50">
                <h3 className="text-2xl font-bold text-amber-400 mb-4">
                  🏆 Final Verdict
                </h3>
                <div className="space-y-4 text-slate-300">
                  <p className="text-lg leading-relaxed">
                    <strong className="text-white">
                      For Production Systems:
                    </strong>{" "}
                    Deploy{" "}
                    <span className="text-blue-400 font-bold">Tabu Search</span>{" "}
                    as your default algorithm. It offers the best balance of
                    speed (3-6s), reliability (80-100% coverage), and
                    consistency across all scenario types.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong className="text-white">
                      For Critical Optimizations:
                    </strong>{" "}
                    Use{" "}
                    <span className="text-amber-400 font-bold">
                      Simulated Annealing
                    </span>{" "}
                    when you need the absolute best solution and can afford
                    10-100 seconds of computation time. Ideal for large-scale
                    deployments and random distributions.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong className="text-white">
                      For Pattern-Aware Systems:
                    </strong>{" "}
                    Implement{" "}
                    <span className="text-purple-400 font-bold">
                      pattern detection
                    </span>{" "}
                    and route to specialized algorithms (VNS for clusters, Hill
                    Climbing for grids) to achieve optimal results with minimal
                    computational overhead.
                  </p>
                  <p className="text-lg leading-relaxed">
                    <strong className="text-white">Never Use:</strong>{" "}
                    <span className="text-red-400 font-bold">
                      Greedy algorithm
                    </span>{" "}
                    for anything beyond prototyping. Its 2-70% coverage range
                    makes it unreliable for production.{" "}
                    <span className="text-red-400 font-bold">
                      Genetic algorithm
                    </span>{" "}
                    is also discouraged due to high costs and inconsistent
                    results.
                  </p>
                  <div className="mt-6 p-4 bg-slate-900/80 rounded-lg border border-amber-500/30">
                    <p className="text-center text-xl font-bold text-amber-400">
                      🎯 The 80/20 Rule: Use Tabu Search for 80% of cases,
                      specialize with SA/VNS/HC for the remaining 20%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
