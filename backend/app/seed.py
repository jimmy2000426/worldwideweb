from datetime import date, timedelta

from .models import (
    Addon,
    AvailabilitySlot,
    BarberProfile,
    Service,
    User,
)
from .security import hash_password


def fmt_date(d: date) -> str:
    return d.isoformat()


def calculate_end(start_time: str, duration_minutes: int) -> str:
    hours, minutes = map(int, start_time.split(":"))
    total = hours * 60 + minutes + duration_minutes
    return f"{total // 60:02d}:{total % 60:02d}"


def seed_demo_data(session):
    if session.query(User).count():
        return

    services = [
        Service(
            id="service-cut",
            name="經典洗剪",
            description="深層洗髮與專屬造型修剪，維持俐落與清爽的第一印象。",
            base_price=600,
            duration_minutes=45,
            is_active=True,
        ),
        Service(
            id="service-color",
            name="質感染髮",
            description="採用高質感染劑與分層上色，打造更顯色的髮型輪廓。",
            base_price=1500,
            duration_minutes=120,
            is_active=True,
        ),
        Service(
            id="service-care",
            name="頭皮養護",
            description="深層清潔毛囊、舒緩壓力並保護頭皮健康。",
            base_price=800,
            duration_minutes=60,
            is_active=True,
        ),
    ]

    addons = [
        Addon(id="addon-scalp", name="頭皮按摩", description="加強放鬆與血液循環，適合緊繃日常。", price=300, is_active=True),
        Addon(id="addon-essence", name="護髮精華", description="補水修護並提升髮絲光澤。", price=250, is_active=True),
        Addon(id="addon-styling", name="造型定型", description="讓髮型維持更久、更有線條感。", price=150, is_active=True),
    ]

    users = [
        User(
            id="user-admin",
            name="許經理",
            email="admin@test.com",
            phone="0900000000",
            password_hash=hash_password("admin123"),
            role="admin",
            is_active=True,
        ),
        User(
            id="user-barber-1",
            name="Alex",
            email="barber@test.com",
            phone="0911000000",
            password_hash=hash_password("barber123"),
            role="barber",
            is_active=True,
        ),
        User(
            id="user-barber-2",
            name="BEN",
            email="ben@test.com",
            phone="0911000001",
            password_hash=hash_password("barber123"),
            role="barber",
            is_active=True,
        ),
        User(
            id="user-customer-1",
            name="林小姐",
            email="sakura@example.com",
            phone="0912345678",
            password_hash=hash_password("customer123"),
            role="customer",
            is_active=True,
        ),
    ]

    barber_profiles = [
        BarberProfile(
            id="profile-barber-1",
            user_id="user-barber-1",
            display_name="Alex",
            bio="擅長英倫油頭、漸層推剪與精準線條修飾。",
            specialty="油頭 / 漸層推剪",
            is_available=True,
        ),
        BarberProfile(
            id="profile-barber-2",
            user_id="user-barber-2",
            display_name="BEN",
            bio="專注日韓系燙髮與髮色設計，適合追求層次與輪廓的人。",
            specialty="燙髮 / 染髮設計",
            is_available=True,
        ),
    ]

    availability_slots = []
    start_day = date.today()
    for offset in range(60):
        current = start_day + timedelta(days=offset)
        if current.weekday() == 6:
            continue
        for barber_id in ("user-barber-1", "user-barber-2"):
            availability_slots.append(
                AvailabilitySlot(
                    barber_id=barber_id,
                    slot_date=current,
                    start_time="10:00",
                    end_time="19:00",
                    is_available=True,
                    source="seed",
                )
            )

    session.add_all([*services, *addons, *users, *barber_profiles])
    session.flush()

    session.add_all(availability_slots)
    session.flush()
    session.commit()
