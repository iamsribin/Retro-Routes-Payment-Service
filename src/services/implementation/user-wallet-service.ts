import { WalletRepository } from '@/repositories/implementation/wallet.repository';
import { IUserWalletService } from '../interface/i-user-waller-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';

@injectable()
export class UserWalletService implements IUserWalletService {
  constructor(@inject(TYPES.WalletRepository) private _walletRepository: WalletRepository) {}

  async createWalletForUser(userId: string, currency: string = 'INR') {
    try {
      await this._walletRepository.createIfNotExists(userId, currency);
      console.log('sucess');
    } catch (error) {
      console.log('errr', error);
    }
  }
}
