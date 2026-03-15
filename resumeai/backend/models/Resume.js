import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: String,

  parsedData: {
    skills: [String],
    projects: [String],
    education: [String],
    experience: [String]
  },

  score: {
    value: Number,
    strengths: [String],
    weaknesses: [String]
  },

  skillMatch: {
    matchingSkills: [String],
    missingSkills: [String],
    compatibilityScore: Number
  },

  careerAdvice: {
    skillsToLearn: [String],
    projectsToBuild: [String],
    trendingTechnologies: [String],
    improvements: [String]
  }

},
{ timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
