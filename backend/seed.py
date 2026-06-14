"""
Ejecutar UNA VEZ después de deployar:
  python seed.py
Crea el usuario admin y datos iniciales.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.models import (
    Usuario, Empresa, CondicionPago, TipoIVA, Marca, Rubro,
    Vendedor, Cobrador, Banco
)
from app.core.security import get_password_hash

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/zeppelin")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

# Usuario admin
if not db.query(Usuario).filter(Usuario.username == "admin").first():
    db.add(Usuario(
        username="admin", nombre="Administrador",
        email="admin@empresa.com",
        hashed_password=get_password_hash("admin123"),
        es_admin=True
    ))
    print("✅ Usuario admin creado (password: admin123) — ¡cambialo después!")

# Empresa
if not db.query(Empresa).first():
    db.add(Empresa(
        razon_social="Mi Empresa SRL",
        nombre_comercial="Mi Empresa",
        cuit="30-00000000-0",
        tipo_iva="RI",
    ))

# Condiciones de pago
condiciones = [
    ("CO", "Contado", 0), ("15", "15 días", 15),
    ("30", "30 días", 30), ("60", "60 días", 60),
    ("90", "90 días", 90),
]
for cod, nom, dias in condiciones:
    if not db.query(CondicionPago).filter(CondicionPago.codigo == cod).first():
        db.add(CondicionPago(codigo=cod, nombre=nom, dias_vto=dias))

# Tipos IVA
tipos_iva = [
    ("RI", "Resp. Inscripto", 21, True, 1),
    ("MO", "Monotributista", 0, False, 6),
    ("EX", "Exento", 0, False, 4),
    ("CF", "Consumidor Final", 21, True, 5),
]
for cod, nom, porc, disc, fe in tipos_iva:
    if not db.query(TipoIVA).filter(TipoIVA.codigo == cod).first():
        db.add(TipoIVA(codigo=cod, nombre=nom, porcentaje=porc, discrimina=disc, iva_fe=fe))

# Marcas y Rubros de ejemplo
for i, nom in enumerate(["Sin marca", "Marca A", "Marca B", "Marca C"], 1):
    if not db.query(Marca).filter(Marca.codigo == str(i).zfill(2)).first():
        db.add(Marca(codigo=str(i).zfill(2), nombre=nom))

for i, nom in enumerate(["General", "Rubro 01", "Rubro 02", "Rubro 03"], 1):
    if not db.query(Rubro).filter(Rubro.codigo == str(i).zfill(2)).first():
        db.add(Rubro(codigo=str(i).zfill(2), nombre=nom))

# Vendedor inicial
if not db.query(Vendedor).first():
    db.add(Vendedor(codigo="01", nombre="Vendedor Principal", comision=3.5))

# Cobrador inicial
if not db.query(Cobrador).first():
    db.add(Cobrador(codigo="01", nombre="Cobrador Principal", comision=2.0))

db.commit()
db.close()
print("✅ Base de datos inicializada correctamente.")
