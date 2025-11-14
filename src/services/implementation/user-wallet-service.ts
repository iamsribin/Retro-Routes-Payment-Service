import { IUserWalletService } from '../interface/i-user-waller-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IWalletRepository } from '@/repositories/interfaces/i-wallet-repository';

@injectable()
export class UserWalletService implements IUserWalletService {
  constructor(@inject(TYPES.WalletRepository) private _walletRepository: IWalletRepository) {}

  createWalletForUser = async (data: {
    userId: string;
    email: string;
    createdAt: string;
  }): Promise<void> => {
    await this._walletRepository.createIfNotExists(data.userId);
    console.log('wallet created successfully');
  };

  getUserWalletBalanceAndTransactions = async (
    userId: string
  ): Promise<{ balance: string; transactions: number }> => {
    const response = await this._walletRepository.getUserWalletBalanceAndTransactions(
      userId,
      'INR'
    );
    return { balance: response.balance.toString(), transactions: response.transactions };
  };

  addRewardAmountToUserWallet(userId: string): Promise<void> {
    console.log('user id', userId);

    this._walletRepository.addRewardAmountToUserWallet(userId, 100);
    return Promise.resolve();
  }
}
