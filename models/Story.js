const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Schema } = mongoose;

const storySchema = new Schema({
  id: { type: String, default: uuidv4, unique: true },
  prompt: { type: String, required: false },
  cover: { type: String, required: false },
  content: { type: String, required: false },
  level: { type: Number, required: false },
  view: { type: Number, required: false, default: 0 },
  instructLang: { type: String, required: false },
  learnLang: { type: String, required: false },
  instructName: { type: String, required: false },
  learnName: { type: String, required: false },
  published: { type: Boolean, required: false, default: true },
  creator: { type: String, required: false },
}, { timestamps: false });

const Story = mongoose.models.Story || mongoose.model('Story', storySchema, 'stories');
module.exports = Story;

