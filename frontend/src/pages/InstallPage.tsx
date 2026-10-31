import { useState } from 'react';
import { Download, Copy, Check, ArrowRight, ShieldCheck, Server } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { siteConfig } from '../config/site.config';

export default function InstallPage() {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const webhookUrl = 'http://localhost:8000/api/webhook';

  const manifest = {
    name: `PatchPilot-${siteConfig.githubUsername}`,
    url: 'http://localhost:5173',
    hook_attributes: {
      url: webhookUrl
    },
    redirect_url: 'http://localhost:5173',
    public: true,
    default_permissions: {
      issues: 'write',
      metadata: 'read'
    },
    default_events: [
      'issues',
      'issue_comment'
    ]
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="install-page page-fade">
      <div className="container">
        <header className="install-header">
          <div className="section-label">GitHub App &amp; Webhook Installation</div>
          <h1 className="install-title">Install PatchPilot on GitHub</h1>
          <p className="install-desc">
            Connect your repository issues to the triage engine. Choose between registering an official GitHub App on your account <strong>@{siteConfig.githubUsername}</strong> or attaching a direct webhook to any repository.
          </p>
        </header>

        <div className="install-cards-grid">
          {/* Method 1: Official GitHub App Manifest Registration */}
          <div className="install-card highlight-card">
            <div className="card-top-chip">
              <Download size={14} />
              <span>Recommended Flow</span>
            </div>
            <h2 className="card-title">1. One-Click GitHub App Manifest</h2>
            <p className="card-desc">
              GitHub allows registering apps instantly using verified JSON manifests. This pre-fills required permissions (<code className="inline-code">issues:write</code>) and sets the webhook endpoint without manual typing.
            </p>

            <div className="manifest-preview-box">
              <span className="box-label">Generated Manifest Configuration:</span>
              <pre className="manifest-pre">
                <code>{JSON.stringify(manifest, null, 2)}</code>
              </pre>
            </div>

            <form action="https://github.com/settings/apps/new" method="post" target="_blank" rel="noopener noreferrer">
              <input type="hidden" name="manifest" value={JSON.stringify(manifest)} />
              <button type="submit" className="btn btn-primary" id="submit-manifest-btn">
                <GithubIcon size={16} />
                <span>Register GitHub App on @{siteConfig.githubUsername}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {/* Method 2: Direct Repository Webhook */}
          <div className="install-card">
            <div className="card-top-chip">
              <Server size={14} />
              <span>Direct Repository Webhook</span>
            </div>
            <h2 className="card-title">2. Repository Webhook Setup</h2>
            <p className="card-desc">
              Alternatively, attach an event webhook to any of your existing repositories to stream issue creations and updates directly into PatchPilot.
            </p>

            <div className="webhook-field-group">
              <label htmlFor="webhook-input">Payload URL:</label>
              <div className="input-copy-row">
                <input
                  id="webhook-input"
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="code-input"
                />
                <button
                  onClick={handleCopyWebhook}
                  className="btn btn-secondary btn-sm"
                  aria-label="Copy Webhook URL"
                >
                  {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="webhook-settings-spec">
              <div className="spec-line">
                <span className="spec-k">Content type:</span>
                <span className="spec-v">application/json</span>
              </div>
              <div className="spec-line">
                <span className="spec-k">Which events:</span>
                <span className="spec-v">Let me select individual events (Issues, Issue comments)</span>
              </div>
              <div className="spec-line">
                <span className="spec-k">Active:</span>
                <span className="spec-v">Enable SSL verification</span>
              </div>
            </div>

            <a
              href={`https://github.com/${siteConfig.githubUsername}/Dataforge-SYNCRON/settings/hooks/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
            >
              <GithubIcon size={14} />
              <span>Open Webhook Settings in GitHub</span>
            </a>
          </div>
        </div>

        {/* Security & Verification Callout */}
        <div className="security-callout-card">
          <ShieldCheck size={20} className="shield-icon" />
          <div>
            <h3>HMAC Signature Verification &amp; Security Boundary</h3>
            <p>
              Incoming webhook payloads are verified on our edge receiver using HMAC-SHA256 signatures (<code className="inline-code">X-Hub-Signature-256</code>). Ephemeral tokens are kept in transient memory and purged immediately after comment dispatch.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .install-page {
          padding: 56px 0 80px;
          background-color: var(--bg-base);
        }
        .install-header {
          margin-bottom: 40px;
        }
        .install-title {
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          margin-bottom: 12px;
        }
        .install-desc {
          font-size: 1.05rem;
          color: var(--ink-secondary);
          max-width: 72ch;
          line-height: 1.55;
        }
        .install-cards-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 900px) {
          .install-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .install-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          padding: 32px;
          display: flex;
          flex-direction: column;
        }
        .highlight-card {
          border-color: var(--accent-border);
        }
        .card-top-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--accent-primary);
          font-weight: 600;
          margin-bottom: 16px;
          align-self: flex-start;
        }
        .card-title {
          font-size: 1.3rem;
          margin-bottom: 10px;
          color: var(--ink-primary);
        }
        .card-desc {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .manifest-preview-box {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 14px;
          margin-bottom: 24px;
        }
        .box-label {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: block;
        }
        .manifest-pre {
          max-height: 180px;
          overflow-y: auto;
          font-size: 0.75rem;
          color: var(--ink-secondary);
          line-height: 1.45;
        }
        .webhook-field-group {
          margin-bottom: 16px;
        }
        .webhook-field-group label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-muted);
          display: block;
          margin-bottom: 6px;
        }
        .input-copy-row {
          display: flex;
          gap: 8px;
        }
        .code-input {
          flex: 1;
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          color: var(--ink-primary);
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
        }
        .webhook-settings-spec {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .spec-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
          gap: 12px;
        }
        .spec-k {
          color: var(--ink-muted);
        }
        .spec-v {
          font-family: var(--font-mono);
          color: var(--ink-primary);
          text-align: right;
        }
        .security-callout-card {
          display: flex;
          gap: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 24px;
          align-items: flex-start;
        }
        .shield-icon {
          color: var(--accent-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .security-callout-card h3 {
          font-size: 1rem;
          margin-bottom: 6px;
          color: var(--ink-primary);
        }
        .security-callout-card p {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
