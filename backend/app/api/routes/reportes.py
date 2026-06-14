from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Comprobante, ItemComprobante, Articulo, Vendedor, Cliente, MovCaja

router = APIRouter()

@router.get("/ventas-por-vendedor")
def ventas_por_vendedor(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    hoy = date.today()
    fecha_desde = fecha_desde or hoy.replace(day=1)
    fecha_hasta = fecha_hasta or hoy

    rows = db.query(
        Vendedor.nombre,
        func.count(Comprobante.id).label("cantidad"),
        func.coalesce(func.sum(Comprobante.total), 0).label("total")
    ).join(Comprobante, Comprobante.vendedor_id == Vendedor.id, isouter=True).filter(
        Comprobante.fecha >= fecha_desde,
        Comprobante.fecha <= fecha_hasta,
        Comprobante.tipo.in_(["FA", "FB", "FC"]),
        Comprobante.estado != "A"
    ).group_by(Vendedor.id, Vendedor.nombre).order_by(func.sum(Comprobante.total).desc()).all()

    return [{"vendedor": r.nombre, "cantidad": r.cantidad, "total": float(r.total)} for r in rows]

@router.get("/articulos-mas-vendidos")
def articulos_mas_vendidos(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    limit: int = 20,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    hoy = date.today()
    fecha_desde = fecha_desde or hoy.replace(day=1)
    fecha_hasta = fecha_hasta or hoy

    rows = db.query(
        Articulo.codigo, Articulo.nombre,
        func.coalesce(func.sum(ItemComprobante.cantidad), 0).label("cantidad"),
        func.coalesce(func.sum(ItemComprobante.subtotal), 0).label("total")
    ).join(ItemComprobante, ItemComprobante.articulo_id == Articulo.id)\
     .join(Comprobante, Comprobante.id == ItemComprobante.comprobante_id)\
     .filter(
        Comprobante.fecha >= fecha_desde,
        Comprobante.fecha <= fecha_hasta,
        Comprobante.tipo.in_(["FA", "FB", "FC"]),
        Comprobante.estado != "A"
    ).group_by(Articulo.id, Articulo.codigo, Articulo.nombre)\
     .order_by(func.sum(ItemComprobante.subtotal).desc()).limit(limit).all()

    return [{"codigo": r.codigo, "nombre": r.nombre,
             "cantidad": float(r.cantidad), "total": float(r.total)} for r in rows]

@router.get("/iva-ventas")
def iva_ventas(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    hoy = date.today()
    fecha_desde = fecha_desde or hoy.replace(day=1)
    fecha_hasta = fecha_hasta or hoy

    rows = db.query(Comprobante).filter(
        Comprobante.fecha >= fecha_desde,
        Comprobante.fecha <= fecha_hasta,
        Comprobante.tipo.in_(["FA", "FB", "FC"]),
        Comprobante.estado != "A"
    ).order_by(Comprobante.fecha, Comprobante.numero).all()

    return [
        {
            "fecha": str(r.fecha),
            "tipo": r.tipo,
            "pto_vta": r.pto_vta,
            "numero": r.numero,
            "cliente": r.cliente.nombre if r.cliente else "-",
            "cuit": r.cliente.cuit if r.cliente else "-",
            "tipo_iva_cliente": r.cliente.tipo_iva if r.cliente else "-",
            "neto": float(r.neto or 0),
            "iva21": float(r.iva21 or 0),
            "iva105": float(r.iva105 or 0),
            "total": float(r.total or 0),
        }
        for r in rows
    ]

@router.get("/cuenta-corriente-clientes")
def cta_cte_clientes(
    solo_deudores: bool = True,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Cliente).filter(Cliente.activo == True)
    if solo_deudores:
        query = query.filter(Cliente.saldo > 0)
    rows = query.order_by(Cliente.saldo.desc()).all()
    return [
        {"id": r.id, "codigo": r.codigo, "nombre": r.nombre,
         "saldo": float(r.saldo or 0), "telefono": r.telefono,
         "vendedor_id": r.vendedor_id}
        for r in rows
    ]

@router.get("/caja-diaria")
def caja_diaria(
    fecha: Optional[date] = None,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    fecha = fecha or date.today()
    rows = db.query(MovCaja).filter(MovCaja.fecha == fecha).order_by(MovCaja.id).all()

    ingresos = sum(float(r.importe) for r in rows if r.tipo == "I")
    egresos = sum(float(r.importe) for r in rows if r.tipo == "E")

    return {
        "fecha": str(fecha),
        "ingresos": ingresos,
        "egresos": egresos,
        "saldo": ingresos - egresos,
        "movimientos": [
            {"id": r.id, "tipo": r.tipo, "medio": r.medio,
             "concepto": r.concepto, "importe": float(r.importe)}
            for r in rows
        ]
    }
