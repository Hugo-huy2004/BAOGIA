import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bio",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bio",
    },
  },
  { timestamps: true },
);

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export { FriendRequest };
