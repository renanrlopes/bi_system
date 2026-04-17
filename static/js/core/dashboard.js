// �"?�"? Dynamic data loader �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
let M=['Jan/2026','Fev/2026','Mar/2026'], K=['2026-01','2026-02','2026-03'];
let V={rp:[0,0,0],ac:[0,0,0],txa:[0,0,0],tv:[0,0,0],re:[0,0,0],te:[0,0,0],ca:[0,0,0],db:[0,0,0],lq:[0,0,0],pd:[0,0,0]};
let CMV={},CMV_NF={},CMV_SN={},DEB_ML={},DEB_ML_DET={},ENC={},EMP={},EMP_ENTRADA={},EMP_TOTAL={},APORTES={},DEV_APORTE={},DESP={},E={};
let _dbReady=false;

function shortMes(i){
  const lbl=(M[i]||'').split('/')[0]||K[i]||`M${i+1}`;
  return lbl.slice(0,3);
}

function periodoLabel(){
  if(!M.length) return 'Sem periodo';
  if(M.length===1) return M[0];
  return `${M[0]} - ${M[M.length-1]}`;
}

function renderNfTabs(){
  const host=document.getElementById('nf-tabs');
  if(!host) return;
  const months=K.map((k,i)=>({k,label:shortMes(i)}));
  host.innerHTML=`<button class="mt ${nfF==='all'?'on':''}" data-k="all" onclick="fn2('all')">Todas</button>`+
    months.map(m=>`<button class="mt ${nfF===m.k?'on':''}" data-k="${m.k}" onclick="fn2('${m.k}')">${m.label}</button>`).join('');
}

function renderMargMesTabs(){
  const host=document.getElementById('mg-mes-tabs');
  if(!host) return;
  host.innerHTML=K.map((k,i)=>`<button class="mt ${margMes===i?'on':''}" onclick="sMargMes(${i},this)">${shortMes(i)}</button>`).join('')+
    `<button class="mt ${margMes===-1?'on':''}" onclick="sMargMes(-1,this)">Total</button>`;
}

function updateSectionTitles(){
  const est=document.getElementById('est-title');
  if(est) est.textContent=`Estoque Full - ${periodoLabel()}`;
  const mg=document.getElementById('mg-title');
  if(mg) mg.textContent=`Margem por SKU - ${periodoLabel()}`;
}

async function loadDB(){
  try{
    const [fin,meses,skusData,margData,extratoData,estoqueData]=await Promise.all([
      fetch('/api/financeiro').then(r=>r.json()),
      fetch('/api/meses').then(r=>r.json()),
      fetch('/api/skus').then(r=>r.json()),
      fetch('/api/marg').then(r=>r.json()),
      fetch('/api/extrato').then(r=>r.json()),
      fetch('/api/estoque').then(r=>r.json()),
    ]);
    if(meses&&meses.length){M=meses.map(m=>m.label);K=meses.map(m=>m.key);}
    if(fin&&fin.V){
      V=fin.V;CMV=fin.CMV||{};CMV_NF=fin.CMV_NF||{};CMV_SN=fin.CMV_SN||{};
      DEB_ML=fin.DEB_ML||{};DEB_ML_DET=fin.DEB_ML_DET||{};ENC=fin.ENC||{};
      EMP=fin.EMP||{};EMP_ENTRADA=fin.EMP_ENTRADA||{};EMP_TOTAL=fin.EMP_TOTAL||{};
      APORTES=fin.APORTES||{};DEV_APORTE=fin.DEV_APORTE||{};DESP=fin.DESP||{};E=fin.E||{};
    }

    const n=K.length||0;
    const normArr=(arr)=>Array.from({length:n},(_,i)=>Number((arr||[])[i]||0));
    V={
      rp:normArr(V.rp),ac:normArr(V.ac),txa:normArr(V.txa),tv:normArr(V.tv),re:normArr(V.re),
      te:normArr(V.te),ca:normArr(V.ca),db:normArr(V.db),lq:normArr(V.lq),pd:normArr(V.pd),
    };
    K.forEach(k=>{
      CMV[k]=Number(CMV[k]||0);
      CMV_NF[k]=Number(CMV_NF[k]||0);
      CMV_SN[k]=Number(CMV_SN[k]||0);
      DEB_ML[k]=Number(DEB_ML[k]||0);
      ENC[k]=Number(ENC[k]||0);
      EMP[k]=Number(EMP[k]||0);
      EMP_ENTRADA[k]=Number(EMP_ENTRADA[k]||0);
      EMP_TOTAL[k]=Number(EMP_TOTAL[k]||0);
      APORTES[k]=Number(APORTES[k]||0);
      DEV_APORTE[k]=Number(DEV_APORTE[k]||0);
      DEB_ML_DET[k]={...(DEB_ML_DET[k]||{}),recl:Number((DEB_ML_DET[k]||{}).recl||0),retido:Number((DEB_ML_DET[k]||{}).retido||0),devolv:Number((DEB_ML_DET[k]||{}).devolv||0),envio:Number((DEB_ML_DET[k]||{}).envio||0)};
      DESP[k]={...(DESP[k]||{}),contab:Number((DESP[k]||{}).contab||0),pub:Number((DESP[k]||{}).pub||0),imp:Number((DESP[k]||{}).imp||0),tml:Number((DESP[k]||{}).tml||0),prolabore_lucas:Number((DESP[k]||{}).prolabore_lucas||0),prolabore_fellipe:Number((DESP[k]||{}).prolabore_fellipe||0),galpao:Number((DESP[k]||{}).galpao||0),frete:Number((DESP[k]||{}).frete||0)};
      E[k]={...(E[k]||{}),lib:Number((E[k]||{}).lib||0),dr:Number((E[k]||{}).dr||0),em:Number((E[k]||{}).em||0),rb:Number((E[k]||{}).rb||0),ee:Number((E[k]||{}).ee||0),pc:Number((E[k]||{}).pc||0),demp:Number((E[k]||{}).demp||0),drc:Number((E[k]||{}).drc||0),drt:Number((E[k]||{}).drt||0),ddv:Number((E[k]||{}).ddv||0),denv:Number((E[k]||{}).denv||0),dec:Number((E[k]||{}).dec||0),dft:Number((E[k]||{}).dft||0),ddf:Number((E[k]||{}).ddf||0),pub:Number((E[k]||{}).pub||0),imp:Number((E[k]||{}).imp||0),ban:Number((E[k]||{}).ban||0),tml:Number((E[k]||{}).tml||0)};
    });
    if(skusData&&skusData.length) SK.splice(0,SK.length,...skusData);
    if(margData&&margData.length) MARG.splice(0,MARG.length,...margData);
    if(extratoData&&Object.keys(extratoData).length){
      K.forEach(k=>{E[k]={...(E[k]||{}),...((extratoData||{})[k]||{})};});
    }
    if(Array.isArray(estoqueData)&&estoqueData.length){
      EST.splice(0,EST.length,...estoqueData.map(e=>({
        sku:e.sku||'',
        nome:e.nome||'',
        bq:parseInt(e.bq||0),
        ep:parseInt(e.ep||0),
        v30:parseInt(e.v30||0),
        te:e.te||'',
        zero:typeof e.zero==='boolean'?e.zero:(parseInt(e.bq||0)<=0),
      })));
    }

    // update dynamic header/subtitle
    if(M.length){
      const first=M[0],last=M[M.length-1];
      const periodo=first===last?first:first.split('/')[0]+'–'+last;
      const totalPedidos=(V.pd||[]).reduce((a,v)=>a+(parseInt(v||0)),0);
      const sb=document.getElementById('sb-periodo');
      if(sb) sb.textContent=periodo;
      const topSub=document.getElementById('top-sub');
      if(topSub) topSub.textContent=`${periodo} · ${totalPedidos.toLocaleString('pt-BR')} pedidos · Mercado Livre BR`;
    }
    renderNfTabs();
    renderMargMesTabs();
    updateSectionTitles();
    _dbReady=true;
    rAll();rExt();rNF();rComp();rForn();rSKU();rApo();rEst();rMarg();buildCharts();
    gLoad();
  }catch(e){console.error('loadDB error',e);}
}

