import { Download, Cpu, GitPullRequest, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Download,
    title: 'Install GitHub App on repository',
    description: 'Grant read access to issues and metadata, and write access to issue labels and comments. Installation takes under one minute through standard GitHub settings.'
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Edge worker receives webhook',
    description: 'When an issue is opened, GitHub sends an HTTPS webhook event. The edge runtime verifies the cryptographic HMAC signature and extracts the issue body.'
  },
  {
    number: '03',
    icon: GitPullRequest,
    title: 'Classification and duplicate check',
    description: 'The engine evaluates taxonomy rules, calculates cosine similarity against existing open and closed issues, and generates a draft reply citing repository docs.'
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Maintainer approves draft reply',
    description: 'Drafts are held in a pending state. Maintainers inspect suggested labels and duplicate warnings, then approve the comment with one click.'
  }
];

export default function HowItWorksSteps() {
  return (
    <section id="how-it-works" className="section steps-section">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Execution Flow</div>
          <h2 className="section-title">How it works in four deterministic steps.</h2>
          <p className="section-desc">
            No autonomous unvetted bots spamming issues. Designed to keep maintainers in control.
          </p>
        </div>

        <div className="steps-grid">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="step-card">
                <div className="step-header">
                  <span className="step-number">{step.number}</span>
                  <div className="step-icon-box">
                    <Icon size={16} />
                  </div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .steps-section {
          background-color: var(--bg-surface);
        }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 960px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 540px) {
          .steps-grid {
            grid-template-columns: 1fr;
          }
        }
        .step-card {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }
        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .step-number {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--accent-primary);
        }
        .step-icon-box {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--ink-primary);
        }
        .step-title {
          font-size: 1.05rem;
          margin-bottom: 10px;
          color: var(--ink-primary);
          line-height: 1.35;
        }
        .step-desc {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
      `}</style>
    </section>
  );
}
