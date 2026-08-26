import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Server, Laptop, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { authFetch } from '../../services/api';

const AttackSurfaceMap = () => {
    const [nodes, setNodes] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetchTopology = async () => {
            try {
                const nodeList = await authFetch('/api/nodes', localStorage.getItem('token'));
                const details = await Promise.all(nodeList.map(async (n) => {
                    if (n === 'LOCALHOST') {
                        try {
                            const d = await authFetch(`/api/node-data/${n}`, localStorage.getItem('token'));
                            const checks = d.Checks || [];
                            const fail = checks.filter(c => c.Status !== 'Compliant').length;
                            return { name: n, status: fail > 0 ? 'vulnerable' : 'secure', ip: '127.0.0.1', issues: fail };
                        } catch { return { name: n, status: 'secure', ip: '127.0.0.1', issues: 0 }; }
                    }
                    try {
                        const d = await authFetch(`/api/node-data/${n}`, localStorage.getItem('token'));
                        const checks = d.Checks || [];
                        const fail = checks.filter(c => c.Status !== 'Compliant').length;
                        return { name: n, status: fail > 0 ? 'vulnerable' : 'secure', ip: d.IP || '—', issues: fail };
                    } catch { return { name: n, status: 'offline', ip: '—', issues: 0 }; }
                }));
                setNodes(details);
            } catch (e) { console.error('Topology error', e); }
        };
        fetchTopology();
        const interval = setInterval(fetchTopology, 10000);
        return () => clearInterval(interval);
    }, []);

    const vuln = nodes.filter(n => n.status === 'vulnerable').length;
    const secure = nodes.filter(n => n.status === 'secure').length;
    const orbit = nodes.filter(n => n.name !== 'LOCALHOST');

    const stat = (label, value, color, Icon) => (
        <div className="hsn-card p-4 flex items-center justify-between">
            <div>
                <div className="text-xs" style={{ color: 'var(--hsn-text-muted)' }}>{label}</div>
                <div className="text-2xl font-semibold mt-1" style={{ color }}>{value}</div>
            </div>
            <Icon className="w-6 h-6" style={{ color: 'var(--hsn-text-dim)' }} />
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stat('Total assets', nodes.length, 'var(--hsn-text)', Globe)}
                {stat('Vulnerable nodes', vuln, vuln ? 'var(--hsn-danger)' : 'var(--hsn-text)', AlertTriangle)}
                {stat('Secure nodes', secure, 'var(--hsn-ok)', CheckCircle)}
            </div>

            <div className="hsn-card relative overflow-hidden flex-1 min-h-[460px] flex items-center justify-center">
                <div className="hsn-grid-bg absolute inset-0 pointer-events-none" aria-hidden="true"></div>

                {/* Central hub */}
                <div className="relative z-10 flex flex-col items-center cursor-default">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--hsn-surface)', border: '2px solid var(--hsn-accent)' }}>
                        <Server className="w-8 h-8" style={{ color: 'var(--hsn-accent)' }} />
                    </div>
                    <div className="mt-3 px-2.5 py-1 rounded-md text-xs font-medium hsn-mono"
                        style={{ background: 'var(--hsn-surface)', border: '1px solid var(--hsn-border)', color: 'var(--hsn-text-muted)' }}>
                        HQ server
                    </div>
                </div>

                {/* Orbiting nodes */}
                {orbit.map((node, idx) => {
                    const total = orbit.length || 1;
                    const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                    const x = Math.cos(angle) * 210;
                    const y = Math.sin(angle) * 180;
                    const isVuln = node.status === 'vulnerable';
                    const isOffline = node.status === 'offline';
                    const color = isVuln ? 'var(--hsn-danger)' : isOffline ? 'var(--hsn-text-dim)' : 'var(--hsn-ok)';
                    const bg = isVuln ? 'var(--hsn-danger-weak)' : isOffline ? 'var(--hsn-surface-2)' : 'var(--hsn-ok-weak)';
                    return (
                        <div key={node.name} className="absolute flex flex-col items-center cursor-pointer z-10"
                            style={{ transform: `translate(${x}px, ${y}px)` }} onClick={() => setSelected(node)}>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                                style={{ background: bg, border: `1.5px solid ${color}` }}>
                                <Laptop className="w-6 h-6" style={{ color }} />
                                {isVuln && (
                                    <span className="absolute -top-1.5 -right-1.5 text-white text-[10px] font-medium w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: 'var(--hsn-danger)' }}>{node.issues}</span>
                                )}
                            </div>
                            <div className="mt-2 px-2 py-0.5 rounded-md text-[11px] font-medium"
                                style={{ background: 'var(--hsn-surface)', border: '1px solid var(--hsn-border)', color: 'var(--hsn-text)' }}>
                                {node.name}
                            </div>
                            <div className="text-[10px] mt-0.5 hsn-mono" style={{ color: 'var(--hsn-text-dim)' }}>{node.ip}</div>
                        </div>
                    );
                })}
            </div>

            {selected && (
                <div className="hsn-card p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--hsn-text)' }}>
                                <Laptop className="w-4 h-4" style={{ color: 'var(--hsn-text-muted)' }} />{selected.name}
                            </h3>
                            <div className="text-xs mt-1 hsn-mono" style={{ color: 'var(--hsn-text-dim)' }}>IP {selected.ip}</div>
                        </div>
                        <span className={`hsn-chip ${selected.status === 'vulnerable' ? 'hsn-chip-danger' : selected.status === 'offline' ? '' : 'hsn-chip-ok'}`}
                            style={selected.status === 'offline' ? { color: 'var(--hsn-text-muted)', background: 'var(--hsn-surface-2)' } : undefined}>
                            {selected.status}
                        </span>
                    </div>
                    <div className="mt-3 p-3 rounded-lg text-sm flex items-center gap-2"
                        style={{ background: 'var(--hsn-surface-2)', color: selected.status === 'vulnerable' ? 'var(--hsn-danger)' : 'var(--hsn-ok)' }}>
                        {selected.status === 'vulnerable'
                            ? (<><AlertTriangle className="w-4 h-4" />{selected.issues} controls need attention — run Auto-harden on this node.</>)
                            : (<><CheckCircle className="w-4 h-4" />Compliant with the security baseline.</>)}
                    </div>
                </div>
            )}
        </div>
    );
};

AttackSurfaceMap.propTypes = { userRole: PropTypes.string };
export default AttackSurfaceMap;
