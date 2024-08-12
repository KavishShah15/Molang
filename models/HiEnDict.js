const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {import('./HiEnDict').IHiEnDict} IHiEnDict
 */

/** @type {import('mongoose').Schema<IHiEnDict>} */
const hiEnDictSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  term: {
    type: String,
    required: true,
  },
  pronunciation: {
    type: String,
    required: false,
  },
  partOfSpeech: {
    type: String,
    required: false,
  },
  definition: {
    type: String,
    required: true,
  },
  usage: {
    type: String,
    required: false,
  },
  otherForms: {
    type: Map,
    of: String,
    required: false,
  },
  explanation: {
    type: String,
    required: false,
  },
  audio: {
    type: String,
    required: false,
  },
}, { versionKey: false });

module.exports = mongoose.models.HiEnDict || mongoose.model("HiEnDict", hiEnDictSchema, 'hi_en_dicts');
