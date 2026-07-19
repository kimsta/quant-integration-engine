# Quantitative Integration Engine

A full-stack, polymorphic Monte Carlo integration engine built to evaluate complex probability mixture models. 

Unlike standard deterministic scripts, this application dynamically routes integration logic across continuous members of the exponential family (Normal, Gamma, Beta) using a REST API and a decoupled React frontend.

## System Architecture

The project is structured as an orchestrated microservice stack:

1. **Compute Engine (Backend):** Built with FastAPI and SciPy. Implements a strictly typed Pydantic V2 Discriminated Union to enforce mathematical parameters before execution. Enforces probability axioms via relative weight normalization.
2. **Interactive UI (Frontend):** Built with React and Vite. Manages dynamic state arrays to conditionally render input fields based on the selected distribution type. Leverages Plotly.js for high-resolution density plotting and stochastic sample visualization.
3. **Deployment (Docker):** Utilizes a multi-stage Docker build to compile the React SPA into static assets served via Nginx. Both services are bridged on a unified docker-compose network with explicit CORS routing.

## Local Execution

Ensure you have Docker installed.

```bash
git clone [https://github.com/kimsta/quant-integration-engine.git](https://github.com/kimsta/quant-integration-engine.git)
cd quant-integration-engine
docker compose up --build
```

Access the UI at http://localhost and the API documentation at http://localhost:8000/docs.
