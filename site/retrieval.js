/* Search the activity, process and approved clause directories. */
const Retriever = (() => {
  const stop = new Set('a an the i my our you your we they me us is are was were be been do does did should shall must can could would will need needs am have has had to of on in or and for at from that this how what which who when where why as by with it if please tell find show need go does happen happens after before according mshem maaden'.split(' '));
  const aliases = {frequently:'often',worksite:'site',sites:'site',working:'work',permitted:'permit',inspects:'inspect',approvals:'approval',approves:'approval',approve:'approval',approved:'approval',approving:'approval',plans:'plan',tags:'tag',colours:'color',colors:'color',colour:'color',limits:'limit',welders:'weld',welding:'weld',welds:'weld',goes:'go',scaffolding:'scaffold',scaffolds:'scaffold',inspections:'inspect',inspection:'inspect',inspected:'inspect',checks:'check',checked:'check',checking:'check',inspecting:'inspect',check:'inspect',frequency:'often',times:'time',conditions:'condition',changed:'change',changes:'change',changing:'change',lifts:'lift',lifting:'lift',hoist:'lift',liftingplan:'lift',verification:'verify',verified:'verify',isolated:'isolation',isolating:'isolation',isolate:'isolation',suspended:'suspend',suspension:'suspend',resuming:'resume',restart:'resume',revalidating:'revalidate',revalidation:'revalidate',shifts:'shift',scaffoldings:'scaffold',permits:'permit',vehicles:'vehicle',pedestrians:'pedestrian',briefing:'brief',entered:'entry',entering:'entry',enter:'entry',noise:'hearing',protectors:'protection',liftingplans:'lift',works:'work',equipment:'equipment',briefings:'brief',spills:'spill',spilled:'spill',leaks:'leak',often:'often',requires:'require',required:'require',respirators:'respirator'};
  function normalize(text) {
    return String(text||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\bptw\b/g,'permit to work').replace(/\bloto\b/g,'lockout isolation').replace(/\bwah\b/g,'working at height').replace(/\bjsa\b/g,'job safety analysis').replace(/\btra\b/g,'task risk assessment').replace(/\bppe\b/g,'personal protective equipment').replace(/\bcse\b/g,'confined space entry').replace(/\blsr\b/g,'life saving rules').replace(/\bnear[- ]miss\b/g,'near miss').replace(/[^a-z0-9.]+/g,' ').trim();
  }
  function words(s){return [...new Set(normalize(s).split(/\s+/).map(w=>w.replace(/^\.+|\.+$/g,'')).map(w=>aliases[w]||w).filter(w=>w&&!stop.has(w)))];}
  function makeIndex(items,getTitle,getText){
    const records=items.map(item=>({item,title:words(getTitle(item)),body:words(getText(item)),literal:normalize(getTitle(item))}));
    const df=new Map();
    for(const r of records){r.terms=new Set([...r.title,...r.body]);r.titles=new Set(r.title);for(const t of r.terms)df.set(t,(df.get(t)||0)+1);}
    return query=>{
      const n=normalize(query),q=words(query);
      if(!q.length)return [];
      return records.map(r=>{
        let score=0,hits=0;
        for(const w of q){if(!r.terms.has(w))continue;hits++; const weight=Math.log(1+records.length/(1+df.get(w)));score+=weight*(r.titles.has(w)?2.1:1);}
        if(!hits)return null;
        score*=hits/q.length;
        if(r.literal===n)score+=80;else if(n.length>3&&r.literal.includes(n))score+=8;
        return {item:r.item,score,hits,coverage:hits/q.length};
      }).filter(Boolean).sort((a,b)=>b.score-a.score);
    };
  }
  return {normalize,words,makeIndex};
})();
if(typeof module!=='undefined')module.exports=Retriever;
