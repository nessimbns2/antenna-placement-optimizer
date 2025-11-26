"use client";

import React from 'react';
import { Activity, Signal, DollarSign, Users, Zap, Clock } from 'lucide-react';
import { OptimizationResponse } from '@/lib/api-config';

interface StatsCardProps {
    totalHouses: number;
    coveredHouses: number;
    totalUsers: number;
    coveredUsers: number;
    antennaCount: number;
    costPerAntenna: number;
    optimizationResult?: OptimizationResponse | null;
}

export function StatsCard({ 
    totalHouses, 
    coveredHouses, 
    totalUsers,
    coveredUsers,
    antennaCount, 
    costPerAntenna,
    optimizationResult 
}: StatsCardProps) {
    const coveragePercent = totalHouses > 0 ? Math.round((coveredHouses / totalHouses) * 100) : 0;
    const userCoveragePercent = totalUsers > 0 ? Math.round((coveredUsers / totalUsers) * 100) : 0;
    const totalCost = antennaCount * costPerAntenna;

    return (
        <div className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Signal size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">House Coverage</p>
                        <p className="text-2xl font-bold text-slate-100">
                            {coveragePercent}%
                            <span className="text-xs text-slate-500 ml-2 font-normal">({coveredHouses}/{totalHouses})</span>
                        </p>
                    </div>
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Users Covered</p>
                        <p className="text-2xl font-bold text-slate-100">
                            {userCoveragePercent}%
                            <span className="text-xs text-slate-500 ml-2 font-normal">({coveredUsers}/{totalUsers})</span>
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
                        <p className="text-sm text-slate-400">Infrastructure Cost</p>
                        <p className="text-2xl font-bold text-slate-100">
                            ${optimizationResult ? optimizationResult.total_cost.toLocaleString() : totalCost.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {optimizationResult && (
                <div className="glass-panel p-4 rounded-xl">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <Zap size={16} className="text-yellow-400" />
                        Optimization Results - Cost Minimized
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs">Area Coverage</p>
                            <p className="text-slate-200 font-semibold">{optimizationResult.coverage_percentage.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Total Capacity</p>
                            <p className="text-slate-200 font-semibold">{optimizationResult.total_capacity} users</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Capacity Utilization</p>
                            <p className="text-slate-200 font-semibold">{optimizationResult.capacity_utilization.toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                <Clock size={12} />
                                Execution Time
                            </p>
                            <p className="text-slate-200 font-semibold">{optimizationResult.execution_time_ms.toFixed(1)}ms</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
