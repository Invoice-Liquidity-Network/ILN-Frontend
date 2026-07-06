import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return new NextResponse("Missing address", { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("reminder_preferences")
      .update({ enabled: false })
      .eq("address", address);

    if (error) throw error;

    return new NextResponse(
      "<html><body><h1>Unsubscribed</h1><p>You have been successfully unsubscribed from payment reminders.</p></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Failed to unsubscribe", { status: 500 });
  }
}
