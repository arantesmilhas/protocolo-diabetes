const STORAGE_KEY="regenera_vita_glucose_v1",SHOPPING_KEY="regenera_vita_shopping_v1";
const $=(id)=>document.getElementById(id);
const escapeHtml=(value)=>String(value||"").replace(/[&<>'"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
let records=readJson(STORAGE_KEY,[]);

const form=$("glucose-form"),valueInput=$("glucose-value"),unitInput=$("glucose-unit"),dateInput=$("glucose-datetime");
const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());dateInput.value=now.toISOString().slice(0,16);
const toMg=(value,unit)=>unit==="mmol"?value*18:value;
const formatDate=(iso)=>new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(iso));

form.addEventListener("submit",(event)=>{
  event.preventDefault();
  const raw=Number(valueInput.value),mg=toMg(raw,unitInput.value),message=$("form-message");
  if(!Number.isFinite(mg)||mg<20||mg>600){message.textContent="Confira o valor. O diário aceita o equivalente entre 20 e 600 mg/dL.";return}
  records.unshift({id:Date.now(),valueMg:Math.round(mg),original:raw,unit:unitInput.value,context:$("glucose-context").value,date:dateInput.value,note:$("glucose-note").value.trim()});
  records=records.slice(0,120);localStorage.setItem(STORAGE_KEY,JSON.stringify(records));message.textContent="";valueInput.value="";$("glucose-note").value="";renderRecords();
});

function renderRecords(){
  $("stat-count").textContent=records.length;
  if(records.length){const values=records.map(r=>r.valueMg);$("stat-average").textContent=`${Math.round(values.reduce((a,b)=>a+b,0)/values.length)}`;$("stat-min").textContent=Math.min(...values);$("stat-max").textContent=Math.max(...values);$("trend-label").textContent="valores em mg/dL"}
  else{$("stat-average").textContent=$("stat-min").textContent=$("stat-max").textContent="—";$("trend-label").textContent="Sem dados"}
  $("history-body").innerHTML=records.length?records.map(r=>`<tr><td>${formatDate(r.date)}</td><td>${escapeHtml(r.context)}</td><td><strong>${r.valueMg} mg/dL</strong>${r.unit==="mmol"?`<br><small>${Number(r.original).toFixed(1)} mmol/L</small>`:""}</td><td>${escapeHtml(r.note)||"—"}</td><td><button class="text-button danger delete-record" data-id="${r.id}" aria-label="Excluir registro">×</button></td></tr>`).join(""):`<tr><td colspan="5" class="empty-row">Nenhuma medição registrada.</td></tr>`;
  document.querySelectorAll(".delete-record").forEach(button=>button.addEventListener("click",()=>{records=records.filter(r=>r.id!==Number(button.dataset.id));localStorage.setItem(STORAGE_KEY,JSON.stringify(records));renderRecords()}));
  renderChart();
}

