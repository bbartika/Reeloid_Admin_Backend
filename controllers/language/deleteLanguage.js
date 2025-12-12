const Language = require("../../models/language");
const Users = require("../../models/Users");
const Movies = require("../../models/Movies");

exports.deleteLanguage = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  try {
    

    // Remove the language ID from all users' selectedLanguages arrays
    await Users.updateMany( 
      { selectedLanguages: id.toString() },
      { $pull: { selectedLanguages: id.toString() } }
    );
    // Remove the language ID from all movies' linkedLanguage arrays
    await Movies.updateMany(
      { language: id },
      { $pull: { language: id } }
    );
    const deleteResponse = await Language.findByIdAndDelete(id);

    if (!deleteResponse) {
      return res
        .status(400)
        .json({ msg: "could not deleted the language ..try again " });
    }
    console.log(deleteResponse);
    return res.status(200).json({ msg: "language deleted successfullly" });
  } catch (err) {
    return res.status(500).json({ msg: "something went wrong", err: err });
  }
};