"use client";

import React from "react";
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

// Key insights from the data
const researchInsights = [
  {
    title: "🏆 Overall Winner: Simulated Annealing",
    description:
      "Dominated 10 out of 18 scenarios with the best average ranking (1.5). It's the go-to choice when optimization quality is paramount.",
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "⚡ Speed vs Quality Trade-off",
    description:
      "Tabu Search offers the best balance, running 3-5x faster than Simulated Annealing while maintaining ~95% of its solution quality.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    title: "📊 Grid Size Matters",
    description:
      "On 100x100 grids, advanced algorithms (SA, Tabu) outperform by 40-50% in coverage while using fewer antennas. Greedy's performance drops dramatically with scale.",
    color: "from-purple-500 to-pink-600",
  },
  {
    title: "💰 Budget Constraints Change Everything",
    description:
      "With budget limits, VNS and Tabu Search excel at finding cost-effective solutions, often matching Simulated Annealing's results at lower computational cost.",
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "🎯 Pattern-Specific Performance",
    description:
      "VNS excels at circular clusters, Hill Climbing works well on urban grids, and Simulated Annealing dominates scattered patterns.",
    color: "from-red-500 to-rose-600",
  },
  {
    title: "🚀 Real-World Recommendation",
    description:
      "Use Tabu Search for production (speed + quality), Simulated Annealing for critical optimizations, and VNS for diverse problem types.",
    color: "from-indigo-500 to-purple-600",
  },
];

export default function ResearchPage() {
  const sortedAlgorithms = [...algorithmInsights].sort(
    (a, b) => a.avgRank - b.avgRank
  );

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

        {/* Key Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {researchInsights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl bg-gradient-to-br ${insight.color} bg-opacity-10 border border-slate-700 hover:border-slate-600 transition-all`}
            >
              <h3 className="text-xl font-bold mb-3">{insight.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>

        {/* Performance Charts Section */}
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
                <BarChart data={medalData}>
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
                  <Bar dataKey="silver" fill={COLORS.silver} name="Silver 🥈" />
                  <Bar dataKey="bronze" fill={COLORS.bronze} name="Bronze 🥉" />
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
                    <span className="text-xs text-slate-300">{algo.name}</span>
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
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8" }} />
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

        {/* Algorithm Rankings */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Crown className="w-8 h-8 text-amber-500" />
            <h2 className="text-3xl font-bold">Algorithm Power Rankings</h2>
          </div>

          <div className="space-y-6">
            {sortedAlgorithms.map((algo, idx) => (
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
                          {algo.displayName}
                        </h3>
                        <p
                          className={`text-sm bg-gradient-to-r ${algo.color} bg-clip-text text-transparent font-semibold`}
                        >
                          {algo.keyMetric}
                        </p>
                      </div>
                    </div>

                    {/* Medal Count */}
                    <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg">
                      {algo.medals.gold > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-5 h-5 text-amber-500" />
                          <span className="font-bold">{algo.medals.gold}</span>
                        </div>
                      )}
                      {algo.medals.silver > 0 && (
                        <div className="flex items-center gap-1">
                          <Medal className="w-5 h-5 text-slate-400" />
                          <span className="font-bold">
                            {algo.medals.silver}
                          </span>
                        </div>
                      )}
                      {algo.medals.bronze > 0 && (
                        <div className="flex items-center gap-1">
                          <Medal className="w-5 h-5 text-orange-600" />
                          <span className="font-bold">
                            {algo.medals.bronze}
                          </span>
                        </div>
                      )}
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
            ))}
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            📊 Research Methodology
          </h2>
          <div className="space-y-4 text-slate-300">
            <p>
              <strong className="text-white">Dataset:</strong> 18 scenarios
              across varying grid sizes (25x25, 50x50, 100x100) with diverse
              house patterns (random, clustered, urban grid, coastal, etc.)
            </p>
            <p>
              <strong className="text-white">Evaluation Metrics:</strong> User
              coverage percentage (% of houses/users covered by antenna
              signals), cost efficiency ($/Coverage), execution time, and
              antenna count. Rankings based on multi-criteria scoring.
            </p>
            <p>
              <strong className="text-white">Constraints Tested:</strong> Budget
              limits (25K-150K), antenna count constraints (6-35), and various
              antenna type combinations (Femto, Pico, Micro, Macro).
            </p>
            <p>
              <strong className="text-white">Scoring System:</strong> Each
              algorithm ranked 1-6 per scenario across 4 metrics (coverage,
              cost, time, efficiency). Lower total score = better overall
              performance.
            </p>
          </div>
        </div>

        {/* Decision Matrix */}
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
                  <td className="py-3 pr-4 font-semibold">Real-Time Preview</td>
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
                  <td className="py-3 pr-4 font-semibold">Diverse Patterns</td>
                  <td className="py-3 pr-4 text-purple-400">VNS</td>
                  <td className="py-3">Adapts to different problem types</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold">
                    Baseline Comparison
                  </td>
                  <td className="py-3 pr-4 text-slate-400">Greedy</td>
                  <td className="py-3">Simple, fast, shows what NOT to use</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fun Facts */}
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
                  Multiple algorithms achieved 100% with just 1 Macro antenna 🎖️
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
      </div>
    </div>
  );
}
