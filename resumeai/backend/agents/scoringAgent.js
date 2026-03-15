export const scoringAgent = async (parsedData) => {

  let score = 0;

  const strengths = [];
  const weaknesses = [];

  if (parsedData.skills.length > 3) {
    score += 30;
    strengths.push("Good technical skill set");
  } else {
    weaknesses.push("Add more technical skills");
  }

  if (parsedData.projects.length > 1) {
    score += 30;
    strengths.push("Good number of projects");
  } else {
    weaknesses.push("Add more projects");
  }

  if (parsedData.education.length > 0) {
    score += 20;
  }

  if (parsedData.experience.length > 0) {
    score += 20;
    strengths.push("Has relevant experience");
  } else {
    weaknesses.push("Add internships or work experience");
  }

  return {
    score,
    strengths,
    weaknesses
  };

};
