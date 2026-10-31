import Hero from '../components/Hero';
import HowItWorksSteps from '../components/HowItWorksSteps';
import IssueSimulator from '../components/IssueSimulator';
import Features from '../components/Features';

interface HomePageProps {
  onNavigateWorkbench: () => void;
  onNavigateInstall: () => void;
}

export default function HomePage({ onNavigateWorkbench, onNavigateInstall }: HomePageProps) {
  return (
    <div className="page-fade">
      <Hero
        onNavigateWorkbench={onNavigateWorkbench}
        onNavigateInstall={onNavigateInstall}
      />
      <HowItWorksSteps />
      <section className="section" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-label">Interactive Workbench</div>
            <h2 className="section-title">Test issue triage directly in your browser.</h2>
            <p className="section-desc">
              Inspect how incoming issue payloads are classified, flagged for duplicates, and synthesized into maintainer-approved drafts.
            </p>
          </div>
          <IssueSimulator />
        </div>
      </section>
      <Features />
    </div>
  );
}
