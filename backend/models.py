from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String) 
    is_active = Column(Boolean, default=True)

    # Relaciones
    accounts = relationship("Account", back_populates="owner")
    clients = relationship("Client", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="owner")
    credit_cards = relationship("CreditCard", back_populates="owner")
    goals = relationship("Goal", back_populates="owner")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    balance = Column(Float, default=0.0)
    user_id = Column(Integer, ForeignKey("users.id"))
    currency = Column(String, default="ARS")

    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    description = Column(String)
    date = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))

    account = relationship("Account", back_populates="transactions")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    currency = Column(String, default="ARS")
    billing_day = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=True)

    owner = relationship("User", back_populates="subscriptions")

class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    limit = Column(Float)
    closing_day = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="credit_cards")
    purchases = relationship("CardPurchase", back_populates="card")

class CardPurchase(Base):
    __tablename__ = "card_purchases"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    currency = Column(String)
    installments = Column(Integer)
    date = Column(String)
    is_recurring = Column(Boolean, default=False)
    card_id = Column(Integer, ForeignKey("credit_cards.id"))

    card = relationship("CreditCard", back_populates="purchases")

# --- MÓDULO CLIENTES ---

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="clients")
    jobs = relationship("Job", back_populates="client")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    amount = Column(Float)
    is_paid = Column(Boolean, default=False)
    date = Column(String)
    client_id = Column(Integer, ForeignKey("clients.id"))
    currency = Column(String, default="ARS")

    client = relationship("Client", back_populates="jobs")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    target_amount = Column(Float) 
    current_amount = Column(Float, default=0.0)
    currency = Column(String, default="ARS")
    deadline = Column(String) 
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="goals")