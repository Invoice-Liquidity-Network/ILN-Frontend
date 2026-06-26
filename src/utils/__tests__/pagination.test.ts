import { describe, expect, it } from "vitest";
import { paginate, pageCountFor } from "../pagination";

const items = Array.from({ length: 45 }, (_, i) => i);

describe("pageCountFor", () => {
  it("rounds up partial pages", () => {
    expect(pageCountFor(45, 20)).toBe(3);
    expect(pageCountFor(40, 20)).toBe(2);
    expect(pageCountFor(1, 20)).toBe(1);
  });

  it("never returns fewer than one page, even when empty", () => {
    expect(pageCountFor(0, 20)).toBe(1);
  });
});

describe("paginate", () => {
  it("caps a page at perPage items", () => {
    expect(paginate(items, 0, 20)).toHaveLength(20);
    expect(paginate(items, 0, 20)[0]).toBe(0);
  });

  it("returns the correct window for a middle page", () => {
    const page1 = paginate(items, 1, 20);
    expect(page1[0]).toBe(20);
    expect(page1).toHaveLength(20);
  });

  it("returns the remainder on the last page", () => {
    expect(paginate(items, 2, 20)).toEqual([40, 41, 42, 43, 44]);
  });

  it("clamps an out-of-range page to the last page", () => {
    expect(paginate(items, 99, 20)).toEqual([40, 41, 42, 43, 44]);
  });

  it("clamps a negative page to the first page", () => {
    expect(paginate(items, -5, 20)[0]).toBe(0);
  });
});
