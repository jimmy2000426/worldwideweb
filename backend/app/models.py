from datetime import datetime, date
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:10]}"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("user"))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[str] = mapped_column(String(32), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    barber_profile = relationship("BarberProfile", back_populates="user", uselist=False)
    refresh_tokens = relationship("RefreshToken", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("rt"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    replaced_by_token_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="refresh_tokens")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    base_price: Mapped[int] = mapped_column(Integer, default=0)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class Addon(Base):
    __tablename__ = "addons"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class BarberProfile(Base):
    __tablename__ = "barber_profiles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="")
    specialty: Mapped[str] = mapped_column(String(255), default="")
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    user = relationship("User", back_populates="barber_profile")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"
    __table_args__ = (
        UniqueConstraint("barber_id", "slot_date", "start_time", "end_time", name="uq_availability_slot"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("slot"))
    barber_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    slot_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[str] = mapped_column(String(5), index=True)
    end_time: Mapped[str] = mapped_column(String(5))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    source: Mapped[str] = mapped_column(String(32), default="seed")


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        UniqueConstraint(
            "customer_id",
            "appointment_date",
            "start_time",
            "end_time",
            "status",
            name="uq_customer_slot_status",
        ),
        UniqueConstraint(
            "barber_id",
            "appointment_date",
            "start_time",
            "end_time",
            "status",
            name="uq_barber_slot_status",
        ),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("apt"))
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    barber_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"), index=True)
    appointment_date: Mapped[date] = mapped_column(Date, index=True)
    start_time: Mapped[str] = mapped_column(String(5), index=True)
    end_time: Mapped[str] = mapped_column(String(5), index=True)
    status: Mapped[str] = mapped_column(String(32), default="待確認", index=True)
    base_price_snapshot: Mapped[int] = mapped_column(Integer, default=0)
    addon_price_snapshot: Mapped[int] = mapped_column(Integer, default=0)
    total_price_snapshot: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    customer_name_snapshot: Mapped[str] = mapped_column(String(120), default="")
    customer_phone_snapshot: Mapped[str] = mapped_column(String(32), default="")
    barber_name_snapshot: Mapped[str] = mapped_column(String(120), default="")
    service_name_snapshot: Mapped[str] = mapped_column(String(120), default="")
    service_duration_snapshot: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    addons = relationship("AppointmentAddon", back_populates="appointment", cascade="all, delete-orphan")


class AppointmentAddon(Base):
    __tablename__ = "appointment_addons"
    __table_args__ = (UniqueConstraint("appointment_id", "addon_id", name="uq_appointment_addon"),)

    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), primary_key=True)
    addon_id: Mapped[str] = mapped_column(ForeignKey("addons.id"), primary_key=True)
    addon_name_snapshot: Mapped[str] = mapped_column(String(120), default="")
    addon_price_snapshot: Mapped[int] = mapped_column(Integer, default=0)

    appointment = relationship("Appointment", back_populates="addons")

