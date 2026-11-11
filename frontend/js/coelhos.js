const API = "https://vincent-criatorio.onrender.com";

let ordemIdade = 0;

let filhotePendente =
JSON.parse(
    localStorage.getItem("filhotePendente")
);

let coelhos = [];

let idEdicao = null;

function ordenarIdade(){

    ordemIdade++;

    if(ordemIdade > 2){
        ordemIdade = 1;
    }

    let listaOrdenada = [...coelhos];


    listaOrdenada.sort((a,b)=>{

        let idadeA = calcularIdadeMeses(a.nascimento);
        let idadeB = calcularIdadeMeses(b.nascimento);


        return ordemIdade === 1
        ? idadeA - idadeB
        : idadeB - idadeA;

    });


    atualizarTabela(listaOrdenada);


    let seta = document.getElementById("setaIdade");

    if(seta){
        seta.innerHTML = ordemIdade === 1 ? "↑" : "↓";
    }

}

function gerarCodigo(){

    let maior = 0;

    coelhos.forEach(c => {

        const numero =
        Number(
            String(c.id)
            .replace("VD","")
        );

        if(numero > maior){

            maior = numero;

        }

    });

    return "VD" +
    String(maior + 1)
    .padStart(3,"0");
}

async function carregarCoelhos(){

    const resposta =
    await fetch(`${API}/coelhos`);

    coelhos =
    await resposta.json();

    atualizarTabela();

    atualizarCards();

    if(filhotePendente && !filhoteAberto){

        filhoteAberto = true;

        abrirCadastroCoelho();

    }
}

// =========================
// POP-UP CADASTRO / EDIÇÃO
// =========================

let filhoteAberto = false;

function abrirCadastroCoelho(){

    limparFormulario();

    document.getElementById("titulo-modalCoelho").textContent =
    "Cadastrar Coelho";

    document.getElementById("btnSalvarCoelho").textContent =
    "Cadastrar";

    const aviso =
    document.getElementById("avisoFilhote");

    if(filhotePendente){

        aviso.textContent =
        `Filhote de ${filhotePendente.mae || "-"} × ${filhotePendente.pai || "-"}`;

        aviso.hidden = false;

    }else{

        aviso.hidden = true;

    }

    abrirModal("modalCoelho");
}

function mostrarPreviewFoto(src){

    const preview =
    document.getElementById("previewFoto");

    if(src){
        preview.src = src;
        preview.hidden = false;
    }else{
        preview.removeAttribute("src");
        preview.hidden = true;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const inputFoto =
    document.getElementById("foto");

    if(!inputFoto)
        return;

    inputFoto.addEventListener("change", () => {

        const arquivo =
        inputFoto.files[0];

        if(arquivo)
            mostrarPreviewFoto(URL.createObjectURL(arquivo));

    });

});

async function salvarCoelho(){

    const nome = document.getElementById("nome").value;
    const sexo = document.getElementById("sexo").value;
    const raca = document.getElementById("raca").value;
    const pelagem = document.getElementById("pelagem").value;
    const padrao = document.getElementById("padrao").value;
    const nascimento = document.getElementById("nascimento").value;
    const status = document.getElementById("status").value;
    const observacoes = document.getElementById("observacoes").value;

    if(!nome || !sexo || !nascimento){

        alert("Preencha os campos obrigatórios.");
        return;
    }

    const arquivo =
    document.getElementById("foto").files[0];

    const coelhoAtual =
    idEdicao !== null
    ? coelhos.find(c => c.id == idEdicao)
    : null;

    let foto = "";

if(arquivo){

    foto =
    await converterImagemBase64(arquivo);

}else if(coelhoAtual){

    foto =
    coelhoAtual.foto || "";

}

    const dados = {

        id:
        coelhoAtual
        ? coelhoAtual.id
        : gerarCodigo(),

        nome,
        sexo,
        raca,
        pelagem,
        padrao,
        nascimento,
        status,
        observacoes,
        foto,

        pai:
        coelhoAtual
        ? coelhoAtual.pai
        : filhotePendente
        ? filhotePendente.pai
        : "",

        mae:
        coelhoAtual
        ? coelhoAtual.mae
        : filhotePendente
        ? filhotePendente.mae
        : "",

        paiId:
        coelhoAtual
        ? coelhoAtual.paiId
        : filhotePendente
        ? filhotePendente.paiId
        : "",

        maeId:
        coelhoAtual
        ? coelhoAtual.maeId
        : filhotePendente
        ? filhotePendente.maeId
        : "",

        peso:
        coelhoAtual
        ? coelhoAtual.peso
        : null
    };

    definirCarregando("btnSalvarCoelho", true);

    try{

        if(coelhoAtual){

            await fetch(
                `${API}/coelhos/${dados.id}`,
                {
                    method:"PUT",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(dados)
                }
            );

        }else{

            await fetch(
                `${API}/coelhos`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(dados)
                }
            );

        }

        idEdicao = null;

        localStorage.removeItem("filhotePendente");

        filhotePendente = null;

        definirCarregando("btnSalvarCoelho", false);

        fecharModal("modalCoelho");

        limparFormulario();

        carregarCoelhos();

    }catch(erro){

        console.error(erro);

        definirCarregando("btnSalvarCoelho", false);

        alert("Erro ao salvar coelho.");
    }
}

