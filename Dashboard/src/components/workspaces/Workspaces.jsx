import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Building2, Plus, Copy, Check, RefreshCw, Server } from 'lucide-react';
import { authFetch } from '../../services/api';
import { API_BASE_URL } from '../../constants/config';

const Workspaces = ({ token, userRole, onChange }) => {
    const canManage = userRole === 'super_admin' || userRole === 'security_admin';
    const [list, setList] = useState([]);
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState(null);

    const load = () => authFetch('/api/workspaces', token).then(setList).catch(console.error);
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

    const create = async () => {
        if (!name.trim()) return;
        setCreating(true);
        try {
            await authFetch('/api/workspaces', token, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() }),
            });
            setName(''); load(); if (onChange) onChange();
        } catch (e) { alert(e.message); } finally { setCreating(false); }
    };

    const rotate = async (id) => {
        if (!confirm('Rotate this client’s enrollment token? Existing agents keep working until reinstalled.')) return;
        try { await authFetch(`/api/workspaces/${id}/rotate-token`, token, { method: 'POST' }); load(); }
        catch (e) { alert(e.message); }
    };

    const cmd = (w) => `python hardsecnet_agent.py --server ${API_BASE_URL} --key <AGENT-API-KEY> --workspace-token ${w.enrollment_token} --once`;
    const copy = (w) => { navigator.clipboard?.writeText(cmd(w)); setCopied(w.id); setTimeout(() => setCopied(null), 1500); };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)' }}>Clients</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--hsn-text-muted)' }}>Each client is an isolated workspace. Install an agent with its token and the host reports into that client.</p>
            </div>

            {canManage && (
                <div className="hsn-card p-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} />
                    <input className="hsn-input flex-1 px-3 py-2 text-sm" placeholder="New client name (e.g. Acme Corp)"
                        value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
                    <button onClick={create} disabled={creating || !name.trim()} className="hsn-btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                        <Plus className="w-4 h-4" /> Add client
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {list.map(w => (
                    <div key={w.id} className="hsn-card p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'var(--hsn-accent-weak)' }}>
                                <Building2 className="w-[18px] h-[18px]" style={{ color: 'var(--hsn-accent)' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>{w.name}</div>
                                <div className="text-[11px] flex items-center gap-1" style={{ color: 'var(--hsn-text-dim)' }}>
                                    <Server className="w-3 h-3" />{w.node_count} {w.node_count === 1 ? 'host' : 'hosts'}
                                </div>
                            </div>
                            {canManage && (
                                <button onClick={() => rotate(w.id)} className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{ color: 'var(--hsn-text-muted)', border: '1px solid var(--hsn-border-strong)' }} title="Rotate enrollment token">
                                    <RefreshCw className="w-3.5 h-3.5" /> Rotate
                                </button>
                            )}
                        </div>
                        <div className="text-[11px] mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Enroll a host into this client:</div>
                        <div className="flex items-center gap-2">
                            <code className="hsn-mono flex-1 px-3 py-2 text-[11px] rounded-lg overflow-x-auto whitespace-nowrap"
                                style={{ background: 'var(--hsn-surface-2)', border: '1px solid var(--hsn-border)', color: 'var(--hsn-text-muted)' }}>
                                {cmd(w)}
                            </code>
                            <button onClick={() => copy(w)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                                style={{ color: 'var(--hsn-accent)', background: 'var(--hsn-accent-weak)' }}>
                                {copied === w.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied === w.id ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                ))}
                {list.length === 0 && <div className="hsn-card p-8 text-center text-sm" style={{ color: 'var(--hsn-text-dim)' }}>No clients yet. Add one above.</div>}
            </div>
        </div>
    );
};

Workspaces.propTypes = { token: PropTypes.string, userRole: PropTypes.string, onChange: PropTypes.func };
export default Workspaces;
