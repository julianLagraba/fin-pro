from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import engine, get_db
from datetime import datetime
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token, get_current_user


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Control Financiero Pro API")

# Esto permite que React (localhost:5173) hable con Python
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------------------------

# ... (Acá abajo siguen tus endpoints de siempre: users, accounts, etc.)
# --- CARGA INICIAL DE CATEGORÍAS GLOBALES ---
@app.on_event("startup")
def startup_event():
    # --- IMPORTS TARDÍOS (LA SOLUCIÓN ANTI-CUELGUE) ---
    from database import SessionLocal
    from sqlalchemy import or_
    import models 
    
    db = SessionLocal()
    defaults = ["Sueldo", "Alquiler", "Supermercado", "Servicios", "Ocio", "Transporte"]
    
    try:
        for name in defaults:
            # Buscamos si existe la global
            exists = db.query(models.Category).filter(models.Category.name == name, models.Category.user_id == None).first()
            if not exists:
                db.add(models.Category(name=name, user_id=None))
        db.commit()
    except Exception as e:
        print(f"Error en carga inicial: {e}")
    finally:
        db.close()


@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return crud.create_user(db=db, user=user)

@app.post("/users/{user_id}/accounts/", response_model=schemas.AccountResponse)
def create_account_for_user(user_id: int, account: schemas.AccountCreate, db: Session = Depends(get_db)):
    return crud.create_account(db=db, account=account, user_id=user_id)

@app.post("/users/{user_id}/transactions/", response_model=schemas.TransactionResponse)
def create_transaction(user_id: int, transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db=db, transaction=transaction, user_id=user_id)

@app.get("/users/{user_id}/accounts/", response_model=List[schemas.AccountResponse])
def read_accounts(user_id: int, db: Session = Depends(get_db)):
    accounts = db.query(models.Account).filter(models.Account.user_id == user_id).all()
    return accounts

