import Link from 'next/link';

export default function VideoComingSoon() {
  return (
    <main className="vcs">
      <div className="vcs__card">
        <span className="vcs__brand">300ml TEA</span>
        <h1 className="vcs__title">Video coming soon…</h1>
        <p className="vcs__copy">Stay tuned.</p>
        <Link href="/" className="vcs__link">
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
