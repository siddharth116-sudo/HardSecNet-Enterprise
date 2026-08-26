import React from 'react';
import PropTypes from 'prop-types';
import { FileText, Download, Calendar, Server, TerminalSquare, Archive } from 'lucide-react';
import { API_BASE_URL } from '../../constants/config';

const typeLabel = (t) => {
    if (!t) return 'Audit';
    if (t.includes('cis')) return 'CIS Windows';
    if (t.includes('linux')) return 'Linux';
    if (t.includes('agent')) return 'Agent report';
    return 'Audit';
};

const scoreChip = (s) => (s > 80 ? 'hsn-chip-ok' : s > 50 ? 'hsn-chip-warn' : 'hsn-chip-danger');

const Stat = ({ label, value, sub }) => (
    <div className="hsn-card p-4">
        <div className="text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>{label}</div>
        <div className="text-2xl font-semibold" style={{ color: 'var(--hsn-text)' }}>{value}</div>
        {sub && <div className="text-[11px] mt-1.5" style={{ color: 'var(--hsn-text-dim)' }}>{sub}</div>}
    </div>
);
Stat.propTypes = { label: PropTypes.string, value: PropTypes.node, sub: PropTypes.string };

const ComplianceHistory = ({ history = [] }) => {
    const reports = Array.isArray(history) ? history : [];
    const hosts = new Set(reports.map(r => r.hostname).filter(Boolean));
    const latest = reports[0];

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                <Stat label="Reports archived" value={reports.length} sub="last 50 audits" />
                <Stat label="Nodes covered" value={hosts.size || '—'} sub="distinct hosts" />
                <Stat label="Most recent audit" value={latest ? `${latest.score}%` : '—'}
                      sub={latest ? `${latest.hostname} · ${typeLabel(latest.type)}` : 'no audits yet'} />
            </div>

            <div className="hsn-card overflow-hidden">
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                    <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} />
                        <h3 className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>Audit report archive</h3>
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--hsn-text-dim)' }}>{reports.length} reports</span>
                </div>

                {reports.length === 0 && (
                    <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--hsn-text-dim)' }}>
                        No audit reports yet. Run an audit to start the archive.
                    </div>
                )}

                {reports.map((item, idx) => {
                    const isLinux = (item.type || '').includes('linux');
                    return (
                        <div key={item.id || idx} className="flex items-center gap-4 px-5 py-3" style={{ borderTop: idx ? '1px solid var(--hsn-border)' : 'none' }}>
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'var(--hsn-surface-2)' }}>
                                {isLinux ? <TerminalSquare className="w-[18px] h-[18px]" style={{ color: '#ec835a' }} />
                                    : <Server className="w-[18px] h-[18px]" style={{ color: 'var(--hsn-accent)' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>{item.hostname || 'Unknown host'}</div>
                                <div className="text-[11px] flex items-center gap-3 mt-0.5" style={{ color: 'var(--hsn-text-dim)' }}>
                                    <span className="hsn-chip" style={{ color: 'var(--hsn-text-muted)', background: 'var(--hsn-surface-2)' }}>{typeLabel(item.type)}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.timestamp || '—'}</span>
                                    {typeof item.failing === 'number' && <span>{item.failing} failing of {item.total}</span>}
                                </div>
                            </div>
                            <span className={`hsn-chip ${scoreChip(item.score)}`}>{item.score}%</span>
                            <button
                                onClick={() => window.open(`${API_BASE_URL}/api/generate-pdf${item.id ? `?id=${item.id}` : ''}`, '_blank')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ color: 'var(--hsn-text-muted)', border: '1px solid var(--hsn-border-strong)' }}
                                title="Download PDF report"
                            >
                                <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

ComplianceHistory.propTypes = { history: PropTypes.array };
export default ComplianceHistory;