function converterImagemBase64(arquivo){

    return new Promise((resolve)=>{

        if(!arquivo){

            resolve("");
            return;
        }

        const leitor =
        new FileReader();

        leitor.onload = evento => {

            const img =
            new Image();

            img.onload = () => {

                const canvas =
                document.createElement("canvas");

                const tamanhoMaximo =
                600;

                let largura =
                img.width;

                let altura =
                img.height;

                if(largura > altura){

                    if(largura > tamanhoMaximo){

                        altura *=
                        tamanhoMaximo / largura;

                        largura =
                        tamanhoMaximo;

                    }

                }else{

                    if(altura > tamanhoMaximo){

                        largura *=
                        tamanhoMaximo / altura;

                        altura =
                        tamanhoMaximo;

                    }

                }

                canvas.width =
                largura;

                canvas.height =
                altura;

                const ctx =
                canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    largura,
                    altura
                );

                const imagemReduzida =
                canvas.toDataURL(
                    "image/jpeg",
                    0.65
                );

                resolve(
                    imagemReduzida
                );

            };

            img.src =
            evento.target.result;

        };

        leitor.readAsDataURL(
            arquivo
        );

    });

}

function formatarDataInput(data){

    if(!data)
        return "";

    return String(data).split("T")[0];
}

function calcularIdade(dataNascimento){

    let hoje = new Date();

    let nasc = new Date(dataNascimento);

    let meses =
    (hoje.getFullYear() - nasc.getFullYear()) * 12 +
    (hoje.getMonth() - nasc.getMonth());

    let dias =
    hoje.getDate() - nasc.getDate();

    if(dias < 0){

        meses--;

        let ultimoMes =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            0
        );

        dias += ultimoMes.getDate();
    }

    return `${meses} meses e ${dias} dias`;
}

function atualizarTabela(lista = coelhos){

    let tabela =
    document.getElementById("tabelaCoelhos");

    tabela.innerHTML = "";

    lista.forEach((coelho)=>{


        let badgeSexo =
        coelho.sexo === "Macho"
        ?
        `<span class="badge-sexo badge-macho">♂ Macho</span>`
        :
        `<span class="badge-sexo badge-femea">♀ Fêmea</span>`;

        let badgeStatus = "";

        switch(coelho.status){

            case "Ativo":
                badgeStatus =
                `<span class="badge-status badge-ativo">Ativo</span>`;
                break;

            case "Vendido":
                badgeStatus =
                `<span class="badge-status badge-vendido">Vendido</span>`;
                break;

            case "Óbito":
            case "Morto":
                badgeStatus =
                `<span class="badge-status badge-morto">Óbito</span>`;
                break;

            default:
                badgeStatus =
                `<span class="badge-status">${coelho.status}</span>`;
        }

        let badgePeso =
        coelho.peso
        ?
        `<span class="badge-peso">${coelho.peso} kg</span>`
        :
        `<span class="badge-sem-peso">Sem peso</span>`;

        tabela.innerHTML += `

        <tr>

            <td data-label="Foto">

                <img
                src="${coelho.foto || 'favicon.ico'}"
                class="fotoTabela"
                onclick="abrirFoto('${coelho.foto || 'favicon.ico'}')">

            </td>

            <td data-label="Código">${coelho.id}</td>

            <td data-label="Nome">${coelho.nome}</td>

            <td data-label="Sexo">${badgeSexo}</td>

            <td data-label="Raça">${coelho.raca || "-"}</td>

            <td data-label="Pelagem">${coelho.pelagem || "-"}</td>

            <td data-label="Peso">${badgePeso}</td>

            <td data-label="Observações">${coelho.observacoes || "-"}</td>

            <td data-label="Idade">
                ${calcularIdade(coelho.nascimento)}
            </td>

            <td data-label="Status">${badgeStatus}</td>

            <td data-label="Ações">

                <div class="acoes">

                    <button
                    class="historico"
                    onclick="verHistorico('${coelho.id}')">
                        Histórico
                    </button>

                   <button
                    class="editar"
                    onclick="editar('${coelho.id}')">
                        Editar
                    </button>

                    <button
                    class="excluir"
                    onclick="excluir('${coelho.id}')">
                        Excluir
                    </button>

                </div>

            </td>

        </tr>

        `;
    });
}

