import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, type ComponentProps } from "react";
import ImageDropzone from "./ImageDropzone";

// Exercise the real component, modal and input. Only external browser/Next
// integrations are simulated; no requests reach Cloudflare or Sightengine.
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock("next/script", () => ({
  default: function Script({ onLoad }: { onLoad: () => void }) {
    // Emulate Next's script load after mount, with a stable hook dependency.
    useEffect(onLoad, [onLoad]);
    return null;
  },
}));

const storageKey = "alejo_bot_session_token";
const sessionHeader = "x-bot-session-token";
const fetchMock = vi.fn<typeof fetch>();
let completeChallenge: (token: string) => void;
const renderWidget = vi.fn<NonNullable<Window["turnstile"]>["render"]>();
const result = { percentage: 91, label: "alta", message: "Resultado de prueba" };

function success(session = "refreshed-session") {
  return new Response(JSON.stringify({ result }), {
    headers: { [sessionHeader]: session },
  });
}

function uploadSetup(session?: string) {
  if (session) localStorage.setItem(storageKey, session);
  const onResult = vi.fn<ComponentProps<typeof ImageDropzone>["onResult"]>();
  const view = render(<ImageDropzone onResult={onResult} />);
  const input = view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File(["image-fixture"], "drawing.png", { type: "image/png" });
  return { user: userEvent.setup(), input, file, onResult };
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("turnstile", {
    render: renderWidget.mockImplementation((_element, options) => {
      completeChallenge = options.callback;
      return "test-widget";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-image");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  renderWidget.mockReset();
});

const dropzone = () => screen.getByRole("region", { name: "Subir imagen para analizar" });
const fileTransfer = (files: File[] = []) => ({ files, types: ["Files"], dropEffect: "none" });

describe("image drag and drop", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("analyzes a dropped %s using the saved session", async (type) => {
    fetchMock.mockResolvedValue(success());
    const { onResult } = uploadSetup("valid-session");
    const file = new File(["image"], "drawing", { type });
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get("image")).toBe(file);
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ [sessionHeader]: "valid-session" });
    expect(renderWidget).not.toHaveBeenCalled();
  });

  it.each(["selection", "drop"])("rejects invalid types and oversized files through %s", (method) => {
    const { input, onResult } = uploadSetup("valid-session");
    const invalid = new File(["text"], "notes.txt", { type: "text/plain" });
    const oversized = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", { type: "image/png" });
    for (const [file, message] of [
      [invalid, "Solo se permiten imágenes JPG, PNG o WebP."],
      [oversized, "La imagen supera el máximo permitido de 8MB."],
    ] as const) {
      if (method === "drop") fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
      else fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText(message)).toBeTruthy();
    }
    expect(onResult).toHaveBeenLastCalledWith(null);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects multiple files and can accept a single image afterwards", async () => {
    fetchMock.mockResolvedValue(success());
    const { file, onResult } = uploadSetup("valid-session");
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file, file]) });
    expect(screen.getByText("Selecciona una sola imagen a la vez.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    expect(screen.queryByText("Selecciona una sola imagen a la vez.")).toBeNull();
  });

  it("keeps the drop hint across child transitions and resets it on exit or drop", async () => {
    fetchMock.mockResolvedValue(success());
    const { file } = uploadSetup("valid-session");
    const zone = dropzone();
    const button = screen.getByRole("button", { name: "Selecciona una imagen" });
    const transfer = fileTransfer([file]);
    fireEvent.dragEnter(zone, { dataTransfer: transfer });
    fireEvent.dragEnter(button, { dataTransfer: transfer });
    fireEvent.dragLeave(button, { dataTransfer: transfer });
    expect(screen.getByText("Suelta la imagen aquí")).toBeTruthy();
    expect(fireEvent.dragOver(zone, { dataTransfer: transfer })).toBe(false);
    expect(transfer.dropEffect).toBe("copy");
    fireEvent.dragLeave(zone, { dataTransfer: transfer });
    expect(screen.getByText("Arrastra una imagen aquí")).toBeTruthy();
    fireEvent.dragEnter(zone, { dataTransfer: transfer });
    expect(fireEvent.drop(zone, { dataTransfer: transfer })).toBe(false);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Suelta la imagen para cambiarla")).toBeNull();
  });

  it("ignores dragged text and links", () => {
    uploadSetup("valid-session");
    const transfer = { types: ["text/plain", "text/uri-list"], files: [] };
    fireEvent.dragEnter(dropzone(), { dataTransfer: transfer });
    fireEvent.drop(dropzone(), { dataTransfer: transfer });
    expect(screen.getByText("Arrastra una imagen aquí")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("keeps the pending file while verifying, then allows dropping the same file after cancellation", async () => {
    fetchMock.mockResolvedValue(success());
    const { user, input, file } = uploadSetup();
    const other = new File(["other"], "other.png", { type: "image/png" });
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    expect(input.disabled).toBe(true);
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([other]) });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    await act(async () => completeChallenge("fresh-challenge"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect((fetchMock.mock.calls[0][1]?.body as FormData).get("image")).toBe(file);
  });

  it("blocks drops while analyzing and permits replacement after success", async () => {
    let finish!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce(success());
    const { file, onResult } = uploadSetup("valid-session");
    const other = new File(["other"], "other.png", { type: "image/png" });
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    const transfer = fileTransfer([other]);
    fireEvent.dragEnter(dropzone(), { dataTransfer: transfer });
    fireEvent.dragOver(dropzone(), { dataTransfer: transfer });
    expect(transfer.dropEffect).toBe("none");
    fireEvent.drop(dropzone(), { dataTransfer: transfer });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
    await act(async () => finish(success()));
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    fireEvent.dragEnter(dropzone(), { dataTransfer: transfer });
    expect(screen.getByText("Suelta la imagen para cambiarla")).toBeTruthy();
    fireEvent.drop(dropzone(), { dataTransfer: transfer });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect((fetchMock.mock.calls[1][1]?.body as FormData).get("image")).toBe(other);
  });

  it("preserves the successful image and result during cooldown and accepts a new drop after expiry", async () => {
    fetchMock.mockResolvedValueOnce(success())
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "RATE_LIMIT_SHORT", retryAfterMs: 60000 }), { status: 429 }))
      .mockResolvedValueOnce(success());
    const { file, onResult } = uploadSetup("valid-session");
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([file]) });
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    const other = new File(["other"], "other.png", { type: "image/png" });
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([other]) });
    await screen.findByText("Espera un momento para continuar");
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result));
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([other]) });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60001);
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    fireEvent.drop(dropzone(), { dataTransfer: fileTransfer([other]) });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect((fetchMock.mock.calls[2][1]?.body as FormData).get("image")).toBe(other);
  });
});

