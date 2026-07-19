from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Union, Annotated
import numpy as np
from scipy import stats

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
	"http://localhost"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA CONTRACTS ---
class NormalDist(BaseModel):
    dist_type: Literal["normal"]
    weight: float
    mean: float
    std: float

class GammaDist(BaseModel):
    dist_type: Literal["gamma"]
    weight: float
    shape: float
    scale: float

class BetaDist(BaseModel):
    dist_type: Literal["beta"]
    weight: float
    alpha: float
    beta_param: float

DistributionDef = Annotated[Union[NormalDist, GammaDist, BetaDist], Field(discriminator="dist_type")]

class SimulationRequest(BaseModel):
    distributions: List[DistributionDef]
    bound_a: float
    bound_b: float
    n_samples: int

# --- ENGINE ---
@app.post("/api/simulate")
def run_simulation(req: SimulationRequest):
    # --- FORCE WEIGHT NORMALIZATION ---
    total_weight = sum(dist.weight for dist in req.distributions)
    if total_weight <= 0:
        return {"error": "Total weight must be strictly positive."}
    
    for dist in req.distributions:
        dist.weight = dist.weight / total_weight
    # --------------------------------------------------
    # 1. DYNAMIC GRID SCALING
    x_mins = [req.bound_a]
    x_maxs = [req.bound_b]
    
    for dist in req.distributions:
        if dist.dist_type == "normal":
            x_mins.append(dist.mean - 4 * dist.std)
            x_maxs.append(dist.mean + 4 * dist.std)
        elif dist.dist_type == "gamma":
            mean = dist.shape * dist.scale
            std = np.sqrt(dist.shape * (dist.scale ** 2))
            x_mins.append(max(0, mean - 4 * std))
            x_maxs.append(mean + 4 * std)
        elif dist.dist_type == "beta":
            x_mins.append(0)
            x_maxs.append(1)
            
    global_min = min(x_mins)
    global_max = max(x_maxs)
    
    padding = (global_max - global_min) * 0.1
    if padding == 0: padding = 1.0
    
    x_grid = np.linspace(global_min - padding, global_max + padding, 1000)
    
    y_curve = np.zeros_like(x_grid)
    exact_integral = 0.0
    all_samples = []

    # 2. EVALUATION & MONTE CARLO
    for dist in req.distributions:
        n_dist_samples = int(req.n_samples * dist.weight)
        
        if dist.dist_type == "normal":
            pdf = stats.norm.pdf(x_grid, dist.mean, dist.std)
            area = stats.norm.cdf(req.bound_b, dist.mean, dist.std) - stats.norm.cdf(req.bound_a, dist.mean, dist.std)
            samples = np.random.normal(dist.mean, dist.std, n_dist_samples)
            
        elif dist.dist_type == "gamma":
            pdf = stats.gamma.pdf(x_grid, a=dist.shape, scale=dist.scale)
            area = stats.gamma.cdf(req.bound_b, a=dist.shape, scale=dist.scale) - stats.gamma.cdf(req.bound_a, a=dist.shape, scale=dist.scale)
            samples = np.random.gamma(shape=dist.shape, scale=dist.scale, size=n_dist_samples)
            
        elif dist.dist_type == "beta":
            pdf = np.nan_to_num(stats.beta.pdf(x_grid, a=dist.alpha, b=dist.beta_param), nan=0.0)
            area = stats.beta.cdf(req.bound_b, a=dist.alpha, b=dist.beta_param) - stats.beta.cdf(req.bound_a, a=dist.alpha, b=dist.beta_param)
            samples = np.random.beta(a=dist.alpha, b=dist.beta_param, size=n_dist_samples)

        y_curve += (dist.weight * pdf)
        exact_integral += (dist.weight * area)
        if len(samples) > 0:
            all_samples.append(samples)

    if all_samples:
        all_samples = np.concatenate(all_samples)
    else:
        all_samples = np.array([])

    in_bounds = np.sum((all_samples >= req.bound_a) & (all_samples <= req.bound_b))
    mc_estimate = float(in_bounds) / req.n_samples if req.n_samples > 0 else 0
    error = abs(mc_estimate - exact_integral)

    ui_samples = all_samples.copy()
    np.random.shuffle(ui_samples)

    return {
        "exact_integral": exact_integral,
        "mc_estimate": mc_estimate,
        "error": error,
        "plot_data": {
            "x_grid": x_grid.tolist(),
            "y_curve": y_curve.tolist(),
            "histogram_samples": ui_samples[:2000].tolist()
        }
    }
