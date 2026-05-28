import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('stock')
  const [trendingUp, setTrendingUp] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [showTrends, setShowTrends] = useState(false)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const fetchHistory = () => {
    fetch('http://localhost:8000/api/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data)
        }
      })
  }

  useEffect(() => {
    fetch('http://localhost:8000/api/trending')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrendingUp(data.data)
        }
        setLoadingTrending(false)
      })
      .catch(() => setLoadingTrending(false))
    
    fetchHistory()
  }, [])

  const [ticker, setTicker] = useState('')
  const [stockLoading, setStockLoading] = useState(false)
  const [stockResult, setStockResult] = useState(null)
  const [stockError, setStockError] = useState('')

  const [subRate, setSubRate] = useState('')
  const [gmp, setGmp] = useState('')
  const [profitable, setProfitable] = useState(false)
  const [sector, setSector] = useState('Tech startup')
  const [ipoLoading, setIpoLoading] = useState(false)
  const [ipoResult, setIpoResult] = useState(null)
  const [ipoError, setIpoError] = useState('')

  const handleStockPredict = async (e) => {
    e.preventDefault()
    setStockLoading(true)
    setStockError('')
    setStockResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/predict_stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker || 'RELIANCE.NS' })
      })
      const data = await res.json()
      if (data.success) {
        setStockResult(data.data)
        fetchHistory()
      } else {
        setStockError(data.error)
      }
    } catch (err) {
      setStockError("Failed to connect to backend.")
    }
    setStockLoading(false)
  }

  const handleIpoEvaluate = async (e) => {
    e.preventDefault()
    setIpoLoading(true)
    setIpoError('')
    setIpoResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/evaluate_ipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscription_rate: parseFloat(subRate || 0),
          gmp_percent: parseFloat(gmp || 0),
          is_profitable: profitable,
          sector: sector
         })
      })
      const data = await res.json()
      if (data.success) {
        setIpoResult(data.data)
      } else {
        setIpoError(data.error)
      }
    } catch (err) {
      setIpoError("Failed to connect to backend.")
    }
    setIpoLoading(false)
  }

  return (
    <div className="page-wrapper">
      <header className="top-panel">
        <button 
          className="history-toggle-btn" 
          onClick={() => setShowHistory(!showHistory)}
        >
          History
        </button>

        <div className="toggle-container">
          <button 
            className={`pill-btn ${activeTab === 'stock' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('stock')}
          >
            Stock
          </button>
          <button 
            className={`pill-btn ${activeTab === 'ipo' ? 'active' : 'inactive'}`}
            onClick={() => setActiveTab('ipo')}
          >
            IPO
          </button>
        </div>

        <button 
          className="trends-toggle-btn" 
          onClick={() => setShowTrends(!showTrends)}
        >
          Stock Trends
        </button>
      </header>

      <div className="app-layout">
        <div className="main-container">
        <div className="content-area">
          {activeTab === 'stock' && (
            <div className="fade-in">
              <h2 className="section-title">Enter Company Name</h2>
              <form onSubmit={handleStockPredict} className="center-form">
                <input 
                  type="text" 
                  className="hero-input"
                  value={ticker} 
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. RELIANCE.NS"
                  required
                />
                <button type="submit" disabled={stockLoading} className="submit-btn">
                  {stockLoading ? 'Analyzing...' : 'Predict'}
                </button>
              </form>

              {stockError && <div className="error-text">{stockError}</div>}

              {stockResult && (
                <div className={`clean-result-card fade-in ${stockResult.Prediction === 'UP' ? 'outline-green' : 'outline-red'}`}>
                  <div className="flex-row">
                    <div className="data-group">
                      <span className="data-label">Prediction</span>
                      <span className={`data-value ${stockResult.Prediction === 'UP' ? 'green' : 'red'}`}>
                        {stockResult.Prediction}
                      </span>
                    </div>
                    <div className="data-group">
                      <span className="data-label">Confidence</span>
                      <span className="data-value">{stockResult.Confidence}</span>
                    </div>
                    <div className="data-group">
                      <span className="data-label">Risk Level</span>
                      <span className="data-value">{stockResult.Risk}</span>
                    </div>
                  </div>
                  
                  <div className="reasons-list">
                    {stockResult.Reasons.map((r, i) => (
                      <div key={i} className="reason-item">{r}</div>
                    ))}
                  </div>

                  {stockResult.Metrics && (
                    <div className="metrics-section">
                      <h3 className="metrics-title">Model Performance & Analytics</h3>
                      <p className="metrics-subtitle">
                        Logistic Regression model trained on <strong>{stockResult.Metrics.train_size}</strong> trading days, 
                        validated on <strong>{stockResult.Metrics.test_size}</strong> days.
                      </p>
                      
                      <div className="metrics-grid">
                        <div className="metric-pill-card">
                          <span className="metric-val">{stockResult.Metrics.accuracy}%</span>
                          <span className="metric-name">Accuracy</span>
                        </div>
                        <div className="metric-pill-card">
                          <span className="metric-val">{stockResult.Metrics.precision}%</span>
                          <span className="metric-name">Precision</span>
                        </div>
                        <div className="metric-pill-card">
                          <span className="metric-val">{stockResult.Metrics.recall}%</span>
                          <span className="metric-name">Recall</span>
                        </div>
                        <div className="metric-pill-card">
                          <span className="metric-val">{stockResult.Metrics.f1_score}%</span>
                          <span className="metric-name">F1 Score</span>
                        </div>
                      </div>

                      <h4 className="weights-title">Logistic Regression Coefficients (Feature Impact)</h4>
                      <p className="weights-subtitle-info">
                        Positive coefficients support an <strong>UP</strong> prediction, while negative coefficients lean towards <strong>DOWN</strong>.
                      </p>
                      
                      <div className="weights-list">
                        {Object.entries(stockResult.Metrics.coefficients).map(([feat, val]) => {
                          const featureNames = {
                            'MA5': '5-Day Moving Average (MA5)',
                            'MA10': '10-Day Moving Average (MA10)',
                            'Price_Change': 'Price Momentum (Change)',
                            'Volume_Change': 'Volume Momentum (Change)'
                          };
                          const maxVal = Math.max(...Object.values(stockResult.Metrics.coefficients).map(Math.abs)) || 1;
                          const percentage = Math.min(100, Math.round((Math.abs(val) / maxVal) * 100));
                          const isPositive = val >= 0;
                          return (
                            <div key={feat} className="weight-row" title={`Coefficient weight: ${val.toFixed(6)}`}>
                              <span className="weight-feat-name">{featureNames[feat] || feat}</span>
                              <div className="weight-bar-container">
                                <div className="weight-bar-bg">
                                  <div 
                                    className={`weight-bar-fill ${isPositive ? 'bg-green' : 'bg-red'}`} 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className={`weight-val ${isPositive ? 'green' : 'red'}`}>
                                {isPositive ? '+' : ''}{val.toFixed(4)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="trending-chips-container">
                <div className="chip-row">
                  {['ZOMATO.NS', 'PAYTM.NS', 'NYKAA.NS'].map(sym => (
                    <button key={sym} type="button" className="chip-btn" onClick={() => setTicker(sym)}>{sym}</button>
                  ))}
                </div>
                <div className="chip-row">
                  {['RELIANCE.NS', 'TCS.NS'].map(sym => (
                    <button key={sym} type="button" className="chip-btn" onClick={() => setTicker(sym)}>{sym}</button>
                  ))}
                </div>
                <div className="chip-row">
                  {['AAPL', 'MSFT'].map(sym => (
                    <button key={sym} type="button" className="chip-btn" onClick={() => setTicker(sym)}>{sym}</button>
                  ))}
                </div>
                <div className="chip-row">
                  {['GOOGL'].map(sym => (
                    <button key={sym} type="button" className="chip-btn" onClick={() => setTicker(sym)}>{sym}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ipo' && (
            <div className="fade-in">
              <h2 className="section-title">IPO Details</h2>
              <form onSubmit={handleIpoEvaluate} className="clean-form">
                <div className="input-row">
                  <input type="number" step="0.1" className="standard-input" placeholder="Subscription Rate" value={subRate} onChange={e => setSubRate(e.target.value)} required />
                  <input type="number" step="0.1" className="standard-input" placeholder="GMP %" value={gmp} onChange={e => setGmp(e.target.value)} required />
                </div>
                
                <div className="input-row mt-4">
                  <select className="standard-input" value={sector} onChange={e => setSector(e.target.value)}>
                    <option>Tech startup</option>
                    <option>Banking</option>
                    <option>Energy</option>
                    <option>Infrastructure</option>
                    <option>Loss-heavy new-age</option>
                    <option>Other</option>
                  </select>
                  
                  <label className="check-wrap">
                    <input type="checkbox" checked={profitable} onChange={e => setProfitable(e.target.checked)} />
                    Company is Profitable
                  </label>
                </div>
                
                <button type="submit" disabled={ipoLoading} className="submit-btn mt-6">
                  {ipoLoading ? 'Evaluating...' : 'Evaluate'}
                </button>
              </form>

              {ipoError && <div className="error-text">{ipoError}</div>}

              {ipoResult && (
                <div className="clean-result-card fade-in">
                  <div className="data-group center-text">
                    <span className="data-label">Investment Rating</span>
                    <span className={`data-value ${ipoResult.Rating === 'Good' ? 'green' : ipoResult.Rating === 'Risky' ? 'red' : 'orange'}`}>
                      {ipoResult.Rating}
                    </span>
                  </div>
                  <div className="reasons-list">
                    {ipoResult.Reasons.map((r, i) => (
                      <div key={i} className="reason-item">{r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {showTrends && (
        <div className="floating-trends-panel fade-in">
          <div className="panel-header">
            <h4>Live Market Trends</h4>
            <button className="close-panel" onClick={() => setShowTrends(false)}>×</button>
          </div>
          {loadingTrending ? (
            <div className="side-loading">Scanning market...</div>
          ) : trendingUp.length > 0 ? (
            <div className="side-list">
              {trendingUp.map(sym => (
                <button 
                  key={sym} 
                  className="side-chip"
                  onClick={() => {
                    setActiveTab('stock');
                    setTicker(sym);
                    setShowTrends(false);
                  }}
                >
                  {sym}
                </button>
              ))}
            </div>
          ) : (
            <div className="side-loading">No strong trends found.</div>
          )}
        </div>
      )}

      {showHistory && (
        <div className="floating-history-panel fade-in">
          <div className="panel-header">
            <h4>Prediction History</h4>
            <button className="close-panel" onClick={() => setShowHistory(false)}>×</button>
          </div>
          {history.length === 0 ? (
            <div className="history-empty">No results yet.</div>
          ) : (
            <div className="history-list">
              {history.map((item, i) => (
                <div key={i} className={`history-item ${item.Prediction === 'UP' ? 'hist-up' : 'hist-down'}`}>
                  <div className="hist-top">
                    <span className="hist-sym">{item.ticker}</span>
                    <span className="hist-val">{item.Prediction}</span>
                  </div>
                  <div className="hist-meta">{item.Confidence} confidence</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
