"use client";

import React from 'react';
import { Activity, Signal, DollarSign } from 'lucide-react';

interface StatsCardProps {
    totalHouses: number;
    coveredHouses: number;
    antennaCount: number;
    costPerAntenna: number;
}

export function StatsCard({ totalHouses, coveredHouses, antennaCount, costPerAntenna }: StatsCardProps) {
    const coveragePercent = totalHouses > 0 ? Math.round((coveredHouses / totalHouses) * 100) : 0;
    const totalCost = antennaCount * costPerAntenna;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Signal size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Coverage</p>
                    <p className="text-2xl font-bold text-slate-100">
                        {coveragePercent}%
                        <span className="text-xs text-slate-500 ml-2 font-normal">({coveredHouses}/{totalHouses})</span>
                    </p>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Antennas Active</p>
                    <p className="text-2xl font-bold text-slate-100">{antennaCount}</p>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Total Cost</p>
                    <p className="text-2xl font-bold text-slate-100">${totalCost.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
