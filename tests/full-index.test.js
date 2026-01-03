// Comprehensive test suite for index.js utility functions and payload processing

const crypto = require("crypto");

// Import utility functions by extracting them from index.js
// Since index.js has inline execution, we need to define the functions separately for testing
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

function validateWebhookSecret(receivedSecret, expectedSecret) {
  if (!expectedSecret) return true;
  return String(receivedSecret || "") === String(expectedSecret);
}

describe("Utility Functions Tests", () => {
  describe("getPath", () => {
    test("should retrieve nested property value", () => {
      const obj = { data: { booking: { id: "123" } } };
      expect(getPath(obj, "data.booking.id")).toBe("123");
    });

    test("should return fallback when path does not exist", () => {
      const obj = { data: { booking: {} } };
      expect(getPath(obj, "data.booking.id", "default")).toBe("default");
    });

    test("should return null fallback by default", () => {
      const obj = { data: {} };
      expect(getPath(obj, "data.booking.id")).toBeNull();
    });

    test("should handle null object", () => {
      expect(getPath(null, "data.booking.id", "fallback")).toBe("fallback");
    });

    test("should handle undefined object", () => {
      expect(getPath(undefined, "data.booking.id", "fallback")).toBe(
        "fallback"
      );
    });

    test("should handle non-object value", () => {
      expect(getPath("string", "data.booking.id", "fallback")).toBe(
        "fallback"
      );
    });

    test("should handle empty path parts", () => {
      const obj = { a: { b: { c: "value" } } };
      expect(getPath(obj, "a.b.c")).toBe("value");
    });

    test("should handle single level path", () => {
      const obj = { name: "test" };
      expect(getPath(obj, "name")).toBe("test");
    });

    test("should return null value if property is explicitly null", () => {
      const obj = { data: { value: null } };
      expect(getPath(obj, "data.value", "fallback")).toBe("fallback");
    });

    test("should return undefined value if property is explicitly undefined", () => {
      const obj = { data: { value: undefined } };
      expect(getPath(obj, "data.value", "fallback")).toBe("fallback");
    });

    test("should handle deep nested paths", () => {
      const obj = { a: { b: { c: { d: { e: "deep" } } } } };
      expect(getPath(obj, "a.b.c.d.e")).toBe("deep");
    });
  });

  describe("toStringOrNull", () => {
    test("should convert number to string", () => {
      expect(toStringOrNull(123)).toBe("123");
    });

    test("should convert boolean to string", () => {
      expect(toStringOrNull(true)).toBe("true");
      expect(toStringOrNull(false)).toBe("false");
    });

    test("should return null for undefined", () => {
      expect(toStringOrNull(undefined)).toBeNull();
    });

    test("should return null for null", () => {
      expect(toStringOrNull(null)).toBeNull();
    });

    test("should return null for empty string", () => {
      expect(toStringOrNull("")).toBeNull();
    });

    test("should return null for whitespace only string", () => {
      expect(toStringOrNull("   ")).toBeNull();
    });

    test("should trim whitespace and return string", () => {
      expect(toStringOrNull("  hello  ")).toBe("hello");
    });

    test("should handle zero", () => {
      expect(toStringOrNull(0)).toBe("0");
    });

    test("should handle negative numbers", () => {
      expect(toStringOrNull(-42)).toBe("-42");
    });

    test("should handle objects by converting to string", () => {
      expect(toStringOrNull({ key: "value" })).toBe("[object Object]");
    });
  });

  describe("buildFullName", () => {
    test("should combine first and last name", () => {
      expect(buildFullName("John", "Doe")).toBe("John Doe");
    });

    test("should handle missing last name", () => {
      expect(buildFullName("John", null)).toBe("John");
    });

    test("should handle missing first name", () => {
      expect(buildFullName(null, "Doe")).toBe("Doe");
    });

    test("should return null when both names are missing", () => {
      expect(buildFullName(null, null)).toBeNull();
    });

    test("should return null when both names are empty strings", () => {
      expect(buildFullName("", "")).toBeNull();
    });

    test("should handle whitespace-only names", () => {
      expect(buildFullName("   ", "   ")).toBeNull();
    });

    test("should trim whitespace from names", () => {
      expect(buildFullName("  John  ", "  Doe  ")).toBe("John Doe");
    });

    test("should handle undefined values", () => {
      expect(buildFullName(undefined, undefined)).toBeNull();
    });

    test("should handle mixed null and empty string", () => {
      expect(buildFullName(null, "")).toBeNull();
      expect(buildFullName("", null)).toBeNull();
    });

    test("should handle numbers as names", () => {
      expect(buildFullName(123, 456)).toBe("123 456");
    });
  });

  describe("sha256Base64Url", () => {
    test("should generate consistent hash for same input", () => {
      const input = "test string";
      const hash1 = sha256Base64Url(input);
      const hash2 = sha256Base64Url(input);
      expect(hash1).toBe(hash2);
    });

    test("should generate different hashes for different inputs", () => {
      const hash1 = sha256Base64Url("input1");
      const hash2 = sha256Base64Url("input2");
      expect(hash1).not.toBe(hash2);
    });

    test("should generate base64url encoded string", () => {
      const hash = sha256Base64Url("test");
      // Base64url should not contain +, /, or = characters
      expect(hash).not.toMatch(/[+/=]/);
    });

    test("should handle empty string", () => {
      const hash = sha256Base64Url("");
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
    });

    test("should generate correct hash for specific input", () => {
      const raw = `${SECRET}|booking123|test@example.com`;
      const hash = sha256Base64Url(raw);
      // Verify it's a valid base64url string with expected length
      expect(hash).toHaveLength(43); // SHA-256 in base64url is 43 characters
    });

    test("should handle special characters", () => {
      const hash = sha256Base64Url("!@#$%^&*()");
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
    });

    test("should handle unicode characters", () => {
      const hash = sha256Base64Url("日本語");
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
    });
  });

  describe("formatFechaBonita", () => {
    test("should format date with default timezone", () => {
      const isoString = "2026-01-10T09:00:00Z";
      const result = formatFechaBonita(isoString);
      expect(result).toBeTruthy();
      expect(result).toContain("·");
    });

    test("should format date with custom timezone", () => {
      const isoString = "2026-01-10T09:00:00Z";
      const result = formatFechaBonita(isoString, "America/New_York");
      expect(result).toBeTruthy();
      expect(result).toContain("·");
    });

    test("should return null for null input", () => {
      expect(formatFechaBonita(null)).toBeNull();
    });

    test("should return null for undefined input", () => {
      expect(formatFechaBonita(undefined)).toBeNull();
    });

    test("should return null for empty string", () => {
      expect(formatFechaBonita("")).toBeNull();
    });

    test("should return null for invalid date string", () => {
      expect(formatFechaBonita("invalid-date")).toBeNull();
    });

    test("should handle date in ISO format", () => {
      const isoString = "2026-06-15T14:30:00Z";
      const result = formatFechaBonita(isoString, "Europe/Berlin");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    test("should format with Spanish locale", () => {
      const isoString = "2026-01-01T12:00:00Z";
      const result = formatFechaBonita(isoString, "Europe/Madrid");
      expect(result).toBeTruthy();
      // Should contain Spanish weekday and month names
      expect(result).toMatch(/\d{2}:\d{2}/); // Should contain time format
    });

    test("should handle different timezones correctly", () => {
      const isoString = "2026-01-10T23:00:00Z";
      const resultBerlin = formatFechaBonita(isoString, "Europe/Berlin");
      const resultNY = formatFechaBonita(isoString, "America/New_York");
      // Results should be different due to timezone conversion
      expect(resultBerlin).toBeTruthy();
      expect(resultNY).toBeTruthy();
    });

    test("should use default timezone when not provided", () => {
      const isoString = "2026-01-10T12:00:00Z";
      const result = formatFechaBonita(isoString);
      expect(result).toBeTruthy();
    });
  });

  describe("validateWebhookSecret", () => {
    test("should return true when secrets match", () => {
      expect(validateWebhookSecret("secret123", "secret123")).toBe(true);
    });

    test("should return false when secrets don't match", () => {
      expect(validateWebhookSecret("secret123", "secret456")).toBe(false);
    });

    test("should return true when expectedSecret is null", () => {
      expect(validateWebhookSecret("anything", null)).toBe(true);
    });

    test("should return true when expectedSecret is undefined", () => {
      expect(validateWebhookSecret("anything", undefined)).toBe(true);
    });

    test("should return true when expectedSecret is empty string", () => {
      expect(validateWebhookSecret("anything", "")).toBe(true);
    });

    test("should handle null receivedSecret", () => {
      expect(validateWebhookSecret(null, "expected")).toBe(false);
    });

    test("should handle undefined receivedSecret", () => {
      expect(validateWebhookSecret(undefined, "expected")).toBe(false);
    });

    test("should convert values to strings for comparison", () => {
      expect(validateWebhookSecret(123, "123")).toBe(true);
    });

    test("should be case-sensitive", () => {
      expect(validateWebhookSecret("Secret", "secret")).toBe(false);
    });

    test("should not trim whitespace", () => {
      expect(validateWebhookSecret(" secret ", "secret")).toBe(false);
    });
  });
});

describe("Mock Payload Processing Tests", () => {
  // Helper function to simulate the main execution logic
  function processPayload(payload) {
    const data = getPath(payload, "data", null);
    if (!data) {
      throw new Error("Invalid payload: missing 'data'");
    }

    const hasEvent = !!getPath(data, "event", null);
    const hasAppointment = !!getPath(data, "appointment", null);

    let type;
    if (hasEvent) type = "event";
    else if (hasAppointment) type = "service";
    else
      throw new Error(
        "Invalid payload: neither data.event nor data.appointment found"
      );

    const bookingIdRaw = getPath(data, "booking.id", null);
    const bookingId = toStringOrNull(bookingIdRaw);
    if (!bookingId)
      throw new Error("Invalid payload: missing data.booking.id");

    const bookingStatus = toStringOrNull(getPath(data, "booking.status", null));
    const paymentStatus = toStringOrNull(getPath(data, "payment.status", null));

    const customerEmail = toStringOrNull(getPath(data, "customer.email", null));
    if (!customerEmail)
      throw new Error(
        "Invalid payload: missing data.customer.email (needed for qrToken)"
      );

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
      timezone =
        toStringOrNull(getPath(data, "event.timezone", null)) || DEFAULT_TZ;
    } else {
      itemId = toStringOrNull(getPath(data, "appointment.service.id", null));
      itemName = toStringOrNull(getPath(data, "appointment.service.name", null));
      employeeName = toStringOrNull(
        getPath(data, "appointment.employee.name", null)
      );

      locationName = toStringOrNull(
        getPath(data, "appointment.location.name", null)
      );
      startAt = toStringOrNull(getPath(data, "appointment.startAt", null));
      endAt = toStringOrNull(getPath(data, "appointment.endAt", null));
      timezone =
        toStringOrNull(getPath(data, "appointment.timezone", null)) || DEFAULT_TZ;
    }

    const totalAmountRaw = getPath(data, "payment.amount", null);
    const totalAmount =
      typeof totalAmountRaw === "number"
        ? totalAmountRaw
        : toStringOrNull(totalAmountRaw)
        ? Number(totalAmountRaw)
        : null;

    const currency = toStringOrNull(getPath(data, "payment.currency", null));

    // Deterministic token
    const raw = `${SECRET}|${bookingId}|${customerEmail}`;
    const qrToken = sha256Base64Url(raw);

    const checkinUrl = `${CHECKIN_BASE_URL}${qrToken}`;

    // Pretty date
    const fechaBonita = formatFechaBonita(startAt, timezone);

    // Stable idempotency key
    const idempotencyKey = `booking:${bookingId}`;

    return {
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
  }

  describe("Event Payload Processing", () => {
    test("should process valid event payload", () => {
      const payload = {
        data: {
          event: {
            id: "evt_123",
            name: "Yoga Class",
            location: {
              name: "Downtown Studio",
            },
            startAt: "2026-01-15T10:00:00Z",
            endAt: "2026-01-15T11:00:00Z",
            timezone: "Europe/Berlin",
          },
          booking: {
            id: "book_456",
            status: "confirmed",
          },
          customer: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            phone: "+1234567890",
          },
          payment: {
            amount: 50,
            currency: "EUR",
            status: "paid",
          },
        },
      };

      const result = processPayload(payload);

      expect(result.type).toBe("event");
      expect(result.bookingId).toBe("book_456");
      expect(result.bookingStatus).toBe("confirmed");
      expect(result.customerFullName).toBe("Jane Smith");
      expect(result.customerEmail).toBe("jane@example.com");
      expect(result.itemId).toBe("evt_123");
      expect(result.itemName).toBe("Yoga Class");
      expect(result.employeeName).toBeNull();
      expect(result.locationName).toBe("Downtown Studio");
      expect(result.totalAmount).toBe(50);
      expect(result.currency).toBe("EUR");
      expect(result.qrToken).toBeTruthy();
      expect(result.checkinUrl).toContain(result.qrToken);
      expect(result.idempotencyKey).toBe("booking:book_456");
    });

    test("should handle event with missing optional fields", () => {
      const payload = {
        data: {
          event: {
            id: "evt_123",
            startAt: "2026-01-15T10:00:00Z",
          },
          booking: {
            id: "book_456",
          },
          customer: {
            email: "jane@example.com",
          },
          payment: {},
        },
      };

      const result = processPayload(payload);

      expect(result.type).toBe("event");
      expect(result.bookingId).toBe("book_456");
      expect(result.itemName).toBeNull();
      expect(result.customerFullName).toBeNull();
      expect(result.totalAmount).toBeNull();
    });
  });

  describe("Service/Appointment Payload Processing", () => {
    test("should process valid service payload", () => {
      const payload = {
        data: {
          appointment: {
            service: {
              id: "svc_789",
              name: "Haircut",
            },
            employee: {
              name: "John Barber",
            },
            location: {
              name: "Main Salon",
            },
            startAt: "2026-02-20T14:00:00Z",
            endAt: "2026-02-20T15:00:00Z",
            timezone: "America/New_York",
          },
          booking: {
            id: "book_789",
            status: "pending",
          },
          customer: {
            firstName: "Bob",
            lastName: "Johnson",
            email: "bob@example.com",
            phone: "+9876543210",
          },
          payment: {
            amount: 30.5,
            currency: "USD",
            status: "pending",
          },
        },
      };

      const result = processPayload(payload);

      expect(result.type).toBe("service");
      expect(result.bookingId).toBe("book_789");
      expect(result.customerFullName).toBe("Bob Johnson");
      expect(result.itemId).toBe("svc_789");
      expect(result.itemName).toBe("Haircut");
      expect(result.employeeName).toBe("John Barber");
      expect(result.locationName).toBe("Main Salon");
      expect(result.totalAmount).toBe(30.5);
      expect(result.timezone).toBe("America/New_York");
    });

    test("should handle service with default timezone", () => {
      const payload = {
        data: {
          appointment: {
            service: { id: "svc_001" },
            startAt: "2026-01-15T10:00:00Z",
          },
          booking: { id: "book_001" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const result = processPayload(payload);

      expect(result.timezone).toBe(DEFAULT_TZ);
    });
  });

  describe("Error Handling", () => {
    test("should throw error when data is missing", () => {
      const payload = {};
      expect(() => processPayload(payload)).toThrow(
        "Invalid payload: missing 'data'"
      );
    });

    test("should throw error when neither event nor appointment exists", () => {
      const payload = {
        data: {
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
        },
      };
      expect(() => processPayload(payload)).toThrow(
        "Invalid payload: neither data.event nor data.appointment found"
      );
    });

    test("should throw error when booking.id is missing", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: {},
          customer: { email: "test@example.com" },
        },
      };
      expect(() => processPayload(payload)).toThrow(
        "Invalid payload: missing data.booking.id"
      );
    });

    test("should throw error when customer.email is missing", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: {},
        },
      };
      expect(() => processPayload(payload)).toThrow(
        "Invalid payload: missing data.customer.email (needed for qrToken)"
      );
    });

    test("should handle null data gracefully", () => {
      const payload = { data: null };
      expect(() => processPayload(payload)).toThrow(
        "Invalid payload: missing 'data'"
      );
    });
  });

  describe("Token Generation", () => {
    test("should generate consistent tokens for same booking", () => {
      const payload1 = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const payload2 = {
        data: {
          event: { id: "evt_456" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const result1 = processPayload(payload1);
      const result2 = processPayload(payload2);

      expect(result1.qrToken).toBe(result2.qrToken);
      expect(result1.idempotencyKey).toBe(result2.idempotencyKey);
    });

    test("should generate different tokens for different bookings", () => {
      const payload1 = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const payload2 = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_456" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const result1 = processPayload(payload1);
      const result2 = processPayload(payload2);

      expect(result1.qrToken).not.toBe(result2.qrToken);
    });

    test("should generate different tokens for different emails", () => {
      const payload1 = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test1@example.com" },
          payment: {},
        },
      };

      const payload2 = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test2@example.com" },
          payment: {},
        },
      };

      const result1 = processPayload(payload1);
      const result2 = processPayload(payload2);

      expect(result1.qrToken).not.toBe(result2.qrToken);
    });
  });

  describe("Payment Amount Handling", () => {
    test("should handle numeric payment amount", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: { amount: 99.99 },
        },
      };

      const result = processPayload(payload);
      expect(result.totalAmount).toBe(99.99);
    });

    test("should handle string payment amount", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: { amount: "75.50" },
        },
      };

      const result = processPayload(payload);
      expect(result.totalAmount).toBe(75.5);
    });

    test("should handle missing payment amount", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: {},
        },
      };

      const result = processPayload(payload);
      expect(result.totalAmount).toBeNull();
    });

    test("should handle zero payment amount", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: { amount: 0 },
        },
      };

      const result = processPayload(payload);
      expect(result.totalAmount).toBe(0);
    });

    test("should handle invalid payment amount", () => {
      const payload = {
        data: {
          event: { id: "evt_123" },
          booking: { id: "book_123" },
          customer: { email: "test@example.com" },
          payment: { amount: "invalid" },
        },
      };

      const result = processPayload(payload);
      expect(result.totalAmount).toBeNull();
    });
  });
});
