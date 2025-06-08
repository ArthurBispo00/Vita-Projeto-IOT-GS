# VITA: Sistema de Monitoramento de Risco de Deslizamento

O projeto VITA é um sistema completo e inovador para o monitoramento e alerta de risco de deslizamentos de terra. Desenvolvido para integrar hardware (sensores ESP32), um backend robusto (FastAPI) e um frontend intuitivo (Next.js), o VITA fornece informações cruciais em tempo real sobre as condições do solo e o risco associado a desastres.

## 💡 Utilidade do Aplicativo

O principal objetivo do VITA é atuar na prevenção de desastres naturais causados por deslizamentos de terra. Ao fornecer dados contínuos e calculados de risco, ele permite que autoridades e comunidades sejam alertadas com antecedência. Isso possibilita a tomada de decisões rápidas, como evacuações preventivas, e a implementação de medidas de mitigação, salvando vidas e reduzindo danos materiais.

## ⚙️ Como o Aplicativo Funciona (Visão Geral)

O sistema VITA opera de forma integrada em três camadas principais:

### 1. Hardware (ESP32 Dev Kit)
Um dispositivo ESP32 (Dev Kit), alimentado por um painel solar e bateria, é responsável pela coleta de dados ambientais e do solo. Ele integra os seguintes sensores:
* **Sensor de Umidade Capacitivo:** Mede a umidade do solo, um fator chave na instabilidade de encostas.
* **Sensor de Vibração (SW-420):** Detecta tremores detectetado e vibrações no terreno, indicando possíveis movimentações.
* **MPU-6050 (Acelerômetro e Giroscópio):** Monitora deslocamentos e alterações de orientação do terreno, indicando movimentos sutis que podem preceder um deslizamento.
* **Módulo GSM (3G):** Embora a comunicação principal com o backend seja via Wi-Fi no código atual, este módulo pode ser utilizado para garantir conectividade em locais sem Wi-Fi disponível.

Os dados coletados (umidade, tremores detectetado, deslocamento, localização e timestamp) são formatados em JSON e enviados via HTTP POST para o servidor backend. O envio ocorre a cada 3 segundos em condições normais, e alertas de emergência são enviados com maior prioridade, respeitando um cooldown para evitar sobrecarga.

### 2. Backend (FastAPI - Python)
O servidor FastAPI atua como o cérebro do sistema, processando os dados recebidos do hardware e realizando os cálculos de risco.
* **Recebimento de Dados:** A API (`/api/sensores`) recebe as informações dos sensores do ESP32.
* **Integração Climática:** Utiliza a API Open-Meteo para obter dados históricos (últimas 72h) e previsão (próximas 24h) de precipitação para a localização do sensor.
* **Cálculo de Risco Inteligente:** Um algoritmo em Python (`model.py`) calcula um "score" de risco baseado em múltiplos fatores, incluindo umidade do solo, tremores detectetado, deslocamento, chuva acumulada e futura, tipo de solo e se a área é desmatada. O risco é classificado como **BAIXO**, **MÉDIO** ou **ALTO**.
* **Armazenamento de Dados:** Os registros dos sensores e o risco calculado são persistidos em um arquivo `db.json` para histórico e consulta.
* **API para o Frontend:** Uma API (`/api/sensores-json`) é exposta para que o frontend possa consumir os dados e exibir o status atualizado do monitoramento.

### 3. Frontend (Next.js - React)
A interface de usuário do VITA é um aplicativo web moderno e responsivo, construído com Next.js, que visualiza os dados e o risco de deslizamento em tempo real.
* **Interface Intuitiva:** Apresenta um painel claro com o status mais recente dos sensores e o nível de risco.
* **Atualização Contínua:** A página principal busca e exibe os dados mais recentes do backend a cada 10 segundos, garantindo informações atualizadas.
* **Visualização Detalhada:** Permite visualizar a umidade do solo, a detecção de tremores detectetado e deslocamento, e a classificação do risco de forma compreensível.

## 📋 Pré-requisitos

Para configurar e rodar o projeto VITA, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

