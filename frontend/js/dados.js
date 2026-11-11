/* =====================================================================
   VINCENT CRIATÓRIO — CAMADA DE DADOS (Firebase)
   ---------------------------------------------------------------------
   As páginas continuam chamando fetch(`${API}/coelhos`) etc., como antes.
   Este arquivo intercepta essas chamadas e responde na hora com os dados
   guardados no próprio aparelho (IndexedDB), imitando o servidor antigo
   (mesmas rotas, mesmos campos, mesma ordenação).

   Em segundo plano, tudo é sincronizado com o Firestore:
   - cada registro é um documento em users/{uid}/{tabela}/{id};
   - ao abrir, só são baixados os documentos alterados desde a última vez
     (campo "upd"), por isso o consumo de leituras fica mínimo;
   - alterações feitas sem internet ficam guardadas e são enviadas depois.
   ===================================================================== */
(function(){
"use strict";

const API_ANTIGA = "https://vincent-criatorio.onrender.com";
const SDK = "https://www.gstatic.com/firebasejs/13.2.0/";

const TABELAS = {
    coelhos:       { pk:"id" },
    pesagens:      { pk:"id_pesagem",      ordem:["data","ASC"] },
    cruzamentos:   { pk:"id_cruzamento",   ordem:["dataCruzamento","DESC"] },
    ninhadas:      { pk:"id_ninhada",      ordem:["dataParto","DESC"] },
    financeiro:    { pk:"id_lancamento",   ordem:["data","DESC"] },
    vendas:        { pk:"id_venda",        ordem:["data","DESC"] },
    vermifugacoes: { pk:"id_vermifugacao", ordem:["data","DESC"] }
};
const COLS = Object.keys(TABELAS);
const CFG_KEY = "config/main";
const fetchOriginal = window.fetch.bind(window);

const S = {
    uid:null, email:"", auth:false, fb:null, idb:null,
    tab:{}, pend:{}, last:{}, cfg:{ formatos:{}, pks:{} },
    sinc:false, seq:0, flushing:false, unsubs:[],
    inicial:new Set(), mudouNaInicial:false, prontoJa:false
};
COLS.forEach(c => S.tab[c] = new Map());

let resolverPronto;
const pronto = new Promise(r => resolverPronto = r);
function liberar(){
    if(S.prontoJa) return;
    S.prontoJa = true;
    resolverPronto();
}

/* ---------------- utilidades ---------------- */
const lsGet = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,v); }catch(e){} };
const lsDel = k => { try{ localStorage.removeItem(k); }catch(e){} };
const hojeStr = () => {
    const d = new Date();
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};
const clonar = o => JSON.parse(JSON.stringify(o));
const pkDe = col => (S.cfg.pks && S.cfg.pks[col]) || TABELAS[col].pk;

let ultimoId = 0;
function novoId(){
    // número único (data/hora + aleatório) — evita colisão entre aparelhos
    let n = Number(String(Date.now()) + String(Math.floor(Math.random()*100)).padStart(2,"0"));
    if(n <= ultimoId) n = ultimoId + 1;
    ultimoId = n;
    return n;
}

function resposta(corpo, status){
    const texto = typeof corpo === "string";
    return new Response(texto ? corpo : JSON.stringify(corpo), {
        status: status || 200,
        headers:{ "Content-Type": texto ? "text/html; charset=utf-8" : "application/json" }
    });
}

