from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Banco, MovBanco

router = APIRouter()

class BancoIn(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    nro_cta: Optional[str] = None
    tipo: Optional[str] = "C"
    moneda: Optional[str] = "$"

class MovBancoIn(BaseModel):
    banco_id: int
    fecha: date
    concepto: str
    tipo: str  # D=debito C=credito
    importe: float
    comprobante: Optional[str] = None

def banco_dict(b):
    return {"id": b.id, "codigo": b.codigo, "nombre": b.nombre,
            "nro_cta": b.nro_cta, "tipo": b.tipo, "moneda": b.moneda,
            "saldo": float(b.saldo or 0), "activo": b.activo}

@router.get("/")
def listar(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(Banco).filter(Banco.activo == True).all()
    return [banco_dict(b) for b in rows]

@router.post("/")
def crear(data: BancoIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = Banco(**data.dict())
    db.add(b)
    db.commit()
    db.refresh(b)
    return banco_dict(b)

@router.get("/{id}/movimientos")
def movimientos(id: int, skip: int = 0, limit: int = 50,
                db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(MovBanco).filter(MovBanco.banco_id == id).order_by(MovBanco.fecha.desc()).offset(skip).limit(limit).all()
    return [{"id": r.id, "fecha": str(r.fecha), "concepto": r.concepto,
             "tipo": r.tipo, "importe": float(r.importe), "comprobante": r.comprobante} for r in rows]

@router.post("/movimiento")
def agregar_movimiento(data: MovBancoIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    banco = db.query(Banco).filter(Banco.id == data.banco_id).first()
    if not banco:
        raise HTTPException(404)
    mov = MovBanco(**data.dict())
    db.add(mov)
    if data.tipo == "C":
        banco.saldo = float(banco.saldo or 0) + data.importe
    else:
        banco.saldo = float(banco.saldo or 0) - data.importe
    db.commit()
    return {"ok": True}
