'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url';
  placeholder?: string;
}

interface MediaField {
  key: string;
  label: string;
  accept: string;
}

const TEXT_FIELDS: ContentField[] = [
  { key: 'hero_tagline', label: 'Hero Tagline', type: 'text', placeholder: 'Real chai. Exact proportions...' },
  { key: 'hero_headline', label: 'Hero Headline', type: 'text', placeholder: 'A Tribute to Ma' },
  { key: 'hero_description', label: 'Hero Description', type: 'textarea', placeholder: 'Tea powder, sugar & chai masala...' },
  { key: 'stats_raw_ingredients', label: 'Stat: Raw Ingredients', type: 'text', placeholder: '3' },
  { key: 'stats_additives', label: 'Stat: Artificial Additives', type: 'text', placeholder: '0' },
  { key: 'stats_brew_time', label: 'Stat: Brew Time', type: 'text', placeholder: '5:30' },
  { key: 'contact_phone', label: 'Contact Phone', type: 'text', placeholder: '+91 70424 01496' },
  { key: 'contact_email', label: 'Contact Email', type: 'text', placeholder: 'tcd@thechaidealer.com' },
  { key: 'contact_instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/300mltea' },
];

const POLICY_FIELDS: ContentField[] = [
  { key: 'shipping_policy', label: 'Shipping Policy', type: 'textarea' },
  { key: 'return_policy', label: 'Return Policy', type: 'textarea' },
  { key: 'refund_policy', label: 'Refund Policy', type: 'textarea' },
  { key: 'privacy_policy', label: 'Privacy Policy', type: 'textarea' },
  { key: 'terms_of_service', label: 'Terms of Service', type: 'textarea' },
];

const MEDIA_FIELDS: MediaField[] = [
  { key: 'product_image_url', label: 'Product Image', accept: 'image/jpeg,image/png,image/webp' },
];

function FieldEditor({ field, initialValue }: { field: ContentField; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setSaving(true);
    setErr('');
    const { error } = await supabase
      .from('site_content')
      .upsert({ key: field.key, value, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) {
      setErr('Save failed. Please try again.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1C0F0A', marginBottom: 8 }}>
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={field.key.includes('policy') || field.key.includes('terms') ? 12 : 4}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1.5px solid #e5ddd8',
            fontSize: 13,
            fontFamily: 'monospace',
            resize: 'vertical',
            boxSizing: 'border-box',
            lineHeight: 1.6,
          }}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={field.placeholder}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 8,
            border: '1.5px solid #e5ddd8',
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            background: saved ? '#16a34a' : '#C8522A',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
        </button>
        {err && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#dc2626', fontSize: 13 }}>
            <AlertCircle size={14} /> {err}
          </span>
        )}
      </div>
    </div>
  );
}

function MediaUploader({ mediaKey, label, currentUrl }: { mediaKey: string; label: string; currentUrl: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr('');
    setSuccess('');

    if (file.size > 5 * 1024 * 1024) { setErr('File exceeds 5MB limit.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setErr('Only JPG, PNG, or WebP allowed.'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${mediaKey}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true });
    if (uploadErr) { setErr('Upload failed: ' + uploadErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase
      .from('site_content')
      .upsert({ key: mediaKey, value: publicUrl, updated_at: new Date().toISOString() });

    setUploading(false);
    if (dbErr) { setErr('Uploaded but failed to save URL.'); return; }

    setPreviewUrl(publicUrl);
    setSuccess('Uploaded and saved successfully!');
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1C0F0A', marginBottom: 12 }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {previewUrl && (
          <div>
            <div style={{ fontSize: 11, color: '#9a8578', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Current</div>
            <img
              src={previewUrl}
              alt={label}
              style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5ddd8', background: '#f9f5f2' }}
            />
          </div>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: '#C8522A',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              marginBottom: 8,
            }}
          >
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload New Image'}
          </button>
          <div style={{ fontSize: 12, color: '#9a8578' }}>Max 5MB · JPG, PNG, WebP</div>
          {err && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{err}</div>}
          {success && <div style={{ color: '#16a34a', fontSize: 13, marginTop: 6 }}>{success}</div>}
        </div>
      </div>
    </div>
  );
}

export default function ContentEditorTab() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allKeys = [...TEXT_FIELDS, ...POLICY_FIELDS].map((f) => f.key).concat(MEDIA_FIELDS.map((f) => f.key));
    supabase
      .from('site_content')
      .select('key, value')
      .in('key', allKeys)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row) => { map[row.key] = row.value; });
          setValues(map);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: 40, color: '#6b5c54', textAlign: 'center' }}>Loading content...</div>;
  }

  return (
    <div>
      <section style={{ marginBottom: 48 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C0F0A', marginBottom: 20, paddingBottom: 10, borderBottom: '2px solid #f0e9e4' }}>
          General Content
        </h3>
        {TEXT_FIELDS.map((field) => (
          <FieldEditor key={field.key} field={field} initialValue={values[field.key] ?? ''} />
        ))}
      </section>

      <section style={{ marginBottom: 48 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C0F0A', marginBottom: 8, paddingBottom: 10, borderBottom: '2px solid #f0e9e4' }}>
          Policy Pages
        </h3>
        <p style={{ fontSize: 13, color: '#9a8578', marginBottom: 20 }}>
          Content supports HTML. Changes go live immediately on public pages.
        </p>
        {POLICY_FIELDS.map((field) => (
          <FieldEditor key={field.key} field={field} initialValue={values[field.key] ?? ''} />
        ))}
      </section>

      <section>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C0F0A', marginBottom: 8, paddingBottom: 10, borderBottom: '2px solid #f0e9e4' }}>
          Media Management
        </h3>
        <p style={{ fontSize: 13, color: '#9a8578', marginBottom: 24 }}>
          Upload replaces the image on the live site immediately.
        </p>
        {MEDIA_FIELDS.map((mf) => (
          <MediaUploader key={mf.key} mediaKey={mf.key} label={mf.label} currentUrl={values[mf.key] ?? ''} />
        ))}
      </section>
    </div>
  );
}
