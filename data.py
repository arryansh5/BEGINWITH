import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

def get_stock_data_and_model(ticker_symbol="RELIANCE.NS"):
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period="2y")
    
    if df.empty:
        raise ValueError(f"Yahoo Finance could not find data for '{ticker_symbol}'. The symbol might be incorrect or temporarily unavailable. Try 'RELIANCE.NS', 'TCS.NS', or 'AAPL'.")
        
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].reset_index()
    
    df['Date'] = pd.to_datetime(df['Date']).dt.date 
    df = df.sort_values('Date').reset_index(drop=True)
    df = df.drop_duplicates(subset='Date')
    df['Volume'] = df['Volume'].astype(int) 

    df['MA5'] = df['Close'].rolling(window=5).mean()
    df['MA10'] = df['Close'].rolling(window=10).mean()
    df['Price_Change'] = df['Close'].diff()
    df['Volume_Change'] = df['Volume'].diff()
    df = df.dropna().reset_index(drop=True)

    df['Tomorrow_Close'] = df['Close'].shift(-1)
    df['Target'] = (df['Tomorrow_Close'] > df['Close']).astype(int)
    df = df.dropna(subset=['Tomorrow_Close']).reset_index(drop=True)

    features = ['MA5', 'MA10', 'Price_Change', 'Volume_Change']
    X = df[features]
    y = df['Target']
    split = int(len(df) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = LogisticRegression()
    model.fit(X_train_scaled, y_train)

    # Calculate metrics on the test set
    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    
    coefs = model.coef_[0]
    feature_importance = {feat: float(coef) for feat, coef in zip(features, coefs)}
    
    metrics = {
        "accuracy": round(accuracy * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "coefficients": feature_importance
    }

    latest_day = df.iloc[-1]
    return model, scaler, latest_day, features, metrics

def get_stock_prediction(model, scaler, latest_day, features, metrics):
    latest_X_scaled = scaler.transform([latest_day[features]])
    
    pred = model.predict(latest_X_scaled)[0]
    conf = model.predict_proba(latest_X_scaled)[0].max()
    
    prediction_text = "UP" if pred == 1 else "DOWN"
    confidence_pct = round(conf * 100, 2)
    
    if confidence_pct > 65:
        risk_level = "Low"
    elif confidence_pct > 55:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    reasons = []
    if latest_day['Close'] > latest_day['MA5']:
        reasons.append("Price is above 5-day average (Short-term strength)")
    else:
        reasons.append("Price is below 5-day average (Short-term weakness)")

    if latest_day['MA5'] > latest_day['MA10']:
        reasons.append("5-day average is above 10-day average (Medium-term Uptrend)")
    else:
        reasons.append("5-day average is below 10-day average (Medium-term Downtrend)")

    if latest_day['Price_Change'] > 0:
        reasons.append("Stock showed positive price momentum today")
    else:
        reasons.append("Stock price dropped today")

    if latest_day['Volume_Change'] > 0:
        reasons.append("Trading volume is increasing (High interest)")
    else:
        reasons.append("Trading volume is decreasing (Low interest)")
        
    return {
        "Prediction": prediction_text,
        "Confidence": f"{confidence_pct}%",
        "Risk": risk_level,
        "Reasons": reasons,
        "Metrics": metrics
    }

def evaluate_ipo(subscription_rate, gmp_percent, is_profitable, sector):
    score = 0
    reasons = []

    if subscription_rate > 20:
        score += 2
        reasons.append(f"High demand (Oversubscribed {subscription_rate}x)")
    elif subscription_rate > 10:
        score += 1
        reasons.append(f"Moderate demand (Oversubscribed {subscription_rate}x)")
    else:
        score -= 1
        reasons.append(f"Low demand (Oversubscribed {subscription_rate}x)")

    if gmp_percent > 25:
        score += 2
        reasons.append(f"Strong Grey Market Premium ({gmp_percent}%)")
    elif gmp_percent > 10:
        score += 1
        reasons.append(f"Moderate Grey Market Premium ({gmp_percent}%)")
    else:
        score -= 1
        reasons.append(f"Low/Negative Grey Market Premium ({gmp_percent}%)")

    if is_profitable:
        score += 1
        reasons.append("Company is profitable (Fundamental strength)")
    else:
        score -= 1
        reasons.append("Company is loss-making (Fundamental risk)")

    strong_sectors = ["Banking", "Energy", "Infrastructure"]
    risky_sectors = ["Tech startup", "Loss-heavy new-age"]
    
    if sector in strong_sectors:
        score += 1
        reasons.append(f"Strong sector ({sector})")
    elif sector in risky_sectors:
        score -= 1
        reasons.append(f"Risky sector ({sector})")

    if gmp_percent > 25 and subscription_rate < 10:
        score -= 1
        reasons.append("Mismatch between GMP and demand indicates uncertainty")

    if score >= 4:
        rating = "Good"
    elif score >= 2:
        rating = "Average"
    else:
        rating = "Risky"

    return {"Rating": rating, "Reasons": reasons}

def get_uptrending_stocks():
    tickers = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ITC.NS', 'SBIN.NS', 'AAPL', 'MSFT', 'GOOGL', 'AMZN']
    uptrending = []
    
    for t in tickers:
        try:
            df = yf.Ticker(t).history(period='1mo')
            if not df.empty and len(df) >= 10:
                ma5 = df['Close'].rolling(window=5).mean().iloc[-1]
                ma10 = df['Close'].rolling(window=10).mean().iloc[-1]
                if ma5 > ma10:
                    uptrending.append(t)
        except Exception:
            pass
            
    return uptrending
