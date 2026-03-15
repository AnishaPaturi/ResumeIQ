import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  originalName: {
    type: String
  },

  path: {
    type: String,
    required: true
  },

  parsedData: {
    skills: [String],
    projects: [String],
    education: [String],
    experience: [String]
  },

  score: {
    strengths: [String],
    weaknesses: [String]
  },

  skillMatch: {
    matchingSkills: [String],
    missingSkills: [String]
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
