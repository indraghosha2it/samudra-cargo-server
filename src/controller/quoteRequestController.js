// const QuoteRequest = require('../models/quoteRequestModel');

// // ---------------------------------------------------------
// // POST /api/v1/request-quote  (public)
// // ---------------------------------------------------------
// exports.createQuoteRequest = async (req, res) => {
//   try {
//     const {
//       origin, destination, freightType, weight, dimensions,
//       name, email, phone, company, address, instructions, agreeToTerms,
//     } = req.body;

//     // Basic validation (defence in depth — frontend already validates)
//     const missing = [];
//     if (!origin)      missing.push('origin');
//     if (!destination) missing.push('destination');
//     if (!freightType) missing.push('freightType');
//     if (!weight)      missing.push('weight');
//     if (!name)        missing.push('name');
//     if (!email)       missing.push('email');
//     if (!phone)       missing.push('phone');
//     if (!address)     missing.push('address');
//     if (!agreeToTerms) missing.push('agreeToTerms');

//     if (missing.length) {
//       return res.status(400).json({
//         success: false,
//         message: `Missing required fields: ${missing.join(', ')}`,
//       });
//     }

//     const quote = await QuoteRequest.create({
//       origin, destination, freightType, weight,
//       dimensions: dimensions || '',
//       name, email, phone,
//       company: company || '',
//       address,
//       instructions: instructions || '',
//       agreeToTerms: true,
//       ipAddress: req.ip,
//       userAgent: req.headers['user-agent'] || '',
//     });

//     // ---- Fire email in background so the response is fast ----
//     // If you already have a sendEmail util, call it here.
//     try {
//       const { sendEmail } = require('../utils/emailService'); // adjust path if needed
//       const result = await sendEmail({
//         to: process.env.SMTP_USER,                // admin/sales inbox
//         replyTo: email,
//         subject: `New Quote Request ${quote.quoteNumber} – ${origin} → ${destination}`,
//         template: 'quote-request',                // your existing template name
//         data: quote.toObject(),
//       });
//       if (result?.success) {
//         quote.emailSent = true;
//       } else {
//         quote.emailError = result?.error || 'Email failed';
//       }
//       await quote.save();
//     } catch (emailErr) {
//       console.error('Quote email error:', emailErr.message);
//       quote.emailError = emailErr.message;
//       await quote.save().catch(() => {});
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Quote request submitted successfully',
//       quoteId: quote.quoteNumber,
//       id: quote._id,
//       data: quote,
//     });
//   } catch (error) {
//     console.error('createQuoteRequest error:', error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------------------------------------
// // GET /api/v1/quotes  (admin) – list + filter + paginate
// // ---------------------------------------------------------
// exports.getAllQuoteRequests = async (req, res) => {
//   try {
//     const {
//       status, search, page = 1, limit = 20, sort = '-createdAt',
//     } = req.query;

//     const query = {};
//     if (status) query.status = status;

//     if (search && search.trim()) {
//       const re = new RegExp(search.trim(), 'i');
//       query.$or = [
//         { quoteNumber: re },
//         { name: re }, { email: re }, { phone: re }, { company: re },
//         { origin: re }, { destination: re }, { freightType: re },
//       ];
//     }

//     const pageNum  = Math.max(1, parseInt(page, 10) || 1);
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

//     const [data, total] = await Promise.all([
//       QuoteRequest.find(query).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
//       QuoteRequest.countDocuments(query),
//     ]);

//     return res.json({
//       success: true,
//       data,
//       pagination: {
//         total, page: pageNum,
//         pages: Math.max(1, Math.ceil(total / limitNum)),
//         limit: limitNum,
//       },
//     });
//   } catch (error) {
//     console.error('getAllQuoteRequests error:', error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------------------------------------
// // GET /api/v1/quotes/:id  (admin)
// // ---------------------------------------------------------
// exports.getQuoteRequestById = async (req, res) => {
//   try {
//     const quote = await QuoteRequest.findById(req.params.id);
//     if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
//     return res.json({ success: true, data: quote });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------------------------------------
// // PUT /api/v1/quotes/:id  (admin) – update status / notes / quotedAmount
// // ---------------------------------------------------------
// exports.updateQuoteRequest = async (req, res) => {
//   try {
//     const allowed = ['status', 'adminNotes', 'quotedAmount', 'quotedCurrency'];
//     const patch = {};
//     for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

//     const quote = await QuoteRequest.findByIdAndUpdate(
//       req.params.id, { $set: patch }, { new: true, runValidators: true }
//     );
//     if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
//     return res.json({ success: true, message: 'Quote updated', data: quote });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------------------------------------
// // DELETE /api/v1/quotes/:id  (admin)
// // ---------------------------------------------------------
// exports.deleteQuoteRequest = async (req, res) => {
//   try {
//     const quote = await QuoteRequest.findByIdAndDelete(req.params.id);
//     if (!quote) return res.status(404).json({ success: false, message: 'Quote not found' });
//     return res.json({ success: true, message: 'Quote deleted' });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ---------------------------------------------------------
// // GET /api/v1/quotes/stats/summary  (admin) – optional dashboard
// // ---------------------------------------------------------
// exports.getQuoteStats = async (req, res) => {
//   try {
//     const counts = await QuoteRequest.aggregate([
//       { $group: { _id: '$status', count: { $sum: 1 } } },
//     ]);
//     const stats = { new: 0, reviewed: 0, quoted: 0, converted: 0, closed: 0, total: 0 };
//     counts.forEach(({ _id, count }) => {
//       if (stats[_id] !== undefined) stats[_id] = count;
//       stats.total += count;
//     });
//     return res.json({ success: true, data: stats });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


