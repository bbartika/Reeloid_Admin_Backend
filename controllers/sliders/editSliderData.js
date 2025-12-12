const Slider = require("../../models/Slider");
const mongoose = require("mongoose");

exports.editSliderData = async (req, res) => {
// const { id } = req.params;
const {id} = req.params;
let {schemaName,type,linkedMovie,RedirectionLink,promotionalImageUrl,visible} = req.body;
console.log("req.body", req.body);
console.log("slider name",schemaName);
// console.log(id, "id");
// console.log(req.body, "body");
// console.log(req.params, "params");
if (!id) {
    return res.status(400).json({error: "Slider Id is required"});
}
if(!schemaName){
    return res.status(400).json({error: "Slider name is required"});
}
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
if (!linkedMovie || linkedMovie === "undefined" || linkedMovie === undefined) {
    return res.status(404).json({
     msg: "Please select movie for linking to this slider",
     status: false
    });
}
}
if(visible==undefined || visible==null){
    return res.status(400).json({error: "Slider visibility is required"});
}
if (linkedMovie) {
if (!mongoose.Types.ObjectId.isValid(linkedMovie)) {
    return res.status(400).json({ error: "Invalid linkedMovie ObjectId" });
}
linkedMovie = new mongoose.Types.ObjectId(linkedMovie);
}

visible = visible === "true" ? true : visible === "false" ? false : visible;    
try {
    const updatedSlider = await Slider.findByIdAndUpdate(
        id,
        {
            schemaName,
            type,
            linkedMovie,
            promotionalImageUrl,
            RedirectionLink,
            visible,
        },
        {new: true}
    ).populate({
        path: "linkedMovie",
        select: "_id schemaName",
    });

    if (!updatedSlider) {
        return res.status(404).json({error: "Slider not found"});
    }

    return res.status(200).json({slider: updatedSlider});
    
} catch (error) { 
    console.error(error);
    return res.status(500).json({ error: "Server error while updating slider" });
}
};