@app.post("/categories/", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return crud.create_category(db=db, category=category)


@app.get("/users/{user_id}/transactions/", response_model=List[schemas.TransactionResponse])
def read_transactions(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    transactions = crud.get_transactions_by_user(db, user_id=user_id, skip=skip, limit=limit)
    return transactions

@app.get("/users/{user_id}/subscriptions/", response_model=List[schemas.SubscriptionResponse])
def read_subscriptions(user_id: int, db: Session = Depends(get_db)):
    return crud.get_subscriptions(db, user_id=user_id)

@app.post("/users/{user_id}/subscriptions/", response_model=schemas.SubscriptionResponse)
def create_subscription(user_id: int, subscription: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    # 1. Crear la Suscripción en su tabla
    db_subscription = crud.create_subscription(db=db, subscription=subscription, user_id=user_id)
    
    # 2. MAGIA: Si eligió una tarjeta, creamos el gasto recurrente automáticamente
    if subscription.card_id:
        # Creamos el objeto de compra
        new_purchase = models.CardPurchase(
            description=f"Suscripción: {subscription.name}",
            amount=subscription.price,
            currency=subscription.currency,
            installments=1, # Las suscripciones son siempre 1 pago (recurrente)
            date=datetime.now().strftime("%Y-%m-%d"), # Fecha de hoy
            is_recurring=True, # <--- ESTO ES CLAVE
            card_id=subscription.card_id
        )
        db.add(new_purchase)
        db.commit()

    return db_subscription

# --- RUTAS TARJETAS ---
@app.post("/users/{user_id}/credit-cards/", response_model=schemas.CreditCardResponse)
def create_credit_card(user_id: int, card: schemas.CreditCardCreate, db: Session = Depends(get_db)):
    return crud.create_credit_card(db=db, card=card, user_id=user_id)

@app.get("/users/{user_id}/credit-cards/", response_model=List[schemas.CreditCardResponse])
def read_credit_cards(user_id: int, db: Session = Depends(get_db)):
    return crud.get_credit_cards(db, user_id=user_id)

@app.post("/credit-cards/{card_id}/purchases/", response_model=schemas.CardPurchaseResponse)
def create_card_purchase(card_id: int, purchase: schemas.CardPurchaseCreate, db: Session = Depends(get_db)):
    return crud.create_card_purchase(db=db, purchase=purchase, card_id=card_id)

@app.get("/credit-cards/{card_id}/purchases/", response_model=List[schemas.CardPurchaseResponse])
def read_card_purchases(card_id: int, db: Session = Depends(get_db)):
    return crud.get_card_purchases(db, card_id=card_id)

@app.delete("/card-purchases/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    success = crud.delete_card_purchase(db, purchase_id)
    if not success:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return {"message": "Eliminado correctamente"}

@app.get("/users/{user_id}/categories/", response_model=List[schemas.CategoryResponse])
def read_categories(user_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import or_ # <--- IMPORTAR ACÁ TAMBIÉN
    
    return db.query(models.Category).filter(
        or_(
            models.Category.user_id == user_id,
            models.Category.user_id == None
        )
    ).all()

# --- RUTAS CLIENTES ---
@app.post("/users/{user_id}/clients/", response_model=schemas.ClientResponse)
def create_client(user_id: int, client: schemas.ClientCreate, db: Session = Depends(get_db)):
    return crud.create_client(db=db, client=client, user_id=user_id)

@app.get("/users/{user_id}/clients/", response_model=List[schemas.ClientResponse])
def read_clients(user_id: int, db: Session = Depends(get_db)):
    return crud.get_clients(db, user_id=user_id)

# --- RUTAS TRABAJOS ---
@app.post("/clients/{client_id}/jobs/", response_model=schemas.JobResponse)
def create_job(client_id: int, job: schemas.JobCreate, db: Session = Depends(get_db)):
    return crud.create_job(db=db, job=job, client_id=client_id)

@app.get("/clients/{client_id}/jobs/", response_model=List[schemas.JobResponse])
def read_client_jobs(client_id: int, db: Session = Depends(get_db)):
    return crud.get_client_jobs(db, client_id=client_id)

# ---  REGISTRAR COBRO ---
@app.post("/jobs/{job_id}/pay")
def pay_job(job_id: int, payment_data: schemas.JobPay, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job: raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    if job.is_paid: raise HTTPException(status_code=400, detail="Ya cobrado")

    job.is_paid = True
    
    # --- CÁLCULO ---
    final_amount = job.amount * payment_data.exchange_rate
    
    # --- DESCRIPCIÓN ---
    desc = f"Cobro: {job.description}"
    if job.currency == "USD" and payment_data.exchange_rate > 1:
        desc += f" (U$S {job.amount} x {payment_data.exchange_rate})"

    # --- FECHA DE HOY (CORRECCIÓN) ---
    today = datetime.now().strftime("%Y-%m-%d")

    transaction = models.Transaction(
        amount=abs(final_amount),
        description=desc,
        date=today, # <--- USAMOS LA FECHA DE COBRO, NO LA DEL TRABAJO
        account_id=payment_data.account_id,
        category_id=1 
    )
    
    account = db.query(models.Account).filter(models.Account.id == payment_data.account_id).first()
    if account: account.balance += abs(final_amount)

    db.add(transaction)
    db.commit()
    return {"message": "Cobro registrado"}

# BORRAR CUENTA
@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    # Buscamos la cuenta
    account = db.query(models.Account).filter(models.Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    
    # Opcional: Borrar transacciones asociadas primero para evitar errores (Cascade manual)
    db.query(models.Transaction).filter(models.Transaction.account_id == account_id).delete()
    
    db.delete(account)
    db.commit()
    return {"message": "Cuenta eliminada"}

# BORRAR CATEGORÍA
@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    if category.user_id is None:
        raise HTTPException(status_code=403, detail="No podés borrar categorías del sistema")

    db.delete(category)
    db.commit()
    return {"message": "Categoría eliminada"}

@app.post("/users/{user_id}/goals/", response_model=schemas.GoalResponse)
def create_goal(user_id: int, goal: schemas.GoalCreate, db: Session = Depends(get_db)):
    db_goal = models.Goal(**goal.dict(), user_id=user_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.get("/users/{user_id}/goals/", response_model=List[schemas.GoalResponse])
def read_goals(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Goal).filter(models.Goal.user_id == user_id).all()

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    db.query(models.Goal).filter(models.Goal.id == goal_id).delete()
    db.commit()
    return {"message": "Meta eliminada"}

# --- MAGIA: MOVER PLATA A LA META ---
@app.post("/goals/{goal_id}/deposit")
def deposit_to_goal(goal_id: int, deposit: schemas.GoalDeposit, db: Session = Depends(get_db)):
    # 1. Buscar Meta y Cuenta
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    account = db.query(models.Account).filter(models.Account.id == deposit.account_id).first()

    if not goal or not account:
        raise HTTPException(status_code=404, detail="Meta o Cuenta no encontrada")

    # 2. Validar Moneda (Para simplificar, solo permitimos misma moneda)
    if goal.currency != account.currency:
        raise HTTPException(status_code=400, detail=f"No podés mezclar monedas. La meta es {goal.currency} y la cuenta es {account.currency}")

    # 3. Validar Saldo
    if account.balance < deposit.amount:
        raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta")

    # 4. Mover la plata
    account.balance -= deposit.amount
    goal.current_amount += deposit.amount

    # 5. Registrar Transacción de salida (Para que quede en el historial)
    transaction = models.Transaction(
        amount=-deposit.amount,
        description=f"Ahorro para meta: {goal.name}",
        date=datetime.now().strftime("%Y-%m-%d"),
        account_id=account.id,
        category_id=1 # O idealmente una categoría "Ahorro"
    )
    
    db.add(transaction)
    db.commit()
    
    return {"message": "¡Ahorro registrado!", "new_balance": goal.current_amount}

# --- REGISTRO DE USUARIO ---
@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    return crud.create_user(db=db, user=user)

# --- LOGIN (OBTENER TOKEN) ---
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Buscar usuario
    user = crud.get_user_by_email(db, email=form_data.username) # OAuth2 usa 'username' para el email
    
    # 2. Verificar contraseña (usamos la función de auth.py, importala si hace falta o usala desde auth)
    # Nota: Para hacerlo simple, validamos acá directo con auth
    import auth
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Generar token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- EJEMPLO DE RUTA PROTEGIDA (INFO DEL USUARIO) ---
@app.get("/users/me/", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user