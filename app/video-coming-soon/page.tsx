import Link from 'next/link';

export const metadata = {
  title: 'Video Coming Soon — 300ml Tea',
  description: 'Video coming soon. Visit our homepage for more.',
};

export default function VideoComingSoonPage() {
  return (
    <main className="vcs">
      <div className="vcs__card">
        <span className="vcs__brand">300ml TEA</span>
        <h1 className="vcs__title">Video coming soon</h1>
        <p className="vcs__copy">
          We&apos;re brewing something special. Check back shortly.
        </p>
        <Link href="/" className="vcs__link">
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
