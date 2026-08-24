'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';
import FAQSection from '@/components/FAQSection';
import { useCart, TEA_PRODUCT } from '@/components/CartContext';
import { useToast } from '@/components/ToastContext';

const FEATURES = ['Zero Guesswork', 'Same Taste Every Time', 'One Sachet. Two Cups.'];

const SCIENCE = [
  '300ml is the ideal chai cup size enough to satisfy, not too much to waste.',
  'Precise tea-to-milk ratio ensures strong flavour without bitterness.',
  'Pre-measured sugar hits the sweet spot neither too much nor too little.',
  'Authentic Adrak & Elaichi masala for deep, real flavour in every sip.',
  'Total brew time of 5 minutes 30 seconds is optimal for full flavour extraction and rich colour and aroma.',
];

const REVIEWS = [
  { name: 'John D.', stars: 4, quote: `"I've been consistently impressed with the quality of service provided by this website. They have exceeded my expectations and delivered exceptional results. Highly recommended!"` },
  { name: 'Ava A.', stars: 3, quote: `"I've been consistently impressed with the quality of service provided by this website. They have exceeded my expectations and delivered exceptional results. Highly recommended!"` },
  { name: 'James D.', stars: 4, quote: `"I've been consistently impressed with the quality of service provided by this website. They have exceeded my expectations and delivered exceptional results. Highly recommended!"` },
];

const INGREDIENTS = ['Premium Tea', 'Natural Sugar', 'Adrak Masala', 'Elaichi Masala'];

