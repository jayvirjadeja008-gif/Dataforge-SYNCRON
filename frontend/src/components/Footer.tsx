'use client';
import { Terminal, Mail, Shield, FileText, Globe } from 'lucide-react';
import GithubIcon from './GithubIcon';
import { AppRoute } from '../types';
import { siteConfig } from '../config/site.config';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="brand-link" style={{ marginBottom: 12 }}>
              <div className="brand-mark" aria-hidden="true">
                <Terminal size={15} />
              </div>
              <span>{siteConfig.projectName}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 16 }}>
              {siteConfig.subline}
            </p>
            <div className="tag tag-accent">
              Hackathon Project: {siteConfig.theme}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <div className="footer-col-title">Navigation</div>
            <ul className="footer-links">
              <li>
                <button onClick={() => onNavigate('home')}>Home</button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')}>Triage Dashboard</button>
              </li>
              <li>
                <button onClick={() => onNavigate('docs')}>Docs &amp; Architecture</button>
              </li>
              <li>
                <button onClick={() => onNavigate('domain')}>Custom Domain</button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <div className="footer-col-title">Legal &amp; Policy</div>
            <ul className="footer-links">
              <li>
                <button onClick={() => onNavigate('privacy')}>
                  <Shield size={13} style={{ display: 'inline', marginRight: 6 }} />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')}>
                  <FileText size={13} style={{ display: 'inline', marginRight: 6 }} />
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <a
                  href={siteConfig.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteConfig.licenseName}
                </a>
              </li>
            </ul>
          </div>

          {/* Project & Community */}
          <div>
            <div className="footer-col-title">Community</div>
            <ul className="footer-links">
              <li>
                <a
                  href={siteConfig.githubProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon size={13} style={{ display: 'inline', marginRight: 6 }} />
                  GitHub Profile (@{siteConfig.githubUsername})
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`}>
                  <Mail size={13} style={{ display: 'inline', marginRight: 6 }} />
                  {siteConfig.contactEmail}
                </a>
              </li>
              <li>
                <a
                  href={`https://${siteConfig.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={13} style={{ display: 'inline', marginRight: 6 }} />
                  {siteConfig.customDomain}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            Built by {siteConfig.teamNames.join(', ')}. Released under the {siteConfig.licenseName}.
          </div>
          <div>
            Zero telemetry tracking. Zero third-party ad scripts.
          </div>
        </div>
      </div>
    </footer>
  );
}
