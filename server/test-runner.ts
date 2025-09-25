import { 
    generateCreditNotesForMissedClasses, 
    generateMonthlyInvoices
} from './services/invoicing.js';

async function runTestLifecycle() {
    console.log('--- [STARTING TEST LIFECYCLE] ---');
    
    console.log('\n--- STEP 1: GENERATING CREDIT NOTES ---');
    await generateCreditNotesForMissedClasses();
    
    console.log('\n--- STEP 2: GENERATING INVOICES ---');
    await generateMonthlyInvoices(); 
    
    console.log('\n--- [TEST LIFECYCLE COMPLETE] ---');
}

runTestLifecycle();