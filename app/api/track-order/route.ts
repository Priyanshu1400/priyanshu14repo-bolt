import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const AWB_RE = /^[a-zA-Z0-9_-]{1,100}$/;

const FASTRR_URLS = [
  'https://fastrr-api.pickrr.com/api/v1/custom-platform-order/details',
  'https://fastrr-api-dev.pickrr.com/api/v1/custom-platform-order/details',
  'https://checkout-api.shiprocket.com/api/v1/custom-platform-order/details',
];

const STEP_LABELS = [
  'Order Placed',
  'Preparing Your Order',
  'Shipped',
  'Out For Delivery',
  'Delivered',
];

const HEADLINES = [
  'Your order has been placed',
  'Your order is being prepared',
  'Your order has been shipped',
  'Your order is out for delivery',
  'Your order has been delivered',
];

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : null;
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

function pick(source: Json | null, keys: string[]): unknown {
  if (!source) return undefined;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      return source[key];
    }
  }
  return undefined;
}

function unwrapOrder(payload: unknown): Json | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested =
    asRecord(root.data) ||
    asRecord(root.result) ||
    asRecord(root.order) ||
    asRecord(asRecord(root.data)?.order) ||
    asRecord(asRecord(root.result)?.order);
  return nested || root;
}

function formatDate(value: unknown, withTime = false): string {
  const raw = asString(value);
  if (!raw) return '';
  const date = new Date(raw.includes('T') || raw.includes('-') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return raw;
  const day = date.getDate();
  const month = date.toLocaleString('en-IN', { month: 'long' });
  const year = date.getFullYear();
  if (!withTime) return `${day} ${month}, ${year}`;
  const time = date
    .toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, '')
    .replace(/am/i, 'AM')
    .replace(/pm/i, 'PM');
  return `${day} ${month}, ${time}`;
}

function formatTimeOnly(value: unknown): string {
  const raw = asString(value);
  if (!raw) return '';
  const date = new Date(raw.includes('T') || raw.includes('-') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return '';
  return date
    .toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, '')
    .toUpperCase()
    .replace('AM', 'AM')
    .replace('PM', 'PM');
}

function mapCurrentStep(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('cancel') || s.includes('rto') || s.includes('fail') || s.includes('lost')) return 0;
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for delivery') || s.includes('ofd') || /\bofd\b/.test(s)) return 3;
  if (s.includes('ship') || s.includes('transit') || s.includes('dispatch') || s.includes('in-transit')) return 2;
  if (
    s.includes('prepar') ||
    s.includes('process') ||
    s.includes('pickup') ||
    s.includes('picked') ||
    s.includes('pack') ||
    s.includes('manifest') ||
    s.includes('ready to ship')
  ) return 1;
  return 0;
}

function activityText(activity: Json): string {
  return [
    asString(activity.activity),
    asString(activity.status),
    asString(activity['sr-status-label']),
    asString(activity.status_label),
    asString(activity.sr_status_label),
    asString(activity.message),
  ]
    .join(' ')
    .toLowerCase();
}

function activityDate(activity: Json): string {
  return asString(activity.date) || asString(activity.event_time) || asString(activity.timestamp) || asString(activity.created_at);
}

function stepFromActivity(activity: Json): number {
  const text = activityText(activity);
  if (text.includes('deliver') && !text.includes('out')) return 4;
  if (text.includes('out for delivery') || text.includes('ofd')) return 3;
  if (text.includes('ship') || text.includes('transit') || text.includes('dispatch')) return 2;
  if (text.includes('pickup') || text.includes('picked') || text.includes('process') || text.includes('pack') || text.includes('manifest')) return 1;
  if (text.includes('order') || text.includes('placed') || text.includes('booked') || text.includes('created') || text.includes('confirmed')) return 0;
  return -1;
}

function collectActivities(order: Json): Json[] {
  const tracking = asRecord(order.tracking_data) || asRecord(order.tracking);
  const lists = [
    order.shipment_track_activities,
    tracking?.shipment_track_activities,
    order.scans,
    order.activities,
    order.status_history,
    order.history,
  ];
  const out: Json[] = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const rec = asRecord(item);
      if (rec) out.push(rec);
    }
  }
  return out;
}

