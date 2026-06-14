from contextlib import asynccontextmanager
from datetime import datetime, UTC, date, timedelta
import re

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from .config import Settings
from .database import Base, build_engine, build_session_factory, get_db
from .models import (
    Addon,
    Appointment,
    AppointmentAddon,
    AvailabilitySlot,
    BarberProfile,
    Service,
    User,
    RefreshToken,
)
from .schemas import (
    AddonRead,
    AssistantParsedRead,
    AssistantQueryRequest,
    AssistantSuggestionRead,
    ApiEnvelope,
    AppointmentAddonRead,
    AppointmentCreateRequest,
    AppointmentRead,
    AuthResponse,
    BarberProfileRead,
    BarberRead,
    LoginRequest,
    RegisterRequest,
    RescheduleRequest,
    ServiceRead,
    StatusRequest,
    UserRead,
)
from .seed import seed_demo_data
from .security import create_token_pair, decode_token, hash_password, token_hash, verify_password


def utcnow():
    return datetime.now(UTC)


def date_label(value: date) -> str:
    weekday_map = ["日", "一", "二", "三", "四", "五", "六"]
    return f"{value.year}/{value.month:02d}/{value.day:02d}（週{weekday_map[value.weekday()]}）"


def make_error(code: str, message: str, status_code: int):
    raise HTTPException(
        status_code=status_code,
        detail={"success": False, "error": {"code": code, "message": message}},
    )


def appointment_addons_to_snapshot(appointment: Appointment):
    return [
        AppointmentAddonRead(
            addonId=item.addon_id,
            addonNameSnapshot=item.addon_name_snapshot,
            addonPriceSnapshot=item.addon_price_snapshot,
        )
        for item in appointment.addons
    ]


def appointment_to_read(appointment: Appointment) -> AppointmentRead:
    return AppointmentRead(
        id=appointment.id,
        customerId=appointment.customer_id,
        customerNameSnapshot=appointment.customer_name_snapshot,
        customerPhoneSnapshot=appointment.customer_phone_snapshot,
        barberId=appointment.barber_id,
        barberNameSnapshot=appointment.barber_name_snapshot,
        serviceId=appointment.service_id,
        serviceNameSnapshot=appointment.service_name_snapshot,
        serviceDurationSnapshot=appointment.service_duration_snapshot,
        appointmentDate=appointment.appointment_date,
        startTime=appointment.start_time,
        endTime=appointment.end_time,
        status=appointment.status,
        basePriceSnapshot=appointment.base_price_snapshot,
        addonPriceSnapshot=appointment.addon_price_snapshot,
        totalPriceSnapshot=appointment.total_price_snapshot,
        addonsSnapshot=appointment_addons_to_snapshot(appointment),
        notes=appointment.notes,
        createdAt=appointment.created_at,
        updatedAt=appointment.updated_at,
    )


