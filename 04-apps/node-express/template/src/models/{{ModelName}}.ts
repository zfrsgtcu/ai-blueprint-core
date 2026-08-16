// {{ProjectName}} — {{ModelName}} Model
// AI: Veritabanı seçimine göre uygun model tanımını kullan.
// MongoDB → Mongoose schema, MSSQL/PostgreSQL → Prisma schema (prisma/schema.prisma).

// === MONGOOSE ÖRNEĞİ (MongoDB kullanılıyorsa) ===
import mongoose, { Document, Schema } from 'mongoose';

export interface I{{ModelName}} extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const {{modelName}}Schema = new Schema<I{{ModelName}}>(
  {
    name: {
      type: String,
      required: [true, 'Ad zorunludur'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt otomatik
  },
);

// Soft delete — find sorgularında isDeleted: false otomatik eklenir
{{modelName}}Schema.pre(/^find/, function (next) {
  // @ts-ignore
  if (this._conditions?.isDeleted === undefined) {
    // @ts-ignore
    this.where({ isDeleted: false });
  }
  next();
});

export const {{ModelName}} = mongoose.model<I{{ModelName}}>('{{ModelName}}', {{modelName}}Schema);
