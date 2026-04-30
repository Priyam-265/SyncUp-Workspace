import Workspace from "../models/Workspace.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import { getIo } from "../socket/socket.js";

// GET /api/workspaces — Get all workspaces where user is a member
export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user._id })
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    res.status(200).json(workspaces);
  } catch (error) {
    console.error("GetWorkspaces error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/workspaces — Create new workspace
export const createWorkspace = async (req, res) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    // 1. Create the workspace with the creator as owner and first member
    const workspace = new Workspace({
      name,
      icon: icon || "💼",
      owner: req.user._id,
      members: [req.user._id],
    });

    await workspace.save();

    // 2. Create default #general and #random channels
    const generalChannel = new Channel({
      name: "general",
      workspace: workspace._id,
      isPrivate: false,
      members: [req.user._id],
    });

    const randomChannel = new Channel({
      name: "random",
      workspace: workspace._id,
      isPrivate: false,
      members: [req.user._id],
    });

    await generalChannel.save();
    await randomChannel.save();

    // 3. Add channels to workspace
    workspace.channels.push(generalChannel._id, randomChannel._id);
    await workspace.save();

    // 4. Return populated workspace
    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    console.log(`Workspace created: ${name} by ${req.user.email}`);

    res.status(201).json(populatedWorkspace);
  } catch (error) {
    console.error("CreateWorkspace error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/workspaces/:id — Get single workspace with channels and members
export const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if user is a member
    const isMember = workspace.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    res.status(200).json(workspace);
  } catch (error) {
    console.error("GetWorkspaceById error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/workspaces/:id — Update workspace
export const updateWorkspace = async (req, res) => {
  try {
    const { name, icon } = req.body;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Only owner can update
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the workspace owner can update it" });
    }

    if (name) workspace.name = name;
    if (icon) workspace.icon = icon;

    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    console.error("UpdateWorkspace error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/workspaces/:id — Delete workspace (owner only)
export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Only owner can delete
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the workspace owner can delete it" });
    }

    // Delete all channels in this workspace
    await Channel.deleteMany({ workspace: workspace._id });

    // Delete the workspace
    await Workspace.findByIdAndDelete(workspace._id);

    console.log(`Workspace deleted: ${workspace.name} by ${req.user.email}`);

    res.status(200).json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("DeleteWorkspace error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/workspaces/:id/members — Add member to workspace
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Check if already a member
    if (workspace.members.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add member to workspace
    workspace.members.push(userId);
    await workspace.save();

    // Add member to all public channels in this workspace
    await Channel.updateMany(
      { workspace: workspace._id, isPrivate: false },
      { $addToSet: { members: userId } }
    );

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    console.error("AddMember error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/workspaces/join/:code — Join workspace by invite code
export const joinByCode = async (req, res) => {
  try {
    let { code } = req.params;

    // Support full invite links — extract the code from the last segment
    if (code.startsWith("http")) {
      const parts = code.split("/");
      code = parts[parts.length - 1];
    }

    code = code.toUpperCase();

    const workspace = await Workspace.findOne({ inviteCode: code });

    if (!workspace) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    // Check if already a member
    if (workspace.members.some((m) => m.toString() === req.user._id.toString())) {
      // Already a member — just return the workspace
      const populated = await Workspace.findById(workspace._id)
        .populate("owner", "fullName email avatar")
        .populate("members", "fullName email avatar status")
        .populate("channels");
      return res.status(200).json(populated);
    }

    // Add member to workspace
    workspace.members.push(req.user._id);
    await workspace.save();

    // Add member to all public channels
    await Channel.updateMany(
      { workspace: workspace._id, isPrivate: false },
      { $addToSet: { members: req.user._id } }
    );

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    console.log(`User ${req.user.email} joined workspace ${workspace.name} via invite code`);

    res.status(200).json(populatedWorkspace);
  } catch (error) {
    console.error("JoinByCode error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /api/workspaces/:id/members/:userId — Remove member
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Owner cannot be removed
    if (workspace.owner.toString() === userId) {
      return res.status(400).json({ message: "Cannot remove the workspace owner" });
    }

    // If last member leaving (edge case, usually owner is last but owner cannot leave unless transfer, wait, let's just handle it)
    if (workspace.members.length === 1 && workspace.members[0].toString() === userId) {
      await Workspace.findByIdAndDelete(workspace._id);
      await Channel.deleteMany({ workspace: workspace._id });
      return res.status(200).json({ message: "Workspace deleted as last member left" });
    }

    // Remove member from workspace
    workspace.members = workspace.members.filter(
      (member) => member.toString() !== userId
    );
    await workspace.save();

    // Remove member from all channels in this workspace
    await Channel.updateMany(
      { workspace: workspace._id },
      { $pull: { members: userId } }
    );

    // Emit socket event so others in workspace see them leave instantly
    const io = getIo();
    if (io) {
      io.to(`workspace:${workspace._id}`).emit("member-left", {
        workspaceId: workspace._id,
        userId: userId,
      });
    }

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate("owner", "fullName email avatar")
      .populate("members", "fullName email avatar status")
      .populate("channels");

    res.status(200).json(updatedWorkspace);
  } catch (error) {
    console.error("RemoveMember error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
