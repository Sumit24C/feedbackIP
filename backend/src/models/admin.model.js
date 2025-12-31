import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const adminSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    permission: {
        type: String,
    }
}, { timestamps: true });

adminSchema.plugin(mongooseAggregatePaginate);
const Admin = mongoose.model("Admin", adminSchema);

export { Admin };