CREATE TABLE financeiro(
    id INT AUTO_INCREMENT PRIMARY KEY,

    data_lancamento DATE NOT NULL,

    tipo ENUM('Entrada','Saída') NOT NULL,

    categoria VARCHAR(100) NOT NULL,

    observacao VARCHAR(255),

    valor DECIMAL(10,2) NOT NULL,

    pago BOOLEAN DEFAULT TRUE
);

CREATE TABLE coelho(
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100),

    sexo ENUM(
        'Macho',
        'Fêmea'
    ),

    raca VARCHAR(100),

    pelagem VARCHAR(100),

    padrao VARCHAR(100),

    nascimento DATE,

    status VARCHAR(50)
);

CREATE TABLE cruzamento(

    id INT AUTO_INCREMENT PRIMARY KEY,

    id_mae INT,

    id_pai INT,

    data_cruzamento DATE,

    data_prevista_parto DATE
);

CREATE TABLE ninhada(

    id INT AUTO_INCREMENT PRIMARY KEY,

    id_cruzamento INT,

    data_parto DATE,

    nascidos INT,

    vivos INT,

    mortos INT
);