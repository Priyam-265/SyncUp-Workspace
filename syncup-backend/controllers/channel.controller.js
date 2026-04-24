import Channel from "../models/Channel.js";
import Workspace from "../models/Workspace.js";

// GET /api/workspaces/:workspaceId/channels — Get all channels in workspace
export const getChannels = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify workspace exists and user is a member
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    // Get public channels + private channels where user is a member
    const channels = await Channel.find({
      workspace: workspaceId,
      $or: [{ isPrivate: false }, { members: req.user._id }],
    }).populate("members", "fullName email avatar status");

    res.status(200).json(channels);
  } catch (error) {
    console.error("GetChannels error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/workspaces/:workspaceId/channels — Create channel
export const createChannel = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Generate unique 6-character code for private channels
    const inviteCode = isPrivate 
      ? Math.random().toString(36).substring(2, 8).toUpperCase() 
      : undefined;

    // Create channel with creator as first member
    const channel = new Channel({
      name,
      workspace: workspaceId,
      isPrivate: isPrivate || false,
      inviteCode,
      members: isPrivate ? [req.user._id] : workspace.members, // public channels get all workspace members
    });

    await channel.save();

    // Add channel to workspace
    workspace.channels.push(channel._id);
    await workspace.save();

    const populatedChannel = await Channel.findById(channel._id).populate(
      "members",
      "fullName email avatar status"
    );

    console.log(`Channel created: #${name} in ${workspace.name}`);

    res.status(201).json(populatedChannel);
  } catch (error) {
    console.error("CreateChannel error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/channels/:id — Get single channel
export const getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate(
      "members",
      "fullName email avatar status"
    );

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is a member of the channel (for private channels)
    if (channel.isPrivate) {
      const isMember = channel.members.some(
        (member) => member._id.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this private channel" });
      }
    }

    res.status(200).json(channel);
  } catch (error) {
    console.error("GetChannelById error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/channels/:id — Update channel
export const updateChannel = async (req, res) => {
  try {
    const { name, isPrivate } = req.body;

    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (name) channel.name = name;
    if (typeof isPrivate === "boolean") channel.isPrivate = isPrivate;

    await channel.save();

    const updatedChannel = await Channel.findById(channel._id).populate(
      "members",
      "fullName email avatar status"
    );

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error("UpdateChannel error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/channels/:id — Delete channel
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Remove channel from workspace
    await Workspace.findByIdAndUpdate(channel.workspace, {
      $pull: { channels: channel._id },
    });

    await Channel.findByIdAndDelete(channel._id);

    res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.error("DeleteChannel error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/channels/:id/members — Add member to private channel
export const addChannelMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member of this channel" });
    }

    channel.members.push(userId);
    await channel.save();

    const updatedChannel = await Channel.findById(channel._id).populate(
      "members",
      "fullName email avatar status"
    );

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error("AddChannelMember error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/channels/join/:code — Join private channel by invite code
export const joinChannelByCode = async (req, res) => {
  try {
    let { code } = req.params;
    code = code.toUpperCase();

    const channel = await Channel.findOne({ inviteCode: code });

    if (!channel) {
      return res.status(404).json({ message: "Invalid channel invite code" });
    }

    // Check if already a member
    if (channel.members.some((m) => m.toString() === req.user._id.toString())) {
      const populated = await Channel.findById(channel._id).populate(
        "members", "fullName email avatar status"
      );
      return res.status(200).json(populated);
    }

    channel.members.push(req.user._id);
    await channel.save();

    const populated = await Channel.findById(channel._id).populate(
      "members", "fullName email avatar status"
    );

    console.log(`User ${req.user.email} joined private channel #${channel.name} via invite code`);

    res.status(200).json(populated);
  } catch (error) {
    console.error("JoinChannelByCode error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/workspaces/:workspaceId/channels/dm/:userId
export const getOrCreateDmChannel = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const currentUserId = req.user._id.toString();
    const targetUserId = userId.toString();

    const sortedIds = [currentUserId, targetUserId].sort();
    const dmName = `DM-${sortedIds[0]}-${sortedIds[1]}`;

    let channel = await Channel.findOne({ name: dmName, workspace: workspaceId });

    if (!channel) {
      channel = new Channel({
        name: dmName,
        workspace: workspaceId,
        isPrivate: true,
        members: [currentUserId, targetUserId]
      });
      await channel.save();
      
      const workspace = await Workspace.findById(workspaceId);
      if (workspace) {
        workspace.channels.push(channel._id);
        await workspace.save();
      }
    }

    const populated = await Channel.findById(channel._id).populate("members", "fullName email avatar status");
    res.status(200).json(populated);
  } catch (error) {
    console.error("DM error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/channels/:id/members/:userId — Remove member from channel
export const removeChannelMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    channel.members = channel.members.filter(
      (member) => member.toString() !== userId
    );
    await channel.save();

    const updatedChannel = await Channel.findById(channel._id).populate(
      "members",
      "fullName email avatar status"
    );

    res.status(200).json(updatedChannel);
  } catch (error) {
    console.error("RemoveChannelMember error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
