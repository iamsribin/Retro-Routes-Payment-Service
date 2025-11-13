export interface IUserWalletService {
  createWalletForUser(userId: string, currency?: string): Promise<void>;
  getUserWalletBalanceAndTransactions(userId: string): Promise<{ balance: string; transactions: number }>;
}
