// ==========================================
// CONFIGURAÇÃO INICIAL DO DBSCAN (RODA UMA VEZ SÓ)
// ==========================================
const dbscan = new DBSCAN();
// Aumentamos o epsilon para compensar a escala dos milissegundos se os dados forem muito espalhados
const epsilon = 30; 
const minPoints = 10; 

console.log("Treinando modelo com a base de dados...");
dbscan.run(bancoDeDados, epsilon, minPoints);

// Criamos uma lista contendo APENAS os jogadores que são legítimos
const jogadoresLegitimos = [];
const indicesAnomalias = new Set(dbscan.noise);

bancoDeDados.forEach((jogador, index) => {
    if (!indicesAnomalias.has(index)) {
        jogadoresLegitimos.push(jogador);
    }
});

// ==========================================
// FUNÇÃO DE PREDIÇÃO CORRIGIDA
// ==========================================
function analisarNovoJogador(precisao, tempoReacao) {
    console.log("\n=========================================");
    console.log("       RESULTADO DA ANÁLISE MANUAL       ");
    console.log("=========================================");
    console.log(`Dados informados -> Precisão: ${precisao}% | Tempo de Reação: ${tempoReacao}ms`);
    
    // Tolerância personalizada para o input manual não sofrer com a distorção da distância
    // Se o jogador estiver a menos de X de precisão E Y de tempo de reação de QUALQUER jogador legítimo, ele é aceito.
    const toleranciaPrecisao = 15; // Aceita até 15% de diferença
    const toleranciaTempo = 50;    // Aceita até 50ms de diferença

    let ehLegitimo = false;

    for (let legitimo of jogadoresLegitimos) {
        const difPrecisao = Math.abs(legitimo[0] - precisao);
        const difTempo = Math.abs(legitimo[1] - tempoReacao);

        if (difPrecisao <= toleranciaPrecisao && difTempo <= toleranciaTempo) {
            ehLegitimo = true;
            break; // Já achou um grupo normal correspondente, pode parar
        }
    }
    
    if (!ehLegitimo) {
        console.log(`\n🚨 STATUS: SUSPEITO (CHEATER DETECTADO)`);
        console.log(`O comportamento deste jogador está muito isolado dos padrões normais.`);
    } else {
        console.log(`\n✅ STATUS: JOGADOR LEGÍTIMO`);
        console.log(`O comportamento se encaixa em um dos grupos normais de jogadores.`);
    }
    console.log("=========================================\n");

    solicitarDadosJogador();
}