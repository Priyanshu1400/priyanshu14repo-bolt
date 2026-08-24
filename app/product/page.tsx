'use client';

import { useEffect, useState } from 'react';
import FAQSection from '@/components/FAQSection';
import { useCart, TEA_PRODUCT } from '@/components/CartContext';

const GALLERY = [
  '/figma-shop/gallery-main.png',
  '/figma-shop/thumb-2.png',
  '/figma-shop/thumb-3.png',
  '/figma-shop/thumb-4.png',
];

const FEATURES = [
  { icon: '/figma-shop/icon-clock.svg', label: 'Brews in 5½ mins' },
  { icon: '/figma-shop/icon-leaf.svg', label: 'Premium Tea Blend' },
  { icon: '/figma-shop/icon-no-entry.svg', label: 'Nothing Artificial' },
  { icon: '/figma-shop/icon-masala.svg', label: 'Authentic Adrak & Elaichi masala' },
  { icon: '/figma-shop/icon-cups.svg', label: '1 Sachet = 2 Cup' },
  { icon: '/figma-shop/icon-pack.svg', label: '10 Sachets in one pack' },
];

const REVIEWS = [
  { name: 'Full name', stars: 4, quote: 'Review description...' },
  { name: 'Full name', stars: 4, quote: 'Review description...' },
  { name: 'Full name', stars: 4, quote: 'Review description...' },
  { name: 'Full name', stars: 4, quote: 'Review description...' },
];

