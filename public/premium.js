/* Glint premium layer: routes, account center, temp chats, pins/archive/share, attachment previews, themes, prompt upgrade */
(function(){'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(m,t)=>window.gToast&&gToast(m,t);

/* ---- theme ---- */
const applyTheme=()=>{let t=LS.get('glint_theme','dark');if(t==='system')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t};
applyTheme();matchMedia('(prefers-color-scheme: light)').addEventListener&&matchMedia('(prefers-color-scheme: light)').addEventListener('change',applyTheme);

/* ---- preloader: logo only ---- */
const pl=$('#preloader');if(pl&&!$('.g-pl-logo',pl))pl.insertAdjacentHTML('afterbegin','<img class="g-pl-logo" src="/icons/icon-192.png" alt="Glint">');

/* ---- expert system prompts: auto-routed (or pinned) per request ---- */
const P_CORE=`Quality bar: answer the actual question first, then add depth that earns its place. Be exact, concrete and honest about uncertainty. Never invent facts, sources, APIs, quotes or results. Ask at most one clarifying question, and only when a wrong guess would waste the user's time; otherwise state your assumption in one line and proceed.`;
const P_CODE=`ROLE: principal software engineer and code reviewer.
Method: (1) restate the real requirement and constraints in one line; (2) choose the simplest design that is correct, then name the one trade-off that matters; (3) write COMPLETE, runnable code with imports, types and error handling, never "...", TODOs or pseudo-code; (4) trace it mentally against a normal case, an empty/null case, a boundary case and a failure case before you answer.
Rules: state language and version assumptions. Use the standard library and well-known, maintained packages; never invent function names, flags or package versions, and say so when unsure. Validate input, avoid injection, leaks, race conditions and O(n^2) traps; mention complexity when it matters. Match the user's existing style, naming and framework. When fixing a bug, find the root cause, explain it in two sentences, then show the minimal diff or the corrected block, not a rewrite. When editing a file, return the full changed function or file so it can be pasted. Provide a short usage example or tests for non-trivial logic. Use fenced code blocks with a language tag, one file per block with its path as a comment. After the code, add only the notes a reviewer would insist on: how to run it, edge cases, and what you did not cover.`;
const P_RES=`ROLE: senior research analyst.
Method: (1) break the question into sub-questions; (2) answer each from the strongest evidence available (primary data and peer-reviewed work over commentary; recent over dated for fast-moving topics); (3) cross-check numbers, dates and units; (4) present the best competing views fairly and say which the evidence favours and why.
Output: start with a 2-3 sentence bottom line, then the reasoning in tight sections. Label confidence (high, medium, low) on key claims and say what would change your conclusion. Distinguish fact, inference and opinion. If web results are supplied, use them and cite as [1], [2] only for what they actually say; if none are supplied, say your knowledge may be out of date and do not fake citations or links. Quantify when possible, define jargon once, flag common misconceptions, and finish with the 2-3 best next questions or sources to check. No padding, no hedging boilerplate.`;
const P_WRITE=`ROLE: award-level editor and ghostwriter.
Method: (1) infer audience, purpose, format, length and voice from the request (ask only if truly unclear); (2) lead with the strongest line, not a preamble; (3) use specific nouns, verbs and details instead of adjectives and abstractions; (4) vary sentence length and keep a clear arc; (5) do one silent edit pass cutting filler, repetition, hedging and clichés ("delve", "tapestry", "in today's fast-paced world", "it's important to note", stacked triplets, em-dash tics).
Deliver the finished piece, not an outline or a description of it. When rewriting, preserve the author's meaning and voice and improve clarity, rhythm and correctness; mention only the important changes. For emails and posts, include a subject or hook. Offer one alternative angle or tone in a single line at the end, never a menu. Match the requested language, register and word count exactly.`;
const P_THINK=`EXTENDED THINKING is ON: before answering, work through the problem in depth. Decompose it, consider at least two approaches, test your leading answer against counterexamples and edge cases, verify arithmetic and logic line by line, and fix any weakness you find. Spend your effort on correctness. Then present a clean, confident final answer without dumping scratch work.`;
const MODEKEY='glint_persona';
const detect=t=>{t=t||'';if(/```|\b(code|coding|function|bug|debug|error|exception|stack ?trace|python|javascript|typescript|react|node|java|c\+\+|rust|golang|sql|regex|css|html|api|endpoint|compile|refactor|script|class|npm|git|docker|algorithm|database|query|json|yaml|bash|linux)\b/i.test(t))return'code';
 if(/\b(write|draft|essay|email|story|poem|blog|article|rewrite|proofread|cover letter|speech|caption|slogan|newsletter|paraphrase|edit this|tagline|lyrics|post for)\b/i.test(t))return'write';
 if(/\b(research|compare|analy[sz]e|evidence|study|studies|statistics|market|history of|pros and cons|explain why|latest|news|sources|report on|literature|trend|impact of|difference between|how does .* work)\b/i.test(t))return'research';return'general'};
const PERSONAS={code:['Code',P_CODE],research:['Research',P_RES],write:['Write',P_WRITE]};
window.GLINT_PERSONA=()=>{const m=LS.get(MODEKEY,'auto');if(m!=='auto')return m;try{const h=chats[currentChatId].history,last=[...h].reverse().find(x=>x.role==='user');return detect(last&&last.parts&&last.parts[0]&&last.parts[0].text)}catch(e){return'general'}};
try{const base=window.GLINT_SYS||'';Object.defineProperty(window,'GLINT_SYS',{configurable:true,get(){const me=LS.get('glint_about','').trim(),ext=LS.get('glint_think','0')==='1',p=PERSONAS[window.GLINT_PERSONA()];
 return base+'\n\n'+P_CORE+(p?'\n\n'+p[1]:'')+(ext?'\n\n'+P_THINK:'')+(me?'\n\nWhat the user wants you to know about them (use naturally, never recite):\n'+me:'')},set(){}})}catch(e){}
/* extended thinking also asks reasoning-capable OpenRouter models for high effort (ignored by others) */
try{const of=window.fetch;window.fetch=function(u,o){try{if(LS.get('glint_think','0')==='1'&&typeof u==='string'&&u.includes('openrouter.ai')&&o&&typeof o.body==='string'){const b=JSON.parse(o.body);if(b&&b.messages&&!b.reasoning){b.reasoning={effort:'high'};o=Object.assign({},o,{body:JSON.stringify(b)})}}}catch(e){}return of.call(this,u,o)}}catch(e){}

/* ---- routes ---- */
const ROUTES={'/chat':'chat','/c':'chat','/townhall':'townhall','/account':'account','/personalization':'personalization','/help':'help','/app':'chat'};
const go=p=>{if(location.pathname!==p)history.pushState({},'',p)};
function route(){let p=location.pathname.replace(/\/$/,'')||'/';if(/^\/c\//.test(p))p='/c';const r=ROUTES[p];if(!r)return;
 try{if(r!=='townhall'&&$('#townhall.open'))closeTownhall()}catch(e){}
 if(r==='townhall'){try{if(!$('#townhall.open'))openTownhall()}catch(e){}}
 else if(['account','personalization','help'].includes(r)){openAcct(r==='account'?'a':r==='personalization'?'z':'h',true)}
 else{const m=$('#gAcct');m&&m.classList.remove('active');openFromUrl();syncUrl()}}
addEventListener('popstate',route);
const wrap=(n,f)=>{try{const o=window[n]||eval(n);if(typeof o!=='function')return;const w=function(){const r=o.apply(this,arguments);f.apply(this,arguments);return r};try{window[n]=w}catch(e){}try{eval(n+'=w')}catch(e){}}catch(e){}};

/* ---- storage hooks: temp chats, timestamps ---- */
function patchStorage(){try{const o=saveChatsToStorage;saveChatsToStorage=function(){const now=Date.now();Object.values(chats).forEach(c=>(c.history||[]).forEach(m=>{if(!m.ts)m.ts=now}));const keep={};let hadTemp=false;Object.keys(chats).forEach(k=>{if(chats[k].temp)hadTemp=true;else keep[k]=chats[k]});if(!hadTemp)return o.apply(this,arguments);const full=chats;chats=keep;try{o.apply(this,arguments)}finally{chats=full}}}catch(e){}}

/* ---- chat list: pin / archive / share / temp ---- */
let menu;const closeMenu=()=>{menu&&menu.remove();menu=null};
addEventListener('click',e=>{if(menu&&!e.target.closest('.gp-menu'))closeMenu()},true);
const save=()=>{try{saveChatsToStorage();renderChatList()}catch(e){}};
function shareChat(id){const c=chats[id];const md='# '+c.title+'\n\n'+c.history.map(m=>(m.role==='user'?'**You:** ':'**Glint:** ')+(m.parts||[]).map(p=>p.text||'').join('')).join('\n\n');
 if(navigator.share)navigator.share({title:c.title,text:md}).catch(()=>{});else navigator.clipboard.writeText(md).then(()=>toast('Chat copied to clipboard','ok'),()=>toast('Could not copy'))}
function openMenu(id,btn){closeMenu();const c=chats[id],r=btn.getBoundingClientRect();menu=document.createElement('div');menu.className='gp-menu';
 menu.innerHTML=`<button data-a="pin">${c.pinned?'Unpin':'Pin'} chat</button><button data-a="arc">${c.archived?'Unarchive':'Archive'}</button><button data-a="shr">${SH.get()[id]?'Update public link':'Share public link'}</button>${SH.get()[id]?'<button data-a="cp">Copy link</button><button data-a="uns">Stop sharing</button>':''}<button data-a="dl">Download .md</button><button class="dg" data-a="del">Delete</button>`;
 document.body.appendChild(menu);menu.style.left=Math.max(8,Math.min(r.left,innerWidth-menu.offsetWidth-8))+'px';menu.style.top=Math.min(r.bottom+4,innerHeight-menu.offsetHeight-8)+'px';
 menu.onclick=e=>{const a=e.target.closest('button')?.dataset.a;if(!a)return;closeMenu();
  if(a==='pin'){c.pinned=!c.pinned;save()}else if(a==='arc'){c.archived=!c.archived;save()}else if(a==='shr')publishChat(id);else if(a==='cp'){navigator.clipboard.writeText(location.origin+'/s/'+SH.get()[id].id).then(()=>toast('Link copied','ok'))}else if(a==='uns')unpublishChat(id);
  else if(a==='dl'){const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([c.history.map(m=>(m.role==='user'?'## You\n':'## Glint\n')+(m.parts||[]).map(p=>p.text||'').join('')).join('\n\n')],{type:'text/markdown'}));l.download=(c.title||'chat').replace(/[^\w-]+/g,'_')+'.md';l.click()}
  else if(a==='del'&&confirm('Delete this chat?')){delete chats[id];if(!Object.keys(chats).length)createNewChat();else if(currentChatId===id)currentChatId=Object.keys(chats).sort().pop();save();renderChatBox()}}}
let showArc=false;
function decorate(){const list=$('#chatList');if(!list)return;const keys=Object.keys(chats).sort((a,b)=>b.localeCompare(a));const items=[...list.children].filter(e=>e.classList.contains('chat-item'));if(items.length!==keys.length)return;
 const pairs=items.map((el,i)=>({el,id:keys[i],c:chats[keys[i]]}));
 pairs.forEach(({el,id,c})=>{if(c.pinned)el.querySelector('.chat-title').insertAdjacentHTML('afterbegin','<svg class="gp-pin" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3l7 7-3 1-3 3 1 5-2 2-4-6-5 5-1-1 5-5-6-4 2-2 5 1 3-3z"/></svg>');
  if(c.temp)el.querySelector('.chat-title').insertAdjacentHTML('beforeend',' <small style="opacity:.5">· temporary</small>');
  el.querySelector('.chat-actions')?.remove();const b=document.createElement('button');b.className='gp-more';b.textContent='⋯';b.setAttribute('aria-label','Chat options');b.onclick=e=>{e.stopPropagation();openMenu(id,b)};el.appendChild(b)});
 const pin=pairs.filter(p=>p.c.pinned&&!p.c.archived),rest=pairs.filter(p=>!p.c.pinned&&!p.c.archived),arc=pairs.filter(p=>p.c.archived);
 list.innerHTML='';const sec=t=>{const d=document.createElement('div');d.className='g-sec';d.textContent=t;list.appendChild(d);return d};
 if(pin.length){sec('Pinned');pin.forEach(p=>list.appendChild(p.el))}if(pin.length&&rest.length)sec('Recent');rest.forEach(p=>list.appendChild(p.el));
 if(arc.length){const s=sec((showArc?'Hide':'Show')+' archived ('+arc.length+')');s.style.cursor='pointer';s.onclick=()=>{showArc=!showArc;decorate()};if(showArc)arc.forEach(p=>list.appendChild(p.el))}}
function patchList(){try{const o=renderChatList;renderChatList=function(){o.apply(this,arguments);decorate()};renderChatList()}catch(e){}}
function tempChat(){const id='chat_'+Date.now();chats[id]={title:'Temporary chat',history:[],temp:true};currentChatId=id;saveChatsToStorage();renderChatList();renderChatBox();banner();go('/chat')}
function banner(){$$('.g-temp-banner').forEach(e=>e.remove());const c=chats[currentChatId];if(c&&c.temp)$('#chatBox')?.insertAdjacentHTML('afterbegin','<div class="g-temp-banner">Temporary chat · not saved, disappears when you leave</div>')}
function purgeTemp(){Object.keys(chats).forEach(k=>{if(chats[k].temp)delete chats[k]})}
function addSidebarBits(){const h=$('.sidebar-header');if(!h||$('#gTempBtn'))return;h.insertAdjacentHTML('beforeend','<button class="new-chat-btn" id="gTempBtn" title="A chat that is never saved">Temporary chat</button>');$('#gTempBtn').onclick=()=>{tempChat();document.body.classList.remove('nav-open')};
 $('.settings-trigger')?.remove();$('#gLogout')?.remove()}

/* ---- logout confirmation ---- */
function patchLogout(){try{const o=GC.logout;GC.logout=function(){if(confirm('Log out of Glint? Your synced chats stay safe in your account.'))return o.apply(this,arguments)};const b=$('#gOut');if(b)b.onclick=GC.logout}catch(e){}}

/* ---- usage analytics ---- */
const RANGES={'24h':864e5,'7d':6048e5,'30d':2592e6,'1y':31536e6,all:Infinity};
function stats(range){const now=Date.now(),lim=RANGES[range],by={},day={};let tin=0,tout=0,msgs=0;
 Object.keys(chats).forEach(id=>{const c=chats[id],base=+id.replace(/\D/g,'')||now;(c.history||[]).forEach(m=>{const t=m.ts||base,txt=(m.parts||[]).map(p=>p.text||'').join(''),tok=Math.ceil(txt.length/4);const dk=new Date(t).toISOString().slice(0,10);day[dk]=(day[dk]||0)+tok;if(now-t>lim)return;msgs++;
  if(m.role==='model'){const k=(m.meta&&m.meta.model)||'unknown';const n=k.split('|').pop();(by[n]=by[n]||{in:0,out:0,n:0});by[n].out+=tok;by[n].n++;tout+=tok}else{tin+=tok;by._you=by._you||{in:0,out:0,n:0};by._you.in+=tok}})});
 delete by._you;return{by,tin,tout,msgs,day}}
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(n);
function drawUsage(range){const s=stats(range),T=s.tin+s.tout,water=T/1000*10;const rows=Object.entries(s.by).sort((a,b)=>b[1].out-a[1].out),max=Math.max(1,...rows.map(r=>r[1].out));
 const days=[];for(let i=181;i>=0;i--){const d=new Date(Date.now()-i*864e5).toISOString().slice(0,10);days.push([d,s.day[d]||0])}const mx=Math.max(1,...days.map(d=>d[1]));
 $('#gxUse').innerHTML=`<div class="gx-row">${Object.keys(RANGES).map(r=>`<button class="gx-pill ${r===range?'on':''}" data-r="${r}">${r==='all'?'Lifetime':r==='24h'?'Last 24 hrs':r==='7d'?'Last 7 days':r==='30d'?'Last month':'Last year'}</button>`).join('')}</div>
 <div class="gx-grid"><div class="gx-card"><div class="gx-big">${fmt(T)}</div>tokens (est.)</div><div class="gx-card"><div class="gx-big">${s.msgs}</div>messages</div><div class="gx-card"><div class="gx-big">${water>=1000?(water/1000).toFixed(2)+' L':Math.round(water)+' mL'}</div>water (approx.)</div></div>
 <div class="gx-card"><b>By model</b>${rows.length?rows.map(([n,v])=>`<div style="margin-top:10px;font-size:13px;display:flex;justify-content:space-between"><span>${esc(n)}</span><span>${fmt(v.out)} out · ${v.n} replies</span></div><div class="gx-bar"><i style="width:${Math.round(v.out/max*100)}%"></i></div>`).join(''):'<p style="opacity:.6;margin-top:8px">No activity in this period yet.</p>'}</div>
 <div class="gx-card"><b>Activity</b><div class="gx-heat" style="margin-top:10px">${days.map(([d,v])=>`<i title="${d}: ~${fmt(v)} tokens" data-l="${v?Math.min(4,1+Math.floor(v/mx*3.99)):0}"></i>`).join('')}</div></div>
 <p class="g-hint">Estimates only: tokens are counted as roughly 4 characters each from your saved chats, so temporary chats are not included. Water assumes about 10 mL per 1,000 tokens, a rough public ballpark that varies a lot by provider and datacenter.</p>`;
 $$('#gxUse [data-r]').forEach(b=>b.onclick=()=>drawUsage(b.dataset.r))}

/* ---- import prompt ---- */
const IMPORT_PROMPT=`I am moving to a new AI assistant called Glint and want to bring my memory with me. Please export everything you know about me as plain text, grouped under these headings: 1) Identity and background, 2) Work and projects, 3) Preferences and writing style, 4) Interests and hobbies, 5) Goals, 6) People and places I mention often, 7) Anything I asked you to always or never do, 8) Other remembered details. Include dates where you have them. Quote my own saved memory entries verbatim where possible, and do not summarize away specifics. Leave out anything sensitive such as passwords or financial account numbers. If you cannot see a category, write "none". Output only the export, with no commentary before or after it.`;

/* ---- account center ---- */
const HELP=[['How do I add my API keys?','Open Account Center, then Settings & keys. Add a Gemini, Groq or OpenRouter key and press Save & Apply. Keys stay on your device.'],['What is Townhall?','A round table where several AI models debate your question, then a chair writes the final answer. Open it from the sidebar or at /townhall.'],['What is a temporary chat?','A chat that is never saved or synced. It disappears when you switch away or close the tab.'],['Can I create images, video and music?','Yes. Use the mode chip in the chat bar to switch between Chat, Image, Video and Music. These use Gemini models and need a Gemini key.'],['How do I import memory from another AI?','Account Center, Personalization, Import. Copy the prompt, paste it into your old assistant, then paste its answer back here.'],['Keyboard shortcuts','Ctrl/Cmd+K searches chats. Enter sends, Shift+Enter adds a new line. Esc closes dialogs.'],['What does extended thinking do?','It asks the model to reason more carefully before answering. Replies can be slower but are often more accurate on hard problems.']];
function buildAcct(){const m=$('#gAcct');if(!m||$('[data-p=a]',m))return;const seg=$('.gs-seg',m);
 seg.insertAdjacentHTML('afterbegin','<button type="button" class="on" data-t="a">Appearance</button><button type="button" data-t="u">Usage</button><button type="button" data-t="z">Personalization</button><button type="button" data-t="h">Help</button>');$('[data-t=p]',seg).classList.remove('on');
 const pane=(k,h)=>`<section class="gs-pane ${k==='a'?'on':''}" data-p="${k}">${h}</section>`;$('.gs-pane[data-p=p]',m).classList.remove('on');
 const first=$('.gs-pane',m);
 first.insertAdjacentHTML('beforebegin',
 pane('a',`<div class="g-lbl">Theme</div><div class="gx-row" id="gxTheme">${['dark','light','system'].map(t=>`<button class="gx-pill" data-th="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>
 <div class="g-lbl" style="margin-top:14px">Thinking</div><label class="inline-check"><input type="checkbox" id="gxThink"> Extended thinking (slower, more careful answers)</label><div class="g-lbl" style="margin-top:14px">Expert mode</div><div class="gx-row" id="gxPers">${["auto","code","research","write"].map(t=>`<button class="gx-pill" data-pe="${t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
 <div class="g-lbl" style="margin-top:14px">API keys, models, background</div><button type="button" class="g-sm" id="gxSet">Open settings</button>`)+
 pane('u','<div id="gxUse"></div>')+
 pane('z',`<div class="g-lbl">About you</div><p class="g-hint">Anything here is shared with every model so it knows you. Edit it any time.</p><textarea class="gx-ta" id="gxAbout" placeholder="e.g. I'm a backend engineer who likes concise answers with code first..."></textarea><div class="g-row"><button type="button" class="g-sm" id="gxSaveAbout">Save</button></div>
 <div class="g-lbl" style="margin-top:18px">Import memory from another AI</div><p class="g-hint">1. Copy this prompt. 2. Paste it into your current assistant. 3. Paste its reply below.</p><textarea class="gx-ta" id="gxPrompt" readonly style="min-height:90px"></textarea><div class="g-row"><button type="button" class="g-sm" id="gxCopy">Copy prompt</button></div><textarea class="gx-ta" id="gxImp" placeholder="Paste the other assistant's reply here" style="margin-top:10px"></textarea><div class="g-row"><button type="button" class="g-sm" id="gxImpGo">Import into Glint</button></div>`)+
 pane('h','<div class="gx-help">'+HELP.map(h=>`<details><summary>${esc(h[0])}</summary><p>${esc(h[1])}</p></details>`).join('')+'</div>'));
 $('.gs-hero',m)?.insertAdjacentHTML('afterend','');
 seg.querySelectorAll('button').forEach(b=>b.onclick=()=>openAcct(b.dataset.t,false,true));
 const sync=()=>$$('#gxTheme .gx-pill').forEach(b=>b.classList.toggle('on',b.dataset.th===LS.get('glint_theme','dark')));sync();
 $('#gxTheme').onclick=e=>{const t=e.target.dataset.th;if(!t)return;LS.set('glint_theme',t);applyTheme();sync()};
 $('#gxThink').checked=LS.get('glint_think','0')==='1';$('#gxThink').onchange=e=>{LS.set('glint_think',e.target.checked?'1':'0');window.__gSyncThink&&__gSyncThink()};const sp=()=>$$('#gxPers .gx-pill').forEach(b=>b.classList.toggle('on',b.dataset.pe===LS.get(MODEKEY,'auto')));sp();$('#gxPers').onclick=e=>{const t=e.target.dataset.pe;if(!t)return;LS.set(MODEKEY,t);sp();window.__gSyncPers&&__gSyncPers()};
 $('#gxSet').onclick=()=>{m.classList.remove('active');toggleModal(true);go('/chat')};
 $('#gxAbout').value=LS.get('glint_about','');$('#gxSaveAbout').onclick=()=>{LS.set('glint_about',$('#gxAbout').value);toast('Saved. Glint will use this in every chat.','ok')};
 $('#gxPrompt').value=IMPORT_PROMPT;$('#gxCopy').onclick=()=>navigator.clipboard.writeText(IMPORT_PROMPT).then(()=>toast('Prompt copied','ok'));
 $('#gxImpGo').onclick=()=>{const v=$('#gxImp').value.trim();if(!v)return toast('Paste the reply first');LS.set('glint_about',(LS.get('glint_about','')+'\n\nImported memory:\n'+v).trim());$('#gxAbout').value=LS.get('glint_about','');$('#gxImp').value='';toast('Memory imported','ok')};
 const hero=$('.gs-hero',m);m.querySelector('.gs-out')&&(m.querySelector('.gs-out').textContent='Log out')}
const PATH={a:'/account',u:'/account',z:'/personalization',h:'/help',p:'/account',t:'/account',s:'/account',d:'/account'};
function openAcct(t,fromRoute,keep){buildAcct();const m=$('#gAcct');if(!m)return;m.classList.add('active');
 $$('.gs-seg button',m).forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.gs-pane',m).forEach(p=>p.classList.toggle('on',p.dataset.p===t));if(t==='u')drawUsage('7d');if(!fromRoute)go(PATH[t]||'/account')}
function wireAcct(){$('#gChip')&&($('#gChip').onclick=()=>openAcct('a'));const m=$('#gAcct');if(m)new MutationObserver(()=>{if(!m.classList.contains('active')&&/^\/(account|personalization|help)$/.test(location.pathname)){go('/chat');syncUrl()}}).observe(m,{attributes:true,attributeFilter:['class']})}

/* ---- attachments: file-only send, thumbnails, previews, drag & drop ---- */
function sendGuard(){const ta=$('#userInput');const fill=()=>{if(!ta.value.trim()&&window.GA&&GA.files.length)ta.value=GA.files.some(f=>f.mime&&f.mime.startsWith('image/'))?'Please look at the attached file(s) and describe or help with them.':'Please review the attached file(s).'};
 $('#sendBtn')?.addEventListener('click',fill,true);ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)fill()},true);
 const dz=document.createElement('div');dz.className='g-drop';dz.textContent='Drop files to attach';document.body.appendChild(dz);let dc=0;
 addEventListener('dragenter',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dc++;dz.classList.add('on')}});addEventListener('dragleave',()=>{if(--dc<=0){dc=0;dz.classList.remove('on')}});addEventListener('dragover',e=>e.preventDefault());
 addEventListener('drop',e=>{e.preventDefault();dc=0;dz.classList.remove('on');const f=[...(e.dataTransfer&&e.dataTransfer.files||[])];if(f.length&&typeof addFiles==='function')addFiles(f)});
 const tray=$('#gFiles');tray&&new MutationObserver(()=>{if(!window.GA)return;[...tray.querySelectorAll('.g-file')].forEach((el,i)=>{if(el.dataset.p)return;el.dataset.p=1;const f=GA.files[i];if(!f)return;const ext=(f.name.split('.').pop()||'file').slice(0,4).toUpperCase();el.insertAdjacentHTML('afterbegin',f.mime&&f.mime.startsWith('image/')?`<img alt="" src="data:${f.mime};base64,${f.data}">`:`<span class="gf-ic">${esc(ext)}</span>`)})}).observe(tray,{childList:true})}
function previewMsgs(){const cb=$('#chatBox');if(!cb)return;const run=()=>{const hist=(chats[currentChatId]?.history||[]).filter(m=>m.role==='user');$$('.message-wrapper.user',cb).forEach((w,i)=>{if(w.dataset.gp)return;const c=w.querySelector('.message-content');if(!c)return;const raw=w._raw||c.textContent;if(!/--- File: |\[Attached: /.test(raw))return;w.dataset.gp=1;
  const atts=(hist[i]?.parts?.[0]?.atts)||[];let imgs=0,cards=[];let body=raw.replace(/\n*--- File: (.+?) ---\n```\n([\s\S]*?)\n```/g,(m0,n,t)=>{cards.push(`<div class="gm-card"><span class="gf-ic">${esc((n.split('.').pop()||'TXT').slice(0,4).toUpperCase())}</span><div><b>${esc(n)}</b><small>${fmt(t.length)} chars</small></div></div>`);return''}).replace(/\n*\[Attached: (.+?)\]/g,(m0,n)=>{const a=atts[imgs++];cards.push(a&&a.mime.startsWith('image/')?`<div class="gm-card img"><img alt="${esc(n)}" src="data:${a.mime};base64,${a.data}"></div>`:a&&a.mime.startsWith('video/')?`<div class="gm-card img"><video controls playsinline style="max-width:260px;border-radius:12px" src="data:${a.mime};base64,${a.data}"></video></div>`:a&&a.mime.startsWith('audio/')?`<div class="gm-card"><audio controls src="data:${a.mime};base64,${a.data}"></audio></div>`:`<div class="gm-card"><span class="gf-ic">${esc((n.split('.').pop()||'FILE').slice(0,4).toUpperCase())}</span><div><b>${esc(n)}</b><small>${a?a.mime:'file'}</small></div></div>`);return''});
  c.innerHTML=`<div class="gm-att">${cards.join('')}</div>`+esc(body.trim()).replace(/\n/g,'<br>')})};
 new MutationObserver(()=>requestAnimationFrame(run)).observe(cb,{childList:true,subtree:false});run()}

/* ---- phones: navigation + layout stability ---- */
function mobileFix(){const nav=v=>document.body.classList.toggle('nav-open',v);document.addEventListener('click',e=>{const b=e.target.closest('.g-burger');if(b){e.preventDefault();nav(!document.body.classList.contains('nav-open'))}else if(e.target.closest('.chat-item,#gTempBtn,.new-chat-btn'))nav(false)},true);
 let q=0;const relayout=()=>{cancelAnimationFrame(q);q=requestAnimationFrame(()=>dispatchEvent(new Event('resize')))};
 const st=$('#thStage');if(st&&window.ResizeObserver){new ResizeObserver(relayout).observe(st);const f=$('#thFeed');f&&new ResizeObserver(relayout).observe(f)}
 window.visualViewport&&visualViewport.addEventListener('resize',relayout)}


/* ---- toolbar chips: persona + extended thinking ---- */
function toolbarChips(){const tb=$('.input-toolbar');if(!tb||$('#gPers'))return;[...tb.children].forEach(e=>{if(!e.id&&/Townhall/.test(e.textContent))e.id='gTownChip'});const ic=p=>`<svg class="g-i" viewBox="0 0 24 24"><path d="${p}"/></svg>`;
 const L={auto:['Auto','M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z'],code:['Code','M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14'],research:['Research','M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5'],write:['Write','M4 20l4-1 11-11-3-3L5 16zM14 6l3 3']};
 const p=document.createElement('span');p.className='chip';p.id='gPers';p.title='Expert mode: Auto picks coding, research or writing for you';
 const t=document.createElement('span');t.className='chip';t.id='gThink';t.title='Extended thinking: slower, more careful answers';
 const dp=()=>{const m=LS.get(MODEKEY,'auto');p.innerHTML=ic(L[m][1])+' '+L[m][0];p.classList.toggle('active',m!=='auto')};
 const dt=()=>{const on=LS.get('glint_think','0')==='1';t.innerHTML=ic('M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z')+' Think';t.classList.toggle('active',on);const c=$('#gxThink');if(c)c.checked=on};
 p.onclick=()=>{const k=Object.keys(L),m=LS.get(MODEKEY,'auto');LS.set(MODEKEY,k[(k.indexOf(m)+1)%k.length]);dp();toast('Mode: '+L[LS.get(MODEKEY,'auto')][0])};
 t.onclick=()=>{LS.set('glint_think',LS.get('glint_think','0')==='1'?'0':'1');dt();toast('Extended thinking '+(LS.get('glint_think','0')==='1'?'on':'off'))};
 tb.insertBefore(t,tb.firstChild.nextSibling||null);tb.insertBefore(p,t);dp();dt();window.__gSyncThink=dt;window.__gSyncPers=dp}

/* ---- extras every chat tool has: scroll-down, slash prompts, feedback, shortcuts, token meter ---- */
const SLASH=[['/code','Write production-quality code for: '],['/debug','Find and fix the bug in this code, explain the root cause:\n\n'],['/review','Review this code like a senior engineer (bugs, security, performance, style):\n\n'],['/research','Research this thoroughly with a bottom line, evidence and confidence levels: '],['/summarize','Summarize the following in 5 bullets and one sentence takeaway:\n\n'],['/explain','Explain this clearly, starting simple then going deeper: '],['/eli5','Explain like I am five: '],['/rewrite','Rewrite this to be clearer and more engaging, keeping my voice:\n\n'],['/email','Draft a concise professional email about: '],['/translate','Translate to English (or tell me the target language), keep tone: '],['/plan','Make a step-by-step plan with milestones and risks for: '],['/pros','Give pros and cons, then a recommendation, for: ']];
function extras(){const ta=$('#userInput');if(!ta||$('#gSlash'))return;
 const sl=document.createElement('div');sl.id='gSlash';sl.className='gp-menu';sl.style.display='none';document.body.appendChild(sl);let idx=0,cur=[];
 const hide=()=>{sl.style.display='none'},place=()=>{const r=$('.input-wrap').getBoundingClientRect();sl.style.left=r.left+'px';sl.style.width=Math.min(r.width,420)+'px';sl.style.top='auto';sl.style.bottom=(innerHeight-r.top+8)+'px';sl.style.display='block'};
 const draw=()=>{sl.innerHTML=cur.map((c,i)=>`<button data-i="${i}" style="${i===idx?'background:var(--surface-2)':''}"><b>${c[0]}</b><span style="opacity:.6;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c[1].trim().slice(0,38))}</span></button>`).join('');place()};
 const pick=i=>{ta.value=cur[i][1];hide();ta.focus();ta.dispatchEvent(new Event('input'))};
 ta.addEventListener('input',()=>{const v=ta.value;if(/^\/\w*$/.test(v)){cur=SLASH.filter(c=>c[0].startsWith(v.toLowerCase()));idx=0;cur.length?draw():hide()}else hide();meter()});
 ta.addEventListener('keydown',e=>{if(sl.style.display==='none')return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();idx=(idx+(e.key==='ArrowDown'?1:-1)+cur.length)%cur.length;draw()}else if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();pick(idx)}else if(e.key==='Escape')hide()},true);
 sl.onclick=e=>{const b=e.target.closest('button');b&&pick(+b.dataset.i)};
 const mt=document.createElement('div');mt.id='gMeter';mt.style.cssText='position:absolute;right:58px;top:-22px;font:600 11px var(--font-ui);opacity:.45;pointer-events:none';$('.input-wrap').style.position='relative';$('.input-wrap').appendChild(mt);
 function meter(){const n=Math.ceil(ta.value.length/4);mt.textContent=n>20?'~'+fmt(n)+' tokens':''}
 const cb=$('#chatBox'),sd=document.createElement('button');sd.id='gDown';sd.setAttribute('aria-label','Scroll to latest');sd.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';document.body.appendChild(sd);
 const sc=cb.closest('.chat-area')||cb;const scr=()=>{const el=[cb,cb.parentElement].find(x=>x&&x.scrollHeight>x.clientHeight+10)||cb;sd.classList.toggle('on',el.scrollHeight-el.scrollTop-el.clientHeight>240);return el};
 [cb,cb.parentElement].forEach(x=>x&&x.addEventListener('scroll',scr,{passive:true}));new MutationObserver(scr).observe(cb,{childList:true});sd.onclick=()=>{const el=scr();el.scrollTo({top:el.scrollHeight,behavior:'smooth'})};
 /* feedback buttons on replies */
 const addFb=()=>$$('.message-wrapper.model .msg-actions:not([data-fb])',cb).forEach(a=>{a.dataset.fb=1;a.insertAdjacentHTML('beforeend','<button class="msg-btn gfb" data-v="up" aria-label="Good answer">👍</button><button class="msg-btn gfb" data-v="down" aria-label="Bad answer">👎</button>')});
 cb.addEventListener('click',e=>{const b=e.target.closest('.gfb');if(!b)return;const on=!b.classList.contains('on');$$('.gfb',b.parentElement).forEach(x=>x.classList.remove('on'));b.classList.toggle('on',on);toast(on?(b.dataset.v==='up'?'Thanks, noted.':'Noted. Try Retry or switch the expert mode.'):'Feedback cleared')});
 new MutationObserver(()=>requestAnimationFrame(addFb)).observe(cb,{childList:true,subtree:true});addFb();
 /* shortcuts sheet */
 const keys=[['Enter','Send'],['Shift+Enter','New line'],['/','Prompt shortcuts'],['Ctrl/Cmd+K','Search chats'],['Ctrl/Cmd+Shift+O','New chat'],['Ctrl/Cmd+Shift+T','Temporary chat'],['Ctrl/Cmd+.','Toggle extended thinking'],['Esc','Close dialogs'],['?','This list']];
 const ks=document.createElement('div');ks.className='modal-overlay';ks.id='gKeys';ks.onclick=e=>{if(e.target===ks)ks.classList.remove('active')};ks.innerHTML='<div class="settings-modal gs-sheet" style="max-width:420px!important"><div class="modal-header"><h3>Keyboard shortcuts</h3><div class="close-modal" onclick="gKeys.classList.remove(\'active\')">&times;</div></div>'+keys.map(k=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line)"><span>${k[1]}</span><kbd style="font:600 12px var(--font-ui);padding:3px 8px;border-radius:7px;background:var(--surface-2)">${k[0]}</kbd></div>`).join('')+'</div>';document.body.appendChild(ks);
 addEventListener('keydown',e=>{const t=e.target,typing=t&&/input|textarea|select/i.test(t.tagName),mod=e.ctrlKey||e.metaKey;
  if(e.key==='?'&&!typing){ks.classList.add('active')}else if(mod&&e.shiftKey&&e.key.toLowerCase()==='o'){e.preventDefault();createNewChat()}else if(mod&&e.shiftKey&&e.key.toLowerCase()==='t'){e.preventDefault();tempChat()}else if(mod&&e.key==='.'){e.preventDefault();$('#gThink')&&$('#gThink').click()}else if(e.key==='Escape')ks.classList.remove('active')});
 /* help tab link */
 const h=$('.gx-help');h&&h.insertAdjacentHTML('beforeend','<button type="button" class="g-sm" onclick="gKeys.classList.add(\'active\')" style="margin-top:8px">Keyboard shortcuts</button>')}

