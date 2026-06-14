from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Vendedor, Comprobante

router = APIRouter()

class VendedorIn(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    direc: Optional[str] = None
    localidad: Optional[str] = None
    telefono: Optional[str] = None
    comision: float = 0

def vend_dict(v):
    return {"id": v.id, "codigo": v.codigo, "nombre": v.nombre,
            "direc": v.direc, "localidad": v.localidad,
            "telefono": v.telefono, "comision": float(v.comision or 0), "activo": v.activo}

@router.get("/")
def listar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Vendedor).filter(Vendedor.activo == True).order_by(Vendedor.nombre).all()
    return [vend_dict(v) for v in rows]

@router.post("/")
def crear(data: VendedorIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not data.codigo:
        ultimo = db.query(func.max(Vendedor.codigo)).scalar()
        data.codigo = str(int(ultimo or "0") + 1).zfill(2)
    v = Vendedor(**data.dict())
    db.add(v)
    db.commit()
    db.refresh(v)
    return vend_dict(v)

@router.put("/{id}")
def actualizar(id: int, data: VendedorIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    v = db.query(Vendedor).filter(Vendedor.id == id).first()
    if not v:
        raise HTTPException(404)
    for k, val in data.dict(exclude_unset=True).items():
        setattr(v, k, val)
    db.commit()
    return vend_dict(v)

@router.get("/{id}/ventas")
def ventas(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    hoy = date.today()
    primer_dia = hoy.replace(day=1)
    total_mes = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.vendedor_id == id,
        Comprobante.fecha >= primer_dia,
        Comprobante.tipo.in_(["FA", "FB", "FC"]),
        Comprobante.estado != "A"
    ).scalar()
    return {"vendedor_id": id, "ventas_mes": float(total_mes)}
