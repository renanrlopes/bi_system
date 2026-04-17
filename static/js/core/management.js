// �"?�"? Gestão helpers �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
const gAPI=async(m,u,b)=>{const o={method:m,headers:{'Content-Type':'application/json'}};if(b)o.body=JSON.stringify(b);return(await fetch(u,o)).json();};
const fc2=v=>'R$\u00a0'+Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
function gToast(msg,err=false){const el=document.getElementById('g-toast');el.textContent=msg;el.style.borderColor=err?'var(--r)':'var(--g)';el.style.color=err?'var(--r)':'var(--g)';el.style.display='block';setTimeout(()=>el.style.display='none',3200);}

// �"?�"? Dados financeiros �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
let finData={};
let finTab_='receitas';

function finTab(t,btn){
  finTab_=t;
  document.querySelectorAll('#fin-tabs .mt').forEach(el=>el.classList.remove('on'));
  if(btn)btn.classList.add('on');
  finRender();
}

function finField(label,path,val,type='number'){
  return `<div style="margin-bottom:10px">
    <div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">${label}</div>
    <input data-path="${path}" type="${type}" value="${val}" class="dinp" style="font-family:var(--fm)">
  </div>`;
}

function finMonthGrid(fields){
  const months=M.length?M:['Jan','Fev','Mar'];
  let html=`<div style="display:grid;grid-template-columns:180px ${months.map(()=>'1fr').join(' ')};gap:8px;align-items:center;margin-bottom:4px">
    <div style="font-size:10px;color:var(--mu)">Campo</div>
    ${months.map(m=>`<div style="font-size:10px;color:var(--mu);text-align:right">${m}</div>`).join('')}
  </div>`;
  fields.forEach(([label,arr])=>{
    html+=`<div style="display:grid;grid-template-columns:180px ${months.map(()=>'1fr').join(' ')};gap:8px;align-items:center;margin-bottom:6px">
      <div style="font-size:12px">${label}</div>
      ${(arr||[]).map((v,i)=>`<input data-arr="${label}" data-idx="${i}" type="number" step="0.01" value="${v}" class="dinp" style="font-family:var(--fm);font-size:11px;text-align:right">`).join('')}
    </div>`;
  });
  return html;
}

