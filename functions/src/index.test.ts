import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// ── Firebase mocks ────────────────────────────────────────────────────────────

const mockSet = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn(() => ({ set: mockSet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockGetFirestore = vi.fn(() => ({ collection: mockCollection }));
const mockInitializeApp = vi.fn();

vi.mock("firebase-admin/app", () => ({ initializeApp: mockInitializeApp }));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: mockGetFirestore,
  FieldValue: {
    serverTimestamp: () => "__serverTimestamp__",
    increment: (n: number) => `__increment(${n})__`,
    arrayUnion: (...args: unknown[]) => `__arrayUnion(${args.join(",")})__`,
  },
}));

// Capture the handler registered with onRequest
let capturedHandler: (req: unknown, res: unknown) => Promise<void>;
vi.mock("firebase-functions/v2/https", () => ({
  onRequest: (_opts: unknown, handler: typeof capturedHandler) => {
    capturedHandler = handler;
    return handler;
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(path: string, query: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return { path, query, headers };
}

function makeRes() {
  const res = {
    headers: {} as Record<string, string>,
    body: null as Buffer | null,
    setHeader(key: string, value: string) { this.headers[key] = value; },
    send(buf: Buffer) { this.body = buf; },
  };
  return res;
}

// Import the module to trigger side effects (registers the handler)
await import("./index.js");

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("id handler — notrack", () => {
  beforeEach(() => {
    mockSet.mockClear();
    mockDoc.mockClear();
    mockCollection.mockClear();
  });

  it("writes to Firestore by default", async () => {
    const req = makeReq("/alice");
    const res = makeRes();
    await capturedHandler(req, res);
    expect(mockCollection).toHaveBeenCalledWith("analytics");
    expect(mockSet).toHaveBeenCalledOnce();
  });

  it("writes to Firestore when notrack is absent", async () => {
    const req = makeReq("/bob", {});
    const res = makeRes();
    await capturedHandler(req, res);
    expect(mockSet).toHaveBeenCalledOnce();
  });

  it("skips Firestore when notrack=true", async () => {
    const req = makeReq("/carol", { notrack: "true" });
    const res = makeRes();
    await capturedHandler(req, res);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does NOT skip Firestore when notrack=false", async () => {
    const req = makeReq("/dave", { notrack: "false" });
    const res = makeRes();
    await capturedHandler(req, res);
    expect(mockSet).toHaveBeenCalledOnce();
  });

  it("does NOT skip Firestore when notrack has another value", async () => {
    const req = makeReq("/eve", { notrack: "1" });
    const res = makeRes();
    await capturedHandler(req, res);
    expect(mockSet).toHaveBeenCalledOnce();
  });

  it("still returns a PNG when notrack=true", async () => {
    const req = makeReq("/frank", { notrack: "true" });
    const res = makeRes();
    await capturedHandler(req, res);
    expect(res.headers["Content-Type"]).toBe("image/png");
    expect(res.body).toBeInstanceOf(Buffer);
    expect(res.body!.length).toBeGreaterThan(0);
    // PNG magic bytes
    expect(res.body![0]).toBe(0x89);
    expect(res.body![1]).toBe(0x50);
  });
});

describe("id handler — named ID", () => {
  it("returns the same PNG for the same ID on repeated calls", async () => {
    const req = makeReq("/grace");
    const res1 = makeRes();
    const res2 = makeRes();
    await capturedHandler(req, res1);
    await capturedHandler(req, res2);
    expect(res1.body!.equals(res2.body!)).toBe(true);
  });

  it("returns different PNGs for different IDs", async () => {
    const res1 = makeRes();
    const res2 = makeRes();
    await capturedHandler(makeReq("/henry"), res1);
    await capturedHandler(makeReq("/iris"), res2);
    expect(res1.body!.equals(res2.body!)).toBe(false);
  });

  it("sets immutable cache-control for a named ID", async () => {
    const res = makeRes();
    await capturedHandler(makeReq("/jack"), res);
    expect(res.headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });

  it("echoes the ID in X-Genavatar-Id header", async () => {
    const res = makeRes();
    await capturedHandler(makeReq("/kate"), res);
    expect(res.headers["X-Genavatar-Id"]).toBe("kate");
  });
});

describe("id handler — random ID", () => {
  let res1: ReturnType<typeof makeRes>;
  let res2: ReturnType<typeof makeRes>;

  beforeAll(async () => {
    res1 = makeRes();
    res2 = makeRes();
    await capturedHandler(makeReq("/"), res1);
    await capturedHandler(makeReq("/"), res2);
  });

  it("returns a valid PNG for an empty path", () => {
    expect(res1.headers["Content-Type"]).toBe("image/png");
    expect(res1.body![0]).toBe(0x89);
    expect(res1.body![1]).toBe(0x50);
  });

  it("sets no-store cache-control for a random ID", () => {
    expect(res1.headers["Cache-Control"]).toContain("no-store");
  });

  it("produces different images on successive random requests", () => {
    // Two random UUIDs should virtually never collide
    expect(res1.body!.equals(res2.body!)).toBe(false);
  });
});
