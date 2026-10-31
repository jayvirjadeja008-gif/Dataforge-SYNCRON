import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Terminal,
  Layers,
  Download,
  Globe,
  Shield,
  FileText,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Send,
  CornerDownLeft,
  Cpu
} from 'lucide-react';
import GithubIcon from './GithubIcon';
import { AppRoute } from '../types';
import { siteConfig } from '../config/site.config';
import { isSoundEnabled, toggleSound, playClickSound } from '../utils/sound';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Repositories';
  icon: React.ComponentType<{ size: number; className?: string; style?: React.CSSProperties }>;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggleSound = useCallback(() => {
    const newState = toggleSound();
    setSoundOn(newState);
    playClickSound();
  }, []);

  const handleCopyEndpoint = useCallback(() => {
    navigator.clipboard.writeText('http://localhost:8000/api/webhook');
    setCopiedEndpoint(true);
    playClickSound();
    setTimeout(() => {
      setCopiedEndpoint(false);
      onClose();
    }, 800);
  }, [onClose]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Open Triage Dashboard and SQLite Log',
      category: 'Navigation',
      icon: Terminal,
      shortcut: 'G D',
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-home',
      title: 'Go to Home Workbench',
      category: 'Navigation',
      icon: Layers,
      shortcut: 'G H',
      action: () => { onNavigate('home'); onClose(); }
    },
    {
      id: 'nav-docs',
      title: 'View Architecture and Documentation',
      category: 'Navigation',
      icon: FileText,
      shortcut: 'G A',
      action: () => { onNavigate('docs'); onClose(); }
    },
    {
      id: 'nav-install',
      title: 'Install GitHub App Manifest',
      category: 'Navigation',
      icon: Download,
      shortcut: 'G I',
      action: () => { onNavigate('install'); onClose(); }
    },
    {
      id: 'nav-domain',
      title: 'View Custom Domain DNS Records',
      category: 'Navigation',
      icon: Globe,
      action: () => { onNavigate('domain'); onClose(); }
    },
    {
      id: 'nav-privacy',
      title: 'View Privacy and Token Policy',
      category: 'Navigation',
      icon: Shield,
      action: () => { onNavigate('privacy'); onClose(); }
    },
    {
      id: 'nav-terms',
      title: 'View Terms and MIT License',
      category: 'Navigation',
      icon: FileText,
      action: () => { onNavigate('terms'); onClose(); }
    },

    // Actions
    {
      id: 'act-webhook-copy',
      title: copiedEndpoint ? 'Copied Webhook URL' : 'Copy Localhost Webhook URL',
      category: 'Actions',
      icon: copiedEndpoint ? Check : Copy,
      shortcut: 'C W',
      action: handleCopyEndpoint
    },
    {
      id: 'act-sound-toggle',
      title: soundOn ? 'Mute Interface Sound Effects' : 'Enable Interface Sound Effects',
      category: 'Actions',
      icon: soundOn ? Volume2 : VolumeX,
      shortcut: 'M',
      action: handleToggleSound
    },
    {
      id: 'act-simulate',
      title: 'Simulate Inbound Webhook Payload',
      category: 'Actions',
      icon: Send,
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'act-codesherpa-chat',
      title: 'Ask CodeSherpa AI (Qwen2.5-Coder)',
      category: 'Actions',
      icon: Cpu,
      shortcut: 'G C',
      action: () => { onNavigate('dashboard'); onClose(); }
    },

    // Repositories
    {
      id: 'repo-dataforge',
      title: 'Target Repo: Dataforge-SYNCRON',
      category: 'Repositories',
      icon: GithubIcon,
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'repo-syncron',
      title: 'Target Repo: SYNCRON',
      category: 'Repositories',
      icon: GithubIcon,
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'repo-jayvir',
      title: 'Target Repo: Jayvir-Jadeja',
      category: 'Repositories',
      icon: GithubIcon,
      action: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'repo-profile',
      title: `View GitHub Profile (@${siteConfig.githubUsername})`,
      category: 'Repositories',
      icon: GithubIcon,
      action: () => {
        window.open(siteConfig.githubProfileUrl, '_blank', 'noopener,noreferrer');
        onClose();
      }
    }
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="palette-card" onClick={(e) => e.stopPropagation()}>
        <div className="palette-search-row">
          <Search size={16} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="palette-input"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="palette-esc-badge" onClick={onClose}>ESC</kbd>
        </div>

        <div className="palette-results-list" role="listbox">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="palette-item-left">
                    <div className="palette-item-icon">
                      <Icon size={14} />
                    </div>
                    <span className="palette-item-title">{cmd.title}</span>
                  </div>
                  <div className="palette-item-right">
                    <span className="palette-item-cat">{cmd.category}</span>
                    {cmd.shortcut && <kbd className="palette-key-badge">{cmd.shortcut}</kbd>}
                    {isSelected && <CornerDownLeft size={12} className="palette-enter-icon" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="palette-empty">No commands matching &ldquo;{query}&rdquo;</div>
          )}
        </div>

        <div className="palette-footer">
          <div className="footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className="footer-meta">PatchPilot Command Menu</span>
        </div>
      </div>

      <style>{`
        .palette-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 13, 17, 0.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 80px 16px;
          animation: paletteFade 100ms ease-out;
        }
        @keyframes paletteFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .palette-card {
          width: 100%;
          max-width: 600px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
          animation: cardSlide 120ms ease-out;
        }
        @keyframes cardSlide {
          from { transform: translateY(-8px) scale(0.98); }
          to { transform: translateY(0) scale(1); }
        }
        .palette-search-row {
          display: flex;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-base);
          background: var(--bg-elevated);
          gap: 12px;
        }
        .palette-search-icon {
          color: var(--ink-muted);
          flex-shrink: 0;
        }
        .palette-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--ink-primary);
          font-size: 0.9375rem;
          outline: none;
          font-family: inherit;
        }
        .palette-esc-badge {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          padding: 2px 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          border-radius: 2px;
          color: var(--ink-muted);
          cursor: pointer;
        }
        .palette-results-list {
          max-height: 340px;
          overflow-y: auto;
          padding: 8px;
        }
        .palette-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background-color 60ms ease;
          gap: 12px;
        }
        .palette-item:hover, .palette-item.selected {
          background: var(--bg-elevated);
        }
        .palette-item.selected .palette-item-title {
          color: var(--ink-primary);
        }
        .palette-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }
        .palette-item-icon {
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .palette-item-title {
          font-size: 0.875rem;
          color: var(--ink-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .palette-item-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .palette-item-cat {
          font-size: 0.6875rem;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .palette-key-badge {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
          padding: 1px 5px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 2px;
          color: var(--ink-secondary);
        }
        .palette-enter-icon {
          color: var(--accent-primary);
        }
        .palette-empty {
          padding: 28px;
          text-align: center;
          font-size: 0.875rem;
          color: var(--ink-muted);
        }
        .palette-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 18px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          font-size: 0.75rem;
          color: var(--ink-muted);
        }
        .footer-keys {
          display: flex;
          gap: 12px;
        }
        .footer-keys kbd {
          font-family: var(--font-mono);
          padding: 1px 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 2px;
          color: var(--ink-secondary);
        }
        .footer-meta {
          font-family: var(--font-mono);
          font-size: 0.6875rem;
        }
      `}</style>
    </div>
  );
}
