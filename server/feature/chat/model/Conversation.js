import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["group", "direct"],
      required: true,
    },
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: "Bio",
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamp: true },
);

conversationSchema.index({ participants: 1, type: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export {Conversation};

