const API = "https://vincent-criatorio.onrender.com";

const partoPendente =
JSON.parse(
    localStorage.getItem("partoPendente")
);

let cruzamentos = [];
let ninhadas = [];

let indiceEdicao = null;

// =========================
// FUNÇÕES AUXILIARES
// =========================

function dataLocal(data){

    if(!data)
        return null;

    return new Date(
        String(data).split("T")[0] + "T00:00:00"
    );

}

function formatarData(data){

    const dataFormatada =
    dataLocal(data);

    if(!dataFormatada)
        return "-";

    return dataFormatada
    .toLocaleDateString("pt-BR");

}

function formatarDataInput(data){

    if(!data)
        return "";

    return String(data)
    .split("T")[0];

}

function calcularIdadeFilhotes(dataParto){

    const parto =
    dataLocal(dataParto);

    if(!parto){

        return {
            dias:0,
            semanas:0,
            texto:"0 dias"
        };

    }

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    const dias =
    Math.max(
        0,
        Math.floor(
            (hoje - parto)
            / 86400000
        )
    );

    const semanas =
    Math.floor(
        dias / 7
    );

    return {
        dias,
        semanas,
        texto:
        `${dias} dias (${semanas} sem.)`
    };

}

function statusIdadeFilhotes(dias){

    if(dias < 30){

        return {
            classe:"idade-jovem",
            texto:"Em crescimento"
        };

    }

    if(dias <= 90){

        return {
            classe:"idade-desmame",
            texto:"Pós-desmame"
        };

    }

    return {
        classe:"idade-adulto",
        texto:"Independente"
    };

}

// =========================
// CARREGAR DADOS
// =========================

async function carregarDados(){

    const respostaCruzamentos =
    await fetch(`${API}/cruzamentos`);

    cruzamentos =
    await respostaCruzamentos.json();

    const respostaNinhadas =
    await fetch(`${API}/ninhadas`);

    ninhadas =
    await respostaNinhadas.json();

    carregarMaes();

    atualizarTabela();

    atualizarCards();

}

// =========================
// SELECT DE MÃES
// =========================

function carregarMaes(){

    const select =
    document.getElementById("mae");

    select.innerHTML =
    "<option value=''>Selecione a Mãe</option>";

    cruzamentos.forEach(c => {

        select.innerHTML += `
            <option value="${c.matrizNome}">
                ${c.matrizId} - ${c.matrizNome}
            </option>
        `;

    });

    if(partoPendente){

        select.value =
        partoPendente.mae;

    }

}

// =========================
// SALVAR NINHADA
// =========================

async function salvarNinhada(){

    const mae =
    document.getElementById("mae").value;

    const dataParto =
    document.getElementById("dataParto").value;

    const nascidos =
    parseInt(
        document.getElementById("nascidos").value
    );

    const vivos =
    parseInt(
        document.getElementById("vivos").value
    );

    const mortos =
    parseInt(
        document.getElementById("mortos").value
    );

    if(
    indiceEdicao === null &&
    !mae
){

    alert(
        "Selecione a mãe."
    );

    return;
}

    if(!dataParto){

        alert(
            "Informe a data do parto."
        );

        return;
    }

        const cruzamento =
        cruzamentos.find(
            c => c.matrizNome === mae
        );

        const ninhadaEditando =
        indiceEdicao !== null
        ?
        ninhadas[indiceEdicao]
        :
        null;

    const dados = {

        maeId:
        ninhadaEditando
        ? ninhadaEditando.maeId
        : partoPendente
        ? partoPendente.maeId
        : cruzamento?.maeId || null,

        mae:
        ninhadaEditando
        ? ninhadaEditando.mae
        : mae,

        paiId:
        ninhadaEditando
        ? ninhadaEditando.paiId
        : partoPendente
        ? partoPendente.paiId
        : cruzamento?.paiId || null,

        pai:
        ninhadaEditando
        ? ninhadaEditando.pai
        : partoPendente
        ? partoPendente.pai
        : cruzamento?.reprodutorNome || "",

        dataParto,

        nascidos:
        nascidos || 0,

        vivos:
        vivos || 0,

        mortos:
        mortos || 0,

        desmamada:
        false

    };

    try{

        if(indiceEdicao !== null){

            dados.desmamada =
            ninhadas[indiceEdicao]
            .desmamada;

            await fetch(
                `${API}/ninhadas/${ninhadas[indiceEdicao].id_ninhada}`,
                {
                    method:"PUT",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(dados)
                }
            );

            indiceEdicao = null;

        }else{

            await fetch(
                `${API}/ninhadas`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(dados)
                }
            );

            localStorage.removeItem(
                "partoPendente"
            );

        }

        limparFormulario();

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao salvar ninhada."
        );

    }

}

// =========================
// ATUALIZAR TABELA
// =========================

