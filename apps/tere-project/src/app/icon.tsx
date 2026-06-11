import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// TERE favicon — mirrors the wordmark logo in the sign-in page top-left:
// 3 ascending white bars on a cyan brand gradient with rounded corners.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 2,
          padding: '7px 5px',
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, #1282a2, #22b8d4)',
          borderRadius: 7,
        }}
      >
        <div style={{ width: 6, height: '50%', background: 'white', borderRadius: 1.5 }} />
        <div style={{ width: 6, height: '72%', background: 'rgba(255,255,255,0.85)', borderRadius: 1.5 }} />
        <div style={{ width: 6, height: '95%', background: 'rgba(255,255,255,0.7)', borderRadius: 1.5 }} />
      </div>
    ),
    { ...size },
  );
}