def ensure_auth_header(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        make_error("AUTH_UNAUTHORIZED", "尚未登入。", status.HTTP_401_UNAUTHORIZED)
    return authorization.split(" ", 1)[1]


def password_hash(value: str) -> str:
    return hash_password(value)


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(lambda: None),
):
    raise RuntimeError("dependency placeholder")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    engine = build_engine(settings.database_url)
    session_factory = build_session_factory(engine)

    Base.metadata.create_all(bind=engine)
    if settings.seed_demo_data:
        with session_factory() as session:
            seed_demo_data(session)

    def db_dependency():
        yield from get_db(session_factory)

    def auth_dependency(authorization: str | None = Header(default=None), db: Session = Depends(db_dependency)):
        token = ensure_auth_header(authorization)
        try:
            payload = decode_token(settings, token)
        except Exception:
            make_error("AUTH_UNAUTHORIZED", "登入資訊無效。", status.HTTP_401_UNAUTHORIZED)

        if payload.get("typ") != "access":
            make_error("AUTH_UNAUTHORIZED", "登入資訊無效。", status.HTTP_401_UNAUTHORIZED)

        user = db.get(User, payload["sub"])
        if not user or not user.is_active:
            make_error("AUTH_ACCOUNT_INACTIVE", "帳號已停用。", status.HTTP_403_FORBIDDEN)
        return user

    def staff_dependency(current_user: User = Depends(auth_dependency)):
        if current_user.role not in {"admin", "barber"}:
            make_error("FORBIDDEN_ROLE", "權限不足。", status.HTTP_403_FORBIDDEN)
        return current_user

    app = FastAPI(title="Style & Trim API", version="1.0.0")
    cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins or ["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = session_factory

    @app.exception_handler(HTTPException)
    def http_exception_handler(_request, exc: HTTPException):
        payload = exc.detail if isinstance(exc.detail, dict) else {
            "success": False,
            "error": {"code": "UNKNOWN_ERROR", "message": str(exc.detail)},
        }
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/auth/login", response_model=ApiEnvelope)
    def login(payload: LoginRequest, db: Session = Depends(db_dependency)):
        normalized = payload.account.strip().lower()
        user = (
            db.execute(
                select(User).where(
                    (func.lower(User.email) == normalized) | (func.lower(User.phone) == normalized)
                )
            )
            .scalars()
            .first()
        )
        if not user or not verify_password(payload.password, user.password_hash):
            make_error("AUTH_INVALID_CREDENTIALS", "帳號或密碼錯誤。", status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            make_error("AUTH_ACCOUNT_INACTIVE", "帳號已停用。", status.HTTP_403_FORBIDDEN)

        access_token, refresh_token, refresh_jti, refresh_exp = create_token_pair(settings, user, payload.rememberMe)
        db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=token_hash(refresh_jti),
                jti=refresh_jti,
                expires_at=refresh_exp.replace(tzinfo=None),
            )
        )
        db.commit()

        return ApiEnvelope(
            data={
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "user": UserRead.model_validate(user).model_dump(),
            }
        )

    @app.post("/auth/register", response_model=ApiEnvelope, status_code=status.HTTP_201_CREATED)
    def register(payload: RegisterRequest, db: Session = Depends(db_dependency)):
        name = payload.name.strip()
        phone = payload.phone.strip()
        email = (payload.email or "").strip()
        password = payload.password

        if len(name) < 2:
            make_error("VALIDATION_ERROR", "請輸入至少 2 個字元的姓名。", status.HTTP_400_BAD_REQUEST)
        if not phone or not phone.startswith("09") or len(phone) != 10 or not phone.isdigit():
            make_error("VALIDATION_ERROR", "手機號碼格式需為 09 開頭的 10 碼。", status.HTTP_400_BAD_REQUEST)
        if email and "@" not in email:
            make_error("VALIDATION_ERROR", "電子郵件格式不正確。", status.HTTP_400_BAD_REQUEST)
        if len(password) < 8 or not any(ch.isalpha() for ch in password) or not any(ch.isdigit() for ch in password):
            make_error("VALIDATION_ERROR", "密碼需至少 8 碼並包含英數字。", status.HTTP_400_BAD_REQUEST)
        if password != payload.confirmPassword:
            make_error("VALIDATION_ERROR", "兩次輸入的密碼不一致。", status.HTTP_400_BAD_REQUEST)
        if not payload.acceptTerms:
            make_error("VALIDATION_ERROR", "請先同意服務條款。", status.HTTP_400_BAD_REQUEST)

        existing_phone = db.scalar(select(User).where(func.lower(User.phone) == phone.lower()))
        if existing_phone:
            make_error("DUPLICATE_PHONE", "這支手機已經註冊過。", status.HTTP_409_CONFLICT)

        if email:
            existing_email = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
            if existing_email:
                make_error("DUPLICATE_EMAIL", "這個電子郵件已經註冊過。", status.HTTP_409_CONFLICT)
        else:
            email = f"{phone}@styletrim.local"

        user = User(
            email=email,
            phone=phone,
            password_hash=password_hash(password),
            name=name,
            role="customer",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token, refresh_token, refresh_jti, refresh_exp = create_token_pair(settings, user, payload.rememberMe)
        db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=token_hash(refresh_jti),
                jti=refresh_jti,
                expires_at=refresh_exp.replace(tzinfo=None),
            )
        )
        db.commit()

        return ApiEnvelope(
            data={
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "user": UserRead.model_validate(user).model_dump(),
            }
        )

    @app.get("/auth/me", response_model=ApiEnvelope)
    def auth_me(current_user: User = Depends(auth_dependency)):
        return ApiEnvelope(data={"user": UserRead.model_validate(current_user).model_dump()})

    @app.post("/auth/refresh", response_model=ApiEnvelope)
    def auth_refresh(payload: dict, db: Session = Depends(db_dependency)):
        refresh_token = payload.get("refreshToken")
        if not refresh_token:
            make_error("AUTH_UNAUTHORIZED", "缺少 refresh token。", status.HTTP_401_UNAUTHORIZED)
        try:
            claims = decode_token(settings, refresh_token)
        except Exception:
            make_error("AUTH_REFRESH_EXPIRED", "登入已過期。", status.HTTP_401_UNAUTHORIZED)
        if claims.get("typ") != "refresh":
            make_error("AUTH_UNAUTHORIZED", "登入資訊無效。", status.HTTP_401_UNAUTHORIZED)

        record = db.scalar(select(RefreshToken).where(RefreshToken.jti == claims["jti"]))
        if not record or record.revoked_at is not None:
            make_error("AUTH_REFRESH_REVOKED", "登入已失效。", status.HTTP_401_UNAUTHORIZED)
        user = db.get(User, claims["sub"])
        if not user or not user.is_active:
            make_error("AUTH_ACCOUNT_INACTIVE", "帳號已停用。", status.HTTP_403_FORBIDDEN)

        access_token, next_refresh_token, next_jti, refresh_exp = create_token_pair(settings, user, True)
        record.revoked_at = utcnow().replace(tzinfo=None)
        record.replaced_by_token_id = next_jti
        db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=token_hash(next_jti),
                jti=next_jti,
                expires_at=refresh_exp.replace(tzinfo=None),
            )
        )
        db.commit()

        return ApiEnvelope(
            data={
                "accessToken": access_token,
                "refreshToken": next_refresh_token,
                "user": UserRead.model_validate(user).model_dump(),
            }
        )

    @app.post("/auth/logout", response_model=ApiEnvelope)
    def auth_logout(payload: dict, db: Session = Depends(db_dependency)):
        refresh_token = payload.get("refreshToken")
        if refresh_token:
            try:
                claims = decode_token(settings, refresh_token)
            except Exception:
                claims = None
            if claims and claims.get("jti"):
                record = db.scalar(select(RefreshToken).where(RefreshToken.jti == claims["jti"]))
                if record:
                    record.revoked_at = utcnow().replace(tzinfo=None)
                    db.commit()
        return ApiEnvelope(data={})

    @app.get("/services", response_model=ApiEnvelope)
    def list_services(db: Session = Depends(db_dependency)):
        items = db.execute(select(Service).where(Service.is_active.is_(True)).order_by(Service.name)).scalars().all()
        return ApiEnvelope(data={"items": [ServiceRead.model_validate(item).model_dump() for item in items]})

    @app.get("/addons", response_model=ApiEnvelope)
    def list_addons(db: Session = Depends(db_dependency)):
        items = db.execute(select(Addon).where(Addon.is_active.is_(True)).order_by(Addon.name)).scalars().all()
        return ApiEnvelope(data={"items": [AddonRead.model_validate(item).model_dump() for item in items]})

    @app.get("/barbers", response_model=ApiEnvelope)
    def list_barbers(db: Session = Depends(db_dependency)):
        items = (
            db.execute(select(User).where(User.role == "barber", User.is_active.is_(True)).order_by(User.name))
            .scalars()
            .all()
        )
        result = []
        for user in items:
            profile = db.scalar(select(BarberProfile).where(BarberProfile.user_id == user.id))
            result.append(
                BarberRead(
                    id=user.id,
                    name=user.name,
                    email=user.email,
                    phone=user.phone,
                    role=user.role,
                    is_active=user.is_active,
                    profile=BarberProfileRead.model_validate(profile).model_dump() if profile else None,
                ).model_dump()
            )
        return ApiEnvelope(data={"items": result})

    @app.get("/barbers/availability", response_model=ApiEnvelope)
    def barber_availability(date: str, time: str, serviceId: str, db: Session = Depends(db_dependency)):
        service = db.get(Service, serviceId)
        if not service or not service.is_active:
            make_error("APPOINTMENT_SERVICE_INACTIVE", "服務已停用。", status.HTTP_400_BAD_REQUEST)
        items = get_available_barbers(db, date, time, service.duration_minutes)
        return ApiEnvelope(data={"items": items})

    @app.post("/assistant/message", response_model=ApiEnvelope)
    def assistant_message(
        payload: AssistantQueryRequest,
        db: Session = Depends(db_dependency),
    ):
        services = (
            db.execute(select(Service).where(Service.is_active.is_(True)).order_by(Service.name))
            .scalars()
            .all()
        )
        barbers = (
            db.execute(select(User).where(User.role == "barber", User.is_active.is_(True)).order_by(User.name))
            .scalars()
            .all()
        )
        profiles = {
            profile.user_id: profile
            for profile in db.execute(select(BarberProfile)).scalars().all()
        }

        reply, parsed, suggestions, can_book = query_assistant_suggestions(
            message=payload.message,
            db=db,
            services=services,
            barbers=barbers,
            profiles=profiles,
        )

        return ApiEnvelope(
            data={
                "message": reply,
                "parsed": parsed.model_dump(),
                "suggestions": [item.model_dump() for item in suggestions],
                "canBook": can_book,
            }
        )

    @app.get("/me/profile", response_model=ApiEnvelope)
    def get_profile(current_user: User = Depends(auth_dependency)):
        return ApiEnvelope(data={"profile": UserRead.model_validate(current_user).model_dump()})

    @app.patch("/me/profile", response_model=ApiEnvelope)
    def update_profile(payload: dict, current_user: User = Depends(auth_dependency), db: Session = Depends(db_dependency)):
        if payload.get("name"):
            current_user.name = payload["name"].strip()
        if payload.get("phone"):
            current_user.phone = payload["phone"].strip()
        if payload.get("email"):
            current_user.email = payload["email"].strip()
        current_user.updated_at = utcnow().replace(tzinfo=None)
        db.commit()
        return ApiEnvelope(data={"profile": UserRead.model_validate(current_user).model_dump()})

    @app.get("/me/appointments", response_model=ApiEnvelope)
    def my_appointments(current_user: User = Depends(auth_dependency), db: Session = Depends(db_dependency)):
        items = (
            db.execute(
                select(Appointment)
                .options(selectinload(Appointment.addons))
                .where(Appointment.customer_id == current_user.id)
                .order_by(Appointment.created_at.desc())
            )
            .scalars()
            .all()
        )
        return ApiEnvelope(data={"items": [appointment_to_read(item).model_dump() for item in items]})

    @app.get("/appointments/{appointment_id}", response_model=ApiEnvelope)
    def get_appointment(
        appointment_id: str,
        current_user: User = Depends(auth_dependency),
        db: Session = Depends(db_dependency),
    ):
        appointment = db.execute(
            select(Appointment)
            .options(selectinload(Appointment.addons))
            .where(Appointment.id == appointment_id)
        ).scalar_one_or_none()
        if not appointment:
            make_error("APPOINTMENT_NOT_FOUND", "找不到預約。", status.HTTP_404_NOT_FOUND)
        if current_user.role == "customer" and appointment.customer_id != current_user.id:
            make_error("FORBIDDEN_ROLE", "只能查看自己的預約。", status.HTTP_403_FORBIDDEN)
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    def parse_time(value: str):
        try:
            hours, minutes = map(int, value.split(":"))
            return hours * 60 + minutes
        except Exception as exc:
            raise ValueError from exc

    def calculate_end(start_time: str, duration_minutes: int):
        total = parse_time(start_time) + duration_minutes
        return f"{total // 60:02d}:{total % 60:02d}"

    def validate_date_time(appointment_date, start_time):
        if appointment_date < datetime.now().date():
            make_error("INVALID_DATE_RANGE", "預約日期不可早於今天。", status.HTTP_400_BAD_REQUEST)
        if appointment_date.weekday() == 6:
            make_error("INVALID_DATE_RANGE", "週日目前未開放預約。", status.HTTP_400_BAD_REQUEST)
        parse_time(start_time)

    def get_available_barbers(db: Session, appointment_date: str, start_time: str, duration_minutes: int, exclude_appointment_id: str | None = None):
        from datetime import date as date_type

        date_value = date_type.fromisoformat(appointment_date)
        requested_end = calculate_end(start_time, duration_minutes)

        barbers = (
            db.execute(select(User).where(User.role == "barber", User.is_active.is_(True)).order_by(User.name))
            .scalars()
            .all()
        )
        output = []
        for barber in barbers:
            profile = db.scalar(select(BarberProfile).where(BarberProfile.user_id == barber.id))
            if not profile or not profile.is_available:
                continue
            slot = db.scalar(
                select(AvailabilitySlot).where(
                    AvailabilitySlot.barber_id == barber.id,
                    AvailabilitySlot.slot_date == date_value,
                    AvailabilitySlot.is_available.is_(True),
                    AvailabilitySlot.start_time <= start_time,
                    AvailabilitySlot.end_time >= requested_end,
                )
            )
            if not slot:
                continue

            conflict = db.execute(
                select(Appointment).where(
                    Appointment.barber_id == barber.id,
                    Appointment.appointment_date == date_value,
                    Appointment.status != "已取消",
                    Appointment.id != exclude_appointment_id if exclude_appointment_id else True,
                )
            ).scalars().first()
            if conflict:
                continue
            output.append(
                {
                    "id": barber.id,
                    "name": barber.name,
                    "profile": BarberProfileRead.model_validate(profile).model_dump() if profile else None,
                }
            )
        return output

    def normalize_text(value: str | None) -> str:
        return re.sub(r"\s+", "", (value or "").lower())

    def current_date() -> date:
        return datetime.now().astimezone().date()

    def to_minutes(value: str) -> int:
        hours, minutes = map(int, value.split(":"))
        return hours * 60 + minutes

    def from_minutes(value: int) -> str:
        return f"{value // 60:02d}:{value % 60:02d}"

    def build_time_options_for_date(date_value: date, duration_minutes: int) -> list[str]:
        if date_value < current_date() or date_value.weekday() == 6:
            return []

        start_boundary = 10 * 60
        if date_value == current_date():
            now = datetime.now().astimezone()
            current_minutes = now.hour * 60 + now.minute
            start_boundary = max(start_boundary, ((current_minutes + 1 + 29) // 30) * 30)

        options = []
        minutes = start_boundary
        while minutes + duration_minutes <= 19 * 60:
            options.append(from_minutes(minutes))
            minutes += 30
        return options

    def parse_message_date(message: str) -> tuple[date | None, str | None, bool]:
        normalized = normalize_text(message)
        today = current_date()

        explicit = re.search(r"(?P<year>\d{4})[./-](?P<month>\d{1,2})[./-](?P<day>\d{1,2})", normalized)
        if explicit:
            try:
                parsed = date(
                    int(explicit.group("year")),
                    int(explicit.group("month")),
                    int(explicit.group("day")),
                )
                return parsed, date_label(parsed), True
            except ValueError:
                pass

        relative_map = [
            ("今天", 0, "今天"),
            ("今日", 0, "今天"),
            ("明天", 1, "明天"),
            ("明日", 1, "明天"),
            ("後天", 2, "後天"),
        ]
        for token, offset, label in relative_map:
            if token in normalized:
                parsed = today + timedelta(days=offset)
                return parsed, label, False

        weekday_aliases = {
            "週一": 0,
            "星期一": 0,
            "禮拜一": 0,
            "週二": 1,
            "星期二": 1,
            "禮拜二": 1,
            "週三": 2,
            "星期三": 2,
            "禮拜三": 2,
            "週四": 3,
            "星期四": 3,
            "禮拜四": 3,
            "週五": 4,
            "星期五": 4,
            "禮拜五": 4,
            "週六": 5,
            "星期六": 5,
            "禮拜六": 5,
        }
        for token, weekday_index in weekday_aliases.items():
            if token in normalized:
                offset = (weekday_index - today.weekday()) % 7
                if offset == 0 and token in {"週六", "星期六", "禮拜六"} and today.weekday() != 5:
                    offset = 7
                parsed = today + timedelta(days=offset)
                return parsed, date_label(parsed), False

        if "週末" in normalized or "周末" in normalized:
            offset = (5 - today.weekday()) % 7
            if offset == 0 and today.weekday() != 5:
                offset = 7
            parsed = today + timedelta(days=offset)
            return parsed, "週末", False

        return None, None, False

    def parse_time_preference(message: str) -> dict:
        normalized = normalize_text(message)
        if not normalized:
            return {"label": None, "start": None, "end": None, "target": None, "sort": "earliest"}

        if "最晚" in normalized or "越晚" in normalized:
            return {"label": "晚一點", "start": None, "end": None, "target": None, "sort": "latest"}

        if "最早" in normalized or "越早" in normalized:
            return {"label": "最早", "start": None, "end": None, "target": None, "sort": "earliest"}

        ranges = [
            (("早上", "上午"), 10 * 60, 12 * 60, "早上"),
            (("中午",), 12 * 60, 14 * 60, "中午"),
            (("下午",), 13 * 60, 17 * 60, "下午"),
            (("傍晚",), 17 * 60, 18 * 60 + 30, "傍晚"),
            (("晚上",), 18 * 60, 19 * 60, "晚上"),
        ]
        for keywords, start, end, label in ranges:
            if any(keyword in normalized for keyword in keywords):
                return {"label": label, "start": start, "end": end, "target": None, "sort": "earliest"}

        explicit = re.search(
            r"(?<![\d-])(?:(上午|早上|中午|下午|傍晚|晚上))?\s*(?P<hour>\d{1,2})(?::(?P<minute>\d{2}))?\s*點?",
            normalized,
        )
        if explicit:
            hour = int(explicit.group("hour"))
            minute = int(explicit.group("minute") or 0)
            period = explicit.group(1)
            if period in {"下午", "傍晚", "晚上"} and hour < 12:
                hour += 12
            elif period in {"上午", "早上"} and hour == 12:
                hour = 0
            elif not period and 1 <= hour <= 7:
                hour += 12

            target = hour * 60 + minute
            return {
                "label": f"{hour:02d}:{minute:02d}",
                "start": max(10 * 60, target - 60),
                "end": min(19 * 60, target + 60),
                "target": target,
                "sort": "closest",
            }

        return {"label": None, "start": None, "end": None, "target": None, "sort": "earliest"}

    def find_service_from_message(message: str, services: list[Service]) -> Service | None:
        normalized = normalize_text(message)
        service_keywords = {
            "service-cut": ["洗剪", "剪髮", "剪发", "修剪", "cut"],
            "service-color": ["染髮", "染发", "染色", "染", "color"],
            "service-care": ["護髮", "頭皮", "養護", "care"],
            "service-perm": ["燙髮", "燙发", "捲髮", "perm", "perm設計", "perm design"],
        }

        for service in services:
            service_name = normalize_text(service.name)
            if service_name and service_name in normalized:
                return service
            for keyword in service_keywords.get(service.id, []):
                if normalize_text(keyword) in normalized:
                    return service

        return None

    def find_barber_from_message(message: str, barbers: list[User], profiles: dict[str, BarberProfile]) -> User | None:
        normalized = normalize_text(message)
        if not normalized:
            return None

        for barber in barbers:
            profile = profiles.get(barber.id)
            candidates = [barber.name, profile.display_name if profile else "", profile.specialty if profile else ""]
            if any(candidate and normalize_text(candidate) in normalized for candidate in candidates):
                return barber
        return None

    def query_assistant_suggestions(
        *,
        message: str,
        db: Session,
        services: list[Service],
        barbers: list[User],
        profiles: dict[str, BarberProfile],
        max_results: int = 3,
    ):
        service = find_service_from_message(message, services)
        parsed_date, date_label_value, explicit_date = parse_message_date(message)
        time_preference = parse_time_preference(message)
        barber = find_barber_from_message(message, barbers, profiles)

        missing = []
        if not service:
            missing.append("service")

        today = current_date()
        if parsed_date:
            candidate_dates = [parsed_date + timedelta(days=offset) for offset in range(0, 7)]
        else:
            candidate_dates = [today + timedelta(days=offset) for offset in range(0, 7)]

        suggestions = []
        if service:
            for date_value in candidate_dates:
                if len(suggestions) >= max_results:
                    break

                if date_value.weekday() == 6 or date_value < today:
                    continue

                time_options = build_time_options_for_date(date_value, service.duration_minutes)
                if time_preference["start"] is not None and time_preference["end"] is not None:
                    time_options = [
                        item
                        for item in time_options
                        if time_preference["start"] <= to_minutes(item) <= time_preference["end"]
                    ]

                if time_preference["sort"] == "latest":
                    time_options = list(reversed(time_options))
                elif time_preference["sort"] == "closest" and time_preference["target"] is not None:
                    time_options = sorted(time_options, key=lambda item: abs(to_minutes(item) - time_preference["target"]))

                for start_time in time_options:
                    if len(suggestions) >= max_results:
                        break

                    available_barbers = get_available_barbers(
                        db,
                        date_value.isoformat(),
                        start_time,
                        service.duration_minutes,
                    )
                    if barber:
                        available_barbers = [item for item in available_barbers if item["id"] == barber.id]

                    if not available_barbers:
                        continue

                    chosen_barber = available_barbers[0]
                    suggestions.append(
                        AssistantSuggestionRead(
                            date=date_value,
                            startTime=start_time,
                            endTime=calculate_end(start_time, service.duration_minutes),
                            serviceId=service.id,
                            serviceName=service.name,
                            barberId=chosen_barber["id"] if barber else None,
                            barberName=chosen_barber["profile"]["display_name"] if barber else None,
                            availableBarbers=[
                                item["profile"]["display_name"] if item.get("profile") else item["name"]
                                for item in available_barbers
                            ],
                        )
                    )

        needs_clarification = not service
        if needs_clarification:
            reply = "我可以幫你查空檔，不過先告訴我想做哪一種服務，像是剪髮、染髮或護髮。"
        elif suggestions:
            reply = f"我幫你找到 {len(suggestions)} 個可約時段，先看這幾個最接近你需求的選項。"
        elif parsed_date:
            reply = f"{date_label_value or '這個日期'} 目前沒有合適空檔，我幫你再往後找幾天。"
        else:
            reply = "目前還沒找到合適空檔，我可以繼續幫你往後找。"

        parsed = AssistantParsedRead(
            intent="book",
            serviceId=service.id if service else None,
            serviceName=service.name if service else None,
            dateValue=parsed_date,
            dateLabel=date_label_value,
            timeLabel=time_preference["label"],
            barberId=barber.id if barber else None,
            barberName=(profiles[barber.id].display_name if barber and barber.id in profiles else barber.name) if barber else None,
            missing=missing,
            needsClarification=needs_clarification,
        )

        return reply, parsed, suggestions, bool(service and suggestions)

    @app.post("/appointments", response_model=ApiEnvelope, status_code=status.HTTP_201_CREATED)
    def create_appointment(
        payload: AppointmentCreateRequest,
        current_user: User = Depends(auth_dependency),
        db: Session = Depends(db_dependency),
    ):
        from datetime import date as date_type

        service = db.get(Service, payload.serviceId)
        if not service or not service.is_active:
            make_error("APPOINTMENT_SERVICE_INACTIVE", "所選服務目前不可用。", status.HTTP_400_BAD_REQUEST)

        validate_date_time(payload.appointmentDate, payload.startTime)
        appointment_date = payload.appointmentDate

        if payload.addonIds:
            addons = db.execute(select(Addon).where(Addon.id.in_(payload.addonIds), Addon.is_active.is_(True))).scalars().all()
            if len(addons) != len(set(payload.addonIds)):
                make_error("APPOINTMENT_ADDON_INACTIVE", "所選加購目前不可用。", status.HTTP_400_BAD_REQUEST)
        else:
            addons = []

        requested_end = calculate_end(payload.startTime, service.duration_minutes)
        barber = None
        if payload.barberId:
            barber = db.get(User, payload.barberId)
            if not barber or barber.role != "barber" or not barber.is_active:
                make_error("FORBIDDEN_ROLE", "指定的理髮師不可用。", status.HTTP_403_FORBIDDEN)

        available_barbers = get_available_barbers(db, payload.appointmentDate.isoformat(), payload.startTime, service.duration_minutes)
        if not barber:
            barber_id = available_barbers[0]["id"] if available_barbers else None
            barber = db.get(User, barber_id) if barber_id else None
        if not barber:
            make_error("APPOINTMENT_NO_BARBER_AVAILABLE", "目前沒有可用理髮師。", status.HTTP_400_BAD_REQUEST)
        if not any(item["id"] == barber.id for item in available_barbers):
            make_error("APPOINTMENT_CONFLICT", "該時段已被預約。", status.HTTP_409_CONFLICT)

        conflict = db.execute(
            select(Appointment).where(
                Appointment.appointment_date == appointment_date,
                Appointment.status != "已取消",
            )
        ).scalars().all()
        for item in conflict:
            item_end = item.end_time or calculate_end(item.start_time, item.service_duration_snapshot or 0)
            overlap = payload.startTime < item_end and requested_end > item.startTime
            if overlap and (item.customer_id == current_user.id or item.barber_id == barber.id):
                make_error("APPOINTMENT_CONFLICT", "顧客或理髮師在此時段已有預約。", status.HTTP_409_CONFLICT)

        profile = db.scalar(select(BarberProfile).where(BarberProfile.user_id == barber.id))
        addon_total = sum(addon.price for addon in addons)
        appointment = Appointment(
            customer_id=current_user.id,
            barber_id=barber.id,
            service_id=service.id,
            appointment_date=appointment_date,
            start_time=payload.startTime,
            end_time=requested_end,
            status="待確認",
            base_price_snapshot=service.base_price,
            addon_price_snapshot=addon_total,
            total_price_snapshot=service.base_price + addon_total,
            notes=(payload.notes or "").strip(),
            customer_name_snapshot=payload.contactName or current_user.name,
            customer_phone_snapshot=payload.contactPhone or current_user.phone,
            barber_name_snapshot=profile.display_name if profile else barber.name,
            service_name_snapshot=service.name,
            service_duration_snapshot=service.duration_minutes,
        )
        db.add(appointment)
        db.flush()
        for addon in addons:
            db.add(
                AppointmentAddon(
                    appointment_id=appointment.id,
                    addon_id=addon.id,
                    addon_name_snapshot=addon.name,
                    addon_price_snapshot=addon.price,
                )
            )
        db.commit()
        db.refresh(appointment)
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    @app.patch("/appointments/{appointment_id}/reschedule", response_model=ApiEnvelope)
    def reschedule_appointment(
        appointment_id: str,
        payload: RescheduleRequest,
        current_user: User = Depends(auth_dependency),
        db: Session = Depends(db_dependency),
    ):
        appointment = db.get(Appointment, appointment_id)
        if not appointment:
            make_error("APPOINTMENT_NOT_FOUND", "找不到預約。", status.HTTP_404_NOT_FOUND)
        if current_user.role == "customer" and appointment.customer_id != current_user.id:
            make_error("FORBIDDEN_ROLE", "只能修改自己的預約。", status.HTTP_403_FORBIDDEN)
        if appointment.status not in {"待確認", "已確認"}:
            make_error("APPOINTMENT_INVALID_STATUS", "目前狀態無法改期。", status.HTTP_400_BAD_REQUEST)

        new_date = payload.appointmentDate or appointment.appointment_date
        new_start = payload.startTime or appointment.start_time
        validate_date_time(new_date, new_start)
        service = db.get(Service, appointment.service_id)
        new_end = calculate_end(new_start, service.duration_minutes)
        barber = db.get(User, payload.barberId or appointment.barber_id)
        if not barber or barber.role != "barber" or not barber.is_active:
            make_error("APPOINTMENT_NO_BARBER_AVAILABLE", "改期後沒有可用理髮師。", status.HTTP_400_BAD_REQUEST)
        available_barbers = get_available_barbers(db, new_date.isoformat(), new_start, service.duration_minutes, appointment.id)
        if not any(item["id"] == barber.id for item in available_barbers):
            make_error("APPOINTMENT_NO_BARBER_AVAILABLE", "改期後沒有可用理髮師。", status.HTTP_400_BAD_REQUEST)

        overlapping = db.execute(
            select(Appointment).where(
                Appointment.appointment_date == new_date,
                Appointment.status != "已取消",
                Appointment.id != appointment.id,
            )
        ).scalars().all()
        for item in overlapping:
            item_end = item.end_time or calculate_end(item.start_time, item.service_duration_snapshot or 0)
            if new_start < item_end and new_end > item.start_time and (
                item.customer_id == current_user.id or item.barber_id == barber.id
            ):
                make_error("APPOINTMENT_CONFLICT", "改期後與現有預約衝突。", status.HTTP_409_CONFLICT)

        profile = db.scalar(select(BarberProfile).where(BarberProfile.user_id == barber.id))
        appointment.appointment_date = new_date
        appointment.start_time = new_start
        appointment.end_time = new_end
        appointment.barber_id = barber.id
        appointment.barber_name_snapshot = profile.display_name if profile else barber.name
        appointment.updated_at = utcnow().replace(tzinfo=None)
        db.commit()
        db.refresh(appointment)
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    @app.patch("/appointments/{appointment_id}/cancel", response_model=ApiEnvelope)
    def cancel_appointment(
        appointment_id: str,
        current_user: User = Depends(auth_dependency),
        db: Session = Depends(db_dependency),
    ):
        appointment = db.get(Appointment, appointment_id)
        if not appointment:
            make_error("APPOINTMENT_NOT_FOUND", "找不到預約。", status.HTTP_404_NOT_FOUND)
        if current_user.role == "customer" and appointment.customer_id != current_user.id:
            make_error("FORBIDDEN_ROLE", "只能取消自己的預約。", status.HTTP_403_FORBIDDEN)
        if appointment.status not in {"待確認", "已確認"}:
            make_error("APPOINTMENT_INVALID_STATUS", "目前狀態無法取消。", status.HTTP_400_BAD_REQUEST)
        appointment.status = "已取消"
        appointment.updated_at = utcnow().replace(tzinfo=None)
        db.commit()
        db.refresh(appointment)
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    @app.get("/admin/appointments", response_model=ApiEnvelope)
    def admin_appointments(
        status_filter: str | None = None,
        date: str | None = None,
        current_user: User = Depends(staff_dependency),
        db: Session = Depends(db_dependency),
    ):
        query = select(Appointment).options(selectinload(Appointment.addons)).order_by(Appointment.created_at.desc())
        if status_filter and status_filter != "all":
            query = query.where(Appointment.status == status_filter)
        if date:
            from datetime import date as date_type
            query = query.where(Appointment.appointment_date == date_type.fromisoformat(date))
        items = db.execute(query).scalars().all()
        return ApiEnvelope(data={"items": [appointment_to_read(item).model_dump() for item in items]})

    @app.patch("/admin/appointments/{appointment_id}/confirm", response_model=ApiEnvelope)
    def admin_confirm(appointment_id: str, current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        appointment = db.get(Appointment, appointment_id)
        if not appointment:
            make_error("APPOINTMENT_NOT_FOUND", "找不到預約。", status.HTTP_404_NOT_FOUND)
        if appointment.status != "待確認":
            make_error("APPOINTMENT_INVALID_STATUS", "目前狀態無法確認。", status.HTTP_400_BAD_REQUEST)
        appointment.status = "已確認"
        appointment.updated_at = utcnow().replace(tzinfo=None)
        db.commit()
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    @app.patch("/admin/appointments/{appointment_id}/complete", response_model=ApiEnvelope)
    def admin_complete(appointment_id: str, current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        appointment = db.get(Appointment, appointment_id)
        if not appointment:
            make_error("APPOINTMENT_NOT_FOUND", "找不到預約。", status.HTTP_404_NOT_FOUND)
        if appointment.status != "已確認":
            make_error("APPOINTMENT_INVALID_STATUS", "目前狀態無法完成。", status.HTTP_400_BAD_REQUEST)
        appointment.status = "已完成"
        appointment.updated_at = utcnow().replace(tzinfo=None)
        db.commit()
        return ApiEnvelope(data={"appointment": appointment_to_read(appointment).model_dump()})

    @app.patch("/admin/appointments/{appointment_id}/cancel", response_model=ApiEnvelope)
    def admin_cancel(appointment_id: str, current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        return cancel_appointment(appointment_id, current_user=current_user, db=db)

    @app.get("/admin/availability", response_model=ApiEnvelope)
    def admin_availability(current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        items = db.execute(select(AvailabilitySlot).order_by(AvailabilitySlot.slot_date.asc())).scalars().all()
        data = [
            {
                "id": item.id,
                "barberId": item.barber_id,
                "date": item.slot_date.isoformat(),
                "startTime": item.start_time,
                "endTime": item.end_time,
                "isAvailable": item.is_available,
                "source": item.source,
            }
            for item in items
        ]
        return ApiEnvelope(data={"items": data})

    @app.patch("/admin/availability", response_model=ApiEnvelope)
    def admin_update_availability(payload: dict, current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        return ApiEnvelope(data={})

    @app.get("/admin/reports", response_model=ApiEnvelope)
    def admin_reports(current_user: User = Depends(staff_dependency), db: Session = Depends(db_dependency)):
        total_revenue = (
            db.execute(
                select(func.coalesce(func.sum(Appointment.total_price_snapshot), 0)).where(
                    Appointment.status.in_(["已確認", "已完成"])
                )
            )
            .scalar_one()
        )
        return ApiEnvelope(data={"summary": {"revenue": int(total_revenue or 0)}})

    return app
