
/*
# Create contact_messages and site_content tables

## contact_messages
Stores contact form submissions from the public website.
- id: auto UUID primary key
- name, email, message: submission fields
- status: 'New' or 'Read' (default 'New')
- created_at: timestamp

RLS:
- anon + authenticated can INSERT (public form submission)
- authenticated only can SELECT/UPDATE/DELETE (admin reads/manages)

## site_content
Key-value store for all editable site content (hero text, policy pages, contact info, etc.).
- key: text primary key (e.g. 'hero_tagline', 'shipping_policy')
- value: text content (can be plain text or HTML)
- updated_at: timestamp

RLS:
- anon + authenticated can SELECT (public website reads content)
- authenticated only can INSERT/UPDATE/DELETE (admin edits)

## Storage
Creates the 'site-assets' public bucket for image uploads.
- Public read
- Authenticated write/update/delete
*/

-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'New',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_contact_messages" ON contact_messages;
CREATE POLICY "anon_insert_contact_messages" ON contact_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_contact_messages" ON contact_messages;
CREATE POLICY "auth_select_contact_messages" ON contact_messages FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_contact_messages" ON contact_messages;
CREATE POLICY "auth_update_contact_messages" ON contact_messages FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_contact_messages" ON contact_messages;
CREATE POLICY "auth_delete_contact_messages" ON contact_messages FOR DELETE
TO authenticated USING (true);

-- ============================================================
-- SITE CONTENT
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_site_content" ON site_content;
CREATE POLICY "public_select_site_content" ON site_content FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_site_content" ON site_content;
CREATE POLICY "auth_insert_site_content" ON site_content FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_site_content" ON site_content;
CREATE POLICY "auth_update_site_content" ON site_content FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_site_content" ON site_content;
CREATE POLICY "auth_delete_site_content" ON site_content FOR DELETE
TO authenticated USING (true);

