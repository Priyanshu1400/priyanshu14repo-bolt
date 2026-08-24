'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useCart } from './CartContext';
import { supabase } from '@/lib/supabase';
import CartDrawer from './CartDrawer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const pathname = usePathname();
  const { totalItems, openDrawer } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const navLinks = [
    { href: '/product', label: 'Shop' },
    { href: '/about', label: 'Our Story' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/track-order', label: 'Track My Order' },
  ];

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) return;

    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    if (error && error.code !== '23505') {
      setNewsletterMessage('Something went wrong. Please try again.');
      return;
    }

    setNewsletterEmail('');
    setNewsletterMessage('You are on the list.');
  };

  return (
    <div className="figma-chrome">
      <div className="ticker-strip">
        <p className="ticker-strip__static">Now Delivering Across India</p>
      </div>

      <nav className={`navbar ${scrolled ? 'navbar--solid' : 'navbar--transparent'}`}>
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo">
            <span className="navbar__logo-text">300ml TEA</span>
          </Link>

          <ul className="navbar__links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`navbar__link${pathname === link.href ? ' navbar__link--active' : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="navbar__actions">
            <button
              className="navbar__cart"
              onClick={openDrawer}
              aria-label={`Cart (${totalItems} items)`}
            >
              <img src="/figma-home/icon-cart.svg" alt="" width={39} height={48} />
              {totalItems > 0 && <span className="navbar__cart-count">{totalItems}</span>}
            </button>
            <button className="navbar__menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <button
        type="button"
        className={`mobile-menu__backdrop${mobileOpen ? ' mobile-menu__backdrop--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
      />
      <div className={`mobile-menu${mobileOpen ? ' mobile-menu--open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-menu__header">
          <span className="mobile-menu__logo">300ml TEA</span>
          <button className="mobile-menu__close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>
        <ul className="mobile-menu__links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`mobile-menu__link${pathname === link.href ? ' mobile-menu__link--active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="mobile-menu__link mobile-menu__link--cart"
              onClick={() => {
                setMobileOpen(false);
                openDrawer();
              }}
            >
              Cart {totalItems > 0 ? `(${totalItems})` : ''}
            </button>
          </li>
        </ul>
      </div>

      <CartDrawer />

      <main>{children}</main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__grid">
            <div>
              <span className="footer__logo">300ml TEA</span>
              <p className="footer__brand-text">
                Pre-measured raw chai blend that brings maa ke hath ki chai to your cup, kahin bhi. Not instant. Not premix. Just real chai.
              </p>
              <a href="tel:+917042401496" className="footer__contact">
                <img src="/figma-home/icon-phone.svg" alt="" width={18} height={18} />
                +91 70424 01496
              </a>
              <a href="mailto:tcd@thechaidealer.com" className="footer__contact">
                <img src="/figma-home/icon-mail.svg" alt="" width={18} height={18} />
                tcd@thechaidealer.com
              </a>
            </div>
            <div>
              <h4 className="footer__heading">SHOP</h4>
              <ul className="footer__links">
                <li><Link href="/product" className="footer__link">300ml Tea</Link></li>
                <li><button type="button" className="footer__link footer__link--btn" onClick={openDrawer}>Cart</button></li>
                <li><Link href="/track-order" className="footer__link">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer__heading">EXPLORE</h4>
              <ul className="footer__links">
                <li><Link href="/about" className="footer__link">Our Story</Link></li>
                <li><Link href="/contact" className="footer__link">Contact Us</Link></li>
                <li><Link href="/#faq" className="footer__link">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer__heading">POLICIES</h4>
              <ul className="footer__links">
                {[
                  { href: '/terms-of-service', label: 'Terms of Service' },
                  { href: '/privacy-policy', label: 'Privacy Policy' },
                  { href: '/shipping-policy', label: 'Shipping Policy' },
                  { href: '/refund-policy', label: 'Refund Policy' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`footer__link${pathname === link.href ? ' footer__link--active' : ''}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
