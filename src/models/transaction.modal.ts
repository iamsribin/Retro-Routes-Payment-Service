import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  _id: mongoose.ObjectId;
  transactionId: string;
  bookingId: string;
  userId: string;
  driverId: string;
  amount: number;
  paymentMethod: 'stripe' | 'wallet' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  adminShare: number;
  driverShare: number;
  stripeSessionId?: string;
  failureReason?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    bookingId: { type: String, required: true },
    userId: { type: String, required: true },
    driverId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'wallet', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      required: true,
    },
    adminShare: { type: Number, required: true },
    driverShare: { type: Number, required: true },
    stripeSessionId: { type: String },
    failureReason: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);

// The Guy Who Froze at One English Sentence… Now Teaches DSA

// There was a guy who couldn’t even write a proper English sentence.
// No big goals. No direction. Just vibes.
// But now, he’s teaching DSA.

// After 10th grade, he joined a private college.
// Why private? Because no government college wanted a student with zero A+.

// He tried to take Commerce, but froze when the teacher asked to write one English sentence. Just one.

// The teacher smiled, “Take Humanities.”
// But our hero said, “No sir, Commerce.”
// Not because he loved accounts, just because his friends were there.
// Comfort zone > interest.

// Somehow, he completed +2 and joined BCom.
// Plot twist: everything was in English.
// Panic mode on.
// He quietly switched to BA History (Malayalam).
// Comfort zone wins again.

// Then one random YouTube video changed everything.
// Nikhil Kilivayil from Brototype said anyone can become a software developer with basic maths and English.

// He started learning to code through YouTube.
// And surprisingly, he loved it — debugging, solving problems, building things.

// Plot twist part two: basic English wasn’t enough.
// So he learned English the same way he learned coding, through YouTube.
// Maybe all that debugging fixed his brain too.
// Because suddenly, things started making sense.
// And for once, he didn’t run away.

// Joined Brototype.
// Started helping others.
// The same guy who once couldn’t write a single English sentence
// was now teaching DSA to his friends over Google Meet.

// He found confidence, won a public speaking prize from Joel Kuruvachira sir,
// and realised how far he’d come.

// Still running… 🎥

// Elna Seara Rajeev — thanks for pushing me to post.

// #Brototype #BrototypeRemote #BCR57 #CareerGrowth #LifeLessons #DSA
