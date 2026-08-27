export async function fetchJson(url) {
  const response =
    await fetch(url, {
      headers: {
        "Cache-Control": "no-cache"
      }
    });

  if (!response.ok) {
    throw new Error(
      `Erro ao carregar JSON: ${response.status}`
    );
  }

  return response.json();
}