// Also load notas from API for NF page
async function loadNFFromAPI(){
  const notas=await fetch('/api/notas').then(r=>r.json());
  CP.splice(0,CP.length,...notas.map(n=>({d:n.data?n.data.slice(8)+'/'+n.data.slice(5,7):n.data||'',n:n.numero||'',f:n.fornecedor||'',v:n.valor||0,m:n.data?n.data.slice(0,7):'',t:n.tipo||'cmv',nf:n.valor_nf||0,sn:n.valor_sn||0,particular:n.particular||false})));
  rNF();rComp();rForn();
}

let CP=[];
let SK=[];

let cm=-1;
const f=v=>'R$\u00a0'+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fn=v=>(v<0?'− ':'')+'R$\u00a0'+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=(a,b)=>b?(Math.abs(a)/Math.abs(b)*100).toFixed(1)+'%':'—';
const exD=()=>['d-e','d-s','d-o'].reduce((a,id)=>a+(parseFloat(document.getElementById(id)?.value)||0),0);

function getD(i){
  if(i===-1){
    const sv=k=>V[k].reduce((a,v)=>a+v,0);
    const d=K.reduce((a,k)=>{const x=DESP[k];return{contab:a.contab+x.contab,pub:a.pub+x.pub,imp:a.imp+x.imp,tml:a.tml+x.tml,prolabore_lucas:a.prolabore_lucas+(x.prolabore_lucas||0),prolabore_fellipe:a.prolabore_fellipe+(x.prolabore_fellipe||0),galpao:a.galpao+x.galpao,frete:a.frete+(x.frete||0)}},{contab:0,pub:0,imp:0,tml:0,prolabore_lucas:0,prolabore_fellipe:0,galpao:0,frete:0});
    return{rp:sv('rp'),ac:sv('ac'),txa:sv('txa'),tv:sv('tv'),re:sv('re'),te:sv('te'),ca:sv('ca'),db:sv('db'),lq:sv('lq'),pd:sv('pd'),cmv:K.reduce((a,k)=>a+CMV[k],0),cmv_nf:K.reduce((a,k)=>a+CMV_NF[k],0),cmv_sn:K.reduce((a,k)=>a+CMV_SN[k],0),deb_ml:K.reduce((a,k)=>a+DEB_ML[k],0),...d,enc:K.reduce((a,k)=>a+ENC[k],0),emp:K.reduce((a,k)=>a+EMP[k],0),emp_entrada:K.reduce((a,k)=>a+EMP_ENTRADA[k],0),emp_total:Math.max(...K.map(k=>EMP_TOTAL[k])),aporte:K.reduce((a,k)=>a+APORTES[k],0),dev_apo:K.reduce((a,k)=>a+DEV_APORTE[k],0),lbl:`Total ${periodoLabel()}`};
  }
  const k=K[i],d=DESP[k];
  return{rp:V.rp[i],ac:V.ac[i],txa:V.txa[i],tv:V.tv[i],re:V.re[i],te:V.te[i],ca:V.ca[i],db:V.db[i],lq:V.lq[i],pd:V.pd[i],cmv:CMV[k],cmv_nf:CMV_NF[k],cmv_sn:CMV_SN[k],deb_ml:DEB_ML[k],...d,enc:ENC[k],emp:EMP[k],emp_entrada:EMP_ENTRADA[k],emp_total:EMP_TOTAL[k],aporte:APORTES[k],dev_apo:DEV_APORTE[k],lbl:M[i]};
}

function sm(i){cm=i;document.querySelectorAll('.mt').forEach((el,idx)=>el.classList.toggle('on',[0,1,2,-1][idx]===i));rAll();}

function closeMobileNav(){
  document.querySelector('.sb')?.classList.remove('open');
  document.getElementById('sb-backdrop')?.classList.remove('open');
}

function toggleMobileNav(){
  const sb=document.querySelector('.sb');
  const bd=document.getElementById('sb-backdrop');
  if(!sb||!bd)return;
  sb.classList.toggle('open');
  bd.classList.toggle('open');
}

function sp(p){
  document.querySelectorAll('.pg').forEach(el=>el.classList.remove('on'));
  document.querySelectorAll('.ni').forEach(el=>el.classList.remove('on'));
  document.getElementById('page-'+p).classList.add('on');
  const ps=['overview','dre','aportes','extrato','evolucao','produtos','compras','fornec','estoque','margem','g-financeiro','g-produtos','g-notas','g-aportes','g-skus','g-historico'];
  const ts=['Visão geral','DRE Gerencial','Aportes de capital','Extrato ML','Evolução Mensal','Produtos / SKU','Notas de Compra','Fornecedores','Estoque Full','Margem por SKU','Dados Financeiros','Produtos / Custos','Notas Fiscais','Aportes / Empréstimos','Importar Dados','Histórico de Alterações'];
  const idx=ps.indexOf(p);
  if(idx>=0)document.querySelectorAll('.ni')[idx].classList.add('on');
  document.getElementById('pgt').textContent=ts[idx]||p;
  const mtsEl=document.getElementById('mts');
  if(mtsEl) mtsEl.style.visibility='hidden';
  closeMobileNav();
}

function rAll(){rOV();rDRE();}

function calcRes(d,ex){
  const prolabore=(d.prolabore_lucas||0)+(d.prolabore_fellipe||0);
  const despOp=d.contab+d.pub+d.tml+d.galpao+(d.frete||0)+ex;
  const lb=d.lq-d.cmv+d.deb_ml;
  return{lb,despOp,prolabore,res:lb-despOp-prolabore-d.imp-d.enc+(d.emp_entrada||0)-d.emp};
}

function rOV(){
  const d=getD(cm),ex=exD();
  const rc=d.rp+d.ac,rt=(d.ac||0)+(d.txa||0)+d.tv+d.ca+(d.re||0)+(d.te||0)+(d.db||0);
  const {res}=calcRes(d,ex);
  const mrg=rc>0?res/rc*100:0;
  const saldoApo=d.aporte-d.dev_apo;
  document.getElementById('kpi-ov').innerHTML=`
    <div class="kc cb"><div class="kl">Receita bruta</div><div class="kv" style="color:var(--b)">${f(d.rp)}</div><div class="ks">${d.pd.toLocaleString('pt-BR')} pedidos</div></div>
    <div class="kc cg"><div class="kl">Líquido ML</div><div class="kv" style="color:var(--g)">${f(d.lq)}</div><div class="ks">${pct(d.lq,d.rp)} da receita</div></div>
    <div class="kc cr"><div class="kl">Retenções + Déb. ML</div><div class="kv" style="color:var(--r)">${fn(rt+d.deb_ml)}</div><div class="ks">${pct(rt+d.deb_ml,d.rp)} da receita</div></div>
    <div class="kc ca"><div class="kl">CMV (NFs compra)</div><div class="kv" style="color:var(--am)">${f(d.cmv)}</div><div class="ks">${pct(d.cmv,rc)} da receita</div></div>
    ${d.enc>0?`<div class="kc cr"><div class="kl">Encargos ML</div><div class="kv" style="color:var(--r);font-size:16px">${f(d.enc)}</div><div class="ks">Faturas vencidas</div></div>`:''}
    ${d.emp>0?`<div class="kc co"><div class="kl">Empréstimo MP</div><div class="kv" style="color:var(--o)">${f(d.emp)}</div><div class="ks">Parcelamento ML</div></div>`:''}
    <div class="kc cp"><div class="kl">Resultado operacional</div><div class="kv" style="color:${res>=0?'var(--g)':'var(--r)'}">${fn(res)}</div><div class="ks">Margem ${mrg.toFixed(1)}%</div></div>
    ${saldoApo>0?`<div class="kc ct"><div class="kl">Aportes de capital (saldo)</div><div class="kv" style="color:var(--tl)">${f(saldoApo)}</div><div class="ks">Fora do resultado</div></div>`:''}`;
}

