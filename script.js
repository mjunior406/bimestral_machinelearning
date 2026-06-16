class VanguardDBSCAN {
    constructor(eps, minPoints) {
        this.eps = eps;
        this.minPoints = minPoints;
    }

    distance3D(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }

    regionQuery(dataset, targetIdx) {
        const neighbors = [];
        for (let j = 0; j < dataset.length; j++) {
            if (this.distance3D(dataset[targetIdx], dataset[j]) <= this.eps) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    expandCluster(dataset, labels, pointIdx, neighbors, clusterId) {
        labels[pointIdx] = clusterId;
        for (let i = 0; i < neighbors.length; i++) {
            let neighborIdx = neighbors[i];
            if (labels[neighborIdx] === -1) labels[neighborIdx] = clusterId;
            if (labels[neighborIdx] !== 0) continue;

            labels[neighborIdx] = clusterId;
            let nextNeighbors = this.regionQuery(dataset, neighborIdx);
            if (nextNeighbors.length >= this.minPoints) {
                for (let j = 0; j < nextNeighbors.length; j++) {
                    if (!neighbors.includes(nextNeighbors[j])) {
                        neighbors.push(nextNeighbors[j]);
                    }
                }
            }
        }
    }

    fit(dataset) {
        const n = dataset.length;
        const labels = new Array(n).fill(0);
        let clusterId = 0;

        for (let i = 0; i < n; i++) {
            if (labels[i] !== 0) continue;
            let neighbors = this.regionQuery(dataset, i);
            if (neighbors.length < this.minPoints) {
                labels[i] = -1;
            } else {
                clusterId++;
                this.expandCluster(dataset, labels, i, neighbors, clusterId);
            }
        }
        return labels;
    }

    predictNewPlayer(dataset, currentLabels, newPlayer) {

        let neighbors = [];

        for (let i = 0; i < dataset.length; i++) {
            if (this.distance3D(newPlayer, dataset[i]) <= this.eps) {
                neighbors.push(i);
            }
        }

        if (neighbors.length === 0) {
            return {
                veredicto: "OUTLIER DETECTADO // COMPORTAMENTO INÉDITO",
                cor: "text-yellow-500",
                detalhe: "Os parâmetros informados estão isolados em uma lacuna espacial do gráfico. Nenhuma proximidade estatística com padrões conhecidos.",
                acao: "ISOLAR USUÁRIO PARA ANÁLISE FORENSE DE REPLAY"
            };
        }

        let maisProximoIdx = neighbors[0];
        let menorDist = this.distance3D(newPlayer, dataset[neighbors[0]]);

        for (let k = 1; k < neighbors.length; k++) {

            let dist = this.distance3D(
                newPlayer,
                dataset[neighbors[k]]
            );

            if (dist < menorDist) {
                menorDist = dist;
                maisProximoIdx = neighbors[k];
            }
        }

        console.log("=== TESTE DBSCAN ===");
        console.log("Novo jogador:", newPlayer);
        console.log("Vizinhos encontrados:", neighbors);
        console.log("Mais próximo:", maisProximoIdx);
        console.log("Cluster do vizinho:", currentLabels[maisProximoIdx]);

        const contagemClusters = {};

        neighbors.forEach(idx => {
            const cluster = currentLabels[idx];

            if (cluster !== -1) {
                contagemClusters[cluster] =
                    (contagemClusters[cluster] || 0) + 1;
            }
        });

        let clusterPertencente = -1;
        let maiorQuantidade = 0;

        for (const cluster in contagemClusters) {
            if (contagemClusters[cluster] > maiorQuantidade) {
                maiorQuantidade = contagemClusters[cluster];
                clusterPertencente = parseInt(cluster);
            }
        }

        console.log("Cluster dominante:", clusterPertencente);

        if (clusterPertencente === 1) {
            return {
                veredicto: "STATUS VERIFICADO // ECOSSISTEMA COMUM",
                cor: "text-green-400",
                detalhe: "Classificado matematicamente no Cluster 1 (Alta densidade de jogadores casuais e elos intermediários).",
                acao: "INTEGRIDADE CONFIRMADA // NENHUMA AÇÃO"
            };
        }
        else if (clusterPertencente === 2) {
            return {
                veredicto: "STATUS VERIFICADO // ATLETA DE ELITE / RADIANTE",
                cor: "text-[#00f3ff]",
                detalhe: "Classificado matematicamente no Cluster 2 (Zona compacta de tempos de reação baixos e precisão profissional legítima).",
                acao: "INTEGRIDADE CONFIRMADA // CONTA REGISTRADA COMO ALTA PERFORMANCE"
            };
        }
        else if (clusterPertencente === 3) {
            return {
                veredicto: "TRAPAÇA CONFIRMADA VIA DENSIDADE // PROTOCOLO VANGUARD",
                cor: "text-[#ff4655]",
                detalhe: "Classificado matematicamente no Cluster 3.",
                acao: "CONTA SUSPENSA PERMANENTEMENTE VIA BANIMENTO ALGORÍTMICO"
            };
        }
        else {
            return {
                veredicto: "COMPORTAMENTO SUSPEITO // ANOMALIA PERTO DE RUÍDO",
                cor: "text-orange-400",
                detalhe: "Os dados orbitam a periferia do gráfico.",
                acao: "ENVIAR PARTIDAS PARA ANÁLISE COMPLEMENTAR"
            };
        }
    }
}0

let bancoServidor = [];
let rotulosServidor = [];
const EPSILON = 15;
const MIN_POINTS = 4;
const vanguard = new VanguardDBSCAN(EPSILON, MIN_POINTS);

window.addEventListener('DOMContentLoaded', () => {
    fetch('dados.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo CSV.');
            }
            return response.text();
        })
        .then(text => {
            const linhas = text.split('\n');
            bancoServidor = [];

            for (let i = 1; i < linhas.length; i++) {
                const linha = linhas[i].trim();
                if (!linha) continue;

                const colunas = linha.split(',');
                if (colunas.length >= 3) {
                    bancoServidor.push({
                        x: parseFloat(colunas[0]),
                        y: parseFloat(colunas[1]),
                        z: parseFloat(colunas[2])
                    });
                }
            }

            if (bancoServidor.length > 0) {
                if (bancoServidor.length > 0) {

                    rotulosServidor = vanguard.fit(bancoServidor);

                    const estatisticas = {};

                    for (let i = 0; i < bancoServidor.length; i++) {

                        const cluster = rotulosServidor[i];

                        if (cluster === -1) continue;

                        if (!estatisticas[cluster]) {
                            estatisticas[cluster] = {
                                qtd: 0,
                                somaReacao: 0,
                                somaHS: 0,
                                somaReports: 0
                            };
                        }

                        estatisticas[cluster].qtd++;
                        estatisticas[cluster].somaReacao += bancoServidor[i].x;
                        estatisticas[cluster].somaHS += bancoServidor[i].y;
                        estatisticas[cluster].somaReports += bancoServidor[i].z;
                    }

                    console.log("=== MÉDIAS DOS CLUSTERS ===");

                    for (const c in estatisticas) {

                        console.log({
                            cluster: c,
                            reacao: (
                                estatisticas[c].somaReacao /
                                estatisticas[c].qtd
                            ).toFixed(1),

                            hs: (
                                estatisticas[c].somaHS /
                                estatisticas[c].qtd
                            ).toFixed(1),

                            reports: (
                                estatisticas[c].somaReports /
                                estatisticas[c].qtd
                            ).toFixed(1)
                        });
                    }

                    console.log("=== RÓTULOS DBSCAN ===");
                    console.log(rotulosServidor);

                    const clusters = {};

                    rotulosServidor.forEach(label => {
                        clusters[label] = (clusters[label] || 0) + 1;
                    });

                    console.log("=== RESUMO DOS CLUSTERS ===");
                    console.table(clusters);

                    document.getElementById('contadorDados').innerText =
                        `Amostras carregadas: ${bancoServidor.length}`;

                    document.getElementById('resultadoTerminal').innerHTML =
                        `<p class="text-green-400 text-center">// BASE DE DADOS CARREGADA DO REPOSITÓRIO COM SUCESSO!</p>`;
                }
                document.getElementById('contadorDados').innerText = `Amostras carregadas: ${bancoServidor.length}`;
                document.getElementById('resultadoTerminal').innerHTML = `<p class="text-green-400 text-center">// BASE DE DADOS CARREGADA DO REPOSITÓRIO COM SUCESSO!</p>`;
            }
        })
        .catch(error => {
            document.getElementById('resultadoTerminal').innerHTML = `<p class="text-[#ff4655] text-center">// ERRO CRÍTICO: Não foi possível ler o arquivo 'dados.csv'. Verifique se ele está na mesma pasta.</p>`;
        });
});

function verificarJogador() {
    if (bancoServidor.length === 0) {
        alert("A base de dados ainda não foi carregada.");
        return;
    }

    const x = parseFloat(document.getElementById('inputX').value);
    const y = parseFloat(document.getElementById('inputY').value);
    const z = parseFloat(document.getElementById('inputZ').value);

    const jogadorTeste = { x, y, z };
    const resultado = vanguard.predictNewPlayer(bancoServidor, rotulosServidor, jogadorTeste);

    const terminal = document.getElementById('resultadoTerminal');
    terminal.innerHTML = `
                <p class="text-gray-500">// PROCESSANDO ESPAÇO GEOMÉTRICO DBSCAN EM ${bancoServidor.length} AMOSTRAS...</p>
                <div class="pt-2">
                    <p class="font-black text-sm uppercase ${resultado.cor}">> VEREDITO: ${resultado.veredicto}</p>
                    <p class="text-gray-300 mt-1">[ANÁLISE MATEMÁTICA]: ${resultado.detalhe}</p>
                    <p class="text-gray-400 font-bold mt-1 text-[11px]">> DIRETIVA DE SEGURANÇA: <span class="underline">${resultado.acao}</span></p>
                </div>
            `;
}
