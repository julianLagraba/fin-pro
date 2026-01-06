from database import SessionLocal, engine
import models

# Crear las tablas por si no existen
models.Base.metadata.create_all(bind=engine)

def init_categories():
    db = SessionLocal()
    
    # Lista de categorías básicas para arrancar
    categories_list = [
        {"name": "Sueldo", "type": "ingreso", "icon": "💰"},
        {"name": "Freelance", "type": "ingreso", "icon": "💻"},
        {"name": "Supermercado", "type": "gasto", "icon": "🛒"},
        {"name": "Servicios", "type": "gasto", "icon": "💡"},
        {"name": "Alquiler", "type": "gasto", "icon": "🏠"},
        {"name": "Salidas", "type": "gasto", "icon": "🍺"},
        {"name": "Transporte", "type": "gasto", "icon": "🚌"},
        {"name": "Salud", "type": "gasto", "icon": "💊"},
    ]

    print("Cargando categorías...")
    for cat_data in categories_list:
        # Chequeamos si ya existe para no duplicar
        exists = db.query(models.Category).filter_by(name=cat_data["name"]).first()
        if not exists:
            new_cat = models.Category(
                name=cat_data["name"],
                type=cat_data["type"],
                icon=cat_data["icon"]
            )
            db.add(new_cat)
            print(f"Creada: {cat_data['name']}")
        else:
            print(f"Ya existe: {cat_data['name']}")

    db.commit()
    db.close()
    print("¡Categorías listas!")

if __name__ == "__main__":
    init_categories()