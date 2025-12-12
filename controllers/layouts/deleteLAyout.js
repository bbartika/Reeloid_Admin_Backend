const Layout = require("../../models/Layout");
const Movies = require("../../models/Movies");

exports.deleteLayout = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  try {
    // Remove the layout ID from all movies' layouts arrays
    await Movies.updateMany(
      { layouts: id },
      { $pull: { layouts: id } }
    );

    // Delete the layout document
    const deleteResponse = await Layout.findByIdAndDelete(id);

    if (!deleteResponse) {
      return res
        .status(400)
        .json({ msg: "could not deleted the layout ..try again " });
    }
    console.log(deleteResponse);
    return res.status(200).json({ msg: "layout deleted successfullly" });
  } catch (err) {
    return res.status(500).json({ msg: "something went wrong", err: err });
  }
};