describe("session reuse and verification recovery", () => {
  it("uses a saved session without opening Turnstile and saves the refreshed session", async () => {
    fetchMock.mockImplementation(async () => success());
    const { user, input, file, onResult } = uploadSetup("valid-session");
    await user.upload(input, file);
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining(result)));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(renderWidget).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({ [sessionHeader]: "valid-session" });
    expect(localStorage.getItem(storageKey)).toBe("refreshed-session");

    await user.upload(input, new File(["second"], "second.png", { type: "image/png" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onResult.mock.calls.filter(([value]) => value !== null)).toHaveLength(2));
    expect(fetchMock.mock.calls[1][1]?.headers).toEqual({ [sessionHeader]: "refreshed-session" });
    expect(renderWidget).not.toHaveBeenCalled();
  });

  it("verifies the first image when no session exists, then analyzes it", async () => {
    fetchMock.mockResolvedValue(success());
    const { user, input, file, onResult } = uploadSetup();
    await user.upload(input, file);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => completeChallenge("fresh-challenge"));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining(result)));
    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get("image")).toBe(file);
    expect(body.get("turnstileToken")).toBe("fresh-challenge");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([
    [400, { code: "TOKEN_MISSING" }],
    [403, { code: "TOKEN_INVALID" }],
    [403, { error: { code: "TOKEN_INVALID" } }],
  ])("recovers a rejected session (%s, %j) with the same file", async (status, payload) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status }))
      .mockResolvedValueOnce(success());
    const { user, input, file, onResult } = uploadSetup("expired-session");
    await user.upload(input, file);
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(screen.getByText("Necesitamos validar seguridad una vez más para continuar.")).toBeTruthy();
    await act(async () => completeChallenge("renewed-challenge"));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining(result)));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = fetchMock.mock.calls[1][1]!;
    expect((retry.body as FormData).get("image")).toBe(file);
    expect((retry.body as FormData).get("turnstileToken")).toBe("renewed-challenge");
    expect(retry.headers).toEqual({});
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([false, true])("cancels verification and can select the same file again (recovery: %s)", async (recovering) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ code: "TOKEN_MISSING" }), { status: 400 }));
    const { user, input, file } = uploadSetup(recovering ? "expired-session" : undefined);
    await user.upload(input, file);
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("img", { name: "Imagen seleccionada" })).toBeTruthy();
    const callsBefore = fetchMock.mock.calls.length;
    await user.upload(input, file);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(callsBefore);
  });

  it("does not loop when the new challenge itself is rejected", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ code: "TOKEN_INVALID" }), { status: 403 }));
    const { user, input, file } = uploadSetup("expired-session");
    await user.upload(input, file);
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    await act(async () => completeChallenge("rejected-challenge"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("No se pudo validar la verificación anti-bot. Intenta de nuevo.")).toBeTruthy();
  });

  it.each([429, 503])("does not ask for verification for unrelated HTTP errors (%s)", async (status) => {
    fetchMock.mockResolvedValue(new Response("{}", { status }));
    const { user, input, file } = uploadSetup("valid-session");
    await user.upload(input, file);
    await screen.findByText(status === 429
      ? "No pudimos confirmar el tiempo de espera. Intenta más tarde."
      : "El servicio no está disponible por ahora. Intenta más tarde.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(renderWidget).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe("valid-session");
  });

  it("shows a network error without invalidating the saved session", async () => {
    fetchMock.mockRejectedValue(new TypeError("simulated network failure"));
    const { user, input, file } = uploadSetup("valid-session");
    await user.upload(input, file);
    await screen.findByText("No se pudo conectar con el servicio de análisis. Intenta de nuevo.");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(renderWidget).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe("valid-session");
  });

  it.each(["success", "server-error", "network-error"])("shows the same loading modal on a second upload until %s", async (outcome) => {
    let resolveRequest!: (response: Response) => void;
    let rejectRequest!: (error: Error) => void;
    const pendingResponse = new Promise<Response>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    fetchMock.mockResolvedValueOnce(success()).mockReturnValueOnce(pendingResponse);
    const { user, input, file, onResult } = uploadSetup("valid-session");
    await user.upload(input, file);
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining(result)));

    await user.upload(input, new File(["second-image"], "second.png", { type: "image/png" }));
    const loading = screen.getByRole("dialog", { name: "Procesando solicitud" });
    expect(loading.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Estamos analizando tu imagen. Esto puede tardar unos segundos.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cambiar imagen seleccionada" }).hasAttribute("disabled")).toBe(true);
    expect(renderWidget).not.toHaveBeenCalled();

    await act(async () => {
      if (outcome === "network-error") rejectRequest(new TypeError("simulated network failure"));
      else resolveRequest(outcome === "success" ? success() : new Response("{}", { status: 503 }));
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Cambiar imagen seleccionada" }).hasAttribute("disabled")).toBe(false);
    if (outcome === "success") {
      expect(onResult.mock.calls.filter(([value]) => value !== null)).toHaveLength(2);
    } else {
      expect(screen.getByText(outcome === "server-error"
        ? "El servicio no está disponible por ahora. Intenta más tarde."
        : "No se pudo conectar con el servicio de análisis. Intenta de nuevo.")).toBeTruthy();
    }
  });
});

