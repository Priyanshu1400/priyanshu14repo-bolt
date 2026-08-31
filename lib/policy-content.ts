export type PolicySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PolicyDoc = {
  title: string;
  path: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
  cmsKey: string;
};

export const POLICY_NAV = [
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
  { href: '/refund-policy', label: 'Refund Policy' },
] as const;

export const TERMS_OF_SERVICE: PolicyDoc = {
  title: 'Terms of Service',
  path: '/terms-of-service',
  cmsKey: 'terms_of_service',
  updated: 'August 2026',
  intro:
    'By using 300mltea.in you agree to these terms. If you do not agree, please do not place an order or use the site.',
  sections: [
    {
      heading: 'About 300ml Tea',
      paragraphs: [
        '300ml Tea is a pre-measured raw chai blend — tea powder, sugar, and Adrak & Elaichi masala calibrated for one 300ml cup. It is not instant tea and not a premix.',
      ],
    },
    {
      heading: 'Products and pricing',
      bullets: [
        'All products are subject to availability.',
        'Prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise.',
        'We may update prices, packs, or offers without prior notice. The price shown at checkout is the price you pay.',
      ],
    },
    {
      heading: 'Orders and payments',
      bullets: [
        'An order is confirmed after successful online payment or COD confirmation.',
        'We accept UPI and other online payments, and Cash on Delivery where available.',
        'We may refuse or cancel an order if payment fails, details look incomplete, or the product cannot be fulfilled.',
      ],
    },
    {
      heading: 'Delivery',
      paragraphs: [
        'We currently deliver across India. Delivery windows are estimates and can change due to courier delays, weather, or high demand. See our Shipping Policy for timelines and charges.',
      ],
    },
    {
      heading: 'Cancellations, returns, and refunds',
      paragraphs: [
        'Orders can usually be cancelled before they are dispatched. Food products that have been opened are not returnable except where required by law or where the item is damaged, defective, or incorrect. Full details are in the Refund Policy.',
      ],
    },
    {
      heading: 'Intellectual property',
      paragraphs: [
        'Logos, product names, copy, and images on 300mltea.in belong to 300ml Tea and may not be copied or used without permission.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'We take care to pack and describe our chai accurately. To the extent permitted by Indian law, 300ml Tea is not liable for indirect or consequential loss arising from use of the website or products.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These terms are governed by the laws of India. Disputes are subject to the courts in Delhi.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Questions about these terms: tcd@thechaidealer.com or +91 70424 01496.',
      ],
    },
  ],
};

export const PRIVACY_POLICY: PolicyDoc = {
  title: 'Privacy Policy',
  path: '/privacy-policy',
  cmsKey: 'privacy_policy',
  updated: 'August 2026',
  intro:
    'This policy explains what information 300ml Tea collects when you shop, track an order, or write to us, and how we use it.',
  sections: [
    {
      heading: 'Information we collect',
      bullets: [
        'Order details: name, phone, email, delivery address, and payment status.',
        'Account or checkout details you enter yourself.',
        'Messages sent through the contact form or email.',
        'Newsletter email, if you subscribe.',
        'Basic device and usage data such as browser type and pages visited, used to keep the site working.',
      ],
    },
    {
      heading: 'How we use it',
      bullets: [
        'To confirm, pack, ship, and track your order.',
        'To take payment and send order updates.',
        'To answer support queries.',
        'To send occasional brand updates if you opted in. You can unsubscribe at any time.',
      ],
    },
    {
      heading: 'Who we share it with',
      paragraphs: [
        'We share only what is needed to fulfil an order: courier partners (including Shiprocket and last-mile carriers), payment processors, and hosting or analytics tools that help run the website. We do not sell your personal information.',
      ],
    },
    {
      heading: 'Cookies',
      paragraphs: [
        'The site may use cookies or similar storage to remember your cart and understand how the shop is used. You can control cookies in your browser settings.',
      ],
    },
    {
      heading: 'Data retention and your rights',
      paragraphs: [
        'We keep order records as long as needed for fulfilment, tax, and legal reasons. You may ask to access, correct, or delete personal data we hold, subject to those obligations. Write to tcd@thechaidealer.com.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Privacy questions: tcd@thechaidealer.com or +91 70424 01496.',
      ],
    },
  ],
};

