const API = "https://vincent-criatorio.onrender.com";

const partoPendente =
JSON.parse(
    localStorage.getItem("partoPendente")
);

let cruzamentos = [];
let ninhadas = [];

let indiceEdicao = null;

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
        !mae ||
        !dataParto
    ){

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    const cruzamento =
    cruzamentos.find(
        c => c.matrizNome === mae
    );

    const dados = {

        maeId:
        partoPendente
        ? partoPendente.maeId
        : cruzamento?.maeId || null,

        mae,

        paiId:
        partoPendente
        ? partoPendente.paiId
        : cruzamento?.paiId || null,

        pai:
        partoPendente
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
            ninhadas[indiceEdicao].desmamada;

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

            localStorage.removeItem("partoPendente");

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

function formatarData(data){

    if(!data)
        return "-";

    return new Date(data)
    .toLocaleDateString("pt-BR");
}

function formatarDataInput(data){

    if(!data)
        return "";

    return String(data).split("T")[0];
}

function atualizarTabela(){

    let tabela =
    document.getElementById(
        "tabelaNinhadas"
    );

    tabela.innerHTML = "";

    ninhadas.forEach((n,index)=>{

        const parto =
        new Date(n.dataParto);

        const desmame =
        new Date(parto);

        desmame.setDate(
            desmame.getDate() + 30
        );

        const desmameFormatado =
        desmame.toLocaleDateString(
            "pt-BR"
        );

        const desmamada =
        n.desmamada === 1 ||
        n.desmamada === true;

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

            <td data-label="Data Desmame">
                ${desmameFormatado}
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

                </div>

            </td>

        </tr>

        `;
    });
}

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

function limparFormulario(){

    document.getElementById("dataParto").value = "";
    document.getElementById("nascidos").value = "";
    document.getElementById("vivos").value = "";
    document.getElementById("mortos").value = "";
}

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

carregarDados();