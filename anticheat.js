const fs = require('fs');
const path = require('path');
const { DBSCAN } = require('density-clustering');

// ==========================================
// 1. CARREGADOR DE BANCO DE DADOS (CSV FIXO)
// ==========================================
function carregarBancoDeDados() {
    const caminhoArquivo = path.join(__dirname, 'dados_jogadores.csv');
    
    // Verifica se o arquivo CSV realmente existe na pasta
    if (!fs.existsSync(caminhoArquivo)) {
        console.error(`❌ Erro: O arquivo 'dados_jogadores.csv' não foi encontrado na pasta.`);
        console.error(`Certifique-se de baixar o arquivo gerado e colocá-lo junto deste script.`);
        process.exit(1);
    }

    // Lê o conteúdo do arquivo CSV como string
    const conteudoCSV = fs.readFileSync(caminhoArquivo, 'utf-8');
    
    // Divide por linhas e remove linhas em branco
    const linhas = conteudoCSV.split('\n').map(linha => line.trim()).filter(linha => linha.length > 0);
    
    // Remove o cabeçalho do CSV ('precisao,tempo_reacao')
    const linhasDeDados = linhas.slice(1);

    const dados = [];

    // Converte cada linha em um array de números [precisao, tempo_reacao]
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


// ==========================================
// 2. CONFIGURAÇÃO E EXECUÇÃO DO DBSCAN
// ==========================================
const dbscan = new DBSCAN();

// epsilon (raio): distância máxima para considerar dois jogadores "vizinhos"
// minPoints: quantidade mínima de vizinhos para validar que é um comportamento humano comum
const epsilon = 30; 
const minPoints = 10; 

console.log("Analisando o comportamento dos jogadores baseados no arquivo CSV...");
const clusters = dbscan.run(bancoDeDados, epsilon, minPoints);
const anomalias = dbscan.noise;


// ==========================================
// 3. EXIBIÇÃO DOS RESULTADOS DA ANÁLISE
// ==========================================
console.log("\n=========================================");
console.log("       RELATÓRIO DO ANTI-CHEAT (CSV)     ");
console.log("=========================================");
console.log(`Grupos de comportamento detectados: ${clusters.length}`);
console.log(`Total de jogadores legítimos inocentados: ${bancoDeDados.length - anomalias.length}`);
console.log(`🚨 Total de Anomalias/Cheaters detectados: ${anomalias.length}`);
console.log("=========================================\n");

// Mostrar os primeiros 5 cheaters detectados como exemplo de prova
console.log("Amostra de jogadores sinalizados para BANIMENTO:");
const amostraCheaters = anomalias.slice(0, 5);

amostraCheaters.forEach((indiceOriginal, i) => {
    const dadosJogador = bancoDeDados[indiceOriginal];
    console.log(`  [ALERTA #${i+1}] ID do Linha (CSV): ${indiceOriginal + 2} | Precisão: ${dadosJogador[0]}% | Tempo de Reação: ${dadosJogador[1]}ms`);
});

if (anomalias.length > 5) {
    console.log(`  ... e mais ${anomalias.length - 5} jogadores com padrões suspeitos isolados.`);
}