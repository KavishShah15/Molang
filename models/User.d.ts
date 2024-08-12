import { Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  goal?: string;
  channel?: string;
  role: string;
  topics?: string[];
  currentLearn?: string;
  currentInstruct?: string;
  currentLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {}
