'use client';

import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal, discount, total, couponCode, couponApplied, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = () => {
    setCouponError('');
    const ok = applyCoupon(couponInput);
    if (!ok) setCouponError('Invalid coupon code');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="section-inner">
          <div className="cart-empty reveal">
            <div style={{ fontSize: 64, marginBottom: 24 }}>🛒</div>
            <h2 className="cart-empty__title">Your Cart is Empty</h2>
            <p className="cart-empty__text">Add some chai to your cart and start brewing!</p>
            <Link href="/product" className="btn btn-primary">
              <ShoppingBag size={18} /> Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="section-inner">
        <h1 className="cart-page__title reveal">Shopping Cart</h1>
        <div className="cart-page__grid">
          <div className="reveal">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item__img">
                  <div style={{ fontSize: 48 }}>🍵</div>
                </div>
                <div className="cart-item__details">
                  <div className="cart-item__name">{item.name}</div>
                  <div className="cart-item__variant">{item.variant}</div>
                  <div className="cart-item__actions">
                    <div className="qty-selector">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <div className="cart-item__price">
                      <s>₹{(item.originalPrice || 250) * item.quantity}</s>
                      <strong> ₹{item.price * item.quantity}</strong>
                    </div>
                    <button className="cart-item__remove" onClick={() => removeItem(item.id)}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary reveal reveal-delay-1">
            <h3 className="cart-summary__title">Order Summary</h3>
            <div className="cart-summary__coupon">
              <input type="text" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
              <button className="btn btn-primary btn-small" onClick={handleApplyCoupon}>Apply</button>
            </div>
            {couponApplied && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--orange)', fontWeight: 600 }}>Coupon: {couponCode}</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-l)', cursor: 'pointer', fontSize: 12 }} onClick={removeCoupon}>Remove</button>
              </div>
            )}
            {couponError && <div style={{ color: 'var(--orange)', fontSize: 13, marginBottom: 12 }}>{couponError}</div>}
            <div className="cart-summary__row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {couponApplied && (
              <div className="cart-summary__row" style={{ color: 'var(--orange)' }}>
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="cart-summary__row">
              <span>Delivery</span>
              <span style={{ fontSize: 12 }}>Free online · ₹49 COD</span>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              Checkout <ArrowRight size={18} />
            </Link>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-l)' }}>
              Free delivery on online payment. ₹49 extra for COD.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
