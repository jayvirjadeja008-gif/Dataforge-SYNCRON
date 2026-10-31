import { useState, useCallback } from 'react';
import { Copy, Check, Download, Play, CheckCircle2, FileCode, ShieldCheck } from 'lucide-react';
import { SuggestedPatch } from '../types';
import { playClickSound, playSuccessSound } from '../utils/sound';

interface UnifiedDiffViewerProps {
  patch: SuggestedPatch;
  triageId: string;
  repoFullName?: string;
}

export default function UnifiedDiffViewer({ patch, triageId, repoFullName }: UnifiedDiffViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    success: boolean;
    simulated_commit?: string;
    status?: string;
  } | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(patch.patch_diff);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 1500);
  }, [patch.patch_diff]);

  const handleDownload = useCallback(() => {
    playClickSound();
    const blob = new Blob([patch.patch_diff], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patch.file_path.replace(/[/\\?%*:|"<>]/g, '_')}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [patch.file_path, patch.patch_diff]);

  const handleSimulateApply = useCallback(async () => {
    playClickSound();
    setIsApplying(true);
    setApplyResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/patch/simulate-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triage_id: triageId,
          file_path: patch.file_path,
          patch_diff: patch.patch_diff,
          repo_full_name: repoFullName || 'jayvirjadeja008-gif/Dataforge-SYNCRON'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setApplyResult(data);
        playSuccessSound();
      } else {
        setApplyResult({ success: false, status: 'Simulation error returned from backend' });
      }
    } catch {
      setApplyResult({ success: false, status: 'Backend unreachable for patch simulation' });
    } finally {
      setIsApplying(false);
    }
  }, [patch.file_path, patch.patch_diff, repoFullName, triageId]);

  // Parse lines for syntax styling
  const lines = patch.patch_diff.split('\n');

  return (
    <div className="diff-viewer-root">
      {/* Diff Header Bar */}
      <div className="diff-header">
        <div className="diff-file-info">
          <FileCode size={15} className="diff-icon" />
          <span className="diff-path">{patch.file_path}</span>
          <span className="diff-branch tag">target: {patch.target_branch || 'main'}</span>
          <span className="diff-stat stat-add">+{patch.lines_added ?? 0}</span>
          <span className="diff-stat stat-del">-{patch.lines_removed ?? 0}</span>
          <span className="diff-conf tag tag-amber">
            {Math.round(patch.confidence * 100)}% Confidence
          </span>
        </div>

        <div className="diff-actions">
          <button
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            title="Copy Unified Diff to Clipboard"
            aria-label="Copy unified diff"
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Patch'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="btn btn-secondary btn-sm"
            title="Download as .patch file"
            aria-label="Download patch file"
          >
            <Download size={13} />
            <span>Export .patch</span>
          </button>

          <button
            onClick={handleSimulateApply}
            disabled={isApplying}
            className="btn btn-primary btn-sm"
            title="Test dry run merge against repository worktree"
            aria-label="Simulate merge"
          >
            <Play size={13} />
            <span>{isApplying ? 'Simulating...' : 'Simulate Merge'}</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner */}
      {patch.explanation && (
        <div className="diff-explanation">
          <ShieldCheck size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{patch.explanation}</span>
        </div>
      )}

      {/* Simulated Apply Result Feedback */}
      {applyResult && (
        <div className={`diff-apply-banner ${applyResult.success ? 'success' : 'error'}`}>
          <CheckCircle2 size={15} />
          <div>
            <strong>Dry Run Validation: </strong>
            <span>{applyResult.status}</span>
            {applyResult.simulated_commit && (
              <span className="commit-hash"> (Commit: {applyResult.simulated_commit})</span>
            )}
          </div>
        </div>
      )}

      {/* Unified Diff Body with Line Styling */}
      <div className="diff-body" tabIndex={0} role="region" aria-label="Unified Git Diff">
        <pre className="diff-pre">
          {lines.map((line, idx) => {
            let lineClass = 'diff-line normal';
            if (line.startsWith('+++') || line.startsWith('---')) {
              lineClass = 'diff-line header-file';
            } else if (line.startsWith('@@')) {
              lineClass = 'diff-line chunk-header';
            } else if (line.startsWith('+')) {
              lineClass = 'diff-line addition';
            } else if (line.startsWith('-')) {
              lineClass = 'diff-line deletion';
            } else if (line.startsWith('diff') || line.startsWith('index')) {
              lineClass = 'diff-line meta';
            }

            return (
              <div key={idx} className={lineClass}>
                <span className="diff-line-number" aria-hidden="true">
                  {idx + 1}
                </span>
                <span className="diff-line-content">{line}</span>
              </div>
            );
          })}
        </pre>
      </div>

      <style>{`
        .diff-viewer-root {
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 16px;
        }
        .diff-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #161B22;
          border-bottom: 1px solid #30363D;
          flex-wrap: wrap;
          gap: 10px;
        }
        .diff-file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .diff-icon {
          color: #D97706;
        }
        .diff-path {
          font-family: monospace;
          font-weight: 600;
          color: #F0F6FC;
          font-size: 0.875rem;
        }
        .diff-branch {
          font-family: monospace;
          font-size: 0.6875rem;
          color: #8B949E;
          background: #21262D;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .diff-stat {
          font-family: monospace;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .stat-add {
          color: #10B981;
          background: rgba(16, 185, 129, 0.12);
        }
        .stat-del {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.12);
        }
        .diff-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .diff-explanation {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(217, 119, 6, 0.08);
          border-bottom: 1px solid rgba(217, 119, 6, 0.2);
          color: #F0F6FC;
          font-size: 0.8125rem;
          line-height: 1.45;
        }
        .diff-apply-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          font-size: 0.8125rem;
          border-bottom: 1px solid #30363D;
        }
        .diff-apply-banner.success {
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
          border-bottom-color: rgba(16, 185, 129, 0.25);
        }
        .diff-apply-banner.error {
          background: rgba(239, 68, 68, 0.12);
          color: #EF4444;
          border-bottom-color: rgba(239, 68, 68, 0.25);
        }
        .commit-hash {
          font-family: monospace;
          color: #F0F6FC;
          font-weight: 600;
        }
        .diff-body {
          max-height: 380px;
          overflow: auto;
          background: #090D11;
        }
        .diff-pre {
          margin: 0;
          padding: 8px 0;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          font-size: 0.8125rem;
          line-height: 1.5;
        }
        .diff-line {
          display: flex;
          align-items: center;
          padding: 1px 12px;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .diff-line-number {
          width: 38px;
          flex-shrink: 0;
          color: #484F58;
          font-size: 0.75rem;
          user-select: none;
          text-align: right;
          padding-right: 12px;
        }
        .diff-line-content {
          flex: 1;
        }
        .diff-line.addition {
          background: rgba(16, 185, 129, 0.15);
          color: #34D399;
        }
        .diff-line.addition .diff-line-number {
          color: #059669;
        }
        .diff-line.deletion {
          background: rgba(239, 68, 68, 0.15);
          color: #F87171;
        }
        .diff-line.deletion .diff-line-number {
          color: #DC2626;
        }
        .diff-line.chunk-header {
          background: rgba(59, 130, 246, 0.1);
          color: #60A5FA;
        }
        .diff-line.meta, .diff-line.header-file {
          color: #8B949E;
          font-weight: 600;
        }
        .diff-line.normal {
          color: #C9D1D9;
        }
      `}</style>
    </div>
  );
}
