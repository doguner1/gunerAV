import { NextResponse } from "next/server";
import { getOzlerAvCookie } from "@/lib/ozlerav-auth";
import { searchOzlerAvProduct } from "@/lib/supplier-matcher";

export async function GET() {
  try {
    const cookie = await getOzlerAvCookie();
    if (!cookie) {
       return NextResponse.json({ success: false, error: "Failed to get cookie" });
    }
    
    // Test a restricted search
    const testSearch = await searchOzlerAvProduct("sterling", cookie);
    
    return NextResponse.json({ success: true, cookie, testSearch });
  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}
