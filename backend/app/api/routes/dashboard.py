from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Cliente, Comprobante, Articulo, MovCaja, CtaCliente

router = APIRouter()

@router.get("/kpis")
def get_kpis(db: Session = Depends(get_db), user=Depends(get_current_user)):
    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)

    ventas_mes = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.fecha >= primer_dia_mes,
        Comprobante.tipo.in_(["FA", "FB", "FC"]),
        Comprobante.estado != "A"
    ).scalar()

    clientes_activos = db.query(func.count(Cliente.id)).filter(Cliente.activo == True).scalar()

    articulos_total = db.query(func.count(Articulo.id)).filter(Articulo.activo == True).scalar()
    stock_bajo = db.query(func.count(Articulo.id)).filter(
        Articulo.activo == True,
        Articulo.stock_act <= Articulo.stock_min,
        Articulo.stock_min > 0
    ).scalar()

    cobranzas_pendientes = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.estado == "P",
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).scalar()

    comp_pendientes = db.query(func.count(Comprobante.id)).filter(
        Comprobante.estado == "P",
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).scalar()

    return {
        "ventas_mes": float(ventas_mes),
        "clientes_activos": clientes_activos,
        "articulos_total": articulos_total,
        "stock_bajo": stock_bajo,
        "cobranzas_pendientes": float(cobranzas_pendientes),
        "comp_pendientes": comp_pendientes,
    }

@router.get("/ultimas-facturas")
def ultimas_facturas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Comprobante).filter(
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).order_by(Comprobante.id.desc()).limit(8).all()
    return [
        {
            "id": r.id,
            "numero": f"{r.tipo}-{str(r.numero).zfill(5)}",
            "cliente": r.cliente.nombre if r.cliente else "-",
            "fecha": str(r.fecha),
            "total": float(r.total),
            "estado": r.estado,
        }
        for r in rows
    ]

@router.get("/stock-bajo")
def stock_bajo(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Articulo).filter(
        Articulo.activo == True,
        Articulo.stock_act <= Articulo.stock_min,
        Articulo.stock_min > 0
    ).order_by(Articulo.stock_act).limit(10).all()
    return [
        {"codigo": r.codigo, "nombre": r.nombre, "stock": float(r.stock_act), "minimo": float(r.stock_min)}
        for r in rows
    ]
