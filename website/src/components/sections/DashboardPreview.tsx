import { useState } from 'react';
import { Section } from '../layout/Section';
import { ActivityFeed } from '../dashboard/ActivityFeed';
import { FindingsTable } from '../dashboard/FindingsTable';
import { TrendChart } from '../dashboard/TrendChart';
import { kpis, roles, type Role } from '../../data/dashboard';

export function DashboardPreview() {
  const [role, setRole] = useState<Role>('admin');
  const active = roles.find((r) => r.id === role)!;

  return (
    <Section
      id="dashboard"
      title="This is what your Monday morning looks like"
      lead="The real product, interactive, with sample data."
      tinted
    >
      {/* Role switcher — demonstrates access control, not just decoration */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="mono text-[11px] uppercase tracking-wider mr-1" style={{ color: 'var(--text-dim)' }}>
          Viewing as
        </span>
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            aria-pressed={role === r.id}
            className="chip !text-[12px] transition-colors"
            style={
              role === r.id
                ? { background: 'var(--accent-weak)', color: 'var(--accent-strong)', borderColor: 'transparent' }
                : undefined
            }
          >
            {r.label}
          </button>
        ))}
        <span className="text-[12px] w-full sm:w-auto" style={{ color: 'var(--text-dim)' }}>
          {active.hint}
        </span>
      </div>

      <div className="mac">
      <div className="mac-lid">
      <div className="mac-cam" aria-hidden />
      <div className="mac-screen">
      <div className="app-titlebar" aria-hidden>
        <i /><i /><i />
        <span className="mono text-[11px] ml-2" style={{ color: 'var(--text-dim)' }}>console.hardsecnet.in — Meridian Finance</span>
      </div>
      <div className="app-body">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-[12px] mb-1" style={{ color: 'var(--text-dim)' }}>
              {k.label}
            </p>
            <p className="display text-[28px] font-bold leading-none mb-1.5" style={{ color: 'var(--text)' }}>
              {k.value}
            </p>
            <p className="text-[11.5px]" style={{ color: k.deltaGood ? 'var(--ok)' : 'var(--danger)' }}>
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        <TrendChart />
        <ActivityFeed />
      </div>

      <FindingsTable role={role} />
      </div>
      </div>
      </div>
      <div className="mac-base" aria-hidden />
      </div>

      <p className="mono text-[11px] mt-5 text-center max-w-[900px] mx-auto" style={{ color: 'var(--text-dim)' }}>
        Sample data shown. Client names are fictional; the interface and workflow are the real product's.
      </p>
    </Section>
  );
}
