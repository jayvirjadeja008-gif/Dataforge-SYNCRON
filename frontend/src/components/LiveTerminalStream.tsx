import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { StreamEvent } from '../types';
import { siteConfig } from '../config/site.config';
import { playClickSound, playAlertSound, playSuccessSound } from '../utils/sound';

export default function LiveTerminalStream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/events/stream');
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      }
    } catch {
      // Backend offline fallback
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 0);
    if (isPaused) return () => clearTimeout(timer);
    const interval = setInterval(fetchEvents, 2500);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchEvents, isPaused]);

  const handleTogglePause = () => {
    playClickSound();
    setIsPaused(!isPaused);
  };

  const handleClear = async () => {
    playClickSound();
    try {
      await fetch('http://localhost:8000/api/events/clear', { method: 'DELETE' });
      setEvents([]);
    } catch {
      setEvents([]);
    }
  };

  const handleSimulate = async () => {
    playClickSound();
    setIsSimulating(true);

    try {
      const randomIssueNum = Math.floor(Math.random() * 800) + 100;
      const res = await fetch('http://localhost:8000/api/webhook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: siteConfig.githubUsername,
          repo: 'Dataforge-SYNCRON',
          issue_number: randomIssueNum,
          title: `Telemetry transport socket dropped during cellular switch (#${randomIssueNum})`,
          body: 'Client disconnects unexpectedly without triggering clean onclose event when switching from 5G to Wi-Fi. Retrying reconnect fails with state collision.',
          author: 'stream-tester'
        })
      });

      if (res.ok) {
        playSuccessSound();
        await fetchEvents();
      }
    } catch {
      playAlertSound();
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyEvent = (evt: StreamEvent, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(evt, null, 2));
    setCopiedIndex(idx);
    playClickSound();
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.status === filterType;
  });

  return (
    <div className="terminal-stream-root">
      {/* Terminal Title Bar */}
      <div className="terminal-toolbar">
        <div className="toolbar-left">
          <Terminal size={15} color="#D97706" />
          <span className="terminal-title">Real-Time Event Stream Terminal</span>
          <span className={`stream-status-pill ${isPaused ? 'paused' : 'live'}`}>
            <span className="live-dot" />
            <span>{isPaused ? 'STREAM PAUSED' : 'LIVE STREAM'}</span>
          </span>
          <span className="event-count font-mono">{events.length} events logged</span>
        </div>

        <div className="toolbar-right">
          {/* Status Filter */}
          <div className="filter-group">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === 'info' ? 'active' : ''}`}
              onClick={() => setFilterType('info')}
            >
              Info
            </button>
            <button
              className={`filter-btn ${filterType === 'warning' ? 'active' : ''}`}
              onClick={() => setFilterType('warning')}
            >
              Warning
            </button>
            <button
              className={`filter-btn ${filterType === 'success' ? 'active' : ''}`}
              onClick={() => setFilterType('success')}
            >
              Success
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="btn btn-primary btn-sm"
            title="Dispatch a simulated webhook event to test live streaming"
            aria-label="Simulate event"
          >
            <Zap size={13} />
            <span>{isSimulating ? 'Firing...' : 'Fire Test Event'}</span>
          </button>

          <button
            onClick={handleTogglePause}
            className="btn btn-secondary btn-sm"
            title={isPaused ? 'Resume live polling' : 'Pause live polling'}
            aria-label={isPaused ? 'Resume stream' : 'Pause stream'}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={handleClear}
            className="btn btn-secondary btn-sm"
            title="Clear Event Log Buffer"
            aria-label="Clear event buffer"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="terminal-viewport" role="region" aria-label="Live Event Stream Logs">
        {filteredEvents.length === 0 ? (
          <div className="terminal-empty">
            <Terminal size={32} color="#30363D" />
            <p>No events in stream buffer matching current filter.</p>
            <button onClick={handleSimulate} className="btn btn-primary btn-sm">
              Fire Simulated Webhook Event
            </button>
          </div>
        ) : (
          <div className="terminal-list font-mono">
            {filteredEvents.map((evt, idx) => {
              const statusColor =
                evt.status === 'success'
                  ? '#10B981'
                  : evt.status === 'warning'
                  ? '#F59E0B'
                  : evt.status === 'error'
                  ? '#EF4444'
                  : '#3B82F6';

              const timeStr = new Date(evt.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div key={evt.id || idx} className="terminal-row">
                  <span className="row-time">{timeStr}</span>
                  <span
                    className="row-type"
                    style={{ color: statusColor, borderColor: statusColor }}
                  >
                    {evt.type}
                  </span>
                  <span className="row-repo">{evt.repo}</span>
                  {evt.issue_number > 0 && (
                    <span className="row-issue font-mono">#{evt.issue_number}</span>
                  )}
                  <span className="row-title">{evt.title}</span>
                  <span className="row-details">{evt.details}</span>

                  <button
                    onClick={() => handleCopyEvent(evt, idx)}
                    className="row-copy-btn"
                    title="Copy Raw Event JSON"
                    aria-label="Copy event JSON"
                  >
                    {copiedIndex === idx ? (
                      <Check size={11} color="#10B981" />
                    ) : (
                      <Copy size={11} />
                    )}
                  </button>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>

      {/* Terminal Footer info */}
      <div className="terminal-footer">
        <span className="footer-item">Protocol: HTTP/2 Long Poll (2.5s)</span>
        <span className="footer-item">Buffer Capacity: 100 ring entries</span>
        <span className="footer-item">Engine: Devforge-SYNCRON Deterministic Pipeline</span>
      </div>

      <style>{`
        .terminal-stream-root {
          background: #090D11;
          border: 1px solid #30363D;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .terminal-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #161B22;
          border-bottom: 1px solid #30363D;
          flex-wrap: wrap;
          gap: 10px;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .terminal-title {
          font-weight: 600;
          color: #F0F6FC;
          font-size: 0.875rem;
        }
        .stream-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-family: monospace;
          padding: 2px 7px;
          border-radius: 3px;
          font-weight: 700;
        }
        .stream-status-pill.live {
          background: rgba(16, 185, 129, 0.15);
          color: #10B981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .stream-status-pill.paused {
          background: rgba(245, 158, 11, 0.15);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse-dot 1.5s infinite ease-in-out;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .event-count {
          font-size: 0.75rem;
          color: #8B949E;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 4px;
          overflow: hidden;
        }
        .filter-btn {
          background: transparent;
          border: none;
          color: #8B949E;
          font-size: 0.75rem;
          padding: 4px 8px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .filter-btn.active {
          background: #D97706;
          color: #0E1116;
          font-weight: 600;
        }
        .filter-btn:hover:not(.active) {
          color: #F0F6FC;
        }
        .terminal-viewport {
          height: 480px;
          overflow-y: auto;
          padding: 8px 12px;
          background: #06090D;
        }
        .terminal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
          color: #8B949E;
          font-size: 0.875rem;
        }
        .terminal-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8125rem;
        }
        .terminal-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 4px 6px;
          border-radius: 3px;
          transition: background 0.1s ease;
          position: relative;
        }
        .terminal-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .row-time {
          color: #484F58;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .row-type {
          font-size: 0.6875rem;
          font-weight: 600;
          border: 1px solid;
          padding: 1px 5px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .row-repo {
          color: #8B949E;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .row-issue {
          color: #D97706;
          font-weight: 600;
          flex-shrink: 0;
        }
        .row-title {
          color: #F0F6FC;
          font-weight: 500;
          flex-shrink: 0;
        }
        .row-details {
          color: #8B949E;
          font-size: 0.75rem;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .row-copy-btn {
          opacity: 0;
          background: transparent;
          border: 1px solid #30363D;
          border-radius: 3px;
          color: #8B949E;
          padding: 2px 4px;
          cursor: pointer;
          transition: opacity 0.15s ease, color 0.15s ease;
        }
        .terminal-row:hover .row-copy-btn {
          opacity: 1;
        }
        .row-copy-btn:hover {
          color: #F0F6FC;
          border-color: #D97706;
        }
        .terminal-footer {
          display: flex;
          justify-content: space-between;
          padding: 6px 14px;
          background: #161B22;
          border-top: 1px solid #30363D;
          font-size: 0.6875rem;
          color: #8B949E;
          font-family: monospace;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
