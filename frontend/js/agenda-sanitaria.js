const API = "http://192.168.15.7:3000";

let vermifugacoes = [];
let coelhos = [];

async function carregarAgenda(){

    try{

        const respostaCoelhos =
        await fetch(`${API}/coelhos`);

        coelhos =
        await respostaCoelhos.json();

        const respostaVermifugacoes =
        await fetch(`${API}/vermifugacoes`);

        vermifugacoes =
        await respostaVermifugacoes.json();

        montarTabela();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao carregar agenda sanitária."
        );

    }

}

function montarTabela(){

    const tabela =
    document.getElementById(
        "tabelaAgenda"
    );

    tabela.innerHTML = "";

    let pendentes = 0;

    coelhos.forEach(c => {

        if(!c.nascimento)
            return;

        const nascimento =
        new Date(c.nascimento);

        const hoje =
        new Date();

        const dias =
        Math.floor(
            (hoje - nascimento)
            /
            86400000
        );

        const vermifugado =
        vermifugacoes.some(
            v => v.idCoelho === c.id
        );

        if(
            dias >= 30 &&
            dias <= 90 &&
            !vermifugado
        ){

            pendentes++;

            tabela.innerHTML += `

            <tr>

                <td data-label="Código">
                    ${c.id}
                </td>

                <td data-label="Nome">
                    ${c.nome}
                </td>

                <td data-label="Dias">
                    ${dias} dias
                </td>

                <td data-label="Status">

                    <span class="status-pendente">
                        Pendente
                    </span>

                </td>

                <td data-label="Ações">

                    <div class="acoes">

                        <button
                        class="salvar"
                        onclick="registrarVermifugacao('${c.id}')">

                            Vermifugar

                        </button>

                    </div>

                </td>

            </tr>

            `;

        }

    });

    document.getElementById(
        "totalPendentes"
    ).textContent =
    pendentes;

}

async function registrarVermifugacao(id){

    const coelho =
    coelhos.find(
        c => c.id === id
    );

    if(!coelho)
        return;

    const dados = {

        idCoelho:id,

        nome:
        coelho.nome,

        data:
        new Date()
        .toISOString()
        .split("T")[0]

    };

    try{

        await fetch(
            `${API}/vermifugacoes`,
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

        carregarAgenda();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao registrar vermifugação."
        );

    }

}

carregarAgenda();