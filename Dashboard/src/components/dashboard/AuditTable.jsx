import React from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, CheckCircle, AlertTriangle, Square, CheckSquare } from 'lucide-react';

// Mapping Audit Check Names to Hardener Target IDs
// Mapping Audit Check Names to Hardener Target IDs
const CHECK_MAPPING = {
    "Firewall Domain Profile": "Firewall",
    "Firewall Private Profile": "Firewall",
    "Firewall Public Profile": "Firewall",
    "Minimum Password Length": "Password",
    "Guest Account Status": "Guest",
    "Account Lockout Threshold": "Lockout",
    "User Account Control (UAC)": "UAC",
    "Untrusted Font Blocking": "FontBlocking"
};

const AuditTable = ({ checks, selectedFixes = [], setSelectedFixes = () => { }, userRole }) => {

    const canRemediate = userRole === 'super_admin' || userRole === 'security_admin';

    const toggleSelection = (checkName) => {
        if (!canRemediate) return;
        const targetId = CHECK_MAPPING[checkName];
        if (!targetId) return; // Unknown check, can't fix

        if (selectedFixes.includes(targetId)) {
            setSelectedFixes(selectedFixes.filter(id => id !== targetId));
        } else {
            setSelectedFixes([...selectedFixes, targetId]);
        }
    };

    const total = checks?.length || 0;
    const failing = checks?.filter(c => c.Status !== 'Compliant').length || 0;

    return (
        <div className="hsn-card overflow-hidden">
            <div className="px-5 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>Security controls</h3>
                    {total > 0 && (
                        <span className="text-xs" style={{ color: 'var(--hsn-text-muted)' }}>
                            {failing} of {total} need attention
                        </span>
                    )}
                </div>
                {selectedFixes.length > 0 && (
                    <span className="hsn-chip hsn-chip-accent">{selectedFixes.length} selected to fix</span>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-[11px]" style={{ color: 'var(--hsn-text-dim)' }}>
                            <th className="px-5 py-2.5 w-10 font-medium"></th>
                            <th className="px-5 py-2.5 font-medium">Control</th>
                            <th className="px-5 py-2.5 font-medium">Current value</th>
                            <th className="px-5 py-2.5 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {checks?.map((check, idx) => {
                            const targetId = CHECK_MAPPING[check.Name];
                            const isSelected = targetId && selectedFixes.includes(targetId);
                            const isFixable = !!targetId;

                            return (
                                <tr key={idx} style={{ borderTop: '1px solid var(--hsn-border)', background: isSelected ? 'var(--hsn-accent-weak)' : 'transparent' }}>
                                    <td className="px-5 py-3">
                                        {isFixable && canRemediate ? (
                                            <button onClick={() => toggleSelection(check.Name)} className="transition-colors" style={{ color: isSelected ? 'var(--hsn-accent)' : 'var(--hsn-text-dim)' }}>
                                                {isSelected ? <CheckSquare className="w-[18px] h-[18px]" /> : <Square className="w-[18px] h-[18px]" />}
                                            </button>
                                        ) : (
                                            <span style={{ color: 'var(--hsn-text-dim)' }}>·</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--hsn-text)' }}>
                                        {check.Name}
                                        {check.CVE && (
                                            <div className="flex items-center mt-1 text-xs" style={{ color: 'var(--hsn-danger)' }}>
                                                <ShieldAlert className="w-3 h-3 mr-1" />
                                                {check.CVE.CVE}: {check.CVE.Name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 hsn-mono text-xs max-w-xs truncate" style={{ color: 'var(--hsn-text-muted)' }} title={check.Value}>
                                        {check.Value}
                                    </td>
                                    <td className="px-5 py-3">
                                        {check.Status === 'Compliant' ? (
                                            <span className="hsn-chip hsn-chip-ok"><CheckCircle className="w-3 h-3" /> Compliant</span>
                                        ) : (
                                            <span className="hsn-chip hsn-chip-danger"><AlertTriangle className="w-3 h-3" /> Action required</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

AuditTable.propTypes = {
    checks: PropTypes.arrayOf(PropTypes.shape({
        Name: PropTypes.string.isRequired,
        Value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        Status: PropTypes.string.isRequired,
        CVE: PropTypes.object
    })),
    selectedFixes: PropTypes.array,
    setSelectedFixes: PropTypes.func,
    userRole: PropTypes.string
};

export default AuditTable;
