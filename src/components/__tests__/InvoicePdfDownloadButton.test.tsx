import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InvoicePdfDownloadButton from "../InvoicePdfDownloadButton";
import type { Invoice } from "@/utils/soroban";

const save = vi.fn();
const text = vi.fn();
const addImage = vi.fn();

vi.mock("qrcode.react", async () => {
  const ReactModule = await vi.importActual<typeof React>("react");
  const MockQRCodeCanvas = ReactModule.forwardRef<HTMLCanvasElement>((_props, ref) => (
    <canvas ref={ref} aria-hidden="true" />
  ));
  MockQRCodeCanvas.displayName = "MockQRCodeCanvas";
  return { QRCodeCanvas: MockQRCodeCanvas };
});

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(function MockJsPDF(this: Record<string, unknown>) {
    this.setFillColor = vi.fn();
    this.rect = vi.fn();
    this.setTextColor = vi.fn();
    this.setFont = vi.fn();
    this.setFontSize = vi.fn();
    this.text = text;
    this.splitTextToSize = vi.fn((value: string) => [value]);
    this.setDrawColor = vi.fn();
    this.roundedRect = vi.fn();
    this.addImage = addImage;
    this.save = save;
  }),
}));

const invoice: Invoice = {
  id: 7n,
  freelancer: "GFREELANCERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  payer: "GPAYERBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  amount: 1_000_000_000n,
  due_date: 1_900_000_000n,
  discount_rate: 300,
  status: "Pending",
};

describe("InvoicePdfDownloadButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window.HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: vi.fn(() => "data:image/png;base64,qr"),
    });
  });

  it("generates and saves the required invoice PDF filename", async () => {
    render(<InvoicePdfDownloadButton invoice={invoice} />);

    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));

    await waitFor(() => expect(save).toHaveBeenCalledWith("ILN-Invoice-7.pdf"));
    expect(addImage).toHaveBeenCalledWith("data:image/png;base64,qr", "PNG", 444, 160, 100, 100);
    expect(text).toHaveBeenCalledWith("ILN Invoice", 48, 52);
    expect(text).toHaveBeenCalledWith("Invoice page", 48, 720);
  });
});
