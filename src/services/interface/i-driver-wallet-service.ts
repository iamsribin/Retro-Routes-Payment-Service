

export interface IDriverWalletService{
    createDriverConnectAccount(email: string, driverId: string): Promise<{ accountId: string; accountLinkUrl: string }>
}