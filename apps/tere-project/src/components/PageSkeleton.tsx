'use client';

import type { Theme } from '@src/hooks/useTheme';

export default function PageSkeleton({ theme }: { theme: Theme }) {
  const isVoid = theme === 'void' || theme === 'crimson';
  const shimBg = isVoid ? 'rgba(255,255,255,0.05)' : '#ebedf5';
  const shimHi = isVoid ? 'rgba(255,255,255,0.10)' : '#f5f6fb';
  const cardBg = isVoid ? '#101e32' : '#fff';
  const cardBrd = isVoid ? 'rgba(255,255,255,0.06)' : '#ebedf5';

  const Skel = ({ w, h, r = 10, mb = 0 }: { w: string; h: string; r?: number; mb?: number }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background: shimBg,
        marginBottom: mb,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, transparent 0%, ${shimHi} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'skelShim 1.2s ease-in-out infinite',
        }}
      />
    </div>
  );

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skel w="240px" h="28px" r={8} />
        <Skel w="340px" h="16px" r={6} />
      </div>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              background: cardBg,
              borderRadius: 14,
              padding: 18,
              border: `1px solid ${cardBrd}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Skel w="80px" h="12px" r={4} />
            <Skel w="100px" h="34px" r={6} />
            <Skel w="60px" h="12px" r={4} />
          </div>
        ))}
      </div>
      {/* Two-col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[0, 1].map(i => (
          <div
            key={i}
            style={{
              background: cardBg,
              borderRadius: 14,
              padding: 18,
              border: `1px solid ${cardBrd}`,
            }}
          >
            <Skel w="160px" h="16px" r={6} mb={14} />
            {[0, 1, 2, 3, 4].map(j => (
              <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                <Skel w="80px" h="14px" r={4} />
                <div style={{ flex: 1 }}>
                  <Skel w="100%" h="16px" r={4} />
                </div>
                <Skel w="40px" h="14px" r={4} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Table */}
      <div
        style={{
          background: cardBg,
          borderRadius: 14,
          border: `1px solid ${cardBrd}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${cardBrd}` }}>
          <Skel w="140px" h="16px" r={6} />
        </div>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              padding: '12px 18px',
              borderBottom: `1px solid ${cardBrd}`,
              alignItems: 'center',
            }}
          >
            <Skel w="130px" h="14px" r={4} />
            <Skel w="40px" h="20px" r={20} />
            <Skel w="60px" h="14px" r={4} />
            <Skel w="60px" h="14px" r={4} />
            <Skel w="70px" h="24px" r={20} />
          </div>
        ))}
      </div>
      <style>{`@keyframes skelShim{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}
