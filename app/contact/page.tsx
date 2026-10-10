'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ToastContext';

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.message.trim()) {
    errors.message = 'Message is required.';
  } else if (form.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters.';
  }
  return errors;
}

const DETAILS = [
  {
    icon: '/figma-home/icon-mail.svg',
    href: 'mailto:tcd@thechaidealer.com',
    label: 'tcd@thechaidealer.com',
  },
  {
    icon: '/figma-home/icon-phone.svg',
    href: 'tel:+917042401496',
    label: '+91 70424 01496',
  },
  {
    icon: 'pin',
    href: null,
    label: 'Delivering all across India',
  },
];

export default function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    });
    setLoading(false);

    if (error) {
      showToast("Something went wrong. Please email us directly at tcd@thechaidealer.com", 'error');
    } else {
      showToast("Message sent! We'll get back to you soon.", 'success');
      setForm({ name: '', email: '', message: '' });
      setErrors({});
    }
  };

  return (
    <div className="cp">
      <div className="cp-inner">
        <div className="cp-copy">
          <h1 className="cp-title">Contact Us</h1>
          <p className="cp-lead">
            Whether you have a question about your order, want to learn more about our brand, or simply feel like chatting, we&apos;d love to hear from you. Fill out the form or contact us at:
          </p>
          <ul className="cp-details">
            {DETAILS.map((item) => (
              <li key={item.label} className="cp-detail">
                <span className="cp-detail__icon">
                  {item.icon === 'pin' ? (
                    <MapPin size={22} color="#e07d26" strokeWidth={2} />
                  ) : (
                    <img src={item.icon} alt="" width={22} height={22} />
                  )}
                </span>
                {item.href ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form className="cp-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="contact-name" className="cp-sr">Name</label>
            <input
              id="contact-name"
              type="text"
              name="name"
              placeholder="Name *"
              value={form.name}
              onChange={handleChange}
              style={errors.name ? { borderColor: '#ef4444' } : {}}
            />
            {errors.name && (
              <span className="cp-error">{errors.name}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="contact-email" className="cp-sr">Email</label>
            <input
              id="contact-email"
              type="email"
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              style={errors.email ? { borderColor: '#ef4444' } : {}}
            />
            {errors.email && (
              <span className="cp-error">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="contact-message" className="cp-sr">Message</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Message"
              value={form.message}
              onChange={handleChange}
              style={errors.message ? { borderColor: '#ef4444' } : {}}
            />
            {errors.message && (
              <span className="cp-error">{errors.message}</span>
            )}
          </div>
          <button type="submit" className="hp-btn cp-submit" disabled={loading}>
            {loading ? 'Sending...' : 'SUBMIT'}
          </button>
        </form>
      </div>
    </div>
  );
}
