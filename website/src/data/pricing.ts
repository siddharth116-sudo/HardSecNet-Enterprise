export type Currency = 'inr' | 'usd';

export interface Tier {
  name: string;
  tagline: string;
  priceInr: number | null; // null = custom
  priceUsd: number | null;
  highlight: boolean;
  cta: string;
  features: string[];
}

/** Feature matrix row. true = included, false = not, 'soon' = on the public roadmap. */
export interface MatrixRow {
  feature: string;
  starter: boolean | 'soon';
  professional: boolean | 'soon';
  enterprise: boolean | 'soon';
}

export const tiers: Tier[] = [
  {
    name: 'Starter',
    tagline: 'For a single small firm or a first client',
    priceInr: 1999,
    priceUsd: 29,
    highlight: false,
    cta: 'Start a pilot',
    features: [
      'Up to 15 machines',
      '3 client workspaces',
      'Continuous audits every 10 minutes',
      'One-click remediation',
      'Compliance PDF reports',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    tagline: 'For IT service providers managing many clients',
    priceInr: 4999,
    priceUsd: 69,
    highlight: true,
    cta: 'Start a pilot',
    features: [
      'Up to 50 machines',
      'Unlimited client workspaces',
      'Everything in Starter',
      'White-label reports (coming soon)',
      'WhatsApp drift alerts (coming soon)',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For regulated firms and larger fleets',
    priceInr: null,
    priceUsd: null,
    highlight: false,
    cta: 'Talk to us',
    features: [
      'Unlimited machines',
      'Fully on-premises deployment',
      'RBI / SEBI auditor packs (coming soon)',
      'SSO & directory integration (coming soon)',
      'Custom checks for your environment',
      'Dedicated support & SLA',
    ],
  },
];

export const matrix: MatrixRow[] = [
  { feature: 'Continuous configuration audits', starter: true, professional: true, enterprise: true },
  { feature: 'Drift detection & live dashboard', starter: true, professional: true, enterprise: true },
  { feature: 'One-click remediation', starter: true, professional: true, enterprise: true },
  { feature: 'Per-client workspaces', starter: true, professional: true, enterprise: true },
  { feature: 'Compliance PDF reports', starter: true, professional: true, enterprise: true },
  { feature: 'Role-based access (Admin / Auditor / Viewer)', starter: true, professional: true, enterprise: true },
  { feature: 'White-label reports & portal', starter: false, professional: 'soon', enterprise: 'soon' },
  { feature: 'WhatsApp / Slack / Teams alerts', starter: false, professional: 'soon', enterprise: 'soon' },
  { feature: 'RBI / SEBI auditor packs', starter: false, professional: false, enterprise: 'soon' },
  { feature: 'On-premises deployment', starter: false, professional: false, enterprise: true },
  { feature: 'SSO & directory integration', starter: false, professional: false, enterprise: 'soon' },
  { feature: 'Dedicated support & SLA', starter: false, professional: false, enterprise: true },
];
