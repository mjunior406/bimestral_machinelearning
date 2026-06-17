// ============================================================
// DBSCAN Anti-Cheat - VALORANT
// Variáveis: reação (ms), headshot (%), reports
// ============================================================

let dataset = [];

// --- Geração do dataset sintético (substitui o CSV do GitHub) ---
// Simula 1000 jogadores com distribuições realistas:
//   Cluster 0 (normais):  reação 150-400ms, HS 10-55%, reports 0-5
//   Cluster 1 (suspeitos): reação 50-120ms,  HS 60-85%, reports 5-15
//   Ruído/cheaters:        reação < 30ms,    HS > 90%,  reports > 20
function gerarDataset() {
  const dados = [];

  // Jogadores normais (~750)
  for (let i = 0; i < 750; i++) {
    dados.push([
      rand(180, 400),   // reação ms
      rand(10, 55),     // headshot %
      randInt(0, 5)     // reports
    ]);
  }

  // Jogadores suspeitos (~200)
  for (let i = 0; i < 200; i++) {
    dados.push([
      rand(70, 120),
      rand(60, 75),
      randInt(5, 15)
    ]);
  }

  // Cheaters óbvios (~50)
  for (let i = 0; i < 50; i++) {
    dados.push([
      rand(5, 50),
      rand(88, 100),
      randInt(20, 50)
    ]);
  }

  // Embaralha
  for (let i = dados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dados[i], dados[j]] = [dados[j], dados[i]];
  }

  return dados;
}

function rand(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Normalização Min-Max por coluna ---
// Essencial para o DBSCAN funcionar com variáveis em escalas diferentes
function normalizar(dados) {
  const n = dados.length;
  const dims = dados[0].length;
  const mins = Array(dims).fill(Infinity);
  const maxs = Array(dims).fill(-Infinity);

  for (const p of dados) {
    for (let d = 0; d < dims; d++) {
      if (p[d] < mins[d]) mins[d] = p[d];
      if (p[d] > maxs[d]) maxs[d] = p[d];
    }
  }

  return dados.map(p =>
    p.map((v, d) => {
      const range = maxs[d] - mins[d];
      return range === 0 ? 0 : (v - mins[d]) / range;
    })
  );
}

// --- Normaliza um único ponto usando os parâmetros do dataset ---
function normalizarPonto(ponto, dados) {
  const dims = dados[0].length;
  const mins = Array(dims).fill(Infinity);
  const maxs = Array(dims).fill(-Infinity);

  for (const p of dados) {
    for (let d = 0; d < dims; d++) {
      if (p[d] < mins[d]) mins[d] = p[d];
      if (p[d] > maxs[d]) maxs[d] = p[d];
    }
  }

  return ponto.map((v, d) => {
    const range = maxs[d] - mins[d];
    if (range === 0) return 0;
    // Clipa para [0,1] para lidar com valores fora do range do dataset
    return Math.max(0, Math.min(1, (v - mins[d]) / range));
  });
}

// --- Distância Euclidiana ---
function distancia(a, b) {
  let soma = 0;
  for (let d = 0; d < a.length; d++) {
    soma += (a[d] - b[d]) ** 2;
  }
  return Math.sqrt(soma);
}

// --- Estimativa automática de epsilon pela heurística k-distância ---
// Usa o método do "cotovelo": ordena as k-ésimas menores distâncias
// e escolhe o ponto de maior curvatura (variação máxima).
function estimarEpsilon(dados, k = 5) {
  const n = dados.length;
  const kDists = [];

  for (let i = 0; i < n; i++) {
    const dists = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) dists.push(distancia(dados[i], dados[j]));
    }
    dists.sort((a, b) => a - b);
    kDists.push(dists[k - 1]);
  }

  kDists.sort((a, b) => a - b);

  // Encontra o ponto de maior mudança (cotovelo)
  let maxDelta = -Infinity;
  let epsIdx = Math.floor(n * 0.9); // fallback: percentil 90

  for (let i = 1; i < kDists.length - 1; i++) {
    const delta = kDists[i + 1] - kDists[i];
    if (delta > maxDelta) {
      maxDelta = delta;
      epsIdx = i;
    }
  }

  return kDists[epsIdx];
}

// --- Algoritmo DBSCAN ---
function dbscan(dados, eps, minPts) {
  const n = dados.length;
  const labels = new Array(n).fill(-2); // -2 = não visitado
  let clusterId = 0;

  function vizinhos(idx) {
    const v = [];
    for (let j = 0; j < n; j++) {
      if (distancia(dados[idx], dados[j]) <= eps) v.push(j);
    }
    return v;
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue; // já visitado

    const viz = vizinhos(i);

    if (viz.length < minPts) {
      labels[i] = -1; // ruído
      continue;
    }

    labels[i] = clusterId;
    const fila = [...viz];

    while (fila.length > 0) {
      const q = fila.shift();
      if (labels[q] === -1) labels[q] = clusterId; // borda
      if (labels[q] !== -2) continue;
      labels[q] = clusterId;
      const vizQ = vizinhos(q);
      if (vizQ.length >= minPts) fila.push(...vizQ);
    }

    clusterId++;
  }

  return labels;
}

