const path = require("path");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const helmet = require("helmet");
const compression = require("compression");

const db = require("./db");

const app = express();

app.use(cors());

app.use(
    express.json({
        limit:"25mb"
    })
);

app.use(
    express.urlencoded({
        limit:"25mb",
        extended:true
    })
);

app.get("/", (req,res)=>{

    res.send(
        "Servidor Vincent Criatório Online"
    );

});

// ========================
// LISTAR COELHOS
// ========================

app.get("/coelhos",(req,res)=>{

    db.query(

        "SELECT * FROM coelhos",

        (erro,resultados)=>{

            if(erro){

                return res
                .status(500)
                .json(erro);

            }

            res.json(resultados);

        }

    );

});

// ========================
// CADASTRAR COELHO
// ========================

app.post("/coelhos",(req,res)=>{

    const dados = req.body;

    db.query(

        `INSERT INTO coelhos
        SET ?`,

        dados,

        (erro)=>{

            if(erro){

                return res
                .status(500)
                .json(erro);

            }

            res.json({
                sucesso:true
            });

        }

    );

});

// ========================
// EXCLUIR COELHO
// ========================

app.delete(
"/coelhos/:id",

(req,res)=>{

    db.query(

        "DELETE FROM coelhos WHERE id=?",

        [req.params.id],

        (erro)=>{

            if(erro){

                return res
                .status(500)
                .json(erro);

            }

            res.json({
                sucesso:true
            });

        }

    );

});

// ========================
// EDITAR COELHO
// ========================

app.put(
"/coelhos/:id",

(req,res)=>{

    db.query(

        `UPDATE coelhos
        SET ?
        WHERE id=?`,

        [
            req.body,
            req.params.id
        ],

        (erro)=>{

            if(erro){

                return res
                .status(500)
                .json(erro);

            }

            res.json({
                sucesso:true
            });

        }

    );

});

// ========================
// LISTAR PESAGENS
// ========================