function finRender(){
  const fin=finData, V2=fin.V||{}, DESP2=fin.DESP||{}, K2=K.length?K:['2026-01','2026-02','2026-03'];
  let html='';

  if(finTab_==='receitas'){
    html='<div class="card sec"><div class="ct">Receitas e liquidações ML</div>';
    html+=finMonthGrid([
      ['Receita bruta (rp)', V2.rp],
      ['Acréscimo parcelamento (ac)', V2.ac],
      ['Taxa parcelamento (txa)', V2.txa],
      ['Tarifa venda+imp (tv)', V2.tv],
      ['Receita envio (re)', V2.re],
      ['Tarifa envio (te)', V2.te],
      ['Cancelamentos (ca)', V2.ca],
      ['Descontos/bônus (db)', V2.db],
      ['Líquido ML (lq)', V2.lq],
      ['Pedidos (pd)', V2.pd],
    ]);
    html+='</div>';
  } else if(finTab_==='cmv'){
    html='<div class="card sec"><div class="ct">CMV �?" Custo das Mercadorias Vendidas</div>';
    html+=finMonthGrid([
      ['CMV Total', K2.map(k=>(fin.CMV||{})[k]||0)],
      ['CMV c/ Nota Fiscal', K2.map(k=>(fin.CMV_NF||{})[k]||0)],
      ['CMV Simples Nacional', K2.map(k=>(fin.CMV_SN||{})[k]||0)],
    ]);
    html+='</div>';
  } else if(finTab_==='desp'){
    html='<div class="card sec"><div class="ct">Despesas operacionais por mês</div>';
    const dfields=['contab','pub','imp','tml','prolabore_lucas','prolabore_fellipe','galpao','frete'];
    const dlabels={'contab':'Contabilidade','pub':'Publicidade','imp':'Impostos','tml':'Tarifas ML','prolabore_lucas':'Pró-labore Lucas','prolabore_fellipe':'Pró-labore Fellipe','galpao':'Galpão/água/luz','frete':'Frete/transporte'};
    html+=finMonthGrid(dfields.map(f=>[dlabels[f]||f, K2.map(k=>((DESP2[k]||{})[f])||0)]));
    html+='</div>';
  } else if(finTab_==='emp'){
    html='<div class="card sec"><div class="ct">Empréstimos / Encargos por mês</div>';
    html+=finMonthGrid([
      ['Encargos ML (ENC)', K2.map(k=>(fin.ENC||{})[k]||0)],
      ['Empréstimo pago (EMP)', K2.map(k=>(fin.EMP||{})[k]||0)],
      ['Entrada empréstimo', K2.map(k=>(fin.EMP_ENTRADA||{})[k]||0)],
      ['Total contratual', K2.map(k=>(fin.EMP_TOTAL||{})[k]||0)],
      ['Aportes sócios', K2.map(k=>(fin.APORTES||{})[k]||0)],
      ['Devoluções aporte', K2.map(k=>(fin.DEV_APORTE||{})[k]||0)],
    ]);
    html+='</div>';
  } else if(finTab_==='debml'){
    html='<div class="card sec"><div class="ct">Débitos operacionais ML por mês</div>';
    html+=finMonthGrid([
      ['Déb. Reclamações', K2.map(k=>((fin.DEB_ML_DET||{})[k]||{}).recl||0)],
      ['Déb. Retido', K2.map(k=>((fin.DEB_ML_DET||{})[k]||{}).retido||0)],
      ['Déb. Devoluções', K2.map(k=>((fin.DEB_ML_DET||{})[k]||{}).devolv||0)],
      ['Déb. Envio', K2.map(k=>((fin.DEB_ML_DET||{})[k]||{}).envio||0)],
    ]);
    html+='</div>';
  } else if(finTab_==='meses'){
    html='<div class="card sec"><div class="ct">Períodos (meses) do BI</div>';
    html+='<p style="font-size:12px;color:var(--mu);margin-bottom:14px;line-height:1.7">Adicione novos meses. O formato da chave deve ser AAAA-MM (ex: 2026-04).</p>';
    html+='<div id="meses-list" style="margin-bottom:14px">';
    (load_meses||[]).forEach((m,i)=>{ html+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-family:var(--fm);font-size:12px;background:var(--bg3);padding:4px 10px;border-radius:5px">${m.key}</span><span style="font-size:12px">${m.label}</span></div>`; });
    html+='</div>';
    html+=`<div style="display:flex;gap:8px;margin-bottom:8px">
      <input id="nm-key" class="dinp" placeholder="2026-04" style="width:120px">
      <input id="nm-label" class="dinp" placeholder="Abr/2026" style="width:120px">
      <button onclick="addMes()" class="cbtn">Adicionar mês</button>
    </div>`;
    html+='</div>';
  }
  document.getElementById('fin-body').innerHTML=html;
}

let load_meses=[];

async function finLoad(){
  const [fin,meses]=await Promise.all([fetch('/api/financeiro').then(r=>r.json()),fetch('/api/meses').then(r=>r.json())]);
  finData=fin; load_meses=meses; finRender();
}

async function finSave(){
  // collect edits from inputs
  const newFin=JSON.parse(JSON.stringify(finData));
  // month arrays
  document.querySelectorAll('[data-arr]').forEach(inp=>{
    const arr=inp.dataset.arr, idx=parseInt(inp.dataset.idx), val=parseFloat(inp.value)||0;
    const map={'Receita bruta (rp)':'rp','Acréscimo parcelamento (ac)':'ac','Taxa parcelamento (txa)':'txa','Tarifa venda+imp (tv)':'tv','Receita envio (re)':'re','Tarifa envio (te)':'te','Cancelamentos (ca)':'ca','Descontos/bônus (db)':'db','Líquido ML (lq)':'lq','Pedidos (pd)':'pd'};
    const key=map[arr];
    if(key){if(!newFin.V)newFin.V={};if(!newFin.V[key])newFin.V[key]=[0,0,0];newFin.V[key][idx]=val;}
    // CMV
    const cmvMap={'CMV Total':'CMV','CMV c/ Nota Fiscal':'CMV_NF','CMV Simples Nacional':'CMV_SN'};
    if(cmvMap[arr]){const k2=K[idx];if(!newFin[cmvMap[arr]])newFin[cmvMap[arr]]={};newFin[cmvMap[arr]][k2]=val;}
    // DESP
    const dlabels={'Contabilidade':'contab','Publicidade':'pub','Impostos':'imp','Tarifas ML':'tml','Pró-labore Lucas':'prolabore_lucas','Pró-labore Fellipe':'prolabore_fellipe','Galpão/água/luz':'galpao','Frete/transporte':'frete'};
    if(dlabels[arr]){const k2=K[idx];if(!newFin.DESP)newFin.DESP={};if(!newFin.DESP[k2])newFin.DESP[k2]={};newFin.DESP[k2][dlabels[arr]]=val;}
    // EMP/ENC
    const empMap={'Encargos ML (ENC)':'ENC','Empréstimo pago (EMP)':'EMP','Entrada empréstimo':'EMP_ENTRADA','Total contratual':'EMP_TOTAL','Aportes sócios':'APORTES','Devoluções aporte':'DEV_APORTE'};
    if(empMap[arr]){const k2=K[idx];if(!newFin[empMap[arr]])newFin[empMap[arr]]={};newFin[empMap[arr]][k2]=val;}
    // DEB_ML
    const debMap={'Déb. Reclamações':'recl','Déb. Retido':'retido','Déb. Devoluções':'devolv','Déb. Envio':'envio'};
    if(debMap[arr]){const k2=K[idx];if(!newFin.DEB_ML_DET)newFin.DEB_ML_DET={};if(!newFin.DEB_ML_DET[k2])newFin.DEB_ML_DET[k2]={recl:0,retido:0,devolv:0,envio:0};newFin.DEB_ML_DET[k2][debMap[arr]]=val;}
  });
  // rebuild DEB_ML totals
  K.forEach(k=>{const d=(newFin.DEB_ML_DET||{})[k]||{};newFin.DEB_ML[k]=(d.recl||0)+(d.retido||0)+(d.devolv||0)+(d.envio||0);});
  await gAPI('POST','/api/financeiro',newFin);
  gToast('Dados financeiros salvos! Recarregue o painel.');
}

async function addMes(){
  const key=document.getElementById('nm-key').value.trim();
  const label=document.getElementById('nm-label').value.trim();
  if(!key||!label)return gToast('Preencha chave e label',true);
  const mesesAtuais=await fetch('/api/meses').then(r=>r.json());
  if((mesesAtuais||[]).some(m=>m.key===key))return gToast('Esse mês já existe',true);
  const r=await gAPI('POST','/api/meses',[...(mesesAtuais||[]),{key,label}]);
  if(r.ok){gToast('Mês adicionado! Recarregue.');document.getElementById('nm-key').value='';document.getElementById('nm-label').value='';}
  else gToast(r.error||'Erro',true);
}

// �"?�"? Produtos �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
let gpList=[], gpEditId=null;
async function gpLoad(){
  gpList=await fetch('/api/produtos').then(r=>r.json());
  document.getElementById('gp-count2').textContent=gpList.length+' produtos';
  document.getElementById('gp-tb').innerHTML=gpList.length?gpList.map((p,i)=>`
    <tr><td class="dt">${i+1}</td><td style="font-size:12px;font-weight:500">${p.sku}</td>
    <td style="font-size:11px;color:var(--mu);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.descricao_detalhada||''}">${p.descricao_detalhada||'—'}</td>
    <td style="font-size:11px;color:var(--mu)">${p.embalagem||'—'}</td>
    <td class="r">${(p.quantidade ?? p.estoque) || 0}</td>
    <td class="rp">${fc2(p.custo||0)}</td>
    <td style="text-align:right;font-family:var(--fm);font-size:11px;color:var(--am)">${fc2(p.custo_total ?? ((p.custo||0)*((p.quantidade ?? p.estoque)||0)))}</td>
    <td style="font-size:11px;color:var(--mu);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.obs||''}">${p.obs||'—'}</td>
    <td style="font-size:11px;color:var(--mu);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.equivalente_catalogo||''}">${p.equivalente_catalogo||'—'}</td>
    <td style="font-size:11px;color:var(--mu)">${p.ref_pagina||'—'}</td>
    <td style="font-size:11px">${(p.foto_b64||p.foto)?`<a href="${p.foto_b64?`data:${p.foto_mime||'image/*'};base64,${p.foto_b64}`:p.foto}" target="_blank" rel="noopener" style="color:var(--b)">Abrir</a>`:'—'}</td>
    <td class="r">${p.v30||0}</td>
    <td style="text-align:right">
      <button onclick="gpEdit(${p.id})" style="padding:3px 8px;background:var(--bg3);color:var(--tx);border:1px solid var(--bdr);border-radius:5px;cursor:pointer;font-size:11px;margin-right:3px">Ed</button>
      <button onclick="gpDel(${p.id})" style="padding:3px 8px;background:rgba(244,63,94,.12);color:var(--r);border:1px solid rgba(244,63,94,.3);border-radius:5px;cursor:pointer;font-size:11px">Excluir</button>
    </td></tr>`).join('')
    :'<tr><td colspan="13" style="text-align:center;color:var(--mu);padding:20px">Nenhum produto</td></tr>';
}
async function gpSave(){
  const sku=document.getElementById('gp-sku').value.trim();
  if(!sku)return gToast('Informe o SKU',true);
  const quantidade=parseInt(document.getElementById('gp-qt').value)||0;
  const custo=parseFloat(document.getElementById('gp-custo').value)||0;
  const custoTotalManual=parseFloat(document.getElementById('gp-custo-total').value);
  const fotoInput=document.getElementById('gp-foto-arq');
  const fotoFile=fotoInput&&fotoInput.files&&fotoInput.files[0]?fotoInput.files[0]:null;
  let fotoPayload={};
  if(fotoFile){
    const b64=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const result=String(reader.result||'');
        const idx=result.indexOf(',');
        resolve(idx>=0?result.slice(idx+1):'');
      };
      reader.onerror=()=>reject(new Error('Falha ao ler imagem'));
      reader.readAsDataURL(fotoFile);
    });
    fotoPayload={foto_b64:b64,foto_nome:fotoFile.name||'',foto_mime:fotoFile.type||'image/*'};
  }else if(gpEditId){
    const current=gpList.find(x=>x.id===gpEditId)||{};
    fotoPayload={
      foto_b64:current.foto_b64||'',
      foto_nome:current.foto_nome||'',
      foto_mime:current.foto_mime||'',
      foto:current.foto||'',
    };
  }

  const d={
    sku,
    descricao_detalhada:document.getElementById('gp-desc').value.trim(),
    embalagem:document.getElementById('gp-emb').value.trim(),
    quantidade,
    custo,
    custo_total:Number.isFinite(custoTotalManual)?custoTotalManual:(quantidade*custo),
    obs:document.getElementById('gp-obs').value.trim(),
    equivalente_catalogo:document.getElementById('gp-eq').value.trim(),
    ref_pagina:document.getElementById('gp-ref').value.trim(),
    estoque:quantidade,
    v30:parseInt(document.getElementById('gp-v30').value)||0,
    ...fotoPayload,
  };
  if(gpEditId){await gAPI('PUT','/api/produtos/'+gpEditId,d);gToast('Atualizado!');}
  else{await gAPI('POST','/api/produtos',d);gToast('Salvo!');}
  gpClear();gpLoad();
}
function gpEdit(id){
  const p=gpList.find(x=>x.id===id);if(!p)return;
  gpEditId=id;
  document.getElementById('gp-sku').value=p.sku||'';
  document.getElementById('gp-desc').value=p.descricao_detalhada||'';
  document.getElementById('gp-emb').value=p.embalagem||'';
  document.getElementById('gp-qt').value=(p.quantidade ?? p.estoque) || '';
  document.getElementById('gp-custo').value=p.custo||'';
  document.getElementById('gp-custo-total').value=p.custo_total||'';
  document.getElementById('gp-obs').value=p.obs||'';
  document.getElementById('gp-eq').value=p.equivalente_catalogo||'';
  document.getElementById('gp-ref').value=p.ref_pagina||'';
  const fi=document.getElementById('gp-foto-info');
  if(fi) fi.textContent=p.foto_nome?`Arquivo atual: ${p.foto_nome}`:((p.foto_b64||p.foto)?'Arquivo atual: imagem cadastrada':'Nenhum arquivo selecionado');
  const inp=document.getElementById('gp-foto-arq');
  if(inp) inp.value='';
  document.getElementById('gp-v30').value=p.v30||'';
}
async function gpDel(id){if(!confirm('Excluir?'))return;await gAPI('DELETE','/api/produtos/'+id);gToast('Excluído');gpLoad();}
function gpClear(){
  gpEditId=null;
  ['gp-sku','gp-desc','gp-emb','gp-qt','gp-custo','gp-custo-total','gp-obs','gp-eq','gp-ref','gp-v30'].forEach(id=>document.getElementById(id).value='');
  const inp=document.getElementById('gp-foto-arq');
  if(inp) inp.value='';
  const fi=document.getElementById('gp-foto-info');
  if(fi) fi.textContent='Nenhum arquivo selecionado';
}

