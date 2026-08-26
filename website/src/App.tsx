import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { Bento } from './components/sections/Bento';
import { HowItWorks } from './components/sections/HowItWorks';
import { DashboardPreview } from './components/sections/DashboardPreview';
import { SecurityTrust } from './components/sections/SecurityTrust';
import { Pricing } from './components/sections/Pricing';
import { About } from './components/sections/About';
import { Contact } from './components/sections/Contact';

export default function App() {
  return (
    <ThemeProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg"
        style={{ background: 'var(--accent)', color: 'var(--btn-fg)' }}
      >
        Skip to content
      </a>
      <div className="top-scrim" aria-hidden />
      <Navbar />
      <main id="main">
        <Hero />
        <Bento />
        <HowItWorks />
        <DashboardPreview />
        <SecurityTrust />
        <Pricing />
        <About />
        <Contact />
      </main>
      <Footer />
    </ThemeProvider>
  );
}