export default function HomePage() {
  const { addItem, updateQuantity, items, openDrawer } = useCart();
  const { showToast } = useToast();
  const cartQty = items.find((item) => item.id === TEA_PRODUCT.id)?.quantity ?? 0;
  const [draftQty, setDraftQty] = useState(1);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const enableSound = async () => {
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
        setMuted(false);
        return true;
      } catch {
        video.muted = true;
        setMuted(true);
        return false;
      }
    };

    const unlock = () => {
      void enableSound().then((enabled) => {
        if (enabled) {
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
        }
      });
    };

    video.muted = true;
    void video.play().catch(() => undefined);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) {
        video.volume = 1;
        video.play().catch(() => {
          video.muted = true;
          setMuted(true);
        });
      }
    }
  };

  useEffect(() => {
    setDraftQty(cartQty > 0 ? cartQty : 1);
  }, [cartQty]);

  const qty = cartQty > 0 ? cartQty : draftQty;

  const changeQty = (next: number) => {
    const nextQty = Math.max(1, Math.min(10, next));
    if (cartQty > 0) updateQuantity(TEA_PRODUCT.id, nextQty);
    else setDraftQty(nextQty);
  };

  const shopNow = () => {
    addItem(TEA_PRODUCT, 1);
    openDrawer();
    showToast('Added to cart!');
  };

  const addToCart = () => {
    if (cartQty === 0) addItem(TEA_PRODUCT, draftQty);
    openDrawer();
    showToast('Added to cart!');
  };

  const visibleReviews = [0, 1, 2].map((offset) => REVIEWS[(reviewIndex + offset) % REVIEWS.length]);

  return (
    <div className="hp">
      <section className="hp-hero">
        <div className="hp-hero__copy">
          <h1 className="hp-hero__title">The Chai You&apos;d Call Home For</h1>
          <p className="hp-hero__desc">Tea powder, sugar &amp; chai masala — pre-measured and ready to brew. Not instant. Not premix. Just the real thing, in 5 minutes 30 seconds.</p>
          <button type="button" className="hp-btn" onClick={shopNow}>SHOP NOW</button>
        </div>
        <div className="hp-hero__visual">
          <video
            ref={videoRef}
            className="hp-hero__photo"
            src="https://zqzuhdbjqutobutespzj.supabase.co/storage/v1/object/public/site-assets/momchaimaking.mp4"
            autoPlay
            loop
            muted={muted}
            playsInline
            aria-label="Making chai at home"
          />
          <button
            type="button"
            className="hp-hero__mute"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute song' : 'Mute song'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <img src="/figma-home/sticker-2.png" alt="" className="hp-hero__sticker hp-hero__sticker--top" />
          <img src="/figma-home/sticker-1.png" alt="" className="hp-hero__sticker hp-hero__sticker--mid" />
        </div>
        <div className="hp-wave" aria-hidden="true">
          <svg
            className="hp-wave__svg"
            viewBox="0 0 1928 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              id="hpRibbonPath"
              d="M17.0082 178.818C64.2863 210.58 141.37 269.499 227.19 269.499C405.292 269.499 447.136 137.851 605.415 142.454C763.694 147.057 827.658 257.531 941.501 257.531C1140.38 257.531 1188.68 35.2016 1411.2 30.5985C1633.71 25.9954 1728.27 183.422 1922.01 142.454"
              stroke="#00A59F"
              strokeWidth="72"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              fill="#ffffff"
              fontSize="28"
              fontFamily="'Dela Gothic One', sans-serif"
              letterSpacing="0.6"
            >
              <textPath href="#hpRibbonPath" startOffset="0%" method="align">
                <tspan dy="10">Comfort of Mom in a cup. Comfort of Mom in a cup. Comfort of Mom in a cup. Comfort of Mom in a cup.</tspan>
              </textPath>
            </text>
          </svg>
        </div>
      </section>

      <section className="hp-features">
        {FEATURES.map((label) => (
          <div className="hp-feature" key={label}>
            <img src="/figma-home/feature-circle.svg" alt="" className="hp-feature__ring" />
            <p>{label}</p>
          </div>
        ))}
      </section>

      <section className="hp-shop" id="shop">
        <h2 className="hp-heading">Shop Our Tea Mix</h2>
        <div className="hp-shop__panel">
          <div className="hp-shop__photo">
            <img src="/figma-home/shop-pour.png" alt="Chai being poured" />
            <img src="/figma-home/stamp.png" alt="" className="hp-shop__stamp" />
            <img src="/figma-home/kettle.png" alt="" className="hp-shop__kettle hp-shop__kettle--mid" />
            <img src="/figma-home/kettle.png" alt="" className="hp-shop__kettle hp-shop__kettle--low" />
            <span className="hp-shop__brand">300ml TEA</span>
          </div>
          <div className="hp-shop__card">
            <img src="/figma-home/product-box.png" alt="300ml Tea — Adrak & Elaichi" className="hp-shop__box" />
            <h3>300ml Tea — Adrak &amp; Elaichi <span>(10 sachets)</span></h3>
            <div className="hp-shop__row">
              <div className="hp-shop__price">
                <strong>Rs. 160</strong>
                <s>Rs. 250</s>
              </div>
              <div className="hp-qty">
                <span>Qty :</span>
                <div className="hp-qty__control">
                  <button type="button" aria-label="Decrease quantity" onClick={() => changeQty(qty - 1)}>
                    <img src="/figma-home/icon-minus.svg" alt="" width={20} height={20} />
                  </button>
                  <span>{qty}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => changeQty(qty + 1)}>
                    <img src="/figma-home/icon-add.svg" alt="" width={20} height={20} />
                  </button>
                </div>
              </div>
            </div>
            <button type="button" className="hp-btn hp-btn--full" onClick={addToCart}>ADD TO CART</button>
          </div>
        </div>
      </section>

      <section className="hp-soon">
        <div className="hp-soon__banner">
          <h2 className="hp-heading">More Flavours coming soon ...</h2>
        </div>
        <div className="hp-soon__first">
          <img src="/figma-home/glass-kettle.png" alt="" className="hp-soon__icon hp-soon__icon--kettle" />
          <img src="/figma-home/tea-glass.png" alt="" className="hp-soon__icon hp-soon__icon--glass" />
          <p className="hp-soon__sub">But First,</p>
          <img src="/figma-home/tea-glass.png" alt="" className="hp-soon__icon hp-soon__icon--glass" />
          <img src="/figma-home/glass-kettle.png" alt="" className="hp-soon__icon hp-soon__icon--kettle hp-soon__icon--flip" />
        </div>
      </section>

      <section className="hp-what">
        <h2>What is 300ml TEA?</h2>
        <p>300ml Tea is a pre-measured raw chai blend — not instant, not premix. Each sachet contains the exact amount of tea powder, sugar, and chai masala (Adrak &amp; Elaichi) needed to brew one perfect 300ml cup.</p>
        <p>Just pour 300ml of milk into a pan and heat it on high flame. After 1 minute, tear open your sachet and pour all contents into the hot milk. Stir continuously on high flame for 4 minutes 30 seconds, strain into your cup and serve hot.</p>
        <p>No measuring. No guesswork. Just real chai — the way it was always meant to be.</p>
      </section>

      <section className="hp-science">
        <div className="hp-science__photo">
          <img src="/figma-home/tape.png" alt="" className="hp-science__tape" />
          <img src="/figma-home/science.jpg" alt="Chai poured into glasses" className="hp-science__img" />
        </div>
        <div>
          <h2 className="hp-heading hp-heading--left">The Science Behind the<br />Perfect Cup</h2>
          <ul>
            {SCIENCE.map((item) => (
              <li key={item}>
                <img src="/figma-home/bullet.svg" alt="" width={16} height={16} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hp-made">
        <div className="hp-made__copy">
          <h2 className="hp-heading hp-heading--left">How It’s Made</h2>
          <h3>Crafted with Care</h3>
          <p>Every sachet is carefully blended with premium tea powder, the right amount of natural sugar, and our signature Adrak &amp; Elaichi masala. Sourced from the finest ingredients and sealed fresh in hygienic sachets.</p>
          <div className="hp-made__tags">
            {INGREDIENTS.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
        <img src="/figma-home/plantation.jpg" alt="Tea plantation" className="hp-made__photo" />
      </section>

      <section className="hp-brew">
        <h2 className="hp-heading">Watch How to Brew</h2>
        <div className="hp-brew__frame">
          <img src="/figma-home/brew.jpg" alt="A cup of chai and a biscuit" />
          <span className="hp-brew__play" aria-hidden="true">▶</span>
        </div>
        <p>See how easy it is to make the perfect cup of chai with 300ml Tea.</p>
      </section>

      <section className="hp-reviews">
        <h2 className="hp-heading">What People Say About Us</h2>
        <div className="hp-reviews__band">
          <button type="button" className="hp-reviews__nav" aria-label="Previous review" onClick={() => setReviewIndex((value) => (value + REVIEWS.length - 1) % REVIEWS.length)}>
            <img src="/figma-home/arrow-circle.svg" alt="" />
          </button>
          <div className="hp-reviews__grid">
            {visibleReviews.map((review) => (
              <article className="hp-review" key={`${review.name}-${reviewIndex}`}>
                <div className="hp-review__stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <img key={i} src={i < review.stars ? '/figma-home/star-empty.svg' : '/figma-home/star-empty.svg'} alt="" width={24} height={24} className={i < review.stars ? 'hp-review__star' : 'hp-review__star hp-review__star--empty'} />
                  ))}
                </div>
                <p>{review.quote}</p>
                <strong>{review.name}</strong>
              </article>
            ))}
          </div>
          <button type="button" className="hp-reviews__nav hp-reviews__nav--next" aria-label="Next review" onClick={() => setReviewIndex((value) => (value + 1) % REVIEWS.length)}>
            <img src="/figma-home/arrow-circle.svg" alt="" />
          </button>
        </div>
      </section>

      <section className="hp-cta">
        <div>
          <h2 className="hp-heading hp-heading--left">The Taste That Takes You Home</h2>
          <p>From busy mornings to quiet evenings, enjoy the authentic taste of home without the wait. One pouch, two perfect cups, countless comforting moments.</p>
        </div>
        <div className="hp-cta__actions">
          <button type="button" className="hp-btn" onClick={shopNow}>SHOP NOW</button>
          <Link href="/contact" className="hp-btn hp-btn--ghost">Contact</Link>
        </div>
      </section>

      <section className="hp-faq" id="faq">
        <div className="hp-faq__inner">
          <h2>Know Before You Sip</h2>
          <FAQSection />
        </div>
      </section>
    </div>
  );
}
