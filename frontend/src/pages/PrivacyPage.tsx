import { Shield, Lock, Eye, Trash2, Mail, Server } from 'lucide-react';
import { siteConfig } from '../config/site.config';

export default function PrivacyPage() {
  return (
    <div className="legal-page page-fade">
      <div className="container">
        <header className="legal-header">
          <div className="section-label">Legal &amp; Transparency</div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-meta">
            Last Updated: {siteConfig.lastUpdatedDate} | Contact: <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
          </p>
        </header>

        <div className="legal-content">
          <section className="legal-section">
            <div className="legal-section-bar">
              <Shield size={16} />
              <h2>1. Introduction and Scope</h2>
            </div>
            <p>
              This Privacy Policy explains how {siteConfig.projectName} (&quot;we&quot;, &quot;our&quot;, or &quot;the project&quot;) processes information when installed as a GitHub App on public or private software repositories.
            </p>
            <p>
              We operate on a principle of radical data minimization. We only inspect repository data strictly necessary to classify issues, detect duplicate reports, and draft maintainer replies. We do not sell data, track users across websites, or inject telemetry cookies.
            </p>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Eye size={16} />
              <h2>2. Data We Collect</h2>
            </div>
            <p>
              When a repository event occurs, GitHub sends an HTTPS webhook to our edge receiver. We collect and process only the following fields:
            </p>
            <ul className="legal-bullets">
              <li><strong>Issue Information:</strong> Issue number, title, markdown body text, issue author login handle, and applied repository labels.</li>
              <li><strong>Repository Context:</strong> Repository name, owner handle, and issue template configuration files stored in <code className="inline-code">.github/ISSUE_TEMPLATE</code>.</li>
              <li><strong>Installation Metadata:</strong> GitHub App installation identifier used for authenticating API requests.</li>
            </ul>
            <p>
              We do NOT collect private git commit history, repository source code files, billing details, personal email addresses (unless you email our maintainers directly), or browser session cookies.
            </p>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Lock size={16} />
              <h2>3. GitHub Authentication and Token Security</h2>
            </div>
            <p>
              {siteConfig.projectName} utilizes GitHub App server-to-server installation tokens.
            </p>
            <ul className="legal-bullets">
              <li>Tokens are generated on demand and carry a strict one-hour maximum expiration time.</li>
              <li>Tokens exist solely in transient memory on our edge workers during active webhook execution.</li>
              <li>Tokens and private webhook secrets are NEVER written to disk, persistent logs, or client-side storage.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Server size={16} />
              <h2>4. Storage, Retention, and Embeddings</h2>
            </div>
            <p>
              To detect duplicate issues without re-reading entire repositories on every webhook, we compute vector embeddings of issue titles and descriptions.
            </p>
            <ul className="legal-bullets">
              <li><strong>Vector Storage:</strong> Embeddings are stored alongside repository IDs and issue numbers in an isolated SQLite/pgvector index.</li>
              <li><strong>Raw Text Storage:</strong> Full issue bodies are discarded from memory once embeddings and label classifications complete. Only vector representations and issue numbers are retained.</li>
              <li><strong>Purge Schedule:</strong> All repository vectors are deleted within 48 hours if the GitHub App is uninstalled from the repository.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Shield size={16} />
              <h2>5. Third-Party Processors</h2>
            </div>
            <p>
              We rely on select technical infrastructure providers to operate the service:
            </p>
            <ul className="legal-bullets">
              <li><strong>OpenAI API:</strong> Used for semantic classification and vector embeddings. We utilize enterprise API endpoints governed by OpenAI&apos;s Zero Data Retention policy. User data sent to the API is not used to train machine learning models.</li>
              <li><strong>Cloudflare / Vercel Edge:</strong> Used for routing webhooks and hosting static assets with edge encryption in transit.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Trash2 size={16} />
              <h2>6. User Rights and Data Deletion</h2>
            </div>
            <p>
              Repository maintainers have absolute control over their data:
            </p>
            <ul className="legal-bullets">
              <li><strong>Immediate Purge:</strong> You may request complete deletion of all cached vectors associated with your repository at any time.</li>
              <li><strong>Uninstallation:</strong> Uninstalling the GitHub App from your repository settings revokes all token access immediately.</li>
              <li><strong>Data Requests:</strong> To request a copy of your stored vector index or verify deletion, contact us at <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. Requests are completed within 72 hours.</li>
            </ul>
          </section>

          <section className="legal-section">
            <div className="legal-section-bar">
              <Mail size={16} />
              <h2>7. Contact Information</h2>
            </div>
            <p>
              For questions regarding this privacy policy or our data handling practices, contact our project team at:
            </p>
            <p>
              <strong>Email:</strong> <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a><br />
              <strong>Team:</strong> {siteConfig.teamNames.join(', ')}<br />
              <strong>Project:</strong> {siteConfig.projectName} Open Source Team<br />
              <strong>Repository:</strong> <a href={siteConfig.repoUrl} target="_blank" rel="noopener noreferrer">{siteConfig.repoUrl}</a>
            </p>
          </section>
        </div>
      </div>

      <style>{`
        .legal-page {
          padding: 56px 0 72px;
          background-color: var(--bg-base);
        }
        .legal-header {
          margin-bottom: 40px;
          border-bottom: 1px solid var(--border-base);
          padding-bottom: 24px;
        }
        .legal-title {
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          margin-bottom: 10px;
        }
        .legal-meta {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .legal-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .legal-section {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          padding: 28px;
        }
        .legal-section-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--accent-primary);
          margin-bottom: 16px;
        }
        .legal-section-bar h2 {
          font-size: 1.25rem;
          color: var(--ink-primary);
        }
        .legal-section p {
          font-size: 0.9375rem;
          color: var(--ink-secondary);
          line-height: 1.6;
          margin-bottom: 14px;
        }
        .legal-section p:last-child {
          margin-bottom: 0;
        }
        .legal-bullets {
          list-style: square;
          padding-left: 24px;
          margin-bottom: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .legal-bullets li {
          font-size: 0.9375rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
        .legal-bullets li strong {
          color: var(--ink-primary);
        }
      `}</style>
    </div>
  );
}
