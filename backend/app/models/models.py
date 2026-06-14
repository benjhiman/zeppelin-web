from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"
    id          = Column(Integer, primary_key=True, index=True)
    codigo      = Column(String(5), unique=True, index=True)
    nombre      = Column(String(40), nullable=False)
    comercial   = Column(String(40))
    direc       = Column(String(40))
    localidad   = Column(String(40))
    provincia   = Column(String(2))
    codpos      = Column(String(8))
    telefono    = Column(String(40))
    telefono2   = Column(String(40))
    celular     = Column(String(20))
    email       = Column(String(50))
    contacto    = Column(String(40))
    zona        = Column(String(2))
    vendedor_id = Column(String(2))
    cobrador_id = Column(String(2))
    categoria   = Column(String(2))
    condicion   = Column(String(2))
    cuit        = Column(String(13))
    tipo_iva    = Column(String(2))
    lista_pre   = Column(String(1), default="1")
    credito     = Column(Numeric(15, 2), default=0)
    saldo       = Column(Numeric(15, 4), default=0)
    boni1       = Column(Numeric(5, 2), default=0)
    boni2       = Column(Numeric(5, 2), default=0)
    bloqueo     = Column(Boolean, default=False)
    comentario  = Column(String(200))
    obs1        = Column(String(50))
    obs2        = Column(String(50))
    fe_ingre    = Column(Date)
    ult_ope     = Column(Date)
    fe_mod      = Column(DateTime, server_default=func.now(), onupdate=func.now())
    activo      = Column(Boolean, default=True)
    comprobantes = relationship("Comprobante", back_populates="cliente")
    cuenta_corriente = relationship("CtaCliente", back_populates="cliente")


class Proveedor(Base):
    __tablename__ = "proveedores"
    id        = Column(Integer, primary_key=True, index=True)
    codigo    = Column(String(5), unique=True, index=True)
    nombre    = Column(String(40), nullable=False)
    direc     = Column(String(40))
    localidad = Column(String(40))
    provincia = Column(String(2))
    codpos    = Column(String(8))
    telefono  = Column(String(40))
    cuit      = Column(String(13))
    tipo_iva  = Column(String(2))
    contacto  = Column(String(40))
    saldo     = Column(Numeric(15, 2), default=0)
    fe_mod    = Column(DateTime, server_default=func.now(), onupdate=func.now())
    activo    = Column(Boolean, default=True)
    compras   = relationship("Compra", back_populates="proveedor")


class Articulo(Base):
    __tablename__ = "articulos"
    id          = Column(Integer, primary_key=True, index=True)
    codigo      = Column(String(15), unique=True, index=True)
    nombre      = Column(String(40), nullable=False)
    nombre2     = Column(String(40))
    marca_id    = Column(Integer, ForeignKey("marcas.id"))
    rubro_id    = Column(Integer, ForeignKey("rubros.id"))
    subrubro_id = Column(Integer, ForeignKey("subrubros.id"), nullable=True)
    precio1     = Column(Numeric(15, 2), default=0)
    precio2     = Column(Numeric(15, 2), default=0)
    precio3     = Column(Numeric(15, 2), default=0)
    precio4     = Column(Numeric(15, 2), default=0)
    precio5     = Column(Numeric(15, 2), default=0)
    costo       = Column(Numeric(15, 4), default=0)
    stock_act   = Column(Numeric(15, 2), default=0)
    stock_min   = Column(Numeric(9, 3), default=0)
    unimed      = Column(String(5), default="u.")
    iva         = Column(String(1), default="1")  # 1=21%, 2=10.5%, 3=exento
    cod_ext     = Column(String(15))
    cod_ext2    = Column(String(15))
    proveedor_id = Column(String(5))
    bloqueado   = Column(Boolean, default=False)
    activo      = Column(Boolean, default=True)
    imagen      = Column(String(200))
    observaciones = Column(Text)
    fe_mod      = Column(DateTime, server_default=func.now(), onupdate=func.now())
    marca       = relationship("Marca", back_populates="articulos")
    rubro       = relationship("Rubro", back_populates="articulos")


