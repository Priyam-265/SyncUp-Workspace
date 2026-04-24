import mongoose from "mongoose";
import crypto from "crypto";

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Channel name is required"],
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate invite code for private channels
channelSchema.pre("save", function (next) {
  if (this.isPrivate && !this.inviteCode) {
    this.inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  }
  next();
});

const Channel = mongoose.model("Channel", channelSchema);
export default Channel;
