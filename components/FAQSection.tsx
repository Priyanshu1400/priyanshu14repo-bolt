'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What is 300ml Tea exactly?',
    answer: '300ml Tea is a pre-measured raw chai blend. Each packet contains the exact amount of tea powder, sugar, and chai masala (Adrak & Elaichi) needed to make one perfect 300ml cup of chai. It is NOT instant tea or a premix. You pour 300ml of milk, add the sachet contents, stir on high flame for 5 minutes 30 seconds, and strain.',
  },
  {
    question: 'Is it instant tea? Do I just add hot water?',
    answer: 'No, 300ml Tea is NOT instant tea. You pour 300ml of milk into a pan, heat on high flame, add the sachet contents after 1 minute, stir continuously for 4 minutes 30 seconds, and strain. The result is authentic, freshly brewed chai — just like maa used to make.',
  },
  {
    question: 'How many cups does one packet make?',
    answer: 'One sachet makes 300ml of tea, which is 2 cups.',
  },
  {
    question: 'What ingredients are inside?',
    answer: 'Each packet contains premium tea powder, natural sugar, and our signature chai masala blend of Adrak (ginger) and Elaichi (cardamom). No preservatives, no artificial flavours.',
  },
  {
    question: 'Where do you deliver?',
    answer: 'We deliver PAN India through our website. Place your order on 300mltea.in and we ship to pin codes across the country.',
  },
  {
    question: 'How do I store the packets?',
    answer: 'Store in a cool, dry place away from direct sunlight. The individual sachets are sealed to maintain freshness. Once opened, use immediately.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list reveal">
      {faqs.map((faq, i) => (
        <div key={i} className={`faq-item ${openIndex === i ? 'faq-item--open' : ''}`}>
          <button className="faq-item__question" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {faq.question}
            <img
              src={openIndex === i ? '/figma-home/faq-minus.svg' : '/figma-home/faq-plus.svg'}
              alt=""
              width={21}
              height={21}
              className="faq-item__icon-img"
            />
          </button>
          <div className="faq-item__answer">
            <p className="faq-item__answer-text">{faq.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
