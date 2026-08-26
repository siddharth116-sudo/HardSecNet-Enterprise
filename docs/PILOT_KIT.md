# HardSecNet Pilot Kit

Everything needed to run the first customer conversations. Target: **2 free
pilots from 10 conversations.**

---

## 1. The pitch (memorize this)

> Small IT agencies manage dozens of client computers but can't afford
> CrowdStrike or Qualys. HardSecNet gives them one dashboard showing the
> security health of **every client, every machine** — install one file per
> computer and it reports forever. When a setting drifts (firewall off, weak
> password policy), the dashboard catches it within minutes and can fix it in
> one click. Compliance reports for the client's auditor are one button.

Who it's for (in order of likely pain):
1. **IT service providers / MSPs** managing 5–50 client businesses
2. **Web/software agencies** that also "handle the client's computers"
3. **CA & accounting firms** (compliance pressure, sensitive data, no IT staff)

---

## 2. The 5-minute demo script

Do a dry run twice before the first real demo. Everything below is already
working at your deployment — no smoke and mirrors.

| Min | Action | Say |
|----:|--------|-----|
| 0–1 | Open the dashboard (HTTPS, padlock visible). Point at the **Client switcher**. | "One login, all your clients. Each client's machines and reports are separated." |
| 1–2 | Go to **Clients** → Add client "Demo Corp" → copy the enroll command. | "Onboarding a new client is one command per machine. No configuration on their side." |
| 2–3 | Run the agent on your laptop with Demo Corp's token. Watch it appear. | "That's it — the machine is now monitored. It re-audits itself every 10 minutes, forever." |
| 3–4 | Open the node: show the failing checks and compliance score. Click **Remediate** on one. | "It doesn't just find problems — it fixes them. Watch the score change." |
| 4–5 | Generate the **PDF report**. | "This is what you hand your client every month — proof you're protecting them. Most MSPs charge extra for this report alone." |

Close with ONE question: **"If this watched all your clients' machines, what
would it be worth to you per month?"** Then stop talking and listen.

---

## 3. Outreach message (WhatsApp / LinkedIn DM)

> Hi <Name>, I'm a security engineering student and I've built a tool that
> gives IT service providers one dashboard showing the security health of all
> their clients' computers — like CrowdStrike, but priced for small firms.
> I'm looking for 2 companies to pilot it **free for a month** in exchange
> for honest feedback. Could I show you a 5-minute demo this week?

Email version: same text, subject line —
**"Free month of security monitoring for your clients — student project turned product"**

Do NOT oversell. "Student building something real" opens more doors at this
stage than pretending to be a company.

---

## 4. Discovery questions (ask in every conversation)

1. "How do you keep track of your clients' machine security today?" *(usually: nothing/manual)*
2. "Has a client machine ever been misconfigured for weeks before anyone noticed?"
3. "Do clients ever ask you to prove their systems are secure?" *(reports = money)*
4. "What would this need to do for you to pay for it?" ← **the only roadmap that matters**
5. "What would you expect something like this to cost per month?"

Write the answers down immediately after each call. Patterns across 10
conversations = your real product strategy.

---

## 5. Pilot offer (keep it this simple)

- Free for 30 days, up to 10 machines across their clients
- You personally help install (it's one command — but the hand-holding builds trust)
- Weekly 10-minute check-in call for feedback
- After 30 days: they pay or they cancel, no pressure — **either answer is
  valuable data**

## 6. Pricing hypothesis (to TEST, not announce)

Anchor: enterprise tools cost ₹400–800/machine/month and demand annual
contracts. Hypothesis to test in conversations:

- **₹99–149 per machine / month**, minimum ₹1,999/month per MSP
- MSP resells to their clients at 2–3× — the dashboard makes *them* money

If two pilots say yes too quickly, the price is too low. If everyone flinches,
ask "so what number would work?" and note it.

## 7. Objections you'll hear

| They say | You say |
|---|---|
| "We use antivirus already" | "Antivirus catches viruses. This catches *misconfigurations* — the firewall someone turned off, the password policy nobody set. Different layer, and it's what auditors ask about." |
| "Is our client data safe with you?" | "The agent sends only configuration check results — never files, never passwords. And each client's data is separated per workspace." |
| "You're one student, what if you disappear?" | "Fair. That's why the pilot is free — judge the product, not the company. If it earns its keep, we'll talk about a real agreement." |
