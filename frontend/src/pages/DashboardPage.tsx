import { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Send,
  Database,
  Search,
  Sliders,
  Key,
  GitPullRequest,
  Activity,
  Radio,
  Cpu
} from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import VectorSpace3D from '../components/VectorSpace3D';
import PulseMatrix from '../components/PulseMatrix';
import LiveTerminalStream from '../components/LiveTerminalStream';
import UnifiedDiffViewer from '../components/UnifiedDiffViewer';
import CodeSherpaChat from '../components/CodeSherpaChat';
import { siteConfig } from '../config/site.config';
import { TriageRecord, TriageStats, RepoIssue } from '../types';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/sound';

const BACKEND_URL = 'http://localhost:8000';

interface RepoOption {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  open_issues_count: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'console' | 'chat' | 'vectorspace' | 'pulse' | 'terminal' | 'history' | 'webhook' | 'settings'>('console');
  const [apiLatencyMs, setApiLatencyMs] = useState<number>(18);
  
  // Backend & GitHub status
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [githubUser, setGithubUser] = useState<string>(siteConfig.githubUsername);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>(`${siteConfig.githubUsername}/Dataforge-SYNCRON`);
  
  // Stats
  const [stats, setStats] = useState<TriageStats>({
    total_triaged: 0,
    approved: 0,
    pending: 0,
    duplicates_flagged: 0,
    avg_confidence: 0.92
  });

  // Triage Console State
  const [issueInputMode, setIssueInputMode] = useState<'preset' | 'custom'>('preset');
  const [repoIssues, setRepoIssues] = useState<RepoIssue[]>([]);
  const [selectedRepoIssueNumber, setSelectedRepoIssueNumber] = useState<number | null>(null);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(false);
  
  // Custom issue fields
  const [customTitle, setCustomTitle] = useState<string>('Data pipeline ingestion stalls on corrupted UTF-8 payloads');
  const [customBody, setCustomBody] = useState<string>('When streaming high-volume JSON telemetry with special unicode characters, the parser throws UnicodeDecodeError and does not resume the stream buffer. Need boundary check and dead-letter queue routing.');
  const [customAuthor, setCustomAuthor] = useState<string>('sarah-eng');
  
  // Triage processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [triageProgressStage, setTriageProgressStage] = useState<string>('');
  const [currentTriageResult, setCurrentTriageResult] = useState<TriageRecord | null>(null);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState<boolean>(false);
  const [postToGithubChecked, setPostToGithubChecked] = useState<boolean>(true);
  const [editableDraftMarkdown, setEditableDraftMarkdown] = useState<string>('');

  // Webhook Simulator State
  const [webhookSimPayload, setWebhookSimPayload] = useState<string>(JSON.stringify({
    event: 'issues',
    action: 'opened',
    owner: siteConfig.githubUsername,
    repo: 'Dataforge-SYNCRON',
    issue_number: 104,
    title: 'Memory leak in streaming parser worker during high payload throughput',
    body: 'Continuous ingestion of 50MB telemetry logs triggers monotonic memory growth in the worker heap. The garbage collector does not reclaim parsed buffer handles.',
    author: 'developer-jane'
  }, null, 2));
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState<boolean>(false);
  const [webhookSimResult, setWebhookSimResult] = useState<any | null>(null);

