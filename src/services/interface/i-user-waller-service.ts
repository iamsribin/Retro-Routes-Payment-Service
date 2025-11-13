export interface IUserWalletService {
  createWalletForUser(userId: string, currency?: string): Promise<void>;
}
