import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          borderRadius: 7,
          position: 'relative',
        }}
      >
        {/* Accent bar — top of T */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 6,
            width: 20,
            height: 4,
            background: '#C21518',
            borderRadius: 1.5,
          }}
        />
        {/* Stem of T */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 14,
            width: 4,
            height: 16,
            background: '#FF6B3A',
            borderRadius: 1.5,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
