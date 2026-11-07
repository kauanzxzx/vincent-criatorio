// =========================
// MENU LATERAL
// =========================

function abrirMenu(forcar){

    const sidebar =
    document.querySelector(".sidebar");

    const botao =
    document.getElementById("btnMenu");

    if(!sidebar || !botao)
        return;

    const abrir =
    typeof forcar === "boolean"
    ? forcar
    : !sidebar.classList.contains("ativo");

    sidebar.classList.toggle("ativo", abrir);
    document.body.classList.toggle("menu-aberto", abrir);

    botao.innerHTML =
    abrir
    ? '<i class="bi bi-x-lg"></i>'
    : '<i class="bi bi-list"></i>';

    botao.classList.toggle("fechar", abrir);
    botao.setAttribute("aria-expanded", abrir);

    if(abrir){
        botao.classList.remove("oculto");
    }

}

// Marca o link da página atual e cria o fundo do menu mobile
document.addEventListener("DOMContentLoaded", () => {

    const paginaAtual =
    location.pathname.split("/").pop() || "index.html";

    document
    .querySelectorAll(".sidebar a")
    .forEach(link => {

        const destino =
        link.getAttribute("href");

        if(destino === paginaAtual){
            link.classList.add("ativo");
            link.setAttribute("aria-current", "page");
        }

    });

    const botao =
    document.getElementById("btnMenu");

    if(botao){
        botao.innerHTML = '<i class="bi bi-list"></i>';
        botao.setAttribute("aria-label", "Abrir menu");
        botao.setAttribute("aria-expanded", "false");
    }

    const overlay =
    document.createElement("div");

    overlay.className = "menu-overlay";
    overlay.addEventListener("click", () => abrirMenu(false));

    document.body.appendChild(overlay);

});

// Fecha com Esc
document.addEventListener("keydown", e => {

    if(e.key === "Escape")
        abrirMenu(false);

});

// Esconde o botão ao rolar para baixo
window.addEventListener("scroll", () => {

    const botao =
    document.getElementById("btnMenu");

    const sidebar =
    document.querySelector(".sidebar");

    if(!botao || !sidebar)
        return;

    if(sidebar.classList.contains("ativo"))
        return;

    botao.classList.toggle(
        "oculto",
        window.scrollY > 80
    );

}, { passive:true });

// =========================
// POP-UPS (MODAIS)
// =========================

let elementoAntesDoModal = null;

function abrirModal(id){

    const modal =
    document.getElementById(id);

    if(!modal)
        return;

    elementoAntesDoModal =
    document.activeElement;

    modal.style.display = "flex";
    document.body.classList.add("modal-aberto");

    // foca o primeiro campo editável
    const primeiro =
    modal.querySelector(
        ".formulario input:not([type=file]):not(:disabled), .formulario select:not(:disabled), .formulario textarea"
    );

    if(primeiro && window.matchMedia("(min-width: 769px)").matches){
        setTimeout(() => primeiro.focus(), 60);
    }

}

function fecharModal(id){

    const modal =
    document.getElementById(id);

    if(!modal)
        return;

    modal.style.display = "none";

    const algumAberto =
    [...document.querySelectorAll(".modal")]
    .some(m => m.style.display === "flex");

    if(!algumAberto)
        document.body.classList.remove("modal-aberto");

    if(elementoAntesDoModal && elementoAntesDoModal.focus)
        elementoAntesDoModal.focus();

}

function definirCarregando(botaoId, carregando, texto){

    const botao =
    document.getElementById(botaoId);

    if(!botao)
        return;

    if(carregando){
        botao.dataset.textoOriginal = botao.innerHTML;
        botao.innerHTML = texto || "Salvando...";
        botao.disabled = true;
    }else{
        botao.innerHTML = botao.dataset.textoOriginal || botao.innerHTML;
        botao.disabled = false;
    }

}

// Fecha ao clicar no fundo borrado
document.addEventListener("click", e => {

    if(
        e.target.classList &&
        e.target.classList.contains("modal")
    ){
        fecharModal(e.target.id);
    }

});

// Fecha o pop-up aberto com Esc
document.addEventListener("keydown", e => {

    if(e.key !== "Escape")
        return;

    document
    .querySelectorAll(".modal")
    .forEach(m => {
        if(m.style.display === "flex")
            fecharModal(m.id);
    });

});

// Data de hoje no fuso do usuário (AAAA-MM-DD), para campos de data
function hojeLocal(){

    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");

}
