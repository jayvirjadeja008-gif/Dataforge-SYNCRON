'use client';
import { Cpu, Server, AlertTriangle, Layers } from 'lucide-react';
import { siteConfig } from '../config/site.config';
import ArchitectureDiagram from '../components/ArchitectureDiagram';

export default function DocsPage() {
  return (
    <div className="docs-page page-fade">
      <div className="container">
        <header className="docs-header">
          <div className="section-label">Technical Documentation</div>
          <h1 className="docs-title">Architecture, Model Pipeline, and Known Limitations</h1>
          <p className="docs-intro">
            An honest technical breakdown of {siteConfig.projectName}. Learn what runs on the edge, how vectors are computed, and where current technical boundaries exist.
          </p>
        </header>

        {/* System Diagram Section */}
        <section className="docs-card">
          <div className="card-heading-bar">
            <Layers size={16} />
            <h2>End to End Webhook Flow</h2>
          </div>
          <p className="card-p">
            {siteConfig.projectName} operates as an event-driven GitHub App. Every issue creation or update event is pushed directly from GitHub to our edge runtime using secure webhook signatures.
          </p>
          <ArchitectureDiagram />
        </section>

        {/* AI Approach and Models Section */}
        <section className="docs-card">
          <div className="card-heading-bar">
            <Cpu size={16} />
            <h2>AI Approach and Models Used</h2>
          </div>
          <div className="docs-grid-two">
            <div className="docs-subblock">
              <h3>1. Issue Classification: Structured JSON Schema</h3>
              <p>
                We use OpenAI <code className="inline-code">gpt-4o-mini</code> configured with strict JSON Schema output enforcement. Rather than asking an unconstrained LLM for conversational text, we supply the repository&apos;s registered issue label list and taxonomy rules.
              </p>
              <p>
                The model outputs a typed JSON object containing assigned labels, calibrated confidence scores between 0.0 and 1.0, and a one-sentence rationale. Labels with confidence under 0.85 are discarded to minimize false positives.
              </p>
            </div>

            <div className="docs-subblock">
              <h3>2. Duplicate Detection: Vector Cosine Similarity</h3>
              <p>
                Issue titles and descriptions are converted into 1536-dimensional dense vectors using <code className="inline-code">text-embedding-3-small</code>.
              </p>
              <p>
                Embeddings are compared against all open and closed issues within the same repository using cosine similarity distance. Candidates scoring above 0.88 similarity are surfaced to maintainers as potential duplicates, complete with issue numbers and excerpts.
              </p>
            </div>
          </div>
        </section>

        {/* Infrastructure: What Runs Where */}
        <section className="docs-card">
          <div className="card-heading-bar">
            <Server size={16} />
            <h2>What Runs Where (Edge vs Cloud)</h2>
          </div>
          <div className="runtime-table-wrapper">
            <table className="runtime-table">
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col">Execution Environment</th>
                  <th scope="col">State and Persistence</th>
                  <th scope="col">Security Boundary</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Webhook Receiver</td>
                  <td>Cloudflare Workers / Edge Runtime</td>
                  <td>Stateless, zero disk logging</td>
                  <td>Validates GitHub HMAC-SHA256 signature</td>
                </tr>
                <tr>
                  <td>Embedding Index</td>
                  <td>Repository-scoped SQLite / pgvector</td>
                  <td>Cached issue embeddings and issue IDs</td>
                  <td>Strict repository tenancy isolation</td>
                </tr>
                <tr>
                  <td>Inference Execution</td>
                  <td>OpenAI Enterprise API Gateway</td>
                  <td>Stateless API requests</td>
                  <td>Zero data retention agreement active</td>
                </tr>
                <tr>
                  <td>Maintainer Dashboard</td>
                  <td>Next.js 16 (App Router) + React 19</td>
                  <td>Client-side session memory</td>
                  <td>GitHub OAuth 2.0 PKCE flow</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Known Limitations */}
        <section className="docs-card limitations-card">
          <div className="card-heading-bar">
            <AlertTriangle size={16} />
            <h2>Known Technical Limitations</h2>
          </div>
          <p className="card-p">
            We believe in honest documentation. The following boundaries exist in the current architecture:
          </p>

          <div className="limitations-list">
            <div className="limitation-item">
              <span className="limit-marker">01</span>
              <div>
                <h4>No Code Execution or Test Suite Running</h4>
                <p>
                  {siteConfig.projectName} does not execute untrusted user code or run CI integration test suites. It parses textual issue content and stack traces, but cannot confirm if a reproduction script actually crashes on a target kernel.
                </p>
              </div>
            </div>

            <div className="limitation-item">
              <span className="limit-marker">02</span>
              <div>
                <h4>Cold Start Pre-Indexing on Massive Repositories</h4>
                <p>
                  Repositories with more than 50,000 historical issues require an initial batch pre-indexing phase. Vector similarity searches during this warm-up period fall back to GitHub REST full-text search.
                </p>
              </div>
            </div>

            <div className="limitation-item">
              <span className="limit-marker">03</span>
              <div>
                <h4>Spam Wave Moderation Requires GitHub Native Controls</h4>
                <p>
                  While semantic classification flags nonsensical gibberish as invalid, high-volume automated bot spam attacks still require GitHub native interaction limits and repository blocklists.
                </p>
              </div>
            </div>

            <div className="limitation-item">
              <span className="limit-marker">04</span>
              <div>
                <h4>Strict Human-in-the-Loop Safeguard</h4>
                <p>
                  By design, {siteConfig.projectName} will never post public comments or close issues autonomously. A repository maintainer must review and click approve. This prevents hallucinated replies from confusing contributors.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .docs-page {
          padding: 56px 0 72px;
          background-color: var(--bg-base);
        }
        .docs-header {
          margin-bottom: 40px;
        }
        .docs-title {
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          margin-bottom: 14px;
        }
        .docs-intro {
          font-size: 1.1rem;
          color: var(--ink-secondary);
          max-width: 72ch;
          line-height: 1.5;
        }
        .docs-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          padding: 32px;
          margin-bottom: 28px;
        }
        @media (max-width: 640px) {
          .docs-card {
            padding: 20px;
          }
        }
        .card-heading-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--ink-primary);
          margin-bottom: 16px;
        }
        .card-heading-bar h2 {
          font-size: 1.35rem;
        }
        .card-p {
          font-size: 0.9375rem;
          color: var(--ink-secondary);
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .docs-grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 860px) {
          .docs-grid-two {
            grid-template-columns: 1fr;
          }
        }
        .docs-subblock {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 20px;
        }
        .docs-subblock h3 {
          font-size: 1.05rem;
          margin-bottom: 12px;
          color: var(--ink-primary);
        }
        .docs-subblock p {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.55;
          margin-bottom: 12px;
        }
        .docs-subblock p:last-child {
          margin-bottom: 0;
        }
        .runtime-table-wrapper {
          overflow-x: auto;
        }
        .runtime-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .runtime-table th {
          background: var(--bg-elevated);
          color: var(--ink-muted);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-base);
        }
        .runtime-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--ink-secondary);
        }
        .runtime-table tr:last-child td {
          border-bottom: none;
        }
        .limitations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .limitation-item {
          display: flex;
          gap: 18px;
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 18px;
        }
        .limit-marker {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--accent-primary);
        }
        .limitation-item h4 {
          font-size: 1rem;
          margin-bottom: 6px;
          color: var(--ink-primary);
        }
        .limitation-item p {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
