'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, MapPin, Phone } from 'lucide-react';

interface StoredOrder {
  order_id: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  payment_type?: string | null;
  total_amount?: number | string | null;
  status?: string | null;
  cart_data?: unknown;
  created_at?: string | null;
}

interface LineItem {
  name: string;
  sachets: string;
  price: string;
  quantity: number;
  image: string;
  invoiceUrl: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getDate()} ${date.toLocaleString('en-IN', { month: 'long' })}, ${date.getFullYear()}`;
}

function paymentLabel(raw?: string | null): string {
  const value = (raw || '').toLowerCase();
  if (!value) return '—';
  if (value.includes('cod') || value.includes('cash')) return 'Cash on Delivery';
  if (value.includes('paid') || value.includes('prepaid') || value.includes('online') || value.includes('success')) {
    return 'Paid';
  }
  return raw || '—';
}

function formatAddress(cartData: unknown): string {
  const cart = asRecord(cartData);
  const shipping =
    asRecord(cart?.shipping_address) ||
    asRecord(cart?.delivery_address) ||
    asRecord(cart?.address) ||
    asRecord(cart?.customer);
  if (shipping) {
    const parts = [
      asString(shipping.address || shipping.address_1 || shipping.line1 || shipping.street),
      asString(shipping.address_2 || shipping.line2),
      asString(shipping.city),
      asString(shipping.state),
      asString(shipping.pincode || shipping.zip),
      asString(shipping.country),
    ].filter(Boolean);
    if (parts.length) return parts.join('\n');
  }
  return 'Delivery details will appear here once the shipment is confirmed.';
}

function parseItems(cartData: unknown, fallbackTotal?: number | null): LineItem[] {
  const cart = asRecord(cartData);
  const rawItems = Array.isArray(cart?.items)
    ? cart?.items ?? []
    : Array.isArray(cartData)
      ? cartData
      : [];

  if (!rawItems.length) {
    const quantity = fallbackTotal && fallbackTotal >= 160 ? Math.max(1, Math.round(fallbackTotal / 160)) : 1;
    return [
      {
        name: '300ml Tea – Adrak & Elaichi',
        sachets: '(10 Sachets)',
        price: 'Rs. 160',
        quantity,
        image: '/figma-home/product-box.png',
        invoiceUrl: '',
      },
    ];
  }

  return rawItems.map((item) => {
    const rec = asRecord(item) || {};
    const quantity = asNumber(rec.quantity ?? rec.qty) ?? 1;
    const price = asNumber(rec.price ?? rec.unit_price) ?? 160;
    return {
      name: asString(rec.name || rec.product_name || rec.title) || '300ml Tea – Adrak & Elaichi',
      sachets: '(10 Sachets)',
      price: `Rs. ${price}`,
      quantity,
      image: asString(rec.image || rec.image_url) || '/figma-home/product-box.png',
      invoiceUrl: asString(rec.invoice_url || rec.invoice),
    };
  });
}

function contactName(cartData: unknown): string {
  const cart = asRecord(cartData);
  const customer = asRecord(cart?.customer) || cart;
  return asString(customer?.name || customer?.full_name || customer?.first_name) || '—';
}

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const queryOrderId =
    searchParams.get('order_id') ||
    searchParams.get('orderId') ||
    searchParams.get('awb') ||
    '';
  const queryPayment = searchParams.get('payment_type') || searchParams.get('paymentType') || '';
  const queryAmount =
    searchParams.get('total_amount_payable') ||
    searchParams.get('total') ||
    searchParams.get('amount') ||
    '';
  const queryStatus = searchParams.get('status') || '';
  const queryPhone = searchParams.get('phone') || '';
  const queryEmail = searchParams.get('email') || '';

  const [stored, setStored] = useState<StoredOrder | null>(null);

  useEffect(() => {
    if (!queryOrderId) return;
    let cancelled = false;
    fetch(`/api/order/${encodeURIComponent(queryOrderId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && !data.error) setStored(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [queryOrderId]);

  const orderId = stored?.order_id || queryOrderId || '—';
  const orderDate = formatDate(stored?.created_at || new Date().toISOString());
  const totalPaid = `Rs. ${asNumber(stored?.total_amount) ?? asNumber(queryAmount) ?? 160}`;
  const paymentStatus = paymentLabel(stored?.payment_type || queryPayment || queryStatus);
  const items = useMemo(
    () => parseItems(stored?.cart_data, asNumber(stored?.total_amount) ?? asNumber(queryAmount)),
    [stored, queryAmount]
  );
  const deliveryAddress = formatAddress(stored?.cart_data);
  const phone = stored?.customer_phone || queryPhone || '—';
  const email = stored?.customer_email || queryEmail || '—';
  const name = contactName(stored?.cart_data);
  const trackHref = orderId && orderId !== '—'
    ? `/track-order?order_id=${encodeURIComponent(orderId)}`
    : '/track-order';

  return (
    <div className="oc">
      <section className="oc-hero">
        <div className="oc-hero__art" aria-hidden="true">
          <img src="/figma-home/sticker-1.png" alt="" className="oc-hero__deco oc-hero__deco--left" />
          <img src="/figma-home/tea-glass.png" alt="" className="oc-hero__glass" />
          <img src="/figma-home/stamp.png" alt="" className="oc-hero__stamp" />
        </div>
        <h1>Congratulations!</h1>
        <p>Your order has been placed and will be delivered to you soon.</p>
      </section>

      <section className="tr-body oc-body">
        <div className="tr-summary">
          <div>
            <span>Order Id</span>
            <strong>#{String(orderId).replace(/^#/, '')}</strong>
          </div>
          <div>
            <span>Order Date</span>
            <strong>{orderDate}</strong>
          </div>
          <div>
            <span>Total Paid</span>
            <strong>{totalPaid}</strong>
          </div>
          <div>
            <span>Payment Status</span>
            <strong>{paymentStatus}</strong>
          </div>
        </div>

        <h2 className="tr-heading">Order Summary</h2>
        {items.map((item, index) => (
          <div className="tr-product" key={`${item.name}-${index}`}>
            <img src={item.image} alt={item.name} />
            <div className="tr-product__info">
              <div className="tr-product__top">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.sachets}</p>
                </div>
                {item.invoiceUrl ? (
                  <a className="tr-invoice" href={item.invoiceUrl} target="_blank" rel="noreferrer">
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
                <strong>{item.price}</strong>
                <span>x{item.quantity}</span>
              </div>
            </div>
          </div>
        ))}

        <div className="tr-details">
          <article>
            <h3>
              <MapPin size={22} />
              Delivery Details
            </h3>
            <p>{deliveryAddress}</p>
          </article>
          <article>
            <h3>
              <Phone size={20} />
              Contact Details
            </h3>
            <p>Name : {name}</p>
            <p>Mobile : {phone}</p>
            <p>Email : {email}</p>
          </article>
        </div>

        <div className="oc-actions">
          <Link href={trackHref} className="hp-btn">
            TRACK MY ORDER
          </Link>
          <Link href="/product" className="hp-btn hp-btn--ghost">
            CONTINUE SHOPPING
          </Link>
        </div>

        <p className="tr-help">
          Need Help? <Link href="/contact">Contact Us</Link>
        </p>
      </section>
    </div>
  );
}
