from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Compra, ItemCompra, Articulo, Proveedor, MovStock

router = APIRouter()

class ItemCompraIn(BaseModel):
    articulo_id: Optional[int] = None
    descripcion: Optional[str] = None
    cantidad: float = 1
    precio_unit: float = 0

class CompraIn(BaseModel):
    tipo: str = "FC"
    numero: Optional[str] = None
    fecha: date
    proveedor_id: int
    observaciones: Optional[str] = None
    items: List[ItemCompraIn]

def compra_dict(c, include_items=False):
    d = {
        "id": c.id, "tipo": c.tipo, "numero": c.numero,
        "fecha": str(c.fecha),
        "proveedor_id": c.proveedor_id,
        "proveedor_nombre": c.proveedor.nombre if c.proveedor else "—",
        "neto": float(c.neto or 0), "iva21": float(c.iva21 or 0),
        "iva105": float(c.iva105 or 0), "total": float(c.total or 0),
        "estado": c.estado, "observaciones": c.observaciones,
    }
    if include_items:
        d["items"] = [
            {
                "id": i.id,
                "articulo_id": i.articulo_id,
                "descripcion": i.descripcion or (i.articulo.nombre if i.articulo else ""),
                "cantidad": float(i.cantidad),
                "precio_unit": float(i.precio_unit),
                "subtotal": float(i.subtotal),
            }
            for i in c.items
        ]
    return d

@router.get("/")
def listar(
    proveedor_id: Optional[int] = None,
    estado: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Compra)
    if proveedor_id:
        query = query.filter(Compra.proveedor_id == proveedor_id)
    if estado:
        query = query.filter(Compra.estado == estado)
    total = query.count()
    rows = query.order_by(Compra.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [compra_dict(c) for c in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Compra).filter(Compra.id == id).first()
    if not c:
        raise HTTPException(404)
    return compra_dict(c, include_items=True)

@router.post("/")
def crear(data: CompraIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    neto = sum(i.cantidad * i.precio_unit for i in data.items)
    iva21 = round(neto * 0.21, 4)
    total = round(neto + iva21, 4)

    c = Compra(
        tipo=data.tipo, numero=data.numero, fecha=data.fecha,
        proveedor_id=data.proveedor_id, neto=neto, iva21=iva21,
        total=total, observaciones=data.observaciones, estado="P"
    )
    db.add(c)
    db.flush()

    for it in data.items:
        sub = round(it.cantidad * it.precio_unit, 4)
        item = ItemCompra(
            compra_id=c.id, articulo_id=it.articulo_id,
            descripcion=it.descripcion, cantidad=it.cantidad,
            precio_unit=it.precio_unit, subtotal=sub
        )
        db.add(item)
        if it.articulo_id:
            art = db.query(Articulo).filter(Articulo.id == it.articulo_id).first()
            if art:
                art.stock_act += it.cantidad
                if it.precio_unit > 0:
                    art.costo = it.precio_unit
                mov = MovStock(
                    fecha=data.fecha, articulo_id=it.articulo_id, tipo="C",
                    cantidad=it.cantidad, comprobante=data.tipo,
                    usuario=user.username
                )
                db.add(mov)

    prov = db.query(Proveedor).filter(Proveedor.id == data.proveedor_id).first()
    if prov:
        prov.saldo = float(prov.saldo or 0) + total

    db.commit()
    db.refresh(c)
    return compra_dict(c, include_items=True)

@router.post("/{id}/pagar")
def pagar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Compra).filter(Compra.id == id).first()
    if not c:
        raise HTTPException(404)
    c.estado = "G"
    prov = db.query(Proveedor).filter(Proveedor.id == c.proveedor_id).first()
    if prov:
        prov.saldo = max(0, float(prov.saldo or 0) - float(c.total))
    db.commit()
    return {"ok": True}
