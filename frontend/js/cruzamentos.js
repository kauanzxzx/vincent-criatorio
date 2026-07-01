const API = "https://vincent-criatorio.onrender.com";

let coelhos = [];
let cruzamentos = [];

let indiceRecruza = null;

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

    const d =
    dataLocal(data);

    if(!d)
        return "-";

    return d.toLocaleDateString("pt-BR");

}

function jaPariu(valor){

    return (
        valor === true ||
        valor === 1 ||
        valor === "1"
    );

}

function dataInputHoje(){

    return new Date()
    .toISOString()
    .split("T")[0];

}

function calcularParto(data){

    let parto =
    dataLocal(data);

    parto.setDate(
        parto.getDate() + 31
    );

    return parto;

}

function calcularPrevisaoParto(data){

    const parto =
    calcularParto(data);

    return parto
    .toISOString()
    .split("T")[0];

}

function obterPrevisaoAtual(c){

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    const primeiraCruza =
    dataLocal(c.dataCruzamento);

    const limitePrimeira =
    new Date(primeiraCruza);

    limitePrimeira.setDate(
        limitePrimeira.getDate() + 33
    );

    const temRecruza =
    c.dataRecruza &&
    c.dataPrevistaRecruza;

    if(
        temRecruza &&
        hoje > limitePrimeira &&
        !jaPariu(c.pariu)
    ){

        return c.dataPrevistaRecruza;

    }

    return c.dataPrevista;

}

function usandoRecruza(c){

    return (
        obterPrevisaoAtual(c) ===
        c.dataPrevistaRecruza
    );

}

function calcularDiasGestacao(c){

    let inicio =
    c.dataCruzamento;

    if(
        c.dataRecruza &&
        usandoRecruza(c)
    ){

        inicio =
        c.dataRecruza;

    }

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    const dataInicio =
    dataLocal(inicio);

    return Math.floor(
        (hoje - dataInicio)
        /
        86400000
    );

}

// =========================
// CARREGAR DADOS
// =========================

async function carregarDados(){

    const respostaCoelhos =
    await fetch(`${API}/coelhos`);

    coelhos =
    await respostaCoelhos.json();

    const respostaCruzamentos =
    await fetch(`${API}/cruzamentos`);

    cruzamentos =
    await respostaCruzamentos.json();

    carregarSelects();

    atualizarTabela();

    atualizarCards();

}

// =========================
// SELECTS
// =========================

function carregarSelects(){

    const matriz =
    document.getElementById("matriz");

    const reprodutor =
    document.getElementById("reprodutor");

    matriz.innerHTML =
    "<option value=''>Selecione a Matriz</option>";

    reprodutor.innerHTML =
    "<option value=''>Selecione o Reprodutor</option>";

    coelhos.forEach(coelho => {

        if(
            coelho.sexo === "Fêmea" &&
            coelho.status === "Ativo"
        ){

            matriz.innerHTML += `
            <option value="${coelho.id}">
                ${coelho.id} - ${coelho.nome}
            </option>
            `;
        }

        if(
            coelho.sexo === "Macho" &&
            coelho.status === "Ativo"
        ){

            reprodutor.innerHTML += `
            <option value="${coelho.id}">
                ${coelho.id} - ${coelho.nome}
            </option>
            `;
        }

    });

}

// =========================
// SALVAR CRUZAMENTO
// =========================

