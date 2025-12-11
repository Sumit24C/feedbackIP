import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    dept: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    roll_no: {
        type: Number,
        required: true,
    },
    academic_year: {
        type: Number,
        required: true,
    },
    classSection: {
        type: String,
        required: true,
    },
    electives: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject"
        }
    ]
}, { timestamps: true })

studentSchema.pre("deleteMany", async function (next) {
    const filter = this.getFilter();

    const students = await mongoose.model("Student").find(filter);

    const userIds = students.map((s) => s.user_id);

    if (userIds.length > 0) {
        await mongoose.model("User").deleteMany({ _id: { $in: userIds } });
    }

    next();
});

const Student = mongoose.model("Student", studentSchema);

export { Student };