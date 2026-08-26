import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Slack, MessageSquare, Hash, Webhook, Mail, Database, Ticket, Siren, Send, Check, X } from 'lucide-react';
import { authFetch } from '../../services/api';

const CONNECTORS = [
    { id: 'slack', name: 'Slack', cat: 'Alerting', icon: Slack, kind: 'webhook', field: 'text', placeholder: 'https://hooks.slack.com/services/T0000/B0000/XXXX', desc: 'Post critical findings to a channel via an incoming webhook.' },
    { id: 'teams', name: 'Microsoft Teams', cat: 'Alerting', icon: MessageSquare, kind: 'webhook', field: 'text', placeholder: 'https://yourorg.webhook.office.com/webhookb2/…', desc: 'Send drift and remediation alerts to a Teams channel.' },
    { id: 'discord', name: 'Discord', cat: 'Alerting', icon: Hash, kind: 'webhook', field: 'content', placeholder: 'https://discord.com/api/webhooks/000000/XXXXXXXX', desc: 'Notify a Discord channel via an incoming webhook.' },
    { id: 'webhook', name: 'Generic webhook', cat: 'Alerting', icon: Webhook, kind: 'webhook', field: 'text', placeholder: 'https://your-service.example.com/webhooks/hardsecnet', desc: 'POST a JSON payload to any HTTPS endpoint you control.' },
    { id: 'email', name: 'Email (SMTP)', cat: 'Reporting', icon: Mail, kind: 'roadmap', desc: 'Scheduled compliance reports delivered by email.' },
    { id: 'splunk', name: 'Splunk / SIEM', cat: 'Streaming', icon: Database, kind: 'roadmap', desc: 'Stream findings to your SIEM over HTTP Event Collector.' },
    { id: 'jira', name: 'Jira', cat: 'Ticketing', icon: Ticket, kind: 'roadmap', desc: 'Auto-create issues for non-compliant controls.' },
    { id: 'pagerduty', name: 'PagerDuty', cat: 'On-call', icon: Siren, kind: 'roadmap', desc: 'Page the on-call engineer on critical drift.' },
];

const Connectors = ({ token, userRole }) => {
    const canConfigure = userRole === 'super_admin' || userRole === 'security_admin';
    const [active, setActive] = useState(null);
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState(null);

    const open = (c) => { setActive(c); setUrl(''); setStatus(null); };

    const sendTest = async () => {
        setStatus({ loading: true });
        try {
            const r = await authFetch('/api/integrations/webhook/test', token, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            setStatus({ ok: true, msg: r.message || 'Test notification delivered.' });
        } catch (e) {
            setStatus({ ok: false, msg: e.message || 'Delivery failed.' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--hsn-text)' }}>Integrations</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--hsn-text-muted)' }}>Connect HardSecNet to the tools your team already runs on.</p>
            </div>

            {active && active.kind === 'webhook' && (
                <div className="hsn-card p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <active.icon className="w-5 h-5" style={{ color: 'var(--hsn-accent)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>Connect {active.name}</span>
                        </div>
                        <button onClick={() => setActive(null)} style={{ color: 'var(--hsn-text-muted)' }}><X className="w-4 h-4" /></button>
                    </div>
                    <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Incoming webhook URL</label>
                    <div className="flex gap-2">
                        <input
                            type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                            placeholder={active.placeholder}
                            className="hsn-input hsn-mono flex-1 px-3 py-2 text-sm"
                        />
                        <button onClick={sendTest} disabled={!url || !canConfigure} className="hsn-btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50">
                            <Send className="w-4 h-4" /> Send test
                        </button>
                    </div>
                    {status && !status.loading && (
                        <div className="mt-3 text-sm flex items-center gap-2 px-3 py-2 rounded-lg"
                            style={{ color: status.ok ? 'var(--hsn-ok)' : 'var(--hsn-danger)', background: status.ok ? 'var(--hsn-ok-weak)' : 'var(--hsn-danger-weak)' }}>
                            {status.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}{status.msg}
                        </div>
                    )}
                    {status && status.loading && <div className="mt-3 text-sm" style={{ color: 'var(--hsn-text-muted)' }}>Sending…</div>}
                    <p className="mt-3 text-xs" style={{ color: 'var(--hsn-text-dim)' }}>HardSecNet posts a JSON <span className="hsn-mono">{`{ ${active.field || 'text'} }`}</span> payload to your {active.name} incoming webhook.</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {CONNECTORS.map((c) => {
                    const roadmap = c.kind === 'roadmap';
                    return (
                        <div key={c.id} className="hsn-card p-4 flex flex-col">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: 'var(--hsn-surface-2)' }}>
                                    <c.icon className="w-[18px] h-[18px]" style={{ color: roadmap ? 'var(--hsn-text-muted)' : 'var(--hsn-accent)' }} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium" style={{ color: 'var(--hsn-text)' }}>{c.name}</div>
                                    <div className="text-[11px]" style={{ color: 'var(--hsn-text-dim)' }}>{c.cat}</div>
                                </div>
                                <span className={`hsn-chip ml-auto ${roadmap ? '' : 'hsn-chip-ok'}`} style={roadmap ? { color: 'var(--hsn-text-muted)', background: 'var(--hsn-surface-2)' } : undefined}>
                                    {roadmap ? 'Coming soon' : 'Available'}
                                </span>
                            </div>
                            <p className="text-xs flex-1 leading-relaxed" style={{ color: 'var(--hsn-text-muted)' }}>{c.desc}</p>
                            <button
                                onClick={() => !roadmap && open(c)}
                                disabled={roadmap || !canConfigure}
                                className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                style={roadmap
                                    ? { color: 'var(--hsn-text-dim)', border: '1px solid var(--hsn-border)' }
                                    : { color: 'var(--hsn-accent)', background: 'var(--hsn-accent-weak)' }}
                            >
                                {roadmap ? 'On the roadmap' : 'Connect'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

Connectors.propTypes = {
    token: PropTypes.string,
    userRole: PropTypes.string,
};

export default Connectors;
