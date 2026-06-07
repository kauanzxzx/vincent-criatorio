const API = "http://192.168.15.7:3000";

let coelhos = [];
let pesagens = [];

let indiceEdicao = null;

async function carregarDados(){

    const respostaCoelhos =
    await fetch(`${API}/coelhos`);

    coelhos =
    await respostaCoelhos.json();

    const respostaPesagens =
    await fetch(`${API}/pesagens`);

    pesagens =
    await respostaPesagens.json();

    carregarCoelhos();

    atualizarTabela();

    atualizarCards();
}

function carregarCoelhos(){

    const select =
    document.getElementById("codigo");

    select.innerHTML =
    "<option value=''>Selecione o Coelho</option>";

    coelhos.forEach(c => {

        select.innerHTML += `
            <option value="${c.id}">
                ${c.id} - ${c.nome}
            </option>
        `;

    });

}

async function salvarPesagem(){

    const codigo =
    document.getElementById("codigo").value;

    const data =
    document.getElementById("data").value;

    const peso =
    parseFloat(
        document.getElementById("peso").value
    );

    if(
        !codigo ||
        !data ||
        !peso
    ){

        alert(
            "Preencha todos os campos."
        );

        return;
    }

    const coelho =
    coelhos.find(
        c => c.id === codigo
    );

    const dados = {

        coelho_id: codigo,

        nome:
        coelho.nome,

        data,

        peso

    };

    try{

        if(indiceEdicao !== null){

            await fetch(
                `${API}/pesagens/${pesagens[indiceEdicao].id_pesagem}`,
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
                `${API}/pesagens`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify(dados)
                }
            );

        }

        limparFormulario();

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao salvar pesagem."
        );

    }

}

function atualizarTabela(){

    const tabela =
    document.getElementById(
        "tabelaPesagens"
    );

    tabela.innerHTML = "";

    pesagens.forEach((p,index)=>{

        tabela.innerHTML += `

        <tr>

            <td data-label="Id">
                ${p.coelho_id}
            </td>

            <td data-label="Nome">
                ${p.nome}
            </td>

            <td data-label="Data">
                ${new Date(
                    p.data
                ).toLocaleDateString(
                    "pt-BR"
                )}
            </td>

            <td data-label="Peso">
                ${Number(p.peso).toFixed(3)} kg
            </td>

            <td data-label="Ações">

                <div class="acoes">

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
        "totalPesagens"
    ).textContent =
    pesagens.length;

    let media = 0;

    if(pesagens.length > 0){

        media =
        pesagens.reduce(
            (s,p)=>s+Number(p.peso),
            0
        ) / pesagens.length;

    }

    document.getElementById(
        "pesoMedio"
    ).textContent =
    media.toFixed(3) + " kg";

    if(pesagens.length > 0){

        const ultima =
        pesagens[
            pesagens.length - 1
        ];

        document.getElementById(
            "ultimaPesagem"
        ).textContent =
        new Date(
            ultima.data
        ).toLocaleDateString(
            "pt-BR"
        );

    }else{

        document.getElementById(
            "ultimaPesagem"
        ).textContent =
        "-";

    }

}

function formatarDataInput(data){

    if(!data)
        return "";

    return String(data).split("T")[0];
}

function editar(index){

    const p =
    pesagens[index];

    document.getElementById(
        "codigo"
    ).value =
    p.coelho_id;

    document.getElementById(
        "data"
    ).value =
    formatarDataInput(
        p.data
    );

    document.getElementById(
        "peso"
    ).value =
    p.peso;

    indiceEdicao =
    index;

}

async function excluir(index){

    if(
        !confirm(
            "Deseja excluir?"
        )
    ) return;

    try{

        await fetch(
            `${API}/pesagens/${pesagens[index].id_pesagem}`,
            {
                method:"DELETE"
            }
        );

        carregarDados();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao excluir pesagem."
        );

    }

}

function limparFormulario(){

    document.getElementById(
        "codigo"
    ).value = "";

    document.getElementById(
        "data"
    ).value = "";

    document.getElementById(
        "peso"
    ).value = "";

}

carregarDados();