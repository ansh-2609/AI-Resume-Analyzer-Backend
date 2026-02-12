
const TRUSTED_SOURCES = require("./trustedSources");
// exports.fetchJobs = async (query, location, experience) => {
//   const url = new URL("https://jsearch.p.rapidapi.com/search");

//   url.searchParams.append(
//     "query",
//     `${query} jobs in ${location}`
//   );
//   url.searchParams.append("location", location);
//   url.searchParams.append("page", "1");
//   url.searchParams.append("num_pages", "1");
//   url.searchParams.append("experience", experience);

//   const response = await fetch(url, {
//     headers: {
//       "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//       "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
//     }
//   });

//   if (!response.ok) {
//     throw new Error("Failed to fetch jobs from API");
//   }

//   const data = await response.json();

//   // return data.data.map(job => ({
//   //   title: job.job_title,
//   //   company: job.employer_name,
//   //   description: job.job_description,
//   //   location: job.job_city,
//   //   applyLink: job.job_apply_link
//   // }));
//   return data.data
//   .filter(job =>
//     job.job_country?.toLowerCase() === "india" ||
//     job.job_city?.toLowerCase()?.includes("india") ||
//     job.job_location?.toLowerCase()?.includes("india")
//   )
//   .map(job => ({
//     title: job.job_title,
//     company: job.employer_name,
//     description: job.job_description,
//     location: job.job_city || job.job_location,
//     applyLink: job.job_apply_link
//   }));
// };


// exports.fetchJobs = async (query, location, experience) => {
//   const url = new URL("https://jsearch.p.rapidapi.com/search");

//   url.searchParams.append("query", `${query} jobs in ${location}`);
//   url.searchParams.append("location", location);
//   url.searchParams.append("page", "1");
//   url.searchParams.append("num_pages", "1");
//   url.searchParams.append("experience", experience);

//   const response = await fetch(url, {
//     headers: {
//       "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//       "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
//     }
//   });

//   if (!response.ok) {
//     throw new Error("Failed to fetch jobs from API");
//   }

//   const data = await response.json();

//   return data.data
//     // 🇮🇳 India filter
//     .filter(job =>
//       job.job_country?.toLowerCase() === "india" ||
//       job.job_location?.toLowerCase()?.includes("india")
//     )

//     .filter(job => {
//       const publisher = job.job_publisher?.toLowerCase() || "";
//       const applyLink = job.job_apply_link?.toLowerCase() || "";

//       return TRUSTED_SOURCES.some(source =>
//         publisher.includes(source) || applyLink.includes(source)
//       );
//     })

//     // 🧹 Normalize
//     .map(job => ({
//       title: job.job_title,
//       company: job.employer_name,
//       description: job.job_description,
//       location: job.job_city || job.job_location,
//       applyLink: job.job_apply_link,
//       source: job.job_publisher || "Company Site"
//     }));
// };

// exports.fetchJobs = async (query, location) => {
//   const url = new URL("https://jsearch.p.rapidapi.com/search");

//   url.searchParams.append(
//     "query",
//     `${query} developer jobs in ${location}`
//   );
//   url.searchParams.append("location", location);
//   url.searchParams.append("page", "1");
//   url.searchParams.append("num_pages", "1");

//   const response = await fetch(url, {
//     headers: {
//       "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//       "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
//     }
//   });
  
//   // const response = await fetch(url, {
//   //   method: "GET",
//   //   headers: {
//   //     "x-rapidapi-host": "jsearch.p.rapidapi.com",
//   //   },
//   // });

//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error("RapidAPI error:", response.status, errorText);
//     throw new Error(`RapidAPI error ${response.status}`);
//   }

//   const data = await response.json();

//   return data.data
//     .filter(job =>
//       job.job_country?.toLowerCase() === "india" ||
//       job.job_location?.toLowerCase()?.includes("india")
//     )
//     .filter(job => {
//       const publisher = job.job_publisher?.toLowerCase() || "";
//       const applyLink = job.job_apply_link?.toLowerCase() || "";

//       return TRUSTED_SOURCES.some(source =>
//         publisher.includes(source) || applyLink.includes(source)
//       );
//     })
//     .map(job => ({
//       title: job.job_title,
//       company: job.employer_name,
//       description: job.job_description,
//       location: job.job_city || job.job_location,
//       applyLink: job.job_apply_link,
//       source: job.job_publisher || "Company Site"
//     }));
// };

exports.fetchJobs = async (query, location) => {
  const url = new URL("https://jsearch.p.rapidapi.com/search");

  url.searchParams.append("query", `${query}`);
  url.searchParams.append("location", location);
  url.searchParams.append("page", "1");

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
  console.log('Active Jobs DB response:', data);

  // Normalize response to match your frontend
  // return (data.jobs || data.data || [])
  //   .filter(job =>
  //     job.location?.toLowerCase()?.includes("india")
  //   )
  //   .map(job => ({
  //     title: job.title || job.job_title,
  //     company: job.company || job.employer_name || "Unknown",
  //     description: job.description || job.job_description || "",
  //     location: job.location || "India",
  //     applyLink: job.url || job.apply_link || "#",
  //     source: "ActiveJobsDB"
  //   }));.

  return (data.jobs || data.data || []).map(job => ({
  title: job.job_title,
  company: job.employer_name || "Unknown",
  description: job.job_description || "",
  location: job.job_location || "Unknown",
  applyLink: job.job_apply_link || "#",
  source: "ActiveJobsDB"
}));

};

