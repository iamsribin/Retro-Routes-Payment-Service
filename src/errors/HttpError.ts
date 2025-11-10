// export class HttpError extends Error {
//   public status: number;
//   public code?: string;
//   public safe?: boolean;

//   constructor(status: number, message: string, opts: any = {}) {
//     super(message);
//     this.status = status;
//     this.code = opts.code;
//     this.safe = opts.safe ?? true;
//     Object.setPrototypeOf(this, new.target.prototype);
//   }
// }
