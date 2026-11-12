import { ImageResponse } from 'next/og';

// Icon used when someone adds the site to their phone's home screen (iPhone needs a PNG)
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#1a3c34' }}>
        <svg width="180" height="180" viewBox="0 0 40 40">
          <circle cx="28" cy="13" r="4.5" fill="#e07a5f" />
          <path d="M9 30V20.5L18 13l9 7.5V30z" fill="#f5f1e8" />
          <rect x="15.5" y="23" width="5" height="7" rx="1" fill="#1a3c34" />
        </svg>
      </div>
    ),
    size
  );
}
