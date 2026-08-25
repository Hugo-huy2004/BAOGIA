import mongoose from "mongoose";

/* =========================
   MEDIA
========================= */

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    name: {
      type: String,
    },

    size: {
      type: Number, // bytes
    },

    mimeType: {
      type: String,
    },

    width: {
      type: Number,
    },

    height: {
      type: Number,
    },

    duration: {
      type: Number, // seconds
    },
  },
  {
    _id: false,
  }
);


/* =========================
   REACTION
========================= */

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bio",
      required: true,
    },

    emoji: {
      type: String,
      enum: ['like','heart','haha','wow','sad','angry'],
      required: true,
    },
  },
  {
    _id: false,
  }
);


/* =========================
   MESSAGE CONTENT
========================= */

const contentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    media: {
      type: mediaSchema,
    },
  },
  {
    _id: false,
  }
);


/* =========================
   MESSAGE
========================= */

const messageSchema = new mongoose.Schema(
  {
    /* Người gửi */

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bio",
      required: true,
      index: true,
    },


    /* Cuộc hội thoại */

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },


    /* Nội dung */

    content: {
      type: contentSchema,
      required: true,
    },


    /* Loại message */

    messageType: {
      type: String,
      enum: [
        "text",
        "media",
        "reply",
      ],
      default: "text",
    },


    /* Reply message */

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },


    /* Reactions */

    reactions: {
      type: [reactionSchema],
      default: [],
    },


    /* Người đã đọc */

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bio",
      },
    ],


    /* Message đã xóa */

    deleted: {
      type: Boolean,
      default: false,
    },


    deletedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);


/* =========================
   INDEX
========================= */

// Lấy message theo conversation nhanh hơn
messageSchema.index({
  conversation: 1,
  createdAt: -1,
});

// Tìm message của một user
messageSchema.index({
  sender: 1,
  createdAt: -1,
});


/* =========================
   MODEL
========================= */

const Message = mongoose.model("Message", messageSchema);

export { Message };