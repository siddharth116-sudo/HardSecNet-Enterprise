import React from 'react';
import PropTypes from 'prop-types';

const ScoreCard = ({ score }) => {
    const tier = score > 80
        ? { color: 'var(--hsn-ok)', chip: 'hsn-chip-ok', label: 'Compliant' }
        : score > 50
            ? { color: 'var(--hsn-warn)', chip: 'hsn-chip-warn', label: 'Needs attention' }
            : { color: 'var(--hsn-danger)', chip: 'hsn-chip-danger', label: 'At risk' };
    return (
        <div className="hsn-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium" style={{ color: 'var(--hsn-text-muted)' }}>Compliance score</h3>
                <span className={`hsn-chip ${tier.chip}`}>{tier.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-5xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)', fontVariantNumeric: 'tabular-nums' }}>{score}</span>
                <span className="text-xl" style={{ color: 'var(--hsn-text-muted)' }}>%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--hsn-surface-2)' }}>
                <div className="h-full transition-all duration-1000" style={{ width: `${score}%`, background: tier.color }}></div>
            </div>
        </div>
    );
};

ScoreCard.propTypes = {
    score: PropTypes.number.isRequired
};

export default ScoreCard;
