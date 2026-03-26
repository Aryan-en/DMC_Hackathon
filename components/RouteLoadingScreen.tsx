'use client';

import OntoraLogo from '@/components/OntoraLogo';

export default function RouteLoadingScreen() {
  return (
    <div className="ontora-loading-shell" role="status" aria-live="polite" aria-label="Loading Ontora">
      <div className="ontora-loading-center">
        <OntoraLogo size={88} className="ontora-loading-logo" color="var(--loading-logo)" />
        <div className="ontora-loading-bar" aria-hidden="true">
          <span className="ontora-loading-bar-fill" />
        </div>
      </div>

      <style jsx>{`
        .ontora-loading-shell {
          --loading-bg: var(--background);
          --loading-logo: var(--accent-gold);
          --loading-track: rgba(148, 163, 184, 0.18);
          --loading-fill: color-mix(in srgb, var(--accent-gold) 64%, white 36%);
          position: fixed;
          inset: 0;
          z-index: 60;
          display: grid;
          place-items: center;
          background: var(--loading-bg);
        }

        :global(html.light) .ontora-loading-shell {
          --loading-bg: #ffffff;
          --loading-logo: var(--accent-gold);
          --loading-track: rgba(15, 23, 42, 0.1);
          --loading-fill: color-mix(in srgb, var(--accent-gold) 78%, #1e3a8a 22%);
        }

        :global(html.dark) .ontora-loading-shell {
          --loading-bg: #060c1d;
          --loading-logo: var(--accent-gold);
          --loading-track: rgba(255, 255, 255, 0.12);
          --loading-fill: #ffffff;
        }

        .ontora-loading-center {
          width: min(300px, calc(100vw - 3rem));
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .ontora-loading-logo {
          animation: logoBreathe 2s ease-in-out infinite;
        }

        .ontora-loading-bar {
          position: relative;
          width: 100%;
          height: 4px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--loading-track);
        }

        .ontora-loading-bar-fill {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -38%;
          width: 38%;
          border-radius: inherit;
          background: var(--loading-fill);
          animation: indeterminateBar 2s ease-in-out infinite;
        }

        @keyframes logoBreathe {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.03);
          }
        }

        @keyframes indeterminateBar {
          0% {
            left: -38%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
