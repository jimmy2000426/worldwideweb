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
        Service(
            id="service-perm",
            name="燙髮設計",
            description="依髮質與臉型調整捲度與支撐度，做出更有線條感的燙髮造型。",
            base_price=1800,
            duration_minutes=150,
            is_active=True,
        ),
    ]

    existing_service_ids = {
        item[0]
        for item in session.query(Service.id).all()
    }
    for service in services:
        if service.id not in existing_service_ids:
            session.add(service)

    addons = [
        Addon(id="addon-scalp", name="頭皮按摩", description="加強放鬆與血液循環，適合緊繃日常。", price=300, is_active=True),
        Addon(id="addon-essence", name="護髮精華", description="補水修護並提升髮絲光澤。", price=250, is_active=True),
        Addon(id="addon-styling", name="造型定型", description="讓髮型維持更久、更有線條感。", price=150, is_active=True),
    ]

    existing_addon_ids = {
        item[0]
        for item in session.query(Addon.id).all()
    }
    for addon in addons:
        if addon.id not in existing_addon_ids:
            session.add(addon)

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
            id="user-barber-3",
            name="Joy",
            email="joy@test.com",
            phone="0911000002",
            password_hash=hash_password("barber123"),
            role="barber",
            is_active=True,
        ),
        User(
            id="user-barber-4",
            name="Mila",
            email="mila@test.com",
            phone="0911000003",
            password_hash=hash_password("barber123"),
            role="barber",
            is_active=True,
        ),
        User(
            id="user-barber-5",
            name="Neo",
            email="neo@test.com",
            phone="0911000004",
            password_hash=hash_password("barber123"),
            role="barber",
            is_active=True,
        ),
        User(
            id="user-barber-6",
            name="Luna",
            email="luna@test.com",
            phone="0911000005",
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
        BarberProfile(
            id="profile-barber-3",
            user_id="user-barber-3",
            display_name="Joy",
            bio="擅長短髮輪廓與俐落層次，讓日常造型更好整理。",
            specialty="短髮 / 質感造型",
            is_available=True,
        ),
        BarberProfile(
            id="profile-barber-4",
            user_id="user-barber-4",
            display_name="Mila",
            bio="把長髮做得輕盈、有空氣感，也很重視髮絲光澤。",
            specialty="長髮 / 柔霧染髮",
            is_available=True,
        ),
        BarberProfile(
            id="profile-barber-5",
            user_id="user-barber-5",
            display_name="Neo",
            bio="先看平常整理習慣，再決定層次和長度，強調實用性。",
            specialty="男生髮 / 油頭剪裁",
            is_available=True,
        ),
        BarberProfile(
            id="profile-barber-6",
            user_id="user-barber-6",
            display_name="Luna",
            bio="擅長做出自然、輕盈的中長髮線條，日常也很好整理。",
            specialty="中長髮 / 空氣感",
            is_available=True,
        ),
    ]

    existing_user_ids = {item[0] for item in session.query(User.id).all()}
    for user in users:
        if user.id not in existing_user_ids:
            session.add(user)

    existing_profile_ids = {item[0] for item in session.query(BarberProfile.id).all()}
    for profile in barber_profiles:
        if profile.id not in existing_profile_ids:
            session.add(profile)

    session.flush()

    barber_ids = [item[0] for item in session.query(BarberProfile.user_id).all()]
    existing_slots = {
        (item.barber_id, item.slot_date.isoformat(), item.start_time, item.end_time)
        for item in session.query(AvailabilitySlot).all()
    }
    start_day = date.today()
    for offset in range(60):
        current = start_day + timedelta(days=offset)
        if current.weekday() == 6:
            continue
        for barber_id in barber_ids:
            slot_key = (barber_id, current.isoformat(), "10:00", "19:00")
            if slot_key in existing_slots:
                continue
            session.add(
                AvailabilitySlot(
                    barber_id=barber_id,
                    slot_date=current,
                    start_time="10:00",
                    end_time="19:00",
                    is_available=True,
                    source="seed",
                )
            )

    session.commit()
