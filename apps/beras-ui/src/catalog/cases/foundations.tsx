import type { ReactNode } from 'react';
import '@krasnaya/beras-ui/styles.css';
import {
  BERAS_TOKEN_NAMES,
  berasLightTokenReference,
} from '@krasnaya/beras-ui/foundations';
import { foundationFixtures } from '../../fixtures/foundations';

interface CatalogCaseManifestEntry {
  id: `${string}/${string}/${string}`;
  fixtureId: `fixture:${string}`;
}

interface CatalogRuntimeCase {
  id: CatalogCaseManifestEntry['id'];
  fixtureId: CatalogCaseManifestEntry['fixtureId'];
  render: () => ReactNode;
}

const sans = foundationFixtures['fixture:foundation/typography/sans'];
const mono = foundationFixtures['fixture:foundation/typography/mono'];
const weights = foundationFixtures['fixture:foundation/typography/weights'];
const tokens = foundationFixtures['fixture:foundation/light-theme/tokens'];
const statuses = foundationFixtures['fixture:foundation/light-theme/status'];
const dataVisualization = foundationFixtures['fixture:foundation/light-theme/data-visualization'];
const contrast = foundationFixtures['fixture:foundation/light-theme/contrast'];

export const foundationCases: readonly CatalogRuntimeCase[] = [
  {
    id: 'foundation/typography/sans',
    fixtureId: 'fixture:foundation/typography/sans',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{sans.title}</h2>
        <p className="beras-foundation-font-sans">{sans.sample}</p>
      </section>
    ),
  },
  {
    id: 'foundation/typography/mono',
    fixtureId: 'fixture:foundation/typography/mono',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{mono.title}</h2>
        <code className="beras-code-block beras-foundation-font-mono">{mono.sample}</code>
      </section>
    ),
  },
  {
    id: 'foundation/typography/weights',
    fixtureId: 'fixture:foundation/typography/weights',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{weights.title}</h2>
        {weights.weights.map((weight) => (
          <p key={weight.value} className={`beras-foundation-weight-${weight.value}`}>
            {weight.label} — Pack my box with five dozen liquor jugs.
          </p>
        ))}
      </section>
    ),
  },
  {
    id: 'foundation/light-theme/tokens',
    fixtureId: 'fixture:foundation/light-theme/tokens',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{tokens.title}</h2>
        <p className="beras-foundation-description">{tokens.description}</p>
        <dl className="beras-foundation-token-list">
          {BERAS_TOKEN_NAMES.map((name) => (
            <div key={name} className="beras-foundation-token-row">
              <dt className="beras-foundation-token-name">{name}</dt>
              <dd className="beras-foundation-token-value">
                {berasLightTokenReference[name].value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    ),
  },
  {
    id: 'foundation/light-theme/status',
    fixtureId: 'fixture:foundation/light-theme/status',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{statuses.title}</h2>
        <div className="beras-foundation-status-row">
          {statuses.tones.map((tone) => (
            <span
              key={tone}
              className="beras-status-badge"
              data-beras-tone={tone}
              data-beras-variant="soft"
            >
              {tone}
            </span>
          ))}
        </div>
      </section>
    ),
  },
  {
    id: 'foundation/light-theme/data-visualization',
    fixtureId: 'fixture:foundation/light-theme/data-visualization',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{dataVisualization.title}</h2>
        <ul className="beras-foundation-data-list">
          {dataVisualization.series.map((series, index) => (
            <li key={series.token} className="beras-foundation-data-item">
              <span
                aria-hidden="true"
                className={`beras-foundation-data-swatch beras-foundation-data-${index + 1}`}
              />
              <span className="beras-foundation-data-label">{series.label}</span>
              <span className="beras-foundation-data-marker">{series.marker}</span>
              <code className="beras-foundation-token-name">{series.token}</code>
            </li>
          ))}
        </ul>
      </section>
    ),
  },
  {
    id: 'foundation/light-theme/contrast',
    fixtureId: 'fixture:foundation/light-theme/contrast',
    render: () => (
      <section data-beras-root className="beras-card beras-foundation-preview">
        <h2 className="beras-foundation-title">{contrast.title}</h2>
        <dl className="beras-foundation-contrast-list">
          {contrast.pairs.map((pair) => (
            <div key={pair.label} className="beras-foundation-contrast-row">
              <dt className="beras-foundation-contrast-label">{pair.label}</dt>
              <dd className="beras-foundation-contrast-value">
                {pair.ratio} (minimum {pair.minimum})
              </dd>
            </div>
          ))}
        </dl>
        <p className="beras-foundation-description">{contrast.note}</p>
      </section>
    ),
  },
];
