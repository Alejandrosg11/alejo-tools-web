/* eslint-disable @next/next/no-img-element -- Simulate Next Image load errors in jsdom. */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import AffiliateSpotlight from "./AffiliateSpotlight";

vi.mock("next/image", () => ({
  default: ({ src, alt, onError }: ComponentProps<"img">) => (
    <img src={src} alt={alt} onError={onError} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it("shows the fetched offer image after the initial fallback image failed", async () => {
  let finishRequest!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => {
    finishRequest = resolve;
  })));
  render(<AffiliateSpotlight />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();

  await act(async () => finishRequest(new Response(JSON.stringify({
    id: "test-offer", brand: "ugee", type: "product", title: "Test offer",
    description: "Test description", imageUrl: "https://example.test/offer.png",
    trackingUrl: "https://example.test/offer", ctaText: "Ver oferta",
  }))));
  expect(screen.getByRole("img").getAttribute("src")).toBe("https://example.test/offer.png");
  expect(screen.getByText("Test offer")).toBeTruthy();
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("UGEE")).toBeTruthy();
});

it("keeps the fallback offer when the affiliate API fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("simulated outage")));
  render(<AffiliateSpotlight />);
  await screen.findByText("Oferta UGEE");
  expect(screen.getByRole("img")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ver tienda" }).hasAttribute("disabled")).toBe(false);
});
