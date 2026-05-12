import { describe, it, expect, beforeAll } from "vitest";

// Vitest resolves __dirname to src/_lib/, so the _img/ assets are found
// without a prior build step.
const { createFace, combine } = await import("./index.js");

// ── createFace ───────────────────────────────────────────────────────────────

describe("createFace", () => {
  it("returns a face with all four fields", () => {
    const face = createFace("alice");
    expect(face).toHaveProperty("color");
    expect(face).toHaveProperty("eyes");
    expect(face).toHaveProperty("nose");
    expect(face).toHaveProperty("mouth");
  });

  it("is deterministic — same ID always returns the same face", () => {
    expect(createFace("alice")).toEqual(createFace("alice"));
    expect(createFace("hello@example.com")).toEqual(
      createFace("hello@example.com")
    );
  });

  it("returns different faces for different IDs", () => {
    const a = createFace("alice");
    const b = createFace("bob");
    // At least one field must differ — two IDs should not be identical in all four
    const same =
      a.color === b.color &&
      a.eyes === b.eyes &&
      a.nose === b.nose &&
      a.mouth === b.mouth;
    expect(same).toBe(false);
  });

  it("handles an empty string without throwing", () => {
    expect(() => createFace("")).not.toThrow();
  });

  it("handles unicode and emoji without throwing", () => {
    expect(() => createFace("👾user42")).not.toThrow();
    expect(() => createFace("日本語")).not.toThrow();
  });

  it("handles a UUID-length string (36 chars)", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(() => createFace(uuid)).not.toThrow();
    expect(createFace(uuid)).toEqual(createFace(uuid));
  });

  it("returns a valid hex color", () => {
    const { color } = createFace("test");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns existing file paths for eyes, nose, and mouth", async () => {
    const face = createFace("test");
    const { access } = await import("fs/promises");
    await expect(access(face.eyes)).resolves.toBeUndefined();
    await expect(access(face.nose)).resolves.toBeUndefined();
    await expect(access(face.mouth)).resolves.toBeUndefined();
  });
});

// ── combine ──────────────────────────────────────────────────────────────────

describe("combine", () => {
  let pngBuffer: Buffer;

  beforeAll(async () => {
    const face = createFace("alice");
    pngBuffer = await combine(face).png().toBuffer();
  });

  it("produces a non-empty buffer", () => {
    expect(pngBuffer.length).toBeGreaterThan(0);
  });

  it("produces a valid PNG (correct magic bytes)", () => {
    // PNG magic: 89 50 4E 47 0D 0A 1A 0A
    expect(pngBuffer[0]).toBe(0x89);
    expect(pngBuffer[1]).toBe(0x50); // P
    expect(pngBuffer[2]).toBe(0x4e); // N
    expect(pngBuffer[3]).toBe(0x47); // G
  });

  it("produces the same output for the same ID", async () => {
    const face = createFace("alice");
    const buf1 = await combine(face).png().toBuffer();
    const buf2 = await combine(face).png().toBuffer();
    expect(buf1.equals(buf2)).toBe(true);
  });

  it("produces different output for different IDs", async () => {
    const buf1 = await combine(createFace("alice")).png().toBuffer();
    const buf2 = await combine(createFace("bob")).png().toBuffer();
    expect(buf1.equals(buf2)).toBe(false);
  });
});
