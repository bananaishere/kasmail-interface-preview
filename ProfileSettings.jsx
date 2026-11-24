import symbol from './public/assets/kasmail-symbol.webp';
import wordmark from './public/assets/kasmail-wordmark.png';
import motif from './public/assets/kasmail-brush-ka.png';
import {useLanguage} from './ui-language.jsx';
import React, { useRef, useState } from 'react';
import { Sun, Moon, UserCircle, Palette, IdentificationCard, Camera, Copy, DownloadSimple, Wallet, Globe, ImageSquare, Info, FloppyDisk } from '@phosphor-icons/react';
import { contactText, toVCard, validateProfile, downloadBlob } from './profile-model.mjs';

export function ProfileAvatar({ profile, className = '' }) {
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'K';
  return <span className={`profile-avatar ${className}`}>{profile.photo ? <img src={profile.photo} alt=""/> : <span>{initials}</span>}</span>;
}
export function ContactCard({ profile }) {
  const {t}=useLanguage();
  return <article className="contact-card" aria-label={t("Pré-visualização do cartão de contacto")}>
    <header className="contact-card-brand"><span className="card-symbol"><img src={symbol} alt=""/></span><img className="card-wordmark" src={wordmark} alt="K@sMail"/><span>{t("CONTACTO")}</span></header>
    <div className="card-person"><ProfileAvatar profile={profile}/><div><h3>{profile.name.trim() || t("O teu nome")}</h3><p>{profile.domain.trim() || t("O teu domínio .kas")}</p></div></div>
    {profile.bio.trim() && <p className="card-bio">{profile.bio}</p>}
    {profile.website.trim() && <p className="card-detail"><Globe size={15}/><span>{profile.website.replace(/^https:\/\//, '')}</span></p>}
    {profile.shareWallet && profile.wallet.trim() && <p className="card-detail card-wallet"><Wallet size={15}/><span>{profile.wallet}</span></p>}
    <footer>{t("Vamos conversar no Kasmail.")}</footer>
  </article>;
}

const loadImage = src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = src; });
async function exportCardImage(profile) {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 760;
  const ctx = canvas.getContext('2d');
  const [symbol, wordmark, motif, photo] = await Promise.all([loadImage(symbol), loadImage(wordmark), loadImage(motif), profile.photo ? loadImage(profile.photo) : null]);
  ctx.fillStyle = '#173641'; ctx.fillRect(0, 0, 1200, 760);
  ctx.globalAlpha = .065; ctx.drawImage(motif, 790, 100, 430, 500); ctx.globalAlpha = 1;
  ctx.save(); ctx.beginPath(); ctx.arc(78, 77, 34, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(symbol, 170, 170, 684, 684, 44, 43, 68, 68); ctx.restore();
  ctx.drawImage(wordmark, 124, 20, 190, 95);
  ctx.fillStyle = '#afcbd4'; ctx.font = '500 19px Segoe UI, Arial'; ctx.fillText('CONTACTO', 1010, 81);
  ctx.fillStyle = '#315461'; ctx.beginPath(); ctx.arc(112, 264, 68, 0, Math.PI * 2); ctx.fill();
  if (photo) { const side = Math.min(photo.width, photo.height); ctx.save(); ctx.beginPath(); ctx.arc(112, 264, 68, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(photo, (photo.width-side)/2, (photo.height-side)/2, side, side, 44, 196, 136, 136); ctx.restore(); }
  else { ctx.fillStyle = '#d0f1f4'; ctx.font = '600 46px Segoe UI, Arial'; ctx.textAlign = 'center'; ctx.fillText(profile.name.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase(), 112, 280); ctx.textAlign = 'left'; }
  function wrapped(text, x, y, width, lineHeight, maxLines) {
    let line = '', lines = [];
    for (const char of Array.from(text)) { if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = char; } else line += char; }
    if (line) lines.push(line);
    if (lines.length > maxLines) lines = lines.slice(0, maxLines).map((l,i)=>i===maxLines-1?l.slice(0,-2)+'…':l);
    lines.forEach((value, i) => ctx.fillText(value, x, y+i*lineHeight)); return y + lines.length*lineHeight;
  }
  ctx.fillStyle = '#f0f7fa'; ctx.font = '600 44px Segoe UI, Arial'; wrapped(profile.name.trim(), 218, 253, 890, 49, 2);
  ctx.fillStyle = '#91d6df'; ctx.font = '400 30px Segoe UI, Arial'; ctx.fillText(profile.domain.trim(), 218, 331, 880);
  let y = 420;
  ctx.fillStyle = '#d2e1e7'; ctx.font = '400 26px Segoe UI, Arial';
  if (profile.bio.trim()) y = wrapped(profile.bio.trim(), 48, y, 1080, 38, 3) + 18;
  ctx.font = '400 22px Segoe UI, Arial'; ctx.fillStyle = '#adc6d0';
  if (profile.website.trim()) { ctx.fillText(profile.website.trim(), 48, y, 1100); y += 40; }
  if (profile.shareWallet && profile.wallet.trim()) wrapped(profile.wallet.trim(), 48, y, 1100, 30, 2);
  ctx.strokeStyle = '#365561'; ctx.beginPath(); ctx.moveTo(48, 675); ctx.lineTo(1152, 675); ctx.stroke();
  ctx.font = '400 22px Segoe UI, Arial'; ctx.fillStyle = '#a3bfc9'; ctx.fillText('Vamos conversar no Kasmail.', 48, 720);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('export');
  downloadBlob(blob, 'kasmail-cartao.png');
}

export function ProfileSettings({ profile, save, close, theme, setTheme, notify, backup }) {
  const {t}=useLanguage();
  const [draft, setDraft] = useState(profile), [tab, setTab] = useState('profile'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const photoInput = useRef(null);
  const change = (key, value) => { setDraft(p => ({ ...p, [key]: value })); setError(''); };
  const valid = () => { const message = validateProfile(draft); setError(message); if (message) setTab('profile'); return !message; };
  const saveProfile = () => { if (valid()) save({ ...draft, name: draft.name.trim(), domain: draft.domain.trim(), wallet: draft.wallet.trim(), bio: draft.bio.trim(), website: draft.website.trim() }); };
  const selectPhoto = event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1500000) { setError(t("Escolhe uma fotografia PNG, JPG ou WebP até 1,5 MB.")); return; }
    const reader = new FileReader(); reader.onload = async () => { try { await loadImage(String(reader.result)); change('photo', String(reader.result)); } catch { setError(t("O ficheiro não contém uma imagem válida.")); } }; reader.onerror = () => setError(t("Não foi possível ler a fotografia.")); reader.readAsDataURL(file);
  };
  const exportPNG = async () => { if (!valid()) return; setBusy(true); try { await exportCardImage(draft); notify(t("Imagem do cartão descarregada.")); } catch { setError(t("Não foi possível criar a imagem. Podes descarregar o contacto .vcf.")); } finally { setBusy(false); } };
  const copy = async () => { if (!valid()) return; try { await navigator.clipboard.writeText(contactText(draft)); notify(t("Dados do cartão copiados.")); } catch { setError(t("Não foi possível copiar. Usa uma das opções de descarga.")); } };
  const preview = <div className="settings-preview"><span className="section-eyebrow">{t("O TEU CARTÃO")}</span><ContactCard profile={draft}/><p>{t("Pré-visualização com os dados que escolheste partilhar.")}</p></div>;
  const tabs = [['profile', t('Perfil'), UserCircle], ['appearance', t('Aparência'), Palette], ['card', t('Cartão de contacto'), IdentificationCard], ['backup', 'Backup', FloppyDisk]];
  return <div className="profile-settings">
    <div className="settings-tabs" role="tablist" aria-label={t("Definições")}>
      {tabs.map(([id,label,Icon]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab===id} aria-controls={`panel-${id}`} onClick={()=>{setTab(id);setError('');}}><Icon size={20}/>{label}</button>)}
    </div>
    <div className="settings-scroll" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab==='profile' && <div className="settings-columns"><div className="profile-fields"><h3>{t("Um perfil que é teu.")}</h3><p className="settings-intro">{t("Escolhe como te apresentas aos teus contactos.")}</p>
        <div className="photo-editor"><ProfileAvatar profile={draft}/><div><input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={selectPhoto} hidden/><button className="secondary small" onClick={()=>photoInput.current.click()}><Camera size={18}/>{t("Adicionar fotografia")}</button>{draft.photo&&<button className="text-button" onClick={()=>change('photo','')}>{t("Remover fotografia")}</button>}<small>{t("PNG, JPG ou WebP · até 1,5 MB")}</small></div></div>
        <label className="settings-field">{t("Nome de apresentação")}<input value={draft.name} maxLength={80} onChange={e=>change('name',e.target.value)} placeholder={t("O teu nome")}/></label>
        <label><input type="checkbox" checked={draft.shareInMail === true} onChange={e=>change('shareInMail',e.target.checked)}/> {t("Mostrar o meu nome e fotografia nos emails que envio")}</label>
        <label className="settings-field">{t("Domínio Kaspa")}<input value={draft.domain} maxLength={80} onChange={e=>change('domain',e.target.value)} placeholder={t("nome.k ou nome.kas")} spellCheck="false"/><small>{t("Introduzido por ti. A propriedade do domínio ainda não é verificada.")}</small></label>
        <label className="settings-field">{t("Carteira Kaspa")+' '}<span className="optional">{t("opcional")}</span><input value={draft.wallet} maxLength={160} onChange={e=>change('wallet',e.target.value)} placeholder="kaspa:…" spellCheck="false"/><small>{t("Endereço manual para o cartão de contacto. Para ligar e verificar uma carteira, usa o botão Carteira na barra superior.")}</small></label>
        <label className="settings-field">{t("Sobre ti")+' '}<span className="optional">{t("opcional")}</span><textarea value={draft.bio} maxLength={200} onChange={e=>change('bio',e.target.value)} placeholder={t("Uma pequena apresentação…")} rows={3}/></label>
        <label className="settings-field">Website <span className="optional">{t("opcional")}</span><input value={draft.website} maxLength={160} onChange={e=>change('website',e.target.value)} placeholder="https://…"/></label>
      </div>{preview}</div>}
      {tab==='appearance' && <div className="appearance-content">
        <fieldset className="appearance-section"><legend>{t("Tema")}</legend><div className="theme-choices">{[['light',t("Claro"),t("Leve, luminoso e tranquilo."),Sun],['dark',t("Escuro"),t("Azul-petróleo para o fim do dia."),Moon]].map(([id,label,description,Icon])=><button key={id} aria-pressed={theme===id} onClick={()=>setTheme(id)}><Icon size={26}/><strong>{label}</strong><small>{description}</small></button>)}</div></fieldset>
      </div>}
      {tab==='card' && <div className="settings-columns card-sharing">{preview}<div><h3>{t("Uma boa primeira impressão.")}</h3><p className="settings-intro">{t("Partilha o teu contacto com a identidade do Kasmail.")}</p><label className="settings-check"><input type="checkbox" checked={draft.shareWallet} onChange={e=>change('shareWallet',e.target.checked)}/><span><strong>{t("Incluir carteira no cartão")}</strong><small>{t("O endereço só é incluído se estiver preenchido.")}</small></span></label><div className="share-card-actions"><button className="primary" onClick={exportPNG} disabled={busy}><ImageSquare size={20}/>{busy?t("A criar imagem…"):t("Descarregar imagem")}</button><button className="secondary" onClick={()=>{if(valid()){downloadBlob(new Blob([toVCard(draft)],{type:'text/vcard;charset=utf-8'}),'kasmail-contacto.vcf');notify(t("Contacto .vcf descarregado."));}}}><DownloadSimple size={20}/>{t("Descarregar contacto .vcf")}</button><button className="secondary" onClick={copy}><Copy size={20}/>{t("Copiar dados do cartão")}</button></div><p className="settings-local-note">{t("A imagem preserva o design do cartão. O ficheiro .vcf permite guardar os dados numa aplicação de contactos.")}</p></div></div>}
      {tab==='backup' && backup}
      {error&&<p className="settings-error" role="alert"><Info size={18}/>{t(error)}</p>}
    </div>
    <footer className="settings-footer"><span>{t("Só neste navegador.")}</span><div>
      <button className="secondary" onClick={close}>{tab==='appearance'||tab==='backup'?'Fechar':t("Cancelar")}</button>
      {(tab==='profile'||tab==='card')&&<button className="primary" onClick={saveProfile}>{t("Guardar perfil")}</button>}
    </div></footer>
  </div>;
}
