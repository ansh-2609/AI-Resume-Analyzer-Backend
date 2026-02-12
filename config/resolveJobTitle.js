const { detectJobTitleFromText } = require("./jobTitleDetector");
const { inferJobTitleFromSkills } = require("./jobTitleFromSkills");

exports.resolveJobTitle = ({ rawText, skills }) => {
  return (
    detectJobTitleFromText(rawText) ||
    inferJobTitleFromSkills(skills)
  );
};
