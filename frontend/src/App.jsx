import { useState } from 'react'
import Plot from 'react-plotly.js'

function App() {
  // 1. DYNAMIC STATE ARRAY
  const [distributions, setDistributions] = useState([
    { id: 1, dist_type: 'normal', weight: 0.5, mean: -2.0, std: 1.5 },
    { id: 2, dist_type: 'gamma', weight: 0.5, shape: 2.0, scale: 2.0 }
  ])
  
  const [globalParams, setGlobalParams] = useState({ bound_a: -1.0, bound_b: 5.0, n_samples: 5000 })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // 2. STATE MUTATION HANDLERS
  const updateGlobal = (e) => setGlobalParams({ ...globalParams, [e.target.name]: parseFloat(e.target.value) })

  const updateDist = (id, field, value) => {
    setDistributions(distributions.map(dist => {
      if (dist.id === id) {
        // If they change the dropdown type, we must wipe the old parameters and set defaults for the new type
        if (field === 'dist_type') {
          if (value === 'normal') return { id, dist_type: 'normal', weight: dist.weight, mean: 0, std: 1 }
          if (value === 'gamma') return { id, dist_type: 'gamma', weight: dist.weight, shape: 2, scale: 2 }
          if (value === 'beta') return { id, dist_type: 'beta', weight: dist.weight, alpha: 2, beta_param: 2 }
        }
        return { ...dist, [field]: parseFloat(value) || value }
      }
      return dist
    }))
  }

  const addDistribution = () => {
    setDistributions([...distributions, { id: Date.now(), dist_type: 'normal', weight: 0.5, mean: 0, std: 1 }])
  }

  const removeDistribution = (id) => {
    if (distributions.length <= 1) return // Prevent deleting the last one
    setDistributions(distributions.filter(d => d.id !== id))
  }

  // 3. NETWORK BRIDGE
  const runSimulation = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distributions: distributions,
          bound_a: globalParams.bound_a,
          bound_b: globalParams.bound_b,
          n_samples: globalParams.n_samples
        })
      })
      const data = await response.json()
      if (response.ok) setResults(data)
      else console.error("API Error:", data)
    } catch (error) {
      console.error("Network error:", error)
    }
    setLoading(false)
  }

  // 4. RENDER
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Polymorphic N-Distribution Integration Engine</h2>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* CONTROLS PANEL */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
            <h4>Global Parameters</h4>
            <label>Lower Bound (a): <input type="number" name="bound_a" value={globalParams.bound_a} onChange={updateGlobal}/></label><br/>
            <label>Upper Bound (b): <input type="number" name="bound_b" value={globalParams.bound_b} onChange={updateGlobal}/></label><br/>
            <label>Samples (N): <input type="number" name="n_samples" value={globalParams.n_samples} step="1000" onChange={updateGlobal}/></label>
          </div>

          {distributions.map((dist, index) => (
            <div key={dist.id} style={{ background: '#e8eaf6', padding: '15px', borderRadius: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Dist {index + 1}</strong>
                <button onClick={() => removeDistribution(dist.id)} style={{ color: 'red' }}>X</button>
              </div>
              
              <select 
                value={dist.dist_type} 
                onChange={(e) => updateDist(dist.id, 'dist_type', e.target.value)}
                style={{ width: '100%', margin: '10px 0' }}
              >
                <option value="normal">Normal</option>
                <option value="gamma">Gamma</option>
                <option value="beta">Beta</option>
              </select>

              <label>Weight: <input type="number" step="0.1" value={dist.weight} onChange={(e) => updateDist(dist.id, 'weight', e.target.value)}/></label><br/>

              {/* CONDITIONAL RENDERING BASED ON TYPE */}
              {dist.dist_type === 'normal' && (
                <>
                  <label>Mean: <input type="number" step="0.5" value={dist.mean} onChange={(e) => updateDist(dist.id, 'mean', e.target.value)}/></label><br/>
                  <label>Std Dev: <input type="number" step="0.1" value={dist.std} onChange={(e) => updateDist(dist.id, 'std', e.target.value)}/></label>
                </>
              )}
              {dist.dist_type === 'gamma' && (
                <>
                  <label>Shape (k): <input type="number" step="0.5" value={dist.shape} onChange={(e) => updateDist(dist.id, 'shape', e.target.value)}/></label><br/>
                  <label>Scale (θ): <input type="number" step="0.5" value={dist.scale} onChange={(e) => updateDist(dist.id, 'scale', e.target.value)}/></label>
                </>
              )}
              {dist.dist_type === 'beta' && (
                <>
                  <label>Alpha (α): <input type="number" step="0.5" value={dist.alpha} onChange={(e) => updateDist(dist.id, 'alpha', e.target.value)}/></label><br/>
                  <label>Beta (β): <input type="number" step="0.5" value={dist.beta_param} onChange={(e) => updateDist(dist.id, 'beta_param', e.target.value)}/></label>
                </>
              )}
            </div>
          ))}

          <button onClick={addDistribution} style={{ padding: '8px' }}>+ Add Distribution</button>
          <button onClick={runSimulation} disabled={loading} style={{ padding: '15px', background: '#4CAF50', color: 'white', fontWeight: 'bold' }}>
            {loading ? "Computing..." : "Run N-Simulation"}
          </button>
        </div>

        {/* VISUALIZATION PANEL */}
        <div style={{ flex: 1 }}>
          {results && (
            <>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                <div style={{ padding: '15px', background: '#e0f7fa', borderRadius: '5px', flex: 1 }}>
                  <strong>Exact Integral:</strong> {results.exact_integral.toFixed(5)}
                </div>
                <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '5px', flex: 1 }}>
                  <strong>MC Estimate:</strong> {results.mc_estimate.toFixed(5)}
                </div>
                <div style={{ padding: '15px', background: '#ffebee', borderRadius: '5px', flex: 1 }}>
                  <strong>Error:</strong> {results.error.toFixed(6)}
                </div>
              </div>

	      <Plot
                data={[
                  {
                    x: results.plot_data.histogram_samples,
                    type: 'histogram',
                    histnorm: 'probability density',
                    name: 'Stochastic Sample',
                    opacity: 0.6,
                    marker: { color: '#5c6bc0' },
                    xbins: { size: 0.1 } // FORCES 0.1 BIN WIDTH
                  },
                  {
                    x: results.plot_data.x_grid,
                    y: results.plot_data.y_curve,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Theoretical Sum',
                    line: { color: '#d32f2f', width: 3 }
                  }
                ]}
                layout={{ 
                  title: 'Polymorphic Mixture Distribution', 
                  width: 700, 
                  height: 500, 
                  barmode: 'overlay',
                  // VISUALIZES THE INTEGRATION BOUNDS
                  shapes: [
                    {
                      type: 'rect',
                      xref: 'x',
                      yref: 'paper', // Maps Y from 0 (bottom) to 1 (top of chart)
                      x0: globalParams.bound_a,
                      x1: globalParams.bound_b,
                      y0: 0,
                      y1: 1,
                      fillcolor: 'rgba(76, 175, 80, 0.2)', // Semi-transparent green
                      line: { width: 1, color: 'rgba(76, 175, 80, 0.5)' }
                    }
                  ]
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
