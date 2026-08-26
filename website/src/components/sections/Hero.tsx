import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { LogoMark } from '../ui/Logo';

const COMMAND = '> hardsecnet-agent --enroll acme-corp --once';

const AUDIT_LINES = [
  { ok: true, text: 'Firewall — Domain profile ............ Compliant' },
  { ok: true, text: 'Account lockout threshold ............ Compliant' },
  { ok: false, text: 'Firewall — Private profile ........... DRIFT DETECTED' },
  { ok: true, text: 'Guest account disabled ............... Compliant' },
  { ok: false, text: 'Minimum password length .............. DRIFT DETECTED' },
  { ok: true, text: 'UAC elevation prompt ................. Compliant' },
];

/** Signature moment: the real enroll command runs, checks stream, drift glows. */
function Terminal() {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState(reduced ? COMMAND.length : 0);
  const [lines, setLines] = useState(reduced ? AUDIT_LINES.length : 0);

  useEffect(() => {
    if (reduced) return;
    if (typed < COMMAND.length) {
      const t = setTimeout(() => setTyped(typed + 1), 32);
      return () => clearTimeout(t);
    }
    if (lines < AUDIT_LINES.length) {
      const t = setTimeout(() => setLines(lines + 1), lines === 0 ? 420 : 300);
      return () => clearTimeout(t);
    }
  }, [typed, lines, reduced]);

  return (
    <div className="glass overflow-hidden text-left w-full" aria-label="Demo terminal: agent enrolling a machine and streaming audit results">
      <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--warn)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <span className="mono text-[11px] ml-3" style={{ color: 'var(--text-dim)' }}>
          acme-corp · new machine
        </span>
      </div>
      <div className="mono text-[12.5px] leading-[1.95] p-5">
        <p style={{ color: 'var(--text)' }}>
          {COMMAND.slice(0, typed)}
          {typed < COMMAND.length && (
            <span className="pulse-dot inline-block w-1.5 h-3.5 ml-0.5 align-middle" style={{ background: 'var(--accent)' }} />
          )}
        </p>
        {AUDIT_LINES.slice(0, lines).map((l) => (
          <motion.p
            key={l.text}
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
            style={{ color: l.ok ? 'var(--text-muted)' : 'var(--warn)' }}
          >
            {l.ok ? (
              <CheckCircle2 size={13} style={{ color: 'var(--ok)' }} aria-hidden />
            ) : (
              <XCircle size={13} style={{ color: 'var(--warn)' }} aria-hidden />
            )}
            {l.text}
          </motion.p>
        ))}
        {lines === AUDIT_LINES.length && (
          <motion.p initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} className="mt-2" style={{ color: 'var(--ok)' }}>
            ✓ Report delivered · machine now monitored every 10 minutes
          </motion.p>
        )}
      </div>
    </div>
  );
}

const spring = { type: 'spring', stiffness: 80, damping: 18 } as const;

export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const termY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] flex items-center pt-20 pb-10 overflow-hidden">
      <motion.div style={{ y: glowY }} className="aurora" aria-hidden />
      <div className="grid-bg" aria-hidden />

      <div className="relative w-full max-w-6xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.08 }}
            className="display text-[2.7rem] sm:text-6xl font-extrabold leading-[1.04] tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Every machine hardened.
            <br />
            <span className="gradient-text">Proof in one click.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.16 }}
            className="mt-6 text-[17px] leading-relaxed max-w-xl"
            style={{ color: 'var(--text-muted)' }}
          >
            Continuous CIS-based audits for every machine you manage. Drift caught in minutes, fixed in one
            click, proven in one report.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a href="#contact" className="btn-primary">
              Book a demo <ArrowRight size={16} aria-hidden />
            </a>
            <a href="#dashboard" className="btn-ghost">
              See the dashboard
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.3 }}
          style={{ y: termY }}
          className="relative"
        >
          {/* glow bed under the terminal */}
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[28px] blur-2xl"
            style={{ background: 'radial-gradient(60% 60% at 50% 45%, rgba(255,255,255,0.05), transparent 70%)' }}
          />
          <Terminal />
          <div
            aria-hidden
            className="absolute -bottom-5 -left-5 hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl glass"
          >
            <LogoMark size={30} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
