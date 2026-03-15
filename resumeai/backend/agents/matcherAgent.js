export const matcherAgent = async (parsedSkills, jobRequirements = []) => {

  const matchingSkills = [];
  const missingSkills = [];

  jobRequirements.forEach(skill => {

    if (parsedSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
      matchingSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }

  });

  return {
    matchingSkills,
    missingSkills
  };

};
