"""
models.py
Modelos SQLAlchemy (tablas) y schemas Pydantic (validación / serialización).
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, ConfigDict
from database import Base


# ==============================================================================
# MODELOS SQLALCHEMY (mapeo a MySQL)
# ==============================================================================

class Categoria(Base):
    __tablename__ = "categorias"

    id          = Column(Integer, primary_key=True, index=True)
    nombre      = Column(String(100), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)

    # Relación inversa: una categoría tiene muchos productos
    productos   = relationship("Producto", back_populates="categoria")


class Producto(Base):
    __tablename__ = "productos"

    id           = Column(Integer, primary_key=True, index=True, autoincrement=True)
    codigo       = Column(String(50),  nullable=False, unique=True, index=True)
    nombre       = Column(String(200), nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    descripcion  = Column(Text, nullable=True)
    precio       = Column(Numeric(10, 2), nullable=False, default=0)
    unidad_venta = Column(String(80), nullable=False, default="unidad")
    stock        = Column(Integer, nullable=False, default=0)
    activo       = Column(Boolean, nullable=False, default=True)
    created_at   = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at   = Column(DateTime, server_default=func.now(),
                          onupdate=func.now(), nullable=False)

    # Relación: un producto pertenece a una categoría
    categoria    = relationship("Categoria", back_populates="productos")


# ==============================================================================
# SCHEMAS PYDANTIC (validación de entrada / salida)
# ==============================================================================

# ---------- Categoría ---------------------------------------------------------

class CategoriaBase(BaseModel):
    nombre:      str = Field(..., max_length=100, examples=["Bolsas Camisetas"])
    descripcion: Optional[str] = Field(None, max_length=255)

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Producto ----------------------------------------------------------

class ProductoBase(BaseModel):
    codigo:       str     = Field(..., max_length=50,  examples=["BOL-CAM-01"])
    nombre:       str     = Field(..., max_length=200, examples=["Bolsa Camiseta Chica"])
    categoria_id: int     = Field(..., gt=0)
    descripcion:  Optional[str] = None
    precio:       Decimal = Field(..., ge=0, examples=[1200.00])
    unidad_venta: str     = Field("unidad", max_length=80, examples=["paquete x100"])
    stock:        int     = Field(0, ge=0)
    activo:       bool    = True

class ProductoCreate(ProductoBase):
    """Schema para crear un producto (POST)."""
    pass

class ProductoUpdate(BaseModel):
    """Schema para actualizar un producto (PUT). Todos los campos son opcionales."""
    codigo:       Optional[str]     = Field(None, max_length=50)
    nombre:       Optional[str]     = Field(None, max_length=200)
    categoria_id: Optional[int]     = Field(None, gt=0)
    descripcion:  Optional[str]     = None
    precio:       Optional[Decimal] = Field(None, ge=0)
    unidad_venta: Optional[str]     = Field(None, max_length=80)
    stock:        Optional[int]     = Field(None, ge=0)
    activo:       Optional[bool]    = None

class ProductoResponse(ProductoBase):
    """Schema de respuesta completa (incluye id, fechas y categoría anidada)."""
    model_config = ConfigDict(from_attributes=True)

    id:         int
    created_at: datetime
    updated_at: datetime
    categoria:  CategoriaResponse

class ProductoListResponse(BaseModel):
    """Respuesta paginada para el listado de productos."""
    total:    int
    pagina:   int
    por_pagina: int
    productos: list[ProductoResponse]
