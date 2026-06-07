const API = "https://vincent-criatorio.onrender.com";

let financeiro = [];

async function carregarFinanceiro(){

    try{

        const resposta =
        await fetch(`${API}/financeiro`);

        financeiro =
        await resposta.json();

        atualizarTabela();

        atualizarCards();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao carregar financeiro."
        );

    }

}

async function adicionarLancamento(){

    const data =
    document.getElementById("data").value;

    const tipo =
    document.getElementById("tipo").value;

    const categoria =
    document.getElementById("categoria").value;

    const observacao =
    document.getElementById("observacao").value;

    const valor =
    parseFloat(
        document.getElementById("valor").value
    );

    if(
        !data ||
        !tipo ||
        !valor
    ){

        alert(
            "Preencha os campos obrigatórios."
        );

        return;
    }

    const dados = {

        data,
        tipo,
        categoria,
        observacao,
        valor

    };

    try{

        await fetch(
            `${API}/financeiro`,
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

        limparFormulario();

        carregarFinanceiro();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao salvar lançamento."
        );

    }

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
        "tabelaLancamentos"
    );

    tabela.innerHTML = "";

    financeiro.forEach((item,index)=>{

        tabela.innerHTML += `

        <tr>

            <td data-label="Data">
                ${formatarData(item.data)}
            </td>

            <td data-label="Tipo">
                ${
                    item.tipo === "Entrada"
                    ?
                    '<span class="badge-entrada">Entrada</span>'
                    :
                    '<span class="badge-saida">Saída</span>'
                }
            </td>

            <td data-label="Categoria">
                ${item.categoria || "-"}
            </td>

            <td data-label="Observação">
                ${item.observacao || "-"}
            </td>

            <td data-label="Valor">
                <span class="${
                    item.tipo === "Entrada"
                    ? "valor-entrada"
                    : "valor-saida"
                }">
                    ${Number(item.valor).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}
                </span>
            </td>

            <td data-label="Ação">

                <div class="acoes">

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

    let entradas =
    financeiro
    .filter(l=>l.tipo==="Entrada")
    .reduce(
        (t,l)=>t+Number(l.valor),
        0
    );

    let saidas =
    financeiro
    .filter(l=>l.tipo==="Saida")
    .reduce(
        (t,l)=>t+Number(l.valor),
        0
    );

    let saldo =
    entradas - saidas;

    document.getElementById("entradas")
    .textContent =
    entradas.toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );

    document.getElementById("saidas")
    .textContent =
    saidas.toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );

    document.getElementById("saldo")
    .textContent =
    saldo.toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );
}

async function excluir(index){

    if(
        !confirm(
            "Deseja excluir?"
        )
    ) return;

    try{

        await fetch(
            `${API}/financeiro/${financeiro[index].id_lancamento}`,
            {
                method:"DELETE"
            }
        );

        carregarFinanceiro();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao excluir lançamento."
        );

    }

}

function limparFormulario(){

    document.getElementById("data").value = "";
    document.getElementById("tipo").value = "Entrada";
    document.getElementById("categoria").value = "";
    document.getElementById("observacao").value = "";
    document.getElementById("valor").value = "";

}

carregarFinanceiro();