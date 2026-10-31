import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ShieldCheck,
  Clock,
  GitBranch,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Zap
} from 'lucide-react';
import { PulseMatrixResponse, RepoPulseItem } from '../types';
import { siteConfig } from '../config/site.config';
import { playClickSound } from '../utils/sound';

interface PulseMatrixProps {
  onSelectRepo: (repoFullName: string) => void;
}

export default function PulseMatrix({ onSelectRepo }: PulseMatrixProps) {
  const [matrixData, setMatrixData] = useState<PulseMatrixResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/pulse/matrix');
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch {
      // Backend offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMatrix();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMatrix]);

  const handleRefresh = () => {
    playClickSound();
    fetchMatrix();
  };

  const handleRepoClick = (fullName: string) => {
    playClickSound();
    onSelectRepo(fullName);
  };

  const repos: RepoPulseItem[] = matrixData?.repositories || [
    {
      name: 'Dataforge-SYNCRON',
      full_name: `${siteConfig.githubUsername}/Dataforge-SYNCRON`,
      health_score: 98,
      open_issues: 14,
      avg_sla_minutes: 3.8,
      sla_status: 'optimal',
      duplicate_rate: 18,
      automated_ratio: 92,
      primary_language: 'TypeScript',
      last_activity: '2 minutes ago',
      active_labels: ['bug', 'networking', 'duplicate']
    },
    {
      name: 'Jayvir-Jadeja',
      full_name: `${siteConfig.githubUsername}/Jayvir-Jadeja`,
      health_score: 100,
      open_issues: 1,
      avg_sla_minutes: 1.2,
      sla_status: 'optimal',
      duplicate_rate: 0,
      automated_ratio: 95,
      primary_language: 'Markdown',
      last_activity: '18 minutes ago',
      active_labels: ['documentation', 'profile']
    },
    {
      name: 'SYNCRON',
      full_name: `${siteConfig.githubUsername}/SYNCRON`,
      health_score: 95,
      open_issues: 8,
      avg_sla_minutes: 4.5,
      sla_status: 'optimal',
      duplicate_rate: 12,
      automated_ratio: 88,
      primary_language: 'Python',
      last_activity: '1 hour ago',
      active_labels: ['performance', 'memory-leak']
    },
    {
      name: 'Local-Repo',
      full_name: `${siteConfig.githubUsername}/Local-Repo`,
      health_score: 92,
      open_issues: 5,
      avg_sla_minutes: 6.1,
      sla_status: 'optimal',
      duplicate_rate: 10,
      automated_ratio: 84,
      primary_language: 'JavaScript',
      last_activity: '3 hours ago',
      active_labels: ['triage-needed']
    },
    {
      name: 'CRAZY-',
      full_name: `${siteConfig.githubUsername}/CRAZY-`,
      health_score: 96,
      open_issues: 3,
      avg_sla_minutes: 2.9,
      sla_status: 'optimal',
      duplicate_rate: 8,
      automated_ratio: 90,
      primary_language: 'HTML/CSS',
      last_activity: '5 hours ago',
      active_labels: ['good-first-issue']
    },
    {
      name: 'type-your-name-for-attendance-',
      full_name: `${siteConfig.githubUsername}/type-your-name-for-attendance-`,
      health_score: 97,
      open_issues: 2,
      avg_sla_minutes: 2.1,
      sla_status: 'optimal',
      duplicate_rate: 5,
      automated_ratio: 96,
      primary_language: 'Python',
      last_activity: '12 hours ago',
      active_labels: ['good-first-issue', 'verified']
    },
    {
      name: 'rea',
      full_name: `${siteConfig.githubUsername}/rea`,
      health_score: 91,
      open_issues: 4,
      avg_sla_minutes: 5.4,
      sla_status: 'optimal',
      duplicate_rate: 15,
      automated_ratio: 80,
      primary_language: 'TypeScript',
      last_activity: '1 day ago',
      active_labels: ['bug']
    },
    {
      name: 'worksheet12a',
      full_name: `${siteConfig.githubUsername}/worksheet12a`,
      health_score: 99,
      open_issues: 1,
      avg_sla_minutes: 1.5,
      sla_status: 'optimal',
      duplicate_rate: 0,
      automated_ratio: 98,
      primary_language: 'Jupyter Notebook',
      last_activity: '2 days ago',
      active_labels: ['assignment', 'automated']
    },
    {
      name: 'worksheet13a',
      full_name: `${siteConfig.githubUsername}/worksheet13a`,
      health_score: 99,
      open_issues: 1,
      avg_sla_minutes: 1.4,
      sla_status: 'optimal',
      duplicate_rate: 0,
      automated_ratio: 98,
      primary_language: 'Jupyter Notebook',
      last_activity: '2 days ago',
      active_labels: ['assignment', 'automated']
    }
  ];

  const filteredRepos = repos.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.primary_language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      filterLanguage === 'all' ||
      r.primary_language.toLowerCase() === filterLanguage.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const uniqueLanguages = Array.from(new Set(repos.map((r) => r.primary_language)));

  return (
    <div className="pulse-matrix-root">
      {/* Top Banner KPI ribbon */}
      <div className="pulse-kpi-grid">
        <div className="pulse-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Connected Repositories</span>
            <GitBranch size={15} color="#D97706" />
          </div>
          <div className="kpi-val">{repos.length}</div>
          <div className="kpi-sub">Target: @{siteConfig.githubUsername}</div>
        </div>

        <div className="pulse-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Maintainer Triage Health</span>
            <ShieldCheck size={15} color="#10B981" />
          </div>
          <div className="kpi-val font-mono">96.4%</div>
          <div className="kpi-sub">Zero unassigned issues &gt; 24h</div>
        </div>

        <div className="pulse-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Global First-Reply SLA</span>
            <Clock size={15} color="#3B82F6" />
          </div>
          <div className="kpi-val font-mono">3.2m</div>
          <div className="kpi-sub">Target &lt; 15 min threshold</div>
        </div>

        <div className="pulse-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Automated Triage Ratio</span>
            <Zap size={15} color="#D97706" />
          </div>
          <div className="kpi-val font-mono">91.8%</div>
          <div className="kpi-sub">Engine: Devforge-SYNCRON</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="pulse-controls">
        <div className="pulse-search-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="input-text pulse-search"
            placeholder="Filter repositories by name or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="pulse-lang-filters">
          <button
            className={`btn btn-sm ${filterLanguage === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterLanguage('all')}
          >
            All Stacks
          </button>
          {uniqueLanguages.slice(0, 4).map((lang) => (
            <button
              key={lang}
              className={`btn btn-sm ${filterLanguage === lang.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterLanguage(lang.toLowerCase())}
            >
              {lang}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh Matrix"
            aria-label="Refresh repository pulse matrix"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid of Repository Pulse Cards */}
      <div className="pulse-grid">
        {filteredRepos.map((repo) => {
          const healthColor =
            repo.health_score >= 95
              ? '#10B981'
              : repo.health_score >= 90
              ? '#D97706'
              : '#EF4444';

          return (
            <div key={repo.full_name} className="repo-pulse-card">
              <div className="repo-pulse-top">
                <div className="repo-name-wrap">
                  <h3 className="repo-name">{repo.name}</h3>
                  <a
                    href={`https://github.com/${repo.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="repo-ext-link"
                    title="View on GitHub"
                    aria-label={`View ${repo.name} on GitHub`}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div
                  className="repo-health-pill font-mono"
                  style={{
                    color: healthColor,
                    borderColor: healthColor,
                    background: `${healthColor}15`
                  }}
                >
                  <Activity size={12} />
                  <span>{repo.health_score}%</span>
                </div>
              </div>

              <div className="repo-meta-row">
                <span className="repo-lang tag">{repo.primary_language}</span>
                <span className="repo-activity tag">active {repo.last_activity}</span>
              </div>

              {/* Metrics strip */}
              <div className="repo-metrics-strip">
                <div className="metric-box">
                  <span className="metric-k">Open Issues</span>
                  <span className="metric-v font-mono">{repo.open_issues}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-k">Average SLA</span>
                  <span className="metric-v font-mono">{repo.avg_sla_minutes}m</span>
                </div>
                <div className="metric-box">
                  <span className="metric-k">Duplicates</span>
                  <span className="metric-v font-mono">{repo.duplicate_rate}%</span>
                </div>
                <div className="metric-box">
                  <span className="metric-k">Auto Ratio</span>
                  <span className="metric-v font-mono">{repo.automated_ratio}%</span>
                </div>
              </div>

              {/* Active Labels */}
              <div className="repo-labels-row">
                {repo.active_labels.map((lbl) => (
                  <span key={lbl} className="label-badge font-mono">
                    {lbl}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRepoClick(repo.full_name)}
                className="btn btn-secondary btn-sm repo-triage-btn"
                aria-label={`Open Triage Console for ${repo.name}`}
              >
                <span>Launch Triage Console</span>
                <ChevronRight size={13} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        .pulse-matrix-root {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .pulse-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }
        .pulse-kpi-card {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 14px 16px;
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .kpi-label {
          color: #8B949E;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .kpi-val {
          font-size: 1.625rem;
          font-weight: 700;
          color: #F0F6FC;
          line-height: 1.2;
        }
        .kpi-sub {
          color: #8B949E;
          font-size: 0.75rem;
          margin-top: 4px;
        }
        .pulse-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pulse-search-wrap {
          position: relative;
          flex: 1;
          min-width: 260px;
        }
        .pulse-search-wrap .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #8B949E;
          pointer-events: none;
        }
        .pulse-search {
          padding-left: 36px;
          width: 100%;
        }
        .pulse-lang-filters {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .pulse-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .repo-pulse-card {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: border-color 0.15s ease, transform 0.15s ease;
        }
        .repo-pulse-card:hover {
          border-color: #D97706;
          transform: translateY(-2px);
        }
        .repo-pulse-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        .repo-name-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .repo-name {
          margin: 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #F0F6FC;
          word-break: break-all;
        }
        .repo-ext-link {
          color: #8B949E;
          transition: color 0.15s ease;
        }
        .repo-ext-link:hover {
          color: #D97706;
        }
        .repo-health-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border: 1px solid;
          border-radius: 3px;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }
        .repo-meta-row {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .repo-lang {
          background: #21262D;
          color: #C9D1D9;
          font-size: 0.6875rem;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .repo-activity {
          background: transparent;
          color: #8B949E;
          font-size: 0.6875rem;
          padding: 2px 4px;
        }
        .repo-metrics-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 8px 10px;
          gap: 6px;
          text-align: center;
        }
        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .metric-k {
          font-size: 0.625rem;
          color: #8B949E;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .metric-v {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #F0F6FC;
        }
        .repo-labels-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .label-badge {
          background: #21262D;
          border: 1px solid #30363D;
          color: #8B949E;
          font-size: 0.6875rem;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .repo-triage-btn {
          margin-top: auto;
          width: 100%;
          justify-content: center;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
