exports.inferJobTitleFromSkills = (skills = {}) => {
  const allSkills = Object.values(skills).flat().map(s => s.toLowerCase());

  if (
    allSkills.includes("react") &&
    allSkills.includes("node")
  ) {
    return "full stack developer";
  }

  if (
    allSkills.includes("react") ||
    allSkills.includes("vue") ||
    allSkills.includes("angular")
  ) {
    return "frontend developer";
  }

  if (
    allSkills.includes("node") ||
    allSkills.includes("express") ||
    allSkills.includes("django") ||
    allSkills.includes("spring")
  ) {
    return "backend developer";
  }

  if (
    allSkills.includes("aws") ||
    allSkills.includes("docker") ||
    allSkills.includes("kubernetes")
  ) {
    return "devops engineer";
  }

  if (
    allSkills.includes("python") &&
    (allSkills.includes("pandas") || allSkills.includes("numpy"))
  ) {
    return "data analyst";
  }

  return "software developer"; 
};
