# Vincent Criatório - Sistema de Gestão para Cunicultura

## Documentação da Versão 1.0

### 1. Apresentação

O Vincent Criatório é um sistema web desenvolvido para auxiliar no gerenciamento de criatórios de coelhos, permitindo o controle dos animais, reprodução, ninhadas, pesagens, vendas, finanças e alertas operacionais.

O sistema foi desenvolvido utilizando tecnologias web simples, com armazenamento local dos dados no navegador através do LocalStorage, dispensando a necessidade de banco de dados ou servidor.

---

# 2. Objetivo

O objetivo do sistema é centralizar as principais informações do criatório em uma única plataforma, facilitando o acompanhamento produtivo, sanitário e financeiro dos animais.

---

# 3. Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* LocalStorage

---

# 4. Estrutura do Sistema

## Dashboard

Página inicial responsável por apresentar indicadores gerais do criatório.

### Funcionalidades

* Total de coelhos cadastrados
* Total de machos
* Total de fêmeas
* Total de filhotes
* Controle financeiro
* Total de matrizes prenhas
* Resumo produtivo
* Últimos nascimentos
* Alertas rápidos

---

## Cadastro de Coelhos

Responsável pelo cadastro e gerenciamento dos animais.

### Informações cadastradas

* Código automático
* Nome
* Sexo
* Raça
* Pelagem
* Padrão
* Data de nascimento
* Peso
* Status
* Observações
* Foto

### Funcionalidades

* Cadastro
* Edição
* Exclusão
* Filtro por nome
* Filtro por sexo
* Histórico de pesagens
* Visualização ampliada da foto

---

## Cruzamentos

Controle reprodutivo das matrizes.

### Funcionalidades

* Seleção de matriz
* Seleção de reprodutor
* Registro da data de cobertura
* Cálculo automático da data prevista de parto
* Controle de prenhez
* Marcação de parto realizado

### Status disponíveis

* Prenha
* Aguardando Parto
* Pariu

---

## Ninhadas

Controle dos nascimentos.

### Informações registradas

* Mãe
* Pai
* Data do parto
* Total nascidos
* Total vivos
* Total mortos

### Funcionalidades

* Registro do parto
* Controle de desmame
* Geração automática de filhotes
* Histórico de ninhadas

---

## Pesagens

Controle zootécnico de crescimento.

### Funcionalidades

* Registro de peso
* Histórico por animal
* Controle de evolução

### Informações registradas

* Data
* Peso
* Animal relacionado

---

## Agenda Sanitária

Controle sanitário dos filhotes.

### Funcionalidades

* Controle de vermifugação
* Identificação automática dos animais elegíveis
* Registro da vermifugação realizada

### Regra utilizada

A vermifugação é aplicada apenas uma vez, após o período de desmame.

---

## Controle Financeiro

Gerenciamento das movimentações financeiras.

### Tipos de movimentação

* Entrada
* Saída

### Funcionalidades

* Registro financeiro
* Controle de saldo
* Resumo financeiro
* Histórico de movimentações

---

## Controle de Vendas

Controle comercial dos animais.

### Informações registradas

* Animal vendido
* Comprador
* Data da venda
* Valor
* Observações

### Funcionalidades

* Registro da venda
* Histórico de vendas
* Cancelamento da venda
* Atualização automática do status do animal

---

## Alertas

Sistema de notificações operacionais.

### Alertas disponíveis

* Parto próximo
* Desmame pendente
* Vermifugação pendente
* Pesagem atrasada
* Animal sem pesagem
* Matriz sem cobertura
* Cobertura atrasada
* Saldo financeiro negativo
* Animal vendido
* Matriz pronta para nova cobertura

---

# 5. Armazenamento de Dados

Os dados são armazenados localmente utilizando LocalStorage.

### Estruturas principais

* coelhos
* cruzamentos
* ninhadas
* pesagens
* financeiro
* vendas
* vermifugacoes

---

# 6. Fluxo Operacional

### Reprodução

1. Cadastrar matriz e reprodutor
2. Registrar cruzamento
3. Aguardar gestação
4. Marcar parto
5. Registrar ninhada
6. Gerar filhotes
7. Realizar desmame
8. Registrar vermifugação

### Comercialização

1. Selecionar animal
2. Registrar venda
3. Atualizar status automaticamente
4. Registrar entrada financeira

---

# 7. Funcionalidades Implementadas na Versão 1.0

✔ Cadastro de coelhos

✔ Controle de cruzamentos

✔ Controle de gestação

✔ Controle de partos

✔ Controle de ninhadas

✔ Geração automática de filhotes

✔ Controle de desmame

✔ Controle de pesagens

✔ Histórico de crescimento

✔ Agenda sanitária

✔ Controle financeiro

✔ Controle de vendas

✔ Sistema de alertas

✔ Dashboard gerencial

✔ Upload de fotos

✔ Visualização ampliada das fotos

✔ Interface responsiva

---

# 8. Próximas Evoluções (Versão 1.1)

Planejadas para futuras atualizações:

* Exportação de backup em JSON
* Importação de backup
* Indicadores zootécnicos avançados
* Relatórios em PDF
* Gráficos de desempenho
* Controle de medicamentos
* Controle de estoque
* Controle de despesas por categoria
* Cadastro de clientes
* Sistema multiusuário
* Banco de dados online

---

# 9. Autor

Sistema desenvolvido por:

Kauan Oziel Claudino

Projeto: Vincent Criatório

Versão: 1.0
