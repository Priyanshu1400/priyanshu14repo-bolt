import Link from 'next/link';
import { POLICY_NAV, cmsToHtml, type PolicyDoc } from '@/lib/policy-content';

type PolicyPageProps = {
  doc: PolicyDoc;
  cmsContent?: string;
};

export default function PolicyPage({ doc, cmsContent }: PolicyPageProps) {
  const cms = cmsContent?.trim() ?? '';

  return (
    <div className="pp">
      <div className="pp-inner">
        <article className="pp-main">
          <p className="pp-kicker">Policies</p>
          <h1 className="pp-title">{doc.title}</h1>
          {!cms && (
            <>
              <p className="pp-updated">Last updated: {doc.updated}</p>
              <p className="pp-intro">{doc.intro}</p>
            </>
          )}

          {cms ? (
            <div
              className="pp-body"
              dangerouslySetInnerHTML={{ __html: cmsToHtml(cms) }}
            />
          ) : (
            <div className="pp-body">
              {doc.sections.map((section) => (
                <section key={section.heading} className="pp-section">
                  <h2>{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul>
                      {section.bullets.map((item) => (
                        <li key={item}>
                          <img src="/figma-home/bullet.svg" alt="" width={16} height={16} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}

          <p className="pp-help">
            Need help with an order?{' '}
            <Link href="/contact">Contact us</Link>
            {' · '}
            <Link href="/track-order">Track my order</Link>
          </p>
        </article>

        <aside className="pp-nav" aria-label="Policies">
          <h2>POLICIES</h2>
          <ul>
            {POLICY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={item.href === doc.path ? 'pp-nav__link pp-nav__link--active' : 'pp-nav__link'}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
