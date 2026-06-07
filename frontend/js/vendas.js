const API = "https://vincent-criatorio.onrender.com";

let coelhos = [];
let vendas = [];

async function carregarDados(){

    const respostaCoelhos =
    await fetch(`${API}/coelhos`);

    coelhos =
    await respostaCoelhos.json();

    const respostaVendas =
    await fetch(`${API}/vendas`);

    vendas =
    await respostaVendas.json();

    carregarCoelhos();

    atualizarTabela();

    atualizarCardsVendas();
}

function carregarCoelhos(){

    const select =
    document.getElementById("coelho");

    select.innerHTML =
    "<option value=''>Selecione o Coelho</option>";

    coelhos.forEach(c => {

        if(c.status !== "Vendido"){

            select.innerHTML += `

            <option value="${c.id}">
                ${c.id} - ${c.nome}
            </option>

            `;

        }

    });

}

async function salvarVenda(){

    const coelhoId =
    document.getElementById("coelho").value;

    const cliente =
    document.getElementById("cliente").value;

    const data =
    document.getElementById("dataVenda").value;

    const valor =
    Number(
        document.getElementById("valor").value
    );

    const observacao =
    document.getElementById("observacao").value;

    if(
        !coelhoId ||
        !cliente ||
        !data ||
        !valor
    ){

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    const coelho =
    coelhos.find(
        c => c.id === coelhoId
    );

    const dados = {

        data,

        cliente,

        coelhoId,

        coelhoNome:
        coelho.nome,

        valor,

        observacao

    };

    try{

        await fetch(
            `${API}/vendas`,
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

        await carregarDados();

        alert(
            "Venda registrada!"
        );

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao registrar venda."
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
        "tabelaVendas"
    );

    tabela.innerHTML = "";

    vendas.forEach((v,index)=>{

        tabela.innerHTML += `

        <tr>

            <td data-label="Data">
                ${formatarData(v.data)}
            </td>

            <td data-label="Coelho">
                ${v.coelhoId} - ${v.coelhoNome}
            </td>

            <td data-label="Cliente">
                ${v.cliente}
            </td>

            <td data-label="Valor">
                <span class="valor-venda">
                    ${Number(v.valor).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}
                </span>
            </td>

            <td data-label="Ações">

                <div class="acoes">

                    <button
                    class="excluir"
                    onclick="excluirVenda(${index})">

                        Cancelar

                    </button>

                </div>

            </td>

        </tr>

        `;

    });

}

function atualizarCardsVendas(){

    const total =
    vendas.reduce(
        (s,v)=>s+Number(v.valor),
        0
    );

    const quantidade =
    vendas.length;

    const ticket =
    quantidade > 0
    ?
    total / quantidade
    :
    0;

    document.getElementById(
        "totalVendido"
    ).textContent =
    total.toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );

    document.getElementById(
        "qtdVendida"
    ).textContent =
    quantidade;

    document.getElementById(
        "ticketMedio"
    ).textContent =
    ticket.toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );

}

async function excluirVenda(index){

    if(
        !confirm(
            "Cancelar venda?"
        )
    ){
        return;
    }

    try{

        await fetch(
            `${API}/vendas/${vendas[index].id_venda}`,
            {
                method:"DELETE"
            }
        );

        await carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao cancelar venda."
        );

    }

}

function limparFormulario(){

    document.getElementById("coelho").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("dataVenda").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("observacao").value = "";

}

carregarDados();