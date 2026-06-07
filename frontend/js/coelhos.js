const API = "https://vincent-criatorio.onrender.com";

const filhotePendente =
JSON.parse(
    localStorage.getItem("filhotePendente")
);

let coelhos = [];

let indiceEdicao = null;

function gerarCodigo(){

    let ultimoNumero =
    localStorage.getItem("ultimoCodigoCoelho") || 0;

    ultimoNumero++;

    localStorage.setItem(
        "ultimoCodigoCoelho",
        ultimoNumero
    );

    return "VD" +
    String(ultimoNumero).padStart(3,"0");
}

async function carregarCoelhos(){

    const resposta =
    await fetch(`${API}/coelhos`);

    coelhos =
    await resposta.json();

    atualizarTabela();

    atualizarCards();
}

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

    let foto = "";

    if(arquivo){

        foto =
        await converterImagemBase64(arquivo);

    }else if(indiceEdicao !== null){

        foto =
        coelhos[indiceEdicao].foto || "";

    }

    const dados = {

        id:
        indiceEdicao !== null
        ? coelhos[indiceEdicao].id
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
        indiceEdicao !== null
        ? coelhos[indiceEdicao].pai
        : filhotePendente
        ? filhotePendente.pai
        : "",

        mae:
        indiceEdicao !== null
        ? coelhos[indiceEdicao].mae
        : filhotePendente
        ? filhotePendente.mae
        : "",

        paiId:
        indiceEdicao !== null
        ? coelhos[indiceEdicao].paiId
        : filhotePendente
        ? filhotePendente.paiId
        : "",

        maeId:
        indiceEdicao !== null
        ? coelhos[indiceEdicao].maeId
        : filhotePendente
        ? filhotePendente.maeId
        : "",

        peso:
        indiceEdicao !== null
        ? coelhos[indiceEdicao].peso
        : null
    };

    try{

        if(indiceEdicao !== null){

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

        indiceEdicao = null;

        localStorage.removeItem("filhotePendente");

        limparFormulario();

        carregarCoelhos();

    }catch(erro){

        console.error(erro);
        alert("Erro ao salvar coelho.");
    }
}

function converterImagemBase64(arquivo){

    return new Promise((resolve)=>{

        if(!arquivo){

            resolve("");
            return;
        }

        const leitor = new FileReader();

        leitor.onload = e =>
        resolve(e.target.result);

        leitor.readAsDataURL(arquivo);
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

    lista.forEach((coelho,index)=>{

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
                src="${coelho.foto || 'img/sem-foto.png'}"
                class="fotoTabela"
                onclick="abrirFoto('${coelho.foto || 'img/sem-foto.png'}')">

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
                    onclick="editar(${index})">
                        Editar
                    </button>

                    <button
                    class="excluir"
                    onclick="excluir(${index})">
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

async function excluir(index){

    if(!confirm("Excluir registro?"))
        return;

    try{

        await fetch(
            `${API}/coelhos/${coelhos[index].id}`,
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

function editar(index){

    const coelho =
    coelhos[index];

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

    indiceEdicao = index;

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
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
    document.getElementById("observacoes").value = "";
    document.getElementById("foto").value = "";
}

function verHistorico(id){

    const pesagens =
    JSON.parse(
        localStorage.getItem("pesagens")
    ) || [];

    const coelho =
    coelhos.find(
        c => c.id === id
    );

    const historico =
    pesagens.filter(
        p => p.id === id
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

                ${new Date(p.data).toLocaleDateString("pt-BR")}

                → ${p.peso.toFixed(3)} kg

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