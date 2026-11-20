'use strict';
const iconPaths={
 home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 activity:'<path d="M3 17v-2a8.8 8.8 0 0 1 5.5-8M15.5 7a8.8 8.8 0 0 1 5.5 8v2M10 11l-.6-7h5.2l-.6 7M2 17h20v3H2z"/>',
 book:'<path d="M12 6c-3-2-6-2.4-10-1v14c3.5-1.3 7-1 10 1 3-2 6.5-2.3 10-1V5c-4-1.4-7-1-10 1zm0 0v14"/>',
 ask:'<path d="M20 14a3 3 0 0 1-3 3h-6l-5 4v-4H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/><path d="M7 8h8M7 12h5"/>',
 save:'<path d="M6 3h12v18l-6-4-6 4z"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 chev:'<path d="m9 5 7 7-7 7"/>',file:'<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 15.5h8M8 19h5"/>',
 open:'<path d="M13 3h8v8m0-8L10 14M10 5H4v15h15v-6"/>',print:'<path d="M7 8V3h10v5M7 16H3V9h18v7h-4M7 14h10v7H7z"/>',link:'<path d="m9 15 6-6m-4 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 5-1m0 10a4 4 0 0 0 5-1l4-4a4 4 0 0 0-6-6l-2 2"/>',check:'<path d="m3 12 6 6L21 6"/>',
 layers:'<path d="m12 3 10 5-10 5L2 8zm-9 9 9 5 9-5m-18 5 9 5 9-5"/>',filter:'<path d="M3 6h18M6 12h12M9 18h6"/>',down:'<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>'
};
const icon=(name,extra='')=>'<svg class="ic '+extra+'" aria-hidden="true" viewBox="0 0 24 24">'+(iconPaths[name]||'')+'</svg>';
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const encode=encodeURIComponent;
const content=document.getElementById('content');
const embeddedEdition = document.getElementById('field-edition');
const fieldEdition = embeddedEdition ? JSON.parse(embeddedEdition.textContent) : null;
const pdfFilename='MSHEM-Version-001-Field.pdf';
const fieldPdfUrl='mshem-v001.pdf?view=approval-page';
let issuedPdfObjectUrl;
let pdfBlob, pdfObjectUrl, pdfFile, pendingPdf;
function embeddedPdf(){
 if(!pdfBlob){
  const bytes=Uint8Array.from(atob(fieldEdition.pdf),ch=>ch.charCodeAt(0));
  pdfBlob=new Blob([bytes],{type:'application/pdf'});
 }
 return pdfBlob;
}
function pdfDownloadUrl(){
 if(!pdfObjectUrl)pdfObjectUrl=URL.createObjectURL(pdfBlob);
 return pdfObjectUrl;
}
function sourcePdf(){
 if(!fieldEdition)return fieldPdfUrl;
 embeddedPdf();
 return pdfDownloadUrl();
}
function issuedPdf(){
 if(!fieldEdition)return 'mshem-v001-issued.pdf';
 if(!issuedPdfObjectUrl){
  const original=embeddedPdf().slice(0,fieldEdition.issuedPdfBytes,'application/pdf');
  issuedPdfObjectUrl=URL.createObjectURL(original);
 }
 return issuedPdfObjectUrl;
}
const pdfLink=(pg,label='Open source page')=>'<a class="textlink" href="'+sourcePdf()+'#page='+Number(pg)+'" target="_blank" rel="noopener">'+esc(label)+'</a>';
const links={home:['Overview','home'],activities:['Activities','activity'],processes:['Processes','book'],ask:['Ask MSHEM','ask'],saved:['Saved','save']};
const nav=active=>Object.entries(links).map(([key,[txt,ic]])=>'<a class="navlink '+(active===key?'active ':'')+(key==='saved'?'saved':'')+'" href="#'+key+'" '+(active===key?'aria-current="page"':'')+'>'+icon(ic)+'<span>'+txt+'</span></a>').join('');
const state={activities:{q:'',area:'',limit:24},processes:{q:'',area:'',part:'',limit:24},search:{limit:15},asked:'',clauseQuery:'',askMode:'',offline:'',saveError:false};
let assistantIndex,data,faqs,processes,activities,clauses,searchP,searchA,searchC;
const savedKey='mshemFavs';
function saved(){try{const a=JSON.parse(localStorage.getItem(savedKey)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'):[];}catch{return [];}}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.textContent='',2500);}
function saveBtn(key){const on=saved().includes(key);return '<button class="btn '+(on?'on':'')+'" data-save="'+esc(key)+'" aria-pressed="'+on+'">'+icon(on?'check':'save')+(on?'Saved':'Save')+'</button>';}
function actionRow(key){return '<div class="actions hideprint">'+saveBtn(key)+'<button class="btn" data-copy>'+icon('link')+'Copy link</button><button class="btn" data-print>'+icon('print')+'Print reference</button></div>';}
function breadcrumb(name,parent){return '<div class="bread"><a href="#home">Overview</a>'+icon('chev')+(parent?'<a href="#'+parent[0]+'">'+esc(parent[1])+'</a>'+icon('chev'):'')+'<span>'+esc(name)+'</span></div>';}
function pageHead(title,desc='',kicker=''){return '<div class="pageheader">'+(kicker?'<div class="eyebrow">'+esc(kicker)+'</div>':'')+'<h1>'+esc(title)+'</h1>'+(desc?'<p>'+esc(desc)+'</p>':'')+'</div>';}
function page(body){return '<div class="frame page">'+body+'<p class="printline small hide">Maaden MSHEM · Version 001 · Effective 1 January 2027 · MD-152-1000-HS-GE-STD-0001</p></div>';}
function row(href,code,title,sub=''){return '<a class="row" href="#'+esc(href)+'"><div class="rowmain">'+(code?'<span class="code">'+esc(code)+'</span>':'')+'<div><strong>'+esc(title)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div></div>'+icon('chev','chev')+'</a>';}
const pRow=(p,sub='')=>row('process='+p.id,p.id,p.title,sub);
const aRow=a=>row('activity='+a.id,a.id,a.title,a.area+' · '+a.category);
const cRow=c=>row('clause='+c.id,c.id,c.heading||processes.get(c.pid).title,shortText(c.text,155));
function shortText(text,limit){const s=text.replace(/\[Table [^\]]+\]/g,'').replace(/\s+/g,' ').trim();return s.length>limit?s.slice(0,limit).replace(/\s+\S*$/,'')+'…':s;}
const rows=items=>'<div class="rows">'+items.join('')+'</div>';
function quick(to,ic,theme,title,desc){return '<a class="quick" href="#'+to+'"><span class="tileicon '+theme+'">'+icon(ic)+'</span><div class="quickbody"><h3>'+title+'</h3><p>'+desc+'</p></div></a>';}
function home(){
 return '<section class="hero"><div class="frame"><div class="eyebrow">Corporate EHSS &nbsp; / &nbsp; Version 2.0</div><h1>MSHEM <span>Navigator</span></h1><p>Find the right requirements for the job. Search by activity, process or clause in the approved Maaden standard.</p><form class="heroform" data-global>'+icon('search')+'<input name="q" aria-label="Search the Navigator" placeholder="Search a task, topic or clause…" required maxlength="220"><button>Search</button></form></div></section>'+
 '<div class="frame bodypad"><div class="sectionhead"><h2>Quick access</h2></div><div class="quickgrid">'+
 quick('activities','activity','','Find my activity','Match the work you’re doing to the relevant MSHEM processes.')+quick('processes','book','gray','Explore processes','Browse the six Parts and read the requirements for each process.')+quick('ask','ask','rust','Ask MSHEM','Ask a question in your own words and check the source clause.')+
 '</div><section class="dashboard"><div><div class="splithead"><h2>Frontline references</h2><a class="mutelink" href="#processes">View all processes</a></div>'+rows(['2.8','3.21','3.23','3.24'].map(id=>pRow(processes.get(id))))+'</div><aside class="standardcard">'+icon('file','water')+'<div class="eyebrow">Controlled reference</div><h2>Approved MSHEM</h2><p>Maaden Safety, Security, Health and Environment Management System</p><div class="docmeta"><div><small>Standard version</small><b>001</b></div><div><small>Effective from</small><b>1 January 2027</b></div></div><a class="docbutton" href="'+sourcePdf()+'#page=1" target="_blank" rel="noopener">'+icon('file')+'Open approved standard '+icon('open')+'</a></aside></section></div>';
}
function options(values,selected,label){return '<option value="">'+esc(label)+'</option>'+values.map(x=>'<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('');}
function control(id,value,placeholder){return '<label class="control">'+icon('search')+'<input type="search" id="'+id+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'" aria-label="'+esc(placeholder)+'" maxlength="220"></label>';}
function directory(type){
 const activity=type==='activities',s=state[type],list=activity?data.activities:data.processes;
 const areaLabel=activity?'All operational areas':'All process areas';
 const areas=[...new Set(list.map(x=>x.area))].sort();
 return page(breadcrumb(activity?'Activities':'Processes')+pageHead(activity?'Find my activity':'Explore processes',activity?'Choose the work you are doing to see where to start and which other processes may apply.':'Browse the 78 processes and the Part 1 framework, or enter a process or clause number.')+
 '<div class="tools">'+control('listq',s.q,activity?'Search activities, tasks or equipment':'Search processes, topics or clause IDs')+(activity?'':'<select class="select" id="part" aria-label="Filter by Part">'+options(['1','2','3','4','5','6'],s.part,'All six Parts').replace(/>([1-6])<\/option>/g,'>Part $1</option>')+'</select>')+'<select class="select" id="area" aria-label="'+areaLabel+'">'+options(areas,s.area,areaLabel)+'</select></div><div id="listresults"></div>');
}
function directoryResults(type){
 const s=state[type],activity=type==='activities',q=s.q.trim();
 let list=activity?data.activities:data.processes;
 const exactClause=!activity?clauses.get(q):null;
 if(q)list=(activity?searchA:searchP)(q).filter(r=>r.coverage>=.45).map(r=>r.item);
 list=list.filter(v=>(!s.area||v.area===s.area)&&(!s.part||v.id.split('.')[0]===s.part));
 const exact=exactClause&&(!s.part||exactClause.id[0]===s.part)&&(!s.area||processes.get(exactClause.pid).area===s.area);
 const label=activity?'activities':'sections';
 document.getElementById('listresults').innerHTML=(exact?'<div class="results-meta">Exact clause</div>'+rows([cRow(exactClause)]):'')+'<div class="results-meta">'+list.length+' '+label+'</div>'+(list.length?rows(list.slice(0,s.limit).map(v=>activity?aRow(v):pRow(v,v.area+' · Part '+v.id.split('.')[0]))):empty('No matching '+label+'. Try another term or clear the filters.'))+(list.length>s.limit?more():'');
}
const more=()=>'<button class="btn more" data-more>Show more results</button>';
const empty=msg=>'<div class="empty">'+esc(msg)+'</div>';
const types=[['Primary','Go first','The best place to start for this activity.'],['Direct','Also apply','These processes normally apply to this work.'],['Conditional','If relevant','Check each trigger against the scope and conditions of the job.']];
function activityDetail(a){
 if(!a)return missing();
 const groups=types.map(([key,title,desc])=>{const group=a.links.filter(x=>x[1]===key);return group.length?'<section class="bucket"><h2>'+title+'<span class="count">'+group.length+'</span></h2><p class="small">'+desc+'</p>'+rows(group.map(([id,,trigger])=>pRow(processes.get(id),trigger)))+'</section>':'';}).join('');
 return page(breadcrumb(a.id,['activities','Activities'])+pageHead(a.title,a.scope,a.area+' / '+a.id)+actionRow('A:'+a.id)+'<p class="help">Use the approved site procedure and applicable permits to plan the job. These activity mappings are navigation aids.</p>'+groups);
}
function clauseText(c){
 return esc(c.text).replace(/\[Table (table-\d+-(?:\d+|image)\.png)\]/g,(_,name)=>'<img src="'+(fieldEdition ? fieldEdition.tables[name] : 'assets/'+name)+'" alt="Table accompanying clause '+esc(c.id)+'. Open the linked PDF for the original table." loading="lazy">');
}
function clauseBlock(c,highlight=false){
 return '<article class="clause '+(highlight?'highlight':'')+'" id="cl-'+c.id+'"><div class="metadata"><a href="#clause='+c.id+'" class="code">'+c.id+'</a>'+pdfLink(c.page,'PDF p. '+c.page)+'</div><p>'+clauseText(c)+'</p></article>';
}
function processDetail(p){
 if(!p)return missing();
 const refs=p.refs||[], related=data.activities.filter(a=>a.links.some(x=>x[0]===p.id));
 const groups=types.map(([key,title])=>{const acts=related.filter(a=>a.links.some(x=>x[0]===p.id&&x[1]===key));return acts.length?'<h3 class="listhead">'+title+'<span class="count">'+acts.length+'</span></h3>'+rows(acts.map(aRow)):'';}).join('');
 return page(breadcrumb('Section '+p.id,['processes','Processes'])+pageHead(p.title,'','Part '+p.id.split('.')[0]+' / '+p.area+' / '+p.id)+actionRow('P:'+p.id)+'<section class="panel"><h2>'+ (p.id.startsWith('1.')?'Framework':'Purpose')+'</h2><p>'+esc(p.purpose)+'</p>'+(p.scope?'<details><summary>Scope and applicability</summary><div>'+esc(p.scope)+'</div></details>':'')+'<p class="small">'+pdfLink(p.page,'Open approved section · PDF p. '+p.page)+'</p></section>'+
 (p.clauses.length?'<section class="panel"><h2>Requirements <span class="count">'+p.clauses.length+' clauses</span></h2><div class="tools hideprint">'+control('clausefilter',state.clauseQuery,'Find a term or clause in this process')+'</div><div id="clauselist"></div></section>':'')+
 (refs.length?'<details class="panel"><summary>Referenced processes ('+refs.length+')</summary><div>'+rows(refs.map(x=>pRow(processes.get(x))))+'</div></details>':'')+(related.length?'<details class="panel"><summary>Activities linked to this process ('+related.length+')</summary><div>'+groups+'</div></details>':''));
}
function renderClauses(p){const node=document.getElementById('clauselist');if(!node)return;let last='';const q=state.clauseQuery.trim().toLowerCase();const parts=p.clauses.filter(c=>(c.id+' '+c.text+' '+c.heading).toLowerCase().includes(q)).map(c=>{const h=c.heading!==last?'<h3 class="listhead">'+esc(c.heading)+'</h3>':'';last=c.heading;return h+clauseBlock(c);});node.innerHTML=parts.length?parts.join(''):empty('No matching clause in this process.');}
function clauseDetail(c){
 if(!c)return missing();const p=processes.get(c.pid);return page(breadcrumb(c.id,['process='+p.id,p.id+' '+p.title])+pageHead('Clause '+c.id,c.heading,p.title)+actionRow('C:'+c.id)+'<section class="panel">'+clauseBlock(c)+'</section><a class="btn" href="#process='+p.id+'">'+icon('book')+'Read the complete process</a>');
}
function missing(){return page(breadcrumb('Reference')+pageHead('Reference unavailable','Choose an activity or process from the Navigator.')+'<a class="btn" href="#home">Return to overview</a>');}
function questionButton(q) {
  return '<button class="question" data-ask="'+esc(q)+'"><span>'+esc(q)+'</span>'+icon('chev','chev')+'</button>';
}
const questionLibrary = {process:'', query:'', limit:6};
function askPage(q) {
  state.asked=q||'';
  const intro=pageHead('Ask MSHEM','Describe the job or ask about a requirement. Every direct answer links to the approved MSHEM and its PDF page.');
  const form='<section class="askpanel"><form id="askform"><label for="askinput">Your question</label>'+
    '<textarea id="askinput" name="q" placeholder="Can the same person issue and receive a work permit?" maxlength="600" required>'+esc(state.asked)+'</textarea>'+
    '<details><summary>Help me write a question</summary><div class="small">Choose a starting phrase and add the task or equipment. You can also enter a clause number.</div><div class="chips">'+
    ['What should I check before','Who can approve','What changes if','How often must we inspect'].map(v=>'<button type="button" class="chip" data-starter="'+esc(v)+'">'+v+'…</button>').join('')+
    '</div></details><button class="action">'+icon('ask')+'Find an answer</button></form><section id="answerbox" aria-live="polite"></section></section>';
  const pOptions=data.processes.map(p=>'<option value="'+p.id+'" '+(questionLibrary.process===p.id?'selected':'')+'>'+p.id+' · '+esc(p.title)+'</option>').join('');
  const library='<aside class="askpanel question-library"><h2>Browse field questions</h2><p class="small">'+faqs.length+' questions across all 78 processes and the Part 1 framework.</p>'+
    '<label class="qlabel" for="questionprocess">Process</label><select id="questionprocess" class="select"><option value="">All processes</option>'+pOptions+'</select>'+
    '<div class="tools">'+control('questionfilter',questionLibrary.query,'Find a field question')+'</div><div id="fieldquestions"></div></aside>';
  return page(breadcrumb('Ask MSHEM')+intro+'<div class="asklayout">'+form+library+'</div>');
}
function fieldQuestions() {
  const panel=document.getElementById('fieldquestions');
  if(!panel)return;
  const {process,query,limit}=questionLibrary;
  const suggestions=query.trim()?assistantIndex.rankCards(query,process).filter(r=>r.score>=.35).map(r=>r.card):
    faqs.filter(card=>!process||assistantIndex.cardProcess(card)===process);
  const examples=!query.trim()&&!process;
  const picks=examples?[0,1,8,9].map(i=>faqs[i]):[];
  const ordered=examples?[...picks,...suggestions.filter(card=>!picks.includes(card))]:suggestions;
  const visible=ordered.slice(0,limit);
  panel.innerHTML='<p class="small" role="status">'+(ordered.length?'Showing '+visible.length+' of '+ordered.length:'No matching questions. You can still ask your question directly.')+'</p>'+
    '<div class="questions">'+visible.map(v=>questionButton(v.question)).join('')+'</div>'+
    (ordered.length>limit?'<button class="btn more" data-more-questions>Show more questions</button>':'');
}
function sourcePill(id) {
  const c=clauses.get(id),p=processes.get(id),ref=c||p;
  return '<a class="chip" href="#'+(c?'clause':'process')+'='+id+'">'+(c?'Clause ':'Section ')+id+'</a> '+pdfLink(ref.page,'PDF p. '+ref.page);
}
function showSource(id) {
  const c=clauses.get(id);
  if(c)return clauseBlock(c);
  const p=processes.get(id);
  return '<article class="clause"><div class="metadata">'+sourcePill(id)+'</div><h3>'+esc(p.title)+'</h3><p>'+esc(p.purpose)+'</p>'+(p.scope?'<p>'+esc(p.scope)+'</p>':'')+'</article>';
}
function sourceDetails(ids) {
  return '<details><summary>Read the approved wording</summary><div>'+ids.map(showSource).join('')+'</div></details>';
}
function answerFromSource(ids,isLookup) {
  return ids.map(id=>{
    const c=clauses.get(id),p=processes.get(id);
    const body=c?clauseText({...c,text:assistantIndex.simplify(c.text)}):esc(p.purpose);
    return '<article class="answer"><div class="tag">'+(isLookup?'Requested reference':'Answer from the standard')+'</div><h3>'+esc(c?(id+' · '+processes.get(c.pid).title):(id+' · '+p.title))+'</h3><div class="source-answer">'+body+'</div><div class="chips">'+sourcePill(id)+'</div></article>';
  }).join('')+sourceDetails(ids);
}
function answerFor(q) {
  const target=document.getElementById('answerbox');
  if(!q||!target)return;
  const result=assistantIndex.ask(q);
  if(result.kind==='card'){
    const card=result.card;
    target.innerHTML='<article class="answer"><div class="tag">Plain-language answer</div><h3>'+esc(card.question)+'</h3><p class="source-answer">'+esc(card.answer)+'</p><div class="chips">'+card.refs.map(sourcePill).join(' ')+'</div></article>'+sourceDetails(card.refs);
  }else if(result.kind==='topic'){
    const p=processes.get(result.id);
    const picks=faqs.filter(card=>assistantIndex.cardProcess(card)===result.id);
    target.innerHTML='<article class="answer"><div class="tag">Process reference</div><h3>'+esc(p.id+' · '+p.title)+'</h3><p>'+esc(p.purpose)+'</p>'+(p.scope?'<details><summary>Where it applies</summary><div>'+esc(p.scope)+'</div></details>':'')+'<div class="chips">'+sourcePill(p.id)+'</div></article>'+(picks.length?'<h3 class="listhead">Questions about this topic</h3><div class="questions">'+picks.slice(0,4).map(card=>questionButton(card.question)).join('')+'</div>':'');
  }else if(result.kind==='source'||result.kind==='reference'){
    target.innerHTML=answerFromSource(result.refs,result.kind==='reference');
  }else if(result.kind==='missing'){
    target.innerHTML='<div class="answer"><h3>Check the reference number</h3><p>MSHEM Version 001 has no indexed section or clause numbered '+esc(result.ids.join(', '))+'. Enter the full number or describe the topic.</p></div>';
  }else if(result.kind==='local'){
    target.innerHTML='<div class="answer"><h3>Check your site’s controlled information</h3><p>Ask your supervisor or site EHSS representative for the approved local details. For emergency contacts or assembly points, use your site emergency response plan.</p></div>';
  }else{
    const suggested=result.suggestions;
    const related=result.related;
    target.innerHTML='<div class="answer"><h3>'+(suggested.length?'Which question fits your job?':'More detail needed')+'</h3><p>'+(suggested.length?'Select the closest question for a cited answer, or add the equipment, work conditions or applicable process to your question.':'A direct answer could not be established from that wording. Add the task, equipment or condition you are asking about.')+'</p></div>'+
      (suggested.length?'<div class="questions">'+suggested.map(v=>questionButton(v.question)).join('')+'</div>':'')+
      (related.length?'<h3 class="listhead">Related source passages</h3>'+rows(related.map(id=>cRow(clauses.get(id)))):'')+
      '<div class="actions"><button class="btn" data-question-copy>'+icon('link')+'Copy question for follow-up</button></div>';
  }
}
function savedPage(){
 const list=saved().map(k=>{const [type,id]=k.split(':');if(type==='A'&&activities.has(id))return aRow(activities.get(id));if(type==='P'&&processes.has(id))return pRow(processes.get(id),'Process');if(type==='C'&&clauses.has(id))return cRow(clauses.get(id));return '';}).filter(Boolean);
 return page(breadcrumb('Saved')+pageHead('Saved references','Your activities, processes and clauses on this device.')+(list.length?rows(list):empty('Open any activity, process or clause and tap Save to keep it here.'))+offlinePanel());
}
function pdfControls(){
 const alternative=fieldEdition?'':'<a class="textlink" href="MSHEM-Version-001.zip?view=approval-page" download="MSHEM-Version-001-Field.zip">Download PDF as ZIP</a>';
 return '<div id="pdf-actions" class="actions"><button class="btn" data-pdf-prepare>'+icon('down')+'Download approved PDF</button></div>'+
  '<p class="small" role="status" id="pdf-status"></p>'+alternative;
}
async function loadApprovedPdf(){
 if(fieldEdition)return embeddedPdf();
 const response=await fetch(fieldPdfUrl,{credentials:'same-origin',headers:{Accept:'application/pdf'}});
 if(!response.ok)throw Error('PDF unavailable');
 const blob=await response.blob();
 if(!(await blob.slice(0,5).text()).startsWith('%PDF-') || !(await blob.slice(-1024).text()).includes('%%EOF'))throw Error('Incomplete PDF');
 return blob.slice(0,blob.size,'application/pdf');
}
async function prepareApprovedPdf(){
 const actions=document.getElementById('pdf-actions'),status=document.getElementById('pdf-status');
 if(!actions||!status)return;
 actions.innerHTML='<button class="btn" disabled>Preparing PDF…</button>';
 status.textContent='';
 try{
  if(!pdfBlob){
   if(!pendingPdf)pendingPdf=loadApprovedPdf().finally(()=>{pendingPdf=null;});
   pdfBlob=await pendingPdf;
  }
  if(!pdfFile && typeof File==='function')pdfFile=new File([pdfBlob],pdfFilename,{type:'application/pdf'});
  const url=pdfDownloadUrl();
  actions.innerHTML=(pdfFile && canShareFile(pdfFile)?'<button class="btn" data-pdf-share>Save or share PDF</button>':'')+
   '<a class="btn" data-pdf-file href="'+url+'" download="'+pdfFilename+'">'+icon('down')+'Save PDF file</a>'+
   '<a class="textlink" href="'+url+'" target="_blank" rel="noopener">Open PDF</a>';
  status.textContent='The field copy is ready to save. The approval signature is on page 2.';
 }catch{
  actions.innerHTML='<button class="btn" data-pdf-prepare>Retry PDF download</button>';
  status.textContent=fieldEdition?'Reopen the downloaded Navigator and try again.':'The PDF could not be prepared. Reconnect and retry, or use Download PDF as ZIP.';
 }
}
async function shareApprovedPdf(){
 const status=document.getElementById('pdf-status');
 try{await navigator.share({files:[pdfFile]});}
 catch(error){
  if(status)status.textContent=error.name==='AbortError'?'Save cancelled. You can still use Save PDF file.':'This browser could not open the save menu. Use Save PDF file or Open PDF.';
 }
}
function offlinePanel(){
 const edition='MSHEM Version 001 · Effective 1 January 2027';
 if(fieldEdition){
  return '<section class="panel"><h2>Offline field reference</h2><p>You are using the downloaded Navigator. The approved standard is included in this file.</p>'+pdfControls()+'<p class="small">'+edition+'</p></section>';
 }
 return '<section class="panel"><h2>Offline field reference</h2><p>While online, get a copy for your shift. Open the downloaded HTML file in a browser to use Activities, Ask MSHEM and the approved PDF offline.</p>'+
  '<div class="actions" id="field-download"><button class="btn" data-field-prepare>'+icon('down')+'Get offline Navigator</button></div><p class="small" id="field-status" role="status"></p>'+pdfControls()+'<p class="small">'+edition+'</p>'+
  '<details><summary>Keep a copy in this browser</summary><div id="offline-actions" class="actions"></div><p class="small" id="offlinemsg" role="status"></p></details></section>';
}
function about(){return page(breadcrumb('Document control')+pageHead('Source & document control','The approved PDF is the reference for exact wording, tables and appendices.')+'<section class="panel"><h2>Approved MSHEM</h2><dl class="deets"><dt>Document number</dt><dd>MD-152-1000-HS-GE-STD-0001</dd><dt>Document owner</dt><dd>Corporate EHSS</dd><dt>Standard version</dt><dd>001</dd><dt>Effective date</dt><dd>1 January 2027</dd><dt>Next review</dt><dd>1 January 2030</dd><dt>Navigator release</dt><dd>2.0</dd></dl><p>'+pdfLink(2,'View signed approval page · PDF p. 2')+'</p><p><a class="textlink" href="'+issuedPdf()+'" download="MSHEM-Version-001-Issued.pdf">Download issued original</a>'+'</p><p class="small">For internal Maaden use. Observe the document owner’s distribution conditions.</p></section>'+
 '<section class="panel"><h2>Finding your way through MSHEM</h2><p>The 78 processes are in Parts 2–6. Part 1 contains the purpose, scope and system structure. Browse the original '+pdfLink(221,'definitions')+', '+pdfLink(222,'incident severity matrix')+' or '+pdfLink(225,'EHSS risk matrix')+'.</p><p>The 208 activities and 2,402 representative links come from the User Navigation Tool. The workbook identifies them as draft mappings requiring BU and process-owner validation. A missing link does not establish non-applicability.</p><p>Use Go first to find an entry point, Also apply for other directly relevant processes, and If relevant to review the specific trigger for each conditional process.</p></section><section class="panel"><h2>How Ask MSHEM works</h2><p>Ask MSHEM matches everyday questions to plain-language answers across all processes. It also reads numbered references and answers additional questions from a closely matching requirement, preserving the conditions and limits. If the wording could refer to several requirements, it offers more specific questions or related passages. Questions are processed on the device. Use the approved site procedure and authorized personnel for job-specific decisions.</p></section>'+offlinePanel());}
function globalResults(q){
 const a=searchA(q).filter(r=>r.coverage>=.5),p=searchP(q).filter(r=>r.coverage>=.5),c=searchC(q).filter(r=>r.coverage>=.55);
 const requestedIds=[...new Set(q.match(/\b[2-6]\.\d+\.\d+\b/g)||[])],exact=requestedIds.length===1?clauses.get(requestedIds[0]):null;
 const group=(title,matches,maker)=>matches.length?'<section class="bucket"><h2>'+title+' <span class="count">'+matches.length+'</span></h2>'+rows(matches.slice(0,state.search.limit).map(x=>maker(x.item)))+'</section>':'';
 return page(breadcrumb('Search')+pageHead('Search the Navigator')+'<form class="tools" data-global>'+control('globalq',q,'Search a task, topic or clause').replace('<input ','<input name="q" required ')+'<button class="action">Search</button></form>'+
 (exact?'<h2 class="listhead">Exact clause</h2>'+rows([cRow(exact)]):'')+
 group('Activities',a,aRow)+group('Processes',p,v=>pRow(v,v.area))+group('Clauses',c,cRow)+((!p.length&&!a.length&&!c.length)?empty('No matches. Try an equipment name, work activity or approved clause number.'):'')+
 ((Math.max(a.length,p.length,c.length)>state.search.limit)?more():'')+'<div class="actions"><a class="btn" href="#ask='+encode(q)+'">'+icon('ask')+'Ask MSHEM about this</a></div>');
}
function route(){
 const hash=location.hash.slice(1)||'home',sep=hash.indexOf('=');
 try{return [sep<0?hash:hash.slice(0,sep),sep<0?'':decodeURIComponent(hash.slice(sep+1))];}catch{return ['missing',''];}
}
let lastView='';
function render(reset=true){
 if(!data)return;
 const [view,param]=route();const previous=lastView;lastView=view+'='+param;
 const parent={activity:'activities',process:'processes',clause:'processes',search:'home',about:'home'}[view]||view;
 for(const id of ['topnav','mobilenav'])document.getElementById(id).innerHTML=nav(parent);
 let html;
 switch(view){
 case 'home':html=home();break;
 case 'activities':case 'processes':html=directory(view);break;
 case 'activity':html=activityDetail(activities.get(param));break;
 case 'process':if(previous!==lastView)state.clauseQuery='';html=processDetail(processes.get(param));break;
 case 'clause':html=clauseDetail(clauses.get(param));break;
 case 'ask':html=askPage(param);break;case 'saved':html=savedPage();break;
 case 'about':html=about();break;case 'search':if(previous!==lastView)state.search.limit=10;html=globalResults(param);break;
 default:html=missing();
 }
 content.innerHTML=html;
 if(view==='activities'||view==='processes')directoryResults(view);
 if(view==='process'&&processes.has(param))renderClauses(processes.get(param));
 if(view==='ask'){fieldQuestions();if(param)answerFor(param);}
 if(!fieldEdition && (view==='about'||view==='saved')){showPreparedDownload();offlineAction('check');}
 document.title=(content.querySelector('h1')?.textContent||'MSHEM Navigator')+(view==='home'?' 2.0 · Maaden':' · MSHEM Navigator');
 if(reset){window.scrollTo({top:0,behavior:'instant'});content.focus({preventScroll:true});
  if(view==='ask'&&param&&window.matchMedia('(max-width:760px)').matches)document.getElementById('answerbox')?.scrollIntoView({block:'start'});
 }
}
let preparedFile, preparingFile;
const offlineFilename='MSHEM-Navigator-Offline.html';
function canShareFile(file){
 try{return !!navigator.canShare?.({files:[file]});}catch{return false;}
}
function showPreparedDownload(){
 const actions=document.getElementById('field-download');
 const status=document.getElementById('field-status');
 if(!actions || !status || !preparedFile)return;
 actions.innerHTML='<a class="btn" href="'+preparedFile.url+'" download="'+offlineFilename+'">'+icon('down')+'Download Navigator</a>'+
  (canShareFile(preparedFile.file)?'<button class="btn" data-field-share>Save using another app</button>':'');
 status.textContent='Download the file, then open it from Downloads in a browser.';
}
async function prepareDownload(){
 const button=document.querySelector('[data-field-prepare]');
 const status=document.getElementById('field-status');
 if(!button || !status)return;
 button.disabled=true;
 status.textContent='Preparing the offline Navigator…';
 try{
  if(!preparingFile)preparingFile=(async()=>{
   const response=await fetch('offline-navigator.bin?view=approval-page',{credentials:'same-origin'});
   if(!response.ok)throw Error('Download unavailable');
   const blob=await response.blob();
   if(!(await blob.slice(0,100).text()).startsWith('<!doctype html>\n<!-- MSHEM offline Navigator -->'))throw Error('Unexpected file');
   const file=new File([blob],offlineFilename,{type:'text/html'});
   preparedFile={file,url:URL.createObjectURL(file)};
  })().finally(()=>{preparingFile=null;});
  await preparingFile;
  showPreparedDownload();
 }catch{
  button.disabled=false;
  status.textContent='The download could not be prepared. Reconnect, reopen the Navigator while signed in and try again.';
 }
}
async function shareDownload(){
 if(!preparedFile || !canShareFile(preparedFile.file))return;
 try{await navigator.share({files:[preparedFile.file]});}
 catch(error){if(error.name!=='AbortError')toast('Use Download Navigator to save the file.');}
}
async function worker(action){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)throw Error('Browser storage unavailable');
 const manager=navigator.serviceWorker;
 let registration=await manager.getRegistration('./');
 if(!registration && action==='check')return null;
 if(!registration)registration=await manager.register('./service-worker.js',{scope:'./'});
 if(registration.active)return registration.active;
 let timer;
 try{
  const active=await Promise.race([manager.ready,new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('Worker unavailable')),12000);
  })]);
  return active.active;
 }finally{clearTimeout(timer);}
}
function sendWorker(w,action){return new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Offline preparation timed out. Check your connection and retry.'));},45000);channel.port1.onmessage=({data})=>{clearTimeout(timer);channel.port1.close();data.error?reject(new Error(data.error)):resolve(data);};w.postMessage({action},[channel.port2]);});}
let offlineBusy=false;
async function offlineAction(action){
 const el=document.getElementById('offline-actions'),msg=document.getElementById('offlinemsg');if(!el||offlineBusy)return;
 offlineBusy=true;el.innerHTML='';msg.textContent=action==='save'?'Saving files for offline use…':action==='clear'?'Removing the offline copy…':'Checking this device…';
 try{
 const w=await worker(action),res=w?await sendWorker(w,action):{ready:false};
 msg.textContent=res.ready?(res.current===false?'Your earlier offline copy is available. Refresh it while online to get the latest Navigator.':'Version 001 is available offline on this device.'):'You can also save a browser copy while online if your browser supports it.';
 el.innerHTML=res.ready?((res.current===false?'<button class="btn" data-offline="save">Refresh offline copy</button>':'')+'<button class="btn" data-offline="clear">Remove offline copy</button>'):'<button class="btn" data-offline="save">'+icon('down')+'Save for offline use</button>';
 }catch{
  msg.textContent=action==='clear'?'The browser could not confirm removal. Check the copy again.':'This browser could not prepare its offline copy. Use Get offline Navigator above.';
  el.innerHTML=action==='clear'?'<button class="btn" data-offline="check">Check browser copy</button>':'';
 }
 finally{offlineBusy=false;const current=document.getElementById('offline-actions');if(current&&current!==el)offlineAction('check');}
}
function ask(q){const h='#ask='+encode(q);if(location.hash===h){render(false);document.getElementById('answerbox')?.scrollIntoView({block:'nearest'});}else location.hash=h;}
content.addEventListener('submit',e=>{e.preventDefault();const q=new FormData(e.target).get('q')?.trim();if(!q)return;if(e.target.matches('[data-global]'))location.hash='search='+encode(q);else if(e.target.id==='askform')ask(q);});
content.addEventListener('input',e=>{const [view,param]=route();if(e.target.id==='questionfilter'){questionLibrary.query=e.target.value;questionLibrary.limit=6;fieldQuestions();}if(e.target.id==='listq'){state[view].q=e.target.value;state[view].limit=24;directoryResults(view);}if(e.target.id==='clausefilter'){state.clauseQuery=e.target.value;renderClauses(processes.get(param));}});
content.addEventListener('change',e=>{const [view]=route();if(e.target.id==='questionprocess'){questionLibrary.process=e.target.value;questionLibrary.limit=6;fieldQuestions();}if(['area','part'].includes(e.target.id)&&state[view]){state[view][e.target.id]=e.target.value;state[view].limit=24;directoryResults(view);}});
content.addEventListener('click',async e=>{
 if(e.target.closest('[data-pdf-file]')){
  document.getElementById('pdf-status').textContent=fieldEdition?'If the download does not start, select Open PDF and save it from the viewer.':'If the download does not start, use Download PDF as ZIP and extract the PDF from Downloads.';
 }
 const b=e.target.closest('button');if(!b)return;const [view]=route();
 if(b.hasAttribute('data-more')){if(view==='search'){state.search.limit+=20;render(false);}else{state[view].limit+=32;directoryResults(view);}}
 if(b.hasAttribute('data-more-questions')){questionLibrary.limit+=12;fieldQuestions();}
 if(b.dataset.ask)ask(b.dataset.ask);
 if(b.dataset.starter){const input=document.getElementById('askinput');input.value=b.dataset.starter+' ';input.focus();input.setSelectionRange(input.value.length,input.value.length);}
 if(b.dataset.save){const key=b.dataset.save,all=saved(),on=all.includes(key);try{localStorage.setItem(savedKey,JSON.stringify(on?all.filter(k=>k!==key):[...all,key]));b.outerHTML=saveBtn(key);toast(on?'Removed from saved references':'Saved on this device');}catch{toast('This browser could not save the reference.');}}
 if(b.hasAttribute('data-print'))window.print();
 if(b.hasAttribute('data-copy')||b.hasAttribute('data-question-copy')){
  const toCopy=b.hasAttribute('data-copy')?location.href:state.asked;
  try{await navigator.clipboard.writeText(toCopy);toast('Copied');}catch{window.prompt('Copy this text',toCopy);}
 }
 if(b.hasAttribute('data-pdf-prepare'))prepareApprovedPdf();
 if(b.hasAttribute('data-pdf-share'))shareApprovedPdf();
 if(b.hasAttribute('data-field-prepare'))prepareDownload();
 if(b.hasAttribute('data-field-share'))shareDownload();
 if(b.dataset.offline)offlineAction(b.dataset.offline);
});
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();content.focus();});
window.addEventListener('hashchange',()=>render());
(async function init(){
 try{
 const files=fieldEdition?[fieldEdition.index,fieldEdition.answers]:await Promise.all(['index-data.json','answers.json'].map(async f=>{const r=await fetch(f);if(!r.ok)throw Error('load');return r.json();}));
 [data,faqs]=files;
 assistantIndex=AskEngine.create(data,faqs);
 processes=new Map(data.processes.map(p=>[p.id,p]));activities=new Map(data.activities.map(a=>[a.id,a]));clauses=new Map();
 for(const p of data.processes)for(const c of p.clauses){c.pid=p.id;clauses.set(c.id,c);}
 searchA=Retriever.makeIndex(data.activities,a=>a.id+' '+a.title+' '+a.category,a=>a.area+' '+a.scope+' '+a.keywords);
 searchP=Retriever.makeIndex(data.processes,p=>p.id+' '+p.title,p=>p.area+' '+p.keywords+' '+p.purpose);
 searchC=Retriever.makeIndex([...clauses.values()],c=>c.id+' '+c.heading,c=>c.text+' '+processes.get(c.pid).title);
 render(false);
 }catch{content.innerHTML=page(pageHead('The Navigator could not load','Reconnect and reload the page, or open the approved standard directly.')+pdfLink(1,'Open approved standard')+'<div class="actions"><button class="btn" onclick="location.reload()">Reload</button></div>');}
})();