function rDRE(){
  const d=getD(cm),ex=exD();
  const rc=d.rp+d.ac,rt=(d.ac||0)+(d.txa||0)+d.tv+d.ca+(d.re||0)+(d.te||0)+(d.db||0);
  const {lb,res,prolabore,despOp}=calcRes(d,ex);
  const mrg=rc>0?res/rc*100:0;
  const ki=cm===-1?'all':K[cm];
  const det=ki==='all'
    ?K.reduce((a,k)=>({recl:a.recl+DEB_ML_DET[k].recl,retido:a.retido+DEB_ML_DET[k].retido,devolv:a.devolv+DEB_ML_DET[k].devolv,envio:a.envio+DEB_ML_DET[k].envio}),{recl:0,retido:0,devolv:0,envio:0})
    :DEB_ML_DET[ki];

  document.getElementById('dre-b').textContent=d.lbl;

  const apo_html=d.aporte>0||d.dev_apo>0?`
    <div class="dr dh">MOVIMENTAÇÃO DE CAPITAL <span style="font-size:9px;opacity:.6">(fora do resultado operacional)</span></div>
    ${d.aporte>0?`<div class="dr dsub dapo"><span style="color:var(--tl)">Aportes recebidos de sócios/investidores</span><span class="dv tl">+ ${f(d.aporte)}</span></div>`:''}
    ${d.dev_apo>0?`<div class="dr dsub"><span>Devolução de aporte</span><span class="dv n">${fn(-d.dev_apo)}</span></div>`:''}
    <div class="dr dtot"><span>= Saldo líquido de capital</span><span class="dv tl">${fn(d.aporte-d.dev_apo)}</span></div>`:'' ;

  document.getElementById('dre-body').innerHTML=`
    <div class="dr dh">RECEITAS</div>
    <div class="dr dsub"><span>Receita por produtos</span><span class="dv p">${f(d.rp)}</span></div>
    <div class="dr dtot"><span>= Receita total bruta</span><span class="dv p">${f(d.rp)}</span></div>
    <div class="dr dh">RETENÇÕES MERCADO LIVRE <span style="font-size:9px;opacity:.6">(relatório de vendas)</span></div>
    ${d.ac>0?`<div class="dr dsub"><span>Acréscimo parcelamento <span style="font-size:10px;color:var(--mu)">(pago pelo comprador)</span></span><span class="dv p">+ ${f(d.ac)}</span></div>`:''}
    ${d.txa<0?`<div class="dr dsub"><span>Taxa de parcelamento equivalente ao acréscimo</span><span class="dv n">${fn(d.txa)}</span></div>`:''}
    <div class="dr dsub"><span>Tarifa de venda e impostos</span><span class="dv n">${fn(d.tv)}</span></div>
    <div class="dr dsub"><span>Cancelamentos e reembolsos</span><span class="dv n">${fn(d.ca)}</span></div>
    ${d.re>0?`<div class="dr dsub"><span>Receita por envio</span><span class="dv p">+ ${f(d.re)}</span></div>`:''}
    ${d.te<0?`<div class="dr dsub"><span>Tarifas de envio</span><span class="dv n">${fn(d.te)}</span></div>`:''}
    ${d.db>0?`<div class="dr dsub"><span>Descontos e bônus</span><span class="dv p">+ ${f(d.db)}</span></div>`:''}
    <div class="dr dtot"><span>= Total líquido retenções ML</span><span class="dv n">${fn(rt)}</span></div>
    <div class="dr dtot" style="border-bottom:1px solid rgba(59,130,246,.2)"><span style="color:#93c5fd">= Líquido repassado ML</span><span class="dv bl">${f(d.lq)}</span></div>
    <div class="dr dh">DÉBITOS OPERACIONAIS ML <span style="font-size:9px;opacity:.6">(extrato Mercado Pago)</span></div>
    ${det.recl<0?`<div class="dr dsub"><span>Déb. reclamações no Mercado Livre</span><span class="dv n">${fn(det.recl)}</span></div>`:''}
    ${det.retido<0?`<div class="dr dsub"><span>Dinheiro retido / déb. retido</span><span class="dv n">${fn(det.retido)}</span></div>`:''}
    ${det.devolv<0?`<div class="dr dsub"><span>Déb. devoluções ML</span><span class="dv n">${fn(det.devolv)}</span></div>`:''}
    ${det.envio<0?`<div class="dr dsub"><span>Déb. envio Mercado Livre</span><span class="dv n">${fn(det.envio)}</span></div>`:''}
    <div class="dr dtot"><span>= Total débitos operacionais ML</span><span class="dv n">${fn(d.deb_ml)}</span></div>
    <div class="dr dh">CMV — CUSTO DAS MERCADORIAS VENDIDAS</div>
    <div class="dr dsub"><span>Notas fiscais de compra <span style="font-size:10px;color:var(--mu)">(NF)</span></span><span class="dv n">${fn(-d.cmv_nf)}</span></div>
    <div class="dr dsub" style="background:rgba(245,158,11,.05);border-left:2px solid rgba(245,158,11,.4)"><span>Compras pedido SN <span style="font-size:10px;font-weight:600;color:var(--am);background:rgba(245,158,11,.15);padding:1px 5px;border-radius:3px;margin-left:3px">SN</span></span><span class="dv am">${fn(-d.cmv_sn)}</span></div>
    <div class="dr dtot"><span>= Total CMV (NF + SN)</span><span class="dv n">${fn(-d.cmv)}</span></div>
    <div class="dr dtot"><span>= Lucro bruto</span><span class="dv ${lb>=0?'p':'n'}">${fn(lb)}</span></div>
    <div class="dr dh">DESPESAS OPERACIONAIS</div>
    ${d.galpao>0?`<div class="dr dsub"><span>Galpão, água, luz e internet <span style="font-size:10px;color:var(--mu)">23/03/2026</span></span><span class="dv n">${fn(-d.galpao)}</span></div>`:''}
    ${d.frete>0?`<div class="dr dsub"><span>Frete / transporte <span style="font-size:10px;color:var(--mu)">28/03/2026</span></span><span class="dv n">${fn(-d.frete)}</span></div>`:''}
    ${d.contab>0?`<div class="dr dsub"><span>Contabilidade (ESCON)</span><span class="dv n">${fn(-d.contab)}</span></div>`:''}
    ${d.pub>0?`<div class="dr dsub"><span>Publicidade / Plataformas (Google · AvantPro)</span><span class="dv n">${fn(-d.pub)}</span></div>`:''}
    ${d.tml>0?`<div class="dr dsub"><span>Tarifas ML</span><span class="dv n">${fn(-d.tml)}</span></div>`:''}
    ${ex>0?`<div class="dr dsub"><span>Despesas adicionais lançadas</span><span class="dv n">${fn(-ex)}</span></div>`:''}
    <div class="dr dsub"><span style="color:var(--mu);font-style:italic">Embalagens / SaaS / Outras</span><span class="dv mu">${ex>0?'incluído acima':'lançar abaixo'}</span></div>
    <div class="dr dh">PRÓ-LABORE <span style="font-size:9px;opacity:.6">(remuneração dos sócios)</span></div>
    <div class="dr dsub dpro" style="background:rgba(168,85,247,.05);border-left:2px solid rgba(168,85,247,.4)">
      <span>Lucas Cristiano Pereira</span>
      <span class="dv pu">${d.prolabore_lucas>0?fn(-d.prolabore_lucas):'<span style="color:var(--mu);font-size:11px">— não lançado</span>'}</span>
    </div>
    <div class="dr dsub dpro" style="background:rgba(168,85,247,.05);border-left:2px solid rgba(168,85,247,.4)">
      <span>Fellipe Genestra Delfino <span style="font-size:10px;color:var(--mu)">${d.prolabore_fellipe>0?'11/03/2026':''}</span></span>
      <span class="dv pu">${d.prolabore_fellipe>0?fn(-d.prolabore_fellipe):'<span style="color:var(--mu);font-size:11px">— não lançado</span>'}</span>
    </div>
    ${prolabore>0?`<div class="dr dtot"><span>= Total pró-labore</span><span class="dv pu">${fn(-prolabore)}</span></div>`:''}
    <div class="dr dh">IMPOSTOS <span style="font-size:9px;opacity:.6">(guias pagas)</span></div>
    <div class="dr dsub" style="background:rgba(244,63,94,.04);border-left:2px solid rgba(244,63,94,.3)">
      <span>Impostos federais / estaduais pagos</span><span class="dv n">${d.imp>0?fn(-d.imp):'—'}</span>
    </div>
    <div class="dr dh">ENCARGOS ML — FATURAS VENCIDAS</div>
    <div class="dr denc"><span>Débito faturas vencidas Mercado Livre</span><span class="dv n">${fn(-d.enc)}</span></div>
    ${(()=>{const resAntesEmp=lb-despOp-prolabore-d.imp-d.enc;return`<div class="dr dtot" style="border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)"><span style="color:var(--mu);font-size:12px">= Lucro operacional líquido</span><span class="dv ${resAntesEmp>=0?'p':'n'}" style="font-size:12px">${fn(resAntesEmp)}</span></div>`})()}
    <div class="dr dh">FINANCIAMENTO — EMPRÉSTIMO MERCADO PAGO</div>
    ${d.emp_entrada>0?`<div class="dr dsub" style="background:rgba(251,146,60,.07);border-left:2px solid rgba(251,146,60,.5)"><span style="color:var(--o)">Entrada empréstimo MP aprovado</span><span class="dv or">+ ${f(d.emp_entrada)}</span></div>`:''}
    ${d.emp>0?`<div class="dr dsub"><span>Parcelas pagas no período</span><span class="dv n">${fn(-d.emp)}</span></div>`:(!d.emp_entrada?`<div class="dr dsub" style="opacity:.4"><span style="font-style:italic">Sem movimentação de empréstimo no período</span><span></span></div>`:'')}  
    <div class="dr dh">RESULTADO OPERACIONAL</div>
    <div class="dr dres" style="background:${res>=0?'rgba(0,229,160,.06)':'rgba(244,63,94,.06)'};border-left:2px solid ${res>=0?'var(--g)':'var(--r)'}">
      <span style="color:${res>=0?'var(--g)':'var(--r)'}">= Resultado líquido operacional</span>
      <span class="dv ${res>=0?'p':'n'}" style="font-size:15px">${fn(res)}</span>
    </div>
    <div class="dr" style="background:var(--bg3);font-size:11px;color:var(--mu)"><span>Margem líquida</span><span class="dv am">${mrg.toFixed(1)}%</span></div>
    <div class="dr dh">NECESSIDADE DE CAPITAL</div>
    <div class="dr dsub dapo"><span style="color:var(--tl)">Aportes de sócios no período</span><span class="dv tl">${d.aporte>0?'+ '+f(d.aporte):'—'}</span></div>
    <div class="dr dsub" style="${d.dev_apo>0?'':'opacity:.4'}"><span>Devoluções de aporte</span><span class="dv n">${d.dev_apo>0?fn(-d.dev_apo):'—'}</span></div>
    ${(() => { const resFinal = res + d.aporte - d.dev_apo; return `<div class="dr dres" style="background:${resFinal>=0?'rgba(45,212,191,.07)':'rgba(244,63,94,.08)'};border-left:2px solid ${resFinal>=0?'var(--tl)':'var(--r)'}">
      <span style="color:${resFinal>=0?'var(--tl)':'var(--r)'}">= Posição de caixa (operacional + capital)</span>
      <span class="dv ${resFinal>=0?'tl':'n'}" style="font-size:15px">${fn(resFinal)}</span>
    </div>`; })()}
    <div class="dr" style="background:var(--bg3);font-size:11px;color:var(--mu)"><span style="color:var(--mu);font-style:italic">Positivo = operação sustentável · Negativo = capital injetado foi consumido</span><span></span></div>`;
}
function rc(){rDRE();rOV();}

