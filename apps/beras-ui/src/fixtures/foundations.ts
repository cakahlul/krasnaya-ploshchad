export const foundationFixtures = Object.freeze({
  'fixture:foundation/typography/sans': {
    title: 'Space Grotesk',
    sample: 'Sphinx of black quartz, judge my vow.',
  },
  'fixture:foundation/typography/mono': {
    title: 'IBM Plex Mono',
    sample: 'const report = { sources: 82, stylesheets: 4 };',
  },
  'fixture:foundation/typography/weights': {
    title: 'Supported weights',
    weights: [
      { value: 400, label: 'Regular 400' },
      { value: 500, label: 'Medium 500' },
      { value: 600, label: 'Semibold 600' },
      { value: 700, label: 'Bold 700' },
    ],
  },
  'fixture:foundation/light-theme/tokens': {
    title: 'Light semantic tokens',
    description: 'One public --beras-* contract shared by package and consumers.',
  },
  'fixture:foundation/light-theme/status': {
    title: 'Status tones',
    tones: ['success', 'warning', 'danger', 'info', 'neutral'],
  },
  'fixture:foundation/light-theme/data-visualization': {
    title: 'Ordered data colors',
    series: [
      { token: '--beras-data-1', label: 'Series 1', marker: 'Circle' },
      { token: '--beras-data-2', label: 'Series 2', marker: 'Square' },
      { token: '--beras-data-3', label: 'Series 3', marker: 'Triangle' },
      { token: '--beras-data-4', label: 'Series 4', marker: 'Diamond' },
      { token: '--beras-data-5', label: 'Series 5', marker: 'Cross' },
      { token: '--beras-data-6', label: 'Series 6', marker: 'Ring' },
      { token: '--beras-data-7', label: 'Series 7', marker: 'Dash' },
      { token: '--beras-data-8', label: 'Series 8', marker: 'Star' },
    ],
  },
  'fixture:foundation/light-theme/contrast': {
    title: 'WCAG AA contrast corrections',
    pairs: [
      { label: 'Default text / surface', ratio: '16.35:1', minimum: '4.5:1' },
      { label: 'Muted text / surface', ratio: '7.58:1', minimum: '4.5:1' },
      { label: 'Brand / surface', ratio: '5.57:1', minimum: '4.5:1' },
      { label: 'Focus / surface', ratio: '6.64:1', minimum: '3:1' },
      { label: 'Success text / background', ratio: '5.21:1', minimum: '4.5:1' },
      { label: 'Warning text / background', ratio: '6.84:1', minimum: '4.5:1' },
      { label: 'Danger text / background', ratio: '5.91:1', minimum: '4.5:1' },
      { label: 'Info text / background', ratio: '6.16:1', minimum: '4.5:1' },
      { label: 'Neutral text / background', ratio: '6.92:1', minimum: '4.5:1' },
    ],
    note: 'Muted, brand, and focus values intentionally darken their Tere light anchors; data colors retain visible labels and marker names.',
  },
});
