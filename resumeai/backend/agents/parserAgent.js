export const parserAgent = async (resumeText) => {

  const skills = [];
  const projects = [];
  const education = [];
  const experience = [];

  const lines = resumeText.split("\n");

  lines.forEach(line => {

    const l = line.toLowerCase();

    if (l.includes("react") || l.includes("node") || l.includes("python")) {
      skills.push(line.trim());
    }

    if (l.includes("project")) {
      projects.push(line.trim());
    }

    if (l.includes("btech") || l.includes("bachelor") || l.includes("university")) {
      education.push(line.trim());
    }

    if (l.includes("intern") || l.includes("developer")) {
      experience.push(line.trim());
    }

  });

  return {
    skills,
    projects,
    education,
    experience
  };

};
