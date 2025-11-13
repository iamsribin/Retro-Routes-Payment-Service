import { WalletRepository } from "@/repositories/implementation/wallet.repository";
import { IUserWalletService } from "../interface/i-user-waller-service";


export class UserWalletService implements IUserWalletService{
    constructor(private _walletRepository:WalletRepository){}

    async createWalletForUser(userId:string,currency:string='INR'){
        await this._walletRepository.createIfNotExists(userId, currency);
    }
}