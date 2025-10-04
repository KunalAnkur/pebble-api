const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI);

// --- Expense Schema ---
const expenseSchema = new mongoose.Schema({
  type: { type: String, enum: ["expense", "income"], required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  category: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);

// --- API Routes ---

// 1️⃣ Add Expense
app.post("/expenses", async (req, res) => {
  try {
    const payload = { 
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date()
    };
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json({ message: "Expense added", expense });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2️⃣ Get Expenses with filters
app.get("/expenses", async (req, res) => {
  try {
    const { type, category, startDate, endDate, minAmount, maxAmount } = req.query;

    let filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
