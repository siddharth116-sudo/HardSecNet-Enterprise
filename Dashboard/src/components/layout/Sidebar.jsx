import React from 'react';
import PropTypes from 'prop-types';
import { Shield, LayoutDashboard, Globe, FileCheck, LogOut, Plus, Plug, Building2 } from 'lucide-react';
import NodeSelector from './NodeSelector';

const Sidebar = ({
    username,
    userRole,
    activeTab,
    setActiveTab,
    nodes,
    selectedNode,
    setSelectedNode,
    handleAddNode,
    logout,
    workspaces = [],
    activeWorkspace = '',
    setActiveWorkspace = () => {},
}) => {

    const NavItem = ({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                style={isActive
                    ? { background: 'var(--hsn-accent-weak)', color: 'var(--hsn-text)' }
                    : { color: 'var(--hsn-text-muted)' }}
            >
                <Icon className="w-[18px] h-[18px]" style={{ color: isActive ? 'var(--hsn-accent)' : 'var(--hsn-text-muted)' }} />
                <span className="font-medium text-sm">{label}</span>
                {isActive && <span className="ml-auto hsn-dot" style={{ background: 'var(--hsn-accent)' }}></span>}
            </button>
        );
    };

    return (
        <div className="w-64 h-full flex flex-col" style={{ background: 'var(--hsn-bg-soft)', borderRight: '1px solid var(--hsn-border)' }}>
            {/* Header / Logo */}
            <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'var(--hsn-accent-weak)' }}>
                        <Shield className="w-[22px] h-[22px]" style={{ color: 'var(--hsn-accent)' }} />
                    </div>
                    <div className="leading-tight">
                        <h1 className="font-semibold text-base tracking-tight" style={{ color: 'var(--hsn-text)' }}>HardSecNet</h1>
                        <span className="text-[11px]" style={{ color: 'var(--hsn-text-muted)' }}>Security command center</span>
                    </div>
                </div>
            </div>

            {/* Client (workspace) switcher */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="mb-1.5 text-[11px] font-medium pl-0.5 flex items-center gap-1.5" style={{ color: 'var(--hsn-text-dim)' }}>
                    <Building2 className="w-3 h-3" /> Client
                </div>
                <select
                    value={activeWorkspace}
                    onChange={e => setActiveWorkspace(e.target.value)}
                    className="hsn-input w-full px-2.5 py-2 text-sm"
                >
                    <option value="">All clients</option>
                    {workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.node_count})</option>)}
                </select>
            </div>

            {/* Node Selector Section */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="mb-2 text-[11px] font-medium pl-0.5" style={{ color: 'var(--hsn-text-dim)' }}>Target system</div>
                <NodeSelector
                    nodes={nodes}
                    selectedNode={selectedNode}
                    onChange={setSelectedNode}
                />
                <button
                    onClick={handleAddNode}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{ border: '1px dashed var(--hsn-border-strong)', color: 'var(--hsn-text-muted)' }}
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Connect new node</span>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-medium pl-2 mb-2" style={{ color: 'var(--hsn-text-dim)' }}>Modules</div>
                <NavItem id="dashboard" label="Mission control" icon={LayoutDashboard} />
                <NavItem id="network" label="Attack surface" icon={Globe} />
                <NavItem id="research" label="Compliance & audit" icon={FileCheck} />
                <NavItem id="connectors" label="Integrations" icon={Plug} />
                <NavItem id="clients" label="Clients" icon={Building2} />
            </nav>

            {/* User Profile / Footer */}
            <div className="p-4" style={{ borderTop: '1px solid var(--hsn-border)' }}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'var(--hsn-accent-weak)', color: 'var(--hsn-accent)' }}>
                        {(username || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--hsn-text)' }}>{username}</div>
                        <div className="text-[11px] truncate capitalize" style={{ color: 'var(--hsn-text-muted)' }}>{userRole?.replace('_', ' ')}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-xs font-medium"
                    style={{ color: 'var(--hsn-danger)', background: 'var(--hsn-danger-weak)' }}
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                </button>
            </div>
        </div>
    );
};

Sidebar.propTypes = {
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

export default Sidebar;
