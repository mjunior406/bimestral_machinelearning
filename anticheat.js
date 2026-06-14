const fs = require('fs');
const path = require('path');
const { DBSCAN } = require('density-clustering');
const readline = require('readline'); // Modificação: Importa o readline para input manual

// Interface de leitura do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ==========================================
// 1. CARREGADOR DE BANCO DE DADOS (CSV FIXO)
// ==========================================
function carregarBancoDeDados() {
    const caminhoArquivo = path.join(__dirname, 'dados_jogadores.csv');
    
    if (!fs.existsSync(caminhoArquivo)) {
        console.error(`❌ Erro: O arquivo 'dados_jogadores.csv' não foi encontrado na pasta.`);
        console.error(`Certifique-se de baixar o arquivo gerado e colocá-lo junto deste script.`);
        process.exit(1);
    }

    const conteudoCSV = fs.readFileSync(caminhoArquivo, 'utf-8');
    
    // Correção: Ajustado de 'line.trim()' para 'linha.trim()'
    const linhas = conteudoCSV.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
    const linhasDeDados = linhas.slice(1);

    const dados = [];

    for (let linha of linhasDeDados) {
        const colunas = linha.split(',');
        const precisao = parseInt(colunas[0], 10);
        const tempoReacao = parseInt(colunas[1], 10);
        
        if (!isNaN(precisao) && !isNaN(tempoReacao)) {
            dados.push([precisao, tempoReacao]);
        }
    }

    return dados;
}

// Inicializa o banco de dados carregando o CSV fixo
const bancoDeDados = carregarBancoDeDados();
console.log(`✅ Banco de dados carregado com sucesso! Total de registros fixos: ${bancoDeDados.length}\n`);

// Parâmetros do DBSCAN
const epsilon = 30; 
const minPoints = 10; 

// ==========================================
// 2. FUNÇÃO PARA ANALISAR NOVO JOGADOR
// ==========================================
function analisarNovoJogador(precisao, tempoReacao) {
    // Clona o banco de dados original para não corromper consultas futuras
    const dadosParaAnalise = [...bancoDeDados];
    
    // Adiciona o novo jogador no final da lista
    dadosParaAnalise.push([precisao, tempoReacao]);
    const indiceNovoJogador = dadosParaAnalise.length - 1;

    const dbscan = new DBSCAN();
    dbscan.run(dadosParaAnalise, epsilon, minPoints);
    const anomalias = dbscan.noise;

    console.log("\n=========================================");
    console.log("       RESULTADO DA ANÁLISE MANUAL       ");
    console.log("=========================================");
    console.log(`Dados informados -> Precisão: ${precisao}% | Tempo de Reação: ${tempoReacao}ms`);
    
    // Se o índice do novo jogador estiver na lista de ruídos/anomalias
    if (anomalias.includes(indiceNovoJogador)) {
        console.log(`\n🚨 STATUS: SUSPEITO (CHEATER DETECTADO)`);
        console.log(`O comportamento deste jogador está muito isolado dos padrões normais.`);
    } else {
        console.log(`\n✅ STATUS: JOGADOR LEGÍTIMO`);
        console.log(`O comportamento se encaixa em um dos grupos normais de jogadores.`);
    }
    console.log("=========================================\n");
    
    // Pergunta novamente após terminar
    solicitarDadosJogador();
}

// ==========================================
// 3. INTERFACE DE ENTRADA VIA TERMINAL
// ==========================================
function solicitarDadosJogador() {
    rl.question('Digite a precisão do jogador (0-100) ou "sair": ', (inputPrecisao) => {
        if (inputPrecisao.toLowerCase() === 'sair') {
            rl.close();
            return;
        }

        rl.question('Digite o tempo de reação do jogador em ms: ', (inputTempo) => {
            const precisao = parseInt(inputPrecisao, 10);
            const tempoReacao = parseInt(inputTempo, 10);

            if (isNaN(precisao) || isNaN(tempoReacao)) {
                console.log("❌ Por favor, insira valores numéricos válidos.\n");
                solicitarDadosJogador();
            } else {
                analisarNovoJogador(precisao, tempoReacao);
            }
        });
    });
}

// Inicia o loop de perguntas no terminal
solicitarDadosJogador();