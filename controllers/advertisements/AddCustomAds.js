const CustomAds = require("../../models/CustomAds");
const uploadCustomVideoToTencent = require("./../videoUploader");
const fs = require("fs");


exports.addCustomAds = async (req, res) => {
  console.log(req.body);


  // return;
  const { name, ad_type,  visible } =req.body;
  if (!name) {
    return res
      .status(400)
      .json({ msg: "name field should contains some value" });
  }
  if (!ad_type) {
    return res
      .status(400)
      .json({ msg: "Ads type field should contains some value" });
  }
    if (!visible) {
    return res
      .status(400)
      .json({ msg: "visible field should contains some value" });
    }


    if (!req?.files?.custom_file) {
    return res
      .status(400)
      .json({ msg: "please provide custom url or custom video" });
  }


  // console.log(!contentData)
 
  try {




    let customUrlTencent = undefined;
    if (req.files?.custom_file && req.files.custom_file.length > 0) {
      let customAdsPath = req?.files?.custom_file[0]?.path || "";
      let customAdsBuffer = fs.readFileSync(customAdsPath) || "";
      //we need to handle if admin uses direct upload link then it will convert the file and save it to tencent so that we could maintaining same settings like video
      customUrlTencent = await uploadCustomVideoToTencent(customAdsBuffer );


      fs.unlink(customAdsPath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("custom video deleted successfully");
        }
      });
    }
    const customAdsResponse = await CustomAds.create({
      name: name,
      type: "customAds",
      ad_type: ad_type,
     
      visible: visible,


      customUrl: customUrlTencent?.multipleQualityUrls[0]?.Url,
      customUrlFileId: customUrlTencent?.fileId,
     
    });
    customAdsResponse.save();
    return res.status(200).json({ msg: "added ads successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "something went wrong", err: error });
  }
}; 