document.addEventListener('change',(ev)=>{
  if(ev.target&&ev.target.id==='gp-foto-arq'){
    const f=ev.target.files&&ev.target.files[0];
    const fi=document.getElementById('gp-foto-info');
    if(fi) fi.textContent=f?`Selecionado: ${f.name}`:'Nenhum arquivo selecionado';
  }
});
async function gpImport(inp){const file=inp.files[0];if(!file)return;const form=new FormData();form.append('file',file);const r=await fetch('/api/import/produtos',{method:'POST',body:form});const d=await r.json();if(d.ok){gToast(`${d.added} adicionados, ${d.updated} atualizados`);gpLoad();}else gToast('Erro: '+d.error,true);inp.value='';}

// �"?�"? Notas �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
let nf2List=[], nf2F='all';
let nf2EditId=null;
async function nf2Load(){nf2List=await fetch('/api/notas').then(r=>r.json());nf2Render();}
function nf2Render(){
  const lista=nf2F==='all'?nf2List:nf2List.filter(n=>n.tipo===nf2F);
  document.getElementById('nf2-tb').innerHTML=lista.length?lista.map(n=>`
    <tr><td class="dt">${n.data?`${(n.data||'').slice(8)}/${(n.data||'').slice(5,7)}`:'—'}</td>
    <td style="font-size:11px;color:var(--mu);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${n.item||''}">${n.item||'—'}</td>
    <td style="font-size:11px;color:var(--mu)">${n.cod_ncm||'—'}</td>
    <td style="text-align:right">
      <button onclick="nf2Edit(${n.id})" style="padding:3px 8px;background:var(--bg3);color:var(--tx);border:1px solid var(--bdr);border-radius:5px;cursor:pointer;font-size:11px;margin-right:3px">Editar</button>
      <button onclick="nf2Del(${n.id})" style="padding:3px 8px;background:rgba(244,63,94,.12);color:var(--r);border:1px solid rgba(244,63,94,.3);border-radius:5px;cursor:pointer;font-size:11px">Excluir</button>
    </td></tr>`).join('')
    :'<tr><td colspan="4" style="text-align:center;color:var(--mu);padding:20px">Nenhuma nota</td></tr>';
  document.getElementById('nf2-ft').textContent=lista.length?`${lista.length} notas`:'';
}
async function nf2Save(){
  if(!nf2EditId)return gToast('Use o botão Editar na tabela para alterar uma nota',true);
  const d={data:document.getElementById('nf2-data').value,numero:document.getElementById('nf2-num').value.trim(),fornecedor:document.getElementById('nf2-forn').value.trim(),valor:parseFloat(document.getElementById('nf2-val').value)||0,valor_nf:parseFloat(document.getElementById('nf2-nf').value)||0,valor_sn:parseFloat(document.getElementById('nf2-sn').value)||0,tipo:document.getElementById('nf2-tipo').value,item:document.getElementById('nf2-item').value.trim(),cod_ncm:document.getElementById('nf2-ncm').value.trim(),obs:document.getElementById('nf2-obs').value.trim()};
  const r=await gAPI('PUT','/api/notas/'+nf2EditId,d);
  if(!r.ok)return gToast(r.error||'Erro ao atualizar nota',true);
  gToast('Nota atualizada!');
  nf2CancelEdit();
  nf2Load();
}
function nf2Edit(id){
  const n=nf2List.find(x=>x.id===id);
  if(!n)return;
  nf2EditId=id;
  document.getElementById('nf2-data').value=n.data||'';
  document.getElementById('nf2-num').value=n.numero||'';
  document.getElementById('nf2-forn').value=n.fornecedor||'';
  document.getElementById('nf2-val').value=n.valor||'';
  document.getElementById('nf2-nf').value=n.valor_nf||'';
  document.getElementById('nf2-sn').value=n.valor_sn||'';
  document.getElementById('nf2-tipo').value=n.tipo||'cmv';
  document.getElementById('nf2-item').value=n.item||'';
  document.getElementById('nf2-ncm').value=n.cod_ncm||'';
  document.getElementById('nf2-obs').value=n.obs||'';
  const saveBtn=document.getElementById('nf2-save-btn');
  const cancelBtn=document.getElementById('nf2-cancel-btn');
  const title=document.getElementById('nf2-mode-title');
  const panel=document.getElementById('nf2-edit-panel');
  if(panel)panel.style.display='block';
  if(saveBtn)saveBtn.textContent='Salvar edição';
  if(cancelBtn)cancelBtn.style.display='inline-flex';
  if(title)title.textContent='Editando nota fiscal';
}
function nf2ClearForm(){
  ['nf2-data','nf2-num','nf2-forn','nf2-val','nf2-nf','nf2-sn','nf2-item','nf2-ncm','nf2-obs'].forEach(id=>document.getElementById(id).value='');
}
function nf2CancelEdit(){
  nf2EditId=null;
  nf2ClearForm();
  const saveBtn=document.getElementById('nf2-save-btn');
  const cancelBtn=document.getElementById('nf2-cancel-btn');
  const title=document.getElementById('nf2-mode-title');
  const panel=document.getElementById('nf2-edit-panel');
  if(panel)panel.style.display='none';
  if(saveBtn)saveBtn.textContent='Salvar edição';
  if(cancelBtn)cancelBtn.style.display='inline-flex';
  if(title)title.textContent='Editando nota fiscal';
}
async function nf2Del(id){if(!confirm('Excluir?'))return;await gAPI('DELETE','/api/notas/'+id);gToast('Excluída');nf2Load();}
function nf2OpenPdf(id){window.open('/api/notas/'+id+'/pdf','_blank');}
function nf2Filter(f){nf2F=f;['all','cmv','dp'].forEach(k=>{const el=document.getElementById('nf2f-'+k);if(el)el.classList.toggle('on',k===f||(f==='desp'&&k==='dp'));});nf2Render();}
function nf2Toast(msg,err=false){
  try{ if(typeof gToast==='function') gToast(msg,err); }catch(_){ /* no-op */ }
}
function nf2SetImportStatus(msg){
  const statusEl=document.getElementById('nf2-import-status');
  if(statusEl)statusEl.textContent=msg;
}
function nf2WireImportButton(){
  const btn=document.getElementById('nf2-import-btn');
  if(btn&&!btn.dataset.bound){
    btn.addEventListener('click',(ev)=>{ev.preventDefault();ev.stopPropagation();nf2ImportFromSelected();});
    btn.dataset.bound='1';
  }
  const inp=document.getElementById('nf2-file');
  if(inp&&!inp.dataset.bound){
    inp.addEventListener('change',()=>nf2OnFileSelected(inp));
    inp.dataset.bound='1';
  }
}
function nf2OnFileSelected(inp){
  const file=inp&&inp.files&&inp.files[0];
  nf2SetImportStatus(file?`Arquivo selecionado: ${file.name}`:'Aguardando importação de planilha.');
}
function nf2ImportFromSelected(){
  nf2SetImportStatus('Botão Importar planilha clicado. Validando arquivo...');
  const inp=document.getElementById('nf2-file');
  if(!inp||!inp.files||!inp.files[0]){
    nf2Toast('Selecione um arquivo .xlsx antes de importar',true);
    nf2SetImportStatus('Selecione um arquivo .xlsx antes de importar.');
    return;
  }
  nf2ImportItemNcm(inp);
}
async function nf2ImportItemNcm(inp){
  const file=inp&&inp.files&&inp.files[0];
  if(!file)return;
  try{
    nf2Toast('Importando planilha...');
    nf2SetImportStatus('Importando planilha...');
    const form=new FormData();
    form.append('file',file);
    form.append('replace','1');
    const r=await fetch('/api/import/notas_item_ncm',{method:'POST',body:form});
    const text=await r.text();
    let d={};
    try{ d=JSON.parse(text||'{}'); }catch(_){ d={ok:false,error:text||`Falha HTTP ${r.status}`}; }

    if(!r.ok||!d.ok){
      const msg=d.error||`Erro ao importar (HTTP ${r.status})`;
      nf2Toast(msg,true);
      nf2SetImportStatus(msg);
      return;
    }

    const colsInfo=(d.item_col&&d.ncm_col)
      ?` Colunas usadas: ITEM=${d.item_col}, NCM=${d.ncm_col}${d.data_col?`, DATA=${d.data_col}`:''}.`
      :'';
    const sheetInfo=d.sheet?` Aba: ${d.sheet}${typeof d.header_row==='number'?`, cabeçalho na linha ${d.header_row+1}`:''}.`:'';
    const okMsg=d.replaced
      ?`Importação concluída: base substituída (${d.final_count} registros). ${d.added} novos, ${d.updated} consolidados.${colsInfo}${sheetInfo}`
      :`Importação concluída: ${d.added} novas, ${d.updated} atualizadas.${colsInfo}${sheetInfo}`;
    nf2Toast(okMsg);
    nf2SetImportStatus(okMsg);
    nf2Load();
  }catch(err){
    const msg=`Falha ao importar planilha: ${err&&err.message?err.message:'erro inesperado'}`;
    nf2Toast(msg,true);
    nf2SetImportStatus(msg);
  }finally{
    inp.value='';
  }
}
document.addEventListener('DOMContentLoaded',nf2WireImportButton);
setTimeout(nf2WireImportButton,0);

