const CustomAds = require("../../models/CustomAds");

exports.getAllCustomAds = async (req, res) => {
  try {
    const {
      searched = "",
      page = 1,
      limit = 10,
      visible
    } = req.query;

    const matchCondition = {};

    // Optional filter by visibility
    if (visible !== undefined) {
      matchCondition.visible = visible === "true";
    }

    // Build search filter
    let filter = { ...matchCondition };

    if (searched.trim() !== "") {
      filter = {
        $and: [
          matchCondition,
          {
            $or: [
              { name: { $regex: searched, $options: "i" } },
              { type: { $regex: searched, $options: "i" } }
              // Add other searchable fields if needed
            ]
          }
        ]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    // Query data and count
    const [ads, total] = await Promise.all([
      CustomAds.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),

      CustomAds.countDocuments(filter)
    ]);

    // Normalize fields like trailerUrlFileId / adsUrlFileId
    const AdsList = ads.map(ad => ({
      _id: ad._id,
      name: ad.name,
      type: ad.type,
      visible: ad.visible,
      adsUrlFileId: ad.customUrlFileId  || null,
      customUrl: ad.customUrl,
      createdBy: ad.createdBy,
      createdAt: ad.createdAt
    }));

    return res.status(200).json({
      AdsList,
      start: skip,
      limit: pageLimit,
      totalData: total,
      totalPages: Math.ceil(total / pageLimit)
    });

  } catch (error) {
    console.error("Error fetching custom ads:", error);
    return res.status(500).json({
      msg: "Something went wrong while retrieving custom ads",
      err: error.message || error
    });
  }
};