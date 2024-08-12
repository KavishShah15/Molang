import { Document, Model } from 'mongoose';

export interface ICourse extends Document {
  email: string;
  instructLang?: string;
  learnLang?: string;
  level: number;
  role: string;
  learnVocab: Map<string, number>;
  masterVocab: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseModel extends Model<ICourse> {}
