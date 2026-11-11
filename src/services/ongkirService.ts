export interface OngkirDestination {
  id: number;
  label: string;
  province_name: string;
  city_name: string;
  district_name: string;
  subdistrict_name: string;
  zip_code: string;
}

export interface OngkirServiceResult {
  code: string;
  name: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

/**
 * Cari kota / kecamatan destinasi pengiriman
 */
export async function searchOngkirDestinations(query: string): Promise<OngkirDestination[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const res = await fetch(`/api/ongkir?action=destination&search=${encodeURIComponent(query.trim())}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (e) {
    console.warn('Gagal mencari destinasi RajaOngkir:', e);
  }
  return [];
}

/**
 * Hitung tarif ongkir akurat real-time berdasarkan ID tujuan dan berat gram
 */
export async function calculateRealShippingCost(
  destinationId: number,
  weightGram: number,
  originId = 17473
): Promise<OngkirServiceResult[]> {
  try {
    const weight = Math.max(1000, weightGram);
    const res = await fetch(`/api/ongkir?action=cost&destination=${destinationId}&origin=${originId}&weight=${weight}&courier=jne:sicepat:jnt`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (e) {
    console.warn('Gagal menghitung ongkir RajaOngkir:', e);
  }
  return [];
}