class Marca(Base):
    __tablename__ = "marcas"
    id      = Column(Integer, primary_key=True, index=True)
    codigo  = Column(String(2), unique=True)
    nombre  = Column(String(20), nullable=False)
    activo  = Column(Boolean, default=True)
    articulos = relationship("Articulo", back_populates="marca")


class Rubro(Base):
    __tablename__ = "rubros"
    id      = Column(Integer, primary_key=True, index=True)
    codigo  = Column(String(2), unique=True)
    nombre  = Column(String(20), nullable=False)
    activo  = Column(Boolean, default=True)
    articulos = relationship("Articulo", back_populates="rubro")


class Subrubro(Base):
    __tablename__ = "subrubros"
    id       = Column(Integer, primary_key=True, index=True)
    codigo   = Column(String(8), unique=True)
    nombre   = Column(String(20))
    rubro_id = Column(Integer, ForeignKey("rubros.id"), nullable=True)
    activo   = Column(Boolean, default=True)


class Vendedor(Base):
    __tablename__ = "vendedores"
    id        = Column(Integer, primary_key=True, index=True)
    codigo    = Column(String(2), unique=True)
    nombre    = Column(String(30), nullable=False)
    direc     = Column(String(30))
    localidad = Column(String(20))
    telefono  = Column(String(20))
    comision  = Column(Numeric(5, 2), default=0)
    activo    = Column(Boolean, default=True)


class Cobrador(Base):
    __tablename__ = "cobradores"
    id        = Column(Integer, primary_key=True, index=True)
    codigo    = Column(String(2), unique=True)
    nombre    = Column(String(30), nullable=False)
    telefono  = Column(String(20))
    comision  = Column(Numeric(5, 2), default=0)
    activo    = Column(Boolean, default=True)


class CondicionPago(Base):
    __tablename__ = "condiciones_pago"
    id       = Column(Integer, primary_key=True, index=True)
    codigo   = Column(String(2), unique=True)
    nombre   = Column(String(20), nullable=False)
    dias_vto = Column(Integer, default=0)
    activo   = Column(Boolean, default=True)


class Banco(Base):
    __tablename__ = "bancos"
    id       = Column(Integer, primary_key=True, index=True)
    codigo   = Column(String(2), unique=True)
    nombre   = Column(String(20), nullable=False)
    nro_cta  = Column(String(20))
    tipo     = Column(String(1))  # C=corriente, A=ahorro
    moneda   = Column(String(1), default="$")
    saldo    = Column(Numeric(15, 2), default=0)
    activo   = Column(Boolean, default=True)
    movimientos = relationship("MovBanco", back_populates="banco")


class MovBanco(Base):
    __tablename__ = "mov_bancos"
    id          = Column(Integer, primary_key=True, index=True)
    banco_id    = Column(Integer, ForeignKey("bancos.id"))
    fecha       = Column(Date, nullable=False)
    concepto    = Column(String(80))
    tipo        = Column(String(1))  # D=debito, C=credito
    importe     = Column(Numeric(15, 2), default=0)
    comprobante = Column(String(20))
    banco       = relationship("Banco", back_populates="movimientos")


class TipoIVA(Base):
    __tablename__ = "tipos_iva"
    id          = Column(Integer, primary_key=True, index=True)
    codigo      = Column(String(2), unique=True)
    nombre      = Column(String(16))
    porcentaje  = Column(Numeric(5, 2), default=21)
    discrimina  = Column(Boolean, default=True)
    iva_fe      = Column(Integer)  # código AFIP para FE


