export interface Place {
  label: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA name
}

/** Built-in Indian cities: instant suggestions that also keep the tool working if the geocoding service is down. */
const IN = "Asia/Kolkata";
const c = (name: string, state: string, latitude: number, longitude: number): Place => ({
  label: `${name}, ${state}, India`,
  latitude,
  longitude,
  timezone: IN,
});

export const INDIAN_CITIES: readonly Place[] = [
  c("Delhi", "Delhi", 28.6139, 77.209), c("Mumbai", "Maharashtra", 19.076, 72.8777), c("Kolkata", "West Bengal", 22.5726, 88.3639),
  c("Chennai", "Tamil Nadu", 13.0827, 80.2707), c("Bengaluru", "Karnataka", 12.9716, 77.5946), c("Hyderabad", "Telangana", 17.385, 78.4867),
  c("Ahmedabad", "Gujarat", 23.0225, 72.5714), c("Pune", "Maharashtra", 18.5204, 73.8567), c("Jaipur", "Rajasthan", 26.9124, 75.7873),
  c("Lucknow", "Uttar Pradesh", 26.8467, 80.9462), c("Kanpur", "Uttar Pradesh", 26.4499, 80.3319), c("Prayagraj", "Uttar Pradesh", 25.4358, 81.8463),
  c("Varanasi", "Uttar Pradesh", 25.3176, 82.9739), c("Gorakhpur", "Uttar Pradesh", 26.7606, 83.3732), c("Ayodhya", "Uttar Pradesh", 26.7922, 82.1998),
  c("Agra", "Uttar Pradesh", 27.1767, 78.0081), c("Mathura", "Uttar Pradesh", 27.4924, 77.6737), c("Patna", "Bihar", 25.5941, 85.1376),
  c("Bhopal", "Madhya Pradesh", 23.2599, 77.4126), c("Indore", "Madhya Pradesh", 22.7196, 75.8577), c("Ujjain", "Madhya Pradesh", 23.1765, 75.7885),
  c("Nagpur", "Maharashtra", 21.1458, 79.0882), c("Nashik", "Maharashtra", 19.9975, 73.7898), c("Chandigarh", "Chandigarh", 30.7333, 76.7794),
  c("Dehradun", "Uttarakhand", 30.3165, 78.0322), c("Haridwar", "Uttarakhand", 29.9457, 78.1642), c("Ranchi", "Jharkhand", 23.3441, 85.3096),
  c("Raipur", "Chhattisgarh", 21.2514, 81.6296), c("Bhubaneswar", "Odisha", 20.2961, 85.8245), c("Guwahati", "Assam", 26.1445, 91.7362),
  c("Thiruvananthapuram", "Kerala", 8.5241, 76.9366), c("Kochi", "Kerala", 9.9312, 76.2673), c("Coimbatore", "Tamil Nadu", 11.0168, 76.9558),
  c("Visakhapatnam", "Andhra Pradesh", 17.6868, 83.2185), c("Surat", "Gujarat", 21.1702, 72.8311), c("Vadodara", "Gujarat", 22.3072, 73.1812),
  c("Amritsar", "Punjab", 31.634, 74.8723), c("Jodhpur", "Rajasthan", 26.2389, 73.0243), c("Udaipur", "Rajasthan", 24.5854, 73.7125),
  c("Srinagar", "Jammu & Kashmir", 34.0837, 74.7973),
];

const fold = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").trim();

export function searchIndianCities(q: string, limit = 6): Place[] {
  const needle = fold(q);
  if (needle.length < 2) return [];
  return INDIAN_CITIES.filter((p) => fold(p.label).startsWith(needle) || fold(p.label.split(",")[0]).includes(needle)).slice(0, limit);
}

/** True for a string the platform recognises as an IANA time zone. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
