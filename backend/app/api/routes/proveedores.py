from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Proveedor

router = APIRouter()

class ProveedorIn(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    direc: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codpos: Optional[str] = None
    telefono: Optional[str] = None
    cuit: Optional[str] = None
    tipo_iva: Optional[str] = "RI"
    contacto: Optional[str] = None

def prov_dict(p):
    return {
        "id": p.id, "codigo": p.codigo, "nombre": p.nombre,
        "direc": p.direc, "localidad": p.localidad, "provincia": p.provincia,
        "telefono": p.telefono, "cuit": p.cuit, "tipo_iva": p.tipo_iva,
        "contacto": p.contacto, "saldo": float(p.saldo or 0), "activo": p.activo,
    }

@router.get("/")
def listar(q: Optional[str] = Query(None), skip: int = 0, limit: int = 50,
           db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(Proveedor).filter(Proveedor.activo == True)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Proveedor.nombre.ilike(like), Proveedor.cuit.ilike(like), Proveedor.codigo.ilike(like)))
    total = query.count()
    rows = query.order_by(Proveedor.nombre).offset(skip).limit(limit).all()
    return {"total": total, "items": [prov_dict(p) for p in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not p:
        raise HTTPException(404)
    return prov_dict(p)

@router.post("/")
def crear(data: ProveedorIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not data.codigo:
        ultimo = db.query(func.max(Proveedor.codigo)).scalar()
        data.codigo = str(int(ultimo or "0") + 1).zfill(5)
    p = Proveedor(**data.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return prov_dict(p)

@router.put("/{id}")
def actualizar(id: int, data: ProveedorIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not p:
        raise HTTPException(404)
    for k, v in data.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    return prov_dict(p)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.query(Proveedor).filter(Proveedor.id == id).first()
    if not p:
        raise HTTPException(404)
    p.activo = False
    db.commit()
    return {"ok": True}
