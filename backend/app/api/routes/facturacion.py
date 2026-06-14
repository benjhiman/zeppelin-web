from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Comprobante, ItemComprobante, Cliente, Articulo, CtaCliente, MovStock

router = APIRouter()

TIPOS_VENTA = ["FA", "FB", "FC", "NCA", "NCB", "NCC", "NDA", "NDB", "NDC", "REM", "PRE"]

class ItemIn(BaseModel):
    articulo_id: int
    cantidad: float
    precio_unit: float
    descuento: float = 0
    iva_porc: float = 21

class ComprobanteIn(BaseModel):
    tipo: str
    pto_vta: int = 1
    fecha: date
    cliente_id: int
    vendedor_id: Optional[int] = None
    condicion_id: Optional[int] = None
    moneda: str = "ARS"
    cotizacion: float = 1
    observaciones: Optional[str] = None
    items: List[ItemIn]

def calcular_totales(items_data):
    subtotal = sum(i.cantidad * i.precio_unit * (1 - i.descuento / 100) for i in items_data)
    iva21 = sum(i.cantidad * i.precio_unit * (1 - i.descuento / 100) * 0.21 for i in items_data if i.iva_porc == 21)
    iva105 = sum(i.cantidad * i.precio_unit * (1 - i.descuento / 100) * 0.105 for i in items_data if i.iva_porc == 10.5)
    return round(subtotal, 4), round(iva21, 4), round(iva105, 4), round(subtotal + iva21 + iva105, 4)

def comp_dict(c, include_items=False):
    d = {
        "id": c.id, "tipo": c.tipo, "pto_vta": c.pto_vta, "numero": c.numero,
        "numero_fmt": f"{c.tipo}-{str(c.pto_vta).zfill(4)}-{str(c.numero).zfill(8)}",
        "fecha": str(c.fecha),
        "cliente_id": c.cliente_id,
        "cliente_nombre": c.cliente.nombre if c.cliente else "-",
        "vendedor_id": c.vendedor_id,
        "condicion_id": c.condicion_id,
        "condicion_nombre": c.condicion.nombre if c.condicion else "-",
        "subtotal": float(c.subtotal or 0), "neto": float(c.neto or 0),
        "iva21": float(c.iva21 or 0), "iva105": float(c.iva105 or 0),
        "total": float(c.total or 0),
        "moneda": c.moneda, "cotizacion": float(c.cotizacion or 1),
        "estado": c.estado, "observaciones": c.observaciones,
        "cae": c.cae, "cae_vto": str(c.cae_vto) if c.cae_vto else None,
        "fe_creacion": str(c.fe_creacion) if c.fe_creacion else None,
    }
    if include_items:
        d["items"] = [
            {
                "id": i.id, "articulo_id": i.articulo_id,
                "articulo_codigo": i.articulo.codigo if i.articulo else "",
                "articulo_nombre": i.articulo.nombre if i.articulo else "",
                "cantidad": float(i.cantidad), "precio_unit": float(i.precio_unit),
                "descuento": float(i.descuento), "subtotal": float(i.subtotal),
                "iva_porc": float(i.iva_porc),
            }
            for i in c.items
        ]
    return d

@router.get("/")
def listar(
    q: Optional[str] = Query(None),
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), user=Depends(get_current_user)
):
    query = db.query(Comprobante).filter(Comprobante.tipo.in_(TIPOS_VENTA))
    if q:
        like = f"%{q}%"
        query = query.join(Cliente).filter(or_(Cliente.nombre.ilike(like), Comprobante.numero.cast(str).ilike(like)))
    if tipo:
        query = query.filter(Comprobante.tipo == tipo)
    if estado:
        query = query.filter(Comprobante.estado == estado)
    if cliente_id:
        query = query.filter(Comprobante.cliente_id == cliente_id)
    if fecha_desde:
        query = query.filter(Comprobante.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Comprobante.fecha <= fecha_hasta)
    total = query.count()
    rows = query.order_by(Comprobante.id.desc()).offset(skip).limit(limit).all()
    return {"total": total, "items": [comp_dict(c) for c in rows]}

@router.get("/{id}")
def obtener(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Comprobante).filter(Comprobante.id == id).first()
    if not c:
        raise HTTPException(404)
    return comp_dict(c, include_items=True)

