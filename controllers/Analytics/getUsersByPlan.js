const Users = require("../../models/Users");
const MintsPlans = require("../../models/subscriptionPlan");
const PaidMintsBuyer = require("../../models/paidMintsBuyer");

exports.getUsersByPlan = async (req, res) => {
    // Extract time filter param
    const { type } = req.params;
    let matchCondition = {};

    // Build time window as previous pattern
    const now = new Date();
    if (type === "Month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23, 59, 59, 999
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
            23, 59, 59, 999
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
        // Get all plans
        const mintsPlans = await MintsPlans.find();
        const planQuantities = mintsPlans.map(plan => plan.Quantity);

        // Aggregate user counts per plan per status:
        const agg = await PaidMintsBuyer.aggregate([
            { $match: { quantity: { $in: planQuantities }, ...matchCondition } },
            {
                $group: {
                    _id: { quantity: "$quantity", status: "$status" },
                    users: { $addToSet: "$userId" }
                }
            },
            {
                $project: {
                    quantity: "$_id.quantity",
                    status: "$_id.status",
                    userCount: { $size: "$users" }
                }
            }
        ]);

        // Reshape aggregation for easy lookup
        const resultMap = {};
        agg.forEach(item => {
            if (!resultMap[item.quantity]) resultMap[item.quantity] = {};
            resultMap[item.quantity][item.status] = item.userCount;
        });

        // Prepare full response: for each plan, show user count by status
        const results = mintsPlans.map(plan => ({
            planId: plan._id,
            planName: plan.Quantity,
            data: [
                { status: "Success", userCount: resultMap[plan.Quantity]?.Success || 0 },
                { status: "Pending", userCount: resultMap[plan.Quantity]?.Pending || 0 },
                { status: "Failed", userCount: resultMap[plan.Quantity]?.Failed || 0 }
            ]
        }));

        // Get total users count (all users, not just who bought mints)
        const totalUsers = await Users.countDocuments();

        return res.status(200).json({
            success: true,
            totalUsers,
            results
        });

    } catch (error) {
        console.error('Error in getUsersByPlan:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user subscription data",
            error: error.message
        });
    }
};
