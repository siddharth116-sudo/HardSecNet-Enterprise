import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Terminal, Activity, Wifi } from 'lucide-react';

const TerminalView = ({ logs }) => {
    const endRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="h-full flex flex-col overflow-hidden hsn-mono text-xs" style={{ background: 'var(--hsn-bg-soft)' }}>
            {/* Header */}
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="flex items-center gap-2 font-medium text-[11px]" style={{ color: 'var(--hsn-text)' }}>
                    <Terminal className="w-3.5 h-3.5" style={{ color: 'var(--hsn-accent)' }} />
                    <span>Live activity</span>
                </div>
                <span className="hsn-dot" style={{ background: 'var(--hsn-ok)' }}></span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2" style={{ borderBottom: '1px solid var(--hsn-border)' }}>
                <div className="p-2.5 flex items-center justify-between" style={{ borderRight: '1px solid var(--hsn-border)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--hsn-text-dim)' }}>Net flow</span>
                    <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--hsn-text-muted)' }} />
                </div>
                <div className="p-2.5 flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: 'var(--hsn-text-dim)' }}>Heartbeat</span>
                    <Activity className="w-3.5 h-3.5" style={{ color: 'var(--hsn-ok)' }} />
                </div>
            </div>

            {/* Log Area */}
            <div className="flex-1 overflow-y-auto space-y-0.5 p-3 leading-relaxed" style={{ color: 'var(--hsn-text-muted)' }}>
                {logs.map((log, i) => (
                    <div key={i} className="pl-2 py-0.5 break-all" style={{ borderLeft: '2px solid var(--hsn-border)' }}>
                        <span className="mr-2 text-[10px] select-none" style={{ color: 'var(--hsn-text-dim)' }}>{new Date().toLocaleTimeString()}</span>
                        {log}
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--hsn-text-dim)' }}>
                        <Activity className="w-7 h-7" />
                        <span>Waiting for activity…</span>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Status Footer */}
            <div className="p-2 text-[10px] text-center" style={{ borderTop: '1px solid var(--hsn-border)', color: 'var(--hsn-text-dim)' }}>
                Secure channel · mTLS
            </div>
        </div>
    );
};

TerminalView.propTypes = {
    logs: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default TerminalView;
