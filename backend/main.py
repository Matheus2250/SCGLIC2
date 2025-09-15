from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, planejamento, qualificacao, licitacao, reports
from app.core.config import settings

app = FastAPI(
    title="Sistema de Gestão de Contratações Públicas",
    description="API para gerenciamento completo do ciclo de contratações públicas",
    version="1.0.0"
)

# CONFIGURAÇÃO CORS - CRÍTICO! - SERVIDOR CENTRAL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server local
        "http://localhost:3001",  # Vite dev server (alternate port)
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001", 
        "http://127.0.0.1:5173",
        "http://10.255.66.242:3000",  # Seu IP na rede
        "http://10.255.66.242:3001",
        "http://10.255.66.242:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (GET, POST, PUT, DELETE, etc)
    allow_headers=["*"],  # Permite todos os headers
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(planejamento.router, prefix="/api/v1/pca", tags=["planejamento"])
app.include_router(qualificacao.router, prefix="/api/v1/qualificacao", tags=["qualificacao"])
app.include_router(licitacao.router, prefix="/api/v1/licitacao", tags=["licitacao"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])


@app.get("/")
async def root():
    return {"message": "Sistema de Gestão de Contratações Públicas API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)