// KPI APORTES
function rApo(){
  const socios={};
  (apList||[]).forEach(a=>{
    const nome=(a.socio||'Não informado').trim()||'Não informado';
    const val=Number(a.valor||0);
    if(!socios[nome]) socios[nome]={ent:0,dev:0};
    if(a.tipo==='devolucao') socios[nome].dev+=val;
    else socios[nome].ent+=val;
  });
  const saldoSocios=Object.entries(socios)
    .map(([nome,s])=>({nome,saldo:s.ent-s.dev}))
    .sort((a,b)=>Math.abs(b.saldo)-Math.abs(a.saldo));
  const top1=saldoSocios[0]||{nome:'Sem lançamentos',saldo:0};
  const top2=saldoSocios[1]||{nome:'Sem lançamentos',saldo:0};
  const empEntrada=(emList||[]).reduce((a,e)=>a+Number(e.valor||0),0);
  const totalAportes=(apList||[]).reduce((a,x)=>a+(x.tipo==='devolucao'?-1:1)*Number(x.valor||0),0);

  document.getElementById('kpi-apo').innerHTML=`
    <div class="kc cb"><div class="kl">${top1.nome}</div><div class="kv" style="color:var(--b)">${fn(top1.saldo)}</div><div class="ks">Saldo líquido de aportes</div></div>
    <div class="kc cp"><div class="kl">${top2.nome}</div><div class="kv" style="color:var(--p)">${fn(top2.saldo)}</div><div class="ks">Saldo líquido de aportes</div></div>
    <div class="kc co"><div class="kl">Entradas de empréstimo</div><div class="kv" style="color:var(--o)">${f(empEntrada)}</div><div class="ks">Total dos lançamentos</div></div>
    <div class="kc ct"><div class="kl">Capital líquido injetado</div><div class="kv" style="color:var(--tl)">${fn(totalAportes)}</div><div class="ks">Aportes - devoluções</div></div>`;
}

// EXTRATO
const ECAT=[{k:'lib',l:'Liberação de dinheiro',t:'p'},{k:'dr',l:'Dinheiro recebido',t:'p'},{k:'em',l:'Entrada de dinheiro',t:'p'},{k:'rb',l:'Reembolsos',t:'p'},{k:'ee',l:'Entrada empréstimo ML',t:'p'},{k:'drc',l:'Débito reclamações ML',t:'n'},{k:'drt',l:'Retido / déb. retido',t:'n'},{k:'ddv',l:'Débito devoluções ML',t:'n'},{k:'denv',l:'Débito envio ML',t:'n'},{k:'demp',l:'Débito Empréstimo Mercado Pago',t:'o'},{k:'dft',l:'Débito faturas vencidas ML',t:'n'},{k:'ddf',l:'Débito DIFAL',t:'n'},{k:'pub',l:'Publicidade',t:'n'},{k:'imp',l:'Impostos',t:'n'},{k:'tml',l:'Tarifas ML',t:'n'}];
let extF='all';
function fe(f2,btn){extF=f2;document.querySelectorAll('#ext-tabs .mt').forEach(el=>el.classList.remove('on'));if(btn)btn.classList.add('on');rExt();}
function rExt(){
  const ks=extF==='all'?K:[extF];
  const empT=ks.reduce((a,k)=>a+Math.abs(E[k].demp||0),0);
  document.getElementById('emp-hl').innerHTML=empT>0?`<div class="emp-box"><div><div class="eb-l">Empréstimo Mercado Pago — separado na DRE</div><div class="eb-s">394 lançamentos em Fev/26 · Parcelamento automático diário</div></div><div class="eb-v">${fn(-empT)}</div></div>`:'';
  const ent=ks.reduce((a,k)=>{const e=E[k];return a+e.lib+e.dr+e.em+e.rb+e.ee+(e.pc||0)},0);
  const sai=ks.reduce((a,k)=>{const e=E[k];return a+e.demp+e.drc+e.drt+(e.ddv||0)+e.denv+(e.dec||0)+e.dft+(e.ddf||0)+e.pub+e.imp+e.tml},0);
  document.getElementById('kpi-ext').innerHTML=`
    <div class="kc cg"><div class="kl">Total entradas</div><div class="kv" style="color:var(--g)">${f(ent)}</div><div class="ks">Liberações + reembolsos</div></div>
    <div class="kc cr"><div class="kl">Total saídas</div><div class="kv" style="color:var(--r)">${fn(sai)}</div><div class="ks">Débitos e deduções</div></div>
    <div class="kc co"><div class="kl">Empréstimo MP</div><div class="kv" style="color:var(--o)">${f(empT)}</div><div class="ks">Separado na DRE</div></div>`;
  const f2v=v=>v===0?'<span style="color:var(--mu)">—</span>':fn(v);
  let html='';
  ECAT.forEach(c=>{
    const vs=K.map(k=>E[k][c.k]||0);
    const tot=vs.reduce((a,x)=>a+x,0);
    if(vs.every(x=>x===0))return;
    const cl=c.t==='p'?'rp':c.t==='o'?'ro':'rn';
    html+=`<tr><td>${c.k==='demp'?`<strong style="color:var(--o)">${c.l}</strong>`:c.l}</td>${vs.map(v=>`<td class="${cl}">${f2v(v)}</td>`).join('')}<td class="${cl}" style="font-weight:500">${f2v(tot)}</td></tr>`;
  });
  document.getElementById('ext-tb').innerHTML=html;
  extRenderEditor();
}

