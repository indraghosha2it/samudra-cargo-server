const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, unique: true, index: true },

    origin:      { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    freightType: { type: String, required: true, trim: true },
    weight:      { type: String, required: true, trim: true },
    dimensions:  { type: String, default: '', trim: true },

    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, lowercase: true, trim: true, index: true },
    phone:   { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    address: { type: String, required: true, trim: true },
    instructions: { type: String, default: '' },

    agreeToTerms: { type: Boolean, required: true, default: false },

    // Admin workflow fields
    status: {
      type: String,
      enum: ['new', 'reviewed', 'quoted', 'converted', 'closed'],
      default: 'new',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    quotedAmount: { type: Number, default: null },
    quotedCurrency: { type: String, default: 'USD' },

    // Meta
    source: { type: String, default: 'website-quote-form' },
    ipAddress: String,
    userAgent: String,
    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

// Auto-generate quote number: QR-YYMM-00001
quoteRequestSchema.pre('save', async function (next) {
  if (this.quoteNumber) return next();
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `QR-${yy}${mm}`;
  const count = await mongoose.model('QuoteRequest').countDocuments({
    quoteNumber: new RegExp(`^${prefix}`),
  });
  this.quoteNumber = `${prefix}-${(count + 1).toString().padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('QuoteRequest', quoteRequestSchema);