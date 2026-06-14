from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Articulo, Marca, Rubro, MovStock
from datetime import date

router = APIRouter()

class ArticuloIn(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    nombre2: Optional[str] = None
    marca_id: Optional[int] = None
    rubro_id: Optional[int] = None
    subrubro_id: Optional[int] = None
    precio1: float = 0
    precio2: float = 0
    precio3: float = 0
    precio4: float = 0
    precio5: float = 0
    costo: float = 0
    stock_act: float = 0
    stock_min: float = 0
    unimed: str = "u."
    iva: str = "1"
    cod_ext: Optional[str] = None
    observaciones: Optional[str] = None

def art_dict(a):
    return {
        "id": a.id, "codigo": a.codigo, "nombre": a.nombre, "nombre2": a.nombre2,
        "marca_id": a.marca_id, "rubro_id": a.rubro_id,
        "marca_nombre": a.marca.nombre if a.marca else None,
        "rubro_nombre": a.rubro.nombre if a.rubro else None,
        "precio1": float(a.precio1 or 0), "precio2": float(a.precio2 or 0),
        "precio3": float(a.precio3 or 0), "precio4": float(a.precio4 or 0),
        "precio5": float(a.precio5 or 0), "costo": float(a.costo or 0),
        "stock_act": float(a.stock_act or 0), "stock_min": float(a.stock_min or 0),
        "unimed": a.unimed, "iva": a.iva, "cod_ext": a.cod_ext,
        "bloqueado": a.bloqueado, "activo": a.activo,
        "stock_estado": "critico" if float(a.stock_act or 0) <= 0 else
                        "bajo" if float(a.stock_act or 0) <= float(a.stock_min or 0) else "ok"
    }

@router.get("/")
def listar(
    q: Optional[str] = Query(None),
    rubro_id: Optional[int] = None,
    marca_id: Optional[int] = None,
    stock_bajo: bool = False,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Articulo).filter(Articulo.activo == True)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Articulo.nombre.ilike(like), Articulo.codigo.ilike(like), Articulo.cod_ext.ilike(like)))
    if rubro_id:
        query = query.filter(Articulo.rubro_id == rubro_id)
    if marca_id:
        query = query.filter(Articulo.marca_id == marca_id)
    if stock_bajo:
        query = query.filter(Articulo.stock_act <= Articulo.stock_min, Articulo.stock_min > 0)
    total = query.count()
    rows = query.order_by(Articulo.nombre).offset(skip).limit(limit).all()
    return {"total": total, "items": [art_dict(a) for a in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Articulo).filter(Articulo.id == id).first()
    if not a:
        raise HTTPException(404, "Artículo no encontrado")
    return art_dict(a)

@router.post("/")
def crear(data: ArticuloIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if data.codigo and db.query(Articulo).filter(Articulo.codigo == data.codigo).first():
        raise HTTPException(400, "Código ya existe")
    a = Articulo(**data.dict())
    db.add(a)
    db.commit()
    db.refresh(a)
    return art_dict(a)

@router.put("/{id}")
def actualizar(id: int, data: ArticuloIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Articulo).filter(Articulo.id == id).first()
    if not a:
        raise HTTPException(404)
    for k, v in data.dict(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    return art_dict(a)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = db.query(Articulo).filter(Articulo.id == id).first()
    if not a:
        raise HTTPException(404)
    a.activo = False
    db.commit()
    return {"ok": True}

@router.get("/{id}/movimientos")
def movimientos(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(MovStock).filter(MovStock.articulo_id == id).order_by(MovStock.fecha.desc()).limit(30).all()
    return [{"fecha": str(r.fecha), "tipo": r.tipo, "cantidad": float(r.cantidad), "comprobante": r.comprobante, "nro": r.nro_comp} for r in rows]

@router.get("/maestros/marcas")
def marcas(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [{"id": m.id, "codigo": m.codigo, "nombre": m.nombre} for m in db.query(Marca).filter(Marca.activo == True).all()]

@router.get("/maestros/rubros")
def rubros(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [{"id": r.id, "codigo": r.codigo, "nombre": r.nombre} for r in db.query(Rubro).filter(Rubro.activo == True).all()]