function buildSteps(order: Json) {
  const times = ['', '', '', '', ''];
  const created =
    pick(order, ['created_at', 'order_date', 'placed_at', 'createdAt']) ||
    asRecord(order.order)?.created_at;
  if (created) times[0] = formatDate(created, true);

  for (const activity of collectActivities(order)) {
    const step = stepFromActivity(activity);
    const when = formatDate(activityDate(activity), true);
    if (step >= 0 && when && !times[step]) times[step] = when;
  }

  return STEP_LABELS.map((label, index) => ({
    label,
    time: times[index] || 'Pending',
  }));
}

function formatAddress(order: Json): string {
  const shipping =
    asRecord(order.shipping_address) ||
    asRecord(order.delivery_address) ||
    asRecord(order.address) ||
    asRecord(order.customer_address) ||
    asRecord(asRecord(order.customer)?.address);
  if (!shipping) {
    return asString(order.shipping_address) || asString(order.delivery_address) || '';
  }
  const parts = [
    pick(shipping, ['address', 'address_1', 'line1', 'street']),
    pick(shipping, ['address_2', 'line2', 'landmark']),
    pick(shipping, ['city']),
    pick(shipping, ['state']),
    pick(shipping, ['pincode', 'zip', 'postal_code']),
    pick(shipping, ['country']),
  ]
    .map(asString)
    .filter(Boolean);
  return parts.join('\n');
}

function paymentLabel(order: Json): string {
  const raw = asString(
    pick(order, ['payment_type', 'payment_method', 'payment_status', 'payment_mode'])
  );
  const s = raw.toLowerCase();
  if (s.includes('cod') || s.includes('cash')) return 'Cash on Delivery';
  if (s.includes('paid') || s.includes('prepaid') || s.includes('online') || s.includes('success')) {
    return raw || 'Paid';
  }
  return raw || '—';
}

function isNotFound(payload: unknown, status: number): boolean {
  if (status === 404) return true;
  const root = asRecord(payload);
  const message = asString(root?.error || root?.message || asRecord(root?.data)?.error).toLowerCase();
  if (message.includes('not found') || message.includes('no order') || message.includes('invalid')) return true;
  const order = unwrapOrder(payload);
  if (!order) return true;
  const hasIdentity = Boolean(
    pick(order, ['order_id', 'awb', 'awb_code', 'shipment_id', 'status', 'current_status'])
  );
  return !hasIdentity;
}

