import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  return handleRevalidate(req);
}

export async function POST(req: NextRequest) {
  return handleRevalidate(req);
}

async function handleRevalidate(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const path = req.nextUrl.searchParams.get("path");

  // Güvenlik doğrulaması: REVALIDATE_SECRET veya varsayılan token
  const expectedSecret = process.env.REVALIDATE_SECRET || "gunerav_revalidate_secret_2026";
  if (secret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: "Geçersiz gizli anahtar (secret)." },
      { status: 401 }
    );
  }

  try {
    if (path) {
      revalidatePath(path);
    } else {
      // Varsayılan olarak tüm ana rotaları anında temizle
      revalidatePath("/[locale]", "page");
      revalidatePath("/[locale]/products", "page");
      revalidatePath("/[locale]/kategori/[categoryId]", "page");
      revalidatePath("/[locale]/products/[slug]", "page");
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      now: new Date().toISOString(),
      path: path || "all",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
