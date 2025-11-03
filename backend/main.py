from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, planejamento, qualificacao, licitacao, reports, access_requests
from app.core.config import settings

app = FastAPI(
    title="Sistema de Gestão de Contratações Públicas",
    description="API para gerenciamento completo do ciclo de contratações públicas",
    version="1.0.0"
)

# CONFIGURAÇÃO CORS MAIS PERMISSIVA PARA RENDER
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(planejamento.router, prefix="/api/v1/pca", tags=["planejamento"])
app.include_router(qualificacao.router, prefix="/api/v1/qualificacao", tags=["qualificacao"])
app.include_router(licitacao.router, prefix="/api/v1/licitacao", tags=["licitacao"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(access_requests.router, prefix="/api/v1/access-requests", tags=["access-requests"])


@app.get("/")
async def root():
    return {"message": "Sistema de Gestão de Contratações Públicas API", "version": "1.0.1"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Static files (e.g., avatars)
app.mount("/static", StaticFiles(directory="static"), name="static")




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
