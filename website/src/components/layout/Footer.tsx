import { useEffect, useState } from 'react';
import { Github, Mail } from 'lucide-react';
import { LogoWordmark } from '../ui/Logo';

const REPO = 'https://github.com/siddharth116-sudo/HardSecNet-Enterprise';

/** Every link here resolves to something real — site sections or actual repo docs. */
const columns: { heading: string; links: { label: string; href: string; external?: boolean; soon?: boolean }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Platform', href: '#platform' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Dashboard preview', href: '#dashboard' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Book a demo', href: '#contact' },
    ],
  },
  {
    heading: 'Docs',
    links: [
      { label: 'Getting started', href: `${REPO}#readme`, external: true },
      { label: 'Agent guide', href: `${REPO}/blob/main/agent/README.md`, external: true },
      { label: 'Deployment guide', href: `${REPO}/blob/main/deployment/DEPLOYMENT.md`, external: true },
      { label: 'Source code', href: REPO, external: true },
      { label: 'API reference', href: '#', soon: true },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { label: 'Security & trust', href: '#security' },
      { label: 'CIS Benchmarks', href: 'https://www.cisecurity.org/cis-benchmarks', external: true },
      { label: 'RBI cyber framework', href: 'https://www.rbi.org.in', external: true },
      { label: 'SEBI CSCRF', href: 'https://www.sebi.gov.in', external: true },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About the founder', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'GitHub', href: REPO, external: true },
      { label: 'Blog', href: '#', soon: true },
      { label: 'Changelog', href: '#', soon: true },
    ],
  },
];

export function Footer() {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(4,1fr)] mb-12">
          <div>
            <div className="mb-3">
              <LogoWordmark compact />
            </div>
            <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              Continuous security hardening and compliance evidence for the firms that can't afford a security team.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="mailto:magdumsiddharth111@gmail.com"
                aria-label="Email"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--accent-weak)]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
              >
                <Mail size={15} aria-hidden />
              </a>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--accent-weak)]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
              >
                <Github size={15} aria-hidden />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="mono text-[11px] uppercase tracking-wider mb-4" style={{ color: 'var(--text-dim)' }}>
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                      onClick={(e) => {
                        if (l.soon) {
                          e.preventDefault();
                          setToast(`${l.label} isn't live yet — it ships with our first public release.`);
                        }
                      }}
                      className="text-[13.5px] transition-colors hover:underline"
                      style={{ color: l.soon ? 'var(--text-dim)' : 'var(--text-muted)' }}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-[12px]" style={{ color: 'var(--text-dim)' }}>
            © {new Date().getFullYear()} HardSecNet · Built in India
          </p>
          <p className="mono text-[11px]" style={{ color: 'var(--text-dim)' }}>
            This site sets no cookies and runs no trackers.
          </p>
        </div>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[13px] font-medium glass"
          style={{ color: 'var(--text)' }}
        >
          {toast}
        </div>
      )}
    </footer>
  );
}
