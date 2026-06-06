export default {
  async fetch(request) {
    const url = new URL(request.url);

    // API endpoint
    if (url.pathname === "/extract") {
      const target = url.searchParams.get("url");

      if (!target) {
        return new Response(
          JSON.stringify({ success: false, message: "Missing URL" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      try {
        const cache = caches.default;

        const cacheKey = new Request(
          "https://cache.local/?url=" + encodeURIComponent(target)
        );

        const cached = await cache.match(cacheKey);

        if (cached) {
          return cached;
        }

        const pageRes = await fetch(target, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const html = await pageRes.text();

        const match = html.match(
          /href="(https:\/\/cdn\.juicybits\.site\/files\/[^"]+)"/i
        );

        if (!match) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "JuicyBits URL not found"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        const response = new Response(
          JSON.stringify({
            success: true,
            downloadUrl: match[1]
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=10800"
            }
          }
        );

        await cache.put(cacheKey, response.clone());

        return response;

      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            message: err.message
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // HTML page
    return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MessyCloud Extractor</title>

<style>
body{
  font-family:Arial,sans-serif;
  max-width:700px;
  margin:40px auto;
  padding:20px;
}
h1{
  text-align:center;
}
input{
  width:100%;
  padding:12px;
  box-sizing:border-box;
}
button{
  margin-top:10px;
  padding:12px 20px;
  cursor:pointer;
}
#result{
  margin-top:20px;
}
textarea{
  width:100%;
  height:120px;
}
.download-btn{
  display:inline-block;
  padding:12px 20px;
  background:#28a745;
  color:#fff;
  text-decoration:none;
  border-radius:5px;
}
</style>
</head>
<body>

<h1>MessyCloud Link Extractor</h1>

<form id="extractForm">
  <input
    type="url"
    id="url"
    placeholder="Paste MessyCloud URL"
    required
  >
  <button type="submit">Extract</button>
</form>

<div id="result"></div>

<script>
document.getElementById("extractForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const inputUrl = document.getElementById("url").value;

  const result = document.getElementById("result");

  result.innerHTML = "Finding link...";

  try {
    const res = await fetch(
      "/extract?url=" + encodeURIComponent(inputUrl)
    );

    const data = await res.json();

    if (!data.success) {
      result.innerHTML =
        "<p>" + data.message + "</p>";
      return;
    }

    result.innerHTML = \`
      <p><strong>Found URL:</strong></p>

      <textarea readonly>\${data.downloadUrl}</textarea>

      <br><br>

      <a
        class="download-btn"
        href="\${data.downloadUrl}"
        target="_blank"
      >
        Open Download Link
      </a>
    \`;

  } catch (err) {
    result.innerHTML =
      "<p>Error: " + err.message + "</p>";
  }
});
</script>

</body>
</html>
`, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8"
      }
    });
  }
};
