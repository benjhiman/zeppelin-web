from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import MovCaja

router = APIRouter()

class MovCajaIn(BaseModel):
    fecha: date
    tipo: str   # I=ingreso E=egreso
    medio: str  # EF, CH, TJ, TR
    concepto: str
    importe: float
    comprobante: Optional[str] = None

@router.get("/")
def listar(
    fecha: Optional[date] = None,
    tipo: Optional[str] = None,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(MovCaja)
    if fecha:
        query = query.filter(MovCaja.fecha == fecha)
    if tipo:
        query = query.filter(MovCaja.tipo == tipo)
    total = query.count()
    rows = query.order_by(MovCaja.id.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "items": [
            {
                "id": r.id, "fecha": str(r.fecha), "tipo": r.tipo,
                "medio": r.medio, "concepto": r.concepto,
                "importe": float(r.importe), "comprobante": r.comprobante,
                "usuario": r.usuario,
            }
            for r in rows
        ]
    }

@router.get("/saldo")
def saldo(db: Session = Depends(get_db), user=Depends(get_current_user)):
    medios = ["EF", "CH", "TJ", "TR"]
    result = {}
    for medio in medios:
        ing = db.query(func.coalesce(func.sum(MovCaja.importe), 0)).filter(
            MovCaja.tipo == "I", MovCaja.medio == medio).scalar()
        egr = db.query(func.coalesce(func.sum(MovCaja.importe), 0)).filter(
            MovCaja.tipo == "E", MovCaja.medio == medio).scalar()
        result[medio] = round(float(ing) - float(egr), 2)
    result["total"] = round(sum(result.values()), 2)
    return result

@router.post("/")
def crear(data: MovCajaIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    mov = MovCaja(**data.dict(), usuario=user.username)
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return {"id": mov.id, "ok": True}
