const mongoose = require('mongoose');

const PaidMintsBuyerSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  txnid: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, required: true },
  Deductable_Amount: { type: String },
  bank_ref_num: { type: String },
  error_message: { type: String },
  mihpayid: { type: String },
  netAmountDeducted: { type: String },
  paymentAggregator: { type: String },
  paymentGateway: { type: String },
  paymentMode: { type: String },
  paymentSource: { type: String }
}, { timestamps: true });

const paidMintsBuyer = mongoose.model('paidMintsBuyer', PaidMintsBuyerSchema, 'paidMintsBuyer');

module.exports = paidMintsBuyer;