// �"?�"? Aportes �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
let apList=[], emList=[];
async function apLoad(){apList=await fetch('/api/aportes').then(r=>r.json());apRender();rApo();}
function apRender(){
  document.getElementById('ap-tb').innerHTML=apList.length?apList.map(a=>`
    <tr><td class="dt">${a.data||''}</td><td style="font-size:12px">${(a.socio||'').split(' ')[0]}</td>
    <td style="font-size:11px;color:var(--mu)">${a.descricao||''}</td>
    <td style="text-align:right;font-family:var(--fm);font-size:11px;color:${a.tipo==='devolucao'?'var(--r)':'var(--b)'}">${a.tipo==='devolucao'?'− ':'+ '}${fc2(a.valor||0)}</td>
    <td><span style="font-size:10px;padding:2px 6px;border-radius:20px;background:${a.tipo==='entrada'?'rgba(59,130,246,.12)':'rgba(244,63,94,.12)'};color:${a.tipo==='entrada'?'var(--b)':'var(--r)'}">${a.tipo==='entrada'?'Entrada':'Devolução'}</span></td>
    <td style="text-align:right"><button onclick="apDel(${a.id})" style="padding:3px 8px;background:rgba(244,63,94,.12);color:var(--r);border:1px solid rgba(244,63,94,.3);border-radius:5px;cursor:pointer;font-size:11px">Excluir</button></td></tr>`).join('')
    :'<tr><td colspan="6" style="text-align:center;color:var(--mu);padding:16px">Nenhum aporte</td></tr>';
}
async function apSave(){
  const d={socio:document.getElementById('ap-socio').value,data:document.getElementById('ap-data').value,valor:parseFloat(document.getElementById('ap-val').value)||0,tipo:document.getElementById('ap-tipo').value,obs:document.getElementById('ap-obs').value.trim(),descricao:document.getElementById('ap-obs').value.trim()};
  if(!d.valor)return gToast('Informe o valor',true);
  await gAPI('POST','/api/aportes',d);gToast('Aporte salvo!');
  ['ap-data','ap-val','ap-obs'].forEach(id=>document.getElementById(id).value='');
  apLoad();
}
async function apDel(id){if(!confirm('Excluir?'))return;await gAPI('DELETE','/api/aportes/'+id);gToast('Excluído');apLoad();}

