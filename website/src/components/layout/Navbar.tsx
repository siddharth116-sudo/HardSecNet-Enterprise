import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { LogoWordmark } from '../ui/Logo';

const links = [
  { href: '#platform', label: 'Platform' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#security', label: 'Security' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlight the tab of the section currently on screen.
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(`#${e.target.id}`);
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 pt-3 pointer-events-none">
      <nav
        aria-label="Main"
        className="pointer-events-auto max-w-6xl mx-auto h-14 px-4 sm:px-5 flex items-center justify-between gap-4 rounded-2xl transition-all duration-300"
        style={
          scrolled
            ? {
                background: 'var(--glass)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
              }
            : { border: '1px solid transparent' }
        }
      >
        <a href="#top" aria-label="HardSecNet — back to top">
          <LogoWordmark compact />
        </a>

        <div className="hidden lg:flex items-center gap-0.5">
          {links.map((l) => {
            const isActive = active === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                aria-current={isActive ? 'true' : undefined}
                className="px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-[var(--accent-weak)]"
                style={
                  isActive
                    ? { color: 'var(--accent-strong)', background: 'var(--accent-weak)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                {l.label}
              </a>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
          >
            {theme === 'dark' ? <Sun size={15} aria-hidden /> : <Moon size={15} aria-hidden />}
          </button>
          <a href="#contact" className="btn-primary !py-2 !px-4 !text-[13.5px] whitespace-nowrap !hidden sm:!inline-flex">
            Book a demo
          </a>
          <button
            type="button"
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="pointer-events-auto lg:hidden max-w-6xl mx-auto mt-2 p-3 rounded-2xl space-y-1"
          style={{ background: 'var(--glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)' }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-[15px] font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="btn-primary w-full mt-2">
            Book a demo
          </a>
        </div>
      )}
    </header>
  );
}
