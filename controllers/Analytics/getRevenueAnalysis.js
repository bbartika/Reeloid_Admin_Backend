const PaidMintsBuyer = require("../../models/paidMintsBuyer");

exports.getRevenueAnalysis = async (req, res) => {
  const { quantity } = req.query;
  const { type } = req.params;
  let matchCondition = {};

  const now = new Date();
  if (type === "Month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (type === "Year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfYear, $lte: endOfYear };
  } else if (type === "HalfYear") {
    // Last 6 months from today
    const startOfHalfYear = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endOfHalfYear = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    matchCondition.createdAt = { $gte: startOfHalfYear, $lte: endOfHalfYear };
  } else if (type === "Week") {
    // Last 7 days including today
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now);
    endOfWeek.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
  } else if (type === "Day") {
    // Today only
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    matchCondition.createdAt = { $gte: startOfDay, $lte: endOfDay };
  } else if (type !== "All") {
    return res.status(400).json({ message: "Invalid type parameter" });
  }

  try {
    // Compose filter object (use correct quantity data type if needed)
    const filter = { quantity: Number(quantity) }; // or String(quantity) if stored as string
    Object.assign(filter, matchCondition);

    // Do all counts in DB (efficient!)
    const [
      successfulTransactionCount,
      failedTransactionCount,
      pendingTransactionCount,
      // For revenue, uncomment below if you have 'deductedAmount' field:
      // totalRevenueAgg
    ] = await Promise.all([
      PaidMintsBuyer.countDocuments({ ...filter, status: "Success" }),
      PaidMintsBuyer.countDocuments({ ...filter, status: "Failed" }),
      PaidMintsBuyer.countDocuments({ ...filter, status: "Pending" }),
      // PaidMintsBuyer.aggregate([
      //   { $match: { ...filter, status: "Success" } },
      //   { $group: { _id: null, total: { $sum: "$deductedAmount" } } }
      // ])
    ]);

    // const totalRevenue = totalRevenueAgg[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: [
        { name: "Successful Transactions", value: successfulTransactionCount },
        { name: "Failed Transactions", value: failedTransactionCount },
        { name: "Pending Transactions", value: pendingTransactionCount },
        // { name: "Total Revenue", value: totalRevenue } // Uncomment if needed
      ],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

//This API is used to get the revenue analysis of a specific quantity of mints plan such as quantity=10
//how many successful failed and pendiong transactions are there
