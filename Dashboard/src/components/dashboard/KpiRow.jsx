import React from 'react';
import PropTypes from 'prop-types';
import { ShieldCheck, Server, AlertTriangle, Sparkles } from 'lucide-react';

const Tile = ({ icon: Icon, label, children, accent }) => (
    <div className="hsn-card p-4">
        <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4" style={{ color: accent || 'var(--hsn-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--hsn-text-muted)' }}>{label}</span>
        </div>
        {children}
    </div>
);
Tile.propTypes = { icon: PropTypes.elementType, label: PropTypes.string, children: PropTypes.node, accent: PropTypes.string };

const scoreTier = (s) => (s > 80 ? { c: 'hsn-chip-ok', l: 'Compliant' } : s > 50 ? { c: 'hsn-chip-warn', l: 'At risk' } : { c: 'hsn-chip-danger', l: 'Critical' });

const KpiRow = ({ score, nodeCount, openFindings, windows, linux }) => {
    const t = scoreTier(score);
    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Tile icon={ShieldCheck} label="Compliance score" accent="var(--hsn-accent)">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)', fontVariantNumeric: 'tabular-nums' }}>{score}</span>
                    <span className="text-base" style={{ color: 'var(--hsn-text-muted)' }}>%</span>
                </div>
                <span className={`hsn-chip ${t.c} mt-2`}>{t.l}</span>
            </Tile>
            <Tile icon={Server} label="Managed nodes">
                <div className="text-2xl font-semibold" style={{ color: 'var(--hsn-text)' }}>{nodeCount}</div>
                <div className="text-[11px] mt-2" style={{ color: 'var(--hsn-text-dim)' }}>{windows} Windows · {linux} Linux</div>
            </Tile>
            <Tile icon={AlertTriangle} label="Open findings" accent={openFindings > 0 ? 'var(--hsn-danger)' : 'var(--hsn-text-muted)'}>
                <div className="text-2xl font-semibold" style={{ color: openFindings > 0 ? 'var(--hsn-danger)' : 'var(--hsn-text)' }}>{openFindings}</div>
                <div className="text-[11px] mt-2" style={{ color: 'var(--hsn-text-dim)' }}>across the fleet</div>
            </Tile>
            <Tile icon={Sparkles} label="AI remediation" accent="var(--hsn-accent)">
                <div className="text-lg font-medium flex items-center gap-2" style={{ color: 'var(--hsn-text)' }}>
                    <span className="hsn-dot" style={{ background: 'var(--hsn-ok)' }}></span>Online
                </div>
                <div className="text-[11px] mt-2" style={{ color: 'var(--hsn-text-dim)' }}>fallback ready</div>
            </Tile>
        </div>
    );
};

KpiRow.propTypes = {
    score: PropTypes.number,
    nodeCount: PropTypes.number,
    openFindings: PropTypes.number,
    windows: PropTypes.number,
    linux: PropTypes.number,
};

export default KpiRow;
