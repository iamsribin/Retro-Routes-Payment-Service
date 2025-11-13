import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { BigIntTransformer } from '../utils/bigint.transformer';

@Entity({ name: 'wallets' })
@Index(['userId', 'currency'], { unique: true })
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text', default: 'INR' })
  currency!: string;

  @Column({ type: 'bigint', default: '0', transformer: BigIntTransformer })
  balance!: bigint;

  @Column({ type: 'bigint', default: '0', transformer: BigIntTransformer })
  reserved!: bigint;

  @Column({ type: 'text', default: 'active' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