function extRenderEditor(){
  const months=K.map((k,i)=>({key:k,label:M[i]||k}));
  let html=`<div style="overflow-x:auto"><table class="tb" style="min-width:720px"><thead><tr><th>Categoria</th>${months.map(m=>`<th class="r">${m.label}</th>`).join('')}</tr></thead><tbody>`;
  ECAT.forEach(c=>{
    html+=`<tr><td style="font-size:12px">${c.l}</td>${months.map(m=>`<td class="r"><input data-ext-k="${c.k}" data-ext-m="${m.key}" type="number" step="0.01" value="${((E[m.key]||{})[c.k]||0)}" class="dinp" style="font-family:var(--fm);font-size:11px;text-align:right;max-width:110px"></td>`).join('')}</tr>`;
  });
  html+='</tbody></table></div><div style="margin-top:10px;font-size:11px;color:var(--mu)">Dica: entradas positivas e débitos negativos.</div>';
  document.getElementById('ext-edit-body').innerHTML=html;
}

async function extSave(){
  const next=JSON.parse(JSON.stringify(E||{}));
  K.forEach(k=>{if(!next[k])next[k]={};});
  document.querySelectorAll('[data-ext-k][data-ext-m]').forEach(inp=>{
    const k=inp.dataset.extK;
    const m=inp.dataset.extM;
    if(!next[m])next[m]={};
    next[m][k]=parseFloat(inp.value)||0;
  });
  const r=await gAPI('POST','/api/extrato',next);
  if(r.ok){
    E=next;
    rExt();
    buildCharts();
    gToast('Extrato salvo!');
  } else {
    gToast(r.error||'Erro ao salvar extrato',true);
  }
}

let nfF='all';
function fn2(f){
  nfF=f;
  document.querySelectorAll('#nf-tabs [data-k]').forEach(el=>el.classList.toggle('on',el.dataset.k===f));
  rNF();
}
function rNF(){
  const rows=nfF==='all'?CP:CP.filter(c=>c.m===nfF);
  const cmv=rows.filter(c=>c.t==='cmv').reduce((a,c)=>a+c.v,0),desp=rows.filter(c=>c.t==='desp').reduce((a,c)=>a+c.v,0);
  let html='';
  rows.forEach(c=>{
    const isParticular=c.particular;
    const valNF = c.nf!=null ? c.nf : (c.sn>0 ? c.v-c.sn : c.v);
    const valSN = c.sn||0;
    const total = c.v;
    const snCell = valSN>0
      ? `<td class="ro" style="font-weight:500">+ ${f(valSN)}</td>`
      : `<td class="r" style="color:var(--mu)">—</td>`;
    const totalStyle = valSN>0 ? 'color:var(--am);font-weight:500' : 'color:var(--mu)';
    html+=`<tr>
      <td class="dt">${c.d}</td>
      <td class="dt">${c.n}</td>
      <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${c.f}">${c.f}</td>
      <td class="r" style="color:var(--g)">${f(valNF)}</td>
      ${snCell}
      <td class="r" style="${totalStyle}">${f(total)}</td>
      <td><span class="badge ${c.t==='cmv'?'bcg':'bca'}">${c.t==='cmv'?'CMV':'Despesa'}</span>${isParticular?'<span class="badge" style="background:rgba(163,139,250,.15);color:var(--p);margin-left:3px">Particular</span>':''}</td>
    </tr>`;
  });
  document.getElementById('nf-tb').innerHTML=html;
  const totNF=rows.reduce((a,c)=>a+(c.nf!=null?c.nf:(c.sn>0?c.v-c.sn:c.v)),0);
  const totSN=rows.reduce((a,c)=>a+(c.sn||0),0);
  document.getElementById('nf-ft').innerHTML=`CMV: <span style="color:var(--g)">${f(cmv)}</span> &nbsp;|&nbsp; Desp: <span style="color:var(--am)">${f(desp)}</span> &nbsp;|&nbsp; <span style="color:var(--g)">c/ Nota: ${f(totNF)}</span> &nbsp;+&nbsp; <span style="color:var(--o)">SN: ${f(totSN)}</span> &nbsp;=&nbsp; <span style="font-weight:500">Total: ${f(totNF+totSN)}</span>`;
}

function rComp(){
  const cpOp=CP.filter(c=>!c.particular);
  const tot=cpOp.reduce((a,c)=>a+c.v,0);
  const cmv=cpOp.filter(c=>c.t==='cmv').reduce((a,c)=>a+c.v,0);
  const desp=cpOp.filter(c=>c.t==='desp').reduce((a,c)=>a+c.v,0);
  const totPart=CP.filter(c=>c.particular).reduce((a,c)=>a+c.v,0);
  document.getElementById('kpi-cp').innerHTML=`
    <div class="kc ca"><div class="kl">Total NFs entrada</div><div class="kv">${f(tot)}</div><div class="ks">${cpOp.length} notas fiscais</div></div>
    <div class="kc cg"><div class="kl">CMV mercadorias</div><div class="kv" style="color:var(--g)">${f(cmv)}</div><div class="ks">${pct(cmv,tot)} do total</div></div>
    <div class="kc cp"><div class="kl">Despesas operac.</div><div class="kv" style="color:var(--p)">${f(desp)}</div><div class="ks">${pct(desp,tot)} do total</div></div>
    <div class="kc ca"><div class="kl">NFs particulares</div><div class="kv" style="color:var(--am);font-size:16px">${f(totPart)}</div><div class="ks">Incluídas no CMV da DRE</div></div>`;
}

function rForn(){
  const mp={};CP.forEach(c=>{mp[c.f]=(mp[c.f]||0)+c.v;});
  const sorted=Object.entries(mp).sort((a,b)=>b[1]-a[1]),tot=sorted.reduce((a,v)=>a+v[1],0),conc=sorted[0][1]/tot*100;
  document.getElementById('kpi-fn').innerHTML=`<div class="kc cb"><div class="kl">Total comprado</div><div class="kv">${f(tot)}</div><div class="ks">${sorted.length} fornecedores</div></div><div class="kc ca"><div class="kl">Maior fornecedor</div><div class="kv" style="font-size:13px;color:var(--am)">P&D Impex</div><div class="ks">${f(sorted[0][1])} · ${conc.toFixed(0)}%</div></div><div class="kc ${conc>60?'cr':'cg'}"><div class="kl">Concentração</div><div class="kv" style="color:${conc>60?'var(--r)':'var(--g)'}">${conc.toFixed(0)}%</div><div class="ks">${conc>60?'Alta — risco':'Saudável'}</div></div>`;
  const cls=['#3b82f6','#00e5a0','#f59e0b','#f43f5e','#a78bfa','#1D9E75','#fb923c','#7a7f8e'];
  document.getElementById('fb-bars').innerHTML=sorted.map((s,i)=>`<div class="fbr"><div class="fbn" title="${s[0]}">${s[0].split(' ').slice(0,3).join(' ')}</div><div class="fbbw"><div class="fbbar" style="width:${(s[1]/sorted[0][1]*100).toFixed(0)}%;background:${cls[i%cls.length]}"></div></div><div class="fbv">${f(s[1])}</div><div class="fbp">${(s[1]/tot*100).toFixed(1)}%</div></div>`).join('');
}

