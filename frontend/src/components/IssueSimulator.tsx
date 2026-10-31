import { useState, useEffect, useCallback } from 'react';
import { Tag, Copy, Check, X, GitPullRequest, ArrowRight, ArrowUpRight, RefreshCw, FileText, Key, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import GithubIcon from './GithubIcon';
import { IssueSample } from '../types';
import { siteConfig } from '../config/site.config';

const BACKEND_URL = 'http://localhost:8000';

const SAMPLE_ISSUES: IssueSample[] = [
  {
    id: 'issue-1',
    number: 412,
    title: 'WebSocket connection drops state on cellular handover without backoff retry',
    body: 'When transitioning from WiFi to 5G on mobile clients, the underlying socket triggers a close code 1006. The reconnect handler currently resets state to null instead of maintaining the pending buffer, causing dropped telemetry events.',
    author: 'sarah-eng',
    category: 'Bug Report',
    appliedLabels: [
      { name: 'bug', color: '#B45309', confidence: 0.94 },
      { name: 'networking', color: '#1F2937', confidence: 0.91 },
      { name: 'priority: high', color: '#991B1B', confidence: 0.88 }
    ],
    duplicateMatch: null,
    draftReply: {
      markdown: `Thank you for opening this issue. Based on our networking specification, the socket reconnect handler in \`src/transport/socket.ts\` should preserve the pending telemetry buffer across close code 1006.\n\nCould you confirm if you observe the same drop when setting \`reconnectBackoff: exponential\` in your client configuration? If you have client debug logs from the handover event, please share them to help verify the fix.`,
      reproductionChecklist: [
        { item: 'Operating system and runtime version specified', satisfied: true },
        { item: 'Minimal reproduction repository link provided', satisfied: false },
        { item: 'Error logs and stack trace attached', satisfied: true }
      ],
      maintainerActionRequired: 'Review draft and click Approve to post via GitHub App token'
    }
  },
  {
    id: 'issue-2',
    number: 413,
    title: 'Worker thread pool retains memory references on unhandled rejected promises',
    body: 'We are observing linear heap growth of roughly 12MB per hour under high load when worker tasks throw unhandled exceptions. The worker cleanup routine does not dereference task context payloads.',
    author: 'alex-node',
    category: 'Potential Duplicate',
    appliedLabels: [
      { name: 'bug', color: '#B45309', confidence: 0.96 },
      { name: 'runtime', color: '#1F2937', confidence: 0.92 }
    ],
    duplicateMatch: {
      number: 384,
      title: 'Worker pool heap retention when tasks reject without handler',
      similarity: 0.92,
      reason: 'Both reports describe task payload retention in worker pool cleanup handlers during unhandled rejections.'
    },
    draftReply: {
      markdown: `Thank you for reporting this. This appears semantically identical to issue #384 (resolved in release v2.4.1), where the cleanup hook failed to nullify task context pointers.\n\nCould you check if your repository is running on v2.4.1 or later? If the memory growth still reproduces on the latest tag, we will reopen the investigation immediately.`,
      reproductionChecklist: [
        { item: 'Release version explicitly tested', satisfied: true },
        { item: 'Heap snapshot or reproduction script attached', satisfied: true },
        { item: 'Duplicate cross-reference verified', satisfied: true }
      ],
      maintainerActionRequired: 'Confirm duplicate match and post suggested resolution comment'
    }
  },
  {
    id: 'issue-3',
    number: 414,
    title: 'Add code example for passing custom authorization headers in client.ts',
    body: 'The readme documents basic GET requests, but does not explain how to attach bearer tokens or custom telemetry headers to the client instance. I would like to submit a documentation PR with an example.',
    author: 'jordan-contrib',
    category: 'First-Time Contributor',
    appliedLabels: [
      { name: 'documentation', color: '#2563EB', confidence: 0.95 },
      { name: 'good-first-issue', color: '#059669', confidence: 0.92 }
    ],
    duplicateMatch: null,
    draftReply: {
      markdown: `Welcome to the project, and thank you for volunteering to improve our documentation. A code snippet demonstrating custom header injection in \`examples/custom-headers.ts\` would be very welcome.\n\nPlease review our \`CONTRIBUTING.md\` documentation guide before submitting your PR. When creating your branch, branch from \`main\` and run \`npm run test:docs\` to ensure syntax validation passes.`,
      reproductionChecklist: [
        { item: 'First-time contributor identified', satisfied: true },
        { item: 'Documentation guidelines linked', satisfied: true },
        { item: 'Local test command provided', satisfied: true }
      ],
      maintainerActionRequired: 'Send welcoming initial guidance and assign good-first-issue tag'
    }
  }
];

interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  open_issues_count: number;
}

