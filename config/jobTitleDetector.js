const COMMON_JOB_TITLES = [
  "software engineer",
  "software developer",
  "full stack developer",
  "backend developer",
  "frontend developer",
  "front end developer",
  "back end developer",
  "web developer",
  "mobile developer",
  "devops engineer",
  "cloud engineer",
  "data analyst",
  "data engineer",
  "machine learning engineer",
  "ai engineer",
  "qa engineer",
  "test engineer"
];

exports.detectJobTitleFromText = (text = "") => {
  const lowerText = text.toLowerCase();

  for (const title of COMMON_JOB_TITLES) {
    if (lowerText.includes(title)) {
      return title;
    }
  }

  return null;
};