function atualizarCards(){

    document.getElementById("totalCoelhos").textContent =
    coelhos.length;

    document.getElementById("totalMachos").textContent =
    coelhos.filter(c => c.sexo === "Macho").length;

    document.getElementById("totalFemeas").textContent =
    coelhos.filter(c => c.sexo === "Fêmea").length;

    document.getElementById("totalFilhotes").textContent =
    coelhos.filter(c => {

        let nasc =
        new Date(c.nascimento);

        let hoje =
        new Date();

        let meses =
        (hoje.getFullYear() - nasc.getFullYear()) * 12 +
        (hoje.getMonth() - nasc.getMonth());

        return meses < 6;

    }).length;
}

async function excluir(id){

    if(!confirm("Excluir registro?"))
        return;

    try{

        await fetch(
            `${API}/coelhos/${id}`,
            {
                method:"DELETE"
            }
        );

        carregarCoelhos();

    }catch(erro){

        console.error(erro);
        alert("Erro ao excluir coelho.");
    }
}

function editar(id){

    const coelho = coelhos.find(c => c.id == id);

    if(!coelho){
        alert("Coelho não encontrado.");
        return;
    }

    document.getElementById("nome").value =
    coelho.nome || "";

    document.getElementById("sexo").value =
    coelho.sexo || "";

    document.getElementById("raca").value =
    coelho.raca || "";

    document.getElementById("pelagem").value =
    coelho.pelagem || "";

    document.getElementById("padrao").value =
    coelho.padrao || "";

    document.getElementById("nascimento").value =
    formatarDataInput(coelho.nascimento);

    document.getElementById("status").value =
    coelho.status || "";

    document.getElementById("observacoes").value =
    coelho.observacoes || "";

    document.getElementById("foto").value = "";

    mostrarPreviewFoto(coelho.foto || "");

    idEdicao = id;

    document.getElementById("titulo-modalCoelho").textContent =
    `Editar ${coelho.id} - ${coelho.nome}`;

    document.getElementById("btnSalvarCoelho").textContent =
    "Salvar alterações";

    document.getElementById("avisoFilhote").hidden = true;

    abrirModal("modalCoelho");
}

function calcularIdadeMeses(dataNascimento){

    let nascimento = new Date(dataNascimento);
    let hoje = new Date();


    let meses =
    (hoje.getFullYear() - nascimento.getFullYear()) * 12 +
    (hoje.getMonth() - nascimento.getMonth());


    return meses;

}

function filtrar(){

    let busca =
    document
    .getElementById("busca")
    .value
    .toLowerCase();

    let sexo =
    document
    .getElementById("filtroSexo")
    .value;

    let resultado =
    coelhos.filter(c => {

        let nomeOk =
        c.nome
        .toLowerCase()
        .includes(busca);

        let sexoOk =
        sexo === "" ||
        c.sexo === sexo;

        return nomeOk && sexoOk;
    });

    atualizarTabela(resultado);
}

function limparFormulario(){

    document.getElementById("nome").value = "";
    document.getElementById("sexo").value = "";
    document.getElementById("raca").value = "";
    document.getElementById("pelagem").value = "";
    document.getElementById("padrao").value = "";
    document.getElementById("nascimento").value = "";
    document.getElementById("status").value = "Ativo";
    document.getElementById("observacoes").value = "";
    document.getElementById("foto").value = "";

    mostrarPreviewFoto("");

    idEdicao = null;
}

async function verHistorico(id){

    let pesagens = [];

    try{
        const resposta =
        await fetch(`${API}/pesagens`);
        pesagens =
        await resposta.json();
    }catch(erro){
        console.error(erro);
    }

    const coelho =
    coelhos.find(
        c => c.id === id
    );

    const historico =
    pesagens.filter(
        p => String(p.coelho_id) === String(id)
    );

    document.getElementById("tituloHistorico").innerHTML =
    `${coelho.id} - ${coelho.nome}`;

    let html = "";

    if(historico.length === 0){

        html =
        "<p>Nenhuma pesagem registrada.</p>";

    }else{

        historico.forEach(p => {

            html += `

            <div class="historico-item">

                ${String(p.data).split("T")[0].split("-").reverse().join("/")}

                → ${Number(p.peso).toFixed(3)} kg

            </div>

            `;
        });
    }

    document.getElementById("listaHistorico").innerHTML =
    html;

    document.getElementById("modalHistorico").style.display =
    "flex";
}

function fecharHistorico(){

    document.getElementById("modalHistorico").style.display =
    "none";
}

function abrirFoto(src){

    document.getElementById("fotoAmpliada").src =
    src;

    document.getElementById("modalFoto").style.display =
    "flex";
}

function fecharFoto(){

    document.getElementById("modalFoto").style.display =
    "none";
}

carregarCoelhos();