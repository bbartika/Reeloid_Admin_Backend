const Slider = require("../../models/Slider");

exports.addSlider = async (req, res, next) => {
console.log(req.body);
console.log(req.file);

const { PromotionalImageURL, promotionalContentType, name, type, movieId, visible } = req.body;

// Initial validations
if (promotionalContentType == "URL" && PromotionalImageURL.length == 0) {
    return res.status(400).json({
     msg: "No Url present for linking promotional content",
     status: false,
    });
}

if (!name || name.length == 0) {
    console.log("name is not present");
    return res.status(404).json({ msg: "Please provide Slider name", status: false });
}

if (!type || type.length == 0) {
    return res.status(404).json({ msg: "Please select content type", status: false });
}

// Check type restrictions before database operation
if (type == "Promotional") {
    return res.status(400).json({
     msg: "Promotional slider is not accepting new slider ...",
     success: false,
    });
}

if (type == "Redirection") {
    return res.status(400).json({
     msg: "Redirection is not accepting new slider ...",
     success: false,
    });
}

if (type === "Trailer") {
    if (!movieId || movieId === "undefined" || movieId === undefined) {
     return res.status(404).json({
        msg: "Please select movie for linking to this slider",
        status: false
     });
    }
}
// if(!visible){
// return res.status(404).json({
//     msg: "Please select visibility for this slider",
//     status: false
// });
// }
if(visible==undefined || visible==null){
    return res.status(400).json({error: "Slider visibility is required"});
}

try {
    const sliderResponse = await Slider.create({
     schemaName: name,
     type: type,
     linkedMovie: movieId,
     visible,
    });

    if (!sliderResponse) {
     return res.status(400).json({
        msg: "there was some problem while saving ur slider....try after sometime",
        success: false,
     });
    }

    return res.status(200).json(sliderResponse);
} catch (err) {
    console.log(err);
    return res
     .status(500)
     .json({ msg: "something went wrong...", success: false });
}
};