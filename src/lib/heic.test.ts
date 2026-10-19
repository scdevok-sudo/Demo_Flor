import { describe, expect, it } from "vitest"

import { esHeic } from "@/lib/heic"

describe("esHeic", () => {
  it("detecta por MIME", () => {
    expect(esHeic({ name: "a", type: "image/heic" })).toBe(true)
    expect(esHeic({ name: "a", type: "image/HEIF" })).toBe(true)
  })

  it("detecta por extensión cuando iOS no manda MIME", () => {
    expect(esHeic({ name: "IMG_0001.HEIC", type: "" })).toBe(true)
    expect(esHeic({ name: "foto.heif", type: "application/octet-stream" })).toBe(true)
  })

  it("no confunde otros formatos", () => {
    expect(esHeic({ name: "a.jpg", type: "image/jpeg" })).toBe(false)
    expect(esHeic({ name: "a.png", type: "image/png" })).toBe(false)
    expect(esHeic({ name: "clip.mov", type: "video/quicktime" })).toBe(false)
  })
})