* **Para ESP32 (Hardware & Firmware):**
    * **IDE Arduino:** Para programar o ESP32.
    * **Extensão ESP32 para IDE Arduino:** Permite compilar e fazer upload de código para placas ESP32.
    * **Bibliotecas Arduino:**
        * `WiFi.h`
        * `HTTPClient.h`
        * `time.h`
        * `Wire.h`
        * `Adafruit_MPU6050.h`
        * `Adafruit_Sensor.h`

* **Para Backend (Python):**
    * **Python 3.x:** Versão mais recente recomendada.
    * **`pip`:** Gerenciador de pacotes Python (geralmente vem com o Python).

* **Para Frontend (Next.js):**
    * **Node.js (versão LTS recomendada):** Ambiente de execução JavaScript.
    * **`npm` ou `yarn`:** Gerenciadores de pacotes Node.js (npm vem com o Node.js).

## 🛠️ Montagem do Hardware

Faça a montagem do hardware de acordo com o seguinte esquemático:

![Esquemático de Conexão do Hardware VITA](image_3341f3.jpg)

**Detalhes das Conexões:**

* **Painel Solar 3W & Bateria:** Conecte o painel solar à bateria para carregamento. A bateria alimentará o ESP32.
* **ESP32 DEV KIT:** A placa central de controle.
* **Sensor de Umidade Capacitivo:** Conecte VCC, GND e o pino de saída analógica ao **Pino 34 (GPIO34)** do ESP32.
* **Sensor de Vibração (SW-420):** Conecte VCC, GND e o pino de saída digital (DO) ao **Pino 25 (GPIO25)** do ESP32.
* **MPU-6050 (Giroscópio/Acelerômetro):** Conecte VCC (3.3V), GND, **SDA ao Pino 21 (GPIO21)** do ESP32 e **SCL ao Pino 22 (GPIO22)** do ESP32.
* **Módulo GSM (3G):** Conecte conforme as especificações de energia e comunicação do módulo ao ESP32. (No código atual, a comunicação principal é via Wi-Fi; o módulo GSM pode ser uma funcionalidade futura ou alternativa).

---

## 🚀 Guia de Execução

Para rodar o sistema VITA completo, siga as instruções de configuração e execução para cada um dos seus componentes:

## 🔌 Montagem e Teste do Circuito

Para replicar o hardware do projeto VITA, siga as instruções de montagem abaixo:

### 1. Materiais Necessários

Certifique-se de ter os seguintes componentes em mãos:

* **Placa de Desenvolvimento:** ESP32 Dev Kit
* **Sensores:**
    * Sensor de Umidade Capacitivo
    * Sensor de Inclinação/Vibração (SW-420)
    * MPU-6050 (Acelerômetro e Giroscópio)
* **Módulo de Comunicação:** Módulo GSM (3G) - *Nota: o código atual utiliza Wi-Fi, o GSM é uma opção para conectividade alternativa.*
* **Alimentação:**
    * Painel Solar 3W
    * Bateria
* **Outros:**
    * Cabos Jumper (macho-fêmea, macho-macho)
    * Protoboard (opcional, para testes iniciais)

### 2. Diagrama de Montagem

Realize a montagem física do circuito de acordo com o diagrama principal e o esquema detalhado:

* **Diagrama de Conexão Geral:**
    ![Diagrama de Conexão do Hardware VITA](../../iot-hardware/Diagrama.png)

* **Esquemático Detalhado:**
    Para uma referência mais técnica das ligações, consulte o arquivo do esquemático:
    [Esquemático do Circuito](C:\Users\arthu\Vita-Projeto-IOT-GS-1\iot-hardware\Esquema.md)

**Detalhes Adicionais das Conexões:**

