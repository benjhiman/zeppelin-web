from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash, get_current_user
from app.models.models import Usuario

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str
    nombre: str
    es_admin: bool

class UserCreate(BaseModel):
    username: str
    nombre: str
    email: str
    password: str
    es_admin: bool = False

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario o contraseña incorrectos")
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "nombre": user.nombre, "es_admin": user.es_admin}

@router.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.username == data.username).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    user = Usuario(
        username=data.username, nombre=data.nombre, email=data.email,
        hashed_password=get_password_hash(data.password), es_admin=data.es_admin,
    )
    db.add(user)
    db.commit()
    return {"ok": True, "username": user.username}

@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"ok": True}

@router.get("/me")
def me(user=Depends(get_current_user)):
    return {"username": user.username, "nombre": user.nombre, "es_admin": user.es_admin}
