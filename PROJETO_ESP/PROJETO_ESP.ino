#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h> // Para obter o timestamp
#include <Wire.h> // Biblioteca para comunicação I2C
#include <Adafruit_MPU6050.h> // Inclui a biblioteca Adafruit MPU6050
#include <Adafruit_Sensor.h> // Inclui a biblioteca Adafruit Unified Sensor (dependência)

// Configurações Wi-Fi
const char* ssid = "arthur";
const char* password = "12345678";

// IP do seu servidor backend FastAPI
const char* serverName = "http://192.168.63.246:8000/api/sensores";

// Pinos dos sensores
int umidadePin = 34;         // Sensor de umidade capacitivo (analógico)
int inclinacaoPin = 25;      // Sensor tilt SW-420 (digital) - Usado para tremores/vibração

// Coordenadas fixas do local do sensor (atualizadas conforme o JSON de exemplo)
float latitude = -23.5746;
float longitude = -46.6236;

// Limites de calibração do sensor de umidade
const int seco_max = 3000;      // Valor com o sensor completamente seco
const int molhado_min = 1200;   // Valor com o sensor mergulhado na água

// Variáveis para configuração de tempo
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -3 * 3600; // GMT-3 para São Paulo (GMT-03:00)
const int   daylightOffset_sec = 0; // Não há horário de verão agora

// --- Variáveis para controle de envio e limiares ---
unsigned long lastSendTime = 0;
// >>> ALTERAÇÃO: Envia a cada 3 segundos
const long NORMAL_SEND_INTERVAL = 3000; // Envia a cada 3 segundos (em milissegundos)

const float UMIDADE_ALTA_LIMIAR = 80.0; // Umidade acima de 80% é considerada alta (ajuste conforme necessário)

// --- Variáveis para Debounce do sensor de Inclinação (SW-420) ---
unsigned long lastDebounceTime = 0;   // Tempo da última mudança de estado
// >>> ALTERAÇÃO: Diminui o atraso de debounce para maior sensibilidade
const long DEBOUNCE_DELAY = 50;      // Atraso de debounce em milissegundos (ajuste se necessário)
bool lastInclinacaoState = false;    // Último estado lido do sensor de inclinação (cru)
bool stableInclinacaoState = false;  // Estado estável do sensor de inclinação (debounced)

// --- Adições para o MPU-6050 ---
Adafruit_MPU6050 mpu; // Cria um objeto da classe Adafruit_MPU6050

// Limiar para detecção de deslocamento/inclinação (giroscópio).
// Este valor é empírico e precisará de CALIBRAÇÃO na sua situação real.
// >>> ALTERAÇÃO: Diminui o limiar para maior sensibilidade do MPU-6050 para deslocamento
const float VELOCIDADE_ANGULAR_LIMIAR_RAD_S = 0.2; // Velocidade angular em rad/s.

// Variável para armazenar o estado de "deslocamento detectado" do MPU-6050 (usada para "inclinacao" no JSON)
bool mpuDeslocamentoDetectado = false;

// --- Variáveis para controle de Cooldown de Alertas ---
unsigned long lastEmergencyAlertTime = 0;
// O cooldown de alertas de emergência pode ser mantido um pouco maior para evitar spam
const long EMERGENCY_ALERT_COOLDOWN = 5000; // 5 segundos (em milissegundos) entre alertas de emergência

// Função para ler o MPU-6050 e determinar o estado de deslocamento
void lerEAnalisarMPU6050() {
  sensors_event_t a, g, temp; // 'a' para aceleração, 'g' para giroscópio, 'temp' para temperatura
  mpu.getEvent(&a, &g, &temp); // Lê os dados do sensor

  // Calcula a magnitude da velocidade angular total (vetor)
  float totalAngularVelocity_rads = sqrt(
    pow(g.gyro.x, 2) +
    pow(g.gyro.y, 2) +
    pow(g.gyro.z, 2)
  );

  // Detecta "deslocamento" ou mudança de orientação (rotação)
  if (totalAngularVelocity_rads > VELOCIDADE_ANGULAR_LIMIAR_RAD_S) {
    mpuDeslocamentoDetectado = true;
    Serial.print("MPU6050: Deslocamento/Inclinação Detectado (Giroscópio): ");
    Serial.println(totalAngularVelocity_rads, 3); // Para ver o valor que disparou o alerta
  } else {
    mpuDeslocamentoDetectado = false; // Reseta se não estiver girando.
  }
}


