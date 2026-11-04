import { Injectable, BadRequestException } from '@nestjs/common';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

export type GeocodingErrorCode =
  | 'ADDRESS_NOT_FOUND'
  | 'AMBIGUOUS_RESULT'
  | 'PROVIDER_ERROR'
  | 'INVALID_COORDINATES';

export class GeocodingException extends BadRequestException {
  constructor(
    message: string,
    public readonly code: GeocodingErrorCode,
  ) {
    super(message);
  }
}

/** Coordonnées de fallback pour le mode test (centre Abidjan, zone seed) */
const DEFAULT_FALLBACK_LAT = 5.3364;
const DEFAULT_FALLBACK_LON = -4.0267;

/**
 * Service de géocodage des adresses (adresse texte → latitude/longitude).
 * Utilise Nominatim (OpenStreetMap) par défaut.
 * Rate limit: 1 req/sec pour Nominatim public.
 */
@Injectable()
export class GeocodingService {
  private readonly baseUrl =
    process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org';
  private readonly userAgent =
    process.env.GEOCODING_USER_AGENT ||
    'ZuriDrop/1.0 (delivery; https://zuridrop.com)';

  /**
   * Géocode une adresse texte et retourne les coordonnées.
   * @throws GeocodingException en cas d'erreur
   */
  async geocode(address: {
    street: string;
    city: string;
    zipCode?: string | null;
    country?: string | null;
  }): Promise<GeocodingResult> {
    const query = this.buildQuery(address);
    if (!query.trim()) {
      throw new GeocodingException(
        'Adresse invalide : rue et ville requises',
        'ADDRESS_NOT_FOUND',
      );
    }

    let response: Response;
    try {
      const url = new URL('/search', this.baseUrl);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '3'); // Pour détecter ambiguïté

      response = await fetch(url.toString(), {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new GeocodingException(
        'Impossible de joindre le service de géolocalisation. Réessayez plus tard.',
        'PROVIDER_ERROR',
      );
    }

    if (!response.ok) {
      throw new GeocodingException(
        'Le service de géolocalisation est temporairement indisponible. Réessayez plus tard.',
        'PROVIDER_ERROR',
      );
    }

    let data: Array<{ lat: string; lon: string; display_name?: string }>;
    try {
      data = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    } catch {
      throw new GeocodingException(
        'Réponse du service de géolocalisation invalide.',
        'PROVIDER_ERROR',
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new GeocodingException(
        'Adresse introuvable. Vérifiez la rue et la ville, ou essayez une formulation plus précise.',
        'ADDRESS_NOT_FOUND',
      );
    }

    // Plusieurs résultats proches = ambiguïté possible
    if (data.length > 1) {
      const first = data[0];
      const others = data.slice(1);
      const threshold = 0.001; // ~100m
      const allSame = others.every(
        (r) =>
          Math.abs(parseFloat(r.lat) - parseFloat(first.lat)) < threshold &&
          Math.abs(parseFloat(r.lon) - parseFloat(first.lon)) < threshold,
      );
      if (!allSame) {
        throw new GeocodingException(
          'Adresse ambiguë. Merci de préciser (ex: quartier, code postal).',
          'AMBIGUOUS_RESULT',
        );
      }
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new GeocodingException(
        'Coordonnées invalides reçues du service de géolocalisation.',
        'INVALID_COORDINATES',
      );
    }

    // Validation grossière : Côte d'Ivoire ~ 4-11°N, -8 à -2°W
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new GeocodingException(
        'Coordonnées hors limites.',
        'INVALID_COORDINATES',
      );
    }

    return {
      latitude: lat,
      longitude: lon,
      displayName: result.display_name,
    };
  }

  private buildQuery(address: {
    street: string;
    city: string;
    zipCode?: string | null;
    country?: string | null;
  }): string {
    const parts: string[] = [];
    if (address.street?.trim()) parts.push(address.street.trim());
    if (address.city?.trim()) parts.push(address.city.trim());
    if (address.zipCode?.trim()) parts.push(address.zipCode.trim());
    if (address.country?.trim()) parts.push(address.country.trim());
    return parts.join(', ');
  }

  /**
   * Retourne des coordonnées de fallback pour le mode test/dev.
   * Permet au checkout, ETA, tracking et dispatch de continuer à fonctionner.
   * Configurable via GEOCODING_FALLBACK_LAT, GEOCODING_FALLBACK_LON (optionnel).
   */
  getFallbackCoords(): GeocodingResult {
    const lat = parseFloat(process.env.GEOCODING_FALLBACK_LAT || String(DEFAULT_FALLBACK_LAT));
    const lon = parseFloat(process.env.GEOCODING_FALLBACK_LON || String(DEFAULT_FALLBACK_LON));
    return {
      latitude: Number.isNaN(lat) ? DEFAULT_FALLBACK_LAT : lat,
      longitude: Number.isNaN(lon) ? DEFAULT_FALLBACK_LON : lon,
      displayName: 'Fallback (mode test)',
    };
  }
}
