const getMeetupPointsByCity = async (req, res) => {
  const city = req.query.city || '';

  if (!city || city.trim().length === 0) {
    return res.status(400).json({ message: 'Veuillez fournir une ville.' });
  }

  try {
    // 1. Récupération des coordonnées GPS via Nominatim (avec User-Agent strict)
    const geoUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=France&format=json&limit=1`;
    const geoResponse = await fetch(geoUrl, {
      headers: { 
        'User-Agent': 'BitLister-App/1.0 (contact@bitlister.local)' 
      }
    });

    if (!geoResponse.ok) {
      throw new Error(`Nominatim error status: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      return res.json({ city, places: getFallbackPlaces(city) });
    }

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);

    // 2. Interrogation Overpass API avec une syntaxe OverpassQL propre et corrigée
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="police"](around:3000, ${lat}, ${lon});
        node["railway"="station"](around:3000, ${lat}, ${lon});
        node["amenity"="cafe"](around:1500, ${lat}, ${lon});
      );
      out body 5;
    `;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    const overpassResponse = await fetch(overpassUrl, {
      headers: { 
        'User-Agent': 'BitLister-App/1.0 (contact@bitlister.local)' 
      }
    });

    // Si la réponse n'est pas OK (ex: 429 ou 504 HTML), on bascule sur le fallback
    if (!overpassResponse.ok) {
      console.warn(`Overpass API a répondu avec le statut ${overpassResponse.status}`);
      return res.json({ city, places: getFallbackPlaces(city) });
    }

    // On vérifie que le type de contenu retourné est bien du JSON
    const contentType = overpassResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('Overpass API n\'a pas retourné de JSON');
      return res.json({ city, places: getFallbackPlaces(city) });
    }

    const overpassData = await overpassResponse.json();

    if (!overpassData.elements || overpassData.elements.length === 0) {
      return res.json({ city, places: getFallbackPlaces(city) });
    }

    // 3. Formater les résultats reçus
    const places = overpassData.elements.map((el) => {
      const name = el.tags?.name || 'Lieu public sécurisé';
      let type = 'Lieu public';
      let note = 'Sous vidéo-protection ou espace fréquenté';

      if (el.tags?.amenity === 'police') {
        type = 'Commissariat / Gendarmerie';
        note = 'Sécurité maximale — Recommandé pour montants élevés';
      } else if (el.tags?.railway === 'station') {
        type = 'Gare ferroviaire';
        note = 'Lieu très fréquenté avec Wi-Fi / 4G stable';
      } else if (el.tags?.amenity === 'cafe') {
        type = 'Café / Terrasse';
        note = 'Pratique pour échanger au calme et assis';
      }

      return { name, type, note };
    });

    return res.json({ city, places: places.slice(0, 4) });

  } catch (error) {
    console.error('Erreur API externe, repli sur le fallback :', error.message);
    return res.json({ city, places: getFallbackPlaces(city) });
  }
};

function getFallbackPlaces(city) {
  return [
    {
      name: `Devant le Commissariat Principal (${city})`,
      type: 'Haute Sécurité',
      note: 'Recommandé pour les transactions de valeur importante'
    },
    {
      name: `Hall de la Gare Centrale (${city})`,
      type: 'Lieu Public',
      note: 'Zone fréquentée et généralement bien couverte en 4G/5G'
    },
    {
      name: `Grand Café en Centre-Ville (${city})`,
      type: 'Convivial',
      note: 'Idéal pour vérifier le matériel posément autour d\'un café'
    }
  ];
}

module.exports = {
  getMeetupPointsByCity
};