-- ============================================================
-- SEED SITE CONTENT (initial values, do not overwrite admin edits)
-- ============================================================
INSERT INTO site_content (key, value) VALUES
  ('hero_tagline',      'Real chai. Exact proportions. Zero guesswork.'),
  ('hero_headline',     'A Tribute to Ma'),
  ('hero_description',  'Tea powder, sugar & chai masala — pre-measured and ready to brew. Not instant. Not premix. Just the real thing in 5 minutes 30 seconds.'),
  ('stats_raw_ingredients', '3'),
  ('stats_additives',   '0'),
  ('stats_brew_time',   '5:30'),
  ('contact_phone',     '+91 70424 01496'),
  ('contact_email',     'tcd@thechaidealer.com'),
  ('contact_instagram', 'https://instagram.com/300mltea'),
  ('product_image_url', '/images/300ml_tea_3d_box_1.png'),
  ('hero_video_id',     '1va2uBKy97c')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, value) VALUES ('shipping_policy', $policy_shipping$<p>Last updated: June 2025</p>
<h3>1. Shipping Coverage</h3>
<p>We currently ship across India. Deliveries to Delhi NCR are prioritised and may receive faster turnaround. We are continuously expanding our delivery network to serve more pin codes.</p>
<h3>2. Processing Time</h3>
<p>Orders are processed within 1–2 business days (Monday to Saturday, excluding public holidays) after payment confirmation. Orders placed on Sundays or public holidays will be processed the next working day.</p>
<h3>3. Delivery Timeline</h3>
<ul>
<li><strong>Delhi NCR:</strong> 1–3 business days</li>
<li><strong>Metro cities (Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune):</strong> 3–5 business days</li>
<li><strong>Rest of India:</strong> 5–7 business days</li>
</ul>
<p>These are estimated timelines. Actual delivery may vary due to courier delays, weather conditions, or peak seasons.</p>
<h3>4. Shipping Charges</h3>
<p>We offer free shipping on all orders across India. No minimum order value is required to qualify for free delivery.</p>
<h3>5. Order Tracking</h3>
<p>Once your order is dispatched, you will receive a tracking link via SMS and/or email. You can also track your order using the Order ID on our <a href="/track-order">Track Order</a> page.</p>
<h3>6. Undeliverable Orders</h3>
<p>If a delivery attempt fails due to an incorrect address or unavailability of the recipient, our courier partner will make up to two re-attempts. If the order remains undelivered after that, it will be returned to us. In such cases, please contact us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> to arrange re-dispatch (re-shipping charges may apply).</p>
<h3>7. Damaged in Transit</h3>
<p>If your order arrives damaged due to transit mishandling, please email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> within 24 hours of delivery with photographs of the damaged packaging and product. We will arrange a replacement or refund as per our Return Policy.</p>
<h3>8. Contact Us</h3>
<p>For any shipping-related queries, reach us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> or call <a href="tel:+917042401496">+91 70424 01496</a> (Monday–Saturday, 10 AM – 6 PM).</p>$policy_shipping$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, value) VALUES ('return_policy', $policy_return$<p>Last updated: June 2025</p>
<p>At 300ml Tea, we take pride in the quality of every sachet we ship. If something isn't right, we're here to help.</p>
<h3>1. Return Eligibility</h3>
<p>We accept return requests only under the following circumstances:</p>
<ul>
<li>The product received is physically damaged or tampered with.</li>
<li>The sachet is defective (e.g., leaking, mis-sealed).</li>
<li>A wrong product was delivered.</li>
</ul>
<p>Due to the nature of food products, we do not accept returns for change of mind, dislike of taste, or incorrect orders placed by the customer.</p>
<h3>2. Return Window</h3>
<p>Return requests must be raised within <strong>24 hours of delivery</strong>. Please inspect your order immediately upon receipt. Requests raised after this window may not be eligible.</p>
<h3>3. How to Initiate a Return</h3>
<ul>
<li>Email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> with your Order ID and clear photographs of the damaged or incorrect product.</li>
<li>Our support team will review your request within 1–2 business days.</li>
<li>If approved, we will arrange a reverse pickup at no additional cost to you.</li>
<li>Please keep the original packaging intact for the pickup.</li>
</ul>
<h3>4. Refund After Return</h3>
<ul>
<li>Once the returned product is received and inspected, refunds are processed within 5–7 business days.</li>
<li>Refunds are issued to the original payment method or via UPI/bank transfer for COD orders.</li>
<li>Please refer to our <a href="/refund-policy">Refund Policy</a> for full details on timelines.</li>
</ul>
<h3>5. Replacement Option</h3>
<p>In some cases, we may offer a free replacement instead of a refund, at our discretion and subject to stock availability.</p>
<h3>6. Non-Returnable Situations</h3>
<ul>
<li>Products that have been opened or partially consumed.</li>
<li>Requests raised after 24 hours of delivery.</li>
<li>Damage caused by improper storage or use after delivery.</li>
</ul>
<h3>7. Contact Us</h3>
<p>For return-related queries, email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> or call <a href="tel:+917042401496">+91 70424 01496</a> (Monday–Saturday, 10 AM – 6 PM IST).</p>$policy_return$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, value) VALUES ('refund_policy', $policy_refund$<p>Last updated: June 2025</p>
<h3>1. Refund Eligibility</h3>
<p>We offer refunds in the following situations:</p>
<ul>
<li>The product received is damaged, defective, or tampered.</li>
<li>The wrong product was delivered.</li>
<li>The order was not delivered within the committed timeline and is confirmed lost in transit.</li>
</ul>
<p>Refunds are not applicable for orders where the product has been opened and consumed, or for change-of-mind cancellations after dispatch.</p>
<h3>2. How to Request a Refund</h3>
<ul>
<li>Email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> within 24 hours of delivery with your Order ID, contact number, and clear photographs of the issue.</li>
<li>Our support team will review your request within 1–2 business days.</li>
<li>If approved, we will initiate the refund process immediately.</li>
</ul>
<h3>3. Refund Timeline</h3>
<ul>
<li><strong>UPI / Net Banking / Debit Card / Credit Card:</strong> 5–7 business days after approval.</li>
<li><strong>Prepaid wallets:</strong> 3–5 business days after approval.</li>
<li><strong>Cash on Delivery (COD):</strong> Refunds are processed via bank transfer or UPI within 7 business days. You will need to provide valid bank/UPI details.</li>
</ul>
<h3>4. Order Cancellations</h3>
<p>Orders can be cancelled within 12 hours of placing them, provided they have not yet been dispatched. To cancel, email <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> with your Order ID. Once dispatched, cancellations are not accepted.</p>
<p>For prepaid cancelled orders, the full amount will be refunded to the original payment method within 5–7 business days.</p>
<h3>5. Partial Refunds</h3>
<p>In cases where only part of an order is affected (e.g., one out of multiple sachets is damaged), we will issue a proportionate refund or replacement at our discretion.</p>
<h3>6. Non-Refundable Situations</h3>
<ul>
<li>Delivery delays caused by incorrect address provided by the customer.</li>
<li>Products that have been opened, used, or altered.</li>
<li>Orders refused at delivery without valid reason.</li>
</ul>
<h3>7. Contact Us</h3>
<p>For all refund queries, please write to us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a>. We aim to respond within 24 business hours.</p>$policy_refund$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, value) VALUES ('privacy_policy', $policy_privacy$<p>Last updated: June 2025</p>
<p>300ml Tea ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase from us.</p>
<h3>1. Information We Collect</h3>
<p>We may collect the following types of information:</p>
<ul>
<li><strong>Personal information:</strong> name, email address, phone number, and delivery address provided during checkout.</li>
<li><strong>Order details:</strong> products purchased, payment method, and order history.</li>
<li><strong>Technical data:</strong> IP address, browser type, device information, and pages visited — collected automatically via cookies and analytics tools.</li>
</ul>
<h3>2. How We Use Your Information</h3>
<ul>
<li>To process, fulfil, and deliver your orders.</li>
<li>To communicate with you about your orders, updates, and support requests.</li>
<li>To improve our website, products, and customer experience.</li>
<li>To send promotional offers and newsletters — only with your explicit consent.</li>
<li>To comply with legal and regulatory obligations under Indian law.</li>
</ul>
<h3>3. Data Sharing</h3>
<p>We do not sell or rent your personal information to third parties. We may share your data with:</p>
<ul>
<li><strong>Delivery partners</strong> (e.g., Shiprocket, Delhivery) — to fulfil your orders.</li>
<li><strong>Payment processors</strong> — to securely handle transactions.</li>
<li><strong>Analytics providers</strong> — to understand website usage (data is anonymised).</li>
</ul>
<p>All third-party partners are contractually obligated to handle your data securely and only for the purposes we specify.</p>
<h3>4. Cookies</h3>
<p>We use cookies to enhance your browsing experience, remember your cart, and analyse website traffic. You can disable cookies in your browser settings, though some features of the site may not function correctly without them.</p>
<h3>5. Your Rights (under DPDP Act, India)</h3>
<p>Under the Digital Personal Data Protection Act (DPDP Act, 2023), you have the right to:</p>
<ul>
<li>Access the personal data we hold about you.</li>
<li>Correct inaccurate or incomplete data.</li>
<li>Request deletion of your data (subject to legal retention requirements).</li>
<li>Withdraw consent for marketing communications at any time.</li>
</ul>
<p>To exercise any of these rights, email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a>.</p>
<h3>6. Data Security</h3>
<p>We implement industry-standard security measures including SSL encryption to protect your data. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>
<h3>7. Data Retention</h3>
<p>We retain your personal data only for as long as necessary to fulfil the purposes outlined in this policy, or as required by law. Order-related data is typically retained for 3 years for accounting and legal purposes.</p>
<h3>8. Changes to This Policy</h3>
<p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised date. Continued use of our website after changes constitutes acceptance of the updated policy.</p>
<h3>9. Contact Us</h3>
<p>For any privacy-related questions or requests, please email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a> or write to us at: 300ml Tea, Delhi, India.</p>$policy_privacy$)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_content (key, value) VALUES ('terms_of_service', $policy_terms$<p>Last updated: June 2025</p>
<p>Please read these Terms of Service carefully before placing an order or using the 300ml Tea website. By accessing our website or purchasing our products, you agree to be bound by these terms.</p>
<h3>1. About Us</h3>
<p>300ml Tea is an Indian direct-to-consumer brand selling pre-measured raw chai sachets (tea powder, sugar, and chai masala). Our website is operated from Delhi, India.</p>
<h3>2. Eligibility</h3>
<p>You must be at least 18 years of age to place an order on our website. By using this site, you confirm that you meet this requirement.</p>
<h3>3. Products</h3>
<p>All product images and descriptions on our website are for illustrative purposes. We make every effort to display product details accurately, but slight variations in colour or packaging may occur. Products are subject to availability.</p>
<h3>4. Pricing</h3>
<p>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We reserve the right to change prices at any time without prior notice. The price applicable at the time of your order placement will be honoured.</p>
<h3>5. Orders &amp; Payments</h3>
<ul>
<li>Orders are confirmed only upon successful payment (prepaid) or order acceptance (COD).</li>
<li>We accept UPI, net banking, debit/credit cards, and Cash on Delivery (COD) where available.</li>
<li>300ml Tea is not responsible for payment failures caused by your bank or payment gateway.</li>
</ul>
<h3>6. Shipping &amp; Delivery</h3>
<p>We aim to deliver orders within the timelines specified in our Shipping Policy. Delivery timelines are estimates and may vary. We are not liable for delays caused by courier partners, natural events, or incorrect addresses provided by the customer.</p>
<h3>7. Cancellations, Returns &amp; Refunds</h3>
<p>Please refer to our <a href="/return-policy">Return Policy</a> and <a href="/refund-policy">Refund Policy</a> for full details on cancellations, returns, and refund processes.</p>
<h3>8. Intellectual Property</h3>
<p>All content on this website — including brand name, logo, product names, text, images, and designs — is the intellectual property of 300ml Tea and may not be reproduced, copied, or distributed without prior written consent.</p>
<h3>9. Limitation of Liability</h3>
<p>To the maximum extent permitted by Indian law, 300ml Tea shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid by you for the specific order in question.</p>
<h3>10. Governing Law</h3>
<p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Delhi, India.</p>
<h3>11. Changes to Terms</h3>
<p>We reserve the right to update these Terms of Service at any time. Continued use of our website after changes are posted constitutes your acceptance of the revised terms.</p>
<h3>12. Contact Us</h3>
<p>For any questions regarding these Terms, please email us at <a href="mailto:tcd@thechaidealer.com">tcd@thechaidealer.com</a>.</p>$policy_terms$)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET FOR SITE ASSETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_site_assets" ON storage.objects;
CREATE POLICY "public_read_site_assets" ON storage.objects FOR SELECT
TO anon, authenticated USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "auth_upload_site_assets" ON storage.objects;
CREATE POLICY "auth_upload_site_assets" ON storage.objects FOR INSERT
TO authenticated WITH CHECK (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "auth_update_site_assets" ON storage.objects;
CREATE POLICY "auth_update_site_assets" ON storage.objects FOR UPDATE
TO authenticated USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "auth_delete_site_assets" ON storage.objects;
CREATE POLICY "auth_delete_site_assets" ON storage.objects FOR DELETE
TO authenticated USING (bucket_id = 'site-assets');