* **Painel Solar e Bateria:** Conecte o painel solar à bateria para carregamento, e a bateria aos pinos de alimentação do ESP32 (geralmente VIN/5V e GND).
* **Sensor de Umidade:** Conecte o VCC e GND do sensor aos respectivos pinos do ESP32. O pino de saída analógica (DO) deve ser conectado ao **GPIO34** do ESP32.
* **Sensor de Vibração (SW-420):** Conecte o VCC e GND do sensor aos pinos de alimentação do ESP32. O pino de saída digital (DO) deve ser conectado ao **GPIO25** do ESP32.
* **MPU-6050:** Conecte o VCC (geralmente 3.3V) e GND do MPU-6050. Os pinos de comunicação I2C, **SDA**, devem ser conectados ao **GPIO21** do ESP32, e **SCL** ao **GPIO22** do ESP32.
* **Módulo GSM (3G):** Siga o datasheet específico do seu módulo GSM para a conexão de energia e dados (TX/RX). Lembre-se que o código atual prioriza a comunicação Wi-Fi.

### 3. Teste dos Contatos

Após a montagem, é crucial testar todas as conexões para garantir que não há curtos-circuitos ou pinos conectados incorretamente. Utilize um multímetro para verificar a continuidade e as tensões, se possível.

---

Esta etapa configura o seu dispositivo ESP32 para coletar e enviar dados.

2.  **Abra o Projeto na IDE Arduino:**
    * Abra o arquivo `ESP_main.ino` localizado na pasta `ESP32/` na sua IDE Arduino.

3.  **Atualize as Credenciais de Rede:**
    * Dentro do `ESP_main.ino`, localize as seguintes linhas e substitua `SEU_WIFI` e `SUA_SENHA` pelas credenciais da sua rede Wi-Fi local:
        ```c++
        const char* ssid = "SEU_WIFI";
        const char* password = "SUA_SENHA";
        ```

4.  **Defina o Endereço do Servidor Backend:**
    * Ainda no `ESP_main.ino`, atualize o `serverName` com o endereço IP da máquina onde seu backend FastAPI estará rodando. **É crucial que este IP seja acessível pelo ESP32 na sua rede local.**
        ```c++
        const char* serverName = "http://SEU_IP_DO_BACKEND:8000/api/sensores";
        ```
        Exemplo: Se seu backend estiver rodando em seu computador com IP `192.168.1.100`, use `http://192.168.1.100:8000/api/sensores`.

5.  **Ajustes de Coordenadas (Opcional):**
    * Se necessário, ajuste `latitude` e `longitude` para as coordenadas geográficas do local onde o sensor será instalado.

6.  **Calibração dos Sensores (Opcional):**
    * Os valores de `seco_max`, `molhado_min` para o sensor de umidade e `VELOCIDADE_ANGULAR_LIMIAR_RAD_S` para o MPU-6050 são empíricos. Teste e ajuste-os conforme a calibração real dos seus sensores para otimizar a detecção.

7.  **Faça o Upload do Código:**
    * Conecte seu ESP32 ao computador via USB.
    * Na IDE Arduino, selecione a placa e a porta COM corretas (`Ferramentas > Placa` e `Ferramentas > Porta`).
    * Clique no botão "Upload" para compilar e enviar o firmware para o ESP32.
    * Após o upload, abra o "Monitor Serial" (ícone da lupa no canto superior direito da IDE) para ver as mensagens de depuração e confirmar a conexão Wi-Fi e o envio de dados.

### 2. Execução do Backend (FastAPI)

Esta etapa inicia o servidor que receberá os dados do ESP32 e processará o risco.

1.  **Navegue até o Diretório do Backend:**
    ```bash
    cd Backend/
    ```

2.  **Crie e Ative um Ambiente Virtual (Altamente Recomendado):**
    * **Crie:**
        ```bash
        python -m venv venv
        ```
    * **Ative:**
        * **Windows:**
            ```bash
            .\venv\Scripts\activate
            ```
        * **macOS/Linux:**
            ```bash
            source venv/bin/activate
            ```

