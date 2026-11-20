/* Ask MSHEM runs on-device. Use a prepared answer when the question is
   identified, otherwise use the full relevant requirement with its conditions. */
const AskEngine = (() => {
  const fillers = new Set(('a about according all also am an and any are as ask at be been being by can could did do does for from had has have help how if in into is it its may me mshem must my of on or our please say says shall should some tell than that the their them then there these they this those to us want we what when where which who why will with would you your need needs needed requirement requirements specific explain show information find happens someone allowed').split(' '));
  const equivalent = [
    'scaffold scaffolds scaffolding', 'inspect inspected inspection inspections inspecting inspect checks check examined examine',
    'verify verification verifying verified confirm confirmation', 'permit permits permitted ptw',
    'work working worked', 'change changes changed changing', 'condition conditions',
    'lift lifts lifting', 'vehicle vehicles', 'drive driving', 'pedestrian pedestrians',
    'approve approval approvals approves approved signoff', 'authorize authorise authorised authorized authorization authorisation',
    'entry enter entering entrants', 'confined confinedspace', 'isolation isolate isolated isolating lockout loto',
    'hazard hazardous hazards', 'waste wastes', 'contractor contractors', 'subcontractor subcontractors',
    'retain retained retention kept keep keeping', 'record records', 'training train trained', 'frequency often frequently regular interval intervals',
    'brief briefing briefings', 'communicate communication communications', 'classify classification classified classifying',
    'equipment machinery', 'rig rigging', 'suspend suspension suspended', 'resume restart restarting resuming',
    'revalidation revalidation revalidate revalidated', 'respirator respirators', 'hearing noise',
    'monitor monitoring monitored', 'incident incidents', 'report reporting reported reports',
    'designation designated', 'firewatch firewatcher', 'weld welding welds welded',
    'worker workers personnel', 'maintain maintenance maintained', 'risk risks',
    'emergency emergencies', 'review reviewing reviewed reviews', 'shift shifts',
    'spill spilled spills spillage', 'rule rules', 'operator operators', 'scope scopes',
    'document documents documentation documented', 'fitcheck fitchecking', 'defect defective defects',
    'assess assessment assessed assessments', 'control controls', 'site sites worksite', 'weather forecast forecasts',
    'absent missing unavailable', 'failure fail failed fails', 'tag tags tagged', 'color colour colors colours',
    'dust dusty', 'fault malfunction malfunctioning', 'guard guards guarding', 'heat thermal',
    'alert alarm alarms alerts', 'sign signal signals signaling signalling', 'level levels',
    'expire expires expired expiry expiration', 'hold pause stop stopped stopping', 'prestart preuse',
    'first initial initially', 'body person people', 'load loads', 'extra additional', 'limit limits',
    'glove gloves', 'test tests testing tested', 'owner custodian ownership', 'photo photos photograph photography',
    'material materials', 'protect protection protective', 'plan plans planned planning', 'height heights',
    'practice practices', 'tank tanks', 'clean cleaning', 'job jobs task tasks',
    'system systems', 'respiratory respirator', 'annually annual yearly', 'keepout barricade barricades',
    'training competency competence competent', 'power energized energised energization', 'supply supplies',
    'identify identification identified identity', 'lost lose losing loss', 'inspect inspector inspectors',
    'frequency periodicity', 'interruption outage', 'assure assurance', 'lock locks locked', 'damaged damage',
    'refuge refuges', 'energy energies', 'duration long', 'issue issues issuing', 'receive receives receiving', 'end finished finish completed', 'inside contents', 'coworker colleague coworker', 'unknown unidentified', 'sign signs signing', 'apply applies applicable applicability'
  ];
  // Some words, such as inspector and inspection, denote different roles or
  // duties. Keep those distinctions available to the ranking and intent checks.
  const synonyms = new Map();
  for (const group of equivalent) {
    const [root, ...rest] = group.split(' ');
    for (const t of [root, ...rest]) if (!synonyms.has(t)) synonyms.set(t,root);
  }
  for (const word of ['competent','competency','competence']) synonyms.set(word,'competence');
  for (const word of ['inspector','inspectors']) synonyms.set(word,'inspector');
  synonyms.set('respiratory','respiratory');
  function normalize(value) {
    return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/['’]s\b/g,'').replace(/\bcan['’]t\b/g,'cannot').replace(/\bdon['’]t\b/g,'do not')
      .replace(/\bhow (often|frequently)\b/g,'frequency').replace(/\bhow long\b/g,'duration')
      .replace(/\b(sign[ -]off)\b/g,'approve').replace(/\b(take out of service|pull from service)\b/g,'remove service')
      .replace(/\bfire[ -]watch(er)?s?\b/g,'firewatch').replace(/\bpre[ -](use|start)\b/g,'preuse')
      .replace(/\bnear[ -]miss(es)?\b/g,'near miss').replace(/\bptw\b/g,'permit')
      .replace(/\bjsa\b/g,'job safety analysis').replace(/\btra\b/g,'task risk assessment')
      .replace(/\bppe\b/g,'personal protective equipment').replace(/\b(lsr|lsrs)\b/g,'life saving rules')
      .replace(/\b(ccm)\b/g,'critical control management').replace(/\bcse\b/g,'confined space entry')
      .replace(/\b(scba)\b/g,'self contained breathing apparatus').replace(/\bn\s*\/\s*a\b/g,'not applicable')
      .replace(/[^a-z0-9.]+/g,' ').replace(/\.+(?=\s|$)/g,'').trim();
  }
  function tokens(value) {
    const terms=normalize(value).split(/\s+/);
    return [...new Set(terms.filter(t=>t&&!fillers.has(t)).map(t=>synonyms.get(t)||t))];
  }
  function intent(text) {
    if(/\bhow (?:often|frequently)|\bfrequency\b|\bhow many times/i.test(text))return 'frequency';
    if(/\bhow long|\bhow (?:many|much)|\bmaximum\b|\bminimum\b|\bthreshold\b/i.test(text))return 'quantity';
    if(/\bwho\b|\bwhose\b/i.test(text))return 'role';
    if(/\b(can|may|allowed|permitted|prohibited|forbidden)\b/i.test(text))return 'permission';
    return '';
  }
  function supportsIntent(text,kind) {
    if(kind==='frequency')return /\b(hour|day|week|month|year|shift|interval|frequency|frequencies|before|after|annually|periodic|each use|prior to)/i.test(text);
    if(kind==='quantity')return /\d|\bat least|\bperiod|\bduration|\binterval|\bas long as|\buntil|\bas required|\bsite.specific|\brisk.based|\bwithin|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|each)\b/i.test(text);
    if(kind==='role')return /\b(person|operator|inspector|issuer|receiver|authority|authorit|responsib|owner|manager|lead|engineer|rigger|supervis|employee|contractor|function|business unit|corporate|worker|team|competent|qualified|director)/i.test(text);
    return true;
  }
  const localDetails=/\b(?:my|our|the|site|local)\s+(?:emergency\s+)?(?:phone number|telephone number|extension|hotline|passcode|password|contact number|supervisor.s name|badge number)\b|\b(?:phone number|telephone number|call number|contact number)\b|\b(?:who|what).{0,30}(?:my supervisor|my permit issuer|my permit number|my evacuation route|my (?:muster|assembly) point|our (?:muster|assembly) point|site speed limit|speed limit at (?:my|our|the) site)\b/i;
  const harmfulRequest=/\b(?:evade|sneak past|break into|hack into|exploit a vulnerability|disable surveillance|avoid detection|evade detection|weaponize|assemble a detonator|build a bomb)\b/i;
  function simplify(text) {
    // Preserve complete sentences, exceptions, lists, numbers and references.
    return text.replace(/\bshall not\b/gi,'must not').replace(/\bshall\b/g,'must')
      .replace(/\bprior to\b/g,'before').replace(/\bsubsequent to\b/g,'after')
      .replace(/\bin the event that\b/g,'if').replace(/\bin order to\b/g,'to');
  }
  function create(data,faqs) {
    const processMap=new Map(data.processes.map(p=>[p.id,p]));
    const clauses=new Map();
    const evidenceText=id=>clauses.get(id)?.text||processMap.get(id)?.purpose||'';
    const df=new Map();
    const records=[];
    for (const p of data.processes) for(const c of p.clauses) {
      clauses.set(c.id,c);
      const body=new Set(tokens(c.text.replace(/\[Table [^\]]+\]/g,'')));
      const header=new Set(tokens(c.heading));
      const title=new Set(tokens(p.title));
      const all=new Set([...body,...header,...title]);
      for(const t of all)df.set(t,(df.get(t)||0)+1);
      records.push({c,body,header,title,all,process:p.id});
    }
    const rarity=t=>Math.max(.8,Math.min(5,Math.log((records.length+1)/((df.get(t)||0)+1))));
    const weight=ts=>ts.reduce((v,t)=>v+rarity(t),0);
    const cardProcess=card=>processMap.has(card.refs[0])?card.refs[0]:card.refs[0].split('.').slice(0,2).join('.');
    const exact=new Map();
    const faqRecords=faqs.map(card=>{
      const forms=[card.question,...card.variants].map(v=>{
        exact.set(normalize(v),card);
        return {terms:new Set(tokens(v)),kind:intent(v)};
      });
      return {card,forms,process:cardProcess(card),evidence:new Set(tokens(card.answer+' '+card.refs.map(evidenceText).join(' ')))};
    });
    const topicNames=new Map();
    const addTopic=(name,id)=>topicNames.set(normalize(name),id);
    for(const p of data.processes)addTopic(p.title,p.id);
    const aliasesByProcess={
      '1.1':['MSHEM','Maaden MSHEM','the management system'],
      '2.5':['risk management','EHSS risk assessment'], '2.6':['CCM','critical controls'],
      '2.8':['LSR','life saving rules','life-saving rules'], '3.6':['waste'],
      '3.10':['tailings'], '3.12':['industrial hygiene'], '3.14':['occupational noise','hearing conservation'],
      '3.15':['heat stress'], '3.18':['fitness for work','fatigue'], '3.20':['hazardous materials'],
      '3.21':['PTW','permit to work','work permits','task risk assessment','TRA'],
      '3.22':['hot work'], '3.23':['LOTO','lockout tagout','lockout/tagout','energy isolation'],
      '3.24':['work at height','WAH'], '3.25':['confined space','confined spaces','CSE'],
      '3.26':['lifting','lifting operations'], '3.27':['mobile equipment'], '3.28':['light vehicles'],
      '3.29':['journey management'], '3.30':['electrical safety'], '3.31':['PPE','personal protective equipment'],
      '3.34':['excavation','trenching'], '3.46':['process safety information','PSI'],
      '3.47':['PHA','process hazard analysis'], '3.48':['standard operating procedures','SOP'],
      '3.49':['standard maintenance procedures','SMP'], '3.50':['mechanical integrity','asset integrity'],
      '3.52':['MOC','management of change'], '3.53':['PSSR','pre-startup safety review'],
      '4.1':['contractor management'], '4.2':['projects EHSS'], '5.1':['emergency preparedness'],
      '6.1':['incident management','incident reporting'], '6.3':['audit and assurance']
    };
    for(const [id,names] of Object.entries(aliasesByProcess))for(const name of names)addTopic(name,id);
    function topicFor(q){
      let subject=q.trim().replace(/[?.!]+$/g,'').trim();
      subject=subject.replace(/^(?:what (?:is|are)|what does mshem say about|tell me about|explain|describe|overview of|what is the purpose of|what is the scope of|what does .+? mean by)\s+/i,'')
        .replace(/^(?:the purpose of|the scope of|the)\s+/i,'').replace(/\s+(?:process|in mshem)$/i,'');
      return topicNames.get(normalize(subject));
    }
    function rankCards(q,scope='') {
      const terms=tokens(q),qWeight=weight(terms),kind=intent(q);
      if(!qWeight)return [];
      const result=[];
      const broad=new Set(['frequency','duration','before','after','approval','verify','inspect','required','work','use','site','change','same','different','form','end','get','time']);
      const subject=terms.filter(t=>!broad.has(t));
      for(const record of faqRecords) {
        if(scope&&record.process!==scope)continue;
        let score=0,eligible=false,subjectFound=false;
        for(const form of record.forms) {
          const shared=terms.filter(t=>form.terms.has(t));
          if(!shared.length)continue;
          if(subject.some(t=>form.terms.has(t)))subjectFound=true;
          const overlap=weight(shared),recall=overlap/qWeight,precision=overlap/weight([...form.terms]);
          const kindConflict=kind&&form.kind&&kind!==form.kind;
          const unknown=terms.filter(t=>!form.terms.has(t)&&!record.evidence.has(t));
          let rank=(.61*recall+.39*precision)*(kindConflict?.88:1);
          if(shared.length<2)rank*=.67;
          score=Math.max(score,rank);
          if(shared.length>=2&&rank>=.77&&recall>=.72&&precision>=.56&&unknown.every(t=>rarity(t)<1.9)&&!kindConflict&&supportsIntent(record.card.answer,kind))eligible=true;
        }
        if(score>0&&(subjectFound||!subject.length))result.push({card:record.card,score,eligible});
      }
      return result.sort((a,b)=>b.score-a.score);
    }
    function rankClauses(q,scope='') {
      const terms=tokens(q),qWeight=weight(terms),kind=intent(q);
      if(!qWeight)return [];
      const out=[];
      for(const r of records){
        if(scope&&r.process!==scope)continue;
        const hits=terms.filter(t=>r.all.has(t)),inBody=terms.filter(t=>r.body.has(t));
        if(!hits.length||!inBody.length)continue;
        const coverage=weight(hits)/qWeight,bodyCoverage=weight(inBody)/qWeight;
        const emphasis=weight(terms.filter(t=>r.header.has(t)))/qWeight;
        const compact=Math.min(1,24/(r.body.size+10));
        const hasIntent=supportsIntent(r.c.text,kind);
        const score=(.55*coverage+.38*bodyCoverage+.07*emphasis+.04*compact)*(hasIntent?1:.76);
        out.push({c:r.c,process:r.process,hits:hits.length,coverage,bodyCoverage,score,hasIntent});
      }
      return out.sort((a,b)=>b.score-a.score);
    }
    function ask(question,scope=''){
      if(localDetails.test(question))return {kind:'local'};
      if(harmfulRequest.test(question))return {kind:'local'};
      let ids=[...new Set(question.match(/\b\d+\.\d+\.\d+\b|\b[1-6]\.\d+\b/g)||[])];
      const explicitRef=/\b(?:section|clause|process|reference|part|explain|compare|read|show|summarize|summarise)\s+(?:number\s+)?\d+\./i.test(question);
      if(!explicitRef&&!/^\s*\d+(?:\.\d+)+(?:\s*(?:,|and|&)\s*\d+(?:\.\d+)+)*[?. ]*$/i.test(question))ids=ids.filter(id=>id.split('.').length===3);
      if(ids.length){
        const missing=ids.filter(id=>!clauses.has(id)&&!processMap.has(id));
        if(missing.length)return {kind:'missing',ids:missing};
        return {kind:'reference',refs:ids};
      }
      const card=exact.get(normalize(question));
      if(card&&(!scope||cardProcess(card)===scope))return {kind:'card',card};
      const topic=topicFor(question);
      if(topic&&(!scope||scope===topic))return {kind:'topic',id:topic};
      const cards=rankCards(question,scope),top=cards[0];
      const suggestions=cards.filter(x=>x.score>=.4).slice(0,4).map(x=>x.card);
      if(top?.eligible&&(!cards[1]||top.score-cards[1].score>=.065))return {kind:'card',card:top.card};
      const terms=tokens(question);
      const candidates=rankClauses(question,scope);
      const best=candidates[0],next=candidates[1];
      const needsChoice=top&&cards[1]&&top.score>.70&&cards[1].score>.70&&top.score-cards[1].score<.055;
      // Source answers must be grounded in the clause body. A process heading
      // alone cannot resolve a question about limits, permission or personnel.
      const unique=best&&(!next||best.score-next.score>.045);
      const allTerms=best&&best.coverage>.999;
      if(!needsChoice&&terms.length>=2&&best?.hasIntent&&unique&&best.coverage>=.89&&best.bodyCoverage>=.76&&allTerms)
        return {kind:'source',refs:[best.c.id]};
      const related=candidates.filter(x=>x.coverage>=.55&&x.hits>=Math.min(2,terms.length)).slice(0,3).map(x=>x.c.id);
      return {kind:'clarify',suggestions,related};
    }
    return {ask,rankCards,cardProcess,simplify};
  }
  return {create};
})();
if(typeof module!=='undefined')module.exports=AskEngine;