describe("approved rate-limit notice", () => {
  it("restores the successful pair after verified 429 and clears the score on reselection and cancellation", async () => {
    fetchMock
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "TOKEN_INVALID" }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "RATE_LIMIT_SHORT", retryAfterMs: 60000 }), { status: 429 }));
    const { user, input, file, onResult } = uploadSetup("valid-session");
    await user.upload(input, file);
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    const successfulResult = onResult.mock.calls.at(-1)![0];
    const second = new File(["second"], "second.png", { type: "image/png" });
    await user.upload(input, second);
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    expect(onResult).toHaveBeenLastCalledWith(null);
    await act(async () => completeChallenge("renewed-challenge"));
    await screen.findByText("Espera un momento para continuar");
    expect(onResult.mock.calls.map(([value]) => value)).toEqual([null, successfulResult, null, null, successfulResult]);
    expect(onResult).toHaveBeenLastCalledWith(successfulResult);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retry = fetchMock.mock.calls[2][1]!;
    expect((retry.body as FormData).get("image")).toBe(second);
    expect((retry.body as FormData).get("turnstileToken")).toBe("renewed-challenge");
    expect(retry.headers).toEqual({});
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 60001);
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    await screen.findByText("El tiempo de espera terminó");
    const third = new File(["third"], "third.png", { type: "image/png" });
    await user.upload(input, third);
    await screen.findByRole("dialog", { name: "Verifica que no eres un bot" });
    expect(onResult).toHaveBeenLastCalledWith(null);
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(third);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onResult).toHaveBeenLastCalledWith(null);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it.each([null, 60000])("updates the existing live region for 429 (retryAfterMs: %s)", async (retryAfterMs) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: "RATE_LIMIT_SHORT", retryAfterMs }), { status: 429 }));
    const { user, input, file } = uploadSetup("valid-session");
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await user.upload(input, file);
    await screen.findByText(retryAfterMs === null ? "Intenta más tarde" : "Espera un momento para continuar");
    expect(screen.getByRole("status")).toBe(status);
    expect(status.getAttribute("aria-atomic")).toBe("true");
    if (retryAfterMs !== null) {
      const timer = screen.getByRole("timer");
      expect(status.contains(timer)).toBe(false);
      expect(timer.getAttribute("aria-live")).toBe("off");
    } else {
      expect(screen.queryByRole("timer")).toBeNull();
    }
  });

  it("keeps the result paired with its image, counts down and enables a NEW selection", async () => {
    fetchMock
      .mockResolvedValueOnce(success())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: "RATE_LIMIT_SHORT", retryAfterMs: 2000 }),
          { status: 429 },
        ),
      )
      .mockResolvedValueOnce(success());
    const { user, input, file, onResult } = uploadSetup("valid-session");
    await user.upload(input, file);
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result)));
    await user.upload(
      input,
      new File(["second"], "second.png", { type: "image/png" }),
    );
    await screen.findByText("Espera un momento para continuar");
    expect(screen.getByRole("timer").textContent).toBe("00:02");
    expect(onResult.mock.calls.map(([value]) => value === null)).toEqual([true, false, true, false]);
    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining(result));
    expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
    const button = () =>
      screen.getByRole("button", { name: "Cambiar imagen seleccionada" });
    expect(button().hasAttribute("disabled")).toBe(true);
    expect(
      screen.queryByText(
        /3 solicitudes|Comprobar disponibilidad|Reintentar análisis/,
      ),
    ).toBeNull();
    await screen.findByText(
      "El tiempo de espera terminó",
      {},
      { timeout: 3500 },
    );
    expect(screen.queryByRole("timer")).toBeNull();
    expect(button().hasAttribute("disabled")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    const third = new File(["third"], "third.png", { type: "image/png" });
    await user.upload(input, third);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect((fetchMock.mock.calls[2][1]?.body as FormData).get("image")).toBe(
      third,
    );
  });
  it("uses the daily duration and refreshes time when the tab becomes visible", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: "RATE_LIMIT_DAILY", retryAfterMs: 19200000 }),
        { status: 429 },
      ),
    );
    const { user, input, file } = uploadSetup("valid-session");
    await user.upload(input, file);
    await screen.findByText("Alcanzaste el límite de consultas");
    expect(screen.getByRole("timer").textContent).toBe("5 h 20 min 00 s");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 19200001);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByText("El tiempo de espera terminó")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("reads the named header even if the error body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("not JSON", {
        status: 429,
        headers: { "Retry-After-short": "60" },
      }),
    );
    const { user, input, file } = uploadSetup("valid-session");
    await user.upload(input, file);
    await screen.findByText("Espera un momento para continuar");
    expect(screen.getByRole("timer").textContent).toBe("01:00");
  });
  it("does not invent a lock or check button when time is missing", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    const { user, input, file } = uploadSetup("valid-session");
    await user.upload(input, file);
    await screen.findByText(
      "No pudimos confirmar el tiempo de espera. Intenta más tarde.",
    );
    expect(screen.queryByRole("timer")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Comprobar disponibilidad" }),
    ).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Cambiar imagen seleccionada" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