3.  **Instale as Dependências do Python:**
    * Certifique-se de ter um arquivo `requirements.txt` na pasta `Backend/` (se não tiver, crie um com `fastapi`, `uvicorn`, `pydantic`, `requests`, ``python-multipart` e `datetime`).
    * Instale:
        ```bash
        pip install -r requirements.txt
        ```

4.  **Inicie o Servidor FastAPI:**
    ```bash
    uvicorn main:app --reload
    ```
    * O servidor será iniciado, geralmente em `http://127.0.0.1:8000`. Anote o endereço IP (ex: `192.168.x.x`) se for diferente de `localhost` e você precisar dele para o ESP32.

### 3. Execução do Frontend (Next.js)

Esta etapa inicia a interface web para visualizar os dados e o risco.

1.  **Navegue até o Diretório do Frontend:**
    ```bash
    cd Frontend/
    ```

2.  **Instale as Dependências Node.js:**
    ```bash
    npm install
    # ou
    yarn install
    # ou
    pnpm install
    # ou
    bun install
    ```

3.  **Verifique a Configuração da API do Frontend:**
    * Abra o arquivo `src/app/services/api.ts` dentro da pasta `Frontend/`.
    * Certifique-se de que o URL base para a API (`/api/sensores-json`) está configurado para apontar para o seu backend FastAPI (ex: `http://localhost:8000` se estiver na mesma máquina, ou `http://SEU_IP_DO_BACKEND:8000`).

4.  **Inicie o Servidor de Desenvolvimento Next.js:**
    ```bash
    npm run dev
    # ou
    yarn dev
    # ou
    pnpm dev
    # ou
    bun dev
    ```
    * O frontend estará acessível em `http://localhost:3000`. Abra esta URL no seu navegador.

---

## 🔁 Fluxo de Dados

A seguir, um resumo do ciclo de vida dos dados no sistema VITA, desde a coleta até a visualização:

1.  **Coleta de Dados (ESP32):** O dispositivo ESP32 lê continuamente os dados dos sensores de umidade, tremores detectetado (SW-420) e deslocamento (MPU-6050).
2.  **Envio ao Backend (ESP32 para FastAPI):** Os dados coletados são formatados em JSON e enviados via HTTP POST para o endpoint `/api/sensores` do servidor FastAPI. O envio ocorre a cada 3 segundos, com alertas de emergência (umidade alta, tremores detectetado, deslocamento) sendo enviados prioritariamente, respeitando um cooldown.
3.  **Processamento e Cálculo de Risco (FastAPI):**
    * O backend recebe os dados do ESP32.
    * Ele consulta a API Open-Meteo para obter informações de precipitação histórica (últimas 72h) e previsão (próximas 24h) para a localização do sensor.
    * Um algoritmo em `model.py` utiliza todos esses dados para calcular um "score" de risco, classificando o nível de risco como BAIXO, MÉDIO ou ALTO.
    * Os dados brutos do sensor, as informações de chuva e o risco calculado são armazenados em um arquivo `db.json`.
4.  **Exposição de Dados (FastAPI para Frontend):** O endpoint `/api/sensores-json` do FastAPI permite que o frontend acesse os dados mais recentes dos sensores e o risco calculado.
5.  **Visualização (Next.js):** O frontend, em `http://localhost:3000`, busca os dados do backend a cada 10 segundos e exibe as informações do sensor mais recente em um `SensorCard`, incluindo o nível de risco atual.

## ✨ Considerações Finais

O projeto VITA é uma solução robusta para o monitoramento proativo de riscos de deslizamento. Para um ambiente de produção, considere:

* **Persistência de Dados:** Para dados históricos mais robustos, migrar o `db.json` para um banco de dados relacional (ex: PostgreSQL) ou NoSQL (ex: MongoDB).
* **Segurança:** Implementar autenticação e autorização para as APIs do backend e frontend.
* **Deployment:** Utilizar plataformas de deployment como Vercel para o frontend e render.com ou Heroku para o backend para escalabilidade e manutenção simplificada.
* **Calibração:** A calibração dos limiares dos sensores (umidade, tremores detectetado, deslocamento) é crucial para a precisão do sistema em diferentes tipos de solo e ambientes.
* **Módulo GSM:** Ativar e configurar o módulo GSM no ESP32 pode ser uma camada de redundância essencial para áreas sem cobertura Wi-Fi.

Sua contribuição para este projeto é sempre bem-vinda!

---