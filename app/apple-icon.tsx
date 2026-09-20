import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 40,
          fontWeight: 900,
          border: '2px solid #27272a',
          position: 'relative',
        }}
      >
        <span style={{ marginLeft: -8 }}>P</span>
        <div
          style={{
            position: 'absolute',
            top: 25,
            right: 25,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#6366f1',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