// --- Identifica qual cluster representa cheaters ---
// Critério: cluster com menor média de reação E maior média de HS
function identificarClusterCheater(dados, labels) {
  const clusters = {};
  for (let i = 0; i < labels.length; i++) {
    const c = labels[i];
    if (c < 0) continue;
    if (!clusters[c]) clusters[c] = [];
    clusters[c].push(dados[i]);
  }

  let melhorCluster = -1;
  let melhorScore = -Infinity;

  for (const [id, pontos] of Object.entries(clusters)) {
    const mediaReacao = pontos.reduce((s, p) => s + p[0], 0) / pontos.length;
    const mediaHS = pontos.reduce((s, p) => s + p[1], 0) / pontos.length;
    // Score: alto HS e baixa reação (ambos normalizados 0-1)
    // No espaço normalizado: baixa reação = valor baixo, alto HS = valor alto
    const score = mediaHS - mediaReacao;
    if (score > melhorScore) {
      melhorScore = score;
      melhorCluster = parseInt(id);
    }
  }

  return melhorCluster;
}

// --- Função principal chamada pelo botão ---
function verificarJogador() {
  const x = parseFloat(document.getElementById('inputX').value);
  const y = parseFloat(document.getElementById('inputY').value);
  const z = parseFloat(document.getElementById('inputZ').value);

  const terminal = document.getElementById('resultadoTerminal');

  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    terminal.innerHTML = `<p class="text-red-400">⚠ Preencha todos os campos com valores numéricos.</p>`;
    return;
  }

  terminal.innerHTML = `<p class="text-yellow-500 animate-pulse italic">Executando DBSCAN... Aguarde.</p>`;

  // Usa setTimeout para não travar a UI durante o processamento
  setTimeout(() => {
    try {
      // 1. Dataset (gerado sinteticamente ou já carregado)
      const dadosBase = dataset.length > 0 ? dataset : gerarDataset();

      // 2. Adiciona o ponto do jogador ao dataset para normalizar junto
      const dadosComJogador = [...dadosBase, [x, y, z]];
      const idxJogador = dadosComJogador.length - 1;

      // 3. Normaliza
      const norm = normalizar(dadosComJogador);

      // 4. Estima epsilon automaticamente (amostra de 200 pts para performance)
      const amostra = norm.slice(0, 200);
      const eps = estimarEpsilon(amostra, 4);
      const minPts = 4;

      // 5. Executa DBSCAN
      const labels = dbscan(norm, eps, minPts);

      // 6. Identifica cluster de cheaters
      const clusterCheater = identificarClusterCheater(norm, labels);
      const labelJogador = labels[idxJogador];

      // 7. Estatísticas dos clusters
      const totalClusters = new Set(labels.filter(l => l >= 0)).size;
      const totalRuido = labels.filter(l => l === -1).length;

      // 8. Veredicto
      let isCheater = false;
      let motivo = '';

      if (labelJogador === -1) {
        // Ponto de ruído — analisa manualmente pelos valores brutos
        // Critério: reação muito baixa E headshot muito alto E muitos reports
        if (x < 50 && y > 80 && z > 15) {
          isCheater = true;
          motivo = 'OUTLIER SUSPEITO — estatísticas extremas detectadas fora dos clusters conhecidos.';
        } else {
          motivo = 'OUTLIER — jogador com perfil atípico, mas sem evidência conclusiva de cheat.';
        }
      } else if (labelJogador === clusterCheater) {
        isCheater = true;
        motivo = `Agrupado no Cluster ${labelJogador} (perfil cheater identificado pelo DBSCAN).`;
      } else {
        motivo = `Agrupado no Cluster ${labelJogador} (perfil dentro do esperado para jogadores legítimos).`;
      }

      // 9. Renderiza resultado
      const cor = isCheater ? 'text-[#ff4655]' : 'text-green-400';
      const icone = isCheater ? '⛔' : '✅';
      const veredicto = isCheater ? 'SUSPEITO DE CHEAT — BAN RECOMENDADO' : 'JOGADOR LEGÍTIMO — SEM ANOMALIAS';

      terminal.innerHTML = `
        <p class="text-gray-500">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
        <p class="text-gray-400">» Reação: <span class="text-white">${x} ms</span> | HS: <span class="text-white">${y}%</span> | Reports: <span class="text-white">${z}</span></p>
        <p class="text-gray-400">» Epsilon (auto): <span class="text-white">${eps.toFixed(4)}</span> | MinPts: <span class="text-white">${minPts}</span></p>
        <p class="text-gray-400">» Clusters encontrados: <span class="text-white">${totalClusters}</span> | Ruído: <span class="text-white">${totalRuido}</span></p>
        <p class="text-gray-400">» Cluster do jogador: <span class="text-white">${labelJogador === -1 ? 'Ruído/Outlier' : labelJogador}</span> | Cluster cheater: <span class="text-white">${clusterCheater === -1 ? 'N/A' : clusterCheater}</span></p>
        <p class="text-gray-500">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
        <p class="${cor} font-bold text-sm mt-1">${icone} ${veredicto}</p>
        <p class="text-gray-400 mt-1">${motivo}</p>
      `;

      document.getElementById('contadorDados').textContent = `Amostras carregadas: ${dadosBase.length}`;

    } catch (e) {
      terminal.innerHTML = `<p class="text-red-400">Erro interno: ${e.message}</p>`;
    }
  }, 50);
}

// --- Inicialização: gera dataset e exibe status ---
window.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('statusCarregamento');

  setTimeout(() => {
    dataset = gerarDataset();
    document.getElementById('contadorDados').textContent = `Amostras carregadas: ${dataset.length}`;
    if (statusEl) {
      statusEl.classList.remove('animate-pulse');
      statusEl.className = 'text-green-400 italic';
      statusEl.textContent = `✔ Dataset de ${dataset.length} jogadores carregado. Pronto para análise.`;
    }
  }, 800);
});