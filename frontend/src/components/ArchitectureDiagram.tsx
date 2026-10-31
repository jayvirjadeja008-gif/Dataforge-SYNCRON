'use client';
// Real architecture pipeline diagram built in pure SVG
// TODO: Replace with product screenshot if production dashboard visual capture is available
export default function ArchitectureDiagram() {
  return (
    <div className="diagram-wrapper">
      <svg
        viewBox="0 0 960 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="architecture-svg"
        aria-label="PatchPilot edge architecture and triage pipeline diagram"
        role="img"
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#21262D" strokeWidth="0.5" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
          </marker>
        </defs>

        <rect width="960" height="280" fill="#161B22" rx="6" stroke="#30363D" strokeWidth="1" />
        <rect width="960" height="280" fill="url(#grid-pattern)" rx="6" />

        {/* Node 1: GitHub Webhook */}
        <g transform="translate(40, 60)">
          <rect width="160" height="150" rx="4" fill="#0E1116" stroke="#30363D" strokeWidth="1.5" />
          <rect width="160" height="32" rx="4" fill="#21262D" stroke="#30363D" strokeWidth="1" />
          <text x="12" y="21" fill="#F0F6FC" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
            1. GitHub Webhook
          </text>
          <text x="12" y="56" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Event: issues.opened</text>
          <text x="12" y="76" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Signature: HMAC-SHA256</text>
          <text x="12" y="96" fill="#C9D1D9" fontSize="11" fontFamily="ui-monospace, monospace">Payload: title, body</text>
          <text x="12" y="116" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Sender: @contributor</text>
          <rect x="12" y="130" width="70" height="14" rx="2" fill="#D97706" fillOpacity="0.15" stroke="#D97706" strokeWidth="0.5" />
          <text x="18" y="141" fill="#FBBF24" fontSize="9" fontFamily="ui-monospace, monospace">HTTPS POST</text>
        </g>

        {/* Connector 1 to 2 */}
        <line x1="200" y1="135" x2="252" y2="135" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />

        {/* Node 2: Edge Ingestion Worker */}
        <g transform="translate(260, 60)">
          <rect width="180" height="150" rx="4" fill="#0E1116" stroke="#30363D" strokeWidth="1.5" />
          <rect width="180" height="32" rx="4" fill="#21262D" stroke="#30363D" strokeWidth="1" />
          <text x="12" y="21" fill="#F0F6FC" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
            2. Edge Gateway
          </text>
          <text x="12" y="56" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Verify App Secrets</text>
          <text x="12" y="76" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Extract Issue Context</text>
          <text x="12" y="96" fill="#C9D1D9" fontSize="11" fontFamily="ui-monospace, monospace">In-Memory Token Cache</text>
          <text x="12" y="116" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Zero Disk Logging</text>
          <rect x="12" y="130" width="94" height="14" rx="2" fill="#21262D" stroke="#30363D" strokeWidth="0.5" />
          <text x="18" y="141" fill="#34D399" fontSize="9" fontFamily="ui-monospace, monospace">Latency: ~45ms</text>
        </g>

        {/* Connector 2 to 3 */}
        <line x1="440" y1="135" x2="492" y2="135" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />

        {/* Node 3: AI Inference Engine */}
        <g transform="translate(500, 40)">
          <rect width="210" height="190" rx="4" fill="#0E1116" stroke="#D97706" strokeWidth="1.5" />
          <rect width="210" height="32" rx="4" fill="#21262D" stroke="#D97706" strokeWidth="1" />
          <text x="12" y="21" fill="#F0F6FC" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
            3. AI Engine Pipeline
          </text>
          
          <rect x="12" y="44" width="186" height="38" rx="2" fill="#161B22" stroke="#30363D" strokeWidth="1" />
          <text x="20" y="60" fill="#F0F6FC" fontSize="10" fontWeight="600" fontFamily="ui-monospace, monospace">Issue Classification</text>
          <text x="20" y="74" fill="#8B949E" fontSize="9" fontFamily="ui-monospace, monospace">Schema constrained taxonomy</text>

          <rect x="12" y="90" width="186" height="38" rx="2" fill="#161B22" stroke="#30363D" strokeWidth="1" />
          <text x="20" y="106" fill="#F0F6FC" fontSize="10" fontWeight="600" fontFamily="ui-monospace, monospace">Vector Duplicate Search</text>
          <text x="20" y="120" fill="#8B949E" fontSize="9" fontFamily="ui-monospace, monospace">Cosine similarity vs history</text>

          <rect x="12" y="136" width="186" height="38" rx="2" fill="#161B22" stroke="#30363D" strokeWidth="1" />
          <text x="20" y="152" fill="#F0F6FC" fontSize="10" fontWeight="600" fontFamily="ui-monospace, monospace">First-Reply Drafting</text>
          <text x="20" y="166" fill="#8B949E" fontSize="9" fontFamily="ui-monospace, monospace">References CONTRIBUTING.md</text>
        </g>

        {/* Connector 3 to 4 */}
        <line x1="710" y1="135" x2="752" y2="135" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#arrow)" />

        {/* Node 4: Maintainer Queue & GitHub */}
        <g transform="translate(760, 60)">
          <rect width="160" height="150" rx="4" fill="#0E1116" stroke="#30363D" strokeWidth="1.5" />
          <rect width="160" height="32" rx="4" fill="#21262D" stroke="#30363D" strokeWidth="1" />
          <text x="12" y="21" fill="#F0F6FC" fontSize="12" fontWeight="600" fontFamily="ui-monospace, monospace">
            4. Maintainer Queue
          </text>
          <text x="12" y="56" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Review Label Scores</text>
          <text x="12" y="76" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Inspect Duplicates</text>
          <text x="12" y="96" fill="#C9D1D9" fontSize="11" fontFamily="ui-monospace, monospace">Approve Draft Reply</text>
          <text x="12" y="116" fill="#8B949E" fontSize="11" fontFamily="ui-monospace, monospace">Dispatch via REST API</text>
          <rect x="12" y="130" width="80" height="14" rx="2" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="0.5" />
          <text x="18" y="141" fill="#34D399" fontSize="9" fontFamily="ui-monospace, monospace">Zero Auto-Spam</text>
        </g>
      </svg>
      <div className="diagram-caption">
        <span className="diagram-caption-tag">Pipeline Trace</span>
        <span>Deterministic webhook flow with human-in-the-loop maintainer approval before dispatching comments.</span>
      </div>

      <style>{`
        .diagram-wrapper {
          margin: 32px 0;
        }
        .architecture-svg {
          width: 100%;
          height: auto;
          display: block;
          border-radius: var(--radius-lg);
        }
        .diagram-caption {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          font-size: 0.8125rem;
          color: var(--ink-muted);
          flex-wrap: wrap;
        }
        .diagram-caption-tag {
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--accent-primary);
          background: var(--bg-surface);
          border: 1px solid var(--border-base);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
