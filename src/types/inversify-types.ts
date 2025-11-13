
export const TYPES = {
  PaymentController: Symbol.for('PaymentController'),
  GrpcPaymentController:Symbol.for("GrpcPaymentController"),

  PaymentService: Symbol.for('PaymentService'),
  DriverWalletService: Symbol.for('DriverWalletService'),
  StripeService: Symbol.for('StripeService'),
  UserWalletService: Symbol.for('UserWalletService'),

  WalletRepository: Symbol.for('WalletRepository'),
}