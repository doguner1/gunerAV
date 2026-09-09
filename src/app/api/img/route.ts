import { NextRequest, NextResponse } from "next/server";
import { decryptImageUrl } from "@/lib/image-crypto";

export const dynamic = "force-dynamic";

// SSRF blocklist
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  // Private IP checks
  if (
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  ) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const targetUrl = decryptImageUrl(token);
  if (!targetUrl) {
    return new NextResponse("Invalid or corrupted token", { status: 403 });
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    if (isPrivateHost(parsed.hostname)) {
      return new NextResponse("Access to private resources is forbidden", { status: 403 });
    }

    // Fetch upstream image with 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const upstreamRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);

    if (!upstreamRes.ok) {
      return new NextResponse("Upstream image not found", { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/jpeg";
    const rawBuffer = Buffer.from(await upstreamRes.arrayBuffer());

    let outputBuffer = rawBuffer;
    let outputContentType = contentType;

    try {
      const sharp = (await import("sharp")).default;
      const img = sharp(rawBuffer);
      const meta = await img.metadata();

      if (meta.format && ["jpeg", "jpg", "png", "webp", "avif", "tiff"].includes(meta.format)) {
        // 1. Automatically trim solid/transparent outer margins (threshold: 12)
        const trimmed = await sharp(rawBuffer)
          .trim({ threshold: 12 })
          .toBuffer({ resolveWithObject: true });

        if (trimmed.info.width > 20 && trimmed.info.height > 20) {
          // 2. Add a subtle 1.5% breathing padding around trimmed subject
          const padX = Math.min(24, Math.max(6, Math.round(trimmed.info.width * 0.015)));
          const padY = Math.min(24, Math.max(6, Math.round(trimmed.info.height * 0.015)));

          const isTransparent = Boolean(trimmed.info.channels === 4 && trimmed.info.hasAlpha);
          const bg = isTransparent
            ? { r: 255, g: 255, b: 255, alpha: 0 }
            : { r: 255, g: 255, b: 255, alpha: 1 };

          // 3. High-definition output (crisp 1600px retina, fast & lightweight webp)
          outputBuffer = await sharp(trimmed.data)
            .extend({
              top: padY,
              bottom: padY,
              left: padX,
              right: padX,
              background: bg,
            })
            .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 88, effort: 2 })
            .toBuffer();

          outputContentType = "image/webp";
        }
      }
    } catch (procErr: any) {
      // Graceful fallback to original upstream buffer if trimming is not applicable
      console.warn("[api/img] Optimization fallback:", procErr?.message || procErr);
      outputBuffer = rawBuffer;
    }

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": outputContentType,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("[api/img] Fetch error:", err?.message || err);
    return new NextResponse("Error fetching image", { status: 502 });
  }
}
