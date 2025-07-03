const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "default-profile.png",
  },
  storageUsed: {
    type: Number,
    default: 0,
  },
  storageLimit: {
    type: Number,
    default: 15 * 1024 * 1024 * 1024, // 15 GB in bytes
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favorite",
    },
  ],
  verificationCode: {
    type: String,
  },
  verificationCodeExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  safeFolderEnabled: {
    type: Boolean,
    default: false,
  },
  safeFolderPin: {
    type: String,
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
