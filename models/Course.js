const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {import('./Course').ICourse} ICourse
 * @typedef {import('./Course').ICourseModel} ICourseModel
 */

/** @type {import('mongoose').Schema<ICourse>} */
const courseSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  instructLang: {
    type: String,
    required: false,
  },
  learnLang: {
    type: String,
    required: false,
  },
  level: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  role: {
    type: String,
    default: 'user',
  },
  learnVocab: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  masterVocab: {
    type: [String],
    default: [],
  },
}, { timestamps: true, versionKey: false });

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema, 'courses');

/**
 * @type {ICourseModel}
 */
module.exports = Course;
