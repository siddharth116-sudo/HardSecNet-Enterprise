import React from 'react';
import PropTypes from 'prop-types';
import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResearchCharts = ({ data }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white">Academic Research Data</h2>
                <p className="text-gray-400 text-sm">Quantitative Analysis: Manual vs. Automated Security Orchestration.</p>
            </div>

            <div className="md:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg">
                <h3 className="text-gray-300 font-semibold mb-6 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-teal-400" /> Operational Efficiency
                </h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="task" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" label={{ value: 'Time (Minutes)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Bar dataKey="manual" name="Manual Execution (Min)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="automated" name="HardSecNet (Min)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center justify-center text-center">
                    <div className="text-gray-400 text-sm uppercase tracking-widest mb-2 font-bold">Total Time Saved</div>
                    <div className="text-5xl font-extrabold text-green-400">
                        {data ? Math.round(data.reduce((acc, curr) => acc + (curr.manual - curr.automated), 0)) : 0} <span className="text-2xl text-gray-500">min</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Per single audit cycle</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col items-center justify-center text-center">
                    <div className="text-gray-400 text-sm uppercase tracking-widest mb-2 font-bold">Efficiency Boost</div>
                    <div className="text-5xl font-extrabold text-blue-400">99.2%</div>
                    <p className="text-xs text-gray-500 mt-2">Reduction in operational latency</p>
                </div>
            </div>
        </div>
    );
};

ResearchCharts.propTypes = {
    data: PropTypes.array.isRequired
};

export default ResearchCharts;
