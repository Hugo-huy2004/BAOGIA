import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bio",
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bio",
    },
  },
  {
    timestamps: true,
  },
);

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Friend = mongoose.model("Friend", friendSchema);

export {Friend};