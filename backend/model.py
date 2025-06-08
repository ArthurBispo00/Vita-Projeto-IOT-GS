def calcular_risco(
    umidade,
    inclinacao_graus,    # graus!
    vibracao,
    deslocamento,
    chuva_24h,
    chuva_72h,
    chuva_futura,
    explicar=False,      # Retorna explicação detalhada
    solo="comum",        # "argila", "arenoso", "rocha", "comum" (se souber)
    desmatado=False      # Áreas desmatadas = mais risco
):
    # Pesos calibrados com base em literatura e prática
    pesos = {
        "chuva_24h_critica": 3,
        "chuva_24h_alta": 2,
        "chuva_24h_media": 1,

        "chuva_72h_critica": 2,
        "chuva_72h_alta": 1,

        "chuva_futura_critica": 2,
        "chuva_futura_alta": 1,

        "umidade_critica": 3,
        "umidade_alta": 2,
        "umidade_media": 1,

        "inclinacao_critica": 2.5,
        "inclinacao_alta": 1.5,
        "inclinacao_media": 1,

        "vibracao": 2,
        "deslocamento": 2,

        "solo_argila": 1.2,
        "solo_arenoso": 1,
        "solo_rocha": -1,

        "desmatado": 1.5,
    }

    score = 0
    explicacoes = []
    criticos = 0

    # --- Chuva acumulada 24h ---
    if chuva_24h >= 80:
        score += pesos["chuva_24h_critica"]
        criticos += 1
        explicacoes.append("Chuva intensa nas últimas 24h (>80mm).")
    elif chuva_24h >= 50:
        score += pesos["chuva_24h_alta"]
        explicacoes.append("Chuva forte nas últimas 24h (>50mm).")
    elif chuva_24h >= 30:
        score += pesos["chuva_24h_media"]
        explicacoes.append("Chuva moderada nas últimas 24h (>30mm).")

    # --- Chuva acumulada 72h ---
    if chuva_72h >= 150:
        score += pesos["chuva_72h_critica"]
        criticos += 1
        explicacoes.append("Chuva extrema nas últimas 72h (>150mm).")
    elif chuva_72h >= 100:
        score += pesos["chuva_72h_alta"]
        explicacoes.append("Chuva forte nas últimas 72h (>100mm).")

    # --- Chuva futura (previsão) ---
    if chuva_futura >= 50:
        score += pesos["chuva_futura_critica"]
        explicacoes.append("Previsão de chuva forte (>50mm) próximas 24h.")
    elif chuva_futura >= 30:
        score += pesos["chuva_futura_alta"]
        explicacoes.append("Previsão de chuva moderada (>30mm) próximas 24h.")

    # --- Umidade do solo ---
    if umidade >= 85:
        score += pesos["umidade_critica"]
        criticos += 1
        explicacoes.append("Umidade do solo crítica (>85%).")
    elif umidade >= 75:
        score += pesos["umidade_alta"]
        explicacoes.append("Umidade do solo alta (>75%).")
    elif umidade >= 60:
        score += pesos["umidade_media"]
        explicacoes.append("Umidade do solo moderada (>60%).")

    # --- Inclinação (graus) ---
    if inclinacao_graus >= 30:
        score += pesos["inclinacao_critica"]
        criticos += 1
        explicacoes.append("Inclinação do terreno crítica (>=30º).")
    elif inclinacao_graus >= 20:
        score += pesos["inclinacao_alta"]
        explicacoes.append("Inclinação do terreno alta (>=20º).")
    elif inclinacao_graus >= 10:
        score += pesos["inclinacao_media"]
        explicacoes.append("Inclinação do terreno moderada (>=10º).")

    # --- Vibração/deslocamento ---
    if vibracao:
        score += pesos["vibracao"]
        explicacoes.append("Vibração detectada no solo.")
    if deslocamento:
        score += pesos["deslocamento"]
        explicacoes.append("Deslocamento detectado no solo.")

    # --- Tipo de solo ---
    if solo == "argila":
        score += pesos["solo_argila"]
        explicacoes.append("Solo argiloso: mais suscetível.")
    elif solo == "arenoso":
        score += pesos["solo_arenoso"]
        explicacoes.append("Solo arenoso: moderadamente suscetível.")
    elif solo == "rocha":
        score += pesos["solo_rocha"]
        explicacoes.append("Solo rochoso: menor suscetibilidade.")

    # --- Desmatamento ---
    if desmatado:
        score += pesos["desmatado"]
        explicacoes.append("Área desmatada: muito mais vulnerável.")

    # --- Penalidade por múltiplos fatores ---
    if score >= 6 and (vibracao or deslocamento):
        score += 1
        explicacoes.append("Penalidade extra: risco acumulado por solo saturado e movimentação.")

    # --- Determinação do risco final ---
    if criticos >= 2 and score >= 8:
        risco = "ALTO"
        explicacoes.append("Múltiplos fatores críticos presentes. RISCO CRÍTICO DE DESLIZAMENTO!")
    elif score >= 6:
        risco = "ALTO"
        explicacoes.append("Risco ALTO de deslizamento.")
    elif score >= 3:
        risco = "MÉDIO"
        explicacoes.append("Risco MÉDIO: atenção!")
    else:
        risco = "BAIXO"
        explicacoes.append("Risco baixo.")

    if explicar:
        return {"risco": risco, "score": round(score, 2), "explicacoes": explicacoes}
    else:
        return risco
