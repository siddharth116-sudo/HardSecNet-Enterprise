import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface SectionProps {
  id: string;
  /** Optional kicker. Omit it where a nav tab already names the section — no redundant echo. */
  eyebrow?: string;
  /** Omit to build a custom header inside children (e.g. a two-column layout). */
  title?: string;
  lead?: string;
  children: ReactNode;
  tinted?: boolean;
}

export function Section({ id, eyebrow, title, lead, children, tinted = false }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={title ? `${id}-title` : undefined}
      style={tinted ? { background: 'var(--bg-soft)' } : undefined}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {(eyebrow || title || lead) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            className="max-w-2xl mb-7 sm:mb-8"
          >
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            {title && (
              <h2 id={`${id}-title`} className="display text-3xl sm:text-[2.6rem] leading-[1.12] font-bold" style={{ color: 'var(--text)' }}>
                {title}
              </h2>
            )}
            {lead && (
              <p className="mt-4 text-[16px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {lead}
              </p>
            )}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.08 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