void setup() {
  Serial.begin(115200); // Ajustado para 115200, valor comum.

  Serial.print("Conectando ao WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado com sucesso!");
  Serial.print("Endereço IP do ESP: ");
  Serial.println(WiFi.localIP());

  // Configura o NTP para obter a hora atual
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Tempo configurado via NTP.");

  // Configura o pino do SW-420 como entrada
  pinMode(inclinacaoPin, INPUT);
  // Inicializa o estado debounced com a leitura atual para evitar um alerta falso no início
  lastInclinacaoState = digitalRead(inclinacaoPin) == HIGH;
  stableInclinacaoState = lastInclinacaoState;


  // --- Inicialização do MPU-6050 ---
  // Inicia a comunicação I2C para o MPU-6050
  Wire.begin(21, 22); // Pinos SDA (21) e SCL (22) do ESP32

  Serial.println("Inicializando MPU6050...");
  if (!mpu.begin()) {
    Serial.println("Falha ao encontrar MPU6050. Verifique as conexões.");
    while (1) {
      delay(10); // Trava o programa se não encontrar o sensor
    }
  }
  // Configurações opcionais para o MPU6050
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G); // Escolha um alcance adequado (2, 4, 8, 16 G)
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);       // Escolha um alcance adequado (250, 500, 1000, 2000 DEG/S)
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);   // Define o filtro para estabilizar leituras

  Serial.println("MPU6050 inicializado com sucesso!");
}

