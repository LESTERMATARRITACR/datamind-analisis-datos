from flask import Blueprint, request, jsonify
from services.data_loader import cargar_archivos
from services.preprocessing import limpiar_y_preparar
from services.analysis import generar_analisis_exploratorio
from services.clustering import aplicar_clustering
import requests

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/analizar', methods=['POST'])
def analizar():
    archivos = request.files.getlist('files')
    dfs = cargar_archivos(archivos)
    
    resultados = {}
    for nombre, df in dfs.items():
        df_limpio, num_cols, cat_cols = limpiar_y_preparar(df)
        analisis = generar_analisis_exploratorio(df_limpio, num_cols)
        clusters = aplicar_clustering(df_limpio, num_cols)
        
        # Integración opcional con Ollama (LLM Local)
        try:
            res = requests.post("http://localhost:11434/api/generate", json={
                "model": "llama3",
                "prompt": f"Resume estos hallazgos analíticos: {analisis['outliers']} atípicos detectados.",
                "stream": False
            }, timeout=3)
            explicacion = res.json().get("response")
        except:
            explicacion = "Análisis procesado correctamente por el motor estadístico."

        resultados[nombre] = {
            "variables": {"numericas": num_cols, "categoricas": cat_cols},
            "analisis": analisis,
            "clustering": clusters,
            "resumen_ia": explicacion
        }
        
    return jsonify(resultados)