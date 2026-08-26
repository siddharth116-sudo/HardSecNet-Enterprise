import { Check, Clock3, Minus } from 'lucide-react';
import { Section } from '../layout/Section';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { matrix, tiers, type Currency } from '../../data/pricing';

function price(inr: number | null, usd: number | null, currency: Currency) {
  if (inr === null || usd === null) return 'Custom';
  return currency === 'inr' ? `₹${inr.toLocaleString('en-IN')}` : `$${usd}`;
}

/** Cell renderer for the feature matrix: included / roadmap / not included. */
function MatrixCell({ v }: { v: boolean | 'soon' }) {
  if (v === true) return <Check size={15} style={{ color: 'var(--ok)' }} aria-label="Included" />;
  if (v === 'soon') return <Clock3 size={14} style={{ color: 'var(--warn)' }} aria-label="On the roadmap" />;
  return <Minus size={14} style={{ color: 'var(--text-dim)' }} aria-label="Not included" />;
}

export function Pricing() {
  // Same persisted-toggle pattern as the audience lens — scoped to this section only.
  const [currency, setCurrency] = useLocalStorage<Currency>('hsn-site-currency', 'inr');

  return (
    <Section
      id="pricing"
      title="Priced for the firms the industry forgot"
      lead="Illustrative pilot-phase pricing — final pricing is being set with early customers. Early pilots lock their rate in."
      tinted
    >
      <div className="flex justify-end mb-6">
        <div
          role="group"
          aria-label="Choose currency"
          className="inline-flex items-center p-1 rounded-full"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-soft)' }}
        >
          {(['inr', 'usd'] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
              style={
                currency === c
                  ? { background: 'var(--accent-weak)', color: 'var(--accent-strong)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {c === 'inr' ? '₹ INR' : '$ USD'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {tiers.map((t) => (
          <article
            key={t.name}
            className="card p-6 flex flex-col relative"
            style={t.highlight ? { borderColor: 'var(--accent)', boxShadow: 'var(--shadow)' } : undefined}
          >
            {t.highlight && (
              <span
                className="absolute -top-3 left-6 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--btn-grad-a)', color: 'var(--btn-fg)' }}
              >
                Recommended
              </span>
            )}
            <h3 className="display font-bold text-[18px]" style={{ color: 'var(--text)' }}>
              {t.name}
            </h3>
            <p className="text-[12.5px] mt-1 mb-5" style={{ color: 'var(--text-dim)' }}>
              {t.tagline}
            </p>
            <p className="mb-5">
              <span className="display text-[34px] font-extrabold" style={{ color: 'var(--text)' }}>
                {price(t.priceInr, t.priceUsd, currency)}
              </span>
              {t.priceInr !== null && (
                <span className="text-[13px] ml-1.5" style={{ color: 'var(--text-dim)' }}>
                  / month
                </span>
              )}
            </p>
            <ul className="space-y-2.5 mb-7 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
                  <Check size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--ok)' }} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <a href="#contact" className={t.highlight ? 'btn-primary w-full' : 'btn-ghost w-full'}>
              {t.cta}
            </a>
          </article>
        ))}
      </div>

      <div className="card p-5 overflow-x-auto">
        <table className="w-full text-left" style={{ minWidth: 560 }}>
          <caption className="sr-only">Feature comparison across pricing tiers</caption>
          <thead>
            <tr className="text-[12.5px]" style={{ color: 'var(--text-dim)' }}>
              <th className="pb-3 font-medium">Feature</th>
              <th className="pb-3 font-medium text-center w-28">Starter</th>
              <th className="pb-3 font-medium text-center w-28">Professional</th>
              <th className="pb-3 font-medium text-center w-28">Enterprise</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {matrix.map((r) => (
              <tr key={r.feature} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="py-2.5" style={{ color: 'var(--text-muted)' }}>
                  {r.feature}
                </td>
                <td className="py-2.5 text-center"><span className="inline-flex justify-center"><MatrixCell v={r.starter} /></span></td>
                <td className="py-2.5 text-center"><span className="inline-flex justify-center"><MatrixCell v={r.professional} /></span></td>
                <td className="py-2.5 text-center"><span className="inline-flex justify-center"><MatrixCell v={r.enterprise} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mono text-[11px] mt-4 flex items-center gap-4" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-flex items-center gap-1.5"><Check size={12} style={{ color: 'var(--ok)' }} aria-hidden /> included</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 size={12} style={{ color: 'var(--warn)' }} aria-hidden /> on the public roadmap</span>
          <span className="inline-flex items-center gap-1.5"><Minus size={12} aria-hidden /> not included</span>
        </p>
      </div>
    </Section>
  );
}
