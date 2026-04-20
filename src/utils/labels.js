export const ORDER_STATUSES = [
  { value: 'pending', label: 'Новый', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Подтверждён', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipping', label: 'В доставке', color: 'bg-orange-100 text-orange-700' },
  { value: 'delivered', label: 'Доставлен', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Отменён', color: 'bg-red-100 text-red-700' },
]

export const ORDER_STATUS_MAP = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s]))

export const PAYMENT_LABELS = {
  card: 'Карта Visa / Mastercard',
  cod: 'Наложенный платёж',
  crypto: 'Криптовалюта (USDT)',
}

export const DELIVERY_LABELS = {
  courier: 'Курьер',
  pickup: 'Самовывоз',
  post: 'Почта',
  cdek: 'СДЭК',
}

export const PARTNER_LEVEL_META = {
  start: { label: 'Старт', cls: 'bg-gray-100 text-gray-700' },
  active: { label: 'Активный', cls: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Про', cls: 'bg-green-100 text-green-700' },
}

export const PARTNER_METHOD_LABELS = {
  kaspi: 'Kaspi',
  bank: 'Bank transfer',
  cash: 'Наличные',
}

export const WITHDRAWAL_STATUS_META = {
  pending: { label: 'Ожидает', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Подтверждён', cls: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Отклонён', cls: 'bg-red-100 text-red-600' },
  paid: { label: 'Выплачено', cls: 'bg-green-100 text-green-700' },
}
