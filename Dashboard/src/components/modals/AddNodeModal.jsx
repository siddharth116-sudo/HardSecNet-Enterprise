import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, X } from 'lucide-react';
import { authFetch } from '../../services/api';

const AddNodeModal = ({ onClose, onSuccess, token }) => {
    const [newNode, setNewNode] = useState({ type: 'sim', ip: '', user: '', pass: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = newNode.type === 'sim' ? {} : { ip: newNode.ip, username: newNode.user, password: newNode.pass };

            const data = await authFetch('/api/add-node', token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            alert(data.message);
            onSuccess(newNode.type === 'sim' ? null : newNode.ip);
            onClose();
        } catch (err) {
            alert("Failed to add node: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100]" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="hsn-card p-6 w-[28rem]" style={{ background: 'var(--hsn-surface)' }}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--hsn-text)' }}>
                        <Plus className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} /> Add managed node
                    </h3>
                    <button onClick={onClose} style={{ color: 'var(--hsn-text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs mb-2" style={{ color: 'var(--hsn-text-muted)' }}>Node environment</label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {['sim', 'remote'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setNewNode({ ...newNode, type: t })}
                                    className="p-2.5 rounded-lg text-sm font-medium transition-colors"
                                    style={newNode.type === t
                                        ? { background: 'var(--hsn-accent-weak)', border: '1px solid var(--hsn-accent)', color: 'var(--hsn-text)' }
                                        : { background: 'var(--hsn-surface-2)', border: '1px solid var(--hsn-border)', color: 'var(--hsn-text-muted)' }}
                                >
                                    {t === 'sim' ? 'Simulation' : 'Remote (WinRM)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {newNode.type === 'remote' && (
                        <div className="space-y-3 p-4 rounded-lg" style={{ background: 'var(--hsn-surface-2)', border: '1px solid var(--hsn-border)' }}>
                            <div>
                                <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>IP address</label>
                                <input type="text" className="hsn-input hsn-mono w-full px-3 py-2 text-sm" placeholder="192.168.1.50" value={newNode.ip} onChange={e => setNewNode({ ...newNode, ip: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Local admin user</label>
                                <input type="text" className="hsn-input w-full px-3 py-2 text-sm" placeholder="HardSecAdmin" value={newNode.user} onChange={e => setNewNode({ ...newNode, user: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Password</label>
                                <input type="password" className="hsn-input w-full px-3 py-2 text-sm" placeholder="••••••••••" value={newNode.pass} onChange={e => setNewNode({ ...newNode, pass: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {newNode.type === 'sim' && <p className="text-xs" style={{ color: 'var(--hsn-text-dim)' }}>Creates a mock Windows Server node with simulated findings for demonstration.</p>}

                    <div className="flex justify-end gap-2.5 mt-5 pt-4" style={{ borderTop: '1px solid var(--hsn-border)' }}>
                        <button onClick={onClose} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ color: 'var(--hsn-text-muted)' }}>Cancel</button>
                        <button onClick={handleSubmit} className="hsn-btn-primary px-5 py-2 text-sm">Add node</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

AddNodeModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired
};

export default AddNodeModal;
