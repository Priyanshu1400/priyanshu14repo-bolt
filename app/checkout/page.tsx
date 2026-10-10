'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { Truck, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    HeadlessCheckout: {
      addToCart: (event: Event, token: string, options: { fallbackUrl: string }) => void;
    };
  }
}

export default function CheckoutPage() {
  const { items, subtotal, discount, total } = useCart();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Delhi',
    pincode: '',
  });

  const shipping = paymentMethod === 'cod' ? 49 : 0;
  const finalTotal = total + shipping;

  const handleCheckout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!formRef.current?.reportValidity()) return;
    if (items.length === 0) return;

    setCheckoutError('');
    setLoading(true);
    try {
      const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
      const res = await fetch('/api/get-checkout-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: totalQty }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Checkout unavailable. Please try again.');
      }
      if (!window.HeadlessCheckout) {
        throw new Error('Checkout SDK not loaded. Please refresh and try again.');
      }
      window.HeadlessCheckout.addToCart(e.nativeEvent, data.token, {
        fallbackUrl: 'https://300mltea.in/product',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setCheckoutError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="section-inner">
          <div className="cart-empty reveal" style={{ paddingTop: 120 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
            <h2 className="cart-empty__title">Your Cart is Empty</h2>
            <p className="cart-empty__text">Add some chai before checking out.</p>
            <Link href="/product" className="btn btn-primary">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="section-inner">
        <h1 className="checkout-page__title reveal">Checkout</h1>
        <div className="checkout-page__grid">
          <div className="reveal">
            <form ref={formRef} className="checkout-form" onSubmit={(e) => e.preventDefault()}>
              <div className="checkout-form__section">
                <h3 className="checkout-form__section-title">
                  <span>1</span> Delivery Address
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input required value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} placeholder="Enter full name" />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input required type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="10-digit mobile number" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Address Line 1</label>
                  <input required value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} placeholder="House no, street, locality" />
                </div>
                <div className="form-group">
                  <label>Address Line 2 (Optional)</label>
                  <input value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} placeholder="Landmark, building name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}>
                      <option>Delhi</option>
                      <option>Haryana</option>
                      <option>Uttar Pradesh</option>
                      <option>Rajasthan</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="6-digit pincode" maxLength={6} />
                  </div>
                </div>
              </div>

              <div className="checkout-form__section">
                <h3 className="checkout-form__section-title">
                  <span>2</span> Payment Method
                </h3>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'online' ? 'payment-option--selected' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                    <div>
                      <div className="payment-option__label">UPI / Cards / Online Payment</div>
                      <div className="payment-option__desc">Google Pay, PhonePe, Paytm, credit/debit cards — <strong style={{ color: 'var(--orange)' }}>Free delivery</strong></div>
                    </div>
                  </label>
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'payment-option--selected' : ''}`}>
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    <div>
                      <div className="payment-option__label">Cash on Delivery (COD)</div>
                      <div className="payment-option__desc">Pay when your chai arrives — <strong>+₹49 delivery charge</strong></div>
                    </div>
                  </label>
                </div>
              </div>

              {checkoutError && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                className="btn btn-primary btn-large"
                style={{ width: '100%' }}
                disabled={loading}
                onClick={handleCheckout}
              >
                {loading ? 'Opening Payment...' : <>
                  {paymentMethod === 'online' ? 'Proceed to Pay' : 'Place COD Order'} <ArrowRight size={18} />
                </>}
              </button>
            </form>
          </div>

          <div className="cart-summary reveal reveal-delay-1">
            <h3 className="cart-summary__title">Order Summary</h3>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span>{item.name} x {item.quantity}</span>
                  <span><s>₹{(item.originalPrice || 250) * item.quantity}</s> ₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="cart-summary__row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="cart-summary__row" style={{ color: 'var(--orange)' }}>
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="cart-summary__row">
              <span>Delivery</span>
              <span style={{ color: shipping === 0 ? 'var(--orange)' : undefined }}>
                {shipping === 0 ? 'FREE' : '₹49'}
              </span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-l)', textAlign: 'center' }}>
              <Truck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Delivering PAN India through our website
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
