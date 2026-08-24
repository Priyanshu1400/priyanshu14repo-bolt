'use client';

import { useState } from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, TEA_PRODUCT } from './CartContext';
import { useToast } from './ToastContext';

declare global {
  interface Window {
    HeadlessCheckout: {
      addToCart: (event: Event, token: string, options: { fallbackUrl: string }) => void;
    };
  }
}

const PRODUCT_IMAGE_FALLBACK = '/figma-home/product-box.png';

export default function CartDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    items,
    updateQuantity,
    removeItem,
    totalItems,
    subtotal,
    couponApplied,
    couponCode,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { showToast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  const handleCheckout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (items.length === 0) {
      showToast('Your cart is empty.');
      return;
    }
    setCheckoutLoading(true);
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
        fallbackUrl: 'https://300mltea.com/product',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.error('[checkout]', err);
      showToast(msg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <div
        className={`cart-drawer-overlay ${isDrawerOpen ? 'cart-drawer-overlay--visible' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div
        className={`cart-drawer ${isDrawerOpen ? 'cart-drawer--open' : ''}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
      >
        <div className="cart-drawer__header">
          <button className="cart-drawer__close" onClick={closeDrawer} aria-label="Close cart">
            <X size={22} strokeWidth={2.4} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p>Your cart is empty</p>
            <button className="cart-drawer__empty-cta" onClick={closeDrawer}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-drawer__body">
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div key={item.id} className="cart-drawer__product">
                  <img
                    src={item.image || PRODUCT_IMAGE_FALLBACK}
                    alt={item.name}
                    className="cart-drawer__product-img"
                  />
                  <div className="cart-drawer__product-info">
                    <div className="cart-drawer__product-top">
                      <div className="cart-drawer__product-name">
                        {item.name}
                        <span> (10 sachets)</span>
                      </div>
                      <button
                        type="button"
                        className="cart-drawer__remove"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </div>
                    <div className="cart-drawer__product-meta">
                      <div className="cart-drawer__product-price">
                        <s>&#8377;{item.originalPrice || 250}</s>
                        <strong>&#8377;{item.price}</strong>
                      </div>
                      <div className="cart-drawer__qty-row">
                        <span className="cart-drawer__qty-label">Qty:</span>
                        <div className="cart-drawer__qty">
                          <button
                            className="cart-drawer__qty-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span id={item.id === TEA_PRODUCT.id ? 'cartQty' : undefined} className="cart-drawer__qty-num">{item.quantity}</span>
                          <button
                            className="cart-drawer__qty-btn"
                            onClick={() => updateQuantity(item.id, Math.min(10, item.quantity + 1))}
                            disabled={item.quantity >= 10}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-drawer__footer">
              <form
                className="cart-drawer__discount"
                onSubmit={(event) => {
                  event.preventDefault();
                  const ok = applyCoupon(discountInput);
                  if (!ok) showToast('Invalid coupon code');
                }}
              >
                <input
                  type="text"
                  className="cart-drawer__discount-input"
                  placeholder="Discount Code"
                  value={couponApplied ? couponCode : discountInput}
                  onChange={(event) => setDiscountInput(event.target.value)}
                  disabled={couponApplied}
                  aria-label="Discount code"
                />
                {couponApplied ? (
                  <button
                    type="button"
                    className="cart-drawer__apply"
                    onClick={removeCoupon}
                  >
                    REMOVE
                  </button>
                ) : (
                  <button type="submit" className="cart-drawer__apply">
                    APPLY
                  </button>
                )}
              </form>

              <div className="cart-drawer__subtotal">
                <span className="cart-drawer__subtotal-label">
                  Subtotal ({totalItems} {totalItems === 1 ? 'Item' : 'Items'})
                </span>
                <span className="cart-drawer__subtotal-amount">&#8377;{subtotal}</span>
              </div>

              <button
                id="proceedToCheckout"
                className="cart-drawer__checkout-btn"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <span className="cart-drawer__checkout-loading">
                    <span className="cart-drawer__spinner" /> Opening Checkout...
                  </span>
                ) : (
                  'CHECKOUT'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
