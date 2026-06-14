from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Pedido, ItemPedido, Articulo

router = APIRouter()

class ItemPedidoIn(BaseModel):
    articulo_id: int
    cantidad: float
    precio: float

class PedidoIn(BaseModel):
    fecha: date
    cliente_id: int
    vendedor_id: Optional[int] = None
    observaciones: Optional[str] = None
    items: List[ItemPedidoIn]

def ped_dict(p, include_items=False):
    d = {
        "id": p.id, "numero": p.numero,
        "fecha": str(p.fecha), "cliente_id": p.cliente_id,
        "cliente_nombre": p.cliente.nombre if p.cliente else "-",
        "vendedor_id": p.vendedor_id,
        "vendedor_nombre": p.vendedor.nombre if p.vendedor else "-",
        "total": float(p.total or 0), "estado": p.estado,
        "observaciones": p.observaciones,
    }
    if include_items:
        d["items"] = [
            {"id": i.id, "articulo_id": i.articulo_id,
             "articulo_nombre": i.articulo.nombre if i.articulo else "-",
             "cantidad": float(i.cantidad), "precio": float(i.precio),
             "subtotal": float(i.subtotal)}
            for i in p.items
        ]
    return d

@router.get("/")
def listar(
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Pedido)
    if estado:
        query = query.filter(Pedido.estado == estado)
    if cliente_id:
        query = query.filter(Pedido.cliente_id == cliente_id)
    total = query.count()
    rows = query.order_by(Pedido.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [ped_dict(p) for p in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Pedido).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(404)
    return ped_dict(p, include_items=True)

@router.post("/")
def crear(data: PedidoIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    ultimo = db.query(func.max(Pedido.numero)).scalar()
    numero = (ultimo or 0) + 1
    total = sum(i.cantidad * i.precio for i in data.items)
    p = Pedido(numero=numero, fecha=data.fecha, cliente_id=data.cliente_id,
               vendedor_id=data.vendedor_id, total=total,
               observaciones=data.observaciones, estado="N")
    db.add(p)
    db.flush()
    for it in data.items:
        item = ItemPedido(pedido_id=p.id, articulo_id=it.articulo_id,
                          cantidad=it.cantidad, precio=it.precio,
                          subtotal=round(it.cantidad * it.precio, 4))
        db.add(item)
    db.commit()
    db.refresh(p)
    return ped_dict(p, include_items=True)

@router.put("/{id}/estado")
def cambiar_estado(id: int, estado: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Pedido).filter(Pedido.id == id).first()
    if not p:
        raise HTTPException(404)
    p.estado = estado
    db.commit()
    return {"ok": True}