async function emLoad(){emList=await fetch('/api/emprestimos').then(r=>r.json());emRender();rApo();}
function emRender(){
  document.getElementById('em-tb').innerHTML=emList.length?emList.map(e=>`
    <tr><td class="dt">${e.data||''}</td><td style="font-size:12px">${e.descricao||''}</td>
    <td class="rp">${fc2(e.valor||0)}</td><td style="text-align:right;font-family:var(--fm);font-size:11px;color:var(--o)">${fc2(e.total_pagar||0)}</td>
    <td style="text-align:right"><button onclick="emDel(${e.id})" style="padding:3px 8px;background:rgba(244,63,94,.12);color:var(--r);border:1px solid rgba(244,63,94,.3);border-radius:5px;cursor:pointer;font-size:11px">Excluir</button></td></tr>`).join('')
    :'<tr><td colspan="5" style="text-align:center;color:var(--mu);padding:16px">Nenhum empréstimo</td></tr>';
}
async function emSave(){
  const d={data:document.getElementById('em-data').value,descricao:document.getElementById('em-desc').value.trim(),valor:parseFloat(document.getElementById('em-val').value)||0,total_pagar:parseFloat(document.getElementById('em-tot').value)||0,obs:document.getElementById('em-obs').value.trim()};
  if(!d.valor)return gToast('Informe o valor',true);
  await gAPI('POST','/api/emprestimos',d);gToast('Empréstimo salvo!');
  ['em-data','em-desc','em-val','em-tot','em-obs'].forEach(id=>document.getElementById(id).value='');
  emLoad();
}
async function emDel(id){if(!confirm('Excluir?'))return;await gAPI('DELETE','/api/emprestimos/'+id);gToast('Excluído');emLoad();}

