function normalizeChannel(raw) {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return 'Other';

  if (s.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('organic')) return 'Organic Search';
  if (s.includes('cpc') || s.includes('ppc') || s.includes('paid') || s.includes('ads') || s.includes('display') || s.includes('sem')) return 'Paid Ads';
  if (s.includes('facebook') || s.includes('instagram') || s.includes('linkedin') || s.includes('twitter') || s.includes('x.com') || s.includes('social')) return 'Social';
  if (s.includes('email') || s.includes('newsletter')) return 'Email';
  if (s.includes('(none)') || s === 'direct' || s.includes('direct')) return 'Direct';
  if (s.includes('referral') || s.includes('partner') || s.includes('affiliate')) return 'Referral';

  return 'Other';
}

module.exports = { normalizeChannel };