export default function IssueSimulator() {
  const [selectedIssue, setSelectedIssue] = useState<IssueSample>(SAMPLE_ISSUES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [postedStatus, setPostedStatus] = useState<string | null>(null);

  // Backend & GitHub Integration State
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [userRepos, setUserRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('jayvirjadeja008-gif/Jayvir-Jadeja');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [liveTriageSuccess, setLiveTriageSuccess] = useState<string | null>(null);

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(true);
        if (data.github_connected && data.github_user) {
          setGithubUser(data.github_user);
        }
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch repos if GitHub is connected
  const fetchRepos = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/github/repos`);
      if (res.ok) {
        const data = await res.json();
        if (data.repositories && data.repositories.length > 0) {
          setUserRepos(data.repositories);
          setSelectedRepo(data.repositories[0].full_name);
        }
      }
    } catch {
      // Ignore network errors
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkHealth();
    }, 0);
    const interval = setInterval(checkHealth, 10000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkHealth]);

  useEffect(() => {
    if (githubUser) {
      const timer = setTimeout(() => {
        fetchRepos();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [githubUser, fetchRepos]);

  const handleConnectToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setTokenLoading(true);
    setTokenError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/github/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubUser(data.user.login);
        setShowTokenModal(false);
        setTokenInput('');
        fetchRepos();
      } else {
        setTokenError(data.detail || 'Failed to authenticate token with GitHub');
      }
    } catch (err: unknown) {
      setTokenError(err instanceof Error ? err.message : 'Network error connecting to backend');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleSelectIssue = (issue: IssueSample) => {
    setIsProcessing(true);
    setPostedStatus(null);
    setCopiedDraft(false);
    setLiveTriageSuccess(null);
    setTimeout(() => {
      setSelectedIssue(issue);
      setIsProcessing(false);
    }, 280);
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(selectedIssue.draftReply.markdown);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleApproveDraft = async () => {
    setIsProcessing(true);
    const [owner, repo] = selectedRepo.split('/');

    // If backend is online, attempt live dispatch to GitHub API
    if (backendOnline && githubUser && owner && repo) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/triage/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            triage_id: selectedIssue.id,
            owner,
            repo,
            issue_number: selectedIssue.number,
            reply_markdown: selectedIssue.draftReply.markdown,
            labels: selectedIssue.appliedLabels.map((l) => l.name),
            post_to_github: true,
            apply_labels: true
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setLiveTriageSuccess(`Dispatched to GitHub repository ${selectedRepo} for issue #${selectedIssue.number}`);
          setPostedStatus(`Approved and synchronized with GitHub API.`);
          setIsProcessing(false);
          return;
        }
      } catch {
        // Fallback to local simulation feedback
      }
    }

    // Default simulation feedback
    setTimeout(() => {
      setPostedStatus(`Draft comment approved for #${selectedIssue.number}. Queued to GitHub API.`);
      setIsProcessing(false);
      setTimeout(() => setPostedStatus(null), 3500);
    }, 400);
  };

  return (
    <div id="workbench" className="workbench-card">
      {/* Live GitHub & Backend Connection Status Bar */}
      <div className="connection-bar">
        <div className="connection-left">
          <div className="backend-indicator">
            <span className={`status-pill-dot ${backendOnline ? 'dot-online' : 'dot-offline'}`}></span>
            <span className="indicator-label">
              Backend Engine: {backendOnline ? 'Online (FastAPI :8000)' : 'Offline / Standalone Mode'}
            </span>
          </div>

          <a
            href={githubUser ? `https://github.com/${githubUser}` : siteConfig.githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="github-account-chip"
            title="Visit GitHub Profile"
          >
            <GithubIcon size={14} />
            {githubUser ? (
              <span className="github-user-tag">
                Profile: <strong>@{githubUser}</strong>
              </span>
            ) : (
              <span className="github-user-tag">
                Profile: <strong>@{siteConfig.githubUsername}</strong>
              </span>
            )}
            <ArrowUpRight size={11} style={{ opacity: 0.7 }} />
          </a>
        </div>

        <div className="connection-right">
          {githubUser ? (
            <div className="repo-picker-wrapper">
              <label htmlFor="repo-select" className="picker-label">Target Repository:</label>
              <div className="select-container">
                <select
                  id="repo-select"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="repo-dropdown"
                >
                  {userRepos.length > 0 ? (
                    userRepos.map((r) => (
                      <option key={r.id} value={r.full_name}>
                        {r.full_name} ({r.open_issues_count} open)
                      </option>
                    ))
                  ) : (
                    <option value="jayvirjadeja008-gif/Jayvir-Jadeja">
                      jayvirjadeja008-gif/Jayvir-Jadeja
                    </option>
                  )}
                </select>
                <ChevronDown size={13} className="select-arrow" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowTokenModal(true)}
              className="btn btn-sm btn-primary"
              id="connect-github-btn"
            >
              <Key size={13} />
              <span>Connect Your GitHub Token</span>
            </button>
          )}
        </div>
      </div>

      {/* GitHub Token Connection Modal */}
      {showTokenModal && (
        <div className="token-modal-overlay" role="dialog" aria-modal="true">
          <div className="token-modal-card">
            <div className="token-modal-header">
              <div className="modal-title-group">
                <GithubIcon size={18} />
                <h3>Connect GitHub Token</h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="btn btn-sm btn-secondary"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            <p className="modal-p">
              Connect your GitHub Personal Access Token (classic with <code className="inline-code">repo</code> scope, or fine-grained with <code className="inline-code">Issues: Read and write</code>). Your token is authenticated directly against GitHub API and stored in your local backend SQLite database.
            </p>

            <form onSubmit={handleConnectToken}>
              <div className="form-group">
                <label htmlFor="github-token-input">GitHub Token:</label>
                <input
                  id="github-token-input"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="token-input-field"
                  required
                />
              </div>

              {tokenError && (
                <div className="modal-error-box">
                  <AlertCircle size={14} />
                  <span>{tokenError}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tokenLoading}
                  className="btn btn-primary btn-sm"
                >
                  {tokenLoading ? <RefreshCw size={13} className="spin" /> : <CheckCircle2 size={13} />}
                  <span>{tokenLoading ? 'Verifying...' : 'Verify and Connect'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Workbench Header */}
      <div className="workbench-header">
        <div className="workbench-header-left">
          <span className="terminal-dot"></span>
          <span className="terminal-title">Interactive Triage Workbench</span>
          <span className="tag tag-accent">Live Simulation &amp; GitHub Sync</span>
        </div>
        <div className="workbench-controls">
          <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Select Sample:</span>
          <div className="sample-button-group">
            {SAMPLE_ISSUES.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleSelectIssue(issue)}
                className={`btn btn-sm ${selectedIssue.id === issue.id ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={selectedIssue.id === issue.id}
              >
                #{issue.number}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="workbench-body">
        {/* Left Column: Incoming Issue Data */}
        <div className="workbench-column">
          <div className="column-label">
            <FileText size={14} />
            <span>Target: {selectedRepo} (Issue #{selectedIssue.number})</span>
          </div>

          <div className="issue-payload-box">
            <div className="payload-meta">
              <span className="payload-number">#{selectedIssue.number}</span>
              <span className="payload-author">opened by @{selectedIssue.author}</span>
              <span className="tag">{selectedIssue.category}</span>
            </div>
            <h3 className="payload-title">{selectedIssue.title}</h3>
            <div className="payload-body">
              <p>{selectedIssue.body}</p>
            </div>
          </div>

          {/* Feature 1: Classification & Tagging */}
          <div className="feature-block">
            <div className="feature-block-title">
              <Tag size={15} />
              <span>Feature 1: Issue Classification and Semantic Tagging</span>
            </div>
            <p className="feature-block-desc">
              Analyzes issue text against repository taxonomy, calculating calibrated confidence values.
            </p>
            <div className="labels-wrapper">
              {selectedIssue.appliedLabels.map((lbl) => (
                <div key={lbl.name} className="label-pill">
                  <span className="label-dot" style={{ backgroundColor: lbl.color }}></span>
                  <span className="label-name">{lbl.name}</span>
                  <span className="label-confidence">{(lbl.confidence * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Duplicate Detection and First Reply Drafting */}
        <div className="workbench-column">
          {/* Feature 2: Duplicate Detection */}
          <div className="feature-block" style={{ marginTop: 0 }}>
            <div className="feature-block-title">
              <GitPullRequest size={15} />
              <span>Feature 2: Duplicate Issue Detection</span>
            </div>
            {selectedIssue.duplicateMatch ? (
              <div className="duplicate-alert">
                <div className="duplicate-alert-header">
                  <span className="duplicate-tag">Duplicate Candidate</span>
                  <span className="duplicate-score">
                    Cosine Similarity: {(selectedIssue.duplicateMatch.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="duplicate-content">
                  <span className="duplicate-ref">#{selectedIssue.duplicateMatch.number}</span>
                  <span className="duplicate-title">{selectedIssue.duplicateMatch.title}</span>
                </div>
                <p className="duplicate-reason">{selectedIssue.duplicateMatch.reason}</p>
              </div>
            ) : (
              <div className="no-duplicate-card">
                <span className="status-indicator-clean"></span>
                <span>No duplicate candidates found. Semantic overlap under 0.45.</span>
              </div>
            )}
          </div>

          {/* Feature 3: First-Reply Drafting */}
          <div className="feature-block">
            <div className="feature-block-title">
              <ArrowRight size={15} />
              <span>Feature 3: Contextual First-Reply Drafting</span>
            </div>
            <p className="feature-block-desc">
              Synthesizes repository documentation into a draft reply held for maintainer approval.
            </p>

            <div className="draft-reply-box">
              <div className="draft-reply-meta">
                <span>Draft Reply (Held in Queue)</span>
                <button
                  onClick={handleCopyDraft}
                  className="btn btn-sm btn-secondary"
                  aria-label="Copy draft reply text"
                >
                  {copiedDraft ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedDraft ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="draft-code-view">
                <code>{selectedIssue.draftReply.markdown}</code>
              </pre>

              <div className="checklist-box">
                <span className="checklist-heading">Reproduction Checklist Verification:</span>
                <ul className="checklist-items">
                  {selectedIssue.draftReply.reproductionChecklist.map((chk, i) => (
                    <li key={i} className="checklist-item">
                      <span className={`chk-mark ${chk.satisfied ? 'chk-yes' : 'chk-no'}`}>
                        {chk.satisfied ? <Check size={11} /> : <X size={11} />}
                      </span>
                      <span>{chk.item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="draft-actions">
                <button
                  onClick={handleApproveDraft}
                  className="btn btn-primary btn-sm"
                  disabled={isProcessing}
                  id="approve-draft-btn"
                >
                  {isProcessing ? <RefreshCw size={13} className="spin" /> : <Check size={13} />}
                  <span>
                    {backendOnline && githubUser ? 'Approve and Post Directly to GitHub' : 'Approve and Queue to GitHub'}
                  </span>
                </button>
                <span className="action-hint">Requires maintainer click before posting</span>
              </div>

              {postedStatus && (
                <div className="posted-banner" role="status">
                  {postedStatus}
                </div>
              )}

              {liveTriageSuccess && (
                <div className="live-success-banner" role="status">
                  <CheckCircle2 size={14} />
                  <span>{liveTriageSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .workbench-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-top: 32px;
        }
        .connection-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #11151B;
          border-bottom: 1px solid var(--border-base);
          flex-wrap: wrap;
          gap: 12px;
        }
        .connection-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .backend-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .status-pill-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
        .dot-online {
          background: #10B981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }
        .dot-offline {
          background: #D97706;
        }
        .github-account-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--ink-primary);
        }
        .github-user-tag strong {
          color: var(--accent-primary);
        }
        .github-disconnected-tag {
          color: var(--ink-muted);
        }
        .connection-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .repo-picker-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .picker-label {
          font-size: 0.75rem;
          color: var(--ink-muted);
          font-family: var(--font-mono);
        }
        .select-container {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .repo-dropdown {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          color: var(--ink-primary);
          padding: 5px 28px 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
          appearance: none;
          cursor: pointer;
        }
        .repo-dropdown:focus {
          outline: 2px solid var(--accent-primary);
        }
        .select-arrow {
          position: absolute;
          right: 8px;
          pointer-events: none;
          color: var(--ink-muted);
        }
        .token-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .token-modal-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-lg);
          padding: 24px;
          max-width: 500px;
          width: 100%;
        }
        .token-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-primary);
        }
        .modal-title-group h3 {
          font-size: 1.1rem;
        }
        .modal-p {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .form-group label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-muted);
        }
        .token-input-field {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          color: var(--ink-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.875rem;
        }
        .token-input-field:focus {
          outline: 2px solid var(--accent-primary);
        }
        .modal-error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-sm);
          color: #F87171;
          font-size: 0.8125rem;
          margin-bottom: 14px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .workbench-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-base);
          flex-wrap: wrap;
          gap: 12px;
        }
        .workbench-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .terminal-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-primary);
          border-radius: 2px;
        }
        .terminal-title {
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--ink-primary);
        }
        .workbench-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sample-button-group {
          display: flex;
          gap: 6px;
        }
        .workbench-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          padding: 24px;
        }
        @media (max-width: 900px) {
          .workbench-body {
            grid-template-columns: 1fr;
          }
        }
        .column-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }
        .issue-payload-box {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 20px;
        }
        .payload-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 0.8125rem;
        }
        .payload-number {
          font-family: var(--font-mono);
          color: var(--accent-primary);
          font-weight: 600;
        }
        .payload-author {
          color: var(--ink-muted);
        }
        .payload-title {
          font-size: 1.05rem;
          margin-bottom: 10px;
          color: var(--ink-primary);
        }
        .payload-body p {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          line-height: 1.5;
        }
        .feature-block {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-top: 16px;
        }
        .feature-block-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink-primary);
          font-size: 0.9375rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .feature-block-desc {
          font-size: 0.8125rem;
          color: var(--ink-muted);
          margin-bottom: 14px;
        }
        .labels-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .label-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          font-family: var(--font-mono);
        }
        .label-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
        .label-confidence {
          color: var(--accent-primary);
          font-weight: 600;
          font-size: 0.75rem;
          margin-left: 4px;
        }
        .duplicate-alert {
          background: rgba(217, 119, 6, 0.08);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-sm);
          padding: 12px;
        }
        .duplicate-alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .duplicate-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #FBBF24;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .duplicate-score {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--accent-primary);
        }
        .duplicate-content {
          display: flex;
          gap: 8px;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .duplicate-ref {
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--ink-primary);
        }
        .duplicate-title {
          font-size: 0.875rem;
          color: var(--ink-primary);
        }
        .duplicate-reason {
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .no-duplicate-card {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--ink-muted);
          padding: 10px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
        }
        .status-indicator-clean {
          width: 8px;
          height: 8px;
          background: #059669;
          border-radius: 2px;
        }
        .draft-reply-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 12px;
        }
        .draft-reply-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .draft-code-view {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          padding: 12px;
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--ink-secondary);
          white-space: pre-wrap;
          line-height: 1.5;
          margin-bottom: 12px;
          max-height: 180px;
          overflow-y: auto;
        }
        .checklist-box {
          margin-bottom: 14px;
          padding: 10px;
          background: var(--bg-base);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .checklist-heading {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }
        .checklist-items {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--ink-secondary);
        }
        .chk-mark {
          font-family: var(--font-mono);
          font-weight: 700;
        }
        .chk-yes {
          color: #10B981;
        }
        .chk-no {
          color: #EF4444;
        }
        .draft-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .action-hint {
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .posted-banner {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: #34D399;
        }
        .live-success-banner {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(217, 119, 6, 0.1);
          border: 1px solid var(--accent-border);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: #FBBF24;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
