"""
NOTA IMPORTANTE:
Usa un modelo local vía Ollama (http://localhost:11434). Si Ollama no está
disponible (no instalado, apagado), el módulo
cae automáticamente en un generador de insights basado en reglas, para que
el sistema nunca se caiga por falta de conexión con el LLM.
"""

import os
import requests

# ----------------------------
# Configuración
# ----------------------------

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = 90 


# ----------------------------
# Utilidades internas
# ----------------------------

def _pares_correlacion_fuertes(correlaciones, umbral=0.5):
    """Devuelve pares (col_a, col_b, r) ordenados por fuerza de correlación."""
    vistos = set()
    pares = []

    for col_a, fila in correlaciones.items():
        for col_b, valor in fila.items():
            if col_a == col_b or not isinstance(valor, (int, float)):
                continue

            clave = frozenset((col_a, col_b))
            if clave in vistos:
                continue
            vistos.add(clave)

            if abs(valor) >= umbral:
                pares.append((col_a, col_b, valor))

    pares.sort(key=lambda item: abs(item[2]), reverse=True)
    return pares


def _columnas_con_outliers(outliers):
    """Devuelve columnas con outliers > 0, ordenadas de mayor a menor."""
    columnas = [(col, n) for col, n in outliers.items() if n > 0]
    columnas.sort(key=lambda item: item[1], reverse=True)
    return columnas


def _construir_prompt(resultado):
    """Arma el prompt en español que se le envía al LLM."""

    resumen = resultado.get("resumen", {})
    correlaciones = resultado.get("correlaciones", {})
    outliers = resultado.get("outliers", {})
    clustering = resultado.get("clustering", {})

    pares_fuertes = _pares_correlacion_fuertes(correlaciones)
    columnas_outliers = _columnas_con_outliers(outliers)

    texto_correlaciones = "\n".join(
        f"- {a} vs {b}: r={r:.2f}" for a, b, r in pares_fuertes[:8]
    ) or "- No se detectaron correlaciones fuertes (r >= 0.5)."

    texto_outliers = "\n".join(
        f"- {col}: {n} valores atípicos" for col, n in columnas_outliers[:8]
    ) or "- No se detectaron valores atípicos relevantes."

    return f"""Eres un analista de datos experto. Debajo tienes los resultados
de un análisis exploratorio automático de un dataset. Analízalos y responde
en español.

Resumen general:
- Filas: {resumen.get('filas')}
- Columnas: {resumen.get('columnas')}
- Variables numéricas: {resumen.get('numericas')}
- Variables categóricas: {resumen.get('categoricas')}

Correlaciones más fuertes detectadas:
{texto_correlaciones}

Columnas con más valores atípicos:
{texto_outliers}

Clustering aplicado:
- Algoritmo: {clustering.get('algoritmo')}
- Número de clusters: {clustering.get('n_clusters')}

Responde ÚNICAMENTE en el siguiente formato, una línea por elemento, sin
texto adicional antes o después, sin markdown:

INTERPRETACION: <2 o 3 frases explicando en conjunto qué dicen estos resultados>
INSIGHT: <primer hallazgo relevante, breve>
INSIGHT: <segundo hallazgo relevante, breve>
INSIGHT: <tercer hallazgo relevante, breve>
HALLAZGO_PRIORITARIO: <el hallazgo más importante de todos y por qué el usuario debería atenderlo primero>
"""


def _parsear_respuesta_llm(texto):
    """Extrae interpretación, insights y hallazgo prioritario del texto del LLM."""
    interpretacion = ""
    insights = []
    hallazgo_prioritario = ""

    for linea in texto.splitlines():
        linea = linea.strip()

        if linea.upper().startswith("INTERPRETACION:"):
            interpretacion = linea.split(":", 1)[1].strip()
        elif linea.upper().startswith("INSIGHT:"):
            valor = linea.split(":", 1)[1].strip()
            if valor:
                insights.append(valor)
        elif linea.upper().startswith("HALLAZGO_PRIORITARIO:"):
            hallazgo_prioritario = linea.split(":", 1)[1].strip()

    return interpretacion, insights, hallazgo_prioritario


# ----------------------------
# Generador de respaldo (sin LLM)
# ----------------------------

