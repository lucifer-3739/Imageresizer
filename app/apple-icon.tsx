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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          borderRadius: 40,
          border: '2px solid #27272a',
          position: 'relative',
        }}
      >
        {/* PDF Document Layer */}
        <div
          style={{
            position: 'absolute',
            top: 25,
            right: 25,
            width: 70,
            height: 85,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #f43f5e, #fb7185)',
            opacity: 0.85,
          }}
        />
        {/* Image/Media Primary Layer */}
        <div
          style={{
            position: 'absolute',
            bottom: 25,
            left: 25,
            width: 95,
            height: 110,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: 75,
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
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
