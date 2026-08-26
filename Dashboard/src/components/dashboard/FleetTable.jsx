import React from 'react';
import PropTypes from 'prop-types';
import { Server, Monitor, TerminalSquare } from 'lucide-react';

const tier = (score) =>
    score > 80 ? { chip: 'hsn-chip-ok', label: 'Compliant', color: 'var(--hsn-ok)' }
        : score > 50 ? { chip: 'hsn-chip-warn', label: 'At risk', color: 'var(--hsn-warn)' }
            : { chip: 'hsn-chip-danger', label: 'Critical', color: 'var(--hsn-danger)' };

const OsIcon = ({ os }) => {
    if (os === 'linux') return <TerminalSquare className="w-[18px] h-[18px]" style={{ color: '#ec835a' }} />;
    if (os === 'server') return <Server className="w-[18px] h-[18px]" style={{ color: 'var(--hsn-accent)' }} />;
    return <Monitor className="w-[18px] h-[18px]" style={{ color: 'var(--hsn-accent)' }} />;
};
OsIcon.propTypes = { os: PropTypes.string };

const FleetTable = ({ fleet = [], selectedNode, onSelect = () => {} }) => {
    return (
        <div className="hsn-card overflow-hidden">
            <div className="px-5 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <h3 className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>Managed fleet</h3>
                <span className="text-[11px]" style={{ color: 'var(--hsn-text-dim)' }}>{fleet.length} {fleet.length === 1 ? 'node' : 'nodes'}</span>
            </div>
            {fleet.map((n) => {
                const audited = n.total > 0;
                const t = audited ? tier(n.score) : { chip: 'hsn-chip', label: 'Pending audit', color: 'var(--hsn-border-strong)' };
                const active = n.hostname === selectedNode;
                return (
                    <button
                        key={n.hostname}
                        onClick={() => onSelect(n.hostname)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                        style={{ borderTop: '1px solid var(--hsn-border)', background: active ? 'var(--hsn-accent-weak)' : 'transparent' }}
                    >
                        <OsIcon os={n.os} />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm" style={{ color: 'var(--hsn-text)' }}>{n.hostname}</div>
                            <div className="text-[11px] hsn-mono" style={{ color: 'var(--hsn-text-dim)' }}>
                                {n.os === 'linux' ? 'Linux' : 'Windows'} · {n.total} controls · {n.failing} failing
                            </div>
                        </div>
                        <div className="w-28 hidden sm:block">
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hsn-surface-2)' }}>
                                <div className="h-full rounded-full" style={{ width: `${audited ? n.score : 0}%`, background: t.color }}></div>
                            </div>
                        </div>
                        <div className="w-11 text-right text-sm hsn-mono" style={{ color: audited ? 'var(--hsn-text)' : 'var(--hsn-text-dim)' }}>{audited ? `${n.score}%` : '—'}</div>
                        <span className={`hsn-chip ${t.chip}`} style={audited ? undefined : { color: 'var(--hsn-text-muted)', background: 'var(--hsn-surface-2)' }}>{t.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

FleetTable.propTypes = {
    fleet: PropTypes.array,
    selectedNode: PropTypes.string,
    onSelect: PropTypes.func,
};

export default FleetTable;
