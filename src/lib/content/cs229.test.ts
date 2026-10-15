import { describe, expect, it } from "vitest";
import { cs229Text } from "./cs229";

describe("ссылки на CS229", () => {
  it("издание словами, разделы через стрелку, одно издание — одна фраза", () => {
    expect(
      cs229Text([
        { edition: "main-notes-2026-spring", section: "Linear regression / The normal equations" },
        { edition: "main-notes-2026-spring", section: "Linear regression / Probabilistic interpretation" },
      ]),
    ).toBe("Конспект, весна 2026: «Linear regression → The normal equations», «Linear regression → Probabilistic interpretation».");
  });

  it("неизвестное издание показывается как есть", () => {
    expect(cs229Text([{ edition: "lecture-2019", section: "Kernels" }])).toBe("Lecture-2019: «Kernels».");
  });
});
