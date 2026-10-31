import { useState } from 'react';
import { Globe, Copy, Check, ShieldCheck, Server } from 'lucide-react';
import { siteConfig } from '../config/site.config';

export default function CustomDomainConfig() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="domain-config-container">
      <div className="section-header">
        <div className="section-label">Production Routing</div>
        <h2 className="section-title">Custom Domain &amp; DNS Configuration</h2>
        <p className="section-desc">
          Configured for canonical host <code className="inline-code">{siteConfig.customDomain}</code> with apex redirection and automatic TLS certificate enforcement.
        </p>
      </div>

      <div className="dns-status-card">
        <div className="dns-status-header">
          <div className="status-indicator">
            <span className="status-live-dot"></span>
            <span>Target Host: {siteConfig.customDomain}</span>
          </div>
          <span className="tag tag-accent">HTTPS Enforced (HSTS)</span>
        </div>

        <div className="dns-table-wrapper">
          <table className="dns-table">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Host</th>
                <th scope="col">Target Value</th>
                <th scope="col">TTL</th>
                <th scope="col">Routing Purpose</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {siteConfig.dnsRecords.map((record, index) => (
                <tr key={index}>
                  <td>
                    <span className="record-badge">{record.type}</span>
                  </td>
                  <td>
                    <code className="cell-code">{record.host}</code>
                  </td>
                  <td>
                    <code className="cell-code">{record.value}</code>
                  </td>
                  <td>{record.ttl}s</td>
                  <td className="purpose-cell">{record.purpose}</td>
                  <td>
                    <button
                      onClick={() => handleCopy(`dns-${index}`, record.value)}
                      className="btn btn-sm btn-secondary"
                      aria-label={`Copy DNS value ${record.value}`}
                    >
                      {copiedKey === `dns-${index}` ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === `dns-${index}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="domain-instructions-grid">
        <div className="instruction-card">
          <div className="instruction-icon">
            <Server size={18} />
          </div>
          <h3 className="instruction-title">1. Apex and WWW Redirection</h3>
          <p className="instruction-text">
            Configure an HTTP 301 Permanent Redirect from <code className="inline-code">www.{siteConfig.customDomain}</code> to <code className="inline-code">https://{siteConfig.customDomain}</code>. This prevents duplicate indexation and consolidates search rank.
          </p>
        </div>

        <div className="instruction-card">
          <div className="instruction-icon">
            <ShieldCheck size={18} />
          </div>
          <h3 className="instruction-title">2. HTTPS and TLS 1.3 Enforcement</h3>
          <p className="instruction-text">
            Edge servers automatically provision Let&apos;s Encrypt certificates. HTTP requests are redirected to HTTPS with the Strict-Transport-Security header: <code className="inline-code">max-age=31536000; includeSubDomains</code>.
          </p>
        </div>

        <div className="instruction-card">
          <div className="instruction-icon">
            <Globe size={18} />
          </div>
          <h3 className="instruction-title">3. Canonical Tag Verification</h3>
          <p className="instruction-text">
            The site issues <code className="inline-code">&lt;link rel=&quot;canonical&quot; href=&quot;{siteConfig.canonicalUrl}&quot; /&gt;</code> on every route to ensure search engines recognize the custom domain as primary.
          </p>
        </div>
      </div>

      <style>{`
        .domain-config-container {
          padding: 24px 0;
        }
        .dns-status-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 32px;
        }
        .dns-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          flex-wrap: wrap;
          gap: 12px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--ink-primary);
          font-size: 0.9375rem;
        }
        .status-live-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 2px;
        }
        .dns-table-wrapper {
          overflow-x: auto;
        }
        .dns-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .dns-table th {
          background: var(--bg-surface);
          color: var(--ink-muted);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-base);
        }
        .dns-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--ink-secondary);
        }
        .dns-table tr:last-child td {
          border-bottom: none;
        }
        .record-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--accent-primary);
        }
        .cell-code {
          font-family: var(--font-mono);
          color: var(--ink-primary);
          background: var(--bg-base);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
        }
        .inline-code {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--ink-primary);
          background: var(--bg-surface);
          padding: 2px 5px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-base);
        }
        .purpose-cell {
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .domain-instructions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 860px) {
          .domain-instructions-grid {
            grid-template-columns: 1fr;
          }
        }
        .instruction-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .instruction-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--accent-primary);
          margin-bottom: 16px;
        }
        .instruction-title {
          font-size: 1.05rem;
          margin-bottom: 10px;
          color: var(--ink-primary);
        }
        .instruction-text {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
