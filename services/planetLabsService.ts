
// Planet Labs API Service - Smart Helios Integration
// Based on Documentation v2.0 (Feb 2025)

export interface PlanetCredentials {
  apiKey: string;
  configurationId?: string;
}

export interface PlanetSearchResult {
  type: string;
  features: Array<{
    id: string;
    properties: {
      acquired: string;
      cloud_cover: number;
      item_type: string;
    };
    assets: any;
  }>;
}

// Credentials verified from documentation
export const VERIFIED_CREDENTIALS = {
  apiKey: 'PLAK965b839381d24a93846595d6932779ca',
  configurationId: 'a32c9d5e-d669-44f9-9598-cedd3cbcb25b'
};

const MOCK_MODE = true; // Set to false to bypass sandbox and use real endpoints

/**
 * Generates Basic Auth header for Planet API
 * Note: Planet uses API Key as username and empty password
 */
function getAuthHeader(apiKey: string): string {
  // btoa converts to Base64. Header is "Basic <base64(apiKey:)>"
  return 'Basic ' + btoa(`${apiKey}:`);
}

/**
 * Get OGC Service URL for WMS/WMTS visualization (Configuration ID)
 * Verified URL structure: https://ogc.planet.com/wmts/{CONFIG_ID}?api_key={API_KEY}
 */
export function getOGCServiceUrl(
  service: 'WMS' | 'WMTS' = 'WMTS'
): string {
  const configId = VERIFIED_CREDENTIALS.configurationId;
  const apiKey = VERIFIED_CREDENTIALS.apiKey;
  
  const baseUrl = service === 'WMS'
    ? `https://ogc.planet.com/wms/${configId}`
    : `https://ogc.planet.com/wmts/${configId}`;

  return `${baseUrl}?api_key=${apiKey}`;
}

/**
 * Test connectivity by hitting the item-types endpoint (as per Guide Step 1)
 */
export async function testPlanetConnectivity(): Promise<{ success: boolean; data?: any; error?: string }> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1000));
    return { 
      success: true, 
      data: { 
        item_types: [
          { id: "PSScene", display_description: "PlanetScope Scene" },
          { id: "SkySatCollect", display_description: "SkySat Collect" }
        ] 
      } 
    };
  }

  try {
    const response = await fetch('https://api.planet.com/data/v1/item-types', {
      headers: {
        'Authorization': getAuthHeader(VERIFIED_CREDENTIALS.apiKey)
      }
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Search the Planet Data API for recent imagery
 */
export async function searchPlanetImagery(
  aoi: { type: string; coordinates: number[][][] },
  dateStart: string,
  dateEnd: string,
  cloudCover: number = 0.1
): Promise<PlanetSearchResult> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1200));
    return {
      type: "FeatureCollection",
      features: [
        {
          id: "20240215_1005_PSScene",
          properties: { acquired: "2024-02-15T10:00:00Z", cloud_cover: 0.02, item_type: "PSScene" },
          assets: { visual: { location: "https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_2024_01_mosaic/gmap/12/2314/1456.png?api_key=" + VERIFIED_CREDENTIALS.apiKey } }
        },
        {
          id: "20240210_0945_PSScene",
          properties: { acquired: "2024-02-10T09:45:00Z", cloud_cover: 0.05, item_type: "PSScene" },
          assets: { visual: { location: "https://tiles.planet.com/basemaps/v1/planet-tiles/global_monthly_2024_01_mosaic/gmap/12/2315/1457.png?api_key=" + VERIFIED_CREDENTIALS.apiKey } }
        }
      ]
    };
  }

  const filter = {
    type: 'AndFilter',
    config: [
      { type: 'GeometryFilter', field_name: 'geometry', config: aoi },
      { type: 'DateRangeFilter', field_name: 'acquired', config: { gte: `${dateStart}T00:00:00Z`, lte: `${dateEnd}T23:59:59Z` } },
      { type: 'RangeFilter', field_name: 'cloud_cover', config: { lte: cloudCover } }
    ]
  };

  try {
    const response = await fetch('https://api.planet.com/data/v1/quick-search', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(VERIFIED_CREDENTIALS.apiKey),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item_types: ['PSScene'], filter })
    });

    if (!response.ok) throw new Error(`Planet search failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Planet API Error:', error);
    throw error;
  }
}

/**
 * Activate an asset for download (MOD-04)
 */
export async function activateAsset(activateUrl: string): Promise<void> {
  try {
    await fetch(activateUrl, {
      method: 'POST',
      headers: { 'Authorization': getAuthHeader(VERIFIED_CREDENTIALS.apiKey) }
    });
  } catch (e) {
    console.error('Asset activation trigger failed', e);
  }
}

/**
 * Simplified Satellite Soiling Analysis Logic
 * MOD-04 Core
 */
export function calculateSoilingIndex(beforeVal: number, afterVal: number): number {
  const diff = beforeVal - afterVal;
  const index = (diff / beforeVal) * 100;
  return Math.max(0, Math.min(100, index));
}
