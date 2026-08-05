export type UberLog = {
  id: string;
  userId: string;
  logDate: string;
  kmDriven: number;
  earnings: number;
  fuelLiters: number | null;
  fuelCost: number | null;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
};
