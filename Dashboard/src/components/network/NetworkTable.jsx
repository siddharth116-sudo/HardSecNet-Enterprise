import React from 'react';
import PropTypes from 'prop-types';
import { Globe } from 'lucide-react';

const NetworkTable = ({ data, handleKillProcess, userRole }) => {
    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg p-6 h-[500px] overflow-y-auto w-full">
            <h2 className="text-xl font-bold text-white mb-4">Network Monitor</h2>
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-800 text-gray-400 sticky top-0 text-xs uppercase tracking-wider">
                    <tr>
                        <th className="p-3 w-1/4">Process</th>
                        <th className="p-3 w-16">PID</th>
                        <th className="p-3 w-16 text-center">#</th>
                        <th className="p-3 w-1/4">Remote Endpoint</th>
                        <th className="p-3 w-1/6">Local Ports</th>
                        <th className="p-3 w-24">State</th>
                        <th className="p-3 w-16">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {data.map((conn, i) => (
                        <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                            <td className="p-3 font-medium text-gray-200 truncate max-w-[150px] flex items-center" title={conn.ProcessName}>
                                {conn.IsExternal && <Globe className="w-3 h-3 text-amber-500 mr-2" />}
                                {conn.ProcessName}
                            </td>
                            <td className="p-3 font-mono text-xs text-gray-500">{conn.PID}</td>
                            <td className="p-3 font-mono text-xs text-center text-gray-400">{conn.Count}</td>
                            <td className={`p-3 font-mono text-xs truncate max-w-[200px] ${conn.IsExternal ? 'text-amber-400 font-bold' : 'text-gray-500'}`} title={conn.RemoteAddress}>
                                {conn.RemoteAddress}
                            </td>
                            <td className="p-3 font-mono text-xs text-blue-400 truncate max-w-[120px]" title={conn.LocalPorts}>{conn.LocalPorts}</td>
                            <td className="p-3 text-xs">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${conn.State.includes('Established') ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                                    {conn.State.split(',')[0]}
                                </span>
                            </td>
                            <td className="p-3">
                                {userRole === 'admin' && (
                                    <button
                                        onClick={() => handleKillProcess(conn.PID)}
                                        className="text-red-400 hover:text-white hover:bg-red-600 font-bold text-[10px] border border-red-900/50 px-2 py-1 rounded transition uppercase"
                                    >
                                        KILL
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

NetworkTable.propTypes = {
    data: PropTypes.array.isRequired,
    handleKillProcess: PropTypes.func.isRequired,
    userRole: PropTypes.string.isRequired
};

export default NetworkTable;
