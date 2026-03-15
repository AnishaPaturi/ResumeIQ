import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB connected"))
.catch(err=>console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
