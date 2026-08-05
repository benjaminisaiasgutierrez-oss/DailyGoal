export const FUEL_TYPES = ["93", "95", "97", "diesel", "otro"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  "93": "93 octanos",
  "95": "95 octanos",
  "97": "97 octanos",
  diesel: "Diésel",
  otro: "Otro",
};

export const RIDESHARE_PLATFORMS = ["uber", "didi", "cabify", "indriver", "otro"] as const;

export type RidesharePlatform = (typeof RIDESHARE_PLATFORMS)[number];

export const RIDESHARE_PLATFORM_LABELS: Record<RidesharePlatform, string> = {
  uber: "Uber",
  didi: "DiDi",
  cabify: "Cabify",
  indriver: "InDriver",
  otro: "Otra",
};

export type UberLog = {
  id: string;
  userId: string;
  logDate: string;
  kmDriven: number;
  earnings: number;
  fuelLiters: number | null;
  fuelCost: number | null;
  fuelPricePerLiter: number | null;
  fuelType: FuelType | null;
  tripCount: number | null;
  tips: number | null;
  platforms: RidesharePlatform[];
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
};
