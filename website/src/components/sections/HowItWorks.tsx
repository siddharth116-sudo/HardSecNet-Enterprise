import { Download, FileCheck2, Radar, ShieldCheck } from 'lucide-react';
import { Section } from '../layout/Section';

/** Numbered because this genuinely is a sequence — install to evidence. */
const steps = [
  {
    icon: Download,
    title: 'Install one file',
    text: 'One command per machine, Windows or Linux. No reboot, no drivers, nothing else to install on the endpoint.',
    detail: '> hardsecnet-agent --enroll <client>',
  },
  {
    icon: Radar,
    title: 'It audits continuously',
    text: 'Every 10 minutes each machine re-checks itself against its CIS-based baseline and reports in over an encrypted channel.',
    detail: 'firewall · accounts · policies · services',
  },
  {
    icon: ShieldCheck,
    title: 'Drift is caught and fixed',
    text: 'A changed setting becomes a severity-tagged finding within minutes. Fix it with one approved click; the next audit verifies it.',
    detail: 'detect → approve → remediate → verify',
  },
  {
    icon: FileCheck2,
    title: 'Prove it on demand',
    text: 'Generate the per-client compliance report whenever anyone asks — auditor, regulator, or the client themselves.',
    detail: 'PDF · per client · from live state',
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      title="From one command to audit-ready proof"
      tinted
    >
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <li key={s.title} className="card p-6 relative">
            <span
              className="mono absolute top-5 right-5 text-[12px] font-semibold"
              style={{ color: 'var(--text-dim)' }}
              aria-hidden
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'var(--accent-weak)' }}
            >
              <s.icon size={19} style={{ color: 'var(--accent)' }} aria-hidden />
            </span>
            <h3 className="font-semibold text-[15.5px] mb-2" style={{ color: 'var(--text)' }}>
              {s.title}
            </h3>
            <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              {s.text}
            </p>
            <p
              className="mono text-[11px] px-2.5 py-1.5 rounded-lg inline-block"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--accent-strong)' }}
            >
              {s.detail}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
