const MintsPlans = require("../../models/subscriptionPlan");
const PaidMintsBuyer = require("../../models/paidMintsBuyer");

exports.getRevenueDetails = async (req, res) => {
    try{
        const mintsPlans = await MintsPlans.find();
        // console.log("mintsPlans", mintsPlans);
        //Now I have to get the total transactions of each mints plan and generated revenue where status is success only these places sum of deducted amount 
        //I need loop through mints plan
        const revenueDetails = await Promise.all(mintsPlans.map(async (plan) => {
            const planId = plan._id;
            const planName = plan.Quantity;
            
            const transactions = await PaidMintsBuyer.find({quantity: plan.Quantity});

            // console.log("transactions", transactions);
            
            //whatever transactions found I need to where status is success condition
            const successfulTransactions = transactions.filter(transaction => transaction.status === "Success");
            // console.log("successfulTransactions", successfulTransactions);

            const totalDeductedAmount = successfulTransactions.reduce((acc, doc) => {
              const amount = parseFloat(doc.netAmountDeducted);
              return acc + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            return {
                planId,
                data: {
                    planName,
                    totalTransactions: transactions.length,
                    generatedRevenue: totalDeductedAmount
                }
            };
        }));

        // Add the response to send data back to client
        return res.status(200).json({
            success: true,
            data: revenueDetails
        });
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: err.message
        });
    }
}
       

//This API will return the revenue details of all mints paln with specific quantity
// under every specific quantity paln name of specific quantity, total transactions whether it is successful/pending/failed 
// and generated revenue which is summation of netDeductable amount