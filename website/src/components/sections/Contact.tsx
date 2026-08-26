import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Github, Mail, Send } from 'lucide-react';
import { Section } from '../layout/Section';

interface DemoRequest {
  name: string;
  email: string;
  company: string;
  machines: string;
  message: string;
}

const steps = [
  ['A reply within one working day', 'Straight from the founder, not a sales queue.'],
  ['A 15-minute live demo', 'On real machines — install, drift, fix, report. No slides.'],
  ['A free 30-day pilot', 'If it fits, on up to 10 of your machines. No card, no lock-in.'],
];

export function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload: DemoRequest = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      company: String(data.get('company') ?? ''),
      machines: String(data.get('machines') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    // TODO: wire to backend — POST this payload to the demo-request endpoint when it exists.
    console.log('[demo-request]', payload);
    setSent(true);
  }

  return (
    <Section id="contact" tinted>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left — heading, the process, the human */}
        <div>
          <h2 id="contact-title" className="display text-3xl sm:text-[2.6rem] leading-[1.12] font-bold" style={{ color: 'var(--text)' }}>
            See it running on your own machines
          </h2>
          <p className="mt-4 mb-10 text-[16px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Book a 15-minute walkthrough. The fastest way to understand HardSecNet is to watch it catch a real drift
            and fix it live.
          </p>
          <ol className="space-y-6">
            {steps.map(([title, desc], i) => (
              <li key={title} className="flex gap-4">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold mono"
                  style={{ background: 'var(--accent-weak)', color: 'var(--accent-strong)' }}
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-[15px]" style={{ color: 'var(--text)' }}>
                    {title}
                  </p>
                  <p className="text-[13.5px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 pt-8 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
            <a
              href="mailto:magdumsiddharth111@gmail.com"
              className="flex items-center gap-3 text-[14px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ border: '1px solid var(--border-strong)' }}>
                <Mail size={15} aria-hidden />
              </span>
              magdumsiddharth111@gmail.com
            </a>
            <a
              href="https://github.com/siddharth116-sudo/HardSecNet-Enterprise"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-[14px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ border: '1px solid var(--border-strong)' }}>
                <Github size={15} aria-hidden />
              </span>
              Read the source before you trust it
              <ArrowRight size={14} aria-hidden />
            </a>
          </div>
        </div>

        {/* Right — the form */}
        {sent ? (
          <div className="card p-8 text-center" role="status">
            <CheckCircle2 size={36} className="mx-auto mb-4" style={{ color: 'var(--ok)' }} aria-hidden />
            <h3 className="display font-bold text-xl mb-2" style={{ color: 'var(--text)' }}>
              Request received
            </h3>
            <p className="text-[14.5px]" style={{ color: 'var(--text-muted)' }}>
              Thanks — expect a reply within one working day. If it's urgent, email{' '}
              <a href="mailto:magdumsiddharth111@gmail.com" className="underline" style={{ color: 'var(--accent-strong)' }}>
                magdumsiddharth111@gmail.com
              </a>{' '}
              directly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Your name
                </label>
                <input id="name" name="name" required autoComplete="name" className="field" placeholder="Priya Sharma" />
              </div>
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Work email
                </label>
                <input id="email" name="email" type="email" required autoComplete="email" className="field" placeholder="priya@company.in" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Company
                </label>
                <input id="company" name="company" required autoComplete="organization" className="field" placeholder="Company or agency name" />
              </div>
              <div>
                <label htmlFor="machines" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  Machines you manage
                </label>
                <select id="machines" name="machines" className="field" defaultValue="1-15">
                  <option value="1-15">1 – 15</option>
                  <option value="16-50">16 – 50</option>
                  <option value="51-200">51 – 200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                What should the demo focus on? <span style={{ color: 'var(--text-dim)' }}>(optional)</span>
              </label>
              <textarea id="message" name="message" rows={3} className="field resize-y" placeholder="e.g. We manage 12 client offices and RBI audit season is coming…" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Request the demo <Send size={15} aria-hidden />
            </button>
            <p className="text-[12px] text-center" style={{ color: 'var(--text-dim)' }}>
              No newsletter, no spam — your details are used to reply to this request and nothing else.
            </p>
          </form>
        )}
      </div>
    </Section>
  );
}
