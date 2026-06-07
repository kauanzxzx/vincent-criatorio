const API = "https://vincent-criatorio.onrender.com";

let financeiro = [];
let coelhos = [];
let cruzamentos = [];
let ninhadas = [];
let pesagens = [];
let vermifugacoes = [];

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

function jaPariu(valor){

    return (
        valor === true ||
        valor === 1 ||
        valor === "1"
    );

}

function estaDesmamada(valor){

    return (
        valor === true ||
        valor === 1 ||
        valor === "1"
    );

}

// =========================
// CARREGAR DADOS DA API
// =========================

async function carregarDashboard(){

    try{

        const [
            rFinanceiro,
            rCoelhos,
            rCruzamentos,
            rNinhadas,
            rPesagens,
            rVermifugacoes
        ] = await Promise.all([

            fetch(`${API}/financeiro`),
            fetch(`${API}/coelhos`),
            fetch(`${API}/cruzamentos`),
            fetch(`${API}/ninhadas`),
            fetch(`${API}/pesagens`),
            fetch(`${API}/vermifugacoes`)

        ]);

        financeiro =
        await rFinanceiro.json();

        coelhos =
        await rCoelhos.json();

        cruzamentos =
        await rCruzamentos.json();

        ninhadas =
        await rNinhadas.json();

        pesagens =
        await rPesagens.json();

        vermifugacoes =
        await rVermifugacoes.json();

        atualizarFinanceiroDashboard();
        atualizarCoelhosDashboard();
        atualizarPrenhasDashboard();
        atualizarNinhadasDashboard();
        atualizarAlertasDashboard();
        atualizarDashboardPremium();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao carregar dashboard."
        );

    }

}

// =========================
// FINANCEIRO
// =========================

function atualizarFinanceiroDashboard(){

    const entradas =
    financeiro
    .filter(l => l.tipo === "Entrada")
    .reduce(
        (total,item)=>total + Number(item.valor),
        0
    );

    const saidas =
    financeiro
    .filter(l => l.tipo === "Saida")
    .reduce(
        (total,item)=>total + Number(item.valor),
        0
    );

    const saldo =
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

// =========================
// COELHOS
// =========================

function atualizarCoelhosDashboard(){

    const total =
    coelhos.length;

    const machos =
    coelhos.filter(
        c => c.sexo === "Macho"
    ).length;

    const femeas =
    coelhos.filter(
        c => c.sexo === "Fêmea"
    ).length;

    document.getElementById("totalCoelhos")
    .textContent =
    total;

    document.getElementById("machos")
    .textContent =
    machos;

    document.getElementById("femeas")
    .textContent =
    femeas;

}

// =========================
// FILHOTES
// =========================

function atualizarNinhadasDashboard(){

    const totalFilhotes =
    ninhadas.reduce(
        (soma,ninhada)=>
        soma + Number(ninhada.vivos || 0),
        0
    );

    document.getElementById("filhotes")
    .textContent =
    totalFilhotes;

}

// =========================
// PRENHAS
// =========================

function atualizarPrenhasDashboard(){

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    const prenhas =
    cruzamentos.filter(c => {

        const parto =
        dataLocal(
            c.dataPrevista
        );

        if(!parto)
            return false;

        return (
            !jaPariu(c.pariu) &&
            parto >= hoje
        );

    }).length;

    document.getElementById("prenhas")
    .textContent =
    prenhas;

}

// =========================
// ALERTAS DO DASHBOARD
// =========================

function atualizarAlertasDashboard(){

    const lista =
    document.getElementById(
        "listaAlertas"
    );

    lista.innerHTML = "";

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    let quantidade = 0;

    // =====================
    // PARTOS
    // =====================

    cruzamentos.forEach(c => {

        if(jaPariu(c.pariu))
            return;

        const prevista =
        dataLocal(
            c.dataPrevista
        );

        if(!prevista)
            return;

        const diferenca =
        Math.floor(
            (prevista - hoje)
            /
            86400000
        );

        if(
            diferenca >= 0 &&
            diferenca <= 7
        ){

            quantidade++;

            lista.innerHTML += `

            <div class="alerta">

                <strong>
                    ${c.matrizNome}
                </strong>

                <br>

                Parto previsto em
                ${diferenca}
                dia(s).

            </div>

            `;
        }

        if(diferenca < 0){

            quantidade++;

            lista.innerHTML += `

            <div class="alerta alerta-atrasado">

                <strong>
                    ${c.matrizNome}
                </strong>

                <br>

                Parto atrasado há
                ${Math.abs(diferenca)}
                dia(s).

            </div>

            `;
        }

    });

    // =====================
    // DESMAMES
    // =====================

    ninhadas.forEach(n => {

        if(
            estaDesmamada(
                n.desmamada
            )
        )
            return;

        const parto =
        dataLocal(
            n.dataParto
        );

        if(!parto)
            return;

        const desmame =
        new Date(parto);

        desmame.setDate(
            desmame.getDate() + 30
        );

        desmame.setHours(
            0,0,0,0
        );

        const diferenca =
        Math.floor(
            (desmame - hoje)
            /
            86400000
        );

        if(
            diferenca >= 0 &&
            diferenca <= 5
        ){

            quantidade++;

            lista.innerHTML += `

            <div class="alerta">

                <strong>
                    Ninhada de
                    ${n.mae}
                </strong>

                <br>

                Desmame em
                ${diferenca}
                dia(s).

            </div>

            `;
        }

        if(diferenca < 0){

            quantidade++;

            lista.innerHTML += `

            <div class="alerta alerta-atrasado">

                <strong>
                    Ninhada de
                    ${n.mae}
                </strong>

                <br>

                Desmame atrasado há
                ${Math.abs(diferenca)}
                dia(s).

            </div>

            `;
        }

    });

    // =====================
    // VERMIFUGAÇÃO PENDENTE
    // =====================

    coelhos.forEach(c => {

        if(!c.nascimento)
            return;

        const nascimento =
        dataLocal(
            c.nascimento
        );

        if(!nascimento)
            return;

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

            quantidade++;

            lista.innerHTML += `

            <div class="alerta alerta-pendente">

                <strong>
                    Vermifugação Pendente
                </strong>

                <br>

                ${c.id} - ${c.nome}

                <br>

                Idade:
                ${dias} dias

            </div>

            `;
        }

    });

    // =====================
    // PESAGENS ATRASADAS
    // =====================

    coelhos.forEach(c => {

        const historico =
        pesagens.filter(
            p => p.coelho_id === c.id ||
                 p.id === c.id
        );

        if(historico.length === 0)
            return;

        historico.sort((a,b)=>

            new Date(b.data)
            -
            new Date(a.data)

        );

        const ultima =
        dataLocal(
            historico[0].data
        );

        if(!ultima)
            return;

        const dias =
        Math.floor(
            (hoje - ultima)
            /
            86400000
        );

        if(dias > 30){

            quantidade++;

            lista.innerHTML += `

            <div class="alerta alerta-atrasado">

                <strong>
                    ${c.nome}
                </strong>

                <br>

                Sem pesagem há
                ${dias}
                dias.

            </div>

            `;
        }

    });

    // =====================
    // SALDO NEGATIVO
    // =====================

    const entradas =
    financeiro
    .filter(f => f.tipo === "Entrada")
    .reduce(
        (s,f)=>s + Number(f.valor),
        0
    );

    const saidas =
    financeiro
    .filter(f => f.tipo === "Saida")
    .reduce(
        (s,f)=>s + Number(f.valor),
        0
    );

    const saldo =
    entradas - saidas;

    if(saldo < 0){

        quantidade++;

        lista.innerHTML += `

        <div class="alerta alerta-atrasado">

            <strong>
                Financeiro
            </strong>

            <br>

            Saldo negativo:
            ${Math.abs(saldo).toLocaleString(
                "pt-BR",
                {
                    style:"currency",
                    currency:"BRL"
                }
            )}

        </div>

        `;
    }

    // =====================
    // SEM ALERTAS
    // =====================

    if(quantidade === 0){

        lista.innerHTML = `

        <div class="alerta">

            <strong>
                ✅ Tudo certo
            </strong>

            <br>

            Nenhum alerta encontrado.

        </div>

        `;
    }

}

