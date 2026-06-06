export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST") {
      const formData = await request.formData();
      const pageUrl = formData.get("url");

      if (!pageUrl) {
        return new Response("Missing URL", { status: 400 });
      }

      try {
        const res = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const html = await res.text();

        const match = html.match(
          /href="(https:\/\/cdn\.juicybits\.site\/files\/[^"]+)"/i
        );

        const result = match
          ? `<p><strong>Download Link:</strong></p>
             <textarea style="width:100%;height:100px;">${match[1]}</textarea>`
          : `<p>No JuicyBits link found.</p>`;

        return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MessyCloud Extractor</title>
<style>
body{
  font-family:Arial,sans-serif;
  max-width:800px;
  margin:40px auto;
  padding:20px;
}
input{
  width:100%;
  padding:12px;
}
button{
  margin-top:10px;
  padding:12px 20px;
}
textarea{
  margin-top:15px;
}
</style>
</head>
<body>
<h2>MessyCloud Link Extractor</h2>

<form method="POST">
<input
  type="url"
  name="url"
  placeholder="Paste MessyCloud URL"
  required
>
<button type="submit">Extract</button>
</form>

<hr>

${result}

</body>
</html>
        `, {
          headers: {
            "Content-Type": "text/html;charset=UTF-8"
          }
        });

      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 });
      }
    }

    return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MessyCloud Extractor</title>
<style>
body{
  font-family:Arial,sans-serif;
  max-width:800px;
  margin:40px auto;
  padding:20px;
}
input{
  width:100%;
  padding:12px;
}
button{
  margin-top:10px;
  padding:12px 20px;
}
</style>
</head>
<body>

<h2>MessyCloud Link Extractor</h2>

<form method="POST">
<input
  type="url"
  name="url"
  placeholder="Paste MessyCloud URL"
  required
>
<button type="submit">Extract</button>
</form>

</body>
</html>
    `, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8"
      }
    });
  }
};