class Comprobante(Base):
    __tablename__ = "comprobantes"
    id           = Column(Integer, primary_key=True, index=True)
    tipo         = Column(String(4), nullable=False)   # FA, FB, NCA, REM...
    pto_vta      = Column(Integer, default=1)
    numero       = Column(Integer, nullable=False)
    fecha        = Column(Date, nullable=False)
    cliente_id   = Column(Integer, ForeignKey("clientes.id"))
    vendedor_id  = Column(Integer, ForeignKey("vendedores.id"), nullable=True)
    condicion_id = Column(Integer, ForeignKey("condiciones_pago.id"), nullable=True)
    subtotal     = Column(Numeric(15, 4), default=0)
    descuento    = Column(Numeric(5, 2), default=0)
    neto         = Column(Numeric(15, 4), default=0)
    iva21        = Column(Numeric(15, 4), default=0)
    iva105       = Column(Numeric(15, 4), default=0)
    total        = Column(Numeric(15, 4), default=0)
    moneda       = Column(String(3), default="ARS")
    cotizacion   = Column(Numeric(10, 4), default=1)
    estado       = Column(String(1), default="P")  # P=pendiente, C=cobrado, A=anulado
    observaciones = Column(Text)
    cae          = Column(String(16))
    cae_vto      = Column(Date)
    fe_creacion  = Column(DateTime, server_default=func.now())
    fe_mod       = Column(DateTime, server_default=func.now(), onupdate=func.now())
    cliente      = relationship("Cliente", back_populates="comprobantes")
    vendedor     = relationship("Vendedor")
    condicion    = relationship("CondicionPago")
    items        = relationship("ItemComprobante", back_populates="comprobante", cascade="all, delete-orphan")


class ItemComprobante(Base):
    __tablename__ = "items_comprobante"
    id              = Column(Integer, primary_key=True, index=True)
    comprobante_id  = Column(Integer, ForeignKey("comprobantes.id"))
    articulo_id     = Column(Integer, ForeignKey("articulos.id"))
    cantidad        = Column(Numeric(10, 3), default=1)
    precio_unit     = Column(Numeric(15, 4), default=0)
    descuento       = Column(Numeric(5, 2), default=0)
    subtotal        = Column(Numeric(15, 4), default=0)
    iva_porc        = Column(Numeric(5, 2), default=21)
    comprobante     = relationship("Comprobante", back_populates="items")
    articulo        = relationship("Articulo")


class CtaCliente(Base):
    __tablename__ = "cta_clientes"
    id              = Column(Integer, primary_key=True, index=True)
    cliente_id      = Column(Integer, ForeignKey("clientes.id"))
    fecha           = Column(Date, nullable=False)
    tipo            = Column(String(1))  # D=debito, C=credito
    comprobante     = Column(String(4))
    nro_comp        = Column(Integer)
    importe         = Column(Numeric(15, 4), default=0)
    saldo           = Column(Numeric(15, 4), default=0)
    cancelado       = Column(Boolean, default=False)
    cliente         = relationship("Cliente", back_populates="cuenta_corriente")


