
export const TYPES = {
  PaymentController: Symbol.for('PaymentController'),
  PaymentService: Symbol.for('PaymentService'),
  GrpcPaymentController:Symbol.for("GrpcPaymentController"),
  GrpcPaymentService:Symbol.for("GrpcPaymentService"),

  WalletService: Symbol.for('WalletService'),
  WalletController: Symbol.for('WalletController'),
  WalletRepository: Symbol.for('WalletRepository'),
  PaymentRepository: Symbol.for('PaymentRepository')
}