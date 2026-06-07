import { addDays, formatDateInput } from '../utils/date';
import { calculateAppointmentEnd } from '../utils/booking';

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createWorkingSlots(barberIds, days = 21) {
  const slots = [];
  const start = new Date();

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(start, offset);
    const dateInput = formatDateInput(date);
    const weekday = date.getDay();

    if (weekday === 0) continue;

    barberIds.forEach((barberId) => {
      slots.push({
        id: uid('slot'),
        barberId,
        date: dateInput,
        startTime: '10:00',
        endTime: '19:00',
        isAvailable: true,
        source: 'seed',
      });
    });
  }

  return slots;
}

export function createSeedState() {
  const services = [
    {
      id: 'service-cut',
      name: '經典洗剪',
      description: '深層洗髮與專屬造型修剪，維持俐落與清爽的第一印象。',
      teaser: '整理輪廓，維持清爽俐落。',
      priceRange: 'NT$600 - 900',
      basePrice: 600,
      durationMinutes: 45,
      isActive: true,
    },
    {
      id: 'service-color',
      name: '質感染髮',
      description: '採用高質感染劑與分層上色，打造更顯色的髮型輪廓。',
      teaser: '用色彩改變整體氣質。',
      priceRange: 'NT$1,500 - 2,800',
      basePrice: 1500,
      durationMinutes: 120,
      isActive: true,
    },
    {
      id: 'service-care',
      name: '頭皮養護',
      description: '深層清潔毛囊、舒緩壓力並保護頭皮健康。',
      teaser: '讓頭皮更放鬆，髮感更穩定。',
      priceRange: 'NT$800 - 1,200',
      basePrice: 800,
      durationMinutes: 60,
      isActive: true,
    },
  ];

  const addons = [
    {
      id: 'addon-scalp',
      name: '頭皮按摩',
      description: '加強放鬆與血液循環，適合緊繃日常。',
      price: 300,
      isActive: true,
    },
    {
      id: 'addon-essence',
      name: '護髮精華',
      description: '補水修護並提升髮絲光澤。',
      price: 250,
      isActive: true,
    },
    {
      id: 'addon-styling',
      name: '造型定型',
      description: '讓髮型維持更久、更有線條感。',
      price: 150,
      isActive: true,
    },
  ];

  const users = [
    {
      id: 'user-admin',
      name: '許經理',
      email: 'admin@test.com',
      phone: '0900000000',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    },
    {
      id: 'user-barber-1',
      name: 'Alex',
      email: 'barber@test.com',
      phone: '0911000000',
      password: 'barber123',
      role: 'barber',
      isActive: true,
    },
    {
      id: 'user-barber-2',
      name: 'BEN',
      email: 'ben@test.com',
      phone: '0911000001',
      password: 'barber123',
      role: 'barber',
      isActive: true,
    },
    {
      id: 'user-customer-1',
      name: '林小姐',
      email: 'sakura@example.com',
      phone: '0912345678',
      password: 'customer123',
      role: 'customer',
      isActive: true,
    },
  ];

  const barberProfiles = [
    {
      id: 'profile-barber-1',
      userId: 'user-barber-1',
      displayName: 'Alex',
      bio: '擅長英倫油頭、漸層推剪與精準線條修飾。',
      specialty: '油頭 / 漸層推剪',
      isAvailable: true,
    },
    {
      id: 'profile-barber-2',
      userId: 'user-barber-2',
      displayName: 'BEN',
      bio: '專注日韓系燙髮與髮色設計，適合追求層次與輪廓的人。',
      specialty: '燙髮 / 染髮設計',
      isAvailable: true,
    },
  ];

  const availabilitySlots = createWorkingSlots(
    barberProfiles.map((profile) => profile.userId),
  );

  const tomorrow = formatDateInput(addDays(new Date(), 1));
  const dayAfterTomorrow = formatDateInput(addDays(new Date(), 2));
  const endOne = calculateAppointmentEnd('10:00', services[0].durationMinutes);
  const endTwo = calculateAppointmentEnd('13:00', services[1].durationMinutes);
  const endThree = calculateAppointmentEnd('15:00', services[2].durationMinutes);

  const appointments = [
    {
      id: 'apt-1001',
      customerId: 'user-customer-1',
      customerNameSnapshot: '林小姐',
      customerPhoneSnapshot: '0912345678',
      barberId: 'user-barber-1',
      barberNameSnapshot: 'Alex',
      serviceId: 'service-cut',
      serviceNameSnapshot: '經典洗剪',
      serviceDurationSnapshot: 45,
      appointmentDate: tomorrow,
      startTime: '10:00',
      endTime: endOne,
      status: '已確認',
      basePriceSnapshot: 600,
      addonPriceSnapshot: 300,
      totalPriceSnapshot: 900,
      addonsSnapshot: [
        {
          addonId: 'addon-scalp',
          addonNameSnapshot: '頭皮按摩',
          addonPriceSnapshot: 300,
        },
      ],
      notes: '希望髮頂稍微蓬鬆，側邊俐落。',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-1002',
      customerId: 'user-customer-1',
      customerNameSnapshot: '林小姐',
      customerPhoneSnapshot: '0912345678',
      barberId: 'user-barber-2',
      barberNameSnapshot: 'BEN',
      serviceId: 'service-color',
      serviceNameSnapshot: '質感染髮',
      serviceDurationSnapshot: 120,
      appointmentDate: dayAfterTomorrow,
      startTime: '13:00',
      endTime: endTwo,
      status: '待確認',
      basePriceSnapshot: 1500,
      addonPriceSnapshot: 250,
      totalPriceSnapshot: 1750,
      addonsSnapshot: [
        {
          addonId: 'addon-essence',
          addonNameSnapshot: '護髮精華',
          addonPriceSnapshot: 250,
        },
      ],
      notes: '想做偏暖色調的栗棕色。',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-1003',
      customerId: 'user-customer-1',
      customerNameSnapshot: '林小姐',
      customerPhoneSnapshot: '0912345678',
      barberId: 'user-barber-1',
      barberNameSnapshot: 'Alex',
      serviceId: 'service-care',
      serviceNameSnapshot: '頭皮養護',
      serviceDurationSnapshot: 60,
      appointmentDate: tomorrow,
      startTime: '15:00',
      endTime: endThree,
      status: '已完成',
      basePriceSnapshot: 800,
      addonPriceSnapshot: 150,
      totalPriceSnapshot: 950,
      addonsSnapshot: [
        {
          addonId: 'addon-styling',
          addonNameSnapshot: '造型定型',
          addonPriceSnapshot: 150,
        },
      ],
      notes: '頭皮偏乾，想加強舒緩。',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    version: 2,
    users,
    services,
    addons,
    barberProfiles,
    availabilitySlots,
    appointments,
  };
}
