function abrirMenu(){

    const sidebar =
    document.querySelector(".sidebar");

    const botao =
    document.getElementById("btnMenu");

    sidebar.classList.toggle("ativo");

    if(sidebar.classList.contains("ativo")){

        botao.innerHTML = "✕";
        botao.classList.add("fechar");

    }else{

        botao.innerHTML = "☰";
        botao.classList.remove("fechar");

    }
}

window.addEventListener("scroll", () => {

    const botao =
    document.getElementById("btnMenu");

    const sidebar =
    document.querySelector(".sidebar");

    if(!botao || !sidebar)
        return;

    if(sidebar.classList.contains("ativo"))
        return;

    if(window.scrollY > 80){

        botao.classList.add("oculto");

    }else{

        botao.classList.remove("oculto");

    }

});