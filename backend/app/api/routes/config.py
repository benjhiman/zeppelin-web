from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user, verify_password, get_password_hash
from app.models.models import Empresa, Usuario

router = APIRouter()

class EmpresaIn(BaseModel):
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    direc: Optional[str] = None
    localidad: Optional[str] = None
    provincia: Optional[str] = None
    codpos: Optional[str] = None
    telefono: Optional[str] = None
    cuit: Optional[str] = None
    tipo_iva: Optional[str] = None
    ingresos_brutos: Optional[str] = None
    cbu: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

def empresa_dict(e):
    return {
        "id": e.id, "razon_social": e.razon_social, "nombre_comercial": e.nombre_comercial,
        "direc": e.direc, "localidad": e.localidad, "provincia": e.provincia,
        "codpos": e.codpos, "telefono": e.telefono, "cuit": e.cuit,
        "tipo_iva": e.tipo_iva, "ingresos_brutos": e.ingresos_brutos, "cbu": e.cbu,
    }

@router.get("/empresa")
def get_empresa(db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Empresa).first()
    if not e:
        return {}
    return empresa_dict(e)

@router.put("/empresa")
def update_empresa(data: EmpresaIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(Empresa).first()
    if not e:
        e = Empresa()
        db.add(e)
    for k, v in data.dict(exclude_unset=True).items():
        if v is not None:
            setattr(e, k, v)
    db.commit()
    return empresa_dict(e)
