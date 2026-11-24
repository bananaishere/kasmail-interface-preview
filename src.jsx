import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowBendUpLeft, ArrowDown, ArrowDownLeft, ArrowRight, ArrowUpRight, Bell, CalendarBlank,
  CaretLeft, CaretRight, Check, Flag, Folder, GearSix,
  Gauge, MagnifyingGlass, PaperPlaneTilt, PencilSimple, Plus, SlidersHorizontal,
  Tray, Trash, Wallet, X,
} from '@phosphor-icons/react';
import { RouteCanvas, routeDuration } from './RouteCanvas.jsx';
import { dateKey, formatDate, initial, matchesMail, nodes, shiftDay, wallets } from './preview-data.mjs';
import { ProfileAvatar, ProfileSettings } from './ProfileSettings.jsx';
import { loadProfile, readLocal, saveLocal } from './profile-model.mjs';
import { LanguageProvider } from './ui-language.jsx';
import wordmark from './public/assets/kasmail-wordmark.png';
import kaspaLogo from './public/assets/kaspa-official.png';
import './profile.css';
import './preview.css';

const storageKey = 'kasmail-local-design-preview-v1';
const nav = [
  ['home','Atividade',Gauge], ['inbox','Entrada',Tray], ['sent','Enviados',PaperPlaneTilt],
  ['drafts','Rascunhos',PencilSimple], ['spam','Spam',Flag], ['trash','Lixo',Trash],
];
const searchFields = [['all','Tudo'],['name','Nome do perfil'],['dotk','Domínio .k'],['dotkas','Domínio .kas'],['address','Carteira'],['words','Assunto e texto']];
const readData = () => {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (validData(data)) return data;
  } catch {}
  return { ...initial, tasks: [
    {id:'seed-note', day:dateKey(new Date()), text:'Responder ao Blockzero', done:false},
    {id:'seed-review', day:dateKey(new Date()), text:'Rever o novo painel de correio', done:true},
  ] };
};
function validData(data) {
  return Array.isArray(data?.categories) && data.categories.length<=150 &&
    data.categories.every(row=>typeof row?.id==='string' && typeof row.name==='string' && row.name.length<=36) &&
    Array.isArray(data.mail) && data.mail.length<=500 &&
    data.mail.every(row=>['id','name','domain','address','subject','body','time','folder','category'].every(key=>typeof row?.[key]==='string')) &&
    Array.isArray(data.tasks) && data.tasks.length<=500 &&
    data.tasks.every(row=>['id','day','text'].every(key=>typeof row?.[key]==='string') && typeof row.done==='boolean');
}

function Overlay({ title, close, children, wide = false }) {
  const dialog = useRef(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} className={wide?'profile-dialog':undefined} aria-label={title} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===dialog.current)close();}}>
    <section>
      <header className="dialog-head"><h2>{title}</h2><button type="button" className="icon" aria-label="Fechar" onClick={close}><X size={21}/></button></header>
      {children}
    </section>
  </dialog>;
}

