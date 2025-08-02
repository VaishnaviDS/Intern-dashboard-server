import { User } from "../models/User.js";

const generateReferralCode = (name) => {
  const username = name.split(" ")[0].toLowerCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${username}${randomDigits}`;
};

const generateRewards = (donations) => {
  if (donations >= 10000) {
    return ["T-Shirt", "Certificate", "Gift Voucher"];
  } else if (donations >= 5000) {
    return ["Certificate", "Badge"];
  } else if (donations >= 1000) {
    return ["Appreciation Email"];
  } else {
    return ["No rewards"];
  }
};

export const userData = async (req, res) => {
  try {
    const { name, email, donations } = req.body;

    if ( !email || !donations) {
      return res.status(400).json({ message: "Please fill all details" });
    }

    const donationAmount = Number(donations);
    let user = await User.findOne({ email });

    if (user) {
      user.donations += donationAmount;
      user.rewards = generateRewards(user.donations);
      user.donationHistory.push({ amount: donationAmount, date: new Date() });

      await user.save();

      return res.status(200).json({
        message: "Donation updated successfully",
        name: user.name,
        referralCode: user.referralCode,
        totalDonations: user.donations,
        donationHistory: user.donationHistory,
        rewards: user.rewards,
      });
    } else {
      let referralCode;
      let isUnique = false;

      while (!isUnique) {
        referralCode = generateReferralCode(name);
        const existing = await User.findOne({ referralCode });
        if (!existing) isUnique = true;
      }

      const rewards = generateRewards(donationAmount);

      user = await User.create({
        name,
        email,
        referralCode,
        donations: donationAmount,
        rewards,
        donationHistory: [{ amount: donationAmount, date: new Date() }],
      });

      return res.status(201).json({
        message: "Donation record created successfully",
        name: user.name,
        referralCode: user.referralCode,
        totalDonations: user.donations,
        donationHistory: user.donationHistory,
        rewards: user.rewards,
      });
    }
  } catch (error) {
    console.error("Error processing donation:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const { referralCode } = req.params;

    const user = await User.findOne({ referralCode });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      name: user.name,
      referralCode: user.referralCode,
      email:user.email,
      totalDonations: user.donations,
      donationHistory: user.donationHistory,
      rewards: user.rewards,
    });
  } catch (error) {
    console.error("Error fetching donation history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const users = await User.find();

    const totalUsers = users.length;
    const totalDonations = users.reduce((sum, user) => sum + user.donations, 0);

    const rewardsDistributed = users.flatMap((user) => user.rewards);
    const rewardCount = rewardsDistributed.reduce((acc, reward) => {
      acc[reward] = (acc[reward] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      totalUsers,
      totalDonations,
      totalRewardsDistributed: rewardCount,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ donations: -1 }); // highest donations first

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      email: user.email,
      totalDonations: user.donations,
      rewards: user.rewards,
      referralCode: user.referralCode,
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAggregatedDonations = async (req, res) => {
  try {
    const { range } = req.params;
    const { month, year } = req.query;

    const groupBy = {
      days: { $dateToString: { format: "%Y-%m-%d", date: "$donationHistory.date" } },
      months: { $dateToString: { format: "%Y-%m", date: "$donationHistory.date" } },
      years: { $dateToString: { format: "%Y", date: "$donationHistory.date" } },
    };

    if (!["days", "months", "years"].includes(range)) {
      return res.status(400).json({ message: "Invalid range. Use days, months, or years." });
    }

    const matchStage = {};

    const y = parseInt(year);

    if (range === "days" && year && month) {
      const m = parseInt(month) - 1;
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 1));
      matchStage["donationHistory.date"] = { $gte: start, $lt: end };
    }

if (range === "months" && y !== null) {
  const start = new Date(Date.UTC(y, 0, 1));
  const end = new Date(Date.UTC(y + 1, 0, 1));
  matchStage["donationHistory.date"] = { $gte: start, $lt: end };
}

    const pipeline = [
      { $unwind: "$donationHistory" },
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: groupBy[range],
          totalDonations: { $sum: "$donationHistory.amount" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const result = await User.aggregate(pipeline);

    const formatted = result.map((item) => ({
      label: item._id,
      totalDonations: item.totalDonations,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error aggregating donations:", error);
    res.status(500).json({ message: "Server error" });
  }
};
