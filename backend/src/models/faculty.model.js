import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",   
    },
    isHOD: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })
facultySchema.pre("deleteMany", async function (next) {
    const filter = this.getFilter();
    const faculties = await mongoose.model("Faculty").find(filter);
    const userIds = faculties.map(s => s.user_id);

    if (userIds.length > 0) {
        await mongoose.model("User").deleteMany({ _id: { $in: userIds } });
    }
    next();
});
const Faculty = mongoose.model("Faculty", facultySchema);

export { Faculty };