// �"?�"? Importações �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
async function importSKUs(inp){const file=inp.files[0];if(!file)return;document.getElementById('skuimp-name').textContent=file.name;const form=new FormData();form.append('file',file);const r=await fetch('/api/import/skus',{method:'POST',body:form});const d=await r.json();if(d.ok)gToast(`${d.count} SKUs importados`);else gToast('Erro: '+d.error,true);inp.value='';}
async function importProds(inp){const file=inp.files[0];if(!file)return;document.getElementById('prodimp-name').textContent=file.name;const form=new FormData();form.append('file',file);const r=await fetch('/api/import/produtos',{method:'POST',body:form});const d=await r.json();if(d.ok)gToast(`${d.added} add, ${d.updated} atualizados`);else gToast('Erro: '+d.error,true);inp.value='';}

async function mlSyncNow(){
  const el=document.getElementById('ml-sync-status');
  if(el)el.textContent='Sincronizando...';
  const r=await fetch('/api/sync/ml',{method:'POST'});
  const d=await r.json();
  if(d.ok){
    const res=d.result||{};
    if(el)el.textContent=`OK · pedidos: ${res.orders||0} · vendas: ${res.vendas||0} · SKUs: ${res.skus||0}`;
    gToast('Sincronização concluída!');
    loadDB();
  }else{
    if(el)el.textContent='Erro: '+(d.error||'falha na sincronização');
    gToast('Erro ao sincronizar: '+(d.error||'falha'),true);
  }
}

