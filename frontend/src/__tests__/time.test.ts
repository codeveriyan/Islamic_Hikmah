import { format12Hour } from "../utils/time";

describe("format12Hour Utility", () => {
  it("formats 24-hour time strings correctly to 12-hour strings", () => {
    expect(format12Hour("05:30")).toBe("5:30 AM");
    expect(format12Hour("12:00")).toBe("12:00 PM");
    expect(format12Hour("13:15")).toBe("1:15 PM");
    expect(format12Hour("00:45")).toBe("12:45 AM");
    expect(format12Hour("18:05")).toBe("6:05 PM");
  });

  it("handles fallback gracefully for invalid or empty input", () => {
    expect(format12Hour("")).toBe("");
    expect(format12Hour("invalid")).toBe("invalid");
  });
});
