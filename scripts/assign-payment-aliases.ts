import 'dotenv/config';
import { assignMissingPaymentAliases } from '../lib/payment-alias';

async function main() {
  console.log('🔄 Assigning payment aliases to users without one...\n');
  
  const count = await assignMissingPaymentAliases();
  
  console.log(`\n✅ Assigned ${count} payment aliases successfully!`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
