import { Document, Model } from 'mongoose';

export interface IEnHiDict extends Document {
  category: string;
  term: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  usage?: string;
  otherForms?: Map<string, string>;
  explanation?: string;
  audio?: string;
}

export interface IEnHiDictModel extends Model<IEnHiDict> {}
