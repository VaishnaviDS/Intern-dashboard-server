import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  referralCode: { type: String, unique: true },
  donations: Number,
  rewards: [String],
  donationHistory: [
    {
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
});


export const User = mongoose.model('User', userSchema);
