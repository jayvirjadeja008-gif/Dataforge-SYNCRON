export interface FeatureItem {
  id: string;
  title: string;
  shortDescription: string;
  technicalDetails: string;
  inputs: string[];
  outputs: string[];
}

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  host: string;
  value: string;
  ttl: string;
  purpose: string;
}

export interface SiteConfig {
  projectName: string;
  theme: string;
  headline: string;
  subline: string;
  targetAudience: string;
  features: [FeatureItem, FeatureItem, FeatureItem];
  repoUrl: string;
  githubProfileUrl: string;
  githubUsername: string;
  demoUrl: string;
  installUrl: string;
  teamNames: string[];
  contactEmail: string;
  lastUpdatedDate: string;
  licenseName: string;
  licenseUrl: string;
  jurisdiction: string;
  customDomain: string;
  canonicalUrl: string;
  dnsRecords: DnsRecord[];
}

export const siteConfig: SiteConfig = {
  projectName: "PatchPilot",
  theme: "AI for Open Source (use AI to make open source easier to build, maintain and join)",
  headline: "Triage incoming GitHub issues and draft maintainer replies.",
  subline: "A GitHub App that reads incoming repository issues, classifies labels, detects duplicate reports, and drafts first-response replies for maintainers.",
  targetAudience: "Built for open source maintainers managing high issue volume and first-time contributors seeking actionable guidance.",
  features: [
    {
      id: "feature-classification",
      title: "Issue Classification and Semantic Tagging",
      shortDescription: "Ingests issue titles and markdown bodies upon submission, parses repository taxonomy, and applies accurate labels with confidence scoring.",
      technicalDetails: "Executes structured schema extraction on edge runtime. Applies labels exceeding an eighty-five percent confidence threshold.",
      inputs: ["Issue title", "Issue description", "Repository label taxonomy", "CONTRIBUTING.md rules"],
      outputs: ["Repository labels", "Calibrated confidence score", "Category classification"]
    },
    {
      id: "feature-duplicates",
      title: "Duplicate Issue and Discussion Detection",
      shortDescription: "Computes semantic embeddings across existing open and closed issues to surface duplicate reports with direct link citations.",
      technicalDetails: "Generates vector embeddings and computes cosine similarity against historical repository issues. Issues above 0.88 similarity are flagged.",
      inputs: ["Incoming issue vector", "Cached repository issue embeddings", "Historical closed issue index"],
      outputs: ["Duplicate match probability", "Referenced issue link", "Similarity overlap breakdown"]
    },
    {
      id: "feature-drafts",
      title: "Contextual First-Reply Drafting",
      shortDescription: "Generates suggested initial replies referencing repository reproduction guidelines, held in draft state for maintainer approval before posting.",
      technicalDetails: "Analyzes stack trace and reproduction clarity against templates. Drafts a friendly, specific response held in pending review state.",
      inputs: ["Issue reproduction details", "Repo issue template", "Codebase documentation snippets"],
      outputs: ["Maintainer draft comment", "Missing information checklist", "Approval status toggle"]
    }
  ],
  repoUrl: "https://github.com/jayvirjadeja008-gif",
  githubProfileUrl: "https://github.com/jayvirjadeja008-gif",
  githubUsername: "jayvirjadeja008-gif",
  demoUrl: "#workbench",
  installUrl: "/install",
  teamNames: ["Devforge-SYNCRON"],
  contactEmail: "jayvirjadeja008@gmail.com",
  lastUpdatedDate: "October 31, 2026",
  licenseName: "MIT License",
  licenseUrl: "https://opensource.org/licenses/MIT",
  jurisdiction: "State of California, United States",
  customDomain: "patchpilot.dev",
  canonicalUrl: "https://patchpilot.dev",
  dnsRecords: [
    {
      type: "A",
      host: "@",
      value: "76.76.21.21",
      ttl: "3600",
      purpose: "Apex domain routing to edge server cluster"
    },
    {
      type: "CNAME",
      host: "www",
      value: "cname.patchpilot.dev",
      ttl: "3600",
      purpose: "Subdomain alias with automatic 301 redirection to apex domain"
    },
    {
      type: "TXT",
      host: "_github-challenge-patchpilot",
      value: "94b1f6d3a8e24c5b9071f",
      ttl: "3600",
      purpose: "GitHub organization and custom domain ownership verification"
    }
  ]
};
