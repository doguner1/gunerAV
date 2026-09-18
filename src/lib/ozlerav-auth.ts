export async function getOzlerAvCookie(): Promise<string | null> {
  const email = process.env.OZLERAV_EMAIL;
  const password = process.env.OZLERAV_PASSWORD;

  if (!email || !password) {
    console.log("[ozlerav-auth] No OZLERAV_EMAIL or OZLERAV_PASSWORD found.");
    return null;
  }

  try {
    const getRes = await fetch("https://www.ozlerav.com.tr/giris", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      cache: "no-store"
    });
    const html = await getRes.text();
    
    const tokenMatch = html.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/);
    if (!tokenMatch) {
       console.log("[ozlerav-auth] Could not find RequestVerificationToken");
       return null;
    }
    const token = tokenMatch[1];
    
    // Use getSetCookie() if available (Node 18+ / Next.js)
    let initialCookiesArray: string[] = [];
    if (typeof getRes.headers.getSetCookie === 'function') {
        initialCookiesArray = getRes.headers.getSetCookie().map(c => c.split(';')[0].trim());
    } else {
        const raw = getRes.headers.get('set-cookie') || "";
        initialCookiesArray = raw ? raw.split(/,(?=[^ ]+=)/).map(c => c.split(';')[0].trim()) : [];
    }
    const initialCookieString = initialCookiesArray.join("; ");
    
    const formData = new URLSearchParams();
    formData.append("Email", email);
    formData.append("Password", password);
    formData.append("__RequestVerificationToken", token);
    
    const postRes = await fetch("https://www.ozlerav.com.tr/giris", {
      method: "POST",
      body: formData.toString(),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": initialCookieString,
        "Origin": "https://www.ozlerav.com.tr",
        "Referer": "https://www.ozlerav.com.tr/giris"
      },
      redirect: "manual",
      cache: "no-store"
    });
    
    let postCookiesArray: string[] = [];
    if (typeof postRes.headers.getSetCookie === 'function') {
        postCookiesArray = postRes.headers.getSetCookie();
    } else {
        const raw = postRes.headers.get('set-cookie') || "";
        postCookiesArray = raw ? raw.split(/,(?=[^ ]+=)/) : [];
    }

    const hasAuth = postCookiesArray.some(c => c.includes(".AspNetCore.") || c.includes("Identity"));
    
    if (hasAuth) {
       const mappedPostCookies = postCookiesArray.map(c => c.split(";")[0].trim());
       const finalCookies = [...initialCookiesArray, ...mappedPostCookies].join("; ");
       console.log("[ozlerav-auth] Successfully obtained B2B auth cookies");
       return finalCookies;
    }
    
    console.log("[ozlerav-auth] Login failed or no identity cookie returned. Status:", postRes.status);
    return null;

  } catch (e) {
    console.error("[ozlerav-auth] Login error:", e);
    return null;
  }
}
