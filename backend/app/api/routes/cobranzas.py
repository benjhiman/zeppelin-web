from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Comprobante, CtaCliente, Cliente, MovCaja

router = APIRouter()

class PagoItem(BaseModel):
    medio: str  # EF, CH, TJ, TR
    importe: float
    referencia: Optional[str] = None

class CobranzaIn(BaseModel):
    cliente_id: int
    fecha: date
    comprobante_ids: List[int]
    pagos: List[PagoItem]
    observaciones: Optional[str] = None

@router.get("/pendientes")
def pendientes(
    cliente_id: Optional[int] = None,
    vencidas: bool = False,
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Comprobante).filter(
        Comprobante.estado == "P",
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    )
    if cliente_id:
        query = query.filter(Comprobante.cliente_id == cliente_id)
    total = query.count()
    rows = query.order_by(Comprobante.fecha).offset(skip).limit(limit).all()
    return {
        "total": total,
        "total_importe": float(sum(r.total for r in rows)),
        "items": [
            {
                "id": r.id,
                "numero_fmt": f"{r.tipo}-{str(r.pto_vta).zfill(4)}-{str(r.numero).zfill(8)}",
                "tipo": r.tipo,
                "fecha": str(r.fecha),
                "cliente_id": r.cliente_id,
                "cliente_nombre": r.cliente.nombre if r.cliente else "-",
                "total": float(r.total),
                "estado": r.estado,
                "dias": (date.today() - r.fecha).days,
            }
            for r in rows
        ]
    }

@router.post("/registrar")
def registrar(data: CobranzaIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    total_cobrado = sum(p.importe for p in data.pagos)

    for comp_id in data.comprobante_ids:
        comp = db.query(Comprobante).filter(Comprobante.id == comp_id).first()
        if not comp:
            raise HTTPException(404, f"Comprobante {comp_id} no encontrado")
        comp.estado = "C"
        # Marcar cta cte como cancelado
        cta = db.query(CtaCliente).filter(
            CtaCliente.cliente_id == comp.cliente_id,
            CtaCliente.comprobante == comp.tipo,
            CtaCliente.nro_comp == comp.numero
        ).first()
        if cta:
            cta.cancelado = True

    # Actualizar saldo cliente
    cli = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if cli:
        cli.saldo = max(0, float(cli.saldo or 0) - total_cobrado)

    # Movimientos de caja por cada medio de pago
    for pago in data.pagos:
        mov = MovCaja(
            fecha=data.fecha,
            tipo="I",
            medio=pago.medio,
            concepto=f"Cobranza cliente {cli.nombre if cli else data.cliente_id}",
            importe=pago.importe,
            comprobante="RC",
            usuario=user.username,
        )
        db.add(mov)

    db.commit()
    return {"ok": True, "total_cobrado": total_cobrado}

@router.get("/resumen")
def resumen(db: Session = Depends(get_db), user=Depends(get_current_user)):
    hoy = date.today()
    primer_dia = hoy.replace(day=1)

    pendiente = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.estado == "P", Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).scalar()

    cobrado_mes = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.estado == "C",
        Comprobante.fecha >= primer_dia,
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).scalar()

    vencidas = db.query(func.coalesce(func.sum(Comprobante.total), 0)).filter(
        Comprobante.estado == "P",
        Comprobante.fecha < hoy,
        Comprobante.tipo.in_(["FA", "FB", "FC"])
    ).scalar()

    return {
        "pendiente_total": float(pendiente),
        "cobrado_mes": float(cobrado_mes),
        "vencidas": float(vencidas),
    }
