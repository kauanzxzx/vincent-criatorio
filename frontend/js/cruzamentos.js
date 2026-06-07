const API = "https://vincent-criatorio.onrender.com";

let coelhos = [];
let cruzamentos = [];

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

function calcularParto(data){

    let parto =
    new Date(data);

    parto.setDate(
        parto.getDate() + 31
    );

    return parto;
}

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

function calcularDiasGestacao(data){

    let inicio =
    new Date(data);

    let hoje =
    new Date();

    let dias =
    Math.floor(
        (hoje - inicio)
        /
        86400000
    );

    return dias;
}

function formatarData(data){

    if(!data)
        return "-";

    return new Date(data)
    .toLocaleDateString("pt-BR");
}

function atualizarTabela(){

    let tabela =
    document.getElementById(
        "tabelaCruzamentos"
    );

    tabela.innerHTML = "";

    cruzamentos.forEach((item,index)=>{

        let parto =
        new Date(item.dataPrevista);

        let status;

        if(item.pariu === 1 || item.pariu === true){

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
                ${calcularDiasGestacao(
                    item.dataCruzamento
                )} dias
            </td>

            <td data-label="Parto">
                ${formatarData(
                    item.dataPrevista
                )}
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
                        item.pariu === 1 ||
                        item.pariu === true
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

    cruzamentos.forEach(c => {

        let parto =
        new Date(c.dataPrevista);

        let dias =
        Math.floor(
            (parto - hoje)
            /
            86400000
        );

        const jaPariu =
        c.pariu === 1 ||
        c.pariu === true;

        if(
            dias >= 0 &&
            !jaPariu
        ){
            prenhas++;
        }

        if(
            dias >= 0 &&
            dias <= 7 &&
            !jaPariu
        ){
            semana++;
        }

        if(
            parto.getMonth() === hoje.getMonth() &&
            !jaPariu
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

carregarDados();