function renderChart(){
  const chart=$("glucose-chart"),empty=$("chart-empty"),data=[...records].reverse().slice(-12);
  if(data.length<2){chart.style.display="none";empty.style.display="grid";chart.innerHTML="";return}
  chart.style.display="block";empty.style.display="none";const width=680,height=240,pad=35,values=data.map(r=>r.valueMg),min=Math.max(0,Math.min(...values)-20),max=Math.max(...values)+20,range=max-min||1;
  const points=data.map((r,i)=>({x:pad+i*((width-pad*2)/(data.length-1)),y:height-pad-((r.valueMg-min)/range)*(height-pad*2),v:r.valueMg}));
  const path=points.map((p,i)=>`${i?"L":"M"}${p.x},${p.y}`).join(" ");
  chart.innerHTML=`<defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8c70" stop-opacity=".35"/><stop offset="1" stop-color="#4f8c70" stop-opacity="0"/></linearGradient></defs><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" stroke="#dce4df"/><path d="${path} L${points.at(-1).x},${height-pad} L${points[0].x},${height-pad} Z" fill="url(#fill)"/><path d="${path}" fill="none" stroke="#245d4d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#245d4d" stroke-width="3"><title>${p.v} mg/dL</title></circle><text x="${p.x}" y="${p.y-12}" text-anchor="middle" font-size="11" fill="#607069">${p.v}</text>`).join("")}`;
}

$("clear-history").addEventListener("click",()=>{if(records.length&&confirm("Apagar todas as medições salvas neste navegador?")){records=[];localStorage.removeItem(STORAGE_KEY);renderRecords()}});
$("export-csv").addEventListener("click",()=>{if(!records.length)return alert("Registre ao menos uma medição antes de exportar.");const rows=[["Data","Momento","Glicose (mg/dL)","Observação"],...records.map(r=>[formatDate(r.date),r.context,r.valueMg,r.note])];const csv=rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");const link=document.createElement("a");link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));link.download="diario-glicose-regenera-vita.csv";link.click();URL.revokeObjectURL(link.href)});
$("convert-mg").addEventListener("input",event=>{$("convert-mmol").value=event.target.value?(Number(event.target.value)/18).toFixed(1):""});
$("convert-mmol").addEventListener("input",event=>{$("convert-mg").value=event.target.value?Math.round(Number(event.target.value)*18):""});

const plan=[
 ["Comece pelo simples","Omelete verde com ricota","Frango, salada, arroz integral e feijão","Sopa de abóbora com frango e couve","Iogurte natural com canela","Separe os vegetais do dia seguinte antes de guardar a cozinha."],
 ["Cores no prato","Iogurte, chia, morangos e nozes","Peixe assado, brócolis e lentilha","Salada morna de lentilha com folhas","Pepino com patê de atum","Inclua pelo menos três cores diferentes no almoço."],
 ["Consistência possível","Ovos mexidos, tomate e pão integral","Carne magra, abobrinha e feijão","Omelete de cogumelos e salada","Fruta pequena com castanhas","Anote como estava sua fome antes e depois da refeição."],
 ["Mais fibras","Mingau de aveia, chia e canela","Frango cítrico, legumes e quinoa","Creme de couve-flor com frango","Iogurte natural sem açúcar","Aumente fibras gradualmente e mantenha a hidratação indicada para você."],
 ["Temperos naturais","Ricota temperada, tomate e pão integral","Sardinha, repolho e feijão-fradinho","Berinjela recheada com carne magra","Cenoura com homus","Teste ervas, limão, alho e especiarias para variar o sabor."],
 ["Planejamento leve","Omelete com brócolis","Frango assado, folhas e batata-doce","Salada com ovo e grão-de-bico","Creme de cacau e abacate","Prepare duas porções extras do almoço."],
 ["Revise a semana","Iogurte, chia e frutas vermelhas","Peixe, legumes e arroz integral","Caldo de legumes com carne","Queijo branco e tomate","Observe quais combinações foram mais práticas para você."],
 ["Varie as proteínas","Ovos mexidos com espinafre","Almôndegas caseiras, couve-flor e lentilha","Salada de atum e feijão branco","Fruta pequena e sementes","Alterne fontes animais e vegetais conforme seu plano."],
 ["Organize horários","Iogurte natural, aveia e canela","Frango com quiabo, salada e arroz integral","Abobrinha recheada com ricota","Vegetais com patê de atum","Evite longos intervalos se isso contrariar sua orientação individual."],
 ["Coma com atenção","Omelete de tomate e ervas","Peixe ensopado, repolho e feijão","Sopa de abóbora com frango","Nozes e iogurte natural","Faça uma refeição sem telas e perceba sabores e saciedade."],
 ["Use o que já tem","Ricota, pepino e pão integral","Carne magra, berinjela e grão-de-bico","Salada morna de lentilha","Morangos com chia","Antes de comprar, planeje refeições com itens próximos do vencimento."],
 ["Prepare para repetir","Mingau de aveia com cacau","Frango cítrico, brócolis e quinoa","Omelete verde com ricota","Queijo branco e tomate","Repita boas combinações: rotina não precisa significar monotonia."],
 ["Monte seu repertório","Iogurte, chia e nozes","Sardinha, abobrinha e feijão-fradinho","Creme de couve-flor e carne","Fruta pequena","Escolha suas três receitas favoritas para manter no repertório."],
 ["Continue do seu jeito","Ovos, tomate e folhas","Seu prato favorito no método ½ + ¼ + ¼","Salada completa com proteína e leguminosa","Creme de abacate em pequena porção","Crie o plano dos próximos sete dias a partir do que funcionou."]
];
let activeDay=0;
function renderPlan(){
  $("day-tabs").innerHTML=plan.map((_,i)=>`<button class="day-tab ${i===activeDay?"active":""}" role="tab" aria-selected="${i===activeDay}" data-day="${i}">${i+1}</button>`).join("");
  const d=plan[activeDay];$("day-panel").innerHTML=`<div class="day-panel-head"><div><span class="kicker">Dia ${activeDay+1}</span><h3>${d[0]}</h3></div><span class="pill">Plano flexível</span></div><div class="meal-grid"><div class="meal"><span>Café da manhã</span><strong>${d[1]}</strong></div><div class="meal"><span>Almoço</span><strong>${d[2]}</strong></div><div class="meal"><span>Jantar</span><strong>${d[3]}</strong></div><div class="meal"><span>Lanche opcional</span><strong>${d[4]}</strong></div></div><p class="plan-tip"><b>Dica do dia:</b> ${d[5]}</p>`;
  $("plan-progress").textContent=`Dia ${activeDay+1} de 14`;document.querySelectorAll(".day-tab").forEach(button=>button.addEventListener("click",()=>{activeDay=Number(button.dataset.day);renderPlan()}));
}
$("previous-day").addEventListener("click",()=>{activeDay=(activeDay+13)%14;renderPlan()});$("next-day").addEventListener("click",()=>{activeDay=(activeDay+1)%14;renderPlan()});

const shopping={"Hortifruti":["Folhas variadas","Brócolis e couve-flor","Abobrinha e berinjela","Tomate, pepino e cenoura","Abóbora e couve","Limão e frutas","Alho, cebola e ervas"],"Proteínas":["Ovos","Peito de frango","Peixes e sardinha","Carne magra","Atum em água","Ricota ou queijo branco","Iogurte natural sem açúcar"],"Despensa":["Feijão e lentilha","Grão-de-bico","Arroz integral ou quinoa","Aveia e chia","Nozes ou castanhas","Cacau 100%","Azeite e especiarias"],"Praticidade":["Potes com tampa","Sacos reutilizáveis","Papel para identificar porções","Garrafa de água","Guardanapos ou talheres portáteis"]};
let checked=readJson(SHOPPING_KEY,[]);
function renderShopping(){$("shopping-list").innerHTML=Object.entries(shopping).map(([group,items])=>`<section class="shopping-group"><h3>${group}</h3>${items.map(item=>`<label class="check-item"><input type="checkbox" value="${escapeHtml(item)}" ${checked.includes(item)?"checked":""}><span>${item}</span></label>`).join("")}</section>`).join("");document.querySelectorAll("#shopping-list input").forEach(input=>input.addEventListener("change",()=>{checked=[...document.querySelectorAll("#shopping-list input:checked")].map(i=>i.value);localStorage.setItem(SHOPPING_KEY,JSON.stringify(checked))}))}
$("reset-shopping").addEventListener("click",()=>{checked=[];localStorage.removeItem(SHOPPING_KEY);renderShopping()});
document.querySelector(".menu-toggle").addEventListener("click",event=>{const links=document.querySelector(".nav-links"),open=links.classList.toggle("open");event.currentTarget.setAttribute("aria-expanded",open)});document.querySelectorAll(".nav-links a").forEach(link=>link.addEventListener("click",()=>document.querySelector(".nav-links").classList.remove("open")));

renderRecords();renderPlan();renderShopping();
