/**
 * Sample data for the dashboard preview.
 * Typed so it can be swapped for a real API client later without touching components.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'open' | 'remediated';
export type Role = 'admin' | 'auditor' | 'viewer';

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  deltaGood: boolean;
}

export interface TrendPoint {
  day: string; // e.g. "Jun 04"
  score: number; // 0–100 fleet compliance %
}

export interface ActivityEvent {
  time: string;
  kind: 'drift' | 'remediated' | 'report' | 'enrolled';
  text: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  check: string;
  cisId: string;
  machine: string;
  client: string;
  detected: string;
  status: FindingStatus;
}

export const kpis: Kpi[] = [
  { label: 'Systems monitored', value: '128', delta: '+6 this week', deltaGood: true },
  { label: 'Fleet compliance', value: '87%', delta: '+4.2% this month', deltaGood: true },
  { label: 'Critical findings', value: '6', delta: '-3 since Monday', deltaGood: true },
  { label: 'Est. hours saved / mo', value: '41', delta: 'vs. manual audits', deltaGood: true },
];

/** 30 days of fleet compliance — a believable climb with dips where drift hit. */
export const trend: TrendPoint[] = [
  71, 72, 72, 74, 73, 75, 76, 76, 78, 77, 79, 80, 79, 81, 82, 81, 83, 78, 80, 82, 83, 84, 84, 85, 84, 86, 85, 86, 87, 87,
].map((score, i) => {
  const d = new Date(2026, 5, 3 + i); // Jun 3 .. Jul 2
  return {
    day: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    score,
  };
});

export const activity: ActivityEvent[] = [
  { time: '2 min ago', kind: 'drift', text: 'Firewall (Private profile) disabled on FIN-WS-11 · Meridian Finance' },
  { time: '14 min ago', kind: 'remediated', text: 'Password policy restored on OPS-SRV-03 · Kalyani Logistics' },
  { time: '38 min ago', kind: 'report', text: 'Monthly compliance PDF generated for Meridian Finance (42 machines)' },
  { time: '1 h ago', kind: 'enrolled', text: 'New machine DEV-LT-27 enrolled · Arka Software' },
  { time: '2 h ago', kind: 'drift', text: 'Guest account re-enabled on HR-WS-02 · Kalyani Logistics' },
  { time: '3 h ago', kind: 'remediated', text: 'UAC raised to Always-Notify on FIN-WS-08 · Meridian Finance' },
];

export const findings: Finding[] = [
  { id: 'F-1042', severity: 'critical', check: 'Firewall — Private profile disabled', cisId: 'CIS 9.2.1', machine: 'FIN-WS-11', client: 'Meridian Finance', detected: '2 min ago', status: 'open' },
  { id: 'F-1041', severity: 'critical', check: 'RDP exposed without NLA', cisId: 'CIS 18.9.62', machine: 'OPS-SRV-01', client: 'Kalyani Logistics', detected: '26 min ago', status: 'open' },
  { id: 'F-1039', severity: 'high', check: 'Guest account enabled', cisId: 'CIS 2.3.1.2', machine: 'HR-WS-02', client: 'Kalyani Logistics', detected: '2 h ago', status: 'open' },
  { id: 'F-1038', severity: 'high', check: 'Account lockout threshold not set', cisId: 'CIS 1.2.2', machine: 'DEV-LT-27', client: 'Arka Software', detected: '3 h ago', status: 'open' },
  { id: 'F-1035', severity: 'medium', check: 'Minimum password length below 14', cisId: 'CIS 1.1.4', machine: 'FIN-WS-04', client: 'Meridian Finance', detected: '5 h ago', status: 'remediated' },
  { id: 'F-1033', severity: 'medium', check: 'SMBv1 protocol enabled', cisId: 'CIS 18.3.3', machine: 'OPS-SRV-03', client: 'Kalyani Logistics', detected: '6 h ago', status: 'remediated' },
  { id: 'F-1031', severity: 'low', check: 'Screen lock timeout above 15 min', cisId: 'CIS 2.3.7.3', machine: 'MKT-WS-09', client: 'Arka Software', detected: '8 h ago', status: 'open' },
  { id: 'F-1029', severity: 'low', check: 'Audit logging not forwarding', cisId: 'CIS 17.5.1', machine: 'DEV-LT-14', client: 'Arka Software', detected: '9 h ago', status: 'remediated' },
];

export const roles: { id: Role; label: string; hint: string }[] = [
  { id: 'admin', label: 'Admin', hint: 'Full control — can remediate findings and manage clients' },
  { id: 'auditor', label: 'Auditor', hint: 'Read + export — can generate evidence, cannot change systems' },
  { id: 'viewer', label: 'Viewer', hint: 'Read-only dashboards' },
];
