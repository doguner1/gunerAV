import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/server-auth";
import {
  getContactMessages,
  updateContactMessageReadStatus,
  deleteContactMessage,
} from "@/lib/server-messages";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  try {
    const messages = await getContactMessages();
    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("[admin messages GET error]:", error);
    return NextResponse.json(
      { success: false, error: "Mesajlar getirilirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, is_read } = body;

    if (!id || typeof is_read !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Geçersiz parametreler." },
        { status: 400 }
      );
    }

    const updated = await updateContactMessageReadStatus(id, is_read);
    return NextResponse.json({
      success: true,
      updated,
    });
  } catch (error) {
    console.error("[admin messages PATCH error]:", error);
    return NextResponse.json(
      { success: false, error: "Mesaj güncellenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz erişim." },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // query param was empty and body wasn't JSON
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Silinecek mesaj ID'si belirtilmedi." },
        { status: 400 }
      );
    }

    const deleted = await deleteContactMessage(id);
    return NextResponse.json({
      success: true,
      deleted,
    });
  } catch (error) {
    console.error("[admin messages DELETE error]:", error);
    return NextResponse.json(
      { success: false, error: "Mesaj silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