async function salvarCruzamento(){

    const matriz =
    document.getElementById("matriz").value;

    const reprodutor =
    document.getElementById("reprodutor").value;

    const data =
    document.getElementById("dataCruzamento").value;

    if(
        !matriz ||
        !reprodutor ||
        !data
    ){

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    const matrizObj =
    coelhos.find(
        c => c.id === matriz
    );

    const reprodutorObj =
    coelhos.find(
        c => c.id === reprodutor
    );

    const parto =
    calcularParto(data);

    const dados = {

        matrizId:
        matrizObj.id,

        matrizNome:
        matrizObj.nome,

        reprodutorId:
        reprodutorObj.id,

        reprodutorNome:
        reprodutorObj.nome,

        maeId:
        matrizObj.id,

        paiId:
        reprodutorObj.id,

        dataCruzamento:
        data,

        dataPrevista:
        parto.toISOString()
        .split("T")[0],

        dataRecruza:
        null,

        dataPrevistaRecruza:
        null,

        pariu:
        false

    };

    try{

        await fetch(
            `${API}/cruzamentos`,
            {
                method:"POST",
                headers:{
                    "Content-Type":
                    "application/json"
                },
                body:
                JSON.stringify(dados)
            }
        );

        document.getElementById("matriz").value = "";
        document.getElementById("reprodutor").value = "";
        document.getElementById("dataCruzamento").value = "";

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao salvar cruzamento."
        );

    }

}

// =========================
// TABELA
// =========================

function montarPrevisaoParto(item){

    const temRecruza =
    item.dataRecruza &&
    item.dataPrevistaRecruza;

    if(!temRecruza){

        return `
        <div class="previsao-parto">

            <span class="previsao-item previsao-vigente">
                ${formatarData(item.dataPrevista)}
            </span>

        </div>
        `;

    }

    const recruzaVigente =
    usandoRecruza(item);

    return `
    <div class="previsao-parto">

        <span class="previsao-label">
            1ª cruza
        </span>

        <span class="previsao-item ${
            recruzaVigente
            ? "previsao-descartada"
            : "previsao-vigente"
        }">
            ${formatarData(item.dataPrevista)}
        </span>

        <span class="previsao-label">
            Recruza
        </span>

        <span class="previsao-item ${
            recruzaVigente
            ? "previsao-vigente"
            : ""
        }">
            ${formatarData(item.dataPrevistaRecruza)}
        </span>

        <small class="texto-recruza">
            Data:
            ${formatarData(item.dataRecruza)}
        </small>

    </div>
    `;

}

function atualizarTabela(){

    let tabela =
    document.getElementById(
        "tabelaCruzamentos"
    );

    tabela.innerHTML = "";

    cruzamentos.forEach((item,index)=>{

        let parto =
        dataLocal(
            obterPrevisaoAtual(item)
        );

        let status;

        if(jaPariu(item.pariu)){

            status =
            `<span class="status-ok">
                ✅ Pariu
            </span>`;

        }else if(parto > new Date()){

            status =
            `<span class="status-pendente">
                Prenha
            </span>`;

        }else{

            status =
            `<span class="status-pendente">
                Aguardando Parto
            </span>`;

        }

        tabela.innerHTML += `

        <tr>

            <td data-label="Mãe">
                <span class="badge-femea">
                    ${item.matrizId}
                    <br>
                    ${item.matrizNome}
                </span>
            </td>

            <td data-label="Pai">
                <span class="badge-macho">
                    ${item.reprodutorId}
                    <br>
                    ${item.reprodutorNome}
                </span>
            </td>

            <td data-label="Data Cruzamento">
                ${formatarData(
                    item.dataCruzamento
                )}
            </td>

            <td data-label="Dias">
                ${calcularDiasGestacao(item)} dias
            </td>

            <td data-label="Parto">
                ${montarPrevisaoParto(item)}
            </td>

            <td data-label="Status">
                ${status}
            </td>

            <td data-label="Ações">

                <div class="acoes">

                    <button
                    class="excluir"
                    onclick="excluir(${index})">

                        Excluir

                    </button>

                    ${
                        !jaPariu(item.pariu)
                        ?
                        `
                        <button
                        class="recruza ${
                            item.dataRecruza
                            ? "recruza-ativa"
                            : ""
                        }"
                        onclick="abrirModalRecruza(${index})">

                            ${
                                item.dataRecruza
                                ? "Recruza ✓"
                                : "Recruza"
                            }

                        </button>
                        `
                        :
                        ''
                    }

                    ${
                        jaPariu(item.pariu)
                        ?
                        `
                        <span class="status-ok">
                            ✅ Pariu
                        </span>
                        `
                        :
                        `
                        <button
                        class="parto"
                        onclick="marcarParto(${index})">

                            Pariu

                        </button>
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
        "totalCruzamentos"
    ).textContent =
    cruzamentos.length;

    let prenhas = 0;
    let semana = 0;
    let mes = 0;

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    cruzamentos.forEach(c => {

        let parto =
        dataLocal(
            obterPrevisaoAtual(c)
        );

        let dias =
        Math.floor(
            (parto - hoje)
            /
            86400000
        );

        if(
            dias >= 0 &&
            !jaPariu(c.pariu)
        ){
            prenhas++;
        }

        if(
            dias >= 0 &&
            dias <= 7 &&
            !jaPariu(c.pariu)
        ){
            semana++;
        }

        if(
            parto.getMonth() === hoje.getMonth() &&
            parto.getFullYear() === hoje.getFullYear() &&
            !jaPariu(c.pariu)
        ){
            mes++;
        }

    });

    document.getElementById(
        "totalPrenhas"
    ).textContent =
    prenhas;

    document.getElementById(
        "partosSemana"
    ).textContent =
    semana;

    document.getElementById(
        "partosMes"
    ).textContent =
    mes;

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
            `${API}/cruzamentos/${cruzamentos[index].id_cruzamento}`,
            {
                method:"DELETE"
            }
        );

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao excluir cruzamento."
        );

    }

}

