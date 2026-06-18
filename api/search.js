export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const instances = [
    "https://etsi.me",
    "https://search.mdosch.de",
    "https://search.wdpserver.com",
    "https://searxng.gr"
  ];

  let results = [];
  let success = false;

  // 1. Try SearXNG instances
  for (const inst of instances) {
    const url = `${inst}/search?q=${encodeURIComponent(query)}&format=json`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout per instance

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.status === 200) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("json")) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            results = data.results.slice(0, 5).map(r => ({
              title: r.title || '',
              url: r.url || '',
              snippet: r.content || ''
            }));
            success = true;
            break;
          }
        }
      }
    } catch (err) {
      console.warn(`SearXNG instance ${inst} failed:`, err.message);
    }
  }

  // 2. Fallback to Wikipedia if SearXNG failed
  if (!success) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
      const wikiResponse = await fetch(wikiUrl);
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        // wikiData structure: [query, titles, descriptions, links]
        if (wikiData && wikiData[1] && wikiData[1].length > 0) {
          const titles = wikiData[1];
          const snippets = wikiData[2] || [];
          const urls = wikiData[3] || [];
          
          results = titles.map((title, i) => ({
            title: title || '',
            url: urls[i] || '',
            snippet: snippets[i] || ''
          }));
          success = true;
          console.log("Fallback Wikipedia search succeeded");
        }
      }
    } catch (wikiErr) {
      console.error("Wikipedia search fallback failed:", wikiErr);
    }
  }

  if (success) {
    return res.status(200).json({ results });
  } else {
    return res.status(502).json({ error: 'All search targets failed to respond' });
  }
}
