import React from 'react';
import PropTypes from 'prop-types';
import { Brain } from 'lucide-react';

const AIInsights = ({ summary }) => {
    return (
        <div className="md:col-span-2 hsn-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'var(--hsn-accent-weak)' }}>
                    <Brain className="w-4 h-4" style={{ color: 'var(--hsn-accent)' }} />
                </div>
                <h3 className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>AI remediation</h3>
                <span className="hsn-chip hsn-chip-accent ml-auto">
                    <span className="hsn-dot" style={{ background: 'var(--hsn-accent)' }}></span>Live
                </span>
            </div>
            <div
                className="text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto max-h-[160px]"
                style={{ color: 'var(--hsn-text-muted)' }}
            >
                {summary || 'Run an audit to generate AI-guided remediation.'}
            </div>
        </div>
    );
};

AIInsights.propTypes = {
    summary: PropTypes.string
};

export default AIInsights;
