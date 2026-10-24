import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  renderWidget.mockReset();
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
      ? "Demasiadas solicitudes. Espera unos segundos antes de reintentar."
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