class Compra(Base):
    __tablename__ = "compras"
    id           = Column(Integer, primary_key=True, index=True)
    tipo         = Column(String(4), nullable=False)
    numero       = Column(String(13))
    fecha        = Column(Date, nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    neto         = Column(Numeric(15, 4), default=0)
    iva21        = Column(Numeric(15, 4), default=0)
    iva105       = Column(Numeric(15, 4), default=0)
    total        = Column(Numeric(15, 4), default=0)
    estado       = Column(String(1), default="P")
    observaciones = Column(Text)
    fe_creacion  = Column(DateTime, server_default=func.now())
    proveedor    = relationship("Proveedor", back_populates="compras")
    items        = relationship("ItemCompra", back_populates="compra", cascade="all, delete-orphan")


class ItemCompra(Base):
    __tablename__ = "items_compra"
    id           = Column(Integer, primary_key=True, index=True)
    compra_id    = Column(Integer, ForeignKey("compras.id"))
    articulo_id  = Column(Integer, ForeignKey("articulos.id"), nullable=True)
    descripcion  = Column(String(80))
    cantidad     = Column(Numeric(10, 3), default=1)
    precio_unit  = Column(Numeric(15, 4), default=0)
    subtotal     = Column(Numeric(15, 4), default=0)
    compra       = relationship("Compra", back_populates="items")
    articulo     = relationship("Articulo")


class MovCaja(Base):
    __tablename__ = "mov_caja"
    id          = Column(Integer, primary_key=True, index=True)
    fecha       = Column(Date, nullable=False)
    hora        = Column(String(5))
    tipo        = Column(String(1))   # I=ingreso, E=egreso
    medio       = Column(String(2))   # EF=efectivo, CH=cheque, TJ=tarjeta, TR=transferencia
    concepto    = Column(String(80))
    importe     = Column(Numeric(15, 4), default=0)
    comprobante = Column(String(20))
    usuario     = Column(String(20))
    fe_creacion = Column(DateTime, server_default=func.now())


class Pedido(Base):
    __tablename__ = "pedidos"
    id          = Column(Integer, primary_key=True, index=True)
    numero      = Column(Integer, nullable=False)
    fecha       = Column(Date, nullable=False)
    cliente_id  = Column(Integer, ForeignKey("clientes.id"))
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)
    total       = Column(Numeric(15, 4), default=0)
    estado      = Column(String(1), default="N")  # N=nuevo, P=proceso, F=facturado, C=cancelado
    observaciones = Column(Text)
    fe_creacion = Column(DateTime, server_default=func.now())
    cliente     = relationship("Cliente")
    vendedor    = relationship("Vendedor")
    items       = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")


class ItemPedido(Base):
    __tablename__ = "items_pedido"
    id          = Column(Integer, primary_key=True, index=True)
    pedido_id   = Column(Integer, ForeignKey("pedidos.id"))
    articulo_id = Column(Integer, ForeignKey("articulos.id"))
    cantidad    = Column(Numeric(10, 3), default=1)
    precio      = Column(Numeric(15, 4), default=0)
    subtotal    = Column(Numeric(15, 4), default=0)
    pedido      = relationship("Pedido", back_populates="items")
    articulo    = relationship("Articulo")


class MovStock(Base):
    __tablename__ = "mov_stock"
    id          = Column(Integer, primary_key=True, index=True)
    fecha       = Column(Date, nullable=False)
    articulo_id = Column(Integer, ForeignKey("articulos.id"))
    tipo        = Column(String(2))  # V=venta, C=compra, A=ajuste, P=producción
    cantidad    = Column(Numeric(11, 3), default=0)
    comprobante = Column(String(4))
    nro_comp    = Column(Integer)
    usuario     = Column(String(20))
    fe_creacion = Column(DateTime, server_default=func.now())
    articulo    = relationship("Articulo")


class Usuario(Base):
    __tablename__ = "usuarios"
    id          = Column(Integer, primary_key=True, index=True)
    username    = Column(String(30), unique=True, index=True)
    nombre      = Column(String(60))
    email       = Column(String(80))
    hashed_password = Column(String(200))
    es_admin    = Column(Boolean, default=False)
    activo      = Column(Boolean, default=True)
    fe_creacion = Column(DateTime, server_default=func.now())


class Empresa(Base):
    __tablename__ = "empresa"
    id          = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(60))
    nombre_comercial = Column(String(60))
    direc       = Column(String(40))
    localidad   = Column(String(30))
    provincia   = Column(String(20))
    codpos      = Column(String(8))
    telefono    = Column(String(20))
    cuit        = Column(String(13))
    tipo_iva    = Column(String(2))
    ingresos_brutos = Column(String(15))
    logo_path   = Column(String(200))
    moneda_def  = Column(String(3), default="ARS")
    cbu         = Column(String(22))
