const API = "http://192.168.15.7:3000";

let financeiro = [];
let coelhos = [];
let cruzamentos = [];
let ninhadas = [];
let pesagens = [];
let vermifugacoes = [];

let alertas = [];

// ====================
// CARREGAR DADOS
// ====================

async function carregarAlertas(){

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

        financeiro = await rFinanceiro.json();
        coelhos = await rCoelhos.json();
        cruzamentos = await rCruzamentos.json();
        ninhadas = await rNinhadas.json();
        pesagens = await rPesagens.json();
        vermifugacoes = await rVermifugacoes.json();

        gerarAlertas();

    }catch(erro){

        console.error(erro);

        alert(
            "Erro ao carregar alertas."
        );

    }

}

// ====================
// GERAR ALERTAS
// ====================

function gerarAlertas(){

    alertas = [];

    const hoje =
    new Date();

    hoje.setHours(
        0,0,0,0
    );

    // ====================
    // DESMAME PENDENTE
    // ====================

    ninhadas.forEach(n => {

        const desmamada =
        n.desmamada === true ||
        n.desmamada === 1;

        if(desmamada)
            return;

        const parto =
        new Date(n.dataParto);

        const desmame =
        new Date(parto);

        desmame.setDate(
            desmame.getDate() + 30
        );

        desmame.setHours(
            0,0,0,0
        );

        if(hoje >= desmame){

            alertas.push({

                titulo:
                "Desmame Pendente",

                mensagem:
                `A ninhada de ${n.mae} já pode ser desmamada.`

            });

        }

    });

    // ====================
    // PARTO PRÓXIMO
    // ====================

    cruzamentos.forEach(c => {

        const jaPariu =
        c.pariu === true ||
        c.pariu === 1;

        if(jaPariu)
            return;

        const parto =
        new Date(c.dataPrevista);

        parto.setHours(
            0,0,0,0
        );

        const dias =
        Math.ceil(
            (parto - hoje)
            / 86400000
        );

        if(
            dias >= 0 &&
            dias <= 5
        ){

            alertas.push({

                titulo:
                "Parto Próximo",

                mensagem:
                `${c.matrizNome} deve parir em ${dias} dia(s).`

            });

        }

    });

    // ====================
    // PARTO ATRASADO
    // ====================

    cruzamentos.forEach(c => {

        const jaPariu =
        c.pariu === true ||
        c.pariu === 1;

        if(jaPariu)
            return;

        const parto =
        new Date(c.dataPrevista);

        parto.setHours(
            0,0,0,0
        );

        const dias =
        Math.floor(
            (hoje - parto)
            / 86400000
        );

        if(dias > 0){

            alertas.push({

                titulo:
                "Parto Atrasado",

                mensagem:
                `${c.matrizNome} está com parto atrasado há ${dias} dia(s).`

            });

        }

    });

    // ====================
    // VERMIFUGAÇÃO PENDENTE
    // ====================

    coelhos.forEach(c => {

        if(!c.nascimento)
            return;

        const nascimento =
        new Date(c.nascimento);

        nascimento.setHours(
            0,0,0,0
        );

        const dias =
        Math.floor(
            (hoje - nascimento)
            / 86400000
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

            alertas.push({

                titulo:
                "Vermifugação Pendente",

                mensagem:
                `${c.id} - ${c.nome} possui ${dias} dias e precisa ser vermifugado.`

            });

        }

    });

    // ====================
    // SEM PESAGEM
    // ====================

    coelhos.forEach(c => {

        const existe =
        pesagens.some(
            p =>
            p.coelho_id === c.id ||
            p.id === c.id
        );

        if(!existe){

            alertas.push({

                titulo:
                "Sem Pesagem",

                mensagem:
                `${c.id} - ${c.nome} ainda não possui pesagens.`

            });

        }

    });

    // ====================
    // PESAGEM ATRASADA
    // ====================

    coelhos.forEach(c => {

        const historico =
        pesagens.filter(
            p =>
            p.coelho_id === c.id ||
            p.id === c.id
        );

        if(historico.length === 0)
            return;

        historico.sort((a,b)=>

            new Date(b.data)
            -
            new Date(a.data)

        );

        const ultimaData =
        new Date(
            historico[0].data
        );

        ultimaData.setHours(
            0,0,0,0
        );

        const diasSemPesagem =
        Math.floor(
            (hoje - ultimaData)
            / 86400000
        );

        if(diasSemPesagem > 30){

            alertas.push({

                titulo:
                "Pesagem Atrasada",

                mensagem:
                `${c.id} - ${c.nome} está há ${diasSemPesagem} dias sem pesagem.`

            });

        }

    });

    // ====================
    // MATRIZ SEM COBERTURA
    // ====================

    coelhos.forEach(c => {

        if(c.sexo !== "Fêmea")
            return;

        if(c.status !== "Ativo")
            return;

        const cruzamentosMae =
        cruzamentos.filter(
            cr => cr.maeId === c.id
        );

        if(cruzamentosMae.length === 0){

            alertas.push({

                titulo:
                "Matriz Sem Cobertura",

                mensagem:
                `${c.nome} nunca foi cruzada.`

            });

        }

    });

    // ====================
    // COBERTURA ATRASADA
    // ====================

    coelhos.forEach(c => {

        if(c.sexo !== "Fêmea")
            return;

        if(c.status !== "Ativo")
            return;

        const cruzamentosMae =
        cruzamentos.filter(
            cr => cr.maeId === c.id
        );

        if(cruzamentosMae.length === 0)
            return;

        cruzamentosMae.sort((a,b)=>

            new Date(b.dataCruzamento)
            -
            new Date(a.dataCruzamento)

        );

        const ultimaCobertura =
        new Date(
            cruzamentosMae[0]
            .dataCruzamento
        );

        ultimaCobertura.setHours(
            0,0,0,0
        );

        const dias =
        Math.floor(
            (hoje - ultimaCobertura)
            / 86400000
        );

        if(dias > 120){

            alertas.push({

                titulo:
                "Cobertura Atrasada",

                mensagem:
                `${c.nome} está há ${dias} dias sem cruzamento.`

            });

        }

    });

    // ====================
    // PRONTA PARA COBERTURA
    // ====================

    coelhos.forEach(c => {

        if(c.sexo !== "Fêmea")
            return;

        if(c.status !== "Ativo")
            return;

        const partosDaMae =
        ninhadas.filter(
            n => n.maeId === c.id
        );

        if(partosDaMae.length === 0)
            return;

        partosDaMae.sort((a,b)=>

            new Date(b.dataParto)
            -
            new Date(a.dataParto)

        );

        const ultimoParto =
        new Date(
            partosDaMae[0].dataParto
        );

        ultimoParto.setHours(
            0,0,0,0
        );

        const diasSemParto =
        Math.floor(
            (hoje - ultimoParto)
            / 86400000
        );

        if(diasSemParto > 45){

            alertas.push({

                titulo:
                "Pronta para Cobertura",

                mensagem:
                `${c.nome} está há ${diasSemParto} dias sem parto.`

            });

        }

    });

    // ====================
    // ANIMAIS VENDIDOS
    // ====================

    coelhos.forEach(c => {

        if(c.status === "Vendido"){

            alertas.push({

                titulo:
                "Conferir Cadastro",

                mensagem:
                `${c.id} - ${c.nome} está marcado como vendido.`

            });

        }

    });

    // ====================
    // FINANCEIRO
    // ====================

    const entradas =
    financeiro
    .filter(f => f.tipo === "Entrada")
    .reduce(
        (s,f)=>s+Number(f.valor),
        0
    );

    const saidas =
    financeiro
    .filter(f => f.tipo === "Saida")
    .reduce(
        (s,f)=>s+Number(f.valor),
        0
    );

    const saldo =
    entradas - saidas;

    if(saldo < 0){

        alertas.push({

            titulo:
            "Saldo Negativo",

            mensagem:
            `O caixa está negativo em ${Math.abs(saldo).toLocaleString(
                "pt-BR",
                {
                    style:"currency",
                    currency:"BRL"
                }
            )}.`

        });

    }

    exibirAlertas();

}

// ====================
// EXIBIÇÃO
// ====================

function exibirAlertas(){

    const lista =
    document.getElementById(
        "listaAlertas"
    );

    lista.innerHTML = "";

    if(alertas.length === 0){

        lista.innerHTML = `

        <div class="alerta alerta-ok">

            <h3>✅ Tudo certo</h3>

            <p>
                Nenhum alerta encontrado.
            </p>

        </div>

        `;

    }else{

        alertas.forEach(a => {

            let classe =
            "alerta";

            if(
                a.titulo.includes("Atrasado") ||
                a.titulo.includes("Atrasada") ||
                a.titulo.includes("Negativo") ||
                a.titulo.includes("Pendente") ||
                a.titulo.includes("Sem Pesagem")
            ){

                classe +=
                " alerta-critico";

            }

            lista.innerHTML += `

            <div class="${classe}">

                <h3>${a.titulo}</h3>

                <p>${a.mensagem}</p>

            </div>

            `;

        });

    }

    document.getElementById(
        "totalAlertas"
    ).textContent =
    alertas.length;

}

carregarAlertas();