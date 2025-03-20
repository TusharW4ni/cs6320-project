export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) {
      throw new Error(res.status);
    }
    const html = await res.text();
    function removeAllScriptTags(html: string) {
      // Remove <style> tags and their contents
      html = html.replace(
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        ""
      );

      // Remove style attributes directly within HTML elements
      html = html.replace(/style="[^"]*"/gi, "");

      // Remove any element with a style attribute
      html = html.replace(/<\w+\s+style=['"][^'"]*['"]\s*>/gi, "");

      return html;
    }
    return removeAllScriptTags(html);
  } catch (e) {
    return { error: e };
  }
});