void loop() {
  // Leitura do sensor de umidade
  int leituraUmidade = analogRead(umidadePin);
  leituraUmidade = constrain(leituraUmidade, molhado_min, seco_max);
  float umidade = map(leituraUmidade, seco_max, molhado_min, 0, 100);

  // --- Leitura e Debounce do sensor de Inclinação (SW-420) ---
  // Agora o SW-420 é para detectar "tremores detectetado" (vibração)
  bool currentInclinacaoReading = digitalRead(inclinacaoPin) == HIGH;

  // Se a leitura atual for diferente da última leitura, reinicia o timer de debounce
  if (currentInclinacaoReading != lastInclinacaoState) {
    lastDebounceTime = millis();
  }

  // Se o tempo de debounce passou e a leitura ainda é estável, atualiza o estado estável
  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (currentInclinacaoReading != stableInclinacaoState) {
      stableInclinacaoState = currentInclinacaoReading;
    }
  }
  lastInclinacaoState = currentInclinacaoReading; // Salva a leitura atual para a próxima iteração
  // --- Fim do Debounce SW-420 ---

  // --- Chame a função para ler e analisar o MPU-6050 (para deslocamento/inclinação) ---
  lerEAnalisarMPU6050();

  // Obtém o timestamp atual
  struct tm timeinfo;
  char timestamp_buffer[30]; // Buffer para formatar o timestamp
  if (!getLocalTime(&timeinfo)) {
    strcpy(timestamp_buffer, "null"); // Define como "null" se não conseguir o tempo
  } else {
    strftime(timestamp_buffer, sizeof(timestamp_buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  }

  // --- Lógica de envio condicional ---
  bool sendNow = false;
  String tipoEnvio = "REGULAR";
  bool isEmergencyAlert = false; // Flag para identificar se o envio atual é um alerta de emergência

  // Condição de alerta para umidade alta
  if (umidade > UMIDADE_ALTA_LIMIAR) {
    sendNow = true;
    isEmergencyAlert = true; // É um alerta de emergência
    tipoEnvio = "ALERTA (Umidade Alta)";
  }

  // Condição de alerta para tremores detectetado (SW-420)
  if (stableInclinacaoState) { // Se o estado estável de inclinação for HIGH (choque/vibração do SW-420)
    sendNow = true;
    isEmergencyAlert = true; // É um alerta de emergência
    if (tipoEnvio == "REGULAR") tipoEnvio = "ALERTA (SW-420 Tremores Detectados)";
    else tipoEnvio += " + SW-420 Tremores Detectados";
  }

  // Condição de alerta para deslocamento (MPU-6050 - giroscópio)
  if (mpuDeslocamentoDetectado) {
    sendNow = true;
    isEmergencyAlert = true; // É um alerta de emergência
    if (tipoEnvio == "REGULAR") tipoEnvio = "ALERTA (MPU-6050 Deslocamento)";
    else tipoEnvio += " + MPU-6050 Deslocamento";
  }

  // Lógica para enviar dados:
  // 1. Se for um ALERTA DE EMERGÊNCIA E o COOLDOWN passou
  // OU
  // 2. Se for um envio REGULAR (não alerta) E o INTERVALO NORMAL de envio passou
  if ((isEmergencyAlert && (millis() - lastEmergencyAlertTime >= EMERGENCY_ALERT_COOLDOWN)) ||
      (!isEmergencyAlert && (millis() - lastSendTime >= NORMAL_SEND_INTERVAL))) {

    // Se é um alerta de emergência, atualiza o tempo do último alerta
    if (isEmergencyAlert) {
      lastEmergencyAlertTime = millis();
    }
    // Se for um envio regular, atualiza o tempo do último envio regular
    lastSendTime = millis();

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverName);
      http.addHeader("Content-Type", "application/json");

      String jsonData = "{";
      jsonData += "\"deviceId\":\"Serra das Caragutatuba\",";
      jsonData += "\"latitude\":" + String(latitude, 6) + ",";
      jsonData += "\"longitude\":" + String(longitude, 6) + ",";
      jsonData += "\"mpu_deslocamento_detectado\":" + String(mpuDeslocamentoDetectado ? "true" : "false") + ",";

      jsonData += "\"umidade\":" + String(umidade, 2) + ",";
      jsonData += "\"inclinacao\":" + String(mpuDeslocamentoDetectado ? "true" : "false") + ","; // MPU-6050 Deslocamento
      jsonData += "\"vibracao\":" + String(stableInclinacaoState ? "true" : "false") + ",";      // SW-420 Tremores Detectados
      jsonData += "\"chuva_passada\":0.0,";
      jsonData += "\"chuva_futura\":0.0,";
      jsonData += "\"risco\":\"BAIXO\",";
      jsonData += "\"timestamp\":\"" + String(timestamp_buffer) + "\"";
      jsonData += "}";

      Serial.println("\n--- Enviando Dados ---");
      Serial.print("Tipo de Envio: ");
      Serial.println(tipoEnvio);

      Serial.print("Umidade: ");
      Serial.print(umidade, 2);
      Serial.println(" %");
      Serial.print("SW-420 Tremores Detectados: ");
      Serial.println(stableInclinacaoState ? "DETECTADO" : "NORMAL");
      Serial.print("MPU-6050 Deslocamento (Inclinacao): ");
      Serial.println(mpuDeslocamentoDetectado ? "DETECTADO" : "NORMAL");
      Serial.print("JSON enviado: ");
      Serial.println(jsonData);

      int httpResponseCode = http.POST(jsonData);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print("Código de Resposta HTTP: ");
        Serial.println(httpResponseCode);
        Serial.print("Resposta do Servidor: ");
        Serial.println(response);
      } else {
        Serial.print("Erro na requisição HTTP (código: ");
        Serial.print(httpResponseCode);
        Serial.print("): ");
        Serial.println(http.errorToString(httpResponseCode));
      }
      http.end(); // Fecha a conexão
      Serial.println("--- Fim do Envio ---\n");

    } else {
      Serial.println("Wi-Fi desconectado! Não foi possível enviar dados para o servidor.");
    }
  }

  delay(50); // Pequeno atraso para dar tempo ao sistema e evitar leituras muito rápidas.
}