// Samudera Cargo-Logistic_Server/src/controller/quoteRequestController.js

const QuoteRequest = require('../models/quoteRequestModel');
const { sendQuoteEmails } = require('../service/quoteTamplate');

// ---------------------------------------------------------
// POST /api/v1/request-quote  (public)
// Saves the lead to MongoDB and sends admin + customer emails.
// ---------------------------------------------------------
exports.createQuoteRequest = async (req, res) => {
  try {
    console.log('\n=== 📨 NEW QUOTE REQUEST RECEIVED (DB + EMAIL) ===');
    console.log('Time:', new Date().toLocaleString());

    const {
      origin, destination, freightType, weight, dimensions,
      name, email, phone, company, address, instructions, agreeToTerms,
    } = req.body;

    // -------- Validation (mirrors frontend checks) --------
    const missing = [];
    if (!origin)        missing.push('origin');
    if (!destination)   missing.push('destination');
    if (!freightType)   missing.push('freightType');
    if (!weight)        missing.push('weight');
    if (!name)          missing.push('name');
    if (!email)         missing.push('email');
    if (!phone)         missing.push('phone');
    if (!address)       missing.push('address');
    if (!agreeToTerms)  missing.push('agreeToTerms');

    if (missing.length) {
      console.log('❌ Validation failed. Missing:', missing.join(', '));
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // -------- 1) Save to DB first (so the lead is never lost) --------
    const quote = await QuoteRequest.create({
      origin,
      destination,
      freightType,
      weight,
      dimensions: dimensions || '',
      name,
      email,
      phone,
      company: company || '',
      address,
      instructions: instructions || '',
      agreeToTerms: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    console.log('✅ Saved to DB:', {
      id: quote._id.toString(),
      quoteNumber: quote.quoteNumber,
    });

    // -------- 2) Send emails using the existing styled templates --------
    try {
      await sendQuoteEmails(quote.toObject(), quote.quoteNumber);
      quote.emailSent = true;
      console.log('✅ Admin + customer emails sent for', quote.quoteNumber);
    } catch (emailErr) {
      console.error('❌ Quote email error:', emailErr.message);
      quote.emailError = emailErr.message;
    }
    await quote.save();

    // -------- 3) Respond to the client --------
    return res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      quoteId: quote.quoteNumber, // frontend toast reads this
      id: quote._id,
      data: quote,
    });
  } catch (error) {
    console.error('❌ createQuoteRequest error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong while saving your quote request',
    });
  }
};

// ---------------------------------------------------------
// GET /api/v1/quotes  (admin) – list + filter + paginate
// ---------------------------------------------------------
exports.getAllQuoteRequests = async (req, res) => {
  try {
    const {
      status, search, page = 1, limit = 20, sort = '-createdAt',
    } = req.query;

    const query = {};
    if (status) query.status = status;

    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      query.$or = [
        { quoteNumber: re },
        { name: re }, { email: re }, { phone: re }, { company: re },
        { origin: re }, { destination: re }, { freightType: re },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const [data, total] = await Promise.all([
      QuoteRequest.find(query).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum),
      QuoteRequest.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        pages: Math.max(1, Math.ceil(total / limitNum)),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('getAllQuoteRequests error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /api/v1/quotes/:id  (admin)
// ---------------------------------------------------------
exports.getQuoteRequestById = async (req, res) => {
  try {
    const quote = await QuoteRequest.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    return res.json({ success: true, data: quote });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// PUT /api/v1/quotes/:id  (admin) – update status / notes / quotedAmount
// ---------------------------------------------------------
exports.updateQuoteRequest = async (req, res) => {
  try {
    const allowed = ['status', 'adminNotes', 'quotedAmount', 'quotedCurrency'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    const quote = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    return res.json({ success: true, message: 'Quote updated', data: quote });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// DELETE /api/v1/quotes/:id  (admin)
// ---------------------------------------------------------
exports.deleteQuoteRequest = async (req, res) => {
  try {
    const quote = await QuoteRequest.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    return res.json({ success: true, message: 'Quote deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------
// GET /api/v1/quotes/stats/summary  (admin) – dashboard counts
// ---------------------------------------------------------
exports.getQuoteStats = async (req, res) => {
  try {
    const counts = await QuoteRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { new: 0, reviewed: 0, quoted: 0, converted: 0, closed: 0, total: 0 };
    counts.forEach(({ _id, count }) => {
      if (stats[_id] !== undefined) stats[_id] = count;
      stats.total += count;
    });

    return res.json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};