export const defaultProfile = { name: 'João', domain: 'joao.kas', wallet: '', bio: '', website: '', photo: '', shareWallet: false };
export const defaultPreferences = { view: 'list', font: 'modern', summaries: true };
export const validDomain = value => /^[\p{L}\p{N}](?:[\p{L}\p{N}.-]*[\p{L}\p{N}])?\.(?:kas|k)$/u.test(value);
export function readLocal(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
}
export function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function loadProfile({demo=true}={}) {
  const stored = readLocal('kasmail-profile', {});
  const profile = demo ? {...defaultProfile} : {...defaultProfile,name:'',domain:''};
  for (const key of ['name', 'domain', 'wallet', 'bio', 'website']) if (typeof stored?.[key] === 'string') profile[key] = stored[key].slice(0, key === 'bio' ? 200 : 160);
  if (typeof stored?.photo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(stored.photo) && stored.photo.length < 2200000) profile.photo = stored.photo;
  profile.shareWallet = stored?.shareWallet === true;
  profile.shareInMail = stored?.shareInMail === true;
  return profile;
}
export function loadPreferences() {
  const value = readLocal('kasmail-preferences', {});
  return { view: ['list', 'grid', 'compact'].includes(value?.view) ? value.view : 'list', font: ['modern', 'classic', 'reading'].includes(value?.font) ? value.font : 'modern', summaries: value?.summaries !== false };
}
export function validateProfile(profile) {
  if (!profile.name.trim()) return 'Escreve o teu nome.';
  if (profile.domain.trim() && !validDomain(profile.domain.trim())) return 'Usa um domínio com o formato nome.k ou nome.kas.';
  if (profile.website.trim()) { try { if (new URL(profile.website).protocol !== 'https:') throw new Error(); } catch { return 'O website deve começar por https://.'; } }
  if (profile.wallet.trim() && !profile.wallet.trim().startsWith('kaspa:')) return 'O endereço da carteira deve começar por kaspa:. A titularidade não é verificada nesta versão.';
  return '';
}
export function contactText(profile) {
  return [profile.name.trim(), profile.domain.trim(), profile.bio.trim(), profile.website.trim(), profile.shareWallet && profile.wallet.trim() ? `Carteira Kaspa: ${profile.wallet.trim()}` : ''].filter(Boolean).join('\n');
}
const escapeVCard = value => String(value).replaceAll('\\', '\\\\').replace(/\r\n|\r|\n/g, '\\n').replaceAll(';', '\\;').replaceAll(',', '\\,');
export function toVCard(profile) {
  const lines = ['BEGIN:VCARD', 'VERSION:4.0', `FN:${escapeVCard(profile.name.trim())}`];
  if (profile.domain.trim()) lines.push(`X-KASPA-DOMAIN:${escapeVCard(profile.domain.trim())}`);
  if (profile.bio.trim()) lines.push(`NOTE:${escapeVCard(profile.bio.trim())}`);
  if (profile.website.trim()) lines.push(`URL:${escapeVCard(profile.website.trim())}`);
  if (profile.shareWallet && profile.wallet.trim()) lines.push(`X-KASPA-ADDRESS:${escapeVCard(profile.wallet.trim())}`);
  lines.push('END:VCARD');
  const encoder = new TextEncoder();
  const folded = lines.flatMap(line => {
    const parts = []; let current = '';
    for (const char of Array.from(line)) {
      if (encoder.encode(current + char).length > 75) { parts.push(current); current = ' ' + char; }
      else current += char;
    }
    parts.push(current); return parts;
  });
  return folded.join('\r\n') + '\r\n';
}
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