/* ---- "+" menu: all modes live behind one calm button ---- */
function plusMenu(){const tb=$('.input-toolbar');if(!tb||$('#gPlus'))return;
 const I={plus:'M12 5v14M5 12h14',code:'M8 8l-5 4 5 4M16 8l5 4-5 4',bulb:'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',multi:'M13 2L4 14h7l-1 8 9-12h-7z',web:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',mic:'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',town:'M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10M2 10l10-6 10 6',media:'M4 5h16v14H4zM8 14l3-3 3 3 2-2 3 3M9 9h.01'};
 const svg=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;
 const btn=document.createElement('button');btn.type='button';btn.id='gPlus';btn.setAttribute('aria-label','More options');btn.innerHTML=svg(I.plus);tb.insertBefore(btn,tb.firstChild);
 const m=document.createElement('div');m.id='gPlusMenu';document.body.appendChild(m);
 const txt=id=>{const e=$(id);return e?e.textContent.replace(/[^\w: ]/g,'').trim():''};
 const draw=()=>{const pm=LS.get(MODEKEY,'auto'),th=LS.get('glint_think','0')==='1',multi=/Multi/i.test(($('#multiToggle')||{}).className||'')||$('#multiToggle')?.classList.contains('active');
  m.innerHTML=`<button class="gpm-row" data-a="persona">${svg(I.code)}Expert mode<em>${pm[0].toUpperCase()+pm.slice(1)}</em></button>
  <div class="gpm-seg">${['auto','code','research','write'].map(k=>`<button class="gx-pill ${pm===k?'on':''}" data-p="${k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
  <button class="gpm-row" data-a="think">${svg(I.bulb)}Extended thinking<span class="gpm-sw ${th?'on':''}"></span></button>
  <button class="gpm-row" data-a="multi">${svg(I.multi)}Multi-model<span class="gpm-sw ${multi?'on':''}"></span></button>
  <button class="gpm-row" data-a="web">${svg(I.web)}Web search<em>${txt('#webChip').replace(/^Web:?\s*/,'')||'Auto'}</em></button>
  <button class="gpm-row" data-a="media">${svg(I.media)}Create<em>${txt('#gMode')||'Chat'}</em></button>
  <div class="gpm-sep"></div>
  <button class="gpm-row" data-a="mic">${svg(I.mic)}Dictate with voice</button>
  <button class="gpm-row" data-a="town">${svg(I.town)}Townhall</button>`;
  btn.classList.toggle('dot',pm!=='auto'||th||!!multi)};
 const place=()=>{const r=btn.getBoundingClientRect();m.style.left=Math.max(10,Math.min(r.left,innerWidth-m.offsetWidth-10))+'px';m.style.bottom=(innerHeight-r.top+10)+'px'};
 let t;const open=()=>{clearTimeout(t);draw();place();m.classList.add('on');btn.classList.add('open')},close=()=>{m.classList.remove('on');btn.classList.remove('open')};
 const hover=matchMedia('(hover:hover)').matches;
 btn.onclick=e=>{e.stopPropagation();m.classList.contains('on')?close():open()};
 if(hover){btn.onmouseenter=()=>{t=setTimeout(open,180)};btn.onmouseleave=()=>{clearTimeout(t);t=setTimeout(()=>{if(!m.matches(':hover'))close()},320)};m.onmouseleave=()=>{t=setTimeout(()=>{if(!btn.matches(':hover'))close()},380)};m.onmouseenter=()=>clearTimeout(t)}
 document.addEventListener('click',e=>{if(!e.target.closest('#gPlusMenu,#gPlus'))close()},true);addEventListener('resize',close);
 m.onclick=e=>{const p=e.target.closest('[data-p]');if(p){LS.set(MODEKEY,p.dataset.p);window.__gSyncPers&&__gSyncPers();draw();return}
  const a=e.target.closest('[data-a]')?.dataset.a;if(!a||a==='persona')return;
  if(a==='think'){$('#gThink').click();draw()}else if(a==='multi'){$('#multiToggle')?.click();setTimeout(draw,60)}else if(a==='web'){$('#webChip')?.click();setTimeout(draw,60)}else if(a==='media'){$('#gMode')?.click();setTimeout(draw,60)}
  else if(a==='mic'){close();$('#micChip')?.click()}else if(a==='town'){close();try{openTownhall()}catch(x){}}};
 draw()}

/* ---- every chat has its own URL (/c/<id>) ---- */
const CHATPATH=/^\/(chat|app|c\/[\w-]+)?\/?$/;
function syncUrl(){try{if(!CHATPATH.test(location.pathname))return;const c=chats[currentChatId];if(!c||c.temp){if(/^\/c\//.test(location.pathname))history.replaceState({},'','/chat');return}const u='/c/'+currentChatId;if(location.pathname!==u)history.replaceState({},'',u)}catch(e){}}
function patchUrls(){try{const o=renderChatBox;renderChatBox=function(){const r=o.apply(this,arguments);syncUrl();return r}}catch(e){}}
function openFromUrl(){const m=location.pathname.match(/^\/c\/([\w-]+)\/?$/);if(!m)return;if(chats[m[1]]){if(currentChatId!==m[1]){currentChatId=m[1];try{saveChatsToStorage()}catch(e){}renderChatList();renderChatBox()}}else{toast('That chat is not on this device. Sign in with the account that owns it.');history.replaceState({},'','/chat')}}
function afterUnlock(fn){let n=0;const t=setInterval(()=>{n++;if(!$('#gAuth')&&Object.keys(chats||{}).length){clearInterval(t);setTimeout(fn,350)}else if(n>240)clearInterval(t)},250)}

/* ---- public share links (permanent until you stop sharing) ---- */
const SH={get:()=>{try{return JSON.parse(LS.get('glint_shares','{}'))}catch(e){return{}}},set:o=>LS.set('glint_shares',JSON.stringify(o))};
const api=b=>fetch('/api/glint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j});
const snap=c=>(c.history||[]).map(m=>({r:m.role==='user'?'u':'m',t:(m.parts||[]).map(p=>p.text||'').join('').replace(/\n*--- File: [\s\S]*?```\n[\s\S]*?\n```/g,'')})).filter(m=>m.t.trim());
async function publishChat(id){const c=chats[id],all=SH.get(),old=all[id];const link=x=>location.origin+'/s/'+x;
 if(!old&&!confirm('Create a public link?\n\nAnyone with the link can read this chat as it is now (text only, no files or API keys). You can stop sharing any time from the chat menu.'))return;
 try{const r=await api({op:'sshare',title:c.title,msgs:snap(c),sid:old&&old.id,tok:old&&old.tok});all[id]={id:r.id,tok:r.tok};SH.set(all);
  if(navigator.share&&matchMedia('(pointer:coarse)').matches)navigator.share({title:c.title,url:link(r.id)}).catch(()=>{});else await navigator.clipboard.writeText(link(r.id)).catch(()=>{});
  toast(old?'Share link updated with the latest messages':'Public link copied: '+link(r.id),'ok')}catch(e){toast('Could not share: '+e.message)}}
async function unpublishChat(id){const all=SH.get(),o=all[id];if(!o)return;try{await api({op:'sdel',sid:o.id,tok:o.tok});delete all[id];SH.set(all);toast('Link disabled','ok')}catch(e){toast('Could not stop sharing: '+e.message)}}
/* ---- boot ---- */
function boot(){toolbarChips();plusMenu();extras();patchUrls();patchStorage();patchList();patchLogout();addSidebarBits();wireAcct();buildAcct();sendGuard();previewMsgs();mobileFix();
 try{wrap('openTownhall',()=>go('/townhall'));wrap('closeTownhall',()=>{if(location.pathname==='/townhall'){go('/chat');syncUrl()}})}catch(e){}
 try{const o=switchChat;switchChat=function(id){if(chats[currentChatId]&&chats[currentChatId].temp&&currentChatId!==id){const t=currentChatId;currentChatId=id;delete chats[t];saveChatsToStorage();renderChatList();renderChatBox();return}const r=o.apply(this,arguments);banner();return r}}catch(e){}
 addEventListener('pagehide',()=>{try{purgeTemp()}catch(e){}});
 afterUnlock(()=>{openFromUrl();syncUrl();route()})}
const wait=()=>{if(window.GC&&window.GA&&$('#gAcct')&&typeof renderChatList==='function')boot();else setTimeout(wait,150)};
if(location.protocol.startsWith('http'))wait();
})();