// =========================
// DASHBOARD PREMIUM
// =========================

function atualizarDashboardPremium(){

    const totalNascidos =
    ninhadas.reduce(
        (s,n)=>s + Number(n.nascidos || 0),
        0
    );

    const totalVivos =
    ninhadas.reduce(
        (s,n)=>s + Number(n.vivos || 0),
        0
    );

    const taxa =
    totalNascidos > 0
    ?
    ((totalVivos / totalNascidos) * 100)
    .toFixed(1)
    :
    0;

    const ativas =
    ninhadas.filter(n => {

        return !estaDesmamada(
            n.desmamada
        );

    }).length;

    document.getElementById("totalNascidos")
    .textContent =
    totalNascidos;

    document.getElementById("taxaSobrevivencia")
    .textContent =
    taxa + "%";

    document.getElementById("ninhadasAtivas")
    .textContent =
    ativas;

    const lista =
    document.getElementById(
        "ultimosNascimentos"
    );

    lista.innerHTML = "";

    const ultimas =
    [...ninhadas]
    .sort(
        (a,b)=>
        new Date(b.dataParto) -
        new Date(a.dataParto)
    )
    .slice(0,5);

    if(ultimas.length === 0){

        lista.innerHTML =
        "<p>Nenhuma ninhada registrada.</p>";

        return;
    }

    ultimas.forEach(n => {

        lista.innerHTML += `

        <div class="item-dashboard">

            <strong>
                ${n.mae}
            </strong>

            <span>
                ${new Date(n.dataParto)
                .toLocaleDateString("pt-BR")}
                —
                ${n.vivos} vivos
            </span>

        </div>

        `;

    });

}

// =========================
// INICIALIZAÇÃO
// =========================

carregarDashboard();