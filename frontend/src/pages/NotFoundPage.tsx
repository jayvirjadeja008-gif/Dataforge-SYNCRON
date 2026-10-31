import { Home, BookOpen } from 'lucide-react';
import { AppRoute } from '../types';

interface NotFoundPageProps {
  onNavigate: (route: AppRoute) => void;
}

export default function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <div className="not-found-page page-fade">
      <div className="container not-found-container">
        <div className="not-found-code-box">
          <div className="terminal-header-mini">
            <span className="dot-mini"></span>
            <span>HTTP 404: Route Not Found</span>
          </div>
          <pre className="not-found-pre">
            <code>{`$ curl -i https://patchpilot.dev/unknown-route
HTTP/2 404 Not Found
content-type: text/plain; charset=utf-8
x-patchpilot-error: ERR_ROUTE_NOT_REGISTERED

The requested path does not exist in the routing manifest.`}</code>
          </pre>
        </div>

        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-desc">
          The requested route was not found in our application router. You can return to the homepage or inspect technical documentation below.
        </p>

        <div className="not-found-actions">
          <button
            onClick={() => onNavigate('home')}
            className="btn btn-primary"
            id="not-found-home-btn"
          >
            <Home size={15} />
            <span>Return to Home</span>
          </button>
          <button
            onClick={() => onNavigate('docs')}
            className="btn btn-secondary"
            id="not-found-docs-btn"
          >
            <BookOpen size={15} />
            <span>View Documentation</span>
          </button>
        </div>
      </div>

      <style>{`
        .not-found-page {
          padding: 80px 0 100px;
          min-height: 60vh;
          display: flex;
          align-items: center;
        }
        .not-found-container {
          max-width: 680px;
        }
        .not-found-code-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .terminal-header-mini {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .dot-mini {
          width: 8px;
          height: 8px;
          background: #EF4444;
          border-radius: 2px;
        }
        .not-found-pre {
          padding: 16px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
          line-height: 1.5;
          overflow-x: auto;
        }
        .not-found-title {
          font-size: 2rem;
          margin-bottom: 12px;
          color: var(--ink-primary);
        }
        .not-found-desc {
          font-size: 1rem;
          color: var(--ink-muted);
          margin-bottom: 24px;
          line-height: 1.5;
        }
        .not-found-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}
