import { DataSource } from 'typeorm';
import { Wallet } from '@/entity/wallet.entity';
import { WalletTransaction } from '@/entity/wallet-transaction.entity';
import { Client } from 'pg';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT),
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_WALLET_DB,
  synchronize: true, // false in production
  logging: false,
  entities: [Wallet, WalletTransaction],
});

export const connectSQL = async (): Promise<void> => {
  try {
    const client = new Client({
      host: process.env.SQL_HOST,
      port: Number(process.env.SQL_PORT),
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: 'postgres',
    });

    await client.connect();

    const dbName = process.env.SQL_WALLET_DB!;
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`🆕 Database '${dbName}' created`);
    } else {
      console.log(`📘 Database '${dbName}' already exists`);
    }

    await client.end();

    await AppDataSource.initialize();
    console.log('✅ SQL Database connected');
  } catch (error) {
    console.error('❌ Error connecting to SQL DB:', error);
  }
};
