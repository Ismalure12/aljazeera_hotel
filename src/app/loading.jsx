export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f6f7f6',
      backgroundImage: 'linear-gradient(180deg,#ffffff,#f6f7f6 40%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        color: '#1f7a2a',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jazeera-icon.png"
          alt="Hotel Jazeera"
          width={56}
          height={56}
          style={{ display: 'block' }}
        />
        <div style={{
          fontSize: 11, letterSpacing: '.32em', textTransform: 'uppercase',
          color: '#8a8c9e', fontFamily: 'var(--font-inter), sans-serif',
          fontWeight: 600,
        }}>
          Hotel Jazeera · setting the table…
        </div>
      </div>
    </div>
  );
}
