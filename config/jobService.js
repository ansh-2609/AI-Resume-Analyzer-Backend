
const TRUSTED_SOURCES = require("./trustedSources");

exports.fetchJobs = async (query, location = "India") => {
  const url = new URL("https://jsearch.p.rapidapi.com/search");

  const finalQuery = `${query} in India`;

  url.searchParams.append("query", finalQuery);
  url.searchParams.append("location", location);
  url.searchParams.append("page", "1");
  url.searchParams.append("num_pages", "3");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "jsearch.p.rapidapi.com"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Active Jobs DB error:", response.status, errorText);
    throw new Error(`Active Jobs DB error ${response.status}`);
  }

  const data = await response.json();
  console.log("Active Jobs DB response received");

  const allJobs = data.data || data.jobs || [];

  const indiaJobs = allJobs.filter(job => {

    if (job.job_country === "IN") return true;

    // Fallback check (extra safety)
    const locationText = (job.job_location || "").toLowerCase();
    const countryText = (job.job_country || "").toLowerCase();
    const cityText = (job.job_city || "").toLowerCase();

    return (
      locationText.includes("india") ||
      countryText.includes("india") ||
      cityText.includes("india")
    );
  });

  console.log(`Filtered ${indiaJobs.length} India jobs out of ${allJobs.length}`);

  return indiaJobs.map(job => ({
    title: job.job_title,
    company: job.employer_name || "Unknown",
    description: job.job_description || "",
    location: job.job_location || "India",
    applyLink: job.job_apply_link || "#",
    source: "ActiveJobsDB"
  }));
};
