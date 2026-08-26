import { Section } from '../layout/Section';

/**
 * The questions a skeptical buyer is already thinking. Answering them
 * unprompted converts better than hiding them — and it's simply honest.
 */
const hardQuestions = [
  {
    q: 'How many customers do you have?',
    a: "We're in pilot phase — early adopters run free pilots and lock in their pricing. You'd be joining at the stage where the roadmap is negotiable and the founder answers the phone.",
  },
  {
    q: 'Are you SOC 2 / ISO 27001 certified?',
    a: "Not yet — those certifications cost more than a young company earns, which is exactly why HardSecNet deploys on your infrastructure. You don't have to trust our cloud; there isn't one. Certifications come as we grow.",
  },
  {
    q: "What if you disappear next year?",
    a: 'Fair question for any young vendor. The stack is standard (Python, MongoDB, Docker), your data lives on your own servers in readable form, and the agent is a single open file — there is no lock-in to escape from.',
  },
];

export function About() {
  return (
    <Section id="about" title="Built by someone who couldn't unsee the gap">
      <div className="max-w-2xl mx-auto text-center space-y-4 mb-12">
        <p className="text-[16px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          I'm <strong style={{ color: 'var(--text)' }}>Siddharth Magdum</strong>, a security engineer. HardSecNet
          started as a university project and kept going because of one gap: security tooling is priced as if only
          large enterprises deserve it.
        </p>
        <p className="display text-[19px]" style={{ color: 'var(--text)' }}>
          Give the firms that can't afford a security team the visibility a security team would demand.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {hardQuestions.map((item) => (
          <div key={item.q} className="card p-5">
            <p className="font-semibold text-[14.5px] mb-2" style={{ color: 'var(--text)' }}>{item.q}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.a}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
