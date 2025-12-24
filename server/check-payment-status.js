/**
 * Script to check and verify Chapa payment status
 * Usage: node check-payment-status.js <tx_ref>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Payment = require('./models/Payment');
const Company = require('./models/Company');

const txRef = process.argv[2];

if (!txRef) {
  console.error('❌ Please provide a transaction reference (tx_ref)');
  console.log('Usage: node check-payment-status.js <tx_ref>');
  process.exit(1);
}

async function checkPaymentStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI , {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find payment
    const payment = await Payment.findOne({ chapaTxRef: txRef });
    if (!payment) {
      console.error('❌ Payment not found for tx_ref:', txRef);
      process.exit(1);
    }

    console.log('\n📊 Payment Details:');
    console.log('  ID:', payment._id);
    console.log('  Company ID:', payment.companyId);
    console.log('  Amount:', payment.amount);
    console.log('  Status:', payment.status);
    console.log('  Created:', payment.createdAt);

    // Verify with Chapa
    const CHAPA_TOKEN = process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY;
    const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';

    if (!CHAPA_TOKEN) {
      console.error('❌ CHAPA_TOKEN not found in environment variables');
      process.exit(1);
    }

    console.log('\n🔍 Verifying with Chapa...');
    const verifyUrl = `${CHAPA_API}/transaction/verify/${txRef}`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_TOKEN}`
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('\n📡 Chapa Response:');
    console.log(JSON.stringify(verifyData, null, 2));

    const apiStatus = verifyData.status?.toLowerCase();
    const transactionStatus = verifyData.data?.status?.toLowerCase();
    
    console.log('\n🔍 Status Analysis:');
    console.log('  API Status:', apiStatus);
    console.log('  Transaction Status:', transactionStatus);
    console.log('  Amount:', verifyData.data?.amount);

    const isSuccessful = 
      apiStatus === 'success' && 
      transactionStatus === 'successful' &&
      verifyData.data?.amount > 0;

    if (isSuccessful) {
      console.log('\n✅ Payment is SUCCESSFUL according to Chapa');
      
      if (payment.status !== 'approved') {
        console.log('\n🔄 Updating payment status to approved...');
        payment.status = 'approved';
        payment.verifiedAt = new Date();
        payment.paymentDate = new Date(verifyData.data?.created_at || Date.now());
        await payment.save();
        console.log('✅ Payment updated to approved');

        // Update company
        const company = await Company.findOne({ companyId: payment.companyId });
        if (company) {
          console.log('\n🔄 Updating company payment status...');
          const now = new Date();
          company.hasPaid = true;
          company.lastPaymentDate = now;
          company.status = 'active';
          
          let monthsToAdd = payment.period?.months?.length || 1;
          if (monthsToAdd > 0) {
            // Calculate base date
            let baseDate = now;
            if (company.paymentPeriodEnd && new Date(company.paymentPeriodEnd) > now) {
              baseDate = new Date(company.paymentPeriodEnd);
            } else if (company.gracePeriodDeadline && new Date(company.gracePeriodDeadline) > now) {
              baseDate = new Date(company.gracePeriodDeadline);
            } else if (company.paymentDeadline && new Date(company.paymentDeadline) > now) {
              baseDate = new Date(company.paymentDeadline);
            }
            
            company.paymentPeriodEnd = new Date(baseDate);
            company.paymentPeriodEnd.setMonth(company.paymentPeriodEnd.getMonth() + monthsToAdd);
            company.paymentDeadline = new Date(company.paymentPeriodEnd);
            company.gracePeriodDeadline = null;
          }
          
          await company.save();
          console.log('✅ Company updated');
          console.log('  paymentPeriodEnd:', company.paymentPeriodEnd);
          console.log('  hasPaid:', company.hasPaid);
        }
      } else {
        console.log('\n✅ Payment is already approved');
      }
    } else {
      console.log('\n❌ Payment is NOT successful according to Chapa');
      console.log('  Current payment status:', payment.status);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPaymentStatus();


