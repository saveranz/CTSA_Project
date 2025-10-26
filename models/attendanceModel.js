import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Attendance = sequelize.define("Attendance", {
  studentName: { type: DataTypes.STRING, allowNull: false },
  studentId: { type: DataTypes.STRING, allowNull: true },
  course: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATE, allowNull: false },
  checkIn: { type: DataTypes.STRING, allowNull: true },
  checkOut: { type: DataTypes.STRING, allowNull: true },
  subject: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true },
  campus: { type: DataTypes.STRING, allowNull: true }
});

export { sequelize };
