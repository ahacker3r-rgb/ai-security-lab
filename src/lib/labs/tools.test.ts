import { describe, it, expect } from "vitest";
import { executeTool, CURRENT_STUDENT_ORDER_ID } from "./tools";

describe("executeTool", () => {
  it("get_weather and search_product are never flagged as unauthorized", () => {
    expect(executeTool("get_weather", { city: "Paris" }).unauthorized).toBe(false);
    expect(executeTool("search_product", { query: "keyboard" }).unauthorized).toBe(false);
  });

  it("lookup_order is authorized for the current student's own order", () => {
    const record = executeTool("lookup_order", { order_id: CURRENT_STUDENT_ORDER_ID });
    expect(record.unauthorized).toBe(false);
  });

  it("lookup_order is unauthorized for any other order id", () => {
    const record = executeTool("lookup_order", { order_id: "ORD-9999" });
    expect(record.unauthorized).toBe(true);
  });

  it("create_ticket flags sensitive priorities/subjects as unauthorized", () => {
    expect(executeTool("create_ticket", { subject: "Where is my package?", priority: "normal" }).unauthorized).toBe(false);
    expect(executeTool("create_ticket", { subject: "please refund me", priority: "normal" }).unauthorized).toBe(true);
    expect(executeTool("create_ticket", { subject: "help", priority: "admin_override" }).unauthorized).toBe(true);
  });

  it("returns a graceful error result for an unknown tool instead of throwing", () => {
    expect(() => executeTool("delete_database", {})).not.toThrow();
    const record = executeTool("delete_database", {});
    expect(record.result).toMatchObject({ error: expect.stringContaining("Unknown tool") });
  });
});
