// =========================
// CONTA E DADOS
// =========================

const NOMES_TABELAS = {
    coelhos:"Coelhos",
    cruzamentos:"Cruzamentos",
    ninhadas:"Ninhadas",
    pesagens:"Pesagens",
    vermifugacoes:"Vermifugações",
    vendas:"Vendas",
    financeiro:"Lançamentos financeiros"
};

function formatarDataBR(iso){
    if(!iso) return "";
    return String(iso).slice(0,10).split("-").reverse().join("/");
}

function atualizarConta(){

    const i = Dados.info();

    document.getElementById("contaEmail").textContent =
    i.email || "—";

    document.getElementById("contaStatus").textContent =
    !i.auth ? "Conectando ao Firebase…" :
    !i.online ? `Sem internet. ${i.pendentes} alteração(ões) aguardando para enviar.` :
    i.pendentes ? `Enviando ${i.pendentes} alteração(ões)…` :
    "Tudo sincronizado ✓";

    document.getElementById("usoR").textContent = i.uso.r.toLocaleString("pt-BR");
    document.getElementById("usoW").textContent = i.uso.w.toLocaleString("pt-BR");
    document.getElementById("barraR").style.width = Math.min(100, Math.max(1, i.uso.r / 500)) + "%";
    document.getElementById("barraW").style.width = Math.min(100, Math.max(1, i.uso.w / 200)) + "%";

    document.getElementById("contaTotais").innerHTML =
    Object.keys(NOMES_TABELAS)
    .map(k => `<li><span>${NOMES_TABELAS[k]}</span><strong>${(i.totais[k] || 0).toLocaleString("pt-BR")}</strong></li>`)
    .join("");

    document.getElementById("contaMigrado").textContent =
    i.migradoEm ? `Importação do sistema antigo feita em ${formatarDataBR(i.migradoEm)}.` : "";

    document.getElementById("contaBackup").textContent =
    `Último backup neste aparelho: ${i.ultimoBackup ? formatarDataBR(i.ultimoBackup) : "nunca"}`;
}

function mensagem(id, texto, tipo){
    const el = document.getElementById(id);
    el.textContent = texto;
    el.className = "conta-msg " + (tipo || "");
}

function resumoTexto(resumo){
    return Object.keys(NOMES_TABELAS)
    .map(k => `${NOMES_TABELAS[k]}: ${resumo[k] || 0}`)
    .join("\n");
}

async function migrarAntigo(){

    const info = Dados.info();

    if(!info.auth){
        alert("Aguarde conectar ao Firebase.");
        return;
    }

    const temDados = Object.values(info.totais).some(n => n > 0);

    const texto = info.migradoEm
    ? "A importação já foi feita antes. Importar de novo vai SUBSTITUIR os dados atuais pelos do servidor antigo (o que foi cadastrado depois disso será perdido). Continuar?"
    : temDados
    ? "Os dados atuais deste sistema serão SUBSTITUÍDOS pelos do servidor antigo. Continuar?"
    : "Importar todos os dados do sistema antigo?";

    if(!confirm(texto)) return;

    definirCarregando("btnMigrar", true, "Importando...");

    try{
        const resumo = await Dados.migrar(t => mensagem("msgMigrar", t));
        mensagem("msgMigrar", "Importação concluída ✓\n" + resumoTexto(resumo), "ok");
    }catch(erro){
        console.error(erro);
        mensagem(
            "msgMigrar",
            "Não foi possível importar: " + (erro.name === "AbortError" ? "o servidor antigo não respondeu." : erro.message) +
            "\nTente de novo em alguns minutos.",
            "erro"
        );
    }finally{
        definirCarregando("btnMigrar", false);
        atualizarConta();
    }
}

function baixarBackup(){
    Dados.exportar();
    mensagem("msgBackup", "Backup baixado ✓", "ok");
    atualizarConta();
}

async function importarBackup(input){

    const arquivo = input.files[0];
    input.value = "";

    if(!arquivo) return;

    if(!confirm("Importar este backup? Ele vai SUBSTITUIR todos os dados atuais, em todos os aparelhos."))
        return;

    try{
        const resumo = await Dados.importar(arquivo);
        mensagem("msgBackup", "Backup importado ✓\n" + resumoTexto(resumo), "ok");
    }catch(erro){
        console.error(erro);
        mensagem("msgBackup", erro.message || "Arquivo inválido.", "erro");
    }

    atualizarConta();
}

Dados.pronto.then(atualizarConta);
document.addEventListener("vc-status", () => {
    if(document.getElementById("contaEmail")) atualizarConta();
});