app.get("/pesagens", (req,res)=>{

    db.query(
        "SELECT * FROM pesagens ORDER BY data ASC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR PESAGEM
// ========================

app.post("/pesagens", (req,res)=>{

    const dados = req.body;

    db.query(
        "INSERT INTO pesagens SET ?",
        dados,
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            db.query(
                "UPDATE coelhos SET peso=? WHERE id=?",
                [
                    dados.peso,
                    dados.coelho_id
                ]
            );

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// EDITAR PESAGEM
// ========================

app.put("/pesagens/:id", (req,res)=>{

    db.query(
        "UPDATE pesagens SET ? WHERE id_pesagem=?",
        [
            req.body,
            req.params.id
        ],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// EXCLUIR PESAGEM
// ========================

app.delete("/pesagens/:id", (req,res)=>{

    db.query(
        "DELETE FROM pesagens WHERE id_pesagem=?",
        [req.params.id],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// LISTAR CRUZAMENTOS
// ========================

app.get("/cruzamentos", (req,res)=>{

    db.query(
        "SELECT * FROM cruzamentos ORDER BY dataCruzamento DESC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR CRUZAMENTO
// ========================

app.post("/cruzamentos", (req,res)=>{

    db.query(
        "INSERT INTO cruzamentos SET ?",
        req.body,
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// EDITAR CRUZAMENTO
// ========================

app.put("/cruzamentos/:id", (req,res)=>{

    db.query(
        "UPDATE cruzamentos SET ? WHERE id_cruzamento=?",
        [
            req.body,
            req.params.id
        ],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// EXCLUIR CRUZAMENTO
// ========================

app.delete("/cruzamentos/:id", (req,res)=>{

    db.query(
        "DELETE FROM cruzamentos WHERE id_cruzamento=?",
        [req.params.id],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({
                sucesso:true
            });

        }
    );

});

// ========================
// LISTAR NINHADAS
// ========================

app.get("/ninhadas", (req,res)=>{

    db.query(
        "SELECT * FROM ninhadas ORDER BY dataParto DESC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR NINHADA
// ========================

app.post("/ninhadas", (req,res)=>{

    db.query(
        "INSERT INTO ninhadas SET ?",
        req.body,
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

// ========================
// EDITAR NINHADA
// ========================

app.put("/ninhadas/:id", (req,res)=>{

    db.query(
        "UPDATE ninhadas SET ? WHERE id_ninhada=?",
        [
            req.body,
            req.params.id
        ],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

// ========================
// EXCLUIR NINHADA
// ========================

app.delete("/ninhadas/:id", (req,res)=>{

    db.query(
        "DELETE FROM ninhadas WHERE id_ninhada=?",
        [req.params.id],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

// ========================
// LISTAR FINANCEIRO
// ========================

app.get("/financeiro", (req,res)=>{

    db.query(
        "SELECT * FROM financeiro ORDER BY data DESC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR LANÇAMENTO
// ========================

app.post("/financeiro", (req,res)=>{

    db.query(
        "INSERT INTO financeiro SET ?",
        req.body,
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

// ========================
// EXCLUIR LANÇAMENTO
// ========================

app.delete("/financeiro/:id", (req,res)=>{

    db.query(
        "DELETE FROM financeiro WHERE id_lancamento=?",
        [req.params.id],
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

// ========================
// LISTAR VENDAS
// ========================

app.get("/vendas", (req,res)=>{

    db.query(
        "SELECT * FROM vendas ORDER BY data DESC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR VENDA
// ========================

app.post("/vendas", (req,res)=>{

    console.log("NOVA ROTA POST /vendas");

    const venda = req.body;

    db.query(

        "INSERT INTO vendas SET ?",

        venda,

        (erro)=>{

            if(erro){

                return res
                .status(500)
                .json(erro);

            }

            db.query(

                "INSERT INTO financeiro SET ?",

                {

                    data: venda.data,

                    tipo: "Entrada",

                    categoria: "Venda",

                    observacao:
                    `Venda de Filhote para ${venda.cliente}`,

                    valor: venda.valor

                }

            );

            db.query(

                "UPDATE ninhadas SET vivos = vivos - ? WHERE id_ninhada = ?",

                [

                    venda.quantidade,

                    venda.ninhadaId

                ]

            );

            res.json({

                sucesso: true

            });

        }

    );

});


// ========================
// CANCELAR VENDA
// ========================

app.delete("/vendas/:id", (req,res)=>{

    const idVenda = req.params.id;

    db.query(

        "SELECT * FROM vendas WHERE id_venda=?",

        [idVenda],

        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            const venda = resultados[0];

            if(!venda){
                return res.status(404).json({
                    erro:"Venda não encontrada"
                });
            }

            db.query(

                "DELETE FROM vendas WHERE id_venda=?",

                [idVenda],

                (erro)=>{

                    if(erro){
                        return res.status(500).json(erro);
                    }

                    // Devolve os filhotes para a ninhada
                    db.query(

                        "UPDATE ninhadas SET vivos = vivos + ? WHERE id_ninhada = ?",

                        [
                            venda.quantidade,
                            venda.ninhadaId
                        ]

                    );

                    // Remove o lançamento financeiro
                    db.query(

                        `DELETE FROM financeiro
                         WHERE categoria='Venda'
                         AND data=?
                         AND valor=?
                         AND observacao LIKE ?`,

                        [
                            venda.data,
                            venda.valor,
                            `%${venda.cliente}%`
                        ]

                    );

                    res.json({
                        sucesso:true
                    });

                }

            );

        }

    );

});


// ========================
// LISTAR VERMIFUGAÇÕES
// ========================

app.get("/vermifugacoes", (req,res)=>{

    db.query(
        "SELECT * FROM vermifugacoes ORDER BY data DESC",
        (erro,resultados)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json(resultados);
        }
    );

});

// ========================
// CADASTRAR VERMIFUGAÇÃO
// ========================

app.post("/vermifugacoes", (req,res)=>{

    db.query(
        "INSERT INTO vermifugacoes SET ?",
        req.body,
        (erro)=>{

            if(erro){
                return res.status(500).json(erro);
            }

            res.json({ sucesso:true });
        }
    );

});

const PORT =
process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Servidor rodando na porta ${PORT}`
    );

});