export default function ProductPage() {
  const { addItem, updateQuantity, items, openDrawer } = useCart();
  const cartQty = items.find((item) => item.id === TEA_PRODUCT.id)?.quantity ?? 0;
  const [draftQty, setDraftQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    setDraftQty(cartQty > 0 ? cartQty : 1);
  }, [cartQty]);

  const quantity = cartQty > 0 ? cartQty : draftQty;

  const changeQty = (next: number) => {
    const nextQty = Math.max(1, Math.min(10, next));
    if (cartQty > 0) updateQuantity(TEA_PRODUCT.id, nextQty);
    else setDraftQty(nextQty);
  };

  const handleAdd = () => {
    if (cartQty === 0) addItem(TEA_PRODUCT, draftQty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const visibleReviews = [0, 1, 2, 3].map((offset) => REVIEWS[(reviewIndex + offset) % REVIEWS.length]);

  return (
    <div className="sp">
      <section className="sp-hero">
        <div className="sp-gallery">
          <div className="sp-gallery__main">
            <img src={GALLERY[galleryIndex]} alt="300ml Tea — Adrak & Elaichi" />
            <button
              type="button"
              className="sp-gallery__arrow sp-gallery__arrow--prev"
              aria-label="Previous image"
              onClick={() => setGalleryIndex((value) => (value + GALLERY.length - 1) % GALLERY.length)}
            >
              <img src="/figma-shop/icon-chevron.svg" alt="" width={30} height={30} />
            </button>
            <button
              type="button"
              className="sp-gallery__arrow sp-gallery__arrow--next"
              aria-label="Next image"
              onClick={() => setGalleryIndex((value) => (value + 1) % GALLERY.length)}
            >
              <img src="/figma-shop/icon-chevron.svg" alt="" width={30} height={30} />
            </button>
            <div className="sp-gallery__dots">
              {GALLERY.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  className={`sp-gallery__dot${index === galleryIndex ? ' sp-gallery__dot--active' : ''}`}
                  aria-label={`Show image ${index + 1}`}
                  onClick={() => setGalleryIndex(index)}
                />
              ))}
            </div>
          </div>
          <div className="sp-gallery__thumbs">
            {GALLERY.map((src, index) => (
              <button
                key={src}
                type="button"
                className={`sp-gallery__thumb${index === galleryIndex ? ' sp-gallery__thumb--active' : ''}`}
                onClick={() => setGalleryIndex(index)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="sp-info">
          <p className="sp-info__eyebrow">Premium Raw Chai Blend</p>
          <h1 className="sp-info__title">300ml Tea — Adrak &amp; Elaichi</h1>
          <div className="sp-info__rating">
            <span className="sp-info__stars">
              {[0, 1, 2, 3, 4].map((star) => (
                <img
                  key={star}
                  src={star < 4 ? '/figma-shop/star-on.svg' : '/figma-shop/star-off.svg'}
                  alt=""
                  width={18}
                  height={18}
                />
              ))}
            </span>
            <span>4 ( 6  Reviews )</span>
          </div>
          <p className="sp-info__desc">
            Pre-measured raw chai blend with tea powder, sugar, and our signature Adrak &amp; Elaichi masala. NOT instant — just pour 300ml milk, add sachet, stir for 5 minutes 30 seconds, strain, and enjoy maa ke hath ki chai. 10 Sachets included in this pack.
          </p>

          <div className="sp-features">
            {FEATURES.map((feature) => (
              <div className="sp-feature" key={feature.label}>
                <span className="sp-feature__icon">
                  <img src={feature.icon} alt="" />
                </span>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="sp-buy">
            <div className="sp-price">
              <strong>₹{TEA_PRODUCT.price}</strong>
              <s>₹{TEA_PRODUCT.originalPrice}</s>
            </div>
            <div className="hp-qty">
              <span>Qty :</span>
              <div className="hp-qty__control">
                <button type="button" aria-label="Decrease quantity" onClick={() => changeQty(quantity - 1)}>
                    <img src="/figma-shop/icon-minus.svg" alt="" width={20} height={20} />
                  </button>
                  <span>{quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => changeQty(quantity + 1)}>
                  <img src="/figma-shop/icon-add.svg" alt="" width={20} height={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="sp-actions">
            <button
              type="button"
              className="hp-btn sp-btn"
              onClick={() => {
                handleAdd();
                openDrawer();
              }}
            >
              BUY NOW
            </button>
            <button type="button" className="hp-btn hp-btn--ghost sp-btn" onClick={handleAdd}>
              {added ? 'Added' : 'Add to cart'}
            </button>
          </div>

          <p className="sp-ship">
            <img src="/figma-shop/icon-truck.svg" alt="" width={41} height={41} />
            Ships Within 24 hours
          </p>
        </div>
      </section>

      <section className="hp-brew">
        <h2 className="hp-heading">Watch How to Brew</h2>
        <div className="hp-brew__frame">
          <img src="/figma-shop/brew-export.png" alt="A cup of chai and a biscuit" />
          <span className="sp-play" aria-hidden="true">
            <img src="/figma-shop/play-bg.svg" alt="" className="sp-play__bg" />
            <img src="/figma-shop/play-fill.svg" alt="" className="sp-play__icon" />
          </span>
        </div>
        <p>See how easy it is to make the perfect cup of chai with 300ml Tea.</p>
      </section>

      <section className="sp-banner" aria-label="Product highlights">
        <img src="/figma-shop/banner-export.png" alt="Precision crafted chai — fresh, not leftover, perfect for two" />
      </section>

      <section className="sp-reviews">
        <h2 className="hp-heading">What People Say About Us</h2>
        <div className="sp-reviews__band">
          <button
            type="button"
            className="hp-reviews__nav"
            aria-label="Previous review"
            onClick={() => setReviewIndex((value) => (value + REVIEWS.length - 1) % REVIEWS.length)}
          >
            <img src="/figma-home/arrow-circle.svg" alt="" />
          </button>
          <div className="sp-reviews__grid">
            {visibleReviews.map((review, index) => (
              <article className="sp-review" key={`${review.name}-${reviewIndex}-${index}`}>
                <img src="/figma-shop/review.jpg" alt="" className="sp-review__photo" />
                <div className="sp-review__fade" />
                <span className="sp-play sp-play--sm" aria-hidden="true">
                  <img src="/figma-shop/play-bg.svg" alt="" className="sp-play__bg" />
                  <img src="/figma-shop/play-fill.svg" alt="" className="sp-play__icon" />
                </span>
                <div className="sp-review__meta">
                  <img src="/figma-shop/avatar.svg" alt="" width={50} height={50} />
                  <div>
                    <div className="sp-review__stars">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <img
                          key={star}
                          src={star < review.stars ? '/figma-shop/review-star.svg' : '/figma-shop/review-star-off.svg'}
                          alt=""
                          width={24}
                          height={24}
                        />
                      ))}
                    </div>
                    <strong>{review.name}</strong>
                    <p>{review.quote}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="hp-reviews__nav hp-reviews__nav--next"
            aria-label="Next review"
            onClick={() => setReviewIndex((value) => (value + 1) % REVIEWS.length)}
          >
            <img src="/figma-home/arrow-circle.svg" alt="" />
          </button>
        </div>
      </section>

      <section className="hp-faq sp-faq" id="faq">
        <div className="hp-faq__inner">
          <h2>Know Before You Sip</h2>
          <FAQSection />
        </div>
      </section>
    </div>
  );
}