async function mlSyncStatus(){
  const el=document.getElementById('ml-sync-status');
  const r=await fetch('/api/sync/ml/status');
  const d=await r.json();
  if(!d.ok){
    if(el)el.textContent='Não foi possível consultar status.';
    return;
  }
  const runs=d.runs||[];
  if(!runs.length){
    if(el)el.textContent='Ainda não há sincronizações registradas.';
    return;
  }
  const last=runs[0];
  if(el)el.textContent=`Última execução: ${last.status} · ${last.created_at || ''}`;
}

// �"?�"? Histórico �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
async function loadHist(){
  const hist=await fetch('/api/historico').then(r=>r.json());
  document.getElementById('hist-tb').innerHTML=hist.length?hist.map(h=>`
    <tr><td class="dt">${h.ts}</td><td style="font-size:12px;color:var(--g)">${h.user}</td>
    <td style="font-size:11px;font-family:var(--fm);color:var(--mu)">${h.action}</td>
    <td style="font-size:11px;color:var(--mu)">${h.detail||''}</td></tr>`).join('')
    :'<tr><td colspan="4" style="text-align:center;color:var(--mu);padding:20px">Sem registros</td></tr>';
}

// �"?�"? Init gestão �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
function gLoad(){finLoad();gpLoad();nf2Load();apLoad();emLoad();loadHist();}
