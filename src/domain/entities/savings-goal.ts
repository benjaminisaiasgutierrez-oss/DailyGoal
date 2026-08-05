export type SavingsGoal = {
  id: string;
  userId: string;
  name: string;
  targetAmount: number | null;
  targetDate: string | null;
  savedAmount: number;
  createdAt: string;
};
