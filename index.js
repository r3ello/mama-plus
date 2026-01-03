const crypto = require("crypto");

const SECRET = "MAMAPLUS_SUPER_SECRETO_2026";
const CHECKIN_BASE_URL = "https://TU_DOMINIO/checkin?token=";
const DEFAULT_TZ = "Europe/Berlin";

/**
 * Safe getter for nested paths like "data.booking.id"
 */
function getPath(obj, path, fallback = null) {
  if (!obj || typeof obj !== "object") return fallback;
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return fallback;
  }
  return cur ?? fallback;
}

function toStringOrNull(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function buildFullName(firstName, lastName) {
  const f = toStringOrNull(firstName) ?? "";
  const l = toStringOrNull(lastName) ?? "";
  const full = `${f} ${l}`.trim();
  return full.length ? full : null;
}

function sha256Base64Url(str) {
  return crypto.createHash("sha256").update(str).digest("base64url");
}

function formatFechaBonita(isoString, timeZone) {
  if (!isoString) return null;

  const tz = timeZone || DEFAULT_TZ;

  // Date part: "sábado, 10 de enero"
  const dateFmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Time part: "09:00"
  const timeFmt = new Intl.DateTimeFormat("es-ES", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;

    const datePart = dateFmt.format(d);
    const timePart = timeFmt.format(d);

    // "sábado, 10 de enero · 09:00"
    return `${datePart} · ${timePart}`;
  } catch (e) {
    return null;
  }
}

/**
 * Optional (prepared) webhook secret validation hook (not used by default).
 * Example usage later:
 *   if (!validateWebhookSecret(headers.xxx, EXPECTED)) throw new Error("Invalid secret");
 */
function validateWebhookSecret(receivedSecret, expectedSecret) {
  if (!expectedSecret) return true;
  return String(receivedSecret || "") === String(expectedSecret);
}

// --- main ---
const payload = $input.first().json.body;
// use to verify signature in the future, define better option for that
const headers = $input.first().json.headers;

const data = getPath(payload, "data", null);
if (!data) {
  throw new Error("Invalid payload: missing 'data'");
}

const hasEvent = !!getPath(data, "event", null);
const hasAppointment = !!getPath(data, "appointment", null);

let type;
if (hasEvent) type = "event";
else if (hasAppointment) type = "service";
else throw new Error("Invalid payload: neither data.event nor data.appointment found");

const bookingIdRaw = getPath(data, "booking.id", null);
const bookingId = toStringOrNull(bookingIdRaw);
if (!bookingId) throw new Error("Invalid payload: missing data.booking.id");

const bookingStatus = toStringOrNull(getPath(data, "booking.status", null));
const paymentStatus = toStringOrNull(getPath(data, "payment.status", null));

const customerEmail = toStringOrNull(getPath(data, "customer.email", null));
if (!customerEmail) throw new Error("Invalid payload: missing data.customer.email (needed for qrToken)");

const customerFullName = buildFullName(
  getPath(data, "customer.firstName", null),
  getPath(data, "customer.lastName", null)
);

const customerPhone = toStringOrNull(getPath(data, "customer.phone", null));

let itemId = null;
let itemName = null;
let employeeName = null;
let locationName = null;
let startAt = null;
let endAt = null;
let timezone = null;

if (type === "event") {
  itemId = toStringOrNull(getPath(data, "event.id", null));
  itemName = toStringOrNull(getPath(data, "event.name", null));
  employeeName = null;

  locationName = toStringOrNull(getPath(data, "event.location.name", null));
  startAt = toStringOrNull(getPath(data, "event.startAt", null));
  endAt = toStringOrNull(getPath(data, "event.endAt", null));
  timezone = toStringOrNull(getPath(data, "event.timezone", null)) || DEFAULT_TZ;
} else {
  itemId = toStringOrNull(getPath(data, "appointment.service.id", null));
  itemName = toStringOrNull(getPath(data, "appointment.service.name", null));
  employeeName = toStringOrNull(getPath(data, "appointment.employee.name", null));

  locationName = toStringOrNull(getPath(data, "appointment.location.name", null));
  startAt = toStringOrNull(getPath(data, "appointment.startAt", null));
  endAt = toStringOrNull(getPath(data, "appointment.endAt", null));
  timezone = toStringOrNull(getPath(data, "appointment.timezone", null)) || DEFAULT_TZ;
}

const totalAmountRaw = getPath(data, "payment.amount", null);
const totalAmount =
  typeof totalAmountRaw === "number"
    ? totalAmountRaw
    : (toStringOrNull(totalAmountRaw) ? Number(totalAmountRaw) : null);

const currency = toStringOrNull(getPath(data, "payment.currency", null));

// Deterministic token
// I am not agree with include the email, is the email the custmer ID ?
const raw = `${SECRET}|${bookingId}|${customerEmail}`;
const qrToken = sha256Base64Url(raw);

const checkinUrl = `${CHECKIN_BASE_URL}${qrToken}`;

// Pretty date
const fechaBonita = formatFechaBonita(startAt, timezone);

// Stable idempotency key
const idempotencyKey = `booking:${bookingId}`;

const resultado = {
  bookingId,
  bookingStatus,
  paymentStatus,
  customerFullName,
  customerEmail,
  customerPhone,
  type,
  itemId,
  itemName,
  employeeName,
  locationName,
  startAt,
  endAt,
  timezone: timezone || DEFAULT_TZ,
  fechaBonita,
  totalAmount: Number.isFinite(totalAmount) ? totalAmount : null,
  currency,
  qrToken,
  checkinUrl,
  idempotencyKey,
};
//  only for test, just  to verify if the final json contain the expected keys
const REQUIRED_KEYS = [
  "bookingId","bookingStatus","paymentStatus","customerFullName","customerEmail","customerPhone",
  "type","itemId","itemName","employeeName","locationName","startAt","endAt","timezone",
  "fechaBonita","totalAmount","currency","qrToken","checkinUrl","idempotencyKey"
];

for (const k of REQUIRED_KEYS) {
  if (!(k in resultado)) {
    throw new Error(`Output contract broken: missing key '${k}'`);
  }
}

return [{ json: resultado }];
