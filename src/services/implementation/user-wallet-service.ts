import { WalletRepository } from '@/repositories/implementation/wallet.repository';
import { IUserWalletService } from '../interface/i-user-waller-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';

@injectable()
export class UserWalletService implements IUserWalletService {
  constructor(@inject(TYPES.WalletRepository) private _walletRepository: WalletRepository) {}

   createWalletForUser= async(userId: string, currency: string = 'INR'):Promise<void> =>{
    try {
      await this._walletRepository.createIfNotExists(userId, currency);
      console.log('wallet created successfully');
    } catch (error) {
      throw error;
    }
  }

  getUserWalletBalanceAndTransactions = async(userId: string): Promise<{ balance: string; transactions: number }> =>{
      try {
         const response = await this._walletRepository.getUserWalletBalanceAndTransactions(userId, 'INR');
         return { balance: response.balance.toString(), transactions: response.transactions };
      } catch (error) {
        throw error;
      }
  }
}