/* ---------------- IndexedDB (cópia local) ---------------- */
function abrirIDB(uid){
    return new Promise((ok, erro) => {
        const r = indexedDB.open("vincent_" + uid, 1);
        r.onupgradeneeded = () => {
            r.result.createObjectStore("recs");
            r.result.createObjectStore("meta");
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => erro(r.error);
    });
}
function transacao(stores, modo, fn){
    return new Promise((ok, erro) => {
        const t = S.idb.transaction(stores, modo);
        let resultado;
        t.oncomplete = () => ok(resultado);
        t.onerror = t.onabort = () => erro(t.error);
        resultado = fn(t);
    });
}
function metaObj(){
    return { pend:S.pend, last:S.last, cfg:S.cfg, sinc:S.sinc };
}
async function abrirLocal(uid){
    S.uid = uid;
    S.idb = await abrirIDB(uid);
    const dados = {};
    await transacao(["recs","meta"], "readonly", t => {
        t.objectStore("recs").getAll().onsuccess = e => dados.recs = e.target.result;
        t.objectStore("meta").get("m").onsuccess = e => dados.meta = e.target.result;
    });
    COLS.forEach(c => S.tab[c] = new Map());
    (dados.recs || []).forEach(r => { if(S.tab[r.c]) S.tab[r.c].set(r.i, r.d); });
    const m = dados.meta || {};
    S.pend = m.pend || {};
    S.last = m.last || {};
    S.cfg  = Object.assign({ formatos:{}, pks:{} }, m.cfg || {});
    S.sinc = !!m.sinc;
    S.seq  = Object.values(S.pend).reduce((x,p) => Math.max(x, p.v || 0), 0);
}
function salvarMeta(){
    if(!S.idb) return Promise.resolve();
    return transacao(["meta"], "readwrite", t => t.objectStore("meta").put(metaObj(), "m"));
}

/* grava alterações locais (e marca para enviar ao Firestore) */
async function gravar(mudancas, mudouCfg){
    for(const [col, id, data] of mudancas){
        if(data == null) S.tab[col].delete(id);
        else S.tab[col].set(id, data);
        S.pend[col + "/" + id] = { v:++S.seq, del:data == null };
    }
    if(mudouCfg) S.pend[CFG_KEY] = { v:++S.seq };
    await transacao(["recs","meta"], "readwrite", t => {
        const recs = t.objectStore("recs");
        for(const [col, id, data] of mudancas){
            const k = col + "/" + id;
            if(data == null) recs.delete(k);
            else recs.put({ c:col, i:id, d:data }, k);
        }
        t.objectStore("meta").put(metaObj(), "m");
    });
    status();
    flush();
}

/* ---------------- envio ao Firestore ---------------- */
let tentarDeNovo = null;
function flush(){
    if(!S.auth || !S.fb || S.flushing) return;
    const chaves = Object.keys(S.pend);
    if(!chaves.length) return;

    const F = S.fb, parte = chaves.slice(0, 400), versoes = {};
    const lote = F.writeBatch(F.db);

    parte.forEach(k => {
        const i = k.indexOf("/"), col = k.slice(0, i), id = k.slice(i + 1);
        versoes[k] = S.pend[k].v;
        const ref = F.doc(F.db, "users", S.uid, col, id);
        if(k === CFG_KEY){
            lote.set(ref, Object.assign(clonar(S.cfg), { deleted:false, upd:F.serverTimestamp() }));
            return;
        }
        const data = S.tab[col] && S.tab[col].get(id);
        if(data == null) lote.set(ref, { deleted:true, upd:F.serverTimestamp() });
        else lote.set(ref, Object.assign(clonar(data), { deleted:false, upd:F.serverTimestamp() }));
    });

    S.flushing = true;
    status();
    lote.commit().then(async () => {
        parte.forEach(k => { if(S.pend[k] && S.pend[k].v === versoes[k]) delete S.pend[k]; });
        uso("w", parte.length);
        await salvarMeta();
        S.flushing = false;
        status();
        if(Object.keys(S.pend).length) flush();
    }).catch(e => {
        S.flushing = false;
        if(!navigator.onLine){ status(); return; }   // sem internet: envia quando voltar
        console.error("Erro ao sincronizar:", e);
        status(true);
        if(e && e.code === "permission-denied")
            aviso("Sem permissão para salvar no Firebase. Confira as regras do Firestore.");
        clearTimeout(tentarDeNovo);
        tentarDeNovo = setTimeout(flush, 20000);
    });
}

/* ---------------- recebimento do Firestore ---------------- */
function iniciarSync(){
    const F = S.fb;
    S.unsubs.forEach(u => u());
    S.unsubs = [];
    const todas = [...COLS, "config"];
    S.inicial = new Set(todas);

    todas.forEach(col => {
        const q = F.query(
            F.collection(F.db, "users", S.uid, col),
            F.where("upd", ">", F.Timestamp.fromMillis(S.last[col] || 0))
        );
        S.unsubs.push(F.onSnapshot(q, async snap => {
            let n = 0, mudou = false, max = S.last[col] || 0;
            const gravarIDB = [];

            snap.docChanges().forEach(ch => {
                if(ch.type === "removed" || ch.doc.metadata.hasPendingWrites) return;
                n++;
                const d = ch.doc.data(), id = ch.doc.id;
                const t = d.upd && d.upd.toMillis ? d.upd.toMillis() : 0;
                if(t > max) max = t;

                if(col === "config"){
                    if(S.pend[CFG_KEY]) return;
                    const c = Object.assign({}, d);
                    delete c.upd; delete c.deleted;
                    S.cfg = Object.assign({ formatos:{}, pks:{} }, c);
                    return;
                }
                if(S.pend[col + "/" + id]) return;   // alteração local ainda não enviada vence

                const atual = S.tab[col].get(id);
                if(d.deleted){
                    if(atual !== undefined){ S.tab[col].delete(id); mudou = true; gravarIDB.push([col, id, null]); }
                    return;
                }
                const rec = Object.assign({}, d);
                delete rec.upd; delete rec.deleted;
                if(atual === undefined || JSON.stringify(atual) !== JSON.stringify(rec)){
                    S.tab[col].set(id, rec);
                    mudou = true;
                    gravarIDB.push([col, id, rec]);
                }
            });

            if(!snap.metadata.fromCache) uso("r", Math.max(n, 1));
            S.last[col] = max;

            if(S.idb && (gravarIDB.length || n)){
                await transacao(["recs","meta"], "readwrite", t => {
                    const recs = t.objectStore("recs");
                    gravarIDB.forEach(([c, id, data]) => {
                        const k = c + "/" + id;
                        if(data == null) recs.delete(k);
                        else recs.put({ c, i:id, d:data }, k);
                    });
                    t.objectStore("meta").put(metaObj(), "m");
                }).catch(console.error);
            }

            if(mudou){
                if(S.inicial.size) S.mudouNaInicial = true;
                else if(S.prontoJa) avisoAtualizar();
            }

            if(S.inicial.has(col) && !snap.metadata.fromCache){
                S.inicial.delete(col);
                if(!S.inicial.size) sincronizacaoInicialOk();
            }
            status();
        }, erro => {
            console.error(erro);
            status(true);
            if(erro && erro.code === "permission-denied")
                aviso("Sem permissão para ler os dados. Confira as regras do Firestore.");
        }));
    });
}

function sincronizacaoInicialOk(){
    const primeiraVez = !S.sinc;
    S.sinc = true;
    salvarMeta();
    esconder("vc-carregando");
    if(!S.prontoJa){
        liberar();
        return;
    }
    // a página já tinha aberto com a cópia local; se veio coisa nova de outro aparelho, atualiza a tela
    if(S.mudouNaInicial && !primeiraVez) recarregarSePuder();
}

function recarregarSePuder(){
    const ocupado =
        document.body.classList.contains("modal-aberto") ||
        [...document.querySelectorAll(".modal")].some(m => m.style.display === "flex") ||
        (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    const ultimo = Number(sessionStorage.getItem("vc_recarregou") || 0);
    if(!ocupado && Date.now() - ultimo > 10000){
        sessionStorage.setItem("vc_recarregou", String(Date.now()));
        location.reload();
    }else{
        avisoAtualizar();
    }
}

/* ---------------- imitação das rotas do servidor antigo ---------------- */
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

// mesmo formato que o MySQL devolvia: true/false → 1/0; datas no formato aprendido na migração
function normalizar(col, obj){
    const o = {};
    Object.keys(obj || {}).forEach(k => {
        let v = obj[k];
        if(v === undefined) return;
        if(v === true) v = 1;
        else if(v === false) v = 0;
        else if(typeof v === "string" && RE_DATA.test(v)){
            const suf = S.cfg.formatos && S.cfg.formatos[col + "." + k];
            if(suf) v = v + suf;
        }
        o[k] = v;
    });
    return o;
}

function comparar(a, b){
    if(typeof a === "number" && typeof b === "number") return a - b;
    a = String(a); b = String(b);
    return a < b ? -1 : a > b ? 1 : 0;
}

function listar(col){
    const pk = pkDe(col);
    const linhas = [...S.tab[col].values()].map(r => Object.assign({}, r));
    // colunas ausentes voltam como null, como no MySQL
    const colunas = new Set();
    linhas.forEach(r => Object.keys(r).forEach(k => colunas.add(k)));
    linhas.forEach(r => colunas.forEach(k => { if(!(k in r)) r[k] = null; }));

    const porPk = (a, b) => comparar(a[pk], b[pk]);
    const ordem = TABELAS[col].ordem;
    if(!ordem) return linhas.sort(porPk);
    const [campo, dir] = ordem;
    return linhas.sort((a, b) => {
        const va = a[campo], vb = b[campo];
        if(va == null && vb == null) return porPk(a, b);
        if(va == null) return dir === "ASC" ? -1 : 1;
        if(vb == null) return dir === "ASC" ? 1 : -1;
        const c = comparar(va, vb);
        return c ? (dir === "ASC" ? c : -c) : porPk(a, b);
    });
}

const mesmaData = (a, b) => String(a || "").slice(0, 10) === String(b || "").slice(0, 10);

async function rota(url, opcoes){
    await pronto;
    opcoes = opcoes || {};
    const metodo = String(opcoes.method || "GET").toUpperCase();
    const partes = url.slice(API_ANTIGA.length).split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
    const col = partes[0], id = partes[1];

    if(!col) return resposta("Servidor Vincent Criatório Online");
    if(!TABELAS[col]) return resposta({ erro:"Rota não encontrada" }, 404);

    let corpo = {};
    if(opcoes.body){ try{ corpo = JSON.parse(opcoes.body); }catch(e){} }
    const pk = pkDe(col);

    // LISTAR
    if(metodo === "GET" && !id) return resposta(listar(col));

    // CADASTRAR
    if(metodo === "POST" && !id){
        const d = normalizar(col, corpo);
        if(d[pk] == null){
            if(col === "coelhos") return resposta({ code:"ER_NO_DEFAULT_FOR_FIELD", message:"Coelho sem código" }, 500);
            d[pk] = novoId();
        }
        const chave = String(d[pk]);
        if(S.tab[col].has(chave)) return resposta({ code:"ER_DUP_ENTRY", message:"Registro já existe: " + chave }, 500);

        const mudancas = [[col, chave, d]];

        if(col === "pesagens" && d.coelho_id != null){
            const c = S.tab.coelhos.get(String(d.coelho_id));
            if(c) mudancas.push(["coelhos", String(d.coelho_id), Object.assign({}, c, { peso:d.peso })]);
        }
        if(col === "vendas"){
            const idLanc = novoId();
            mudancas.push(["financeiro", String(idLanc), {
                [pkDe("financeiro")]: idLanc,
                data: d.data,
                tipo: "Entrada",
                categoria: "Venda",
                observacao: `Venda de Filhote para ${corpo.cliente}`,
                valor: d.valor,
                venda_ref: d[pk]
            }]);
        }
        await gravar(mudancas);
        return resposta({ sucesso:true });
    }

    // MARCAR NINHADA COMO VENDIDA
    if(metodo === "PUT" && col === "ninhadas" && id && partes[2] === "vendida"){
        const n = S.tab.ninhadas.get(String(id));
        if(n) await gravar([["ninhadas", String(id), Object.assign({}, n, { vendida:1 })]]);
        return resposta({ sucesso:true });
    }

    // EDITAR
    if(metodo === "PUT" && id){
        const atual = S.tab[col].get(String(id));
        if(atual){
            const novo = Object.assign({}, atual, normalizar(col, corpo));
            novo[pk] = atual[pk];
            await gravar([[col, String(id), novo]]);
        }
        return resposta({ sucesso:true });
    }

    // EXCLUIR
    if(metodo === "DELETE" && id){
        const atual = S.tab[col].get(String(id));
        if(col === "vendas"){
            if(!atual) return resposta({ erro:"Venda não encontrada" }, 404);
            const mudancas = [["vendas", String(id), null]];
            // remove o lançamento financeiro da venda (mesma regra do servidor antigo)
            S.tab.financeiro.forEach((f, fid) => {
                const ligado = f.venda_ref != null && String(f.venda_ref) === String(atual[pk]);
                const parecido = f.categoria === "Venda" && mesmaData(f.data, atual.data) &&
                    Number(f.valor) === Number(atual.valor) &&
                    String(f.observacao || "").includes(String(atual.cliente || ""));
                if(ligado || parecido) mudancas.push(["financeiro", fid, null]);
            });
            await gravar(mudancas);
            return resposta({ sucesso:true });
        }
        if(atual) await gravar([[col, String(id), null]]);
        return resposta({ sucesso:true });
    }

    return resposta({ erro:"Rota não encontrada" }, 404);
}

window.fetch = function(entrada, opcoes){
    const url = typeof entrada === "string" ? entrada : (entrada && entrada.url) || "";
    if(url.indexOf(API_ANTIGA) === 0) return rota(url, opcoes);
    return fetchOriginal(entrada, opcoes);
};

/* ---------------- migração, backup e substituição ---------------- */
function aprenderFormatos(tabelas){
    const formatos = {}, ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    Object.keys(tabelas).forEach(col => {
        const linhas = tabelas[col] || [], campos = new Set();
        linhas.forEach(r => Object.keys(r).forEach(k => campos.add(k)));
        campos.forEach(k => {
            const vals = linhas.map(r => r[k]).filter(v => v != null && v !== "");
            if(!vals.length || !vals.every(v => typeof v === "string" && ISO.test(v))) return;
            const sufixos = new Set(vals.map(v => v.slice(10)));
            if(sufixos.size === 1) formatos[col + "." + k] = [...sufixos][0];
        });
    });
    return formatos;
}
function detectarPks(tabelas){
    const pks = {};
    Object.keys(tabelas).forEach(col => {
        const r = (tabelas[col] || [])[0];
        if(!r) return;
        if(TABELAS[col].pk in r){ pks[col] = TABELAS[col].pk; return; }
        const k = Object.keys(r).find(k => k === "id" || /^id_/.test(k));
        if(k) pks[col] = k;
    });
    return pks;
}
async function substituirTudo(tabelas, cfgNova){
    S.cfg = Object.assign({ formatos:{}, pks:{} }, cfgNova || {});
    const mudancas = [];
    COLS.forEach(col => {
        const pk = pkDe(col), novos = new Map();
        (tabelas[col] || []).forEach(r => {
            let chave = r[pk];
            const rec = Object.assign({}, r);
            if(chave == null){ chave = novoId(); rec[pk] = chave; }
            novos.set(String(chave), rec);
        });
        S.tab[col].forEach((_, id) => { if(!novos.has(id)) mudancas.push([col, id, null]); });
        novos.forEach((rec, id) => mudancas.push([col, id, rec]));
    });
    await gravar(mudancas, true);
    return mudancas.length;
}

async function migrar(progresso){
    progresso = progresso || (() => {});
    const tabelas = {};
    for(const col of COLS){
        progresso(`Buscando ${col}… ` + (col === COLS[0] ? "(o servidor antigo pode levar até 1 minuto para acordar)" : ""));
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 120000);
        let r;
        try{ r = await fetchOriginal(`${API_ANTIGA}/${col}`, { signal:ctrl.signal }); }
        finally{ clearTimeout(timer); }
        if(!r.ok) throw new Error(`O servidor antigo respondeu com erro em /${col} (${r.status})`);
        const lista = await r.json();
        if(!Array.isArray(lista)) throw new Error(`Resposta inesperada em /${col}`);
        tabelas[col] = lista;
    }
    progresso("Salvando no Firebase…");
    const cfg = { formatos:aprenderFormatos(tabelas), pks:detectarPks(tabelas), migradoEm:new Date().toISOString() };
    await substituirTudo(tabelas, cfg);
    const resumo = {};
    COLS.forEach(c => resumo[c] = tabelas[c].length);
    return resumo;
}

function exportar(){
    const tabelas = {};
    COLS.forEach(c => tabelas[c] = listar(c));
    const arq = { sistema:"vincent-gestao", versao:1, exportadoEm:new Date().toISOString(), cfg:S.cfg, tabelas };
    const blob = new Blob([JSON.stringify(arq)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vincent-backup-${hojeStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    lsSet("vc_ultimo_backup", hojeStr());
}

async function importar(arquivo){
    const texto = await arquivo.text();
    const d = JSON.parse(texto);
    if(!d || d.sistema !== "vincent-gestao" || !d.tabelas) throw new Error("Este arquivo não é um backup do Vincent Criatório.");
    await substituirTudo(d.tabelas, d.cfg);
    const resumo = {};
    COLS.forEach(c => resumo[c] = (d.tabelas[c] || []).length);
    return resumo;
}

/* ---------------- contador de uso ---------------- */
function uso(tipo, n){
    try{
        const dia = hojeStr();
        let u = JSON.parse(localStorage.getItem("vc_uso") || "{}");
        if(u.dia !== dia) u = { dia, r:0, w:0 };
        u[tipo] += n;
        localStorage.setItem("vc_uso", JSON.stringify(u));
    }catch(e){}
}
function usoHoje(){
    try{
        const u = JSON.parse(localStorage.getItem("vc_uso") || "{}");
        return u.dia === hojeStr() ? u : { r:0, w:0 };
    }catch(e){ return { r:0, w:0 }; }
}

/* ---------------- interface: login, carregamento, status ---------------- */
const CSS = `
.vc-tela{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;
 background:linear-gradient(160deg,#eaf3f6,#cfe3ea);font-family:var(--fonte,Inter,system-ui,sans-serif);color:var(--texto,#0f2a36)}
.vc-tela.vc-oculto{display:none}
.vc-caixa{width:100%;max-width:380px;background:rgba(255,255,255,.78);backdrop-filter:blur(22px) saturate(180%);-webkit-backdrop-filter:blur(22px) saturate(180%);
 border:1px solid rgba(255,255,255,.85);border-radius:24px;box-shadow:0 20px 60px rgba(7,56,77,.15);padding:30px 26px;display:flex;flex-direction:column;gap:12px}
.vc-caixa img{width:56px;height:56px;align-self:center;border-radius:14px}
.vc-caixa h2{text-align:center;font-size:21px;margin:0;color:var(--azul-principal,#07384D)}
.vc-caixa .vc-sub{text-align:center;margin:-6px 0 6px;color:var(--texto-suave,#5a6f79);font-size:13px}
.vc-caixa label{font-size:12px;font-weight:600;color:var(--texto-suave,#5a6f79);display:flex;flex-direction:column;gap:5px}
.vc-caixa input{border:1px solid rgba(7,56,77,.15);background:#fff;border-radius:12px;padding:11px 13px;font:15px inherit;font-family:inherit;color:inherit;outline:none}
.vc-caixa input:focus{border-color:var(--azul-hover,#0F6588)}
.vc-caixa button{border:0;border-radius:12px;padding:12px;font:600 15px inherit;font-family:inherit;cursor:pointer}
.vc-btn{background:var(--gradiente-marca,linear-gradient(135deg,#0F6588,#07384D));color:#fff}
.vc-btn:disabled{opacity:.6;cursor:wait}
.vc-link{background:none!important;color:var(--azul-hover,#0F6588);padding:4px!important;font-weight:500!important;font-size:13px!important}
.vc-erro{color:#c82333;font-size:13px;text-align:center;min-height:18px}
.vc-spin{width:38px;height:38px;border-radius:50%;border:3px solid rgba(7,56,77,.12);border-top-color:var(--azul-hover,#0F6588);animation:vcgira .8s linear infinite}
@keyframes vcgira{to{transform:rotate(360deg)}}
.vc-carregando-box{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;max-width:340px;color:var(--texto-suave,#5a6f79)}
.vc-sync{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.9;padding:10px 14px;margin-top:8px;cursor:default}
.vc-sync i.vc-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0;display:inline-block}
.vc-sync.vc-pend i.vc-dot{background:#f59e0b}.vc-sync.vc-off i.vc-dot{background:#ef4444}
.vc-sync button{margin-left:auto;border:0;border-radius:8px;padding:4px 9px;font:600 11px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#07384D}
.vc-aviso{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99998;background:#0f2a36;color:#fff;padding:12px 16px;border-radius:14px;
 font:500 14px var(--fonte,Inter,sans-serif);box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;gap:12px;align-items:center;max-width:92vw}
.vc-aviso button{border:0;border-radius:9px;padding:6px 11px;font:600 13px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#07384D}
`;

function montarInterface(){
    const st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    const login = document.createElement("div");
    login.id = "vc-login";
    login.className = "vc-tela vc-oculto";
    login.innerHTML = `
      <form class="vc-caixa" novalidate>
        <img src="favicon.ico" alt="" onerror="this.remove()">
        <h2>Vincent Criatório</h2>
        <p class="vc-sub">Gestão de Cunicultura</p>
        <label>E-mail<input type="email" name="email" autocomplete="username" required></label>
        <label>Senha<input type="password" name="senha" autocomplete="current-password" required></label>
        <div class="vc-erro"></div>
        <button class="vc-btn" type="submit">Entrar</button>
        <button class="vc-link" type="button" data-esqueci>Esqueci a senha</button>
      </form>`;
    document.body.appendChild(login);

    const carregando = document.createElement("div");
    carregando.id = "vc-carregando";
    carregando.className = "vc-tela vc-oculto";
    carregando.innerHTML = `<div class="vc-carregando-box"><div class="vc-spin"></div><p>Carregando…</p></div>`;
    document.body.appendChild(carregando);

    const form = login.querySelector("form"), erro = login.querySelector(".vc-erro"), btn = login.querySelector(".vc-btn");
    const ERROS = {
        "auth/invalid-credential":"E-mail ou senha incorretos",
        "auth/wrong-password":"E-mail ou senha incorretos",
        "auth/user-not-found":"E-mail ou senha incorretos",
        "auth/invalid-email":"E-mail inválido",
        "auth/too-many-requests":"Muitas tentativas. Aguarde alguns minutos.",
        "auth/network-request-failed":"Sem conexão com a internet"
    };
    const msg = e => ERROS[e && e.code] || ("Não foi possível entrar" + (e && e.code ? ` (${e.code})` : ""));

    form.addEventListener("submit", ev => {
        ev.preventDefault();
        const email = form.email.value.trim(), senha = form.senha.value;
        if(!email || !senha){ erro.textContent = "Preencha e-mail e senha"; return; }
        if(!S.fb){ erro.textContent = "Ainda conectando… confira a internet"; return; }
        btn.disabled = true; btn.textContent = "Entrando…"; erro.textContent = "";
        S.fb.signInWithEmailAndPassword(S.fb.auth, email, senha)
            .catch(e => erro.textContent = msg(e))
            .finally(() => { btn.disabled = false; btn.textContent = "Entrar"; });
    });
    login.querySelector("[data-esqueci]").addEventListener("click", () => {
        const email = form.email.value.trim();
        if(!email){ erro.textContent = "Digite seu e-mail acima e clique de novo"; return; }
        if(!S.fb) return;
        S.fb.sendPasswordResetEmail(S.fb.auth, email)
            .then(() => { erro.textContent = ""; aviso("Se o e-mail estiver cadastrado, você vai receber um link para criar nova senha."); })
            .catch(e => erro.textContent = msg(e));
    });

    // indicador de sincronização no menu lateral
    const menu = document.querySelector(".sidebar");
    if(menu){
        const s = document.createElement("div");
        s.className = "vc-sync";
        s.innerHTML = `<i class="vc-dot"></i><span>Conectando…</span>`;
        menu.appendChild(s);
    }
}

function mostrar(id, texto){
    const el = document.getElementById(id);
    if(!el) return;
    if(texto){ const p = el.querySelector("p"); if(p) p.textContent = texto; }
    el.classList.remove("vc-oculto");
}
function esconder(id){
    const el = document.getElementById(id);
    if(el) el.classList.add("vc-oculto");
}

function status(erro){
    const n = Object.keys(S.pend).length, off = !navigator.onLine;
    let cls = "", txt = "Sincronizado";
    if(!S.auth){ cls = "vc-pend"; txt = S.prontoJa ? "Dados deste aparelho" : "Conectando…"; }
    else if(erro){ cls = "vc-off"; txt = "Erro ao sincronizar — tentando de novo"; }
    else if(off){ cls = "vc-off"; txt = n ? `Offline — ${n} alteração(ões) aguardando` : "Offline"; }
    else if(n || S.inicial.size){ cls = "vc-pend"; txt = "Sincronizando…"; }
    document.querySelectorAll(".vc-sync").forEach(el => {
        el.classList.remove("vc-pend","vc-off");
        if(cls) el.classList.add(cls);
        const sp = el.querySelector("span");
        if(sp) sp.textContent = txt;
        el.title = txt;
    });
    document.dispatchEvent(new CustomEvent("vc-status"));
}

let avisoTimer;
function aviso(texto){
    let el = document.getElementById("vc-aviso");
    if(!el){ el = document.createElement("div"); el.id = "vc-aviso"; el.className = "vc-aviso"; document.body.appendChild(el); }
    el.innerHTML = "";
    const sp = document.createElement("span"); sp.textContent = texto; el.appendChild(sp);
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => el.remove(), 6000);
}
function avisoAtualizar(){
    let el = document.getElementById("vc-aviso");
    if(!el){ el = document.createElement("div"); el.id = "vc-aviso"; el.className = "vc-aviso"; document.body.appendChild(el); }
    clearTimeout(avisoTimer);
    el.innerHTML = `<span>Há dados novos de outro aparelho.</span><button type="button">Atualizar</button>`;
    el.querySelector("button").onclick = () => location.reload();
}

/* ---------------- Firebase ---------------- */
async function carregarSDK(){
    const cfg = window.VINCENT_FIREBASE_CONFIG;
    if(!cfg || !cfg.apiKey || /COLE/.test(cfg.apiKey))
        throw new Error("Configuração do Firebase não preenchida em js/firebase-config.js");
    const [app, auth, fs] = await Promise.all([
        import(SDK + "firebase-app.js"),
        import(SDK + "firebase-auth.js"),
        import(SDK + "firebase-firestore.js")
    ]);
    const aplicativo = app.initializeApp(cfg);
    return {
        auth: auth.getAuth(aplicativo),
        db: fs.initializeFirestore(aplicativo, { localCache: fs.memoryLocalCache() }),
        onAuthStateChanged: auth.onAuthStateChanged,
        signInWithEmailAndPassword: auth.signInWithEmailAndPassword,
        signOut: auth.signOut,
        sendPasswordResetEmail: auth.sendPasswordResetEmail,
        collection: fs.collection, doc: fs.doc, query: fs.query, where: fs.where,
        onSnapshot: fs.onSnapshot, writeBatch: fs.writeBatch,
        serverTimestamp: fs.serverTimestamp, Timestamp: fs.Timestamp
    };
}

async function sair(){
    const n = Object.keys(S.pend).length;
    if(n && !confirm(`Ainda há ${n} alteração(ões) sem enviar. Se sair agora, elas se perdem. Sair mesmo assim?`)) return;
    if(!n && !confirm("Sair do sistema neste aparelho?")) return;
    S.unsubs.forEach(u => u());
    const uid = S.uid;
    try{ if(S.idb) S.idb.close(); }catch(e){}
    lsDel("vc_uid");
    if(uid){ try{ indexedDB.deleteDatabase("vincent_" + uid); }catch(e){} }
    try{ if(S.fb) await S.fb.signOut(S.fb.auth); }catch(e){}
    location.href = "index.html";
}

async function iniciar(){
    montarInterface();
    status();

    const ultimo = lsGet("vc_uid");
    if(ultimo){
        try{
            await abrirLocal(ultimo);
            if(S.sinc) liberar();   // abre na hora com a cópia deste aparelho
        }catch(e){ console.error(e); }
    }
    if(!S.prontoJa) mostrar("vc-carregando", "Conectando…");

    let F;
    try{ F = await carregarSDK(); }
    catch(e){
        console.error(e);
        status(true);
        if(!S.prontoJa) mostrar("vc-carregando", "Não foi possível conectar ao Firebase. Confira a internet e recarregue a página.");
        return;
    }
    S.fb = F;

    F.onAuthStateChanged(F.auth, async usuario => {
        if(!usuario){
            S.auth = false;
            S.unsubs.forEach(u => u()); S.unsubs = [];
            esconder("vc-carregando");
            mostrar("vc-login");
            status();
            return;
        }
        esconder("vc-login");
        S.email = usuario.email || "";

        if(S.uid && S.uid !== usuario.uid){       // outra conta neste aparelho
            lsSet("vc_uid", usuario.uid);
            location.reload();
            return;
        }
        if(!S.uid){
            lsSet("vc_uid", usuario.uid);
            await abrirLocal(usuario.uid);
        }
        if(!S.prontoJa){
            if(S.sinc) liberar();
            else mostrar("vc-carregando", "Carregando seus dados pela primeira vez neste aparelho…");
        }
        S.auth = true;
        iniciarSync();
        flush();
        status();
    });
}

window.addEventListener("online", () => { status(); flush(); });
window.addEventListener("offline", () => status());
setInterval(() => flush(), 60000);

window.Dados = {
    pronto,
    info: () => {
        const totais = {};
        COLS.forEach(c => totais[c] = S.tab[c].size);
        return {
            email:S.email, auth:S.auth, online:navigator.onLine,
            pendentes:Object.keys(S.pend).length, uso:usoHoje(), totais,
            migradoEm:S.cfg.migradoEm || null, ultimoBackup:lsGet("vc_ultimo_backup")
        };
    },
    sair, migrar, exportar, importar
};

if(document.body) iniciar();
else document.addEventListener("DOMContentLoaded", iniciar);

})();
