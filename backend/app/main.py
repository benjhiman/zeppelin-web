from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    clientes, articulos, facturacion, cobranzas, proveedores,
    caja, bancos, vendedores, pedidos, reportes, auth, dashboard,
    compras, config
)
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zeppelin Web API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(dashboard.router,   prefix="/api/dashboard",   tags=["dashboard"])
app.include_router(clientes.router,    prefix="/api/clientes",    tags=["clientes"])
app.include_router(articulos.router,   prefix="/api/articulos",   tags=["articulos"])
app.include_router(facturacion.router, prefix="/api/facturacion", tags=["facturacion"])
app.include_router(cobranzas.router,   prefix="/api/cobranzas",   tags=["cobranzas"])
app.include_router(proveedores.router, prefix="/api/proveedores", tags=["proveedores"])
app.include_router(compras.router,     prefix="/api/compras",     tags=["compras"])
app.include_router(caja.router,        prefix="/api/caja",        tags=["caja"])
app.include_router(bancos.router,      prefix="/api/bancos",      tags=["bancos"])
app.include_router(vendedores.router,  prefix="/api/vendedores",  tags=["vendedores"])
app.include_router(pedidos.router,     prefix="/api/pedidos",     tags=["pedidos"])
app.include_router(reportes.router,    prefix="/api/reportes",    tags=["reportes"])
app.include_router(config.router,      prefix="/api/config",      tags=["config"])

@app.get("/")
def root():
    return {"status": "ok", "sistema": "Zeppelin Web"}
