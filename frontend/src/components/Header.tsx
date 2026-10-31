import { useState } from 'react';
import { Terminal, Menu, X, ArrowUpRight, Search, Volume2, VolumeX } from 'lucide-react';
import GithubIcon from './GithubIcon';
import { AppRoute } from '../types';
import { siteConfig } from '../config/site.config';
import { isSoundEnabled, toggleSound, playClickSound } from '../utils/sound';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCommandPalette?: () => void;
}

export default function Header({ currentRoute, onNavigate, onOpenCommandPalette }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  const handleRouteClick = (route: AppRoute) => {
    playClickSound();
    setMobileMenuOpen(false);
    onNavigate(route);
  };

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundActive(newState);
    if (newState) {
      playClickSound();
    }
  };

  const handleCommandPaletteClick = () => {
    playClickSound();
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    }
  };

  return (
    <header className="site-header" role="banner">
      <div className="container header-inner">
        <a
          href="#main-content"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault();
            handleRouteClick('home');
          }}
          aria-label={`${siteConfig.projectName} Home`}
        >
          <div className="brand-mark" aria-hidden="true">
            <Terminal size={16} />
          </div>
          <span>{siteConfig.projectName}</span>
          <span className="tag" style={{ marginLeft: 6 }}>v1.0.0</span>
        </a>

        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav
          className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}
          role="navigation"
          aria-label="Main Navigation"
        >
          <button
            className={`nav-item ${currentRoute === 'home' ? 'active' : ''}`}
            onClick={() => handleRouteClick('home')}
            aria-current={currentRoute === 'home' ? 'page' : undefined}
          >
            Home
          </button>
          <button
            className={`nav-item ${currentRoute === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleRouteClick('dashboard')}
            aria-current={currentRoute === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${currentRoute === 'docs' ? 'active' : ''}`}
            onClick={() => handleRouteClick('docs')}
            aria-current={currentRoute === 'docs' ? 'page' : undefined}
          >
            Docs &amp; Architecture
          </button>
          <button
            className={`nav-item ${currentRoute === 'domain' ? 'active' : ''}`}
            onClick={() => handleRouteClick('domain')}
            aria-current={currentRoute === 'domain' ? 'page' : undefined}
          >
            Custom Domain
          </button>
          <button
            className={`nav-item ${currentRoute === 'privacy' ? 'active' : ''}`}
            onClick={() => handleRouteClick('privacy')}
            aria-current={currentRoute === 'privacy' ? 'page' : undefined}
          >
            Privacy
          </button>
          <button
            className={`nav-item ${currentRoute === 'terms' ? 'active' : ''}`}
            onClick={() => handleRouteClick('terms')}
            aria-current={currentRoute === 'terms' ? 'page' : undefined}
          >
            Terms
          </button>
        </nav>

        <div className="header-right">
          {/* Global Command Palette Trigger */}
          <button
            onClick={handleCommandPaletteClick}
            className="btn btn-secondary btn-sm cmdk-btn"
            aria-label="Open Command Palette (Command + K)"
            title="Press Command + K"
          >
            <Search size={13} />
            <span className="cmdk-label hide-mobile">Search</span>
            <kbd className="cmdk-kbd">Cmd K</kbd>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            className="btn btn-secondary btn-sm icon-btn"
            aria-label={soundActive ? 'Tactile Audio Enabled. Click to Mute.' : 'Tactile Audio Muted. Click to Enable.'}
            title={soundActive ? 'Mute procedural audio' : 'Enable procedural audio'}
            style={{ width: 34, height: 34, padding: 0, justifyContent: 'center' }}
          >
            {soundActive ? <Volume2 size={14} color="#D97706" /> : <VolumeX size={14} />}
          </button>

          <a
            href={siteConfig.githubProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            aria-label="GitHub Profile @jayvirjadeja008-gif"
          >
            <GithubIcon size={14} />
            <span className="hide-mobile">@{siteConfig.githubUsername}</span>
          </a>
          <button
            onClick={() => handleRouteClick('install')}
            className="btn btn-primary btn-sm"
            aria-label="Install GitHub App"
            id="header-install-btn"
          >
            <span>Install</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      <style>{`
        .cmdk-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #161B22;
          border: 1px solid #30363D;
          color: #8B949E;
          border-radius: 4px;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .cmdk-btn:hover {
          border-color: #D97706;
          color: #F0F6FC;
        }
        .cmdk-label {
          font-size: 0.8125rem;
        }
        .cmdk-kbd {
          background: #0E1116;
          border: 1px solid #30363D;
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 0.6875rem;
          color: #8B949E;
          font-family: monospace;
          line-height: 1;
        }
        @media (max-width: 768px) {
          .hide-mobile {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