@router.post("/")
def crear(data: ComprobanteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(Cliente).filter(Cliente.id == data.cliente_id).first():
        raise HTTPException(400, "Cliente no encontrado")

    # Siguiente número
    ultimo = db.query(func.max(Comprobante.numero)).filter(
        Comprobante.tipo == data.tipo, Comprobante.pto_vta == data.pto_vta
    ).scalar()
    numero = (ultimo or 0) + 1

    subtotal, iva21, iva105, total = calcular_totales(data.items)

    comp = Comprobante(
        tipo=data.tipo, pto_vta=data.pto_vta, numero=numero,
        fecha=data.fecha, cliente_id=data.cliente_id,
        vendedor_id=data.vendedor_id, condicion_id=data.condicion_id,
        subtotal=subtotal, neto=subtotal, iva21=iva21, iva105=iva105, total=total,
        moneda=data.moneda, cotizacion=data.cotizacion,
        observaciones=data.observaciones, estado="P"
    )
    db.add(comp)
    db.flush()

    for it in data.items:
        sub_it = round(it.cantidad * it.precio_unit * (1 - it.descuento / 100), 4)
        item = ItemComprobante(
            comprobante_id=comp.id, articulo_id=it.articulo_id,
            cantidad=it.cantidad, precio_unit=it.precio_unit,
            descuento=it.descuento, subtotal=sub_it, iva_porc=it.iva_porc
        )
        db.add(item)
        # Actualizar stock
        art = db.query(Articulo).filter(Articulo.id == it.articulo_id).first()
        if art:
            art.stock_act -= it.cantidad
            mov = MovStock(
                fecha=data.fecha, articulo_id=it.articulo_id, tipo="V",
                cantidad=it.cantidad, comprobante=data.tipo, nro_comp=numero,
                usuario=user.username
            )
            db.add(mov)

    # Cuenta corriente
    cta = CtaCliente(
        cliente_id=data.cliente_id, fecha=data.fecha, tipo="D",
        comprobante=data.tipo, nro_comp=numero, importe=total, saldo=total
    )
    db.add(cta)

    # Actualizar saldo cliente
    cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
    if cliente:
        cliente.saldo = (cliente.saldo or 0) + total

    db.commit()
    db.refresh(comp)
    return comp_dict(comp, include_items=True)

@router.post("/{id}/anular")
def anular(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Comprobante).filter(Comprobante.id == id).first()
    if not c:
        raise HTTPException(404)
    if c.estado == "A":
        raise HTTPException(400, "Ya está anulado")
    c.estado = "A"
    # Revertir stock
    for item in c.items:
        art = db.query(Articulo).filter(Articulo.id == item.articulo_id).first()
        if art:
            art.stock_act += item.cantidad
    # Revertir saldo
    cli = db.query(Cliente).filter(Cliente.id == c.cliente_id).first()
    if cli:
        cli.saldo = (cli.saldo or 0) - c.total
    db.commit()
    return {"ok": True}

@router.post("/{id}/cobrar")
def cobrar(id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Comprobante).filter(Comprobante.id == id).first()
    if not c:
        raise HTTPException(404)
    c.estado = "C"
    # Actualizar cta cte
    cta = db.query(CtaCliente).filter(
        CtaCliente.cliente_id == c.cliente_id,
        CtaCliente.comprobante == c.tipo,
        CtaCliente.nro_comp == c.numero
    ).first()
    if cta:
        cta.cancelado = True
    db.commit()
    return {"ok": True}

@router.get("/tipos/lista")
def tipos_lista(user=Depends(get_current_user)):
    return [
        {"codigo": "FA", "nombre": "Factura A"},
        {"codigo": "FB", "nombre": "Factura B"},
        {"codigo": "FC", "nombre": "Factura C"},
        {"codigo": "NCA", "nombre": "Nota de Crédito A"},
        {"codigo": "NCB", "nombre": "Nota de Crédito B"},
        {"codigo": "NCC", "nombre": "Nota de Crédito C"},
        {"codigo": "NDA", "nombre": "Nota de Débito A"},
        {"codigo": "NDB", "nombre": "Nota de Débito B"},
        {"codigo": "REM", "nombre": "Remito"},
        {"codigo": "PRE", "nombre": "Presupuesto"},
    ]
