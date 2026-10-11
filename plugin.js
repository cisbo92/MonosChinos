// Plugin de Kino para MonosChinos

export async function home() {
  // Aseguramos el primer await antes de validar para cumplir la regla de Kino
  const response = await kino.fetch("https://monoschinos2.net");
  if (response.status !== 200) {
    kino.error("unavailable");
  }

  const html = await response.text();
  const items = [];

  // Buscamos los bloques de anime recientes en el HTML
  // Nota: Kino usa selectores básicos o expresiones regulares seguras
  const regex = /<a href="(https:\/\/vww\.monoschinos2\.net\/anime\/[^"]+)">[\s\(\S\)]*?<img src="([^"]+)"[\s\(\S\)]*?<h3[^>]*>([^<]+)<\/h3>/g;
  let match;
  
  while ((match = regex.exec(html)) !== null && items.length < 60) {
    items.push({
      kind: "anime",
      id: match[1], // Usamos la URL completa como ID único
      title: match[3].trim(),
      poster: match[2],
      genres: ["anime"]
    });
  }

  return [
    {
      title: "Últimos Animes Agregados",
      genre: "anime",
      items: items
    }
  ];
}

export async function search(query) {
  const searchUrl = `https://monoschinos2.netsearch?q=${encodeURIComponent(query)}`;
  const response = await kino.fetch(searchUrl);
  if (response.status !== 200) {
    kino.error("unavailable");
  }

  const html = await response.text();
  const results = [];

  const regex = /<a href="(https:\/\/vww\.monoschinos2\.net\/anime\/[^"]+)">[\s\(\S\)]*?<img src="([^"]+)"[\s\(\S\)]*?<h3[^>]*>([^<]+)<\/h3>/g;
  let match;

  while ((match = regex.exec(html)) !== null && results.length < 100) {
    results.push({
      kind: "anime",
      id: match[1],
      title: match[3].trim(),
      poster: match[2],
      genres: ["anime"]
    });
  }

  return results;
}

export async function episodes(animeId) {
  const response = await kino.fetch(animeId);
  if (response.status !== 200) {
    kino.error("not_found");
  }

  const html = await response.text();
  const episodeList = [];

  // Extrae la lista de capítulos del HTML del anime
  const regex = /<a href="(https:\/\/vww\.monoschinos2\.net\/ver\/[^"]+)"[^>]*>[\s\(\S\)]*?<span[^>]*>Episodio\s+(\d+)<\/span>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    episodeList.push({
      ref: match[1], // URL del capítulo para resolver el video después
      number: parseInt(match[2], 10),
      title: `Episodio ${match[2]}`
    });
  }

  // Las reglas de Kino piden los episodios ordenados del primero al último
  return episodeList.reverse();
}

export async function resolve(episodeUrl) {
  const response = await kino.fetch(episodeUrl);
  if (response.status !== 200) {
    kino.error("not_found");
  }

  const html = await response.text();
  
  // Buscamos un iframe de video común (ej. Vidguard, Streamwish, MyStream, Fembed)
  const iframeRegex = /<iframe[^>]+src="([^"]+)"/i;
  const match = iframeRegex.exec(html);

  if (!match) {
    kino.error("unavailable", "No se encontraron servidores de video disponibles.");
  }

  // Activamos el navegador oculto declarativamente si el reproductor requiere scripts
  // Retornamos la referencia externa para que el reproductor nativo o embed de Kino actúe
  return {
    url: match[1],
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  };
}
