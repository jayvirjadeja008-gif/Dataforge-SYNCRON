import { Tag, GitPullRequest, ArrowRight, Check, Code } from 'lucide-react';
import { siteConfig } from '../config/site.config';

export default function Features() {
  const [f1, f2, f3] = siteConfig.features;

  return (
    <section id="features" className="section features-section">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Core Capabilities</div>
          <h2 className="section-title">Engineered strictly around three real maintainer workflows.</h2>
          <p className="section-desc">
            No synthetic filler features. Built to handle repository noise while preserving maintainer oversight.
          </p>
        </div>

        {/* Asymmetric Layout: Feature 1 Wide Workbench Block */}
        <div className="asymmetric-feature-card feature-wide">
          <div className="feature-content">
            <div className="feature-badge">
              <Tag size={14} />
              <span>Feature 1</span>
            </div>
            <h3 className="feature-heading">{f1.title}</h3>
            <p className="feature-text">{f1.shortDescription}</p>
            <p className="feature-tech-detail">{f1.technicalDetails}</p>

            <div className="io-breakdown">
              <div className="io-col">
                <span className="io-title">Inputs Ingested</span>
                <ul className="io-list">
                  {f1.inputs.map((inp, idx) => (
                    <li key={idx}><Check size={12} className="io-check" />{inp}</li>
                  ))}
                </ul>
              </div>
              <div className="io-col">
                <span className="io-title">Emitted Results</span>
                <ul className="io-list">
                  {f1.outputs.map((out, idx) => (
                    <li key={idx}><Check size={12} className="io-check" />{out}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <div className="code-header">
              <Code size={13} />
              <span>classification-schema.json</span>
            </div>
            <pre className="code-block">
              <code>{`{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "labels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "rationale": { "type": "string" }
        },
        "required": ["name", "confidence", "rationale"]
      }
    },
    "category": { "enum": ["bug", "feature", "docs", "question"] }
  },
  "required": ["labels", "category"]
}`}</code>
            </pre>
          </div>
        </div>

        {/* Asymmetric Two-Column Split for Features 2 and 3 */}
        <div className="asymmetric-grid-duo">
          {/* Feature 2: Duplicate Detection */}
          <div className="asymmetric-feature-card feature-half">
            <div className="feature-content">
              <div className="feature-badge">
                <GitPullRequest size={14} />
                <span>Feature 2</span>
              </div>
              <h3 className="feature-heading">{f2.title}</h3>
              <p className="feature-text">{f2.shortDescription}</p>
              <p className="feature-tech-detail">{f2.technicalDetails}</p>

              <div className="spec-callout">
                <div className="spec-item">
                  <span className="spec-label">Vector Dimension</span>
                  <span className="spec-value">1536 (text-embedding-3-small)</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Similarity Threshold</span>
                  <span className="spec-value">&gt; 0.88 Cosine Distance</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Index Scope</span>
                  <span className="spec-value">Scoped strictly per repository</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: First-Reply Drafting */}
          <div className="asymmetric-feature-card feature-half">
            <div className="feature-content">
              <div className="feature-badge">
                <ArrowRight size={14} />
                <span>Feature 3</span>
              </div>
              <h3 className="feature-heading">{f3.title}</h3>
              <p className="feature-text">{f3.shortDescription}</p>
              <p className="feature-tech-detail">{f3.technicalDetails}</p>

              <div className="spec-callout">
                <div className="spec-item">
                  <span className="spec-label">Template Sourcing</span>
                  <span className="spec-value">Parsed from .github/ISSUE_TEMPLATE</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Maintainer Guardrail</span>
                  <span className="spec-value">Requires explicit human approval click</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Autonomous Posting</span>
                  <span className="spec-value">Disabled by default</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .features-section {
          background-color: var(--bg-base);
        }
        .section-header {
          margin-bottom: 40px;
        }
        .section-label {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .section-title {
          margin-bottom: 12px;
        }
        .section-desc {
          font-size: 1.05rem;
          color: var(--ink-secondary);
        }
        .asymmetric-feature-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          padding: 32px;
          display: flex;
          gap: 32px;
          margin-bottom: 24px;
        }
        @media (max-width: 860px) {
          .asymmetric-feature-card {
            flex-direction: column;
            padding: 24px;
          }
        }
        .feature-wide {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          align-items: center;
        }
        @media (max-width: 960px) {
          .feature-wide {
            grid-template-columns: 1fr;
          }
        }
        .asymmetric-grid-duo {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 860px) {
          .asymmetric-grid-duo {
            grid-template-columns: 1fr;
          }
        }
        .feature-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--accent-primary);
          font-weight: 600;
          margin-bottom: 14px;
        }
        .feature-heading {
          font-size: 1.35rem;
          margin-bottom: 10px;
          color: var(--ink-primary);
        }
        .feature-text {
          font-size: 0.9375rem;
          color: var(--ink-secondary);
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .feature-tech-detail {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-family: var(--font-mono);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .io-breakdown {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-base);
        }
        @media (max-width: 520px) {
          .io-breakdown {
            grid-template-columns: 1fr;
          }
        }
        .io-title {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .io-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .io-list li {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .io-check {
          color: var(--accent-primary);
          flex-shrink: 0;
        }
        .feature-visual {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .code-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .code-block {
          padding: 14px;
          font-size: 0.75rem;
          color: var(--ink-secondary);
          overflow-x: auto;
          line-height: 1.45;
        }
        .spec-callout {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
        }
        .spec-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          gap: 8px;
        }
        .spec-label {
          color: var(--ink-muted);
        }
        .spec-value {
          font-family: var(--font-mono);
          color: var(--ink-primary);
          font-weight: 500;
        }
      `}</style>
    </section>
  );
}