// =========================
// MARCAR PARTO
// =========================

async function marcarParto(index){

    const cruzamento =
    cruzamentos[index];

    const atualizado = {
        ...cruzamento,
        pariu:true
    };

    try{

        await fetch(
            `${API}/cruzamentos/${cruzamento.id_cruzamento}`,
            {
                method:"PUT",
                headers:{
                    "Content-Type":
                    "application/json"
                },
                body:
                JSON.stringify(atualizado)
            }
        );

        localStorage.setItem(
            "partoPendente",
            JSON.stringify({

                maeId:
                cruzamento.maeId,

                mae:
                cruzamento.matrizNome,

                paiId:
                cruzamento.paiId,

                pai:
                cruzamento.reprodutorNome

            })
        );

        window.location.href =
        "ninhadas.html";

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao marcar parto."
        );

    }

}

// =========================
// MODAL RECRUZA
// =========================

function abrirModalRecruza(index){

    indiceRecruza =
    index;

    const cruzamento =
    cruzamentos[index];

    document.getElementById("infoRecruza")
    .textContent =
    `${cruzamento.matrizId} - ${cruzamento.matrizNome}`;

    document.getElementById("dataRecruzaModal")
    .value =
    cruzamento.dataRecruza
    ?
    String(cruzamento.dataRecruza)
    .split("T")[0]
    :
    dataInputHoje();

    document.getElementById("modalRecruza")
    .style.display =
    "flex";

}

function fecharModalRecruza(){

    indiceRecruza =
    null;

    document.getElementById("modalRecruza")
    .style.display =
    "none";

}

async function salvarRecruza(){

    if(indiceRecruza === null)
        return;

    const data =
    document.getElementById("dataRecruzaModal")
    .value;

    if(!data){

        alert(
            "Informe a data da recruza."
        );

        return;

    }

    const cruzamento =
    cruzamentos[indiceRecruza];

    const atualizado = {

        ...cruzamento,

        dataRecruza:
        data,

        dataPrevistaRecruza:
        calcularPrevisaoParto(data)

    };

    try{

        await fetch(
            `${API}/cruzamentos/${cruzamento.id_cruzamento}`,
            {
                method:"PUT",
                headers:{
                    "Content-Type":
                    "application/json"
                },
                body:
                JSON.stringify(atualizado)
            }
        );

        fecharModalRecruza();

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao salvar recruza."
        );

    }

}

// =========================
// INICIALIZAÇÃO
// =========================

carregarDados();