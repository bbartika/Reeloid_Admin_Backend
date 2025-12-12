const Movies = require("../../models/Movies");
const Users = require("../../models/Users");

exports.getAllUsers = async (req, res, next) => {
  const { start, limit, searched } = req.query;
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

  // console.log(start, limit, searched);

  let filter = { ...matchCondition };
  try {
    if (searched && searched.trim() !== "") {
      filter = {
        $and: [
          matchCondition,
          {
            $or: [
              { name: { $regex: searched, $options: "i" } },
              { email: { $regex: searched, $options: "i" } },
            ],
          },
        ],
      };
    }
    const totalUsersCount = await Users.countDocuments(filter);

    const allUsers = await Users.find(filter)
      .select("name email")
      .skip(limit * start)
      .limit(limit);

    return res.status(200).json({
      allUsers,
      start,
      limit,
      totalData: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "something went wrong", err: err });
  }
};
