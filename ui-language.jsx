import React, {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {translate} from './translations.mjs';

const storageKey='kasmail-language';
const LanguageContext=createContext(null);

function initialLanguage(){
  const requested=new URLSearchParams(window.location.search).get('lang');
  if(requested==='pt'||requested==='en')return requested;
  try{
    const saved=localStorage.getItem(storageKey);
    if(saved==='pt'||saved==='en')return saved;
  }catch{}
  return 'pt';
}

export function LanguageProvider({children}){
  const [language,setLanguage]=useState(initialLanguage);
  const t=useCallback(message=>translate(message,language),[language]);
  useEffect(()=>{
    document.documentElement.lang=language==='pt'?'pt-PT':'en';
    try{localStorage.setItem(storageKey,language);}catch{}
  },[language]);
  return <LanguageContext.Provider value={{language,setLanguage,t}}>{children}</LanguageContext.Provider>;
}

export function useLanguage(){return useContext(LanguageContext);}

export function LanguageSwitch(){
  const {t,language,setLanguage}=useLanguage();
  return <label className="mail-language">
    <span className="language-label">{t('Idioma')}</span>
    <select aria-label={t('Idioma')} value={language} onChange={event=>setLanguage(event.target.value)}>
      <option value="pt">PT</option>
      <option value="en">EN</option>
    </select>
  </label>;
}
