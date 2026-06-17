# 🎯 Anti-Cheat Simulator com DBSCAN

Projeto criado para exemplificar o funcionamento do algoritmo **DBSCAN**, desenvolvido puramente para fins educativos e demonstrativos.

---

## 🧠 O que é o DBSCAN?

O **DBSCAN** (*Density-Based Spatial Clustering of Applications with Noise*) é um algoritmo de **aprendizado não supervisionado** focado em agrupamento (clustering). Sua principal função é analisar um conjunto de dados e agrupar pontos que estão próximos uns dos outros, formando "clusters" (grupos), baseado na densidade geométrica desses pontos.

### Como ele funciona?
Diferente de algoritmos que precisam de uma base rotulada ou de um número de grupos pré-definido (como o K-Means), o DBSCAN descobre os agrupamentos organicamente a partir de dois parâmetros principais definidos pelo desenvolvedor:

* **Eps (Epsilon):** A distância máxima entre dois pontos para que eles sejam considerados vizinhos.
* **MinSamples:** A quantidade mínima de pontos necessários dentro do raio Epsilon para formar uma região densa (um cluster).

> 📌 **Vantagem:** Pontos isolados que não atendem aos critérios de densidade são classificados pelo algoritmo como **ruído (noise)**, o que o torna excelente para detectar anomalias ou "outliers".

---

## 🎮 O Contexto do Projeto: Detecção de Trapaças (Anti-Cheat)

Jogos de tiro competitivos (*FPS*) atraem jogadores que buscam testar suas habilidades. Infelizmente, a frustração ou o desejo de vitória fácil levam alguns indivíduos a utilizarem programas auxiliares ilícitos, conhecidos como *cheats* ou trapaças (como *aimbots* para mira automática ou *wallhacks* para ver através de paredes).

Para manter o ecossistema do jogo justo, divertido e competitivo — tanto para jogadores casuais quanto para profissionais —, criamos este **simulador de Anti-Cheat baseado em Machine Learning**.

### 📊 Parâmetros Utilizados na Detecção
O sistema analisa o comportamento dos usuários com base em três métricas principais:

1.  **Tempo de Reação:** O intervalo de tempo entre o inimigo aparecer na tela e o disparo acontecer. Tempos inhumanamente curtos acendem um alerta.
2.  **Porcentagem de Headshots (Tiros na Cabeça):** Tiros na cabeça causam mais dano. Uma taxa de acerto excessivamente alta e constante costuma indicar o uso de trapaças.
3.  **Quantidade de Reports (Denúncias):** O número de vezes que outros jogadores denunciaram o usuário por comportamento suspeito. Embora denúncias isoladas possam ser fruto de frustração dos adversários, um volume alto gera suspeita acumulada.

---

## 🌐 Demonstração Prática

Você pode testar o comportamento do algoritmo na prática!

🚀 **Acesse o simulador aqui:** [Interface do Projeto](https://mjunior406.github.io/bimestral_machinelearning/)

### 🕹️ Como testar?
1. Acesse o link acima.
2. Insira dados de teste nos campos indicados.
3. Clique no botão **ANALISAR VIA DBSCAN** para ver como o algoritmo classifica o perfil.

Para facilitar, você pode utilizar os perfis de exemplo abaixo para testar as reações do sistema:

| Perfil Estimado | Tempo de Reação (ms) | Headshot (%) | Reports (Denúncias) |
| :--- | :---: | :---: | :---: |
| **Jogador Médio** | `200` | `20` | `1` |
| **Jogador Excepcional** | `120` | `60` | `8` |
| **Cheater (Trapaceiro)** | `30` | `90` | `40` |

> 💡 **Dica de teste:** Observe como o DBSCAN lida com o "Jogador Excepcional". Por ser um ponto fora da média comum, mas que ainda não chega aos extremos absurdos de um cheater, ele é um ótimo cenário para entender como o algoritmo define as fronteiras dos clusters e o que ele pode considerar como ruído!

---

### ⚠️ Limitações do Modelo
* Um sistema de anti-cheat real utiliza centenas de parâmetros complexos e análises em tempo real a nível de sistema operacional (kernel).
* Este projeto utiliza uma base de dados sintética de **1000 jogadores gerados aleatoriamente** para fins de demonstração, portanto, margens de erro são esperadas. Uma aplicação comercial utilizaria milhões de dados reais para calibração.