function rSKU(){
  const mxR=Math.max(...SK.map(s=>s.r)),totR=SK.reduce((a,s)=>a+s.r,0);
  let h='<thead><tr><th style="width:24px"></th><th>Produto</th><th class="r">Pedidos</th><th class="r">Receita bruta</th><th class="r">Líquido ML</th><th class="r">Retenção</th><th class="r">% Total</th></tr></thead><tbody>';
  SK.forEach((s,i)=>{const ret=s.r-s.l,retP=(ret/s.r*100).toFixed(0),sh=(s.r/totR*100).toFixed(1),bw=Math.round(s.r/mxR*100);h+=`<tr><td><span class="rank ${i<3?'top':''}">${i+1}</span></td><td><div>${s.s}</div><div class="bsp" style="width:${bw}%"></div></td><td class="r">${s.p}</td><td class="rp">${f(s.r)}</td><td class="r" style="color:var(--g)">${f(s.l)}</td><td class="rn">−${retP}%</td><td class="r">${sh}%</td></tr>`;});
  document.getElementById('sku-tb').innerHTML=h+'</tbody>';
}

function buildCharts(){
  const ax={ticks:{color:'#7a7f8e',font:{size:10},callback:v=>'R$'+Math.round(v/1000)+'k'},grid:{color:'rgba(255,255,255,0.05)'}};
  const axX={ticks:{color:'#7a7f8e',font:{size:11}},grid:{display:false},autoSkip:false};
  const tt={callbacks:{label:ctx=>ctx.dataset.label+': '+fn(ctx.parsed.y)}};
  const rt=V.rp.map((v,i)=>v+V.ac[i]+V.re[i]);
  const cvs=K.map(k=>CMV[k]);
  const emps=K.map(k=>EMP[k]);
  const encs=K.map(k=>ENC[k]);
  const despOp=K.map(k=>{const d=DESP[k];return d.contab+d.pub+d.imp+d.tml+d.prolabore+d.galpao+(d.frete||0);});
  const lcs=K.map((k,i)=>calcRes(getD(i),0).res);
  const retTot=V.tv.map((v,i)=>Math.abs(v)+Math.abs(V.ca[i]));
  const dml=K.map(k=>Math.abs(DEB_ML[k]));

  new Chart(document.getElementById('ch-ov'),{type:'bar',data:{labels:M,datasets:[{label:'Receita bruta',data:rt,backgroundColor:'#3b82f6',borderRadius:4},{label:'Líquido ML',data:V.lq,backgroundColor:'#00e5a0',borderRadius:4},{label:'Resultado',data:lcs,backgroundColor:lcs.map(v=>v>=0?'#1D9E75':'rgba(244,63,94,0.7)'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:axX,y:ax}}});
  const rvT=Math.abs(V.tv.reduce((a,v)=>a+v,0)),reT=Math.abs(V.te.reduce((a,v)=>a+v,0)),rcT=Math.abs(V.ca.reduce((a,v)=>a+v,0));
  new Chart(document.getElementById('ch-rp'),{type:'doughnut',data:{labels:['Tarifa venda','Tarifa envio','Cancelamentos'],datasets:[{data:[rvT,reT,rcT],backgroundColor:['#f43f5e','#f59e0b','#a78bfa'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+f(ctx.parsed)}}}}});
  new Chart(document.getElementById('ch-pd'),{type:'bar',data:{labels:M,datasets:[{label:'Pedidos',data:V.pd,backgroundColor:'#3b82f6',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.parsed.y+' pedidos'}}},scales:{x:axX,y:{ticks:{color:'#7a7f8e',font:{size:10}},grid:{color:'rgba(255,255,255,0.05)'}}}}});
  new Chart(document.getElementById('ch-tk'),{type:'line',data:{labels:M,datasets:[{label:'Ticket',data:V.rp.map((v,i)=>+(v/V.pd[i]).toFixed(2)),borderColor:'#00e5a0',backgroundColor:'rgba(0,229,160,0.08)',tension:0.4,fill:true,pointBackgroundColor:'#00e5a0',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>f(ctx.parsed.y)}}},scales:{x:axX,y:{...ax,ticks:{...ax.ticks,callback:v=>'R$'+v}}}}});
  new Chart(document.getElementById('ch-ev'),{type:'bar',data:{labels:M,datasets:[{label:'Receita bruta',data:rt,backgroundColor:'#3b82f6',borderRadius:4},{label:'Líquido ML',data:V.lq,backgroundColor:'#00e5a0',borderRadius:4},{label:'CMV',data:cvs,backgroundColor:'#f43f5e',borderRadius:4},{label:'Empréstimo',data:emps,backgroundColor:'#fb923c',borderRadius:4},{label:'Resultado',data:lcs,backgroundColor:lcs.map(v=>v>=0?'#1D9E75':'rgba(244,63,94,0.7)'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:axX,y:ax}}});
  new Chart(document.getElementById('ch-cs'),{type:'bar',data:{labels:M,datasets:[{label:'Retenções ML',data:retTot,backgroundColor:'#f43f5e',borderRadius:4,stack:'s'},{label:'Déb. op. ML',data:dml,backgroundColor:'rgba(244,63,94,0.4)',borderRadius:4,stack:'s'},{label:'CMV',data:cvs,backgroundColor:'#f59e0b',borderRadius:4,stack:'s'},{label:'Desp. op.',data:despOp,backgroundColor:'#a78bfa',borderRadius:4,stack:'s'},{label:'Enc.+Emp.',data:encs.map((v,i)=>v+emps[i]),backgroundColor:'#fb923c',borderRadius:4,stack:'s'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:{...axX,stacked:true},y:{...ax,stacked:true}}}});
  const mrgs=rt.map((r,i)=>(lcs[i]/r*100).toFixed(1));
  new Chart(document.getElementById('ch-mg'),{type:'bar',data:{labels:M,datasets:[{label:'Margem',data:mrgs,backgroundColor:mrgs.map(v=>v>=0?'rgba(0,229,160,0.7)':'rgba(244,63,94,0.7)'),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.parsed.y+'%'}}},scales:{x:axX,y:{ticks:{color:'#7a7f8e',font:{size:10},callback:v=>v+'%'},grid:{color:'rgba(255,255,255,0.05)'}}}}});
  // Aportes chart
  const apRec=K.map(k=>Number(APORTES[k]||0));
  const apDev=K.map(k=>-Math.abs(Number(DEV_APORTE[k]||0)));
  new Chart(document.getElementById('ch-apo'),{type:'bar',data:{labels:M,datasets:[{label:'Aportes',data:apRec,backgroundColor:'rgba(59,130,246,0.6)',borderRadius:4,stack:'apo'},{label:'Devoluções',data:apDev,backgroundColor:'rgba(244,63,94,0.6)',borderRadius:4,stack:'apo'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>fn(ctx.parsed.y)}}},scales:{x:axX,y:ax}}});
  // Extrato charts
  new Chart(document.getElementById('ch-eb'),{type:'bar',data:{labels:M,datasets:[{label:'Entradas',data:K.map(k=>{const e=E[k];return e.lib+e.dr+e.em+e.rb+e.ee}),backgroundColor:'#00e5a0',borderRadius:4},{label:'Saídas',data:K.map(k=>{const e=E[k];return Math.abs(e.demp+e.drc+e.drt+(e.ddv||0)+e.denv+(e.dec||0)+e.dft+(e.ddf||0)+e.pub+e.imp+e.tml)}),backgroundColor:'#f43f5e',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:axX,y:ax}}});
  const sd=K.reduce((a,k)=>({emp:a.emp+Math.abs(E[k].demp||0),rc:a.rc+Math.abs(E[k].drc)+Math.abs(E[k].drt)+Math.abs(E[k].ddv||0),env:a.env+Math.abs(E[k].denv),fat:a.fat+Math.abs(E[k].dft)+Math.abs(E[k].ddf||0),imp:a.imp+Math.abs(E[k].imp),pub:a.pub+Math.abs(E[k].pub)}),{emp:0,rc:0,env:0,fat:0,imp:0,pub:0});
  new Chart(document.getElementById('ch-ep'),{type:'doughnut',data:{labels:['Empréstimo MP','Reclamações/Dev.','Envio','Faturas','Impostos','Publicidade'],datasets:[{data:[sd.emp,sd.rc,sd.env,sd.fat,sd.imp,sd.pub],backgroundColor:['#fb923c','#f43f5e','#f59e0b','#a78bfa','#3b82f6','#7a7f8e'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+f(ctx.parsed)}}}}});
  // SKU
  const t10=SK.slice(0,10);
  new Chart(document.getElementById('ch-sb'),{type:'bar',data:{labels:t10.map(s=>s.s.length>17?s.s.slice(0,15)+'…':s.s),datasets:[{label:'Receita',data:t10.map(s=>s.r),backgroundColor:'#3b82f6',borderRadius:4,stack:'s'},{label:'Retenção',data:t10.map(s=>s.r-s.l),backgroundColor:'rgba(244,63,94,0.6)',borderRadius:4,stack:'s'}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:ax,y:{ticks:{color:'#7a7f8e',font:{size:10}},grid:{display:false},stacked:true}}}});
  const totSK=SK.reduce((a,s)=>a+s.r,0),outSK=totSK-SK.slice(0,7).reduce((a,s)=>a+s.r,0);
  new Chart(document.getElementById('ch-sp'),{type:'doughnut',data:{labels:[...SK.slice(0,7).map(s=>s.s),'Outros'],datasets:[{data:[...SK.slice(0,7).map(s=>s.r),outSK],backgroundColor:['#3b82f6','#00e5a0','#f59e0b','#f43f5e','#a78bfa','#1D9E75','#fb923c','#7a7f8e'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'55%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+f(ctx.parsed)}}}}});
  // Fornec
  const mp2={};CP.forEach(c=>{mp2[c.f]=(mp2[c.f]||0)+c.v;});
  const srt=Object.entries(mp2).sort((a,b)=>b[1]-a[1]);
  new Chart(document.getElementById('ch-fp'),{type:'doughnut',data:{labels:srt.map(s=>s[0].split(' ').slice(0,2).join(' ')),datasets:[{data:srt.map(s=>s[1]),backgroundColor:['#3b82f6','#00e5a0','#f59e0b','#f43f5e','#a78bfa','#1D9E75','#fb923c','#7a7f8e'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+f(ctx.parsed)}}}}});
  const fBM=(nm,k)=>CP.filter(c=>c.f.includes(nm)&&c.m===k).reduce((a,c)=>a+c.v,0);
  const outs2=K.map(k=>CP.filter(c=>!['P & D','KLOOS','DYNASTY','MOHNISH'].some(n=>c.f.includes(n))&&c.m===k).reduce((a,c)=>a+c.v,0));
  new Chart(document.getElementById('ch-fm'),{type:'bar',data:{labels:M,datasets:[{label:'P&D Impex',data:K.map(k=>fBM('P & D',k)),backgroundColor:'#3b82f6',borderRadius:4,stack:'s'},{label:'Kloos',data:K.map(k=>fBM('KLOOS',k)),backgroundColor:'#00e5a0',borderRadius:4,stack:'s'},{label:'Dynasty',data:K.map(k=>fBM('DYNASTY',k)),backgroundColor:'#f59e0b',borderRadius:4,stack:'s'},{label:'Mohnish',data:K.map(k=>fBM('MOHNISH',k)),backgroundColor:'#f43f5e',borderRadius:4,stack:'s'},{label:'Outros',data:outs2,backgroundColor:'#a78bfa',borderRadius:4,stack:'s'}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tt},scales:{x:{...axX,stacked:true},y:{...ax,stacked:true}}}});
}

let EST=[];
// ESTOQUE
let estF='all';
function fEst(fil,btn){
  estF=fil;
  document.querySelectorAll('#est-filter .mt').forEach(el=>el.classList.remove('on'));
  if(btn)btn.classList.add('on');
  rEst();
}
function rEst(){
  const tot=EST.length, semEst=EST.filter(e=>e.zero).length, comEst=tot-semEst;
  const urg=EST.filter(e=>e.zero&&e.v30>10).length;
  const totalBQ=EST.reduce((a,e)=>a+e.bq,0), totalEP=EST.reduce((a,e)=>a+(e.ep||0),0);
  const ultMes=M.length?M[M.length-1]:'Periodo atual';
  document.getElementById('kpi-est').innerHTML=`
    <div class="kc cg"><div class="kl">Total SKUs</div><div class="kv">${tot}</div><div class="ks">${ultMes}</div></div>
    <div class="kc cb"><div class="kl">Boa qualidade (estoque)</div><div class="kv" style="color:var(--b)">${totalBQ.toLocaleString('pt-BR')}</div><div class="ks">${comEst} SKUs com saldo</div></div>
    <div class="kc ca"><div class="kl">Entrada pendente</div><div class="kv" style="color:var(--am)">${totalEP.toLocaleString('pt-BR')}</div><div class="ks">A caminho do Full</div></div>
    <div class="kc cr"><div class="kl">Sem estoque</div><div class="kv" style="color:var(--r)">${semEst}</div><div class="ks">${urg} urgentes (vendas > 10/30d)</div>`;
  
  let rows=EST.map((e,i)=>({e,i}));
  if(estF==='ok') rows=rows.filter(x=>!x.e.zero);
  else if(estF==='imp') rows=rows.filter(x=>x.e.te==='Impulsionar');
  
  const statusColor = e => {
    if(e.zero&&e.v30>10) return 'background:rgba(244,63,94,.12);color:var(--r);border:1px solid rgba(244,63,94,.3)';
    if(e.zero) return 'background:rgba(245,158,11,.10);color:var(--am);border:1px solid rgba(245,158,11,.3)';
    if(e.te==='Impulsionar') return 'background:rgba(245,158,11,.12);color:var(--am);border:1px solid rgba(245,158,11,.3)';
    if(e.te.includes('1 semana')) return 'background:rgba(251,146,60,.12);color:var(--o);border:1px solid rgba(251,146,60,.3)';
    return 'background:rgba(0,229,160,.10);color:var(--g);border:1px solid rgba(0,229,160,.25)';
  };
  const statusLabel = e => {
    if(e.zero&&e.v30>10) return 'Urgente';
    if(e.zero&&(e.ep||0)>0) return 'Reposição';
    if(e.zero) return 'Zerado';
    if(e.te==='Impulsionar') return 'Impulsionar';
    if(e.te.includes('1 semana')) return 'Crítico';
    return 'OK';
  };

  document.getElementById('est-body').innerHTML = rows.map(x=>{
    const e=x.e, idx=x.i;
    const rowStyle = e.zero ? ((e.v30>10) ? 'background:rgba(244,63,94,.06);' : 'background:rgba(245,158,11,.04);') : '';
    const bqStyle = e.zero ? 'color:var(--r);font-weight:500' : 'color:var(--g)';
    const epStyle = e.ep>0 ? 'color:var(--am)' : 'color:var(--mu)';
    return `<tr style="${rowStyle}">
      <td style="font-weight:500;font-size:12px">${e.sku}</td>
      <td style="font-size:11px;color:var(--mu);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.nome}">${e.nome}</td>
      <td class="r" style="${epStyle};font-family:var(--fm);font-size:12px"><input data-est-idx="${idx}" data-est-field="ep" type="number" value="${e.ep||0}" class="dinp" style="max-width:90px;text-align:right;font-size:11px"></td>
      <td class="r" style="${bqStyle};font-family:var(--fm);font-size:12px"><input data-est-idx="${idx}" data-est-field="bq" type="number" value="${e.bq||0}" class="dinp" style="max-width:90px;text-align:right;font-size:11px"></td>
      <td class="r" style="font-family:var(--fm);font-size:12px;color:${e.v30>20?'var(--g)':e.v30>5?'var(--mu)':'var(--mu)'}"><input data-est-idx="${idx}" data-est-field="v30" type="number" value="${e.v30||0}" class="dinp" style="max-width:80px;text-align:right;font-size:11px"></td>
      <td style="text-align:center;font-size:11px;color:var(--mu)"><input data-est-idx="${idx}" data-est-field="te" type="text" value="${e.te||''}" class="dinp" style="max-width:140px;text-align:center;font-size:11px"></td>
      <td style="text-align:center"><span style="font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;${statusColor(e)}">${statusLabel(e)}</span></td>
    </tr>`;
  }).join('');
}

async function estSave(){
  document.querySelectorAll('[data-est-idx][data-est-field]').forEach(inp=>{
    const idx=parseInt(inp.dataset.estIdx);
    const field=inp.dataset.estField;
    if(!EST[idx]) return;
    if(field==='te') EST[idx][field]=(inp.value||'').trim();
    else EST[idx][field]=parseInt(inp.value||0);
    EST[idx].zero=(parseInt(EST[idx].bq||0)<=0);
  });
  const r=await gAPI('POST','/api/estoque',EST);
  if(r.ok){
    gToast('Estoque salvo!');
    rEst();
  } else {
    gToast(r.error||'Erro ao salvar estoque',true);
  }
}

let MARG=[];

let margF='all', margMes=-1;
function sMargMes(i,btn){
  margMes=i;
  document.querySelectorAll('#mg-mes-tabs .mt').forEach(el=>el.classList.remove('on'));
  if(btn)btn.classList.add('on');
  rMarg();
}
function fMarg(f,btn){
  margF=f;
  var par=btn?btn.parentElement:null;
  if(par){par.querySelectorAll('.mt').forEach(function(el){el.classList.remove('on')});btn.classList.add('on');}
  rMarg();
}
function rMarg(){
  var fc=function(v){return 'R$\u00a0'+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});};
  var fp=function(v){return (v>0?'+':'')+v.toFixed(1)+'%';};
  var dash='<span style="color:var(--mu)">—</span>';
  var gd=function(r){return margMes===-1?r.tot:r.m[margMes];};
  var comCusto=MARG.filter(function(r){return r.custo>0&&gd(r).rp>0;});
  var semCusto=MARG.filter(function(r){return r.custo===0||gd(r).rp===0;});
  var totalImob=MARG.filter(function(r){return r.custo>0;}).reduce(function(a,r){return a+r.custo_est;},0);
  var avgMgl=comCusto.length?comCusto.reduce(function(a,r){return a+gd(r).mgl_p;},0)/comCusto.length:0;
  var mesLbl=margMes===-1?periodoLabel():(M[margMes]||K[margMes]||'Mes atual');
  var bestROI=comCusto.filter(function(r){return r.v30>0&&r.custo_est>0&&gd(r).mgl>0;}).map(function(r){
    var mgl=gd(r).mgl; var roi=r.v30>0&&r.custo_est>0?Math.round(mgl*r.v30/r.custo_est*1000)/10:0;
    return {sku:r.sku,roi:roi};
  }).sort(function(a,b){return b.roi-a.roi;})[0];
  document.getElementById('kpi-marg').innerHTML=
    '<div class="kc cg"><div class="kl">SKUs analisados</div><div class="kv">'+comCusto.length+'</div><div class="ks">'+semCusto.length+' sem custo</div></div>'+
    '<div class="kc cb"><div class="kl">Margem liquida media</div><div class="kv" style="color:'+(avgMgl>=0?'var(--g)':'var(--r)')+'">'+avgMgl.toFixed(1)+'%</div><div class="ks">'+mesLbl+'</div></div>'+
    '<div class="kc ca"><div class="kl">Capital imobilizado</div><div class="kv" style="color:var(--am)">'+fc(totalImob)+'</div><div class="ks">Custo estoque atual</div></div>'+
    '<div class="kc cp"><div class="kl">Melhor ROI</div><div class="kv" style="color:var(--p)">'+(bestROI&&bestROI.roi>0?bestROI.roi.toFixed(1)+'%':'—')+'</div><div class="ks">'+(bestROI?bestROI.sku:'')+'</div></div>';
  var rows=MARG;
  if(margF==='ok')   rows=MARG.filter(function(r){return r.custo>0&&gd(r).rp>0&&gd(r).mgl>0;});
  else if(margF==='neg') rows=MARG.filter(function(r){return r.custo>0&&gd(r).rp>0&&gd(r).mgl<=0;});
  else if(margF==='sem') rows=MARG.filter(function(r){return r.custo===0||gd(r).rp===0;});
  rows=rows.slice().sort(function(a,b){return gd(b).mgl_p-gd(a).mgl_p;});
  document.getElementById('marg-body').innerHTML=rows.map(function(r){
    var d=gd(r);
    var sem=r.custo===0||d.rp===0;
    var mgbC=d.mgb_p>=40?'var(--g)':d.mgb_p>=20?'var(--am)':'var(--r)';
    var mglC=d.mgl_p>=20?'var(--g)':d.mgl_p>=0?'var(--am)':'var(--r)';
    var roi=r.v30>0&&r.custo_est>0&&d.mgl>0?Math.round(d.mgl*r.v30/r.custo_est*1000)/10:0;
    var roiC=roi>=100?'var(--g)':roi>=30?'var(--am)':roi>0?'var(--mu)':'var(--r)';
    var giro=r.v30>0&&r.un_est>0?Math.round(r.un_est/r.v30*30):0;
    var girC=giro>0&&giro<=30?'var(--g)':giro<=90?'var(--am)':giro>0?'var(--r)':'var(--mu)';
    return '<tr style="'+(sem?'opacity:.5':'')+'">'
      +'<td style="font-weight:600;font-size:12px">'+r.sku+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm)">'+(r.custo>0?fc(r.custo):dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm)">'+(d.un>0?d.un+' un':dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm)">'+(d.rp>0?fc(d.rp):dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm);color:var(--r)">'+(d.tar>0?fc(d.tar):dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm);color:var(--b)">'+(d.tot>0?fc(d.tot):dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm);color:var(--r)">'+(d.cmv>0?fc(d.cmv):dash)+'</td>'
      +'<td class="r" style="font-size:11px"><span style="color:'+mgbC+';font-weight:600">'+(sem?'—':fp(d.mgb_p))+'</span>'
        +'<br><span style="color:var(--mu);font-size:10px">'+(sem||d.mgb===0?'':d.mgb>0?'+'+fc(d.mgb):'-'+fc(Math.abs(d.mgb)))+'</span></td>'
      +'<td class="r" style="font-size:11px"><span style="color:'+mglC+';font-weight:700">'+(sem?'—':fp(d.mgl_p))+'</span>'
        +'<br><span style="color:var(--mu);font-size:10px">'+(sem||d.mgl===0?'':d.mgl>0?'+'+fc(d.mgl):'-'+fc(Math.abs(d.mgl)))+'</span></td>'
      +'<td class="r" style="font-size:12px;font-family:var(--fm);color:var(--am)">'+(r.custo_est>0?fc(r.custo_est):dash)+'</td>'
      +'<td class="r" style="font-size:12px">'+(r.v30>0?r.v30:dash)+'</td>'
      +'<td class="r" style="font-size:12px;color:'+girC+'">'+(giro>0?giro+'d':dash)+'</td>'
      +'<td class="r" style="font-size:12px;font-weight:700;color:'+roiC+'">'+(roi>0?roi.toFixed(1)+'%':dash)+'</td>'
      +'</tr>';
  }).join('');
}