  // History & Audit Log State
  const [historyRecords, setHistoryRecords] = useState<TriageRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Settings State
  const [tokenInput, setTokenInput] = useState<string>('');
  const [tokenStatusMessage, setTokenStatusMessage] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);

  // 1. Health & Connection Check
  const checkBackendHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      const latency = Math.round(performance.now() - start);
      setApiLatencyMs(latency);
      if (res.ok) {
        const data = await res.json();
        setBackendOnline(true);
        if (data.github_user) {
          setGithubUser(data.github_user);
        }
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // 2. Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/triage/stats`);
      if (res.ok) {
        const data: TriageStats = await res.json();
        setStats(data);
      }
    } catch {
      // Backend offline
    }
  }, []);

  // 3. Fetch Repositories
  const fetchRepos = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/github/repos`);
      if (res.ok) {
        const data = await res.json();
        if (data.repositories && data.repositories.length > 0) {
          setRepos(data.repositories);
          if (!selectedRepoFullName) {
            setSelectedRepoFullName(data.repositories[0].full_name);
          }
        }
      }
    } catch {
      // Backend offline
    }
  }, [selectedRepoFullName]);

  // 4. Fetch Issues for Selected Repo
  const fetchIssuesForRepo = useCallback(async (repoFullName: string) => {
    setLoadingIssues(true);
    try {
      const [owner, repo] = repoFullName.split('/');
      const res = await fetch(`${BACKEND_URL}/api/github/repos/${owner}/${repo}/issues`);
      if (res.ok) {
        const data = await res.json();
        setRepoIssues(data.issues || []);
        if (data.issues && data.issues.length > 0) {
          setSelectedRepoIssueNumber(data.issues[0].number);
          setCustomTitle(data.issues[0].title);
          setCustomBody(data.issues[0].body);
          setCustomAuthor(data.issues[0].author);
        }
      }
    } catch {
      setRepoIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  }, []);

  // 5. Fetch History Records
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/triage/history?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
      }
    } catch {
      setHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    const timer = setTimeout(() => {
      checkBackendHealth();
      fetchStats();
      fetchRepos();
      fetchHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkBackendHealth, fetchStats, fetchRepos, fetchHistory]);

  // When selected repo changes, load its issues
  useEffect(() => {
    if (selectedRepoFullName) {
      const timer = setTimeout(() => {
        fetchIssuesForRepo(selectedRepoFullName);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedRepoFullName, fetchIssuesForRepo]);

  // Keyboard navigation shortcuts for tabs (1 through 7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside form inputs
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === '1') {
        setActiveTab('console');
        playClickSound();
      } else if (e.key === '2') {
        setActiveTab('chat');
        playClickSound();
      } else if (e.key === '3') {
        setActiveTab('vectorspace');
        playClickSound();
      } else if (e.key === '4') {
        setActiveTab('pulse');
        playClickSound();
      } else if (e.key === '5') {
        setActiveTab('terminal');
        playClickSound();
      } else if (e.key === '6') {
        setActiveTab('history');
        fetchHistory();
        playClickSound();
      } else if (e.key === '7') {
        setActiveTab('webhook');
        playClickSound();
      } else if (e.key === '8') {
        setActiveTab('settings');
        playClickSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchHistory]);

  // Handle Repo Issue Select
  const handleSelectRepoIssue = (issue: RepoIssue) => {
    setSelectedRepoIssueNumber(issue.number);
    setCustomTitle(issue.title);
    setCustomBody(issue.body);
    setCustomAuthor(issue.author);
    setCurrentTriageResult(null);
    setApprovalStatus(null);
  };

  // Run Live Triage
  const handleRunTriage = async () => {
    if (!customTitle.trim()) {
      setTriageError('Issue title is required.');
      return;
    }
    setIsProcessing(true);
    setTriageError(null);
    setApprovalStatus(null);
    setCurrentTriageResult(null);

    const [owner, repo] = selectedRepoFullName.split('/');
    
    // Simulate real progress sequence
    setTriageProgressStage('Ingesting issue markdown and metadata...');
    await new Promise(r => setTimeout(r, 200));

    setTriageProgressStage('Generating 1536-dimensional vector embedding...');
    await new Promise(r => setTimeout(r, 200));

    setTriageProgressStage('Computing cosine similarity against historical repository issues...');
    await new Promise(r => setTimeout(r, 200));

    setTriageProgressStage('Evaluating issue against label taxonomy and structured schema...');
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/triage/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          issue_number: selectedRepoIssueNumber || 101,
          custom_title: customTitle,
          custom_body: customBody,
          custom_author: customAuthor
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Triage processing failed');
      }

      const result: TriageRecord = await res.json();
      setCurrentTriageResult(result);
      setEditableDraftMarkdown(result.draft_reply_markdown);
      fetchStats();
      fetchHistory();
      playSuccessSound();
    } catch (err: any) {
      playAlertSound();
      setTriageError(err.message || 'Error communicating with backend triage engine');
    } finally {
      setIsProcessing(false);
      setTriageProgressStage('');
    }
  };

  // Approve Triage
  const handleApproveTriage = async () => {
    if (!currentTriageResult) return;
    const [owner, repo] = selectedRepoFullName.split('/');
    setApprovalStatus('Recording approval in SQLite...');

    try {
      const res = await fetch(`${BACKEND_URL}/api/triage/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triage_id: currentTriageResult.id,
          owner,
          repo,
          issue_number: currentTriageResult.issue_number,
          reply_markdown: editableDraftMarkdown,
          labels: currentTriageResult.applied_labels.map(l => l.name),
          post_to_github: postToGithubChecked,
          apply_labels: postToGithubChecked
        })
      });

      if (res.ok) {
        setApprovalStatus('Triage decision approved and logged in database.');
        setCurrentTriageResult(prev => prev ? { ...prev, status: 'approved' } : null);
        fetchStats();
        fetchHistory();
        playSuccessSound();
      } else {
        const errData = await res.json();
        setApprovalStatus(`Failed to approve: ${errData.detail || 'Server error'}`);
        playAlertSound();
      }
    } catch (err: any) {
      setApprovalStatus(`Error: ${err.message || 'Network error'}`);
      playAlertSound();
    }
  };

  // Copy Draft
  const handleCopyDraft = () => {
    navigator.clipboard.writeText(editableDraftMarkdown);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Webhook Simulation
  const handleSendSimulatedWebhook = async () => {
    setIsSimulatingWebhook(true);
    setWebhookSimResult(null);
    try {
      const parsed = JSON.parse(webhookSimPayload);
      const res = await fetch(`${BACKEND_URL}/api/webhook/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      setWebhookSimResult(data);
      fetchStats();
      fetchHistory();
    } catch (err: any) {
      setWebhookSimResult({ error: err.message || 'Invalid JSON or server error' });
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all triage records from the SQLite database?')) {
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/triage/history`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
        fetchStats();
        setCurrentTriageResult(null);
      }
    } catch {
      // Failed to clear
    }
  };

  // Connect Token
  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setTokenLoading(true);
    setTokenStatusMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/github/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTokenStatusMessage(`Successfully connected to GitHub as @${data.user.login}`);
        setGithubUser(data.user.login);
        setTokenInput('');
        fetchRepos();
      } else {
        setTokenStatusMessage(`Connection error: ${data.detail || 'Invalid token'}`);
      }
    } catch (err: any) {
      setTokenStatusMessage(`Error: ${err.message || 'Backend network failure'}`);
    } finally {
      setTokenLoading(false);
    }
  };

  // Filter history records
  const filteredHistory = historyRecords.filter(record => {
    if (historyFilter !== 'all' && record.status !== historyFilter) {
      return false;
    }
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      return (
        record.issue_title.toLowerCase().includes(q) ||
        record.repo_full_name.toLowerCase().includes(q) ||
        record.issue_author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="dashboard-page page-fade">
      <div className="container">
        {/* Top Header & Live Health Bar */}
        <header className="dashboard-header">
          <div className="header-meta-row">
            <div className="dashboard-badge">
              <span className={`status-indicator ${backendOnline ? 'online' : 'offline'}`}></span>
              <span>
                Backend API: {backendOnline ? 'FastAPI 8000 Online (SQLite Ready)' : 'Connecting to localhost:8000...'}
              </span>
            </div>
            <div className="profile-chip">
              <GithubIcon size={14} />
              <span>Profile: <strong>@{githubUser}</strong></span>
              <span className="chip-sep">/</span>
              <span>Team: <strong>{siteConfig.teamNames.join(', ')}</strong></span>
            </div>
          </div>

          <h1 className="dashboard-title">Production Triage Workbench</h1>
          <p className="dashboard-subline">
            Execute real AI triage workflows across your GitHub repositories. Ingest issues, evaluate label confidence, flag vector duplicates, and store maintainer audit logs in SQLite.
          </p>

          {/* Aggregate Stats Ribbon */}
          <div className="stats-ribbon">
            <div className="stat-card">
              <div className="stat-label">Total Triaged Issues</div>
              <div className="stat-val">{stats.total_triaged}</div>
              <div className="stat-desc">Processed via deterministic engine</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Approved &amp; Logged</div>
              <div className="stat-val stat-val-success">{stats.approved}</div>
              <div className="stat-desc">Maintainer confirmed responses</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Approval</div>
              <div className="stat-val stat-val-warn">{stats.pending}</div>
              <div className="stat-desc">Drafts awaiting human sign-off</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Duplicate Matches Flagged</div>
              <div className="stat-val">{stats.duplicates_flagged}</div>
              <div className="stat-desc">Cosine similarity threshold 0.88</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Confidence</div>
              <div className="stat-val">{(stats.avg_confidence * 100).toFixed(0)}%</div>
              <div className="stat-desc">Structured taxonomy threshold 0.85</div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="dashboard-tabs-bar" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => { setActiveTab('console'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'console'}
          >
            <Terminal size={14} />
            <span>Triage Console</span>
            <kbd className="tab-hotkey">1</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => { setActiveTab('chat'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'chat'}
          >
            <Cpu size={14} />
            <span>CodeSherpa AI</span>
            <kbd className="tab-hotkey">2</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'vectorspace' ? 'active' : ''}`}
            onClick={() => { setActiveTab('vectorspace'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'vectorspace'}
          >
            <GitPullRequest size={14} />
            <span>3D Vector Space</span>
            <kbd className="tab-hotkey">3</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'pulse' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pulse'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'pulse'}
          >
            <Activity size={14} />
            <span>Pulse Matrix</span>
            <kbd className="tab-hotkey">4</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => { setActiveTab('terminal'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'terminal'}
          >
            <Radio size={14} />
            <span>Live Stream</span>
            <kbd className="tab-hotkey">5</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('history'); fetchHistory(); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'history'}
          >
            <Database size={14} />
            <span>SQLite Audit ({historyRecords.length})</span>
            <kbd className="tab-hotkey">6</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'webhook' ? 'active' : ''}`}
            onClick={() => { setActiveTab('webhook'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'webhook'}
          >
            <Send size={14} />
            <span>Webhook</span>
            <kbd className="tab-hotkey">7</kbd>
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); playClickSound(); }}
            role="tab"
            aria-selected={activeTab === 'settings'}
          >
            <Sliders size={14} />
            <span>Settings</span>
            <kbd className="tab-hotkey">8</kbd>
          </button>
        </div>

        {/* TAB 1: INTERACTIVE TRIAGE CONSOLE */}
        {activeTab === 'console' && (
          <div className="tab-pane">
            <div className="console-layout">
              {/* Left Column: Repository & Issue Selection */}
              <div className="console-controls">
                <div className="panel-box">
                  <div className="panel-title">
                    <GithubIcon size={14} />
                    <span>Target Repository (@{githubUser})</span>
                  </div>

                  <select
                    className="form-select"
                    value={selectedRepoFullName}
                    onChange={(e) => setSelectedRepoFullName(e.target.value)}
                    aria-label="Select GitHub repository"
                  >
                    {repos.length > 0 ? (
                      repos.map(r => (
                        <option key={r.id} value={r.full_name}>
                          {r.full_name} ({r.open_issues_count} open issues)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={`${githubUser}/Dataforge-SYNCRON`}>{githubUser}/Dataforge-SYNCRON</option>
                        <option value={`${githubUser}/Jayvir-Jadeja`}>{githubUser}/Jayvir-Jadeja</option>
                        <option value={`${githubUser}/SYNCRON`}>{githubUser}/SYNCRON</option>
                        <option value={`${githubUser}/Local-Repo`}>{githubUser}/Local-Repo</option>
                      </>
                    )}
                  </select>

                  <div className="input-mode-toggle">
                    <button
                      className={`mode-btn ${issueInputMode === 'preset' ? 'active' : ''}`}
                      onClick={() => setIssueInputMode('preset')}
                    >
                      Repo Issues ({repoIssues.length})
                    </button>
                    <button
                      className={`mode-btn ${issueInputMode === 'custom' ? 'active' : ''}`}
                      onClick={() => setIssueInputMode('custom')}
                    >
                      Custom Composer
                    </button>
                  </div>

                  {issueInputMode === 'preset' && (
                    <div className="preset-issues-list">
                      {loadingIssues ? (
                        <div className="loading-state">Loading issues from repository...</div>
                      ) : repoIssues.length > 0 ? (
                        repoIssues.map((issue) => (
                          <button
                            key={issue.number}
                            className={`issue-picker-item ${selectedRepoIssueNumber === issue.number ? 'selected' : ''}`}
                            onClick={() => handleSelectRepoIssue(issue)}
                          >
                            <div className="picker-item-top">
                              <span className="issue-num">#{issue.number}</span>
                              <span className="issue-author">by @{issue.author}</span>
                            </div>
                            <div className="picker-item-title">{issue.title}</div>
                          </button>
                        ))
                      ) : (
                        <div className="empty-picker">
                          No open issues found on this repository. Switch to Custom Composer to write an issue.
                        </div>
                      )}
                    </div>
                  )}

                  {issueInputMode === 'custom' && (
                    <div className="custom-fields">
                      <div className="field-group">
                        <label className="field-label">Issue Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Short summary of bug or request"
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Issue Body Markdown</label>
                        <textarea
                          className="form-textarea"
                          rows={4}
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                          placeholder="Reproduction steps, error traces, or context"
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Author Username</label>
                        <input
                          type="text"
                          className="form-input"
                          value={customAuthor}
                          onChange={(e) => setCustomAuthor(e.target.value)}
                          placeholder="GitHub username"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleRunTriage}
                    disabled={isProcessing}
                  >
                    <Play size={14} />
                    <span>{isProcessing ? 'Processing Triage Pipeline...' : 'Run Full-Stack AI Triage'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Triage Result Card */}
              <div className="console-result">
                {isProcessing && (
                  <div className="processing-indicator-card">
                    <div className="stage-spin">
                      <RotateCcw className="spinner-icon" size={20} />
                    </div>
                    <div className="stage-title">Executing Deterministic Pipeline</div>
                    <div className="stage-detail">{triageProgressStage}</div>
                  </div>
                )}

                {triageError && (
                  <div className="error-alert">
                    <AlertTriangle size={16} />
                    <span>{triageError}</span>
                  </div>
                )}

                {currentTriageResult && !isProcessing && (
                  <div className="triage-result-card">
                    <div className="result-header">
                      <div>
                        <span className="result-chip">{currentTriageResult.category}</span>
                        <h2 className="result-title">
                          Issue #{currentTriageResult.issue_number}: {currentTriageResult.issue_title}
                        </h2>
                        <div className="result-author">
                          Submitted by <strong>@{currentTriageResult.issue_author}</strong> in{' '}
                          <code>{currentTriageResult.repo_full_name}</code>
                        </div>
                      </div>

                      <div className="result-status-badge">
                        <span className={`status-pill ${currentTriageResult.status}`}>
                          {currentTriageResult.status === 'approved' ? 'Approved in Database' : 'Pending Review'}
                        </span>
                      </div>
                    </div>

                    {/* Applied Labels with Confidence */}
                    <div className="section-block">
                      <div className="block-title">Classified Labels &amp; Calibrated Confidence</div>
                      <div className="labels-flex">
                        {currentTriageResult.applied_labels.map((lbl) => (
                          <div key={lbl.name} className="label-badge-box">
                            <span className="label-swatch" style={{ backgroundColor: lbl.color }}></span>
                            <span className="label-name">{lbl.name}</span>
                            <span className="label-conf">{(lbl.confidence * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Duplicate Detection Alert */}
                    {currentTriageResult.duplicate_match ? (
                      <div className="duplicate-alert-box">
                        <div className="dup-top">
                          <AlertTriangle size={15} />
                          <strong>Potential Duplicate Identified (Cosine Similarity: {(currentTriageResult.duplicate_match.similarity * 100).toFixed(0)}%)</strong>
                        </div>
                        <div className="dup-detail">
                          Matches <strong>Issue #{currentTriageResult.duplicate_match.number}</strong>: &ldquo;{currentTriageResult.duplicate_match.title}&rdquo;
                        </div>
                        <div className="dup-reason">
                          {currentTriageResult.duplicate_match.reason}
                        </div>
                      </div>
                    ) : (
                      <div className="no-dup-box">
                        <CheckCircle2 size={15} />
                        <span>Vector cosine similarity search: zero duplicate reports above 0.88 threshold.</span>
                      </div>
                    )}

                    {/* Reproduction Checklist */}
                    {currentTriageResult.checklist && currentTriageResult.checklist.length > 0 && (
                      <div className="section-block">
                        <div className="block-title">Reproduction &amp; Context Checklist</div>
                        <div className="checklist-items">
                          {currentTriageResult.checklist.map((chk, i) => (
                            <div key={i} className={`checklist-row ${chk.satisfied ? 'satisfied' : 'missing'}`}>
                              {chk.satisfied ? (
                                <CheckCircle2 size={14} className="chk-icon-ok" />
                              ) : (
                                <AlertTriangle size={14} className="chk-icon-warn" />
                              )}
                              <span>{chk.item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested First Reply Draft */}
                    <div className="section-block">
                      <div className="block-title">
                        <span>Contextual First-Response Draft (Human in the Loop)</span>
                        <button className="copy-btn" onClick={handleCopyDraft}>
                          {copiedDraft ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedDraft ? 'Copied' : 'Copy Markdown'}</span>
                        </button>
                      </div>
                      <textarea
                        className="draft-editor"
                        rows={6}
                        value={editableDraftMarkdown}
                        onChange={(e) => setEditableDraftMarkdown(e.target.value)}
                        aria-label="Editable draft reply markdown"
                      />
                    </div>

                    {/* Automated AI Git Diff Patch Suggestion */}
                    {currentTriageResult.suggested_patch && (
                      <UnifiedDiffViewer
                        patch={currentTriageResult.suggested_patch}
                        triageId={currentTriageResult.id}
                        repoFullName={currentTriageResult.repo_full_name}
                      />
                    )}

                    {/* Action Bar */}
                    <div className="action-bar">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={postToGithubChecked}
                          onChange={(e) => setPostToGithubChecked(e.target.checked)}
                        />
                        <span>Sync comment and labels to GitHub API if token configured</span>
                      </label>

                      <div className="action-buttons-group">
                        <button
                          className="btn btn-secondary"
                          onClick={() => { setActiveTab('chat'); playClickSound(); }}
                          title="Discuss this issue with CodeSherpa AI"
                          aria-label="Discuss with CodeSherpa AI"
                        >
                          <Cpu size={14} color="#D97706" />
                          <span>Discuss with CodeSherpa AI</span>
                        </button>

                        <button
                          className="btn btn-primary"
                          onClick={handleApproveTriage}
                          disabled={currentTriageResult.status === 'approved'}
                        >
                          <CheckCircle2 size={14} />
                          <span>{currentTriageResult.status === 'approved' ? 'Approved &amp; Saved' : 'Approve &amp; Log Decision'}</span>
                        </button>
                      </div>
                    </div>

                    {approvalStatus && (
                      <div className="approval-status-message">
                        {approvalStatus}
                      </div>
                    )}
                  </div>
                )}

                {!currentTriageResult && !isProcessing && (
                  <div className="empty-console-state">
                    <Terminal size={32} />
                    <h3>No Active Triage Result</h3>
                    <p>
                      Select an issue from the repository panel on the left or write a custom issue, then click <strong>Run Full-Stack AI Triage</strong> to execute label classification, vector similarity, and first-reply drafting.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CODESHERPA AI (QWEN2.5-CODER) */}
        {activeTab === 'chat' && (
          <div className="tab-pane">
            <CodeSherpaChat
              initialRepoContext={selectedRepoFullName}
              initialIssueContext={
                currentTriageResult
                  ? {
                      number: currentTriageResult.issue_number,
                      title: currentTriageResult.issue_title,
                      body: currentTriageResult.draft_reply_markdown
                    }
                  : null
              }
            />
          </div>
        )}

        {/* TAB 3: 3D VECTOR EMBEDDING SPACE */}
        {activeTab === 'vectorspace' && (
          <div className="tab-pane">
            <VectorSpace3D />
          </div>
        )}

        {/* TAB 3: REPOSITORY PULSE & SLA MATRIX */}
        {activeTab === 'pulse' && (
          <div className="tab-pane">
            <PulseMatrix
              onSelectRepo={(repoFullName) => {
                setSelectedRepoFullName(repoFullName);
                setActiveTab('console');
                playClickSound();
              }}
            />
          </div>
        )}

        {/* TAB 4: REAL-TIME EVENT STREAM TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="tab-pane">
            <LiveTerminalStream />
          </div>
        )}

        {/* TAB 5: SQLITE AUDIT LOG */}
        {activeTab === 'history' && (
          <div className="tab-pane">
            <div className="history-pane">
              <div className="history-header-bar">
                <div className="search-filter-box">
                  <div className="search-wrapper">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by title, repo, or author..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <button
                      className={`filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('all')}
                    >
                      All ({historyRecords.length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'pending' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('pending')}
                    >
                      Pending ({historyRecords.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                      className={`filter-btn ${historyFilter === 'approved' ? 'active' : ''}`}
                      onClick={() => setHistoryFilter('approved')}
                    >
                      Approved ({historyRecords.filter(r => r.status === 'approved').length})
                    </button>
                  </div>
                </div>

                <div className="history-actions">
                  <button className="btn btn-secondary btn-sm" onClick={fetchHistory} disabled={loadingHistory}>
                    <RotateCcw size={12} />
                    <span>Refresh</span>
                  </button>
                  <button className="btn btn-secondary btn-sm text-danger" onClick={handleClearHistory}>
                    <span>Clear SQLite History</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Issue</th>
                      <th>Repository</th>
                      <th>Category</th>
                      <th>Applied Labels</th>
                      <th>Duplicate</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingHistory ? (
                      <tr>
                        <td colSpan={8} className="table-empty">Loading records from SQLite database...</td>
                      </tr>
                    ) : filteredHistory.length > 0 ? (
                      filteredHistory.map((rec) => (
                        <tr key={rec.id} className={expandedRecordId === rec.id ? 'row-expanded' : ''}>
                          <td>
                            <span className={`status-pill ${rec.status}`}>
                              {rec.status}
                            </span>
                          </td>
                          <td>
                            <strong>#{rec.issue_number}</strong> {rec.issue_title.slice(0, 48)}
                            {rec.issue_title.length > 48 ? '...' : ''}
                          </td>
                          <td>
                            <code>{rec.repo_full_name}</code>
                          </td>
                          <td>{rec.category}</td>
                          <td>
                            <div className="mini-labels">
                              {rec.applied_labels.map(l => (
                                <span key={l.name} className="mini-tag" style={{ borderLeftColor: l.color }}>
                                  {l.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            {rec.duplicate_match ? (
                              <span className="dup-flag">#{rec.duplicate_match.number} ({(rec.duplicate_match.similarity * 100).toFixed(0)}%)</span>
                            ) : (
                              <span className="text-muted">None</span>
                            )}
                          </td>
                          <td className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                            {rec.created_at.slice(0, 16).replace('T', ' ')}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => setExpandedRecordId(expandedRecordId === rec.id ? null : rec.id)}
                            >
                              {expandedRecordId === rec.id ? 'Collapse' : 'Details'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="table-empty">
                          No triage records in SQLite database matching current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Expanded Record Drawer / Modal */}
              {expandedRecordId && (
                <div className="record-details-card">
                  {(() => {
                    const rec = historyRecords.find(r => r.id === expandedRecordId);
                    if (!rec) return null;
                    return (
                      <div>
                        <div className="details-header">
                          <h3>Record Details: {rec.id}</h3>
                          <button className="btn btn-secondary btn-xs" onClick={() => setExpandedRecordId(null)}>
                            Close
                          </button>
                        </div>
                        <div className="details-grid">
                          <div>
                            <strong>Issue:</strong> #{rec.issue_number} {rec.issue_title}
                          </div>
                          <div>
                            <strong>Repository:</strong> {rec.repo_full_name}
                          </div>
                          <div>
                            <strong>Author:</strong> @{rec.issue_author}
                          </div>
                          <div>
                            <strong>Approval Timestamp:</strong> {rec.approved_at || 'Pending maintainer approval'}
                          </div>
                        </div>
                        <div className="details-block">
                          <strong>Generated Draft Reply:</strong>
                          <pre className="details-pre"><code>{rec.draft_reply_markdown}</code></pre>
                        </div>
                        {rec.suggested_patch && (
                          <div style={{ marginTop: 14 }}>
                            <strong>Suggested Unified Diff Patch:</strong>
                            <UnifiedDiffViewer
                              patch={rec.suggested_patch}
                              triageId={rec.id}
                              repoFullName={rec.repo_full_name}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WEBHOOK SIMULATOR */}
        {activeTab === 'webhook' && (
          <div className="tab-pane">
            <div className="webhook-pane">
              <div className="webhook-explainer">
                <h2>Simulate Inbound GitHub Webhook</h2>
                <p>
                  Test how the triage engine receives and processes incoming GitHub <code className="inline-code">issues.opened</code> payloads in the background. The payload is sent to <code className="inline-code">POST /api/webhook/simulate</code>, where it triggers vector embeddings, taxonomy classification, and database persistence.
                </p>
              </div>

              <div className="webhook-editor-grid">
                <div className="editor-col">
                  <div className="panel-title">Inbound Webhook JSON Payload</div>
                  <textarea
                    className="json-textarea"
                    rows={14}
                    value={webhookSimPayload}
                    onChange={(e) => setWebhookSimPayload(e.target.value)}
                    aria-label="Webhook JSON payload editor"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSendSimulatedWebhook}
                    disabled={isSimulatingWebhook}
                  >
                    <Send size={14} />
                    <span>{isSimulatingWebhook ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
                  </button>
                </div>

                <div className="response-col">
                  <div className="panel-title">Server Response &amp; Background Execution</div>
                  {webhookSimResult ? (
                    <pre className="json-result-pre">
                      <code>{JSON.stringify(webhookSimResult, null, 2)}</code>
                    </pre>
                  ) : (
                    <div className="empty-response-box">
                      Click <strong>Dispatch Webhook Event</strong> to execute the simulation. The backend will parse the payload, run the triage pipeline, and save the result into the SQLite database.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & CONNECTION */}
        {activeTab === 'settings' && (
          <div className="tab-pane">
            <div className="settings-pane">
              <div className="settings-card">
                <h2>GitHub Connection Details</h2>
                <p>
                  PatchPilot is connected profile-wide to <strong>@{githubUser}</strong>. All {repos.length} public repositories are accessible for issue triage and label management.
                </p>

                <div className="settings-info-grid">
                  <div className="info-item">
                    <span className="info-label">GitHub Account</span>
                    <span className="info-val">@{githubUser}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Team Attribution</span>
                    <span className="info-val">{siteConfig.teamNames.join(', ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Public Repositories</span>
                    <span className="info-val">{repos.length} repos available</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Webhook URL</span>
                    <span className="info-val font-mono">{BACKEND_URL}/api/webhook</span>
                  </div>
                </div>

                <div className="token-form-block">
                  <h3>Authenticate Personal Access Token (Optional)</h3>
                  <p>
                    Provide a GitHub Fine-Grained Token or Classic PAT with <code className="inline-code">issues:write</code> scope to enable posting live comments and labels back to GitHub.
                  </p>

                  <form onSubmit={handleSaveToken} className="token-form">
                    <div className="token-input-row">
                      <div className="input-with-icon">
                        <Key size={14} className="input-icon" />
                        <input
                          type="password"
                          className="form-input"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary" disabled={tokenLoading}>
                        {tokenLoading ? 'Verifying...' : 'Save &amp; Verify Token'}
                      </button>
                    </div>

                    {tokenStatusMessage && (
                      <div className="token-status-note">
                        {tokenStatusMessage}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating System Diagnostics HUD */}
        <div className="system-diagnostics-hud" role="status" aria-label="System Diagnostics">
          <div className="diag-item">
            <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
            <span>{backendOnline ? `API 200 OK (${apiLatencyMs}ms)` : 'Backend Offline'}</span>
          </div>
          <div className="diag-separator">|</div>
          <div className="diag-item">
            <Database size={12} color="#D97706" />
            <span>SQLite WAL Mode</span>
          </div>
          <div className="diag-separator">|</div>
          <a
            href={`https://github.com/${githubUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className="diag-item diag-link"
            aria-label="GitHub Profile @jayvirjadeja008-gif"
          >
            <GithubIcon size={12} />
            <span>@{githubUser} ({repos.length} Repos)</span>
          </a>
          <div className="diag-separator">|</div>
          <div className="diag-item">
            <Cpu size={12} color="#10B981" />
            <span>Devforge-SYNCRON</span>
          </div>
          <div className="diag-separator hide-mobile">|</div>
          <div className="diag-item hide-mobile hotkey-hint">
            <span>Keys 1-7: Switch Tabs</span>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          padding: 40px 0 80px;
          background-color: var(--bg-base);
          min-height: calc(100vh - 120px);
        }
        .dashboard-header {
          margin-bottom: 28px;
        }
        .header-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .dashboard-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-indicator.online {
          background-color: var(--accent-success);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
        .status-indicator.offline {
          background-color: var(--accent-error);
        }
        .profile-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .chip-sep {
          color: var(--ink-muted);
        }
        .dashboard-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--ink-primary);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .dashboard-subline {
          font-size: 1rem;
          color: var(--ink-muted);
          max-width: 800px;
          line-height: 1.5;
          margin-bottom: 24px;
        }
        .stats-ribbon {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .stat-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-muted);
          margin-bottom: 6px;
          font-weight: 600;
        }
        .stat-val {
          font-family: var(--font-mono);
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--ink-primary);
          margin-bottom: 4px;
        }
        .stat-val-success {
          color: var(--accent-success);
        }
        .stat-val-warn {
          color: var(--accent-primary);
        }
        .stat-desc {
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .dashboard-tabs-bar {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border-base);
          margin-bottom: 28px;
          overflow-x: auto;
        }
        .tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--ink-muted);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          border-radius: 0;
        }
        .tab-btn:hover {
          color: var(--ink-primary);
          background: var(--bg-surface);
        }
        .tab-btn.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
          background: var(--bg-surface);
          font-weight: 600;
        }
        .tab-pane {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .console-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .console-layout {
            grid-template-columns: 1fr;
          }
        }
        .panel-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 20px;
        }
        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 14px;
        }
        .form-select, .form-input, .form-textarea {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--ink-primary);
          padding: 9px 12px;
          font-size: 0.875rem;
          outline: none;
          margin-bottom: 16px;
          transition: border-color 0.15s ease;
        }
        .form-select:focus, .form-input:focus, .form-textarea:focus {
          border-color: var(--accent-primary);
        }
        .input-mode-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: var(--bg-elevated);
          padding: 3px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
        }
        .mode-btn {
          padding: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          background: transparent;
          border: none;
          color: var(--ink-muted);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }
        .mode-btn.active {
          background: var(--bg-surface);
          color: var(--ink-primary);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .preset-issues-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          max-height: 280px;
          overflow-y: auto;
        }
        .issue-picker-item {
          display: block;
          width: 100%;
          text-align: left;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .issue-picker-item:hover {
          border-color: var(--border-base);
          background: var(--bg-overlay);
        }
        .issue-picker-item.selected {
          border-color: var(--accent-primary);
          background: rgba(217, 119, 6, 0.08);
        }
        .picker-item-top {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-bottom: 4px;
        }
        .issue-num {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--accent-primary);
        }
        .issue-author {
          color: var(--ink-muted);
        }
        .picker-item-title {
          font-size: 0.8125rem;
          color: var(--ink-primary);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .empty-picker, .loading-state {
          padding: 16px;
          text-align: center;
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .custom-fields {
          margin-bottom: 16px;
        }
        .field-group {
          margin-bottom: 12px;
        }
        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-muted);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .btn-block {
          width: 100%;
          justify-content: center;
        }
        .processing-indicator-card {
          background: var(--bg-surface);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-md);
          padding: 32px;
          text-align: center;
        }
        .stage-spin {
          margin-bottom: 12px;
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
          color: var(--accent-primary);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .stage-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 6px;
        }
        .stage-detail {
          font-size: 0.875rem;
          color: var(--ink-muted);
          font-family: var(--font-mono);
        }
        .triage-result-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          border-bottom: 1px solid var(--border-base);
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .result-chip {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          background: rgba(217, 119, 6, 0.15);
          color: var(--accent-primary);
          border-radius: var(--radius-sm);
          margin-bottom: 8px;
        }
        .result-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 6px;
        }
        .result-author {
          font-size: 0.8125rem;
          color: var(--ink-muted);
        }
        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .status-pill.pending {
          background: rgba(217, 119, 6, 0.15);
          color: var(--accent-primary);
          border: 1px solid rgba(217, 119, 6, 0.3);
        }
        .status-pill.approved {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-success);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .section-block {
          margin-bottom: 20px;
        }
        .block-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }
        .labels-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .label-badge-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 6px 12px;
          font-size: 0.8125rem;
        }
        .label-swatch {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
        .label-name {
          color: var(--ink-primary);
          font-weight: 500;
        }
        .label-conf {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .duplicate-alert-box {
          background: rgba(217, 119, 6, 0.08);
          border: 1px solid var(--accent-primary);
          border-radius: var(--radius-sm);
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .dup-top {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-primary);
          font-size: 0.875rem;
          margin-bottom: 6px;
        }
        .dup-detail {
          font-size: 0.875rem;
          color: var(--ink-primary);
          margin-bottom: 4px;
        }
        .dup-reason {
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .no-dup-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 12px 16px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
          margin-bottom: 20px;
        }
        .checklist-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .checklist-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--ink-secondary);
        }
        .chk-icon-ok {
          color: var(--accent-success);
          flex-shrink: 0;
        }
        .chk-icon-warn {
          color: var(--accent-primary);
          flex-shrink: 0;
        }
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--ink-muted);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .copy-btn:hover {
          color: var(--ink-primary);
        }
        .draft-editor {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--ink-primary);
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          line-height: 1.5;
          resize: vertical;
          outline: none;
        }
        .draft-editor:focus {
          border-color: var(--accent-primary);
        }
        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-base);
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
          cursor: pointer;
        }
        .action-buttons-group {
          display: flex;
          gap: 10px;
        }
        .approval-status-message {
          margin-top: 12px;
          padding: 10px 14px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-sm);
          font-size: 0.8125rem;
          color: var(--accent-success);
        }
        .empty-console-state {
          background: var(--bg-surface);
          border: 1px dashed var(--border-base);
          border-radius: var(--radius-md);
          padding: 48px 24px;
          text-align: center;
          color: var(--ink-muted);
        }
        .empty-console-state svg {
          margin-bottom: 12px;
          color: var(--ink-muted);
        }
        .empty-console-state h3 {
          font-size: 1.125rem;
          color: var(--ink-primary);
          margin-bottom: 6px;
        }
        .empty-console-state p {
          max-width: 480px;
          margin: 0 auto;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .history-pane {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 20px;
        }
        .history-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }
        .search-filter-box {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .search-wrapper {
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-muted);
        }
        .search-input {
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--ink-primary);
          padding: 6px 12px 6px 32px;
          font-size: 0.8125rem;
          outline: none;
          width: 240px;
        }
        .filter-group {
          display: flex;
          gap: 4px;
          background: var(--bg-elevated);
          padding: 3px;
          border-radius: var(--radius-sm);
        }
        .filter-btn {
          background: transparent;
          border: none;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink-muted);
          padding: 4px 10px;
          cursor: pointer;
          border-radius: var(--radius-sm);
        }
        .filter-btn.active {
          background: var(--bg-surface);
          color: var(--ink-primary);
        }
        .history-actions {
          display: flex;
          gap: 8px;
        }
        .text-danger {
          color: var(--accent-error) !important;
        }
        .history-table-wrapper {
          overflow-x: auto;
        }
        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
          text-align: left;
        }
        .history-table th {
          background: var(--bg-elevated);
          color: var(--ink-muted);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-base);
        }
        .history-table td {
          padding: 12px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--ink-secondary);
        }
        .mini-labels {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .mini-tag {
          font-size: 0.6875rem;
          background: var(--bg-elevated);
          padding: 2px 6px;
          border-radius: 2px;
          border-left: 2px solid var(--accent-primary);
          color: var(--ink-primary);
        }
        .dup-flag {
          font-size: 0.75rem;
          color: var(--accent-primary);
          font-weight: 600;
        }
        .table-empty {
          text-align: center;
          padding: 32px;
          color: var(--ink-muted);
        }
        .record-details-card {
          margin-top: 20px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 16px;
        }
        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .details-header h3 {
          font-size: 0.875rem;
          color: var(--ink-primary);
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--ink-secondary);
          margin-bottom: 14px;
        }
        .details-block strong {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--ink-muted);
          margin-bottom: 6px;
        }
        .details-pre {
          background: var(--bg-base);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--ink-primary);
          overflow-x: auto;
          line-height: 1.4;
        }
        .webhook-pane {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .webhook-explainer {
          margin-bottom: 24px;
        }
        .webhook-explainer h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 6px;
        }
        .webhook-explainer p {
          font-size: 0.875rem;
          color: var(--ink-muted);
          line-height: 1.5;
        }
        .webhook-editor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .webhook-editor-grid {
            grid-template-columns: 1fr;
          }
        }
        .json-textarea {
          width: 100%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          color: var(--ink-primary);
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          line-height: 1.4;
          resize: vertical;
          outline: none;
          margin-bottom: 14px;
        }
        .json-textarea:focus {
          border-color: var(--accent-primary);
        }
        .json-result-pre {
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 12px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--accent-success);
          overflow: auto;
          max-height: 380px;
          line-height: 1.4;
        }
        .empty-response-box {
          background: var(--bg-elevated);
          border: 1px dashed var(--border-base);
          border-radius: var(--radius-sm);
          padding: 24px;
          text-align: center;
          font-size: 0.8125rem;
          color: var(--ink-muted);
          line-height: 1.5;
        }
        .settings-pane {
          max-width: 760px;
        }
        .settings-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          padding: 28px;
        }
        .settings-card h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 8px;
        }
        .settings-card p {
          font-size: 0.875rem;
          color: var(--ink-muted);
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .settings-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 24px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--ink-muted);
          font-weight: 600;
        }
        .info-val {
          font-size: 0.875rem;
          color: var(--ink-primary);
        }
        .token-form-block h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--ink-primary);
          margin-bottom: 6px;
        }
        .token-input-row {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        .input-with-icon {
          position: relative;
          flex: 1;
        }
        .input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--ink-muted);
        }
        .input-with-icon .form-input {
          padding-left: 32px;
          margin-bottom: 0;
        }
        .token-status-note {
          font-size: 0.8125rem;
          color: var(--accent-success);
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: var(--radius-sm);
        }
        .btn-xs {
          padding: 4px 8px;
          font-size: 0.75rem;
        }
        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--accent-error);
          border-radius: var(--radius-sm);
          color: var(--accent-error);
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }
        .tab-hotkey {
          display: inline-block;
          font-family: monospace;
          font-size: 0.625rem;
          color: #8B949E;
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 2px;
          padding: 1px 4px;
          margin-left: 6px;
          line-height: 1.1;
        }
        .tab-btn.active .tab-hotkey {
          color: #0E1116;
          background: rgba(14, 17, 22, 0.4);
          border-color: rgba(14, 17, 22, 0.6);
        }
        .system-diagnostics-hud {
          position: fixed;
          bottom: 16px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(22, 27, 34, 0.94);
          backdrop-filter: blur(8px);
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 6px 14px;
          font-family: monospace;
          font-size: 0.75rem;
          color: #C9D1D9;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 40;
        }
        .diag-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .diag-link {
          color: #C9D1D9;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .diag-link:hover {
          color: #D97706;
        }
        .diag-separator {
          color: #30363D;
        }
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .status-dot.online {
          background: #10B981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }
        .status-dot.offline {
          background: #EF4444;
        }
        .hotkey-hint {
          color: #8B949E;
        }
        @media (max-width: 860px) {
          .system-diagnostics-hud {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
