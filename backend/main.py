from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import calcular_risco
import requests
from datetime import datetime
import json
import os

app = FastAPI()
DB_FILE = "db.json"

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DadosSensor(BaseModel):
    deviceId: str
    latitude: float
    longitude: float
    umidade: float
    inclinacao: bool        # SW-420
    vibracao: bool          # SW-420
    mpu_deslocamento_detectado: bool  # MPU6050
    chuva_passada: float = 0.0
    chuva_futura: float = 0.0
    risco: str = "BAIXO"
    timestamp: str

@app.post("/api/sensores")
def receber_dados(dados: DadosSensor):
    # Busca clima das últimas 72h e previsão para as próximas 24h
    clima = requests.get(
        f"https://api.open-meteo.com/v1/forecast?latitude={dados.latitude}&longitude={dados.longitude}&hourly=precipitation&past_days=3&forecast_days=2"
    ).json()
    # Somas das precipitações (mm) das últimas 24h e 72h, e previsão próxima 24h
    chuva_24h = sum(clima["hourly"]["precipitation"][:24])
    chuva_72h = sum(clima["hourly"]["precipitation"][:72])
    chuva_futura = sum(clima["hourly"]["precipitation"][72:96])

    # Chama o novo algoritmo de risco
    risco = calcular_risco(
        umidade=dados.umidade,
        inclinacao_graus=30 if dados.inclinacao else 0,  # 30º é crítico para inclinação, pode ajustar conforme região
        vibracao=dados.vibracao,
        deslocamento=dados.mpu_deslocamento_detectado,
        chuva_24h=chuva_24h,
        chuva_72h=chuva_72h,
        chuva_futura=chuva_futura,
        solo="comum",           # ajuste se tiver esse dado
        desmatado=False,        # ajuste se tiver esse dado
        explicar=False
    )

    registro = {
        "id": dados.deviceId,
        "local": {
            "latitude": dados.latitude,
            "longitude": dados.longitude
        },
        "umidade": dados.umidade,
        "inclinacao": dados.inclinacao,
        "vibracao": dados.vibracao,
        "mpu_deslocamento_detectado": dados.mpu_deslocamento_detectado,
        "chuva_24h": chuva_24h,
        "chuva_72h": chuva_72h,
        "chuva_futura": chuva_futura,
        "risco": risco,
        "timestamp": dados.timestamp
    }
    with open(DB_FILE, "a") as f:
        f.write(json.dumps(registro) + "\n")
    return {
        "status": "ok",
        "risco": risco,
        "endereco_api": f"https://nominatim.openstreetmap.org/reverse?format=json&lat={dados.latitude}&lon={dados.longitude}"
    }

@app.get("/api/sensores-json")
def listar_sensores():
    sensores = []
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            for line in f:
                try:
                    sensores.append(json.loads(line))
                except:
                    continue
    return sensores
