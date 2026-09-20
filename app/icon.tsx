import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 18,
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: 8,
          fontWeight: 900,
          border: '1px solid #27272a',
          position: 'relative',
        }}
      >
        <span style={{ marginLeft: -2 }}>P</span>
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 5,
            height: 5,
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
