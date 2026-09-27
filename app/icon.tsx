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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          borderRadius: 8,
          border: '1px solid #27272a',
          position: 'relative',
        }}
      >
        {/* PDF Document Layer */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 12,
            height: 14,
            borderRadius: 2,
            background: '#f43f5e',
            opacity: 0.85,
          }}
        />
        {/* Image/Media Primary Layer */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            width: 17,
            height: 19,
            borderRadius: 3,
            background: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          P
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
