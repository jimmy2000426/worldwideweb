from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ApiEnvelope(BaseModel):
    success: bool = True
    message: str = "ok"
    data: dict = Field(default_factory=dict)


class ErrorEnvelope(BaseModel):
    success: bool = False
    error: dict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    phone: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    account: str
    password: str
    rememberMe: bool = True


class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: str | None = ""
    password: str
    confirmPassword: str
    acceptTerms: bool = True
    rememberMe: bool = True


class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: UserRead


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    base_price: int
    duration_minutes: int
    is_active: bool


class AddonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    price: int
    is_active: bool


class BarberProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    display_name: str
    bio: str
    specialty: str
    is_available: bool


class BarberRead(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    profile: BarberProfileRead | None = None


class AppointmentAddonRead(BaseModel):
    addonId: str
    addonNameSnapshot: str
    addonPriceSnapshot: int


class AppointmentRead(BaseModel):
    id: str
    customerId: str
    customerNameSnapshot: str
    customerPhoneSnapshot: str
    barberId: str
    barberNameSnapshot: str
    serviceId: str
    serviceNameSnapshot: str
    serviceDurationSnapshot: int
    appointmentDate: date
    startTime: str
    endTime: str
    status: str
    basePriceSnapshot: int
    addonPriceSnapshot: int
    totalPriceSnapshot: int
    addonsSnapshot: list[AppointmentAddonRead]
    notes: str
    createdAt: datetime
    updatedAt: datetime


class AppointmentCreateRequest(BaseModel):
    serviceId: str
    barberId: str | None = None
    appointmentDate: date
    startTime: str
    addonIds: list[str] = Field(default_factory=list)
    notes: str | None = None
    contactName: str | None = None
    contactPhone: str | None = None


class RescheduleRequest(BaseModel):
    appointmentDate: date | None = None
    startTime: str | None = None
    barberId: str | None = None


class StatusRequest(BaseModel):
    nextStatus: str


class AssistantQueryRequest(BaseModel):
    message: str


class AssistantSuggestionRead(BaseModel):
    date: date
    startTime: str
    endTime: str
    serviceId: str
    serviceName: str
    barberId: str | None = None
    barberName: str | None = None
    availableBarbers: list[str] = Field(default_factory=list)


class AssistantParsedRead(BaseModel):
    intent: str
    serviceId: str | None = None
    serviceName: str | None = None
    dateValue: date | None = None
    dateLabel: str | None = None
    timeLabel: str | None = None
    barberId: str | None = None
    barberName: str | None = None
    missing: list[str] = Field(default_factory=list)
    needsClarification: bool = False


class AssistantQueryResponse(BaseModel):
    message: str
    parsed: AssistantParsedRead
    suggestions: list[AssistantSuggestionRead] = Field(default_factory=list)
    canBook: bool = False
