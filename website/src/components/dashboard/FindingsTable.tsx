import { useState } from 'react';
import { Download, Wrench } from 'lucide-react';
import { findings, type Role, type Severity } from '../../data/dashboard';

const sevStyle: Record<Severity, { fg: string; bg: string }> = {
  critical: { fg: 'var(--danger)', bg: 'var(--danger-weak)' },
  high: { fg: 'var(--warn)', bg: 'var(--warn-weak)' },
  medium: { fg: 'var(--info)', bg: 'var(--info-weak)' },
  low: { fg: 'var(--text-muted)', bg: 'var(--surface-2)' },
};

const filters: ('all' | Severity)[] = ['all', 'critical', 'high', 'medium', 'low'];

export function FindingsTable({ role }: { role: Role }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const rows = findings.filter((f) => filter === 'all' || f.severity === filter);

  return (
    <div className="card p-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
          Findings
        </span>
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter findings by severity">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className="chip !text-[11px] capitalize transition-colors"
              style={
                filter === f
                  ? { background: 'var(--accent-weak)', color: 'var(--accent-strong)', borderColor: 'transparent' }
                  : undefined
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left" style={{ minWidth: 640 }}>
          <thead>
            <tr className="mono text-[10.5px] uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
              <th className="pb-2.5 pr-4 font-medium">Severity</th>
              <th className="pb-2.5 pr-4 font-medium">Check</th>
              <th className="pb-2.5 pr-4 font-medium">Machine</th>
              <th className="pb-2.5 pr-4 font-medium">Client</th>
              <th className="pb-2.5 pr-4 font-medium">Status</th>
              <th className="pb-2.5 font-medium">{role === 'viewer' ? '' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="text-[12.5px]">
            {rows.map((f) => (
              <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="py-2.5 pr-4">
                  <span className="chip !text-[10.5px] capitalize" style={{ background: sevStyle[f.severity].bg, color: sevStyle[f.severity].fg, border: 'none' }}>
                    {f.severity}
                  </span>
                </td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--text)' }}>
                  {f.check}
                  <span className="mono block text-[10.5px]" style={{ color: 'var(--text-dim)' }}>
                    {f.cisId} · {f.detected}
                  </span>
                </td>
                <td className="py-2.5 pr-4 mono text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                  {f.machine}
                </td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--text-muted)' }}>
                  {f.client}
                </td>
                <td className="py-2.5 pr-4">
                  <span style={{ color: f.status === 'open' ? 'var(--warn)' : 'var(--ok)' }}>
                    {f.status === 'open' ? 'Open' : 'Remediated'}
                  </span>
                </td>
                <td className="py-2.5">
                  {role === 'admin' && f.status === 'open' && (
                    <button type="button" className="chip !text-[11px]" style={{ color: 'var(--accent-strong)' }}>
                      <Wrench size={11} aria-hidden /> Remediate
                    </button>
                  )}
                  {role === 'auditor' && (
                    <button type="button" className="chip !text-[11px]" style={{ color: 'var(--info)' }}>
                      <Download size={11} aria-hidden /> Evidence
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
