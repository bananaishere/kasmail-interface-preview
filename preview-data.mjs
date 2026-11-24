export const wallets = ['KasWare', 'Kastle', 'Kaspire'];
export const nodes = [
  { id: 'blockzero', name: 'Blockzero', type: 'public', host: 'node.kaspacamp.org', online: true },
  { id: 'kakaroto', name: 'Kakaroto', type: 'public', host: 'kaspanode.duckdns.org', online: true },
  { id: 'private', name: 'O meu nó', type: 'private', host: 'Ligação própria', online: false },
];
export const initial = {
  categories: [{id:'project', name:'Projetos'}, {id:'personal', name:'Pessoal'}],
  mail: [
    {id:'one', name:'Blockzero', domain:'gotorosario.kas', address:'kaspatest:demo-blockzero', subject:'O primeiro ensaio no Blockzero', body:'Já consegui receber e responder no k@sMail. Podemos combinar o teste de entrega privada para amanhã? Quero confirmar que o meu nó elimina a cópia depois de eu recolher a mensagem.', time:'10:42', folder:'inbox', unread:true, category:''},
    {id:'two', name:'Mariana Costa', domain:'mariana.k', address:'kaspatest:demo-mariana', subject:'Notas para a próxima versão', body:'Deixei os pontos sobre a nova interface. Gostei da ideia de manter o calendário ao lado da caixa de entrada.', time:'09:18', folder:'inbox', unread:true, category:'project'},
    {id:'three', name:'Kakaroto', domain:'kakaroto.kas', address:'kaspatest:demo-kakaroto', subject:'Confirmação do nó de Testnet', body:'O serviço de correio está online. Obrigado por confirmares os testes da semana passada.', time:'Ontem', folder:'inbox', unread:false, category:'project'},
    {id:'four', name:'Sofia Melo', domain:'sofia.k', address:'kaspatest:demo-sofia', subject:'Disponibilidade esta semana', body:'Quinta-feira funciona para mim. Diz-me se preferes de manhã.', time:'Ontem', folder:'inbox', unread:false, category:'personal'},
    {id:'five', name:'Mariana Costa', domain:'mariana.k', address:'kaspatest:demo-mariana', subject:'Reunião de revisão', body:'Confirmado. Falamos depois das 14h.', time:'Ontem', folder:'sent', unread:false, category:'project'},
  ],
  tasks: [],
};
export function dateKey(date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function shiftDay(value, amount) {
  const day = new Date(value);
  day.setDate(day.getDate()+amount);
  return day;
}
export const formatDate = (value, options) => new Intl.DateTimeFormat('pt-PT', options).format(value);

export function matchesMail(mail, query, criterion) {
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const fields = {
    all: [mail.name, mail.domain, mail.address, mail.subject, mail.body],
    name: [mail.name], dotk: mail.domain.endsWith('.k') ? [mail.domain] : [],
    dotkas: mail.domain.endsWith('.kas') ? [mail.domain] : [],
    address: [mail.address], words:[mail.subject, mail.body],
  };
  return normalize(query.trim()).split(/\s+/).every(term => fields[criterion].some(value=>normalize(value).includes(term)));
}
