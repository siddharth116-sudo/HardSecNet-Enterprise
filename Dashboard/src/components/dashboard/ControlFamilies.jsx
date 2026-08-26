import React from 'react';
import PropTypes from 'prop-types';

// Group a flat check list into security control families and score each.
const FAMILY_RULES = [
    { key: 'Firewall & network', test: n => /firewall|smb|rdp|port|ufw|nftables/i.test(n) },
    { key: 'Account & password', test: n => /password|lockout|account|login|empty password/i.test(n) },
    { key: 'Access control (UAC)', test: n => /uac|user account control|guest|admin/i.test(n) },
    { key: 'SSH & remote access', test: n => /ssh|permitroot|remote/i.test(n) },
    { key: 'Patching & updates', test: n => /update|patch|upgrade/i.test(n) },
    { key: 'Admin templates (CIS)', test: n => /^\[\d+(\.\d+)+\]/.test(n) },
];

const familyFor = (name) => {
    for (const r of FAMILY_RULES) if (r.test(name || '')) return r.key;
    return 'System & audit';
};

const barColor = (pct) =>
    pct > 80 ? 'var(--hsn-ok)' : pct > 50 ? 'var(--hsn-warn)' : 'var(--hsn-danger)';

const ControlFamilies = ({ checks = [] }) => {
    const groups = {};
    checks.forEach((c) => {
        const fam = familyFor(c.Name);
        if (!groups[fam]) groups[fam] = { total: 0, pass: 0 };
        groups[fam].total += 1;
        if (c.Status === 'Compliant') groups[fam].pass += 1;
    });

    const rows = Object.entries(groups)
        .map(([name, g]) => ({ name, pct: Math.round((g.pass / g.total) * 100), total: g.total }))
        .sort((a, b) => a.pct - b.pct);

    return (
        <div className="hsn-card p-5">
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--hsn-text)' }}>Compliance by control family</h3>
            {rows.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--hsn-text-dim)' }}>Run an audit to see a breakdown.</p>
            )}
            <div className="flex flex-col gap-3.5">
                {rows.map((r) => (
                    <div key={r.name}>
                        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>
                            <span>{r.name} <span style={{ color: 'var(--hsn-text-dim)' }}>· {r.total}</span></span>
                            <span style={{ color: 'var(--hsn-text)' }}>{r.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hsn-surface-2)' }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, background: barColor(r.pct) }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

ControlFamilies.propTypes = { checks: PropTypes.array };
export default ControlFamilies;