def _generar_insights_basados_en_reglas(resultado):
    """
    Genera interpretación, insights y hallazgo prioritario sin depender de
    Ollama, usando únicamente los datos ya calculados (correlaciones,
    outliers, clustering). Sirve como respaldo si el LLM no responde.
    """

    resumen = resultado.get("resumen", {})
    correlaciones = resultado.get("correlaciones", {})
    outliers = resultado.get("outliers", {})
    clustering = resultado.get("clustering", {})

    pares_fuertes = _pares_correlacion_fuertes(correlaciones)
    columnas_outliers = _columnas_con_outliers(outliers)

    interpretacion = (
        f"El dataset contiene {resumen.get('filas', 0)} registros y "
        f"{resumen.get('columnas', 0)} columnas, de las cuales "
        f"{resumen.get('numericas', 0)} son numéricas. El análisis "
        f"identificó {len(pares_fuertes)} relaciones fuertes entre variables "
        f"y agrupó los datos en {clustering.get('n_clusters', 0)} clústeres "
        "mediante K-Means."
    )

    insights = []

    if pares_fuertes:
        col_a, col_b, r = pares_fuertes[0]
        direccion = "directamente" if r > 0 else "inversamente"
        insights.append(
            f"'{col_a}' y '{col_b}' están {direccion} correlacionadas "
            f"(r={r:.2f}), lo que sugiere que una influye sobre la otra."
        )

    if columnas_outliers:
        col, n = columnas_outliers[0]
        insights.append(
            f"La variable '{col}' concentra {n} valores atípicos, por lo que "
            "conviene revisarla antes de tomar decisiones basadas en ella."
        )

    if clustering.get("n_clusters", 0) > 0:
        insights.append(
            f"Los datos se agrupan naturalmente en "
            f"{clustering.get('n_clusters')} segmentos distintos, lo que "
            "puede usarse para diferenciar estrategias por grupo."
        )

    if not insights:
        insights.append(
            "No se detectaron patrones estadísticamente fuertes; se "
            "recomienda revisar la calidad o el volumen de los datos."
        )

    if pares_fuertes:
        col_a, col_b, r = pares_fuertes[0]
        hallazgo_prioritario = (
            f"La relación más fuerte del dataset es entre '{col_a}' y "
            f"'{col_b}' (r={r:.2f}); es el primer punto que se debería "
            "investigar."
        )
    elif columnas_outliers:
        col, n = columnas_outliers[0]
        hallazgo_prioritario = (
            f"'{col}' es la variable con más valores atípicos ({n}); "
            "revisarla primero evita conclusiones erróneas en el resto del "
            "análisis."
        )
    else:
        hallazgo_prioritario = (
            "No se identificó un hallazgo dominante; los datos parecen "
            "homogéneos."
        )

    return interpretacion, insights, hallazgo_prioritario


# ----------------------------
# Punto de entrada del módulo
# ----------------------------

def generar_insights_ia(resultado):
    """
    Genera la interpretación de IA para un resultado de análisis.

    Intenta usar Ollama (LLM local). Si falla por cualquier razón
    (Ollama apagado, sin modelo descargado, timeout, etc.), usa un
    generador de respaldo basado en reglas para que nunca
    quede sin respuesta.

    Returns:
        dict: {
            "interpretacion": str,
            "insights": list[str],
            "hallazgo_prioritario": str,
            "fuente": "ollama" | "reglas"
        }
    """

    prompt = _construir_prompt(resultado)

    try:
        respuesta = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=OLLAMA_TIMEOUT,
        )
        respuesta.raise_for_status()

        texto = respuesta.json().get("response", "")
        interpretacion, insights, hallazgo_prioritario = _parsear_respuesta_llm(texto)

        if not interpretacion or not insights:
            raise ValueError("Respuesta de Ollama incompleta o mal formateada.")

        fuente = "ollama"

    except Exception as e:
        # DEBUG temporal: esto imprime en la terminal del backend la razón
        # real por la que no se pudo usar Ollama. 
        print(f"[ai_insights] No se pudo usar Ollama, usando respaldo. Motivo: {type(e).__name__}: {e}")

        interpretacion, insights, hallazgo_prioritario = (
            _generar_insights_basados_en_reglas(resultado)
        )
        fuente = "reglas"

    return {
        "interpretacion": interpretacion,
        "insights": insights,
        "hallazgo_prioritario": hallazgo_prioritario,
        "fuente": fuente,
    }