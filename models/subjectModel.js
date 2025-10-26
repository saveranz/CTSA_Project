import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Subject = sequelize.define("Subject", {
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: true },
  day: { type: DataTypes.STRING, allowNull: true },
  startTime: { type: DataTypes.STRING, allowNull: true },
  endTime: { type: DataTypes.STRING, allowNull: true },
  room: { type: DataTypes.STRING, allowNull: true },
  lateThreshold: { type: DataTypes.INTEGER, allowNull: true }
});

export { sequelize };