function Agenda({ tasks, day, setDay, addTask, toggleTask, mail }) {
  const [mode,setMode]=useState('week');
  const [note,setNote]=useState('');
  const key=dateKey(day);
  const offset=(day.getDay()+6)%7;
  const monday=shiftDay(day,-offset);
  const first=new Date(day.getFullYear(),day.getMonth(),1);
  const start=shiftDay(first,-((first.getDay()+6)%7));
  const dayTasks=tasks.filter(task=>task.day===key);
  function move(amount){
    if(mode==='day'||mode==='week')setDay(shiftDay(day,amount*(mode==='week'?7:1)));
    else setDay(new Date(day.getFullYear()+(mode==='year'?amount:0),day.getMonth()+(mode==='month'?amount:0),1));
  }
  return <aside className="agenda panel">
    <header><span className="section-icon"><CalendarBlank size={20}/></span><div><h2>Agenda</h2><p>Notas e lembretes</p></div></header>
    <div className="segmented" aria-label="Vista da agenda">
      {[['day','Dia'],['week','Semana'],['month','Mês'],['year','Ano']].map(([id,label])=>
        <button key={id} type="button" aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}
    </div>
    <div className="month-row"><button type="button" className="icon" onClick={()=>move(-1)} aria-label="Período anterior"><CaretLeft size={16}/></button>
      <strong>{formatDate(day,mode==='year'?{year:'numeric'}:{month:'long',year:'numeric'})}</strong>
      <button type="button" className="icon" onClick={()=>move(1)} aria-label="Período seguinte"><CaretRight size={16}/></button></div>
    {mode==='week'&&<div className="week">{Array.from({length:7},(_,i)=>{
      const date=shiftDay(monday,i);
      return <button key={i} type="button" aria-pressed={dateKey(date)===key} onClick={()=>setDay(date)}>
        <small>{formatDate(date,{weekday:'short'}).replace('.','')}</small><strong>{date.getDate()}</strong>
      </button>;
    })}</div>}
    {mode==='month'&&<div className="month-grid">{Array.from({length:42},(_,i)=>{
      const date=shiftDay(start,i);
      return <button key={i} type="button" data-other={date.getMonth()!==day.getMonth()} aria-pressed={dateKey(date)===key} onClick={()=>setDay(date)}>{date.getDate()}</button>;
    })}</div>}
    {mode==='year'&&<div className="year-grid">{Array.from({length:12},(_,i)=><button key={i} type="button" aria-pressed={day.getMonth()===i}
      onClick={()=>{setDay(new Date(day.getFullYear(),i,1));setMode('month');}}>{formatDate(new Date(2026,i,1),{month:'short'})}</button>)}</div>}
    <div className="agenda-date"><p>{formatDate(day,{weekday:'long'})}</p><small>{formatDate(day,{day:'numeric',month:'long'})}</small></div>
    <div className="tasks">{dayTasks.length?dayTasks.map(task=>
      <label key={task.id} className={task.done?'done':''}><input type="checkbox" checked={task.done} onChange={()=>toggleTask(task.id)}/><span>{task.text}</span></label>
    ):<p className="quiet">Sem lembretes para este dia.</p>}</div>
    <form className="task-form" onSubmit={event=>{event.preventDefault();if(note.trim()){addTask(key,note.trim());setNote('');}}}>
      <input aria-label="Novo lembrete" maxLength={120} placeholder="Adicionar nota ou lembrete" value={note} onChange={event=>setNote(event.target.value)}/>
      <button className="icon" aria-label="Guardar lembrete" title="Guardar lembrete" type="submit" disabled={!note.trim()}><Plus size={19}/></button>
    </form>
    {mail&&<button className="outline remind" type="button" onClick={()=>addTask(key,'Responder: '+mail.subject)}><Bell size={16}/> Lembrar resposta</button>}
  </aside>;
}

function App() {
  const [data,setData]=useState(readData);
  const [profile,setProfile]=useState(()=>loadProfile({demo:false}));
  const [theme,setTheme]=useState(()=>readLocal('kasmail-preview-theme','light')==='dark'?'dark':'light');
  const [page,setPage]=useState('home');
  const [selected,setSelected]=useState('');
  const [query,setQuery]=useState('');
  const [criterion,setCriterion]=useState('all');
  const [filter,setFilter]=useState(false);
  const [dialog,setDialog]=useState('');
  const [wallet,setWallet]=useState('');
  const [node,setNode]=useState('blockzero');
  const [nodeType,setNodeType]=useState('public');
  const [pickerSearch,setPickerSearch]=useState('');
  const [host,setHost]=useState('');
  const [category,setCategory]=useState('');
  const [day,setDay]=useState(()=>new Date());
  const [pulse,setPulse]=useState(0);
  const [delivering,setDelivering]=useState(false);
  const deliveryTimer=useRef(null);
  const [toast,setToast]=useState('');
  const [draft,setDraft]=useState({to:'', subject:'', body:''});
  const activeNode=nodes.find(entry=>entry.id===node);
  const unread=data.mail.filter(mail=>mail.folder==='inbox'&&mail.unread).length;
  const incoming=data.mail.filter(mail=>mail.folder==='inbox');
  const searching=query.trim().length>0;
  const isHome=page==='home'&&!searching;
  const isCategory=page.startsWith('category:');
  const folderTitle=isCategory?data.categories.find(c=>c.id===page.slice(9))?.name:nav.find(row=>row[0]===page)?.[1];
  const visible=data.mail.filter(mail=>{
    if(searching){
      if(!['spam','trash'].includes(page)&&['spam','trash'].includes(mail.folder)) return false;
      if(['spam','trash'].includes(page)&&mail.folder!==page) return false;
      return matchesMail(mail,query,criterion);
    }
    return isCategory?mail.category===page.slice(9)&&!['spam','trash'].includes(mail.folder):mail.folder===page;
  });
  const message=visible.find(mail=>mail.id===selected);
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(data));}catch{}},[data]);
  useEffect(()=>{
    document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme;
    saveLocal('kasmail-preview-theme',theme);
  },[theme]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3800);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>()=>clearTimeout(deliveryTimer.current),[]);


  function navigate(target){setPage(target);setSelected('');setQuery('');}
  function updateMail(id,changes) {setData(current=>({...current,mail:current.mail.map(mail=>mail.id===id?{...mail,...changes}:mail)}));}
  function openMail(mail){setSelected(mail.id);if(mail.unread)updateMail(mail.id,{unread:false});}
  function moveMail(mail,folder){updateMail(mail.id,{folder});setSelected('');setToast(folder==='spam'?'Movido para Spam.':folder==='trash'?'Movido para o Lixo.':'Movido para a Entrada.');}
  function pilotMail(){
    if(delivering||!activeNode.online)return;
    const item={...initial.mail[0],id:crypto.randomUUID(), time:'Agora',subject:'Nova mensagem de demonstração',body:'O envelope chegou à Entrada pelo nó escolhido.',unread:true};
    setDelivering(true);
    setPulse(value=>value+1);
    deliveryTimer.current=setTimeout(()=>{
      setData(current=>({...current,mail:[item,...current.mail]}));
      setDelivering(false);
      setToast('Mensagem de demonstração recebida.');
    },matchMedia('(prefers-reduced-motion: reduce)').matches?0:routeDuration);
  }
  function addTask(date,text){
    setData(current=>({...current,tasks:[...current.tasks,{id:crypto.randomUUID(),day:date,text,done:false}]}));
    setToast('Lembrete guardado.');
  }
  function saveCategory(event){
    event.preventDefault();
    if(!category.trim())return;
    if(data.categories.some(item=>item.name.toLowerCase()===category.trim().toLowerCase())){setToast('Já existe uma categoria com esse nome.');return;}
    setData(current=>({...current,categories:[...current.categories,{id:crypto.randomUUID(),name:category.trim()}]}));
    setCategory('');setDialog('');setToast('Categoria criada.');
  }
  function exportBackup(){
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'kasmail-design-preview-v1',data},null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;link.download='kasmail-demonstracao.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setToast('Cópia de demonstração descarregada.');
  }
  async function restoreBackup(event){
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    try{
      if(file.size>4*1024*1024)throw Error();
      const backup=JSON.parse(await file.text());
      if(backup.format!=='kasmail-design-preview-v1'||!validData(backup.data))throw Error();
      setData(backup.data);navigate('home');setDialog('');setToast('Cópia de demonstração restaurada.');
    }catch{setToast('O ficheiro não é uma cópia desta demonstração.');}
  }
  function sendDraft(event,folder){
    event.preventDefault();
    const item={id:crypto.randomUUID(),name:draft.to,domain:draft.to,address:draft.to,subject:draft.subject,body:draft.body,time:'Agora',folder,unread:false,category:''};
    setData(current=>({...current,mail:[item,...current.mail]}));setDraft({to:'',subject:'',body:''});setDialog('');navigate(folder);setToast(folder==='sent'?'Mensagem de demonstração enviada.':'Rascunho guardado.');
  }
  function openConnection(section){setPickerSearch('');setDialog(section);}

  return <div className="layout">
    <aside className="sidebar">
      <button className="brand" type="button" onClick={()=>navigate('home')} aria-label="k@sMail — Atividade"><img src={wordmark} alt="k@sMail"/></button>
      <button className="primary compose" type="button" onClick={()=>{setDraft({to:'',subject:'',body:''});setDialog('compose');}}><PencilSimple size={19}/> Escrever</button>
      <nav aria-label="Correio">{nav.map(([id,label,Icon])=><button type="button" key={id} aria-current={page===id?'page':undefined} onClick={()=>navigate(id)}>
        <Icon size={19}/><span>{label}</span>{id==='inbox'&&unread>0&&<b>{unread}</b>}</button>)}</nav>
      <div className="side-section"><div className="side-heading"><span>Categorias</span><button type="button" className="icon" aria-label="Criar categoria" onClick={()=>setDialog('category')}><Plus size={17}/></button></div>
        <nav aria-label="Categorias">{data.categories.map(({id,name})=><button type="button" key={id} aria-current={page==='category:'+id?'page':undefined} onClick={()=>navigate('category:'+id)}><Folder size={18}/><span>{name}</span></button>)}</nav></div>
      <footer><button type="button" className="profile-launch" aria-label="Perfil e definições" onClick={()=>setDialog('settings')}>
        <span className="profile-launch-photo"><ProfileAvatar profile={profile}/><span className="avatar-settings"><GearSix size={12}/></span></span>
        <span className="profile-launch-copy"><strong>{profile.name||'O teu perfil'}</strong>{profile.domain&&<span>{profile.domain}</span>}<small>Perfil e definições</small></span>
      </button><div className="testnet"><i/> Testnet-10 · Pré-visualização</div></footer>
    </aside>

    <div className="workspace">
      <header className="top">
        <div className="search">
          <MagnifyingGlass size={21}/><input aria-label="Pesquisar emails" placeholder="Pesquisar emails" value={query} onChange={event=>{setQuery(event.target.value);setSelected('');}}/>
          {query&&<button type="button" className="icon" aria-label="Limpar pesquisa" onClick={()=>setQuery('')}><X size={17}/></button>}
          <button type="button" className="icon search-filter" aria-label="Filtros de pesquisa" aria-expanded={filter} onClick={()=>setFilter(!filter)}><SlidersHorizontal size={20}/></button>
          {filter&&<div className="filters" role="group" aria-label="Pesquisar por">{searchFields.map(([id,label])=><button key={id} type="button" aria-pressed={criterion===id} onClick={()=>{setCriterion(id);setFilter(false);}}>{label}{criterion===id&&<Check size={16}/>}</button>)}</div>}
        </div>
        <div className="top-actions">
          <div className="price" title="Cotação ilustrativa"><img src={kaspaLogo} alt=""/><div><strong>KAS <span>0,027 €</span></strong><small>Cotação de exemplo</small></div></div>
          <button type="button" className="outline wallet-button" onClick={()=>openConnection('wallet')}><Wallet size={19}/> {wallet||'Ligar carteira'}</button>
        </div>
      </header>
      <main>
        <div className="page-heading"><div><span className="overline">k@sMail</span><h1>{searching?'Resultados':isHome?'Atividade':folderTitle}</h1>
          <p>{searching?visible.length+' resultados · '+searchFields.find(row=>row[0]===criterion)[1]:isHome?'Acompanha o teu correio e a ligação ao nó.':isCategory?'Mensagens organizadas por ti.':'Consulta e organiza as tuas mensagens.'}</p></div>
          {isHome&&<button className="outline" type="button" onClick={()=>navigate('inbox')}>Abrir Entrada <ArrowRight size={17}/></button>}
        </div>

        {isHome?<div className="dashboard">
          <section className="hero">
            <div className="hero-head"><div><span className="overline">Entrega cifrada</span><h2>Do remetente à tua caixa.</h2></div>
              <a className="hero-lock" href="https://kgi.kaspad.net/" target="_blank" rel="noopener noreferrer">BlockDAG Kaspa <ArrowUpRight size={15}/></a></div>
            <RouteCanvas pulse={pulse}/>
            <div className="hero-foot"><span><i/> {activeNode.name} · {activeNode.online?'Online':'Por ligar'}</span><button type="button" onClick={pilotMail} disabled={delivering||!activeNode.online}>{delivering?'A simular…':'Simular receção'} <ArrowDownLeft size={16}/></button></div>
          </section>
          <div className="dashboard-side">
            <aside className="network panel">
              <header><div className="section-icon"><Gauge size={21}/></div><div><h2>Nós de correio</h2><p>Kaspa Testnet-10</p></div></header>
              <div className="node-metrics"><div><strong>{nodes.filter(item=>item.online).length}</strong><small>Disponíveis</small></div><div><strong>{Number(activeNode.online)}</strong><small>Em uso</small></div></div>
              <div className="node-status"><i className={activeNode.online?'':'offline'}/><div><strong>{activeNode.name}</strong><small>{activeNode.online?'Nó selecionado':'A aguardar ligação'} · {activeNode.type==='public'?'Público':'Privado'}</small></div></div>
              <button className="outline" type="button" onClick={()=>openConnection('nodes')}>Escolher nó <ArrowUpRight size={15}/></button>
            </aside>
            <section className="recent panel"><div className="panel-title"><h2>Últimas mensagens</h2><button type="button" className="text" onClick={()=>navigate('inbox')}>Ver Entrada <ArrowRight size={15}/></button></div>
              {incoming.slice(0,3).map(mail=><button className="recent-row" type="button" key={mail.id} onClick={()=>{navigate('inbox');openMail(mail);}}>
                <span className={'avatar'+(mail.unread?' new':'')}>{mail.name.slice(0,2).toUpperCase()}</span><span><strong>{mail.name}</strong><small>{mail.subject}</small></span><time>{mail.time}</time></button>)}
            </section>
          </div>
        </div>:<div className="inbox-layout">
          <section className="mail-panel panel">
            {message?<article className="reader">
              <div className="reader-toolbar"><button className="text" type="button" onClick={()=>setSelected('')}><CaretLeft size={17}/> Voltar</button>
                {['spam','trash'].includes(message.folder)?<button className="outline" type="button" onClick={()=>moveMail(message,'inbox')}>Mover para Entrada</button>:<div>
                  <button className="icon" type="button" aria-label="Mover para Spam" title="Mover para Spam" onClick={()=>moveMail(message,'spam')}><Flag size={18}/></button>
                  <button className="icon" type="button" aria-label="Mover para Lixo" title="Mover para Lixo" onClick={()=>moveMail(message,'trash')}><Trash size={18}/></button>
                </div>}
              </div>
              <h2>{message.subject}</h2>
              <div className="person"><div className="avatar">{message.name.slice(0,2).toUpperCase()}</div><div><strong>{message.name}</strong><small>{message.domain}</small></div><time>{message.time}</time></div>
              <p className="body">{message.body}</p>
              <div className="reader-actions"><button type="button" className="outline" onClick={()=>{setDraft({to:message.domain||message.address,subject:'Re: '+message.subject,body:''});setDialog('compose');}}><ArrowBendUpLeft size={17}/> Responder</button>
                <label>Categoria <select aria-label="Categoria" value={message.category} onChange={event=>{updateMail(message.id,{category:event.target.value});setToast('Categoria atualizada.');}}>
                  <option value="">Sem categoria</option>{data.categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
            </article>:<div className="mail-list">
              <div className="panel-title"><h2>{searching?'Mensagens encontradas':folderTitle}</h2><span className="pill">{visible.length}</span></div>
              <div className="mail-rows">{visible.map(mail=><button type="button" key={mail.id} className={'mail-row'+(mail.unread?' unread':'')} onClick={()=>openMail(mail)}>
                <span className={'avatar'+(mail.unread?' new':'')}>{mail.name.slice(0,2).toUpperCase()}</span>
                <span className="mail-text"><strong>{mail.name}</strong><span>{mail.subject}</span><small>{mail.body}</small></span>
                <span className="mail-meta"><time>{mail.time}</time>{mail.unread&&<i aria-label="Por ler"/>}</span>
              </button>)}</div>
              {!visible.length&&<div className="empty"><Tray size={33}/><p>Sem mensagens para mostrar.</p></div>}
            </div>}
          </section>
          <Agenda tasks={data.tasks} day={day} setDay={setDay} addTask={addTask} mail={message}
            toggleTask={id=>setData(current=>({...current,tasks:current.tasks.map(task=>task.id===id?{...task,done:!task.done}:task)}))}/>
        </div>}
      </main>
    </div>

    {dialog==='category'&&<Overlay title="Criar categoria" close={()=>setDialog('')}><form onSubmit={saveCategory}><label>Nome da categoria<input required maxLength={36} value={category} onChange={event=>setCategory(event.target.value)} placeholder="Ex.: Comunidade"/></label><button className="primary" type="submit">Criar categoria</button></form></Overlay>}
    {['wallet','nodes'].includes(dialog)&&<Overlay title={dialog==='wallet'?'Carteira':'Escolher nó de correio'} close={()=>setDialog('')}>
      <div className="segmented"><button type="button" aria-pressed={dialog==='wallet'} onClick={()=>openConnection('wallet')}>Carteira</button><button type="button" aria-pressed={dialog==='nodes'} onClick={()=>openConnection('nodes')}>Nós</button></div>
      <div className="picker-search"><MagnifyingGlass size={19}/><input aria-label={dialog==='wallet'?'Pesquisar carteiras':'Pesquisar nós'} placeholder={dialog==='wallet'?'Pesquisar carteiras':'Pesquisar nós'} value={pickerSearch} onChange={event=>setPickerSearch(event.target.value)}/></div>
      {dialog==='wallet'?<><p className="quiet">Ligação simulada para rever o fluxo.</p>{wallets.filter(name=>name.toLowerCase().includes(pickerSearch.toLowerCase())).map(name=>
        <button type="button" className="option" key={name} onClick={()=>{setWallet(name);setToast(name+' ligada em modo de demonstração.');openConnection('nodes');}}><Wallet size={20}/><strong>{name}</strong>{wallet===name?<Check size={19}/>:<ArrowRight size={18}/>}</button>)}
        {wallet&&<button type="button" className="text" onClick={()=>{setWallet('');setDialog('');}}>Desligar carteira</button>}</>:
        <><div className="segmented"><button type="button" aria-pressed={nodeType==='public'} onClick={()=>setNodeType('public')}>Nó público</button><button type="button" aria-pressed={nodeType==='private'} onClick={()=>setNodeType('private')}>O meu nó</button></div>
          {nodeType==='public'?nodes.filter(item=>item.type==='public'&&(item.name+item.host).toLowerCase().includes(pickerSearch.toLowerCase())).map(item=>
            <button type="button" className="option" key={item.id} onClick={()=>{setNode(item.id);setDialog('');setToast(item.name+' selecionado.');}}><i className="node-dot"/><span><strong>{item.name}</strong><small>{item.host}</small></span>{node===item.id&&<Check size={19}/>}</button>):
            <form onSubmit={event=>{event.preventDefault();setNode('private');setDialog('');setToast('Nó privado selecionado para a demonstração.');}}>
              <label>Endereço HTTPS do teu nó<input type="url" required value={host} onChange={event=>setHost(event.target.value)} placeholder="https://node.example.com"/></label>
              <button type="submit" className="primary">Usar o meu nó</button>
            </form>}
          <p className="quiet">O destinatário escolhe o nó onde quer receber mensagens cifradas.</p></>}
    </Overlay>}
    {dialog==='settings'&&<Overlay title="Perfil e definições" close={()=>setDialog('')} wide>
      <ProfileSettings profile={profile} theme={theme} setTheme={setTheme} close={()=>setDialog('')} notify={setToast}
        save={value=>{setProfile(value);setDialog('');setToast(saveLocal('kasmail-profile',value)?'Perfil guardado neste navegador.':'Perfil atualizado nesta sessão.');}}
        backup={<section><h3>Backup da pré-visualização</h3><p>Guarda ou restaura os emails, categorias e lembretes desta pré-visualização.</p>
      <p className="quiet">A exportação de exemplo é um ficheiro JSON local. O backup do correio real deve ser cifrado.</p>
      <div className="backup-actions"><button type="button" className="primary" onClick={exportBackup}><ArrowDown size={17}/> Descarregar cópia</button><label className="outline upload">Restaurar cópia<input type="file" accept="application/json,.json" onChange={restoreBackup}/></label></div></section>}/>
    </Overlay>}
    {dialog==='compose'&&<Overlay title="Escrever email" close={()=>setDialog('')}><form onSubmit={event=>sendDraft(event,'sent')}>
      <label>Para<input required value={draft.to} onChange={event=>setDraft({...draft,to:event.target.value})} placeholder="Nome .k, .kas ou endereço"/></label>
      <label>Assunto<input required value={draft.subject} onChange={event=>setDraft({...draft,subject:event.target.value})}/></label>
      <label>Mensagem<textarea required rows={6} value={draft.body} onChange={event=>setDraft({...draft,body:event.target.value})}/></label>
      <div className="backup-actions"><button type="button" className="outline" onClick={event=>sendDraft(event,'drafts')}>Guardar rascunho</button><button type="submit" className="primary"><PaperPlaneTilt size={17}/> Simular envio</button></div>
    </form></Overlay>}
    {toast&&<div className="toast" role="status"><Check size={19}/>{toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<LanguageProvider><App/></LanguageProvider>);
