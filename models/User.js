const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {import('./User').IUser} IUser
 * @typedef {import('./User').IUserModel} IUserModel
 */

/** @type {import('mongoose').Schema<IUser>} */
const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  goal: {
    type: String,
    required: false,
  },
  channel: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: 'user',
  },
  topics: {
    type: [String],
    required: false,
  },
  currentLearn: {
    type: String,
    required: false,
  },
  currentInstruct: {
    type: String,
    required: false,
  },
  currentLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  }
}, { timestamps: true, versionKey: false });

const User = mongoose.models.User || mongoose.model("User", userSchema, 'users');

/**
 * @type {IUserModel}
 */
module.exports = User;
