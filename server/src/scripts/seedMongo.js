import 'dotenv/config';
import { initialiseRepository, repositoryMode } from '../services/repository.js';

if (!process.env.MONGO_URI) {
  console.error('Set MONGO_URI before running the MongoDB seed command.');
  process.exit(1);
}
await initialiseRepository();
console.log(`Seed check complete using ${repositoryMode()} storage.`);
process.exit(0);
