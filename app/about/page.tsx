'use client';

import Link from 'next/link';
import { useCart, TEA_PRODUCT } from '@/components/CartContext';
import { useToast } from '@/components/ToastContext';

const STEPS = [
  'Pour 300ml of milk into a pan and heat on high flame.',
  'After 1 minute, tear open one sachet and pour contents into the hot milk.',
  'Stir continuously for 4 minutes 30 seconds.',
  'Strain. Serve. That is it. No measuring. No guesswork. No compromise.',
];

export default function AboutPage() {
  const { addItem, openDrawer } = useCart();
  const { showToast } = useToast();

  return (
    <div className="os">
      <div className="os-inner">
        <h1 className="os-title">Our Story</h1>
        <div className="os-prose">
          <p>
            <strong>300ml Tea</strong> was born from a simple, powerful emotion: the longing for <strong>maa ki chai</strong> when you are far from home.
          </p>
          <p>
            We are a team of chai lovers who noticed something — when people move away from home for work, studies, or life, they miss the small things most. The taste of maa&apos;s chai, perfectly brewed every single time, with just the right amount of everything.
          </p>
        </div>
        <img src="/figma-story/maa-chini.jpg" alt="Maa, chini kitni daalu? — 1 teaspoon beta." className="os-photo" />

        <h2 className="os-heading">The Problem We Solve</h2>
        <p className="os-body">
          Making good chai is hard. You need to measure tea, sugar, and masala perfectly. Too much tea and it is bitter. Too much sugar and it is cloying. Too little masala and it is bland. For migrants, bachelors, and busy families, this guesswork ruins the chai experience.
        </p>

        <h2 className="os-heading">Our Solution</h2>
        <p className="os-body">
          <strong>300ml Tea</strong> is a pre-measured raw chai blend. Each packet contains exactly the right amount of premium tea powder, natural sugar, and our signature Adrak &amp; Elaichi masala — all perfectly calibrated for one 300ml cup of chai.
        </p>
        <p className="os-body">
          It is NOT instant tea. It is NOT a premix. You pour 300ml of milk, add the sachet contents, stir on high flame for 5 minutes 30 seconds, and strain. The result is authentic, freshly brewed chai — the kind that reminds you of home.
        </p>

        <h2 className="os-heading">How It Works</h2>
        <ul className="os-steps">
          {STEPS.map((step) => (
            <li key={step}>
              <img src="/figma-home/bullet.svg" alt="" width={16} height={16} />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <section className="os-promise">
        <div className="os-promise__circle">
          <h2>Our Promise</h2>
          <p>
            Every ingredient is carefully sourced. No preservatives. No artificial flavours. Just real chai, the way it should be. We are building a brand that respects the emotion behind every cup of chai.
          </p>
        </div>
      </section>

      <section className="hp-cta os-cta">
        <div>
          <h2 className="hp-heading hp-heading--left">The Taste That Takes You Home</h2>
          <p>From busy mornings to quiet evenings, enjoy the authentic taste of home without the wait. One pouch, two perfect cups, countless comforting moments.</p>
        </div>
        <div className="hp-cta__actions">
          <button
            type="button"
            className="hp-btn"
            onClick={() => {
              addItem(TEA_PRODUCT);
              openDrawer();
              showToast('Added to cart!');
            }}
          >
            SHOP NOW
          </button>
          <Link href="/contact" className="hp-btn hp-btn--ghost">CONTACT</Link>
        </div>
      </section>
    </div>
  );
}
