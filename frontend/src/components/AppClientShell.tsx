'use client';

import { useState, useEffect, Suspense, useCallback, lazy, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import CommandPalette from './CommandPalette';
import { AppRoute } from '../types';
import { isWebGLAvailable, prefersReducedMotion } from '../utils/transition';

// Lazy-load Three.js transition component to keep initial bundle lightweight
const ThreeTransition = lazy(() => import('./ThreeTransition'));

interface AppClientShellProps {
  children: ReactNode;
}

function pathToRoute(path: string): AppRoute {
  const clean = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (clean === '' || clean === 'home') return 'home';
  if (clean === 'dashboard' || clean === 'workbench') return 'dashboard';
  if (clean === 'docs' || clean === 'how-it-works') return 'docs';
  if (clean === 'privacy') return 'privacy';
  if (clean === 'terms') return 'terms';
  if (clean === 'domain') return 'domain';
  if (clean === 'install') return 'install';
  return '404';
}

function routeToPath(route: AppRoute): string {
  if (route === 'home') return '/';
  return `/${route}`;
}

export default function AppClientShell({ children }: AppClientShellProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const currentRoute = pathToRoute(pathname);

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

  // Navigation handler triggered strictly by navigation clicks
  const navigateTo = useCallback((newRoute: AppRoute) => {
    if (newRoute === currentRoute) return;

    // Never block user: if navigating again mid-transition, cancel and switch immediately
    if (is3DTransitionActive) {
      setTargetRoute(null);
      setIs3DTransitionActive(false);
      router.push(routeToPath(newRoute));
      return;
    }

    // Check accessibility and hardware capabilities
    const reducedMotion = prefersReducedMotion();
    const webGLSupported = isWebGLAvailable();

    if (reducedMotion || !webGLSupported) {
      // Direct subtle navigation without 3D animation
      router.push(routeToPath(newRoute));
      return;
    }

    // Trigger 3D route transition
    setTargetRoute(newRoute);
    setIs3DTransitionActive(true);
  }, [currentRoute, is3DTransitionActive, router]);

  const handleTransitionMidpoint = useCallback(() => {
    if (targetRoute) {
      router.push(routeToPath(targetRoute));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
  }, [targetRoute, router]);

  const handleTransitionComplete = useCallback(() => {
    setTargetRoute(null);
    setIs3DTransitionActive(false);
  }, []);

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
        {children}
      </main>

      {/* Semantic Accessible Footer on Every Page */}
      <Footer onNavigate={navigateTo} />

      {/* Lazy-Loaded 3D Transition Canvas */}
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
