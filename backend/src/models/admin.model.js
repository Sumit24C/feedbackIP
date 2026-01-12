import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const adminSchema = new mongoose.Schema({
    institute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Institute",
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    permission: {
        type: String,
        enum: ["institute", "department"]
    }
}, { timestamps: true });

adminSchema.plugin(mongooseAggregatePaginate);
const Admin = mongoose.model("Admin", adminSchema);

export { Admin };