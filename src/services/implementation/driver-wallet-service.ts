import { stripe } from '@/config/stripe';
import { IDriverWalletService } from '../interface/i-driver-wallet-service';
import { injectable } from 'inversify';

@injectable()
export default class DriverWalletService implements IDriverWalletService {
  async createDriverConnectAccount(
    email: string,
    driverId: string
  ): Promise<{ accountId: string; accountLinkUrl: string }> {
    try {
      const account = stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',

        metadata: {
          driver_id: driverId,
        },
      });

      const account_id = (await account).id;

      const accountLink = await stripe.accountLinks.create({
        account: account_id,
        refresh_url: `${process.env.FRONTEND_URL}/onboard/refresh`,
        return_url: `${process.env.FRONTEND_URL}/onboard/complete`,
        type: 'account_onboarding',
      });

      return { accountId: account_id, accountLinkUrl: accountLink.url };
    } catch (error) {
      throw new Error('Stripe account creation failed');
    }
  }
}
