"use client";

import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SubmitInvoiceForm from "@/components/SubmitInvoiceForm";

export default function NewInvoicePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="px-4 pb-16 pt-32 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <SubmitInvoiceForm onSubmitted={(invoiceId) => router.push(`/invoices/${invoiceId}`)} />
        </div>
      </section>
      <Footer />
    </main>
  );
}
