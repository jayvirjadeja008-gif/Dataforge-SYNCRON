import { ArrowUpRight, Play, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react';
import GithubIcon from './GithubIcon';
import { siteConfig } from '../config/site.config';
import { lazy, Suspense } from 'react';
import ArchitectureDiagram from './ArchitectureDiagram';

const Hero3DStage = lazy(() => import('./Hero3DStage'));

interface HeroProps {
  onNavigateWorkbench: () => void;
  onNavigateInstall: () => void;
}

export default function Hero({ onNavigateWorkbench, onNavigateInstall }: HeroProps) {
  return (
    <section className="section hero-section">
      <div className="container">
        {/* Hackathon & Team Attribution Badge */}
        <div className="hero-top-badge">
          <span className="badge-dot"></span>
          <span className="badge-text">Hackathon Project: AI for Open Source</span>
          <span className="badge-sep">/</span>
          <span className="badge-team">Team: {siteConfig.teamNames.join(', ')}</span>
        </div>

        {/* Short, Factual Headings & Scannable Paragraphs (<= 3 lines) */}
        <h1 className="hero-title">{siteConfig.headline}</h1>
        <p className="hero-subline">{siteConfig.subline}</p>
        <p className="hero-audience">{siteConfig.targetAudience}</p>

        {/* UX Clarity: Exactly One Primary Action and One Secondary Action */}
        <div className="hero-cta-group">
          <button
            onClick={onNavigateInstall}
            className="btn btn-primary"
            id="hero-install-btn"
          >
            <span>Install GitHub App</span>
            <ArrowUpRight size={15} />
          </button>

          <button
            onClick={onNavigateWorkbench}
            className="btn btn-secondary"
            id="hero-demo-btn"
          >
            <Play size={14} />
            <span>Open Triage Dashboard</span>
          </button>

          <a
            href={siteConfig.githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-action-link"
            id="hero-repo-btn"
          >
            <GithubIcon size={15} />
            <span>Profile @{siteConfig.githubUsername}</span>
          </a>
        </div>

        {/* Interactive 3D Physics Stage */}
        <Suspense
          fallback={
            <div
              className="skeleton-loader"
              style={{
                height: 320,
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)'
              }}
            />
          }
        >
          <Hero3DStage onExploreClick={onNavigateWorkbench} />
        </Suspense>

        {/* Early Product Proof: Real-Time Triage Verification Card */}
        <div className="product-proof-card">
          <div className="proof-header">
            <div className="proof-header-left">
              <span className="proof-dot"></span>
              <span className="proof-title">Live Triage Snapshot</span>
              <span className="proof-repo font-mono">jayvirjadeja008-gif/Dataforge-SYNCRON</span>
            </div>
            <div className="proof-header-right">
              <span className="proof-status-pill">
                <ShieldCheck size={12} />
                <span>Human in the Loop</span>
              </span>
            </div>
          </div>

          <div className="proof-body">
            <div className="proof-issue-row">
              <span className="proof-issue-id">Issue #1</span>
              <span className="proof-issue-name">Data pipeline ingestion stalls on corrupted UTF-8 payloads</span>
              <span className="proof-author">by @sarah-eng</span>
            </div>

            <div className="proof-grid">
              {/* Classification Labels */}
              <div className="proof-col">
                <div className="proof-col-label">Classified Labels</div>
                <div className="proof-labels-row">
                  <span className="proof-tag tag-bug">
                    <span className="tag-dot" style={{ background: '#B45309' }}></span>
                    <span>bug</span>
                    <span className="tag-conf">94%</span>
                  </span>
                  <span className="proof-tag tag-pipeline">
                    <span className="tag-dot" style={{ background: '#1F2937' }}></span>
                    <span>data-pipeline</span>
                    <span className="tag-conf">91%</span>
                  </span>
                </div>
              </div>

              {/* Duplicate Detection */}
              <div className="proof-col">
                <div className="proof-col-label">Duplicate Detection</div>
                <div className="proof-dup-status">
                  <CheckCircle2 size={13} style={{ color: 'var(--accent-success)' }} />
                  <span>0.34 cosine distance: unique report</span>
                </div>
              </div>

              {/* First Response Preview */}
              <div className="proof-col proof-col-draft">
                <div className="proof-col-label">Drafted Maintainer Reply</div>
                <p className="proof-draft-text">
                  &ldquo;Thank you for reporting this. In \`src/transport/pipeline.ts\`, the boundary check fails to handle UTF-8 sequences over 3 bytes...&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Specs Strip */}
        <div className="specs-strip">
          <div className="spec-tile">
            <span className="spec-name">Protocol</span>
            <span className="spec-val">GitHub App Webhook</span>
          </div>
          <div className="spec-tile">
            <span className="spec-name">License</span>
            <span className="spec-val">{siteConfig.licenseName}</span>
          </div>
          <div className="spec-tile">
            <span className="spec-name">Models</span>
            <span className="spec-val">gpt-4o-mini, text-embedding-3-small</span>
          </div>
          <div className="spec-tile">
            <span className="spec-name">Data Retention</span>
            <span className="spec-val">Zero persistent issue text storage</span>
          </div>
        </div>

        {/* Pure SVG Architecture Pipeline Diagram */}
        <div className="diagram-container">
          <div className="diagram-header-bar">
            <Terminal size={14} />
            <span>Architecture Diagram: Webhook Ingestion &amp; Triage Flow</span>
          </div>
          <ArchitectureDiagram />
        </div>
      </div>

      <style>{`
        .hero-section {
          padding-top: var(--space-6);
          padding-bottom: var(--space-8);
          background-color: var(--bg-base);
        }
        .hero-top-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 4px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--ink-secondary);
          margin-bottom: var(--space-3);
          flex-wrap: wrap;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-primary);
          border-radius: 1px;
        }
        .badge-sep {
          color: var(--ink-faint);
        }
        .badge-team {
          color: var(--accent-primary);
          font-weight: 600;
        }
        .hero-title {
          font-size: clamp(2rem, 4.2vw, 3.25rem);
          max-width: 24ch;
          margin-bottom: var(--space-2);
          letter-spacing: -0.025em;
          color: var(--ink-primary);
          line-height: 1.15;
        }
        .hero-subline {
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          color: var(--ink-secondary);
          max-width: 65ch;
          margin-bottom: var(--space-1);
          line-height: 1.5;
        }
        .hero-audience {
          font-size: 0.9375rem;
          color: var(--ink-muted);
          max-width: 65ch;
          margin-bottom: var(--space-4);
          line-height: 1.5;
        }
        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-5);
        }
        .product-proof-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 20px;
          margin-bottom: var(--space-5);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .proof-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 14px;
        }
        .proof-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
        }
        .proof-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-success);
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        }
        .proof-title {
          font-weight: 600;
          color: var(--ink-primary);
        }
        .proof-repo {
          color: var(--accent-primary);
          background: var(--bg-elevated);
          padding: 2px 6px;
          border-radius: 2px;
        }
        .proof-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent-primary);
          background: rgba(217, 119, 6, 0.12);
          padding: 3px 8px;
          border-radius: 2px;
        }
        .proof-issue-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 14px;
          font-size: 0.9375rem;
          flex-wrap: wrap;
        }
        .proof-issue-id {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--accent-primary);
        }
        .proof-issue-name {
          color: var(--ink-primary);
          font-weight: 500;
        }
        .proof-author {
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .proof-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          gap: 16px;
          background: var(--bg-elevated);
          padding: 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        @media (max-width: 820px) {
          .proof-grid {
            grid-template-columns: 1fr;
          }
        }
        .proof-col-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-muted);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .proof-labels-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .proof-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          color: var(--ink-primary);
        }
        .tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 1px;
        }
        .tag-conf {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          color: var(--ink-muted);
        }
        .proof-dup-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .proof-draft-text {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          font-style: italic;
          line-height: 1.4;
          margin: 0;
        }
        .specs-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-5);
        }
        @media (max-width: 820px) {
          .specs-strip {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .specs-strip {
            grid-template-columns: 1fr;
          }
        }
        .spec-tile {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .spec-name {
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .spec-val {
          font-size: 0.875rem;
          color: var(--ink-primary);
          font-weight: 500;
        }
        .diagram-container {
          margin-top: 16px;
        }
        .diagram-header-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          color: var(--ink-muted);
          margin-bottom: 10px;
        }
      `}</style>
    </section>
  );
}
