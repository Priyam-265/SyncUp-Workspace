import Message from "../models/Message.js";
import Channel from "../models/Channel.js";
import { getIO } from "../socket/socket.js";

// GET /api/channels/:channelId/messages — Get messages (paginated, 50 per page)
export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify channel exists
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is a member of the channel
    const isMember = channel.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this channel" });
    }

    const messages = await Message.find({ channel: channelId })
      .populate("sender", "fullName email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ channel: channelId });

    res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GetMessages error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/channels/:channelId/messages — Send message
export const sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text, fileUrl, fileType, fileName } = req.body;

    // Validate — message must have text or a file
    if (!text && !fileUrl) {
      return res.status(400).json({ message: "Message must have text or a file" });
    }

    // Verify channel exists
    const channel = await Channel.findById(channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is a member of the channel
    const isMember = channel.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this channel" });
    }

    const message = new Message({
      workspace: channel.workspace,
      channel: channelId,
      sender: req.user._id,
      text,
      fileUrl,
      fileType,
      fileName,
    });

    await message.save();

    // Populate sender info before emitting
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "fullName email avatar"
    );

    // Emit real-time event to channel room
    const io = getIO();
    io.to(`channel:${channelId}`).emit("new-message", populatedMessage);

    console.log(`Message sent in channel ${channelId} by ${req.user.email}`);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("SendMessage error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/messages/:id — Delete message (sender only)
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only the sender can delete their message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(message._id);

    // Broadcast deletion to channel room
    const io = getIO();
    io.to(`channel:${message.channel}`).emit("delete-message", {
      messageId: message._id,
      channelId: message.channel,
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("DeleteMessage error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
