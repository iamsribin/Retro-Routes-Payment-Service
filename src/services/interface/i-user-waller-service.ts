export interface IUserWalletService {
  createWalletForUser(userData: {
    userId: string;
    email: string;
    createdAt: string;
  }): Promise<void>;

  getUserWalletBalanceAndTransactions(
    userId: string
  ): Promise<{ balance: string; transactions: number }>;
}