function atualizarTabela(){

    let tabela =
    document.getElementById(
        "tabelaNinhadas"
    );

    tabela.innerHTML = "";

    ninhadas.forEach((n,index)=>{

        const parto =
        dataLocal(
            n.dataParto
        );

        const desmame =
        new Date(parto);

        desmame.setDate(
            desmame.getDate() + 30
        );

        const desmameFormatado =
        desmame.toLocaleDateString(
            "pt-BR"
        );

        const idade =
        calcularIdadeFilhotes(
            n.dataParto
        );

        const statusIdade =
        statusIdadeFilhotes(
            idade.dias
        );

        const desmamada =
        n.desmamada === 1 ||
        n.desmamada === true ||
        n.desmamada === "1";

        tabela.innerHTML += `

        <tr>

            <td data-label="Mãe">
                <span class="badge-femea">
                    ${n.mae}
                </span>
            </td>

            <td data-label="Pai">
                <span class="badge-macho">
                    ${n.pai || "-"}
                </span>
            </td>

            <td data-label="Data Parto">
                ${formatarData(n.dataParto)}
            </td>

            <td data-label="Nascidos">
                ${n.nascidos}
            </td>

            <td data-label="Vivos">
                ${n.vivos}
            </td>

            <td data-label="Mortos">
                ${n.mortos}
            </td>

            <td data-label="Desmame / Idade">

                <div class="desmame-info">

                    <strong>
                        ${desmameFormatado}
                    </strong>

                    <span class="idade-filhotes ${statusIdade.classe}">
                        ${idade.texto}
                    </span>

                    <small>
                        ${statusIdade.texto}
                    </small>

                </div>

            </td>

            <td data-label="Status">

                ${
                    desmamada
                    ?
                    '<span class="status-ok">✓ Desmamada</span>'
                    :
                    '<span class="status-pendente">Ativa</span>'
                }

            </td>

            <td data-label="Ações">

    <div class="acoes">

        ${
            n.vendida
            ?
            `
            <span class="ninhada-vendida">
                ✓ Ninhada Vendida
            </span>
            `
            :
            `

            ${
                !desmamada
                ?
                `
                <button
                    class="editar"
                    onclick="desmamar(${index})">

                    Desmamar

                </button>
                `
                :
                ''
            }

            <button
                class="filhote"
                onclick="gerarFilhote(${index})">

                Gerar Filhote

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

            ${
                desmamada
                ?
                `
                <button
                    class="vendidos"
                    onclick="marcarNinhadaVendida(${n.id_ninhada})">

                    Vendidos

                </button>
                `
                :
                ''
            }

            `
        }

    </div>

</td>

        </tr>

        `;
    });
}

// =========================
// CARDS
// =========================

function atualizarCards(){

    document.getElementById(
        "totalNinhadas"
    ).textContent =
    ninhadas.length;

    document.getElementById(
        "totalNascidos"
    ).textContent =
    ninhadas.reduce(
        (s,n)=>s+Number(n.nascidos),
        0
    );

    document.getElementById(
        "totalVivos"
    ).textContent =
    ninhadas.reduce(
        (s,n)=>s+Number(n.vivos),
        0
    );

    document.getElementById(
        "totalMortos"
    ).textContent =
    ninhadas.reduce(
        (s,n)=>s+Number(n.mortos),
        0
    );
}

async function marcarNinhadaVendida(idNinhada){

    if(!confirm("Marcar esta ninhada como vendida?"))
        return;

    try{

        const resposta = await fetch(
            `${API}/ninhadas/${idNinhada}/vendida`,
            {
                method:"PUT"
            }
        );

        if(!resposta.ok){
            throw new Error("Erro ao marcar ninhada.");
        }

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert("Erro ao marcar ninhada como vendida.");

    }

}

// =========================
// EDITAR
// =========================

function editar(index){

    const ninhada =
    ninhadas[index];

    document.getElementById("mae")
    .value = ninhada.mae;

    document.getElementById("dataParto")
    .value =
    formatarDataInput(
        ninhada.dataParto
    );

    document.getElementById("nascidos")
    .value = ninhada.nascidos;

    document.getElementById("vivos")
    .value = ninhada.vivos;

    document.getElementById("mortos")
    .value = ninhada.mortos;

    indiceEdicao = index;

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}

// =========================
// EXCLUIR
// =========================

async function excluir(index){

    if(
        !confirm(
            "Deseja excluir?"
        )
    ) return;

    try{

        await fetch(
            `${API}/ninhadas/${ninhadas[index].id_ninhada}`,
            {
                method:"DELETE"
            }
        );

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao excluir ninhada."
        );

    }

}

// =========================
// LIMPAR FORMULÁRIO
// =========================

function limparFormulario(){

    document.getElementById("dataParto").value = "";
    document.getElementById("nascidos").value = "";
    document.getElementById("vivos").value = "";
    document.getElementById("mortos").value = "";

}

// =========================
// DESMAMAR
// =========================

async function desmamar(index){

    if(
        !confirm(
            "Confirmar desmame?"
        )
    ) return;

    const ninhada =
    ninhadas[index];

    const dados = {
        ...ninhada,
        desmamada:true
    };

    try{

        await fetch(
            `${API}/ninhadas/${ninhada.id_ninhada}`,
            {
                method:"PUT",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(dados)
            }
        );

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao confirmar desmame."
        );

    }

}

// =========================
// GERAR FILHOTE
// =========================

function gerarFilhote(index){

    const n =
    ninhadas[index];

    localStorage.setItem(
        "filhotePendente",
        JSON.stringify({

            paiId:n.paiId,
            pai:n.pai,

            maeId:n.maeId,
            mae:n.mae

        })
    );

    window.location.href =
    "coelhos.html";
}

// =========================
// INICIALIZAÇÃO
// =========================

carregarDados();