import { AlertTriangle, FileCheck2, PlusCircle, Wrench } from 'lucide-react';
import { activity, type ActivityEvent } from '../../data/dashboard';

const kindStyle: Record<ActivityEvent['kind'], { icon: typeof Wrench; color: string; bg: string }> = {
  drift: { icon: AlertTriangle, color: 'var(--warn)', bg: 'var(--warn-weak)' },
  remediated: { icon: Wrench, color: 'var(--ok)', bg: 'var(--ok-weak)' },
  report: { icon: FileCheck2, color: 'var(--info)', bg: 'var(--info-weak)' },
  enrolled: { icon: PlusCircle, color: 'var(--text-muted)', bg: 'var(--surface-2)' },
};

export function ActivityFeed() {
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--accent)' }} aria-hidden />
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
          Live activity
        </span>
      </div>
      <ul className="space-y-3.5">
        {activity.map((e) => {
          const s = kindStyle[e.kind];
          return (
            <li key={e.text} className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <s.icon size={13} style={{ color: s.color }} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {e.text}
                </p>
                <p className="mono text-[10.5px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {e.time}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
