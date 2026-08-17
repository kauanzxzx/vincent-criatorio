const API = "https://vincent-criatorio.onrender.com";

let ninhadas = [];
let vendas = [];

async function carregarDados(){

    const respostaNinhadas =
    await fetch(`${API}/ninhadas`);

    ninhadas =
    await respostaNinhadas.json();

    const respostaVendas =
    await fetch(`${API}/vendas`);

    vendas =
    await respostaVendas.json();

    carregarNinhadas();

    atualizarTabela();

    atualizarCardsVendas();
}

function carregarNinhadas(){

    const select =
    document.getElementById("ninhada");

    select.innerHTML =
    "<option value=''>Selecione a Ninhada</option>";

    const hoje = new Date();

    ninhadas.forEach(n => {

        if(n.desmamada != 1)
            return;

        if(n.vivos <= 0)
            return;

        if(n.vendida == 1)
        return;

        select.innerHTML += `

        <option value="${n.id_ninhada}">

            Ninhada da ${n.mae}
            | Pai: ${n.pai}
            | ${n.vivos} filhote(s)

        </option>

        `;

    });

}

async function salvarVenda(){

    const ninhadaId =
    document.getElementById("ninhada").value;

    const cliente =
    document.getElementById("cliente").value;

    const data =
    document.getElementById("dataVenda").value;

    const valor =
    Number(
        document.getElementById("valor").value
    );

    const quantidade =
    Number(
    document.getElementById("quantidade").value
    );

    const observacao =
    document.getElementById("observacao").value;

    if(
        !ninhadaId ||
        !cliente ||
        !data ||
        !valor ||
        !quantidade
    ){

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    const ninhada =
    ninhadas.find(
        n => n.id_ninhada == ninhadaId
    );

    if(quantidade > ninhada.vivos){

    alert(
        `Esta ninhada possui apenas ${ninhada.vivos} filhote(s) disponível(is).`
    );

    return;

}

    const dados = {

    data,

    cliente,

    ninhadaId,

    ninhadaNome:
    `${ninhada.mae} × ${ninhada.pai}`,

    quantidade,

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

            <td data-label="Cliente">
                ${v.cliente}
            </td>

            <td data-label="Ninhada">
                ${v.ninhadaNome}
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

    document.getElementById("ninhada").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("dataVenda").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("observacao").value = "";
    document.getElementById("quantidade").value = 1;

}

carregarDados();