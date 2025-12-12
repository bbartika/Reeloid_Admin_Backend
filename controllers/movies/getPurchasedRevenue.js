// const PaidMintsBuyer = require("../../models/paidMintsBuyer");

// exports.getPurchasedRevenue = async (req, res) => {
//     try {
//         const result = await PaidMintsBuyer.find({ status: "Success" });

//         // Calculate total deducted amount
//         const totalDeductedAmount = result.reduce((acc, doc) => {
//             const amount = parseFloat(doc.Deductable_Amount);
//             return acc + (isNaN(amount) ? 0 : amount);
//         }, 0);

//         // Group by quantity and calculate revenue
//         const revenueByQuantity = result.reduce((acc, doc) => {
//             const quantity = doc.quantity;
//             const amount = parseFloat(doc.Deductable_Amount);
//             if (!isNaN(amount)) {
//                 acc.push({
//                     quantity: quantity,
//                     "Total Revenue": amount
//                 });
//             }
//             return acc;
//         }, []);

//         // Format the response structure
//         const response = {

//                 total_revenue: totalDeductedAmount,
//                 ...revenueByQuantity.reduce((acc, item) => {
//                     acc[`quantity_${item.quantity}`] = {

//                         "Total Revenue": item["Total Revenue"]
//                     };
//                     return acc;
//                 }, {})

//         };

//         return res.status(200).json({
//             success: true,
//             data: response
//         });

//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({
//             success: false,
//             message: "Something went wrong",
//             error: err.message
//         });
//     }
// };
const PaidMintsBuyer = require("../../models/paidMintsBuyer");

exports.getPurchasedRevenue = async (req, res) => {
  const { type } = req.params;
  let matchCondition = { status: "Success" };

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
    const result = await PaidMintsBuyer.find(matchCondition);

    // Calculate total deducted amount
    const totalDeductedAmount = result.reduce((acc, doc) => {
      const amount = parseFloat(doc.netAmountDeducted);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    // Group by quantity and sum revenue
    const quantityMap = new Map();
    result.forEach((doc) => {
      const amount = parseFloat(doc.netAmountDeducted);
      if (!isNaN(amount)) {
        const quantity = doc.quantity;
        if (quantityMap.has(quantity)) {
          quantityMap.set(quantity, quantityMap.get(quantity) + amount);
        } else {
          quantityMap.set(quantity, amount);
        }
      }
    });

    // Convert map to array and format
    const quantityRevenue = Array.from(quantityMap, ([quantity, total]) => ({
      name: quantity,
      value: total,
    }));

    // Sort by quantity
    quantityRevenue.sort((a, b) => a.quantity - b.quantity);

    // Format the response structure
    const response = {
      "Total Revenue": totalDeductedAmount,
      data: quantityRevenue,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

//This api is used to calculate total revenue of stataus success under specific mints quantity
