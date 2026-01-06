from sqlalchemy.orm import Session, joinedload
import models, schemas


# --- USUARIOS ---
def create_user(db: Session, user: schemas.UserCreate):
    from auth import get_password_hash
    # ENCRIPTAMOS LA CONTRASEÑA ANTES DE GUARDAR
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# --- CUENTAS ---
def create_account(db: Session, account: schemas.AccountCreate, user_id: int):
    db_account = models.Account(**account.dict(), user_id=user_id)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

# --- TRANSACCIONES ---
def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int):
    # 1. Creamos la transacción (SIN user_id, porque ya tiene account_id)
    db_transaction = models.Transaction(**transaction.dict())
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # 2. Actualizamos el saldo de la cuenta automáticamente
    # Buscamos la cuenta afectada
    account = db.query(models.Account).filter(models.Account.id == transaction.account_id).first()
    if account:
        account.balance += transaction.amount # Sumamos (o restamos si es negativo)
        db.commit() # Guardamos el nuevo saldo
    
    return db_transaction

def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_transactions_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction)\
             .options(joinedload(models.Transaction.account))\
             .join(models.Account)\
             .filter(models.Account.user_id == user_id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_subscriptions(db: Session, user_id: int):
    return db.query(models.Subscription).filter(models.Subscription.user_id == user_id).all()

def create_subscription(db: Session, subscription: schemas.SubscriptionCreate, user_id: int):
    db_subscription = models.Subscription(**subscription.dict(), user_id=user_id)
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

# --- FUNCIONES TARJETAS ---
def create_credit_card(db: Session, card: schemas.CreditCardCreate, user_id: int):
    db_card = models.CreditCard(**card.dict(), user_id=user_id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

def get_credit_cards(db: Session, user_id: int):
    # Traemos las tarjetas y sus compras
    return db.query(models.CreditCard).filter(models.CreditCard.user_id == user_id).all()

def create_card_purchase(db: Session, purchase: schemas.CardPurchaseCreate, card_id: int):
    db_purchase = models.CardPurchase(**purchase.dict(), card_id=card_id)
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)
    return db_purchase

def get_card_purchases(db: Session, card_id: int):
    return db.query(models.CardPurchase).filter(models.CardPurchase.card_id == card_id).all()

def delete_card_purchase(db: Session, purchase_id: int):
    purchase = db.query(models.CardPurchase).filter(models.CardPurchase.id == purchase_id).first()
    if purchase:
        db.delete(purchase)
        db.commit()
        return True
    return False

def get_categories(db: Session):
    return db.query(models.Category).all()

# --- CLIENTES ---
def create_client(db: Session, client: schemas.ClientCreate, user_id: int):
    db_client = models.Client(**client.dict(), user_id=user_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_clients(db: Session, user_id: int):
    return db.query(models.Client).filter(models.Client.user_id == user_id).all()

# --- TRABAJOS ---
def create_job(db: Session, job: schemas.JobCreate, client_id: int):
    db_job = models.Job(**job.dict(), client_id=client_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

def get_client_jobs(db: Session, client_id: int):
    return db.query(models.Job).filter(models.Job.client_id == client_id).all()