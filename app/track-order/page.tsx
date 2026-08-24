'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, FileText, MapPin, Package, Phone } from 'lucide-react';

interface TrackResult {
  awb: string;
  headline: string;
  status: string;
  currentStep: number;
  estimatedDelivery: { date: string; time: string } | null;
  steps: { label: string; time: string }[];
  orderId: string;
  orderDate: string;
  totalPaid: string;
  paymentStatus: string;
  product: {
    name: string;
    sachets: string;
    price: string;
    quantity: number;
    image: string;
    invoiceUrl: string;
  };
  deliveryAddress: string;
  contact: { name: string; mobile: string; email: string };
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="tr" />}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('order_id') || searchParams.get('orderId') || searchParams.get('awb') || '';
  const [orderId, setOrderId] = useState(prefill);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState('');
  const [retryable, setRetryable] = useState(false);

  useEffect(() => {
    if (prefill) setOrderId(prefill);
  }, [prefill]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');
    setRetryable(false);
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awb: orderId.trim(), order_id: orderId.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(
          data.error ||
            (res.status >= 500
              ? 'Tracking is temporarily unavailable. Please try again in a moment.'
              : 'We could not find a shipment for that Order ID / AWB number.')
        );
        setRetryable(Boolean(data.retryable) || res.status >= 500);
      } else {
        setResult(data);
      }
    } catch {
      setError('Tracking is temporarily unavailable. Please try again in a moment.');
      setRetryable(true);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="tr">
        <section className="tr-status">
          <div className="tr-status__card">
            <div className="tr-status__top">
              <div className="tr-status__headline">
                <span className="tr-status__icon" aria-hidden="true">
                  <Package size={28} strokeWidth={1.8} />
                </span>
                <h1>{result.headline}</h1>
              </div>
              {result.estimatedDelivery && (
                <div className="tr-status__eta">
                  <span>Estimated delivery</span>
                  <strong>{result.estimatedDelivery.date}</strong>
                  {result.estimatedDelivery.time && <small>{result.estimatedDelivery.time}</small>}
                </div>
              )}
            </div>

            <ol className="tr-stepper">
              {result.steps.map((step, index) => {
                const state =
                  index < result.currentStep ? 'done' : index === result.currentStep ? 'current' : 'todo';
                return (
                  <li key={step.label} className={`tr-step tr-step--${state}`}>
                    <div className="tr-step__rail" aria-hidden="true" />
                    <span className="tr-step__dot">
                      {state === 'done' ? <Check size={12} strokeWidth={3} /> : null}
                    </span>
                    <span className="tr-step__label">{step.label}</span>
                    <span className="tr-step__time">{step.time}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="tr-body">
          <h2 className="tr-heading">Order Summary</h2>
          <div className="tr-summary">
            <div>
              <span>Order Id</span>
              <strong>#{result.orderId.replace(/^#/, '')}</strong>
            </div>
            <div>
              <span>Order Date</span>
              <strong>{result.orderDate}</strong>
            </div>
            <div>
              <span>Total Paid</span>
              <strong>{result.totalPaid}</strong>
            </div>
            <div>
              <span>Payment Status</span>
              <strong>{result.paymentStatus}</strong>
            </div>
          </div>

          <div className="tr-product">
            <img src={result.product.image} alt={result.product.name} />
            <div className="tr-product__info">
              <div className="tr-product__top">
                <div>
                  <h3>{result.product.name}</h3>
                  <p>{result.product.sachets}</p>
                </div>
                {result.product.invoiceUrl ? (
                  <a className="tr-invoice" href={result.product.invoiceUrl} target="_blank" rel="noreferrer">
                    <FileText size={18} />
                    View Invoice
                  </a>
                ) : (
                  <span className="tr-invoice tr-invoice--muted">
                    <FileText size={18} />
                    View Invoice
                  </span>
                )}
              </div>
              <div className="tr-product__meta">
                <strong>{result.product.price}</strong>
                <span>x{result.product.quantity}</span>
              </div>
            </div>
          </div>

          <div className="tr-details">
            <article>
              <h3>
                <MapPin size={22} />
                Delivery Details
              </h3>
              <p>{result.deliveryAddress}</p>
            </article>
            <article>
              <h3>
                <Phone size={20} />
                Contact Details
              </h3>
              <p>Name : {result.contact.name}</p>
              <p>Mobile : {result.contact.mobile}</p>
              <p>Email : {result.contact.email}</p>
            </article>
          </div>

          <p className="tr-help">
            Need Help? <Link href="/contact">Contact Us</Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="tr">
      <section className="tr-hero">
        <h1 className="tr-hero__title">
          <img src="/figma-home/tea-glass.png" alt="" />
          Where&apos;s Your Chai?
          <img src="/figma-home/tea-glass.png" alt="" />
        </h1>

        <form className="tr-card" onSubmit={handleTrack}>
          <p>Enter your order ID to check delivery status</p>
          <div className="tr-card__row">
            <label className="sr-only" htmlFor="track-awb">
              Enter Order ID
            </label>
            <input
              id="track-awb"
              type="text"
              placeholder="Enter Order ID*"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              autoComplete="off"
            />
            <button type="submit" className="hp-btn" disabled={loading}>
              {loading ? 'TRACKING...' : 'TRACK ORDER'}
            </button>
          </div>
          {error && (
            <div className="tr-error" role="alert">
              <p>{error}</p>
              {retryable && (
                <button type="submit" className="tr-error__retry">
                  Retry
                </button>
              )}
            </div>
          )}
        </form>
      </section>

      <section className="hp-cta">
        <div>
          <h2 className="hp-heading hp-heading--left">The Taste That Takes You Home</h2>
          <p>
            From busy mornings to quiet evenings, enjoy the authentic taste of home without the wait. One pouch, two
            perfect cups, countless comforting moments.
          </p>
        </div>
        <div className="hp-cta__actions">
          <Link href="/product" className="hp-btn">
            SHOP NOW
          </Link>
          <Link href="/contact" className="hp-btn hp-btn--ghost">
            CONTACT
          </Link>
        </div>
      </section>
    </div>
  );
}
