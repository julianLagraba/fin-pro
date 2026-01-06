from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- SCHEMAS DE USUARIO ---

# Lo que recibimos al crear usuario
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str  

class UserResponse(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True
        
# --- SCHEMAS DE CUENTAS (Banco, Efectivo) ---

class AccountCreate(BaseModel):
    name: str
    balance: float
    currency: str

class AccountResponse(BaseModel):
    id: int
    name: str
    balance: float
    user_id: int
    currency: str

    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS DE TRANSACCIONES (Gastos/Ingresos) ---

class TransactionCreate(BaseModel):
    amount: float
    category_id: int
    account_id: int
    description: Optional[str] = None
    # La fecha es opcional, si no la mandan usamos "ahora"
    date: Optional[datetime] = None 

class TransactionResponse(BaseModel):
    id: int
    account: AccountResponse
    amount: float
    description: Optional[str]
    date: datetime
    category_id: int
    account_id: int

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    name: str
    price: float
    currency: str 
    billing_day: int
    card_id: int | None = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- SCHEMAS TARJETAS ---
class CreditCardBase(BaseModel):
    name: str
    limit: float
    closing_day: int

class CreditCardCreate(CreditCardBase):
    pass

class CreditCardResponse(CreditCardBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- SCHEMAS COMPRAS TARJETA ---
class CardPurchaseCreate(BaseModel):
    description: str
    amount: float
    currency: str
    installments: int
    date: str
    is_recurring: bool

class CardPurchaseResponse(CardPurchaseCreate):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS CLIENTES ---
class ClientBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None

class ClientCreate(ClientBase):
    pass

class ClientResponse(ClientBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# --- SCHEMAS TRABAJOS (JOBS) ---
class JobCreate(BaseModel):
    description: str
    amount: float
    date: str
    currency: str

class JobResponse(JobCreate):
    id: int
    is_paid: bool
    client_id: int
    class Config:
        from_attributes = True

# --- SCHEMA PARA PAGAR (SOLO RECIBE ID CUENTA) ---
class JobPay(BaseModel):
    account_id: int
    exchange_rate: float = 1.0

# --- GOALS ---
class GoalBase(BaseModel):
    name: str
    target_amount: float
    currency: str
    deadline: str

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: int
    current_amount: float
    user_id: int
    class Config:
        from_attributes = True

# --- SCHEMA PARA DEPOSITAR EN META ---
class GoalDeposit(BaseModel):
    account_id: int
    amount: float

