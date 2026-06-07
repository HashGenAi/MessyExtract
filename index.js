const ALLOWED_SITE = "jiorockers.online";
const CACHE_TTL = 10800; // 3 hours

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${CACHE_TTL}`
    }
  });
}

export default {
  async fetch(request) {

    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS"
        }
      });
    }

    const target = url.searchParams.get("url");

    if (!target) {
      return json({
        success: false,
        message: "Missing URL"
      }, 400);
    }

    let targetUrl;

    try {
      targetUrl = new URL(target);
    } catch {
      return json({
        success: false,
        message: "Invalid URL"
      }, 400);
    }

    // Allow only URLs from the specified site
    if (
      targetUrl.hostname !== ALLOWED_SITE &&
      targetUrl.hostname !== `www.${ALLOWED_SITE}`
    ) {
      return json({
        success: false,
        message: "Forbidden"
      }, 403);
    }

    const cache = caches.default;

    const cacheKey = new Request(
      "https://cache.local/?url=" + encodeURIComponent(target)
    );

    // Check cache
    let cached = await cache.match(cacheKey);

    if (cached) {
      return cached;
    }

    try {

      const pageRes = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await pageRes.text();

      const match = html.match(
        /href="(https:\/\/cdn\.juicybits\.site\/files\/[^"]+)"/i
      );

      if (!match) {
        return json({
          success: false,
          message: "Link not found"
        }, 404);
      }

      const response = json({
        success: true,
        downloadUrl: match[1],
        cached: false
      });

      await cache.put(cacheKey, response.clone());

      return response;

    } catch (err) {

      return json({
        success: false,
        message: err.message
      }, 500);

    }
  }
}
