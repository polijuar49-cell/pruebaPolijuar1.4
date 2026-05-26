# polijuar_backend/main.py - wrapper to expose the FastAPI app for testing
"""
This module mirrors the original top-level `main.py` so that tests can import
`polijuar_backend.main` and obtain the `app` instance.
It re‑uses the same imports and definitions; the code is duplicated rather than
moving files to keep the existing project layout untouched.
"""

from fastapi import FastAPI, Depends, HTTPException, Query, status
from auth import get_current_user
from auth_routes import router as auth_router
from models_user import User
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from database import Base, engine, get_db
from models import (
    Categoria,
    Producto,
    CategoriaCreate,
    CategoriaResponse,
    ProductoCreate,
    ProductoUpdate,
    ProductoResponse,
    ProductoListResponse,
)

app = FastAPI(
    title="Polijuar Descartables — API",
    description="CRUD de productos descartables: bolsas, vasos, cajas y más.",
    version="1.0.0",
)
app.include_router(auth_router, prefix="/auth")

# Crear tablas si no existen (en producción usar Alembic)
Base.metadata.create_all(bind=engine)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Raíz
# -----------------------------------------------------------------------------
@app.get("/", tags=["General"])
def root():
    return {"mensaje": "API Polijuar Descartables activa. Ver /docs para la documentación."}

# -----------------------------------------------------------------------------
# Categorías
# -----------------------------------------------------------------------------
@app.get("/categorias", response_model=list[CategoriaResponse], tags=["Categorías"])
def listar_categorias(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Devuelve todas las categorías disponibles."""
    return db.query(Categoria).order_by(Categoria.nombre).all()

@app.get("/categorias/{categoria_id}", response_model=CategoriaResponse, tags=["Categorías"])
def obtener_categoria(categoria_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Devuelve una categoría por su ID."""
    cat = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return cat

@app.post("/categorias", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED, tags=["Categorías"])
def crear_categoria(data: CategoriaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Crea una nueva categoría."""
    if db.query(Categoria).filter(Categoria.nombre == data.nombre).first():
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    cat = Categoria(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@app.delete("/categorias/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Categorías"])
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Elimina una categoría (solo si no tiene productos asociados)."""
    cat = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if cat.productos:
        raise HTTPException(status_code=400, detail="No se puede eliminar: la categoría tiene productos asociados")
    db.delete(cat)
    db.commit()

# -----------------------------------------------------------------------------
# Productos – CRUD
# -----------------------------------------------------------------------------
@app.get("/productos", response_model=ProductoListResponse, tags=["Productos"])
def listar_productos(current_user: User = Depends(get_current_user),
    busqueda: Optional[str] = Query(None, description="Buscar por nombre o código"),
    categoria_id: Optional[int] = Query(None, description="Filtrar por categoría"),
    solo_activos: bool = Query(True, description="Mostrar solo productos activos"),
    pagina: int = Query(1, ge=1, description="Número de página"),
    por_pagina: int = Query(20, ge=1, le=100, description="Resultados por página"),
    db: Session = Depends(get_db),
):
    """Lista productos con filtros opcionales, búsqueda y paginación."""
    query = db.query(Producto)
    if solo_activos:
        query = query.filter(Producto.activo == True)
    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)
    if busqueda:
        termino = f"%{busqueda}%"
        query = query.filter(or_(Producto.nombre.ilike(termino), Producto.codigo.ilike(termino)))
    total = query.count()
    productos = (
        query.order_by(Producto.nombre)
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
        .all()
    )
    return ProductoListResponse(total=total, pagina=pagina, por_pagina=por_pagina, productos=productos)

@app.get("/productos/{producto_id}", response_model=ProductoResponse, tags=["Productos"])
def obtener_producto(producto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Devuelve un producto por su ID."""
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return prod

@app.post("/productos", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED, tags=["Productos"])
def crear_producto(data: ProductoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Crea un nuevo producto."""
    if db.query(Producto).filter(Producto.codigo == data.codigo).first():
        raise HTTPException(status_code=400, detail=f"Ya existe un producto con código '{data.codigo}'")
    if not db.query(Categoria).filter(Categoria.id == data.categoria_id).first():
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    prod = Producto(**data.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod

@app.put("/productos/{producto_id}", response_model=ProductoResponse, tags=["Productos"])
def actualizar_producto(producto_id: int, data: ProductoUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Actualiza un producto existente."""
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    cambios = data.model_dump(exclude_unset=True)
    if "codigo" in cambios and cambios["codigo"] != prod.codigo:
        if db.query(Producto).filter(Producto.codigo == cambios["codigo"]).first():
            raise HTTPException(status_code=400, detail=f"El código '{cambios['codigo']}' ya está en uso")
    if "categoria_id" in cambios:
        if not db.query(Categoria).filter(Categoria.id == cambios["categoria_id"]).first():
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for campo, valor in cambios.items():
        setattr(prod, campo, valor)
    db.commit()
    db.refresh(prod)
    return prod

@app.delete("/productos/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Productos"])
def eliminar_producto(producto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()

@app.patch("/productos/{producto_id}/desactivar", response_model=ProductoResponse, tags=["Productos"])
def desactivar_producto(producto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    prod.activo = False
    db.commit()
    db.refresh(prod)
    return prod

@app.patch("/productos/{producto_id}/activar", response_model=ProductoResponse, tags=["Productos"])
def activar_producto(producto_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prod = db.query(Producto).filter(Producto.id == producto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    prod.activo = True
    db.commit()
    db.refresh(prod)
    return prod
