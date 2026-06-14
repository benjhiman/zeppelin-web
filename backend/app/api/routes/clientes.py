from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Cliente

router = APIRouter()

class ClienteIn(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    comercial: Optional[str] = None
    direc: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codpos: Optional[str] = None
    telefono: Optional[str] = None
    telefono2: Optional[str] = None
    celular: Optional[str] = None
    email: Optional[str] = None
    contacto: Optional[str] = None
    zona: Optional[str] = None
    vendedor_id: Optional[str] = None
    cobrador_id: Optional[str] = None
    categoria: Optional[str] = None
    condicion: Optional[str] = None
    cuit: Optional[str] = None
    tipo_iva: Optional[str] = "RI"
    lista_pre: Optional[str] = "1"
    credito: Optional[float] = 0
    boni1: Optional[float] = 0
    boni2: Optional[float] = 0
    comentario: Optional[str] = None
    obs1: Optional[str] = None
    obs2: Optional[str] = None

def cliente_dict(c):
    return {
        "id": c.id, "codigo": c.codigo, "nombre": c.nombre,
        "comercial": c.comercial, "direc": c.direc, "localidad": c.localidad,
        "provincia": c.provincia, "codpos": c.codpos, "telefono": c.telefono,
        "telefono2": c.telefono2, "celular": c.celular, "email": c.email,
        "contacto": c.contacto, "zona": c.zona, "vendedor_id": c.vendedor_id,
        "cobrador_id": c.cobrador_id, "categoria": c.categoria,
        "condicion": c.condicion, "cuit": c.cuit, "tipo_iva": c.tipo_iva,
        "lista_pre": c.lista_pre, "credito": float(c.credito or 0),
        "saldo": float(c.saldo or 0), "boni1": float(c.boni1 or 0),
        "boni2": float(c.boni2 or 0), "bloqueo": c.bloqueo,
        "comentario": c.comentario, "obs1": c.obs1, "obs2": c.obs2,
        "fe_ingre": str(c.fe_ingre) if c.fe_ingre else None,
        "ult_ope": str(c.ult_ope) if c.ult_ope else None,
        "activo": c.activo,
    }

@router.get("/")
def listar(
    q: Optional[str] = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    query = db.query(Cliente).filter(Cliente.activo == True)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            Cliente.nombre.ilike(like),
            Cliente.comercial.ilike(like),
            Cliente.cuit.ilike(like),
            Cliente.codigo.ilike(like),
            Cliente.localidad.ilike(like),
        ))
    total = query.count()
    rows = query.order_by(Cliente.nombre).offset(skip).limit(limit).all()
    return {"total": total, "items": [cliente_dict(c) for c in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    return cliente_dict(c)

@router.post("/")
def crear(data: ClienteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not data.codigo:
        ultimo = db.query(func.max(Cliente.codigo)).scalar()
        data.codigo = str(int(ultimo or "0") + 1).zfill(5)
    if db.query(Cliente).filter(Cliente.codigo == data.codigo).first():
        raise HTTPException(400, "Código ya existe")
    c = Cliente(**data.dict(), fe_ingre=date.today())
    db.add(c)
    db.commit()
    db.refresh(c)
    return cliente_dict(c)

@router.put("/{id}")
def actualizar(id: int, data: ClienteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    return cliente_dict(c)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Cliente).filter(Cliente.id == id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    c.activo = False
    db.commit()
    return {"ok": True}

@router.get("/{id}/cuenta-corriente")
def cuenta_corriente(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from app.models.models import CtaCliente
    rows = db.query(CtaCliente).filter(CtaCliente.cliente_id == id).order_by(CtaCliente.fecha.desc()).limit(50).all()
    return [
        {"id": r.id, "fecha": str(r.fecha), "tipo": r.tipo, "comprobante": r.comprobante,
         "nro_comp": r.nro_comp, "importe": float(r.importe), "saldo": float(r.saldo), "cancelado": r.cancelado}
        for r in rows
    ]