async function fetchFastrrDetails(id: string): Promise<{ status: number; payload: unknown; ok: boolean }> {
  const apiKey = process.env.SHIPROCKET_API_KEY;
  const secret = process.env.SHIPROCKET_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new Error('missing_keys');
  }

  const bodies = [
    JSON.stringify({ order_id: id, timestamp: new Date().toISOString() }),
    JSON.stringify({ awb: id, timestamp: new Date().toISOString() }),
  ];

  let lastStatus = 500;
  let lastPayload: unknown = null;

  for (const url of FASTRR_URLS) {
    for (const bodyString of bodies) {
      const hmacSignature = createHmac('sha256', secret).update(bodyString).digest('base64');
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey,
            'X-Api-HMAC-SHA256': hmacSignature,
          },
          body: bodyString,
        });
        const payload = await response.json().catch(() => null);
        lastStatus = response.status;
        lastPayload = payload;
        if (response.ok && payload && !isNotFound(payload, response.status)) {
          return { status: response.status, payload, ok: true };
        }
      } catch {
        lastStatus = 500;
      }
    }
  }

  return { status: lastStatus, payload: lastPayload, ok: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const awb = asString(body.awb || body.order_id);

    if (!awb || !AWB_RE.test(awb)) {
      return NextResponse.json(
        { error: 'Please enter a valid Order ID / AWB number.', retryable: false },
        { status: 400 }
      );
    }

    const fetched = await fetchFastrrDetails(awb);
    if (!fetched.ok) {
      if (fetched.status >= 500 || fetched.status === 0) {
        return NextResponse.json(
          { error: 'Tracking is temporarily unavailable. Please try again in a moment.', retryable: true },
          { status: 500 }
        );
      }
      return NextResponse.json(
        {
          error: 'We could not find a shipment for that Order ID / AWB number. Please check the number and try again.',
          retryable: false,
        },
        { status: 404 }
      );
    }

    const order = unwrapOrder(fetched.payload);
    if (!order || isNotFound(fetched.payload, fetched.status)) {
      return NextResponse.json(
        { error: 'We could not find a shipment for that Order ID / AWB number. Please check the number and try again.', retryable: false },
        { status: 404 }
      );
    }

    const tracking = asRecord(order.tracking_data) || asRecord(order.tracking);
    const shipmentTrack = Array.isArray(tracking?.shipment_track)
      ? asRecord(tracking?.shipment_track[0])
      : asRecord(order.shipment_track) || asRecord(Array.isArray(order.shipment_track) ? order.shipment_track[0] : null);

    const status = asString(
      pick(order, ['current_status', 'status', 'shipment_status', 'order_status']) ||
        shipmentTrack?.current_status
    );
    const currentStep = mapCurrentStep(status);
    const edd =
      pick(order, ['edd', 'estimated_delivery', 'estimated_delivery_date', 'etd']) ||
      shipmentTrack?.edd;
    const total =
      asNumber(pick(order, ['total_amount_payable', 'total', 'amount', 'total_amount', 'paid_amount'])) ?? 0;
    const customer = asRecord(order.customer) || asRecord(order.customer_details) || order;
    const cartData = asRecord(order.cart_data);
    const cartItems = Array.isArray(order.items)
      ? order.items
      : Array.isArray(cartData?.items)
        ? cartData?.items
        : [];
    const productItem = asRecord(cartItems?.[0]);

    const quantity = asNumber(pick(productItem || {}, ['quantity', 'qty'])) ?? 1;
    const price = asNumber(pick(productItem || {}, ['price', 'unit_price'])) ?? 160;
    const invoiceUrl = asString(
      pick(order, ['invoice_url', 'invoice', 'invoice_link']) ||
        pick(asRecord(order.documents) || {}, ['invoice'])
    );

    const lowerStatus = status.toLowerCase();
    const cancelled = lowerStatus.includes('cancel') || lowerStatus.includes('fail') || lowerStatus.includes('rto');

    return NextResponse.json({
      awb: asString(pick(order, ['awb', 'awb_code']) || shipmentTrack?.awb_code) || awb,
      headline: cancelled
        ? 'We could not complete this shipment'
        : HEADLINES[currentStep],
      status: status || STEP_LABELS[currentStep],
      currentStep,
      estimatedDelivery: edd
        ? {
            date: formatDate(edd, false).replace(',', ''),
            time: formatTimeOnly(edd) ? `by ${formatTimeOnly(edd)}` : '',
          }
        : null,
      steps: buildSteps(order),
      orderId: asString(pick(order, ['order_id', 'channel_order_id', 'id'])) || awb,
      orderDate: formatDate(pick(order, ['created_at', 'order_date', 'placed_at']), false) || '—',
      totalPaid: `Rs. ${total}`,
      paymentStatus: paymentLabel(order),
      product: {
        name: asString(pick(productItem || {}, ['name', 'product_name', 'title'])) || '300ml Tea – Adrak & Elaichi',
        sachets: '(10 Sachets)',
        price: `Rs. ${price}`,
        quantity,
        image: asString(pick(productItem || {}, ['image', 'image_url'])) || '/figma-home/product-box.png',
        invoiceUrl,
      },
      deliveryAddress: formatAddress(order) || 'Delivery address is not available yet.',
      contact: {
        name: asString(pick(asRecord(customer) || order, ['name', 'customer_name', 'consignee_name', 'first_name'])) || '—',
        mobile: asString(pick(asRecord(customer) || order, ['phone', 'mobile', 'customer_phone'])) || '—',
        email: asString(pick(asRecord(customer) || order, ['email', 'customer_email'])) || '—',
      },
    });
  } catch (err) {
    console.error('[track-order]', err);
    return NextResponse.json(
      { error: 'Tracking is temporarily unavailable. Please try again in a moment.', retryable: true },
      { status: 500 }
    );
  }
}
