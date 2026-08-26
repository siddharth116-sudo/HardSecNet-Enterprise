import { Eye, ScrollText, Server } from 'lucide-react';
import { Section } from '../layout/Section';

const items = [
  {
    icon: Server,
    title: 'Your data stays on your infrastructure',
    text: 'Runs where you decide — a server in your office, your own cloud account, or a private instance operated for you. Fully air-gapped operation supported; there is no shared multi-company cloud your security data disappears into.',
  },
  {
    icon: Eye,
    title: 'The agent sends check results — nothing else',
    text: 'Setting names, values, pass or fail. Never files, never passwords, never screenshots. The agent is a single dependency-free Python file — your engineers can read every line and verify that claim before installing it.',
  },
  {
    icon: ScrollText,
    title: 'Everything leaves a trail',
    text: 'Every login, remediation and report generation is logged with who, what and when — CEF-format activity logs plus retained audit history. "Who fixed this, on whose authority?" is one search away.',
  },
];

export function SecurityTrust() {
  return (
    <Section
      id="security"
      title="Built like the security tool it claims to be"
      lead="An honest description of the trust boundary — what we hold, what we never see, and what gets logged."
      tinted
    >
      <div className="grid md:grid-cols-3 gap-4">
        {items.map((it) => (
          <article key={it.title} className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-weak)' }}>
                <it.icon size={17} style={{ color: 'var(--accent)' }} aria-hidden />
              </span>
              <h3 className="font-semibold text-[15.5px]" style={{ color: 'var(--text)' }}>
                {it.title}
              </h3>
            </div>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {it.text}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
