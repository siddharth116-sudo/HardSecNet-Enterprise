import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { AlertTriangle, Building2, FileCheck2, Wrench } from 'lucide-react';
import { Section } from '../layout/Section';

/** Mouse-tracking spotlight card — the Linear-style hover treatment. */
function Cell({ className = '', children }: { className?: string; children: ReactNode }) {
  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
  return (
    <div onMouseMove={onMove} className={`card spot p-6 flex flex-col ${className}`}>
      {children}
    </div>
  );
}

function CellHead({ icon: Icon, title, tone = 'accent' }: { icon: typeof Wrench; title: string; tone?: 'accent' | 'warn' }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: tone === 'warn' ? 'var(--warn-weak)' : 'var(--accent-weak)' }}
      >
        <Icon size={17} style={{ color: tone === 'warn' ? 'var(--warn)' : 'var(--accent)' }} aria-hidden />
      </span>
      <h3 className="font-semibold text-[15.5px]" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
    </div>
  );
}

const feed = [
  { warn: true, text: 'Firewall (Private) disabled · FIN-WS-11 · Meridian Finance', t: '2m' },
  { warn: false, text: 'Password policy restored · OPS-SRV-03 · Kalyani Logistics', t: '14m' },
  { warn: false, text: 'Monthly PDF generated · Meridian Finance · 42 machines', t: '38m' },
  { warn: true, text: 'Guest account re-enabled · HR-WS-02 · Kalyani Logistics', t: '2h' },
  { warn: false, text: 'UAC raised to Always-Notify · FIN-WS-08 · Meridian', t: '3h' },
];

export function Bento() {
  return (
    <Section
      id="platform"
      title="Settings drift silently. This is the machine that notices."
      lead="Machines drift out of safe configuration silently. HardSecNet notices, fixes, and proves it — per client."
    >
      <div className="grid md:grid-cols-3 gap-4 auto-rows-[minmax(0,auto)]">
        {/* Large cell: the live drift feed — the product's heartbeat */}
        <Cell className="md:col-span-2 md:row-span-2">
          <CellHead icon={AlertTriangle} title="Drift, caught live" tone="warn" />
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
            Every machine re-audits itself every 10 minutes. The moment a setting changes, it lands here — what
            changed, on which machine, at which client, and how bad it is.
          </p>
          <div className="mono text-[12px] rounded-xl p-4 space-y-2.5 flex-1" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-dim)' }}>live · all clients</span>
            </div>
            {feed.map((f) => (
              <p key={f.text} className="flex items-start gap-2 leading-snug">
                <span style={{ color: f.warn ? 'var(--warn)' : 'var(--accent)' }}>{f.warn ? '✗' : '✓'}</span>
                <span className="flex-1" style={{ color: 'var(--text-muted)' }}>{f.text}</span>
                <span style={{ color: 'var(--text-dim)' }}>{f.t}</span>
              </p>
            ))}
          </div>
        </Cell>

        <Cell>
          <CellHead icon={Wrench} title="One-click remediation" />
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Findings don't just sit there. Approved fixes execute from the dashboard — vetted actions only, never
            arbitrary scripts — and the next audit verifies the fix took.
          </p>
        </Cell>

        <Cell>
          <CellHead icon={Building2} title="Every client, one pane" />
          <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Each client is an isolated workspace with its own enrollment key. Switch clients like browser tabs.
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {['Meridian Finance · 42', 'Kalyani Logistics · 58', 'Arka Software · 28'].map((w) => (
              <span key={w} className="chip mono !text-[11px]">{w}</span>
            ))}
          </div>
        </Cell>

        <Cell>
          <CellHead icon={FileCheck2} title="Evidence on demand" />
          <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            The report your auditor asks for, generated from live machine state — per client, one click, mapped to
            control IDs.
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {['CIS', 'RBI CSF', 'SEBI CSCRF'].map((c) => (
              <span key={c} className="chip mono !text-[11px]">{c}</span>
            ))}
          </div>
        </Cell>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          ['477', 'CIS controls in the engine'],
          ['10 min', 're-audit cadence, forever'],
          ['2 OS', 'agents — Windows & Linux'],
          ['1', 'command to install'],
        ].map(([n, l]) => (
          <div key={l}>
            <p className="display text-[30px] font-bold leading-none" style={{ color: 'var(--text)' }}>{n}</p>
            <p className="text-[12.5px] mt-1.5" style={{ color: 'var(--text-dim)' }}>{l}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
