const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @typedef {import('./EnHiDict').IEnHiDict} IEnHiDict
 */

/** @type {import('mongoose').Schema<IEnHiDict>} */
const enHiDictSchema = new Schema({
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

module.exports = mongoose.models.EnHiDict || mongoose.model("EnHiDict", enHiDictSchema, 'en_hi_dicts');
