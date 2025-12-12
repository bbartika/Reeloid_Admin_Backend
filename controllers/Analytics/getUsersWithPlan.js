const Users = require("../../models/Users");
const PaidMintsBuyer = require("../../models/paidMintsBuyer");



exports.getUsersWithPlan = async (req, res) => {
    try {
        const { quantity } = req.body;
        // console.log("Received quantity:", quantity);

        // 1. Get all transactions with the specified quantity
        const transactions = await PaidMintsBuyer.find({ quantity })
            .select('userId amount txnid paymentMode status date')
            .sort({ date: -1 });
        // console.log("Transactions found:", transactions);

        // 2. Get unique userIds from transactions
        const userIds = [...new Set(transactions.map(t => t.userId))];

        // 3. Get user details for these userIds
        const users = await Users.find({ _id: { $in: userIds } })
            .select('name _id');

        // 4. Create a map of userId to userName for quick lookup
        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user.name;
            return acc;
        }, {});

        // 5. Group transactions by userId
        const userTransactions = {};
        transactions.forEach(transaction => {
            if (userMap[transaction.userId]) {
                if (!userTransactions[transaction.userId]) {
                    userTransactions[transaction.userId] = {
                        userId: transaction.userId,
                        userName: userMap[transaction.userId],
                        transactions: []
                    };
                }
                userTransactions[transaction.userId].transactions.push({
                    amount: transaction.amount,
                    transactionId: transaction.txnid,
                    paymentMode: transaction.paymentMode || "",
                    status: transaction.status,         
                });
            }
        });

        // 6. Convert the grouped data to array format
        const formattedData = Object.values(userTransactions);

        return res.status(200).json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error in getUsersWithPlan:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user plans',
            error: error.message
        });
    }
};

//This API is used in this case: under every specific quantity's plan, we will get all users who have tried to buy this plan
//and their transaction details in the array of objects 
//so their name,id 
// and their transaction details under this quantity will be returned as array of objects