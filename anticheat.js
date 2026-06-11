
const { DBSCAN } = require('density-clustering');

// ==========================================
// 1. GERADOR DE BANCO DE DADOS (1000 JOGADORES)
// ==========================================
function gerarBancoDeDados() {
    const dados = [];

    // Função auxiliar para gerar números aleatórios em um intervalo
    const randomEntre = (min, max) => Math.random() * (max - min) + min;

    // A. Gerando Jogadores Casuais (750 jogadores)
    // Têm precisão entre 25% e 55% | Tempo de reação entre 220ms e 380ms
    for (let i = 0; i < 750; i++) {
        dados.push([
            Math.round(randomEntre(25, 55)), 
            Math.round(randomEntre(220, 380))
        ]);
    }

    // B. Gerando Jogadores Profissionais / Pro Players (235 jogadores)
    // Têm precisão entre 60% e 78% | Tempo de reação entre 150ms e 210ms
    for (let i = 0; i < 235; i++) {
        dados.push([
            Math.round(randomEntre(60, 78)), 
            Math.round(randomEntre(150, 210))
        ]);
    }

    // C. Gerando Cheaters Ocultos (15 jogadores)
    // Têm precisão sobre-humana (88% a 100%) | Tempo de reação impossível (5ms a 40ms)
    for (let i = 0; i < 15; i++) {
        dados.push([
            Math.round(randomEntre(88, 100)), 
            Math.round(randomEntre(5, 40))
        ]);
    }

    // Embaralhar os dados para simular um banco de dados real vindo do jogo
    return dados.sort(() => Math.random() - 0.5);
}

// Inicializa o banco de dados com os 1000 registros
const bancoDeDados = gerarBancoDeDados();
console.log(`✅ Banco de dados gerado com sucesso! Total de registros: ${bancoDeDados.length}\n`);


// ==========================================
// 2. CONFIGURAÇÃO E EXECUÇÃO DO DBSCAN
// ==========================================
const dbscan = new DBSCAN();

// epsilon (raio): distância máxima para considerar dois jogadores "vizinhos"
// minPoints: quantidade mínima de vizinhos para validar que é um comportamento humano comum
const epsilon = 30; 
const minPoints = 10; 

console.log("Analisando o comportamento dos jogadores...");
const clusters = dbscan.run(bancoDeDados, epsilon, minPoints);
const anomalias = dbscan.noise;


// ==========================================
// 3. EXIBIÇÃO DOS RESULTADOS DA ANÁLISE
// ==========================================
console.log("\n=========================================");
console.log("       RELATÓRIO DO ANTI-CHEAT          ");
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
    console.log(`  [ALERTA #${i+1}] ID do Jogador: ${indiceOriginal} | Precisão: ${dadosJogador[0]}% | Tempo de Reação: ${dadosJogador[1]}ms`);
});

if (anomalias.length > 5) {
    console.log(`  ... e mais ${anomalias.length - 5} jogadores com padrões suspeitos isolados.`);
}