'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Square,
  Trash2,
  Cpu,
  Terminal,
  Copy,
  Check,
  Info,
  ChevronDown,
  Sparkles,
  GitBranch
} from 'lucide-react';
import { ChatMessage, OllamaStatus } from '../types';
import { siteConfig } from '../config/site.config';
import { playClickSound, playSuccessSound } from '../utils/sound';

interface CodeSherpaChatProps {
  initialRepoContext?: string;
  initialIssueContext?: {
    number: number;
    title: string;
    body: string;
  } | null;
}

const PRESET_PROMPTS = [
  {
    label: 'Audit WebSocket Handover (#412)',
    query: 'Audit the WebSocket cellular handover issue in src/client/websocket.ts and generate a unified diff patch to prevent dropped state.'
  },
  {
    label: 'Fix Memory Leak in Worker Pool (#413)',
    query: 'How do I resolve the unhandled task reference retention memory leak in the worker pool?'
  },
  {
    label: 'Generate Bearer Auth Docs (#414)',
    query: 'Generate a TypeScript example and README section showing how to authenticate with Bearer tokens.'
  },
  {
    label: 'Explain Architecture Pipeline',
    query: 'Explain the deterministic triage engine architecture and how it integrates with SQLite and GitHub webhooks.'
  }
];

export default function CodeSherpaChat({
  initialRepoContext,
  initialIssueContext
}: CodeSherpaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: (
        "Welcome to **CodeSherpa AI**, powered by **Qwen2.5-Coder**.\n\n" +
        "I am connected to your active codebase and GitHub profile (`@" + siteConfig.githubUsername + "`). " +
        "I can perform deep root-cause diagnosis on open issues, verify reproduction checklists, and author AST-accurate unified diff patches.\n\n" +
        "Select a quick prompt below or describe an issue to investigate."
      ),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState(initialRepoContext || `${siteConfig.githubUsername}/Dataforge-SYNCRON`);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch Ollama Status
  const fetchOllamaStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ollama/status');
      if (res.ok) {
        const data = await res.json();
        setOllamaStatus(data);
      }
    } catch {
      // Backend offline
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOllamaStatus();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchOllamaStatus]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    playClickSound();
  };

  // Handle Clear Conversation
  const handleClearChat = () => {
    playClickSound();
    handleStopStreaming();
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: "Conversation history cleared. Ask me any question about your codebase, repository triage, or unified diff patches.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputPrompt).trim();
    if (!content || isStreaming) return;

    playClickSound();
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantPlaceholderId = `msg-asst-${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMessage];
    setMessages([...updatedHistory, assistantPlaceholder]);
    setIsStreaming(true);

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
          repo_context: activeRepo,
          issue_context: initialIssueContext
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.token) {
                accumulated += parsed.token;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantPlaceholderId
                      ? { ...msg, content: accumulated, mode: parsed.mode }
                      : msg
                  )
                );
              }
              if (parsed.done) {
                break;
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      playSuccessSound();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantPlaceholderId
              ? {
                  ...msg,
                  content: "Error communicating with Qwen2.5-Coder streaming service. Please verify backend status."
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(blockId);
    playClickSound();
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  // Simple Markdown Renderer for assistant responses
  const renderMessageContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        let language = lines[0].trim();
        let code = lines.slice(1).join('\n');
        if (!code && lines.length === 1) {
          code = lines[0];
          language = 'code';
        }
        const blockId = `${msgId}-code-${index}`;

        return (
          <div key={index} className="chat-code-block font-mono">
            <div className="code-block-header">
              <span className="code-lang tag">{language || 'plaintext'}</span>
              <button
                onClick={() => handleCopyCode(code, blockId)}
                className="code-copy-btn"
                aria-label="Copy code block"
              >
                {copiedCodeId === blockId ? (
                  <Check size={12} color="#10B981" />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedCodeId === blockId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="code-content">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Paragraph with basic bold and inline code formatting
      return (
        <div key={index} className="chat-text-chunk">
          {part.split('\n\n').map((para, pIdx) => {
            if (para.startsWith('### ')) {
              return (
                <h4 key={pIdx} className="chat-subhead">
                  {para.replace('### ', '')}
                </h4>
              );
            }
            if (para.startsWith('1. ') || para.startsWith('* ')) {
              return (
                <div key={pIdx} className="chat-list-line">
                  {para}
                </div>
              );
            }
            return (
              <p key={pIdx} className="chat-para">
                {para}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="codesherpa-chat-root">
      {/* Top Header / Model Ribbon */}
      <div className="chat-header-bar">
        <div className="chat-header-left">
          <div className="model-brand">
            <Cpu size={16} color="#D97706" />
            <span className="brand-name">CodeSherpa Copilot</span>
            <span className="model-tag tag tag-amber font-mono">Qwen2.5-Coder</span>
          </div>

          {/* Model Status Indicator */}
          <div
            className={`model-status-badge ${ollamaStatus?.online ? 'online' : 'offline'}`}
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            role="button"
            tabIndex={0}
            title="Click to view Ollama connection status"
            aria-label="Ollama connection status"
          >
            <span className="status-ping-dot" />
            <span>
              {ollamaStatus?.online
                ? 'Ollama Local Connected'
                : 'Ollama Offline (Simulation Engine)'}
            </span>
            <ChevronDown size={12} />
          </div>
        </div>

        <div className="chat-header-right">
          <div className="repo-context-pill font-mono">
            <GitBranch size={12} color="#D97706" />
            <select
              value={activeRepo}
              onChange={(e) => {
                setActiveRepo(e.target.value);
                playClickSound();
              }}
              className="repo-context-select"
              aria-label="Active repository context"
            >
              <option value={`${siteConfig.githubUsername}/Dataforge-SYNCRON`}>{siteConfig.githubUsername}/Dataforge-SYNCRON</option>
              <option value={`${siteConfig.githubUsername}/SYNCRON`}>{siteConfig.githubUsername}/SYNCRON</option>
              <option value={`${siteConfig.githubUsername}/Local-Repo`}>{siteConfig.githubUsername}/Local-Repo</option>
              <option value={`${siteConfig.githubUsername}/Jayvir-Jadeja`}>{siteConfig.githubUsername}/Jayvir-Jadeja</option>
              <option value={`${siteConfig.githubUsername}/CRAZY-`}>{siteConfig.githubUsername}/CRAZY-</option>
              <option value={`${siteConfig.githubUsername}/type-your-name-for-attendance-`}>{siteConfig.githubUsername}/type-your-name-for-attendance-</option>
              <option value={`${siteConfig.githubUsername}/rea`}>{siteConfig.githubUsername}/rea</option>
              <option value={`${siteConfig.githubUsername}/worksheet12a`}>{siteConfig.githubUsername}/worksheet12a</option>
              <option value={`${siteConfig.githubUsername}/worksheet13a`}>{siteConfig.githubUsername}/worksheet13a</option>
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="btn btn-secondary btn-sm"
            title="Clear Chat History"
            aria-label="Clear chat history"
          >
            <Trash2 size={13} />
            <span className="hide-mobile">Clear</span>
          </button>
        </div>
      </div>

      {/* Ollama Setup Guide Modal / Popover */}
      {showSetupGuide && (
        <div className="ollama-guide-banner">
          <div className="guide-header">
            <div className="guide-title">
              <Info size={14} color="#D97706" />
              <strong>Local Ollama Integration Guide</strong>
            </div>
            <button
              onClick={() => setShowSetupGuide(false)}
              className="btn btn-secondary btn-xs"
            >
              Close
            </button>
          </div>

          <p className="guide-desc">
            CodeSherpa connects directly to your local Ollama instance on{' '}
            <code>http://localhost:11434</code>. If Ollama is not running, the system automatically uses
            an in-memory deterministic simulation engine with zero downtime.
          </p>

          <div className="guide-code-box font-mono">
            <div className="guide-code-line">
              <span className="prompt-char">$</span> ollama run qwen2.5-coder
            </div>
            <div className="guide-code-line">
              <span className="prompt-char">$</span> curl http://localhost:11434/api/tags
            </div>
          </div>
        </div>
      )}

      {/* Message Viewport */}
      <div className="chat-viewport" role="log" aria-label="CodeSherpa Conversation History">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message-row ${msg.role}`}>
            <div className="message-avatar" aria-hidden="true">
              {msg.role === 'assistant' ? (
                <Cpu size={15} color="#D97706" />
              ) : (
                <Terminal size={15} />
              )}
            </div>

            <div className="message-bubble">
              <div className="bubble-meta">
                <span className="meta-author">
                  {msg.role === 'assistant' ? 'CodeSherpa (Qwen2.5-Coder)' : 'Maintainer'}
                </span>
                <span className="meta-time font-mono">{msg.timestamp}</span>
                {msg.mode && (
                  <span className="meta-mode tag font-mono">
                    {msg.mode === 'live' ? 'ollama-live' : 'simulated-engine'}
                  </span>
                )}
              </div>

              <div className="bubble-content">
                {renderMessageContent(msg.content, msg.id)}
                {isStreaming && msg.id.startsWith('msg-asst') && (
                  <span className="cursor-blink" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions Ribbon */}
      <div className="preset-prompts-ribbon">
        <span className="ribbon-label">Quick Prompts:</span>
        <div className="ribbon-scroll">
          {PRESET_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              className="preset-chip"
              onClick={() => handleSendMessage(item.query)}
              disabled={isStreaming}
              aria-label={item.label}
            >
              <Sparkles size={11} color="#D97706" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Control Bar */}
      <div className="chat-input-bar">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Ask Qwen2.5-Coder to analyze an issue, inspect a code path, or author a patch..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={2}
          disabled={isStreaming}
          aria-label="Prompt input for Qwen2.5-Coder"
        />

        <div className="chat-input-actions">
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="btn btn-secondary btn-sm stop-btn"
              title="Stop Generating"
              aria-label="Stop generation"
            >
              <Square size={13} color="#EF4444" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim()}
              className="btn btn-primary btn-sm send-btn"
              title="Send to Qwen2.5-Coder"
              aria-label="Send message"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .codesherpa-chat-root {
          background: #090D11;
          border: 1px solid #30363D;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          height: 680px;
          overflow: hidden;
        }
        .chat-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: #161B22;
          border-bottom: 1px solid #30363D;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .model-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-name {
          font-weight: 600;
          color: #F0F6FC;
          font-size: 0.875rem;
        }
        .model-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-family: monospace;
          padding: 3px 8px;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .model-status-badge.online {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10B981;
        }
        .model-status-badge.offline {
          background: rgba(217, 119, 6, 0.12);
          border: 1px solid rgba(217, 119, 6, 0.3);
          color: #D97706;
        }
        .status-ping-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .chat-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .repo-context-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 3px;
          font-size: 0.75rem;
          color: #8B949E;
        }
        .repo-context-select {
          background: transparent;
          border: none;
          color: #C9D1D9;
          font-family: inherit;
          font-size: 0.75rem;
          outline: none;
          cursor: pointer;
        }
        .repo-context-select option {
          background: #161B22;
          color: #F0F6FC;
        }
        .ollama-guide-banner {
          background: #161B22;
          border-bottom: 1px solid #30363D;
          padding: 12px 16px;
          font-size: 0.8125rem;
        }
        .guide-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .guide-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #F0F6FC;
        }
        .guide-desc {
          color: #8B949E;
          margin: 0 0 8px;
          line-height: 1.45;
        }
        .guide-desc code {
          background: #0E1116;
          padding: 2px 5px;
          border-radius: 3px;
          color: #D97706;
        }
        .guide-code-box {
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 8px 12px;
          color: #C9D1D9;
          font-size: 0.75rem;
        }
        .guide-code-line {
          line-height: 1.5;
        }
        .prompt-char {
          color: #D97706;
          margin-right: 6px;
        }
        .chat-viewport {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #070B0E;
        }
        .chat-message-row {
          display: flex;
          gap: 12px;
          max-width: 88%;
        }
        .chat-message-row.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }
        .chat-message-row.assistant {
          margin-right: auto;
        }
        .message-avatar {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          background: #161B22;
          border: 1px solid #30363D;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #8B949E;
        }
        .message-bubble {
          background: #161B22;
          border: 1px solid #30363D;
          border-radius: 4px;
          padding: 12px 14px;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #F0F6FC;
        }
        .chat-message-row.user .message-bubble {
          background: #1C2128;
          border-color: #444C56;
        }
        .bubble-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 0.75rem;
          color: #8B949E;
        }
        .meta-author {
          font-weight: 600;
          color: #C9D1D9;
        }
        .meta-mode {
          font-size: 0.625rem;
          padding: 1px 5px;
          background: #0E1116;
          color: #8B949E;
          border-radius: 2px;
        }
        .chat-subhead {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #D97706;
          margin: 12px 0 6px;
        }
        .chat-para {
          margin: 0 0 8px;
          color: #C9D1D9;
        }
        .chat-list-line {
          margin: 4px 0;
          color: #C9D1D9;
        }
        .chat-code-block {
          background: #090D11;
          border: 1px solid #30363D;
          border-radius: 4px;
          margin: 10px 0;
          overflow: hidden;
        }
        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 10px;
          background: #12171F;
          border-bottom: 1px solid #30363D;
        }
        .code-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid #30363D;
          border-radius: 3px;
          color: #8B949E;
          font-size: 0.6875rem;
          padding: 2px 6px;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .code-copy-btn:hover {
          color: #F0F6FC;
          border-color: #D97706;
        }
        .code-content {
          margin: 0;
          padding: 10px 12px;
          font-size: 0.8125rem;
          overflow-x: auto;
          color: #E6EDF3;
          line-height: 1.45;
        }
        .cursor-blink {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: #D97706;
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .preset-prompts-ribbon {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: #12171F;
          border-top: 1px solid #30363D;
          overflow-x: auto;
        }
        .ribbon-label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8B949E;
          font-weight: 600;
          flex-shrink: 0;
        }
        .ribbon-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          white-space: nowrap;
        }
        .preset-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #161B22;
          border: 1px solid #30363D;
          color: #C9D1D9;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 3px;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .preset-chip:hover {
          border-color: #D97706;
          color: #F0F6FC;
        }
        .chat-input-bar {
          display: flex;
          gap: 10px;
          padding: 12px 16px;
          background: #161B22;
          border-top: 1px solid #30363D;
          align-items: flex-end;
        }
        .chat-textarea {
          flex: 1;
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 4px;
          color: #F0F6FC;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.4;
          padding: 8px 12px;
          resize: none;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .chat-textarea:focus {
          border-color: #D97706;
        }
        .chat-input-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .send-btn, .stop-btn {
          height: 38px;
          padding: 0 16px;
        }
        @media (max-width: 640px) {
          .codesherpa-chat-root {
            height: 560px;
          }
          .chat-message-row {
            max-width: 96%;
          }
        }
      `}</style>
    </div>
  );
}
