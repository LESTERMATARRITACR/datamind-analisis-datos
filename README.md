# Guía de instalación y ejecución — DataMind

Este documento explica paso a paso cómo poner a correr el proyecto en una
máquina nueva (por ejemplo, la de un compañero de equipo).

El proyecto tiene 3 partes independientes que deben correr **al mismo
tiempo**, cada una en su propia terminal:

1. **Backend** (Python / FastAPI) — procesa los datos y genera el análisis.
2. **Ollama** (LLM local) — genera la interpretación con IA (punto 6).
3. **Frontend** (React / Vite) — la interfaz web donde se sube el archivo.

---

## Requisitos previos

Antes de empezar, asegúrate de tener instalado:

- **Python 3.10+** → https://www.python.org/downloads/
- **Node.js 18+** (incluye npm) → https://nodejs.org/
- **Ollama** → https://ollama.com/download

---

## 1. Clonar el repositorio

```powershell
git clone <URL-del-repositorio>
cd datamind-analisis-datos
```

---

## 2. Backend (Python / FastAPI)

Abre una terminal y ubícate en la carpeta `backend`:

```powershell
cd backend
```

### 2.1 Instalar las dependencias

```powershell
pip install -r requirements.txt
```

> Si `pip` no funciona o dice que no reconoce el comando, usa:
> ```powershell
> python -m pip install -r requirements.txt
> ```

Esto instala: FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, Requests,
Openpyxl (para leer `.xlsx`) y Xlrd (para leer `.xls`).

### 2.2 Levantar el servidor

```powershell
python -m uvicorn app:app --reload --port 5000
```

Si todo salió bien, deberías ver algo como:

```
Uvicorn running on http://127.0.0.1:5000
```

**Deja esta terminal abierta** — el backend debe seguir corriendo mientras
uses la aplicación.

> ⚠️ El frontend está configurado para hablarle al backend en el puerto
> **5000** (no el 8000 que usa FastAPI por defecto), por eso siempre se
> debe indicar `--port 5000` al levantar uvicorn.

---

## 3. Ollama (IA generativa — punto 6)

Necesario para que la interpretación de resultados use IA real en vez del
modo de respaldo por reglas.

### 3.1 Instalar Ollama

Descárgalo e instálalo desde https://ollama.com/download (o si prefieres
línea de comandos en Windows):

```powershell
irm https://ollama.com/install.ps1 | iex
```

Después de instalarlo, Ollama queda corriendo en segundo plano
automáticamente (no hace falta dejarle una terminal abierta ni correr
`ollama serve` a mano).

### 3.2 Descargar el modelo

```powershell
ollama pull llama3
```

Pesa unos 4.7 GB, así que puede tardar un rato según el internet.

### 3.3 Verificar que está listo

```powershell
ollama list
```

Debe aparecer `llama3` en la lista.

> Si no instalas Ollama, el proyecto **igual funciona**: el backend cae
> automáticamente en un generador de insights basado en reglas
> (`services/ai_insights.py`), sin necesidad de IA generativa. Solo que en
> ese caso el análisis va a decir "(motor de reglas, Ollama no disponible)"
> en vez de "(Ollama LLM)".

> 💡 La primera vez que el backend le pide algo a Ollama después de un rato
> sin uso, puede tardar más de lo normal en responder (está cargando el
> modelo en memoria). Es normal, no significa que algo esté roto.

---

## 4. Frontend (React / Vite)

Abre una **segunda terminal** (deja la del backend corriendo) y ubícate en
la carpeta `frontend`:

```powershell
cd frontend
```

### 4.1 Instalar las dependencias

```powershell
npm install
```

### 4.2 Levantar la aplicación

```powershell
npm run dev
```

Vas a ver algo como:

```
Local:   http://localhost:5173/
```

Abre esa URL en tu navegador.

---

## 5. Probar que todo funciona

1. En la página abre el formulario de carga y sube un archivo `.csv`,
   `.xlsx` o `.xls`.
2. Debería mostrarte: estadísticas descriptivas, correlaciones, outliers,
   clustering, visualizaciones, y la caja de "Modelado Inteligente" con la
   interpretación de IA.
3. Si en esa caja dice "(Ollama LLM)" quiere decir que la IA generativa
   respondió correctamente. Si dice "(motor de reglas...)" es que Ollama no
   está disponible en ese momento (revisa el punto 3).

---

## Resumen rápido (para quien ya hizo esto antes)

| Terminal | Ubicación | Comando |
|---|---|---|
| 1 — Backend | `backend/` | `python -m uvicorn app:app --reload --port 5000` |
| — Ollama | (corre solo en segundo plano tras instalarlo) | — |
| 2 — Frontend | `frontend/` | `npm run dev` |

---

## Problemas comunes

**"uvicorn: The term 'uvicorn' is not recognized"**
→ Usa `python -m uvicorn ...` en vez de `uvicorn ...` directamente.

**`pip install requirements.txt` da error**
→ Le falta la bandera `-r`: es `pip install -r requirements.txt`.

**`npm install` o `npm run dev` dan error de `package.json` no encontrado**
→ Estás parado en la carpeta equivocada. Verifica con `pwd` (o mirando la
ruta en la terminal) que estés dentro de `frontend/`, no de `backend/`.

**Error al subir un archivo `.xls` o `.xlsx` ("bad request")**
→ Verifica que `pip install -r requirements.txt` se haya ejecutado bien e
incluya `openpyxl` y `xlrd` (ya están en el `requirements.txt` del repo).

**La interpretación de IA siempre dice "motor de reglas, Ollama no
disponible" aunque instalaste Ollama**
→ Puede ser que la primera respuesta tarde más de lo normal. Sube el
archivo una segunda vez; si persiste, verifica con `ollama list` que
`llama3` esté descargado.
