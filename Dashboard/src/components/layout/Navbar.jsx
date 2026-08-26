import React from 'react';
import PropTypes from 'prop-types';
import { Shield, Plus, LogOut, User } from 'lucide-react';
import NodeSelector from './NodeSelector';

const Navbar = ({
    username,
    userRole,
    activeTab,
    setActiveTab,
    nodes,
    selectedNode,
    setSelectedNode,
    handleAddNode,
    logout
}) => {

    // Helper for Tab Styling
    const TabButton = ({ id, label }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`
                    relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300
                    ${isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                `}
            >
                {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-500/20 rounded-full border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-sm -z-10" layoutId="activeTab"></div>
                )}
                <span className="relative z-10">{label}</span>
            </button>
        );
    };

    return (
        <div className="sticky top-0 z-50 w-full">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md border-b border-white/5 shadow-2xl"></div>

            <div className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                {/* Brand / Logo */}
                <div className="flex items-center space-x-4 group cursor-pointer">
                    <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500">
                        <div className="absolute inset-0 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Shield className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">
                            HardSecNet
                        </h1>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                                Enterprise
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                {/* Center Actions (Node Selection) */}
                <div className="hidden lg:flex items-center space-x-4">
                    <div className="flex items-center space-x-3 bg-gray-900/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        <NodeSelector
                            nodes={nodes}
                            selectedNode={selectedNode}
                            onChange={setSelectedNode}
                        />
                        <div className="w-px h-8 bg-gray-700/50 mx-2"></div>
                        <button
                            onClick={handleAddNode}
                            className="p-2.5 rounded-xl bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white transition-all duration-300 shadow hover:shadow-blue-500/20 border border-transparent hover:border-blue-400/30 group"
                            title="Connect New Agent"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Actions (Tabs & Profile) */}
                <div className="flex items-center space-x-6">
                    {/* Navigation Tabs */}
                    <div className="hidden md:flex bg-gray-900/50 p-1.5 rounded-full border border-white/5 shadow-inner">
                        <TabButton id="dashboard" label="Overview" />
                        <TabButton id="network" label="Topology" />
                        <TabButton id="research" label="Compliance" />
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent"></div>

                    {/* User Profile */}
                    <div className="flex items-center space-x-4 pl-2">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-gray-200 leading-tight">{username}</div>
                            <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide">{userRole.replace('_', ' ')}</div>
                        </div>
                        <div className="relative group">
                            <button className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden hover:border-blue-500 transition-colors shadow-lg">
                                <User className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                            </button>
                            {/* Hover Dropdown for Logout */}
                            <div className="absolute right-0 top-full mt-2 w-32 origin-top-right transform scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-2">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-red-400 hover:bg-red-900/20 hover:text-red-300 text-xs font-bold shadow-xl space-x-2 transition-colors"
                                >
                                    <LogOut className="w-3 h-3" />
                                    <span>Disconnect</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Navbar.propTypes = {
    username: PropTypes.string.isRequired,
    userRole: PropTypes.string.isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    nodes: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedNode: PropTypes.string.isRequired,
    setSelectedNode: PropTypes.func.isRequired,
    handleAddNode: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired
};

export default Navbar;
