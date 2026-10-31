import { useState, useEffect, Suspense, useCallback, lazy } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import CommandPalette from './components/CommandPalette';
import HomePage from './views/HomePage';
import DashboardPage from './views/DashboardPage';
import DocsPage from './views/DocsPage';
import PrivacyPage from './views/PrivacyPage';
import TermsPage from './views/TermsPage';
import NotFoundPage from './views/NotFoundPage';
import InstallPage from './views/InstallPage';
import CustomDomainConfig from './components/CustomDomainConfig';
import { AppRoute } from './types';
import { siteConfig } from './config/site.config';
import { isWebGLAvailable, prefersReducedMotion } from './utils/transition';

// Lazy-load Three.js transition component to keep initial bundle ultra small
const ThreeTransition = lazy(() => import('./components/ThreeTransition'));

function getInitialRoute(): AppRoute {
  if (typeof window === 'undefined') return 'home';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (path === '' || path === 'home') return 'home';
  if (path === 'dashboard' || path === 'workbench') return 'dashboard';
  if (path === 'docs' || path === 'how-it-works') return 'docs';
  if (path === 'privacy') return 'privacy';
  if (path === 'terms') return 'terms';
  if (path === 'domain') return 'domain';
  if (path === 'install') return 'install';
  return '404';
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [targetRoute, setTargetRoute] = useState<AppRoute | null>(null);
  const [is3DTransitionActive, setIs3DTransitionActive] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global keyboard shortcut for Command Palette (Cmd + K or Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync route with page title and canonical URL
  useEffect(() => {
    const titles: Record<AppRoute, string> = {
      home: `${siteConfig.projectName}: AI for Open Source Issue Triage and First Reply Drafting`,
      dashboard: `Triage Dashboard and SQLite Audit Log: ${siteConfig.projectName}`,
      docs: `Architecture and Technical Documentation: ${siteConfig.projectName}`,
      privacy: `Privacy Policy: ${siteConfig.projectName}`,
      terms: `Terms and Conditions: ${siteConfig.projectName}`,
      domain: `Custom Domain Configuration: ${siteConfig.projectName}`,
      install: `Install GitHub App: ${siteConfig.projectName}`,
      '404': `404 Not Found: ${siteConfig.projectName}`
    };

    document.title = titles[currentRoute];

    // Update history without page reload
    const currentPath = currentRoute === 'home' ? '/' : `/${currentRoute}`;
    if (window.location.pathname !== currentPath) {
      window.history.pushState({ route: currentRoute }, '', currentPath);
    }

    // Scroll to top upon route completion
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentRoute]);

  // Handle browser popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
      } else {
        setCurrentRoute(getInitialRoute());
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation handler triggered strictly by navigation clicks
  const navigateTo = useCallback((newRoute: AppRoute) => {
    if (newRoute === currentRoute) return;

    // Never block the user: if navigating again mid-transition, cancel and switch immediately
    if (is3DTransitionActive) {
      setCurrentRoute(newRoute);
      setTargetRoute(null);
      setIs3DTransitionActive(false);
      return;
    }

    // Check accessibility and hardware capabilities
    const reducedMotion = prefersReducedMotion();
    const webGLSupported = isWebGLAvailable();

    if (reducedMotion || !webGLSupported) {
      // Direct subtle fade without 3D animation
      setCurrentRoute(newRoute);
      return;
    }

    // Trigger 3D route transition
    setTargetRoute(newRoute);
    setIs3DTransitionActive(true);
  }, [currentRoute, is3DTransitionActive]);

  const handleTransitionMidpoint = useCallback(() => {
    if (targetRoute) {
      setCurrentRoute(targetRoute);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [targetRoute]);

  const handleTransitionComplete = useCallback(() => {
    setTargetRoute(null);
    setIs3DTransitionActive(false);
  }, []);

  const handleNavigateWorkbench = useCallback(() => {
    navigateTo('dashboard');
  }, [navigateTo]);

  return (
    <div className="app-root">
      {/* WCAG Skip to Main Content Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Semantic Accessible Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
        {currentRoute === 'home' && (
          <HomePage
            onNavigateWorkbench={handleNavigateWorkbench}
            onNavigateInstall={() => navigateTo('install')}
          />
        )}
        {currentRoute === 'dashboard' && <DashboardPage />}
        {currentRoute === 'docs' && <DocsPage />}
        {currentRoute === 'domain' && (
          <div className="container section page-fade">
            <CustomDomainConfig />
          </div>
        )}
        {currentRoute === 'privacy' && <PrivacyPage />}
        {currentRoute === 'terms' && <TermsPage />}
        {currentRoute === 'install' && <InstallPage />}
        {currentRoute === '404' && <NotFoundPage onNavigate={navigateTo} />}
      </main>

      {/* Semantic Accessible Footer on Every Page */}
      <Footer onNavigate={navigateTo} />

      {/* Lazy-Loaded 3D Transition Canvas with Lightweight Loading Skeleton */}
      {is3DTransitionActive && (
        <Suspense
          fallback={
            <div
              className="route-transition-canvas-wrapper"
              style={{
                backgroundColor: 'rgba(14, 17, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div className="skeleton-loader" style={{ width: 120, height: 4, borderRadius: 2 }} />
            </div>
          }
        >
          <ThreeTransition
            onMidpoint={handleTransitionMidpoint}
            onTransitionEnd={handleTransitionComplete}
            durationMs={750}
          />
        </Suspense>
      )}
    </div>
  );
}