export const SHIPPING_POLICY: PolicyDoc = {
  title: 'Shipping Policy',
  path: '/shipping-policy',
  cmsKey: 'shipping_policy',
  updated: 'August 2026',
  intro:
    'We ship 300ml Tea across India. This page covers timelines, charges, and what to do if a parcel is delayed.',
  sections: [
    {
      heading: 'Where we deliver',
      paragraphs: [
        'Orders are delivered PAN India through our website. Serviceability is confirmed at checkout, and we ship to pin codes across the country.',
      ],
    },
    {
      heading: 'Processing time',
      paragraphs: [
        'Orders are usually packed and handed to the courier within 1–2 business days after confirmation. Weekends and public holidays may add a day.',
      ],
    },
    {
      heading: 'Delivery timelines',
      bullets: [
        'Metro and nearby cities: typically 2–5 business days after dispatch.',
        'Rest of India: typically 4–8 business days after dispatch.',
        'Remote pin codes may take longer. Tracking updates appear on the Track My Order page once an AWB is generated.',
      ],
    },
    {
      heading: 'Shipping charges',
      bullets: [
        'Prepaid orders: shipping is shown at checkout. Eligible orders may qualify for free delivery as displayed before you pay.',
        'Cash on Delivery: a small COD fee may apply and will be shown before you confirm.',
        'We do not add surprise charges after an order is placed.',
      ],
    },
    {
      heading: 'Failed delivery',
      paragraphs: [
        'Please keep your phone reachable. If a courier cannot complete delivery after reasonable attempts, the parcel may be returned to us. Re-shipping may require a fresh order or additional shipping cost.',
      ],
    },
    {
      heading: 'Damaged in transit',
      paragraphs: [
        'If the pack arrives damaged or leaking, photograph the parcel and write to us within 48 hours of delivery at tcd@thechaidealer.com with your order ID. We will arrange a replacement or refund as per the Refund Policy.',
      ],
    },
  ],
};

export const REFUND_POLICY: PolicyDoc = {
  title: 'Refund Policy',
  path: '/refund-policy',
  cmsKey: 'refund_policy',
  updated: 'August 2026',
  intro:
    '300ml Tea is a food product. We want every cup to feel like home — and we will make it right when something goes wrong with your order.',
  sections: [
    {
      heading: 'Cancellations',
      paragraphs: [
        'You can request a cancellation before the order is dispatched. Email tcd@thechaidealer.com or call +91 70424 01496 with your order ID. Once the courier has picked up the parcel, it cannot be cancelled; you may refuse delivery and we will treat it under this policy.',
      ],
    },
    {
      heading: 'When we replace or refund',
      bullets: [
        'Wrong item or missing sachets.',
        'Parcel damaged, wet, or leaking on arrival (reported within 48 hours with photos).',
        'Order cancelled before dispatch, or payment captured for an order we cannot fulfil.',
      ],
    },
    {
      heading: 'What we cannot take back',
      bullets: [
        'Opened or used sachets, unless the product is defective.',
        'Change of mind after the parcel has been delivered in good condition.',
        'Delay caused solely by the courier after a successful dispatch, though we will still help you track and follow up.',
      ],
    },
    {
      heading: 'How refunds are issued',
      paragraphs: [
        'Approved prepaid refunds go back to the original payment method, typically within 5–7 business days after approval. COD refunds are issued by bank transfer or UPI to the details you share. Replacement, where available, is usually faster than a refund.',
      ],
    },
    {
      heading: 'How to raise a request',
      paragraphs: [
        'Write to tcd@thechaidealer.com with your order ID, what went wrong, and photos if the issue is damage or a packing error. We aim to respond within 2 business days.',
      ],
    },
  ],
};

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

export function cmsToHtml(value: string): string {
  if (looksLikeHtml(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
}
