import { redirect } from "next/navigation";

export default function PayerRedirect() {
  redirect("/dashboard/payer");
}
