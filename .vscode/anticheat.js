/**
 * PROJETO DE MACHINE LEARNING: DETECÇÃO DE TRAPAÇAS (ANTI-CHEAT) COM DBSCAN
 * Disciplina: Algoritmos de Aprendizado de Máquina
 * Linguagem: JavaScript Puro (ES6+)
 */

class AntiCheatDBSCAN {
    constructor(eps, minPoints) {
        this.eps = eps;           // Raio máximo de vizinhança (Epsilon)
        this.minPoints = minPoints; // Quantidade mínima de pontos para formar densidade
    }

    // 1. CÁLCULO MATEMÁTICO: DISTÂNCIA EUCLIDIANA
    // p1, p2 = { x: tempo_reacao_ms, y: precisao_hs_porcentagem }
    euclidianDistance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    // 2. RETORNA TODOS OS VIZINHOS DENTRO DO RAIO EPSILON
    regionQuery(dataset, targetIdx) {
        const neighbors = [];
        for (let j = 0; j < dataset.length; j++) {
            if (this.euclidianDistance(dataset[targetIdx], dataset[j]) <= this.eps) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    // 3. EXPANSÃO DO CLUSTER PARA PONTOS DE BORDA (BORDER POINTS)
    expandCluster(dataset, labels, pointIdx, neighbors, clusterId) {
        labels[pointIdx] = clusterId;

        for (let i = 0; i < neighbors.length; i++) {
            let neighborIdx = neighbors[i];

            // Se o ponto foi marcado anteriormente como ruído, ele é capturado pela borda do cluster atual
            if (labels[neighborIdx] === -1) {
                labels[neighborIdx] = clusterId;
            }

            if (labels[neighborIdx] !== 0) continue; // Já processado por outro núcleo

            labels[neighborIdx] = clusterId;

            // Explora a vizinhança do vizinho para verificar se ele também é um núcleo (Core Point)
            let nextNeighbors = this.regionQuery(dataset, neighborIdx);
            if (nextNeighbors.length >= this.minPoints) {
                for (let j = 0; j < nextNeighbors.length; j++) {
                    if (!neighbors.includes(nextNeighbors[j])) {
                        neighbors.push(nextNeighbors[j]); // Adiciona à fila de varredura espacial
                    }
                }
            }
        }
    }

    // 4. CORE ENGINE DO ALGORITMO: EXECUTA A APRENDIZAGEM NÃO SUPERVISIONADA
    fit(dataset) {
        const n = dataset.length;
        // Estrutura de Estados: 0 = Não Visitado, -1 = Ruído/Anomalia, >0 = ID do Cluster
        const labels = new Array(n).fill(0); 
        let clusterId = 0;

        for (let i = 0; i < n; i++) {
            if (labels[i] !== 0) continue;

            let neighbors = this.regionQuery(dataset, i);

            if (neighbors.length < this.minPoints) {
                labels[i] = -1; // Classificado temporariamente como Ruído (Ponto isolado)
            } else {
                clusterId++;
                this.expandCluster(dataset, labels, i, neighbors, clusterId);
            }
        }
        return labels;
    }

    // 5. MÓDULO INTERATIVO: ENTRADA DE INPUT MANUAL E TESTE INDIVIDUAL
    predictNewPlayer(dataset, currentLabels, newPlayer) {
        let neighbors = [];
        
        // Avalia a vizinhança imediata do novo vetor de teste
        for (let i = 0; i < dataset.length; i++) {
            if (this.euclidianDistance(newPlayer, dataset[i]) <= this.eps) {
                neighbors.push(i);
            }
        }

        // Critério Fundamental de Densidade do DBSCAN: Isolação Espacial Total = Anomalia/Outlier
        if (neighbors.length === 0) {
            return {
                status: "CRÍTICO: Trapaça Detectada (Ruído)",
                codigo: -1,
                descricao: "A telemetria inserida não possui densidade ou correspondência no comportamento de jogadores humanos legítimos.",
                acao: "Banimento Automático do Utilizador (Vanguard Flag)"
            };
        }

        // Se houver vizinhos próximos, determina a qual grupo ele se assemelha pelo vizinho mais próximo
        let maisProximoIdx = neighbors[0];
        let menorDistancia = this.euclidianDistance(newPlayer, dataset[neighbors[0]]);

        for (let k = 1; k < neighbors.length; k++) {
            let dist = this.euclidianDistance(newPlayer, dataset[neighbors[k]]);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                maisProximoIdx = neighbors[k];
            }
        }

        const clusterPertencente = currentLabels[maisProximoIdx];

        if (clusterPertencente === -1) {
            return {
                status: "SUSPEITO: Comportamento Anómalo",
                codigo: -1,
                descricao: "O jogador orbita áreas estatísticas de utilizadores banidos ou altamente irregulares.",
                acao: "Sinalizar Conta para Análise de Replay Manual (Overwatch)"
            };
        } else {
            return {
                status: "VERIFICADO: Jogador Legítimo",
                codigo: clusterPertencente,
                descricao: `Padrão comportamental perfeitamente integrado à densidade padrão do servidor (Agrupamento ${clusterPertencente}).`,
                acao: "Nenhuma ação corretiva necessária"
            };
        }
    }
}

// =========================================================================
// SIMULAÇÃO DA TELEMETRIA DO SERVIDOR (Para apresentação e validação)
// =========================================================================

// Dataset Fictício estruturado: X = Tempo de Reação (ms), Y = Taxa de Headshot (%)
const telemetriaServidor = [
    // Grupo 1: Jogadores Casuais (Reação lenta, precisão normal)
    { x: 260, y: 15 }, { x: 280, y: 18 }, { x: 240, y: 12 }, { x: 290, y: 22 }, { x: 250, y: 20 },
    // Grupo 2: Jogadores Profissionais/Elite (Reação humana veloz, precisão cirúrgica)
    { x: 160, y: 55 }, { x: 175, y: 60 }, { x: 150, y: 52 }, { x: 180, y: 65 }, { x: 165, y: 58 },
    // Casos isolados de trapaça já coletados pelo servidor (Outliers)
    { x: 12,  y: 98 }, // Ultra-Rage Aimbot (Reação desumana instantânea e precisão perfeita)
    { x: 390, y: 4  }  // Bot automatizado AFK para farm de XP
];

// Inicialização do Detector com hiperparâmetros calibrados para a escala das variáveis
const EPSILON = 35; 
const MIN_POINTS = 4;
const antiCheatEngine = new AntiCheatDBSCAN(EPSILON, MIN_POINTS);

// Executa a clusterização baseada em densidade
const rotulosIniciais = antiCheatEngine.fit(telemetriaServidor);

console.log("=== SISTEMA ANTI-CHEAT INICIALIZADO ===");
console.log("Mapeamento de Perfis (-1 indica anomalias):", rotulosIniciais);

// -------------------------------------------------------------------------
// SIMULAÇÃO DE INPUT MANUAL (Simulando a interatividade pedida)
// -------------------------------------------------------------------------

console.log("\n>>> EXECUTANDO VERIFICAÇÃO DE INPUT MANUAL DE TESTE <<<");

// Teste Manual 1: Input de um utilizador suspeito usando script de mira (Aimbot)
const inputManualInfrator = { x: 14, y: 97 }; // Entrada simulada
const analise1 = antiCheatEngine.predictNewPlayer(telemetriaServidor, rotulosIniciais, inputManualInfrator);

console.log(`\n[Vetor 1] Injetado -> Tempo de Reação: ${inputManualInfrator.x}ms | HS: ${inputManualInfrator.y}%`);
console.log("Status Interno:", analise1.status);
console.log("Diagnóstico:", analise1.descricao);
console.log("Diretiva Aplicada:", analise1.acao);

// Teste Manual 2: Input de um utilizador comum com boas mecânicas
const inputManualLegitimo = { x: 168, y: 56 }; // Entrada simulada
const analise2 = antiCheatEngine.predictNewPlayer(telemetriaServidor, rotulosIniciais, inputManualLegitimo);

console.log(`\n[Vetor 2] Injetado -> Tempo de Reação: ${inputManualLegitimo.x}ms | HS: ${inputManualLegitimo.y}%`);
console.log("Status Interno:", analise2.status);
console.log("Diagnóstico:", analise2.descricao);
console.log("Diretiva Aplicada:", analise2.acao);