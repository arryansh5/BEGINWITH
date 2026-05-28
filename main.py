from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from data import get_stock_data_and_model, get_stock_prediction, evaluate_ipo, get_uptrending_stocks
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HISTORY_FILE = "history.json"

class StockRequest(BaseModel):
    ticker: str

class IPORequest(BaseModel):
    subscription_rate: float
    gmp_percent: float
    is_profitable: bool
    sector: str

def save_to_history(entry):
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except:
            history = []
    history.insert(0, entry)
    history = history[:10]
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)

@app.post("/api/predict_stock")
def predict_stock(req: StockRequest):
    try:
        model, scaler, latest_day, features, metrics = get_stock_data_and_model(req.ticker)
        result = get_stock_prediction(model, scaler, latest_day, features, metrics)
        save_to_history({"ticker": req.ticker, "Prediction": result["Prediction"], "Confidence": result["Confidence"]})
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/history")
def get_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return {"success": True, "data": json.load(f)}
        except:
            return {"success": True, "data": []}
    return {"success": True, "data": []}

@app.post("/api/evaluate_ipo")
def evaluate_ipo_api(req: IPORequest):
    try:
        result = evaluate_ipo(req.subscription_rate, req.gmp_percent, req.is_profitable, req.sector)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/api/trending")
def get_trending():
    try:
        stocks = get_uptrending_stocks()
        return {"success": True, "data": stocks}
    except Exception as e:
        return {"success": False, "error": str(e)}
