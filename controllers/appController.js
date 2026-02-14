const pdf = require('pdf-parse');
const fs = require('fs');
const Resume = require('../models/resumes/resumes');
const jwt = require('jsonwebtoken');
const path = require('path');
const fsp = require('fs/promises');
const bcryptjs = require('bcryptjs');
const { resolveJobTitle } = require("../config/resolveJobTitle");
const MatchedJobs = require("../models/matchedJobs/matchedJobs");
const Skill = require('../models/skills/skill');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const Groq = require("groq-sdk");
const { fetchJobs } = require('../config/jobService');
const User = require('../models/users/user');
const FrontendQuestions = require('../models/interviewQuestions/frontendQuestions');
const ReactQuestions = require('../models/interviewQuestions/reactQuestions');
const BackendQuestions = require('../models/interviewQuestions/backendQuestions');
const DataScientistQuestions = require('../models/interviewQuestions/dataScientistQuestions');
const DevOpsQuestions = require('../models/interviewQuestions/devOpsQuestions');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const groq_chatbot = new Groq({ apiKey: process.env.GROQ_API_KEY_CHATBOT });

const pLimit = require("p-limit").default;
const limit = pLimit(5);


function extractJSON(text) {
  try {
    // Remove everything before first {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No JSON object found");
    }

    let jsonString = text.substring(start, end + 1);

    // Remove JS-style comments or parentheses explanations
    jsonString = jsonString.replace(/\([^)]*\)/g, "");

    return JSON.parse(jsonString);
  } catch (err) {
  console.error("JSON Parse Error:", err.message);
  throw err; 
}
}


exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;   
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

exports.uploadResume = async (req, res) => {
    try {
        const userId = req.userId; 
        const file = req.file;

        // console.log('User ID:', userId);
        // console.log('Uploaded file:', file);

        
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' }); 
        }
        
        // Extract text from PDF
        const dataBuffer = fs.readFileSync(file.path);
        // console.log('Data Buffer:', dataBuffer);
        const pdfData = await pdf(dataBuffer);
        // console.log('PDF Data:', pdfData);
        const resumeText = pdfData.text;
        // console.log('Extracted Resume Text:', resumeText);
        
        // Save to database
        const resume = new Resume(null, userId, file.originalname ,file.path, resumeText, null);
        const result = await resume.insert();

        // console.log('Resume uploaded with ID:', result); 
        
        // Emit processing status via Socket.io
        // req.io.emit(`processing-${userId}`, {
        //     resumeId: result.insertId,
        //     status: 'uploaded',
        //     message: 'Resume uploaded successfully'
        // });
        
        res.json({
            success: true,
            resumeId: result[0].insertId,
            text: resumeText.substring(0, 500) + '...'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getMyResumes = async (req, res) => {
    try {
        console.log('Request params:', req.params);
        const {userId} = req.params;
        console.log('User ID for fetching resumes:', userId);
        
        const [resumes] = await Resume.findById(userId);
        // console.log('Fetched resumes:', resumes);
        
        
        res.json(resumes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.downloadResume = async (req, res) => {
  try {
    const {resumeId} = req.params;
    const id = parseInt(resumeId);
    const userId = req.userId;
    console.log('User ID for downloading resume:', userId);
    console.log('Resume ID for downloading resume:', id);
    const [resumeFilePath] = await Resume.findFileById(id, userId);

    console.log('Resume File Path:', resumeFilePath);

    if (!resumeFilePath) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const filePath = path.resolve(resumeFilePath[0].file_path);
    console.log('File Path:', filePath);
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error downloading resume:", err);
        return res.status(500).json({ message: "Error downloading resume" });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.extractSkills = async (req, res) => {
  try {
    const { resumeId } = req.body;
    const userId = req.userId;
    console.log('Resume ID for extracting skills:', resumeId);

    const [resume] = await Resume.findByResumeId(resumeId);
    console.log('Resume for extracting skills:', resume);
    if (!resume || resume.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resumeText = resume[0].raw_text;
    if (!resumeText) {
      return res.status(400).json({ error: "Resume text missing" });
    }

    const prompt = `
    You are an intelligent resume parsing engine.

    TASK:
    Analyze the resume and extract structured information in STRICT JSON format.

    CRITICAL INSTRUCTION:
    - Do NOT omit any technical skill mentioned explicitly or implicitly
    - If unsure about a skill’s category, place it in "other" rather than omitting it
    - Extract skills even if they appear in project descriptions, experience, or tools sections

    SKILL CLASSIFICATION LOGIC (DO NOT LIST EXAMPLES IN OUTPUT):
    - programming: languages used to write logic, scripts, or applications
    - markup_languages: languages used to structure content or documents
    - styling_languages: languages used to style or design user interfaces
    - frameworks: libraries or platforms that provide application structure
    - tools: software used for development, deployment, or productivity
    - databases: systems used for data storage or querying
    - cloud_platforms: services used for hosting, deployment, or infrastructure
    - data_technologies: tools or libraries used for analytics, data processing, or ML
    - devops: CI/CD, containers, infrastructure, or automation tools
    - soft_skills: non-technical professional skills
    - other: any skill that does not clearly fit above categories

    IMPLICIT SKILL RULES:
    - If frontend or web development is mentioned, include relevant markup and styling languages if implied
    - If backend development is mentioned, include server-side programming languages and frameworks if implied
    - If data, AI, or ML work is mentioned, include related data technologies if implied
    - If cloud or deployment is mentioned, include relevant cloud or DevOps tools if implied

    EXPECTED JSON FORMAT (STRICT):
    {
      "skills": {
        "programming": [],
        "markup_languages": [],
        "styling_languages": [],
        "frameworks": [],
        "tools": [],
        "databases": [],
        "cloud_platforms": [],
        "data_technologies": [],
        "devops": [],
        "soft_skills": [],
        "other": []
      },
      "experience": [],
      "projects": [
        {
          "name": "",
          "description": "",
          "technologies": [],
          "role": ""
        }
      ],
      "certifications": [],
      "education": "",
      "total_experience_years": number
    }

    IMPORTANT OUTPUT RULES:
    - Output ONLY valid JSON
    - Output MUST start with { and end with }
    - Do NOT include explanations, comments, or extra text
    - All arrays must contain plain strings only

    RESUME TEXT:
    ${resumeText.substring(0, 4000)}
    `;


    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const responseText = completion.choices[0].message.content;

    let analysis;
    try {
      analysis = extractJSON(responseText);
    } catch (err) {
      console.error("Invalid JSON from Groq:", responseText);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    if (analysis.skills) {
      for (const category of Object.keys(analysis.skills)) {
        for (const skill of analysis.skills[category]) {
          const skillRecord = new Skill(
            null,
            userId,
            resumeId,
            skill,
            category,
            0.9
          );
          await skillRecord.insert();
        }
      }
    }

    await Resume.updateParsedData(
      resumeId,
      JSON.stringify(analysis)
    );

    res.json({ success: true, analysis });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


exports.updateStats = async (req, res) => {
  try {
    const { resumeId } = req.body;

const [resume] = await Resume.findByResumeId(resumeId);
if (!resume || resume.length === 0) {
  return res.status(404).json({ error: "Resume not found" });
}

const resumeText = resume[0].raw_text;

const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer and senior technical recruiter with 15+ years of experience evaluating resumes for competitive software, data, and technical roles.

Your task is to conduct a RIGOROUS, REALISTIC, and STRICT evaluation.
Be critical and conservative. Most resumes have significant flaws.
Do NOT assume intent. Evaluate ONLY what is explicitly written.

-----------------------------------
SCORING FRAMEWORK (STRICT CALIBRATION):
- 95–100: Exceptional. Top 1%. Rarely awarded.
- 85–94: Excellent. Strong resume with minor gaps.
- 70–84: Good, but clearly improvable.
- 55–69: Average. Typical resume with weak impact, metrics, or keywords.
- 40–54: Below average. Multiple serious issues.
- Below 40: Poor. ATS-unfriendly or unclear.

DEFAULT: Most resumes should fall between 50–70.

-----------------------------------
EVALUATION CRITERIA (ALL MUST BE CONSIDERED):

1. ATS Compatibility & Formatting
- Parseable structure, standard headings, bullet clarity
- No tables, columns, graphics, or dense paragraphs
- Penalize ATS-unfriendly formatting heavily

2. Skills & Keyword Optimization
- Role-relevant technical keywords
- Skills listed must be demonstrated in experience or projects
- Penalize missing core technologies for the apparent target role
- Penalize buzzwords without evidence

3. Experience Quality & Impact
- Action verbs + quantified results
- Clear technical or business impact
- Penalize vague phrases (“worked on”, “responsible for”)
- Penalize long, duty-only bullets

4. Projects Quality
- Penalize missing or weak projects
- Require technical depth, clear tech stack, and outcomes
- Penalize trivial or tutorial-level projects

5. Structure & Clarity
- Logical ordering, easy to scan in under 10 seconds
- Concise bullets (1–2 lines max)
- Penalize redundancy and buried key information

6. Professional Language
- Clear, professional tone
- No grammar or spelling errors
- No personal pronouns

-----------------------------------
MANDATORY PENALTIES:
- No quantified achievements → major score reduction
- Missing or weak projects → major score reduction
- Keyword gaps for technical roles → score reduction
- Listing skills not used anywhere → score reduction
- ATS-unfriendly formatting → major score reduction

-----------------------------------
OUTPUT RULES (CRITICAL):
- Be blunt, honest, and specific
- No generic praise or filler language
- No explanations outside the JSON
- Return ONLY valid JSON
- Match the format EXACTLY
- Do NOT add extra fields
- Strengths, weaknesses, and improvements must be concise but specific

-----------------------------------
RETURN FORMAT (EXACT):
{
  "score": number,
  "strengths": [
    "specific strength 1",
    "specific strength 2"
  ],
  "weaknesses": [
    "specific weakness 1",
    "specific weakness 2"
  ],
  "improvements": [
    "clear, actionable improvement 1",
    "clear, actionable improvement 2"
  ]
}

Resume:
${resumeText.substring(0, 8000)}
`;


    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const aiResponse = 
      extractJSON(completion.choices[0].message.content)


    // Save score + feedback
    await Resume.updateResumeEvaluation(
      resumeId,
      aiResponse.score,
      {
        strengths: aiResponse.strengths,
        weaknesses: aiResponse.weaknesses,
        improvements: aiResponse.improvements
      }
    );

    console.log('Updated resume evaluation:', aiResponse);

    res.json(aiResponse);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.matchRealJobs = async (req, res) => {
  try {
    const { resumeId } = req.body;
    const userId = req.userId;

    if (!resumeId) {
      return res.status(400).json({ error: "resumeId is required" });
    }

    const [cached] = await MatchedJobs.findByResumeId(resumeId);
    console.log('cached', cached);

    if (cached.length > 0) {
      const createdAt = new Date(cached[0].created_at);
      const isExpired = Date.now() - createdAt.getTime() > DAY_IN_MS;

      if (!isExpired) {
        console.log("Serving matched jobs from DB (not expired)");
        return res.json((cached[0].jobs_json));
      }

      console.log("Cache expired — deleting old entry");
      await MatchedJobs.deleteByResumeId(resumeId);
    }

    console.log("No cached jobs — fetching from API");

    const [resume] = await Resume.findByResumeId(resumeId);
    // console.log('resume', resume);

    if (!resume || resume.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const parsedData = resume[0].parsed_data || {};
    // console.log('parsedData',parsedData);

    const jobTitle = resolveJobTitle({
      rawText: resume[0].raw_text,
      skills: parsedData.skills
    });

    console.log("Detected job title:", jobTitle);

    if (!jobTitle) {
      return res.status(400).json({ error: "Unable to detect job title from resume" });
    }

    const query = `${jobTitle} jobs`;

    let jobs;

    if (process.env.USE_FAKE_JOBS === "true") {
      console.log("Using fake jobs (DEV MODE)");
      jobs = require("../config/fakeJobs");
    } else {
      jobs = await fetchJobs(query, "India");
    }
    console.log('jobs',jobs);
    console.log('jobs length',jobs.length);

    // Remove duplicates
    const uniqueJobs = Array.from(
      new Map(jobs.map(j => [`${j.title}-${j.company}`, j])).values()
    ).slice(0, 30);

  const matchedJobs = await Promise.all(
    uniqueJobs.map((job) =>
      limit(async () => {
        const prompt = `
You are an Applicant Tracking System (ATS) that evaluates how well a resume matches a job description.

TASK:
Compare the resume and the job description and calculate a match score.

SCORING RULES:
- Score must be an integer from 0 to 10
- Base the score on:
  - Skill overlap (most important)
  - Relevant experience
  - Keywords and tools
- Do NOT consider formatting or grammar
- Do NOT invent information not present in the resume

OUTPUT FORMAT:
Return ONLY valid JSON.
Do not include explanations, markdown, or extra text.

JSON SCHEMA:
{
  "score": number,
  "missing": string[],
  "strengths": string[]
}

GUIDELINES:
- "missing": list the most important missing skills or requirements (max 5)
- "strengths": list the strongest matching skills or experiences (max 5)
- Keep each item short (1 short sentence or phrase)

RESUME:
${resume[0].raw_text.substring(0, 4000)}

JOB DESCRIPTION:
${job.description.substring(0, 4000)}
`;

        try {
          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          });

          const result = extractJSON(completion.choices[0].message.content);

          return {
            ...job,
            score: result?.score ?? 0,
            missing: result?.missing ?? [],
            strengths: result?.strengths ?? [],
          };
        } catch (err) {
          console.error("Groq error:", err.message);

          return {
            ...job,
            score: 0,
            missing: [],
            strengths: [],
          };
        }
      }),
    ),
  );

    await MatchedJobs.save(userId, resumeId, matchedJobs);
    res.json(matchedJobs.sort((a, b) => b.score - a.score));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const [resume] = await Resume.findByResumeId(resumeId);
    // console.log('resume', resume);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('resume file path', resume[0].file_path);

    const filePath = path.join(__dirname, '..', resume[0].file_path);

    // delete file
    await fsp.unlink(filePath);

    // delete DB record
    await Skill.deleteSkillsByResumeId(resumeId);
    await Resume.deleteResume(resumeId);

    res.json({ success: true, message: 'Resume deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.analyzeJobs = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    console.log('resumeId', resumeId);
    console.log('jobDescription', jobDescription);

    // Fetch parsed resume data
    const [resumes] = await Resume.findParsedDataByResumeId(resumeId);

    console.log('resumes', resumes);

    if (resumes.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }


    const resumeData = resumes[0].parsed_data;
    console.log('resumeData', resumeData);

    const flatResumeSkills = Object.values(resumeData.skills || {})
  .flat()
  .filter(Boolean);

    const prompt = `
Compare this resume with the job description and provide:

1. Match score (0-100)
2. Strong matches (skills/experience that align well)
3. Missing requirements (skills/experience that are present in the job description but not in the resume)
4. Suggestions to improve fit (give 3-5 suggestions)

Resume Skills:
${JSON.stringify(flatResumeSkills)}

Resume Experience:
${
  resumeData.experience
    ? JSON.stringify(resumeData.experience)
    : "Not specified"
}

Job Description:
${jobDescription}

STRICT RULES:
- Return ONLY valid JSON
- Do NOT include explanations
- Do NOT include comments
- Do NOT include text before or after JSON
- All array values must be plain strings

Return JSON exactly in this format:
{
  "score": number,
  "strongMatches": [],
  "missing": [],
  "suggestions": []
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON API. Respond with ONLY valid JSON. No explanations, no comments, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log("Completion:", completion);

    const aiResponse = extractJSON(completion.choices[0].message.content);
 
    console.log("AI Response:", aiResponse);

    const matchResult = {
      score: aiResponse.score,
      strongMatches: aiResponse.strongMatches,
      missing: aiResponse.missing,
      suggestions: aiResponse.suggestions,
    };

    console.log("Match Result:", matchResult);

    res.json(matchResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getname = async (req, res) => {
  try {
    console.log('inside getname');
    const userId = req.userId;
    console.log('userId:', userId);
    const firstName = await User.getFirstName(userId);
    const lastName = await User.getLastName(userId);

    console.log('firstName:', firstName);
    console.log('lastName:', lastName);

    const name = `${firstName} ${lastName}`;

    console.log('Name:', name);

    res.json(name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFirstName = async(req, res) => {
  try{
    const userId = req.userId;
    const firstName = await User.getFirstName(userId);
    console.log('First Name:', firstName);
    res.json(firstName);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

exports.getLastName = async(req, res) => {
  try{
    const userId = req.userId;
    const lastName = await User.getLastName(userId);
    console.log('Last Name:', lastName);
    res.json(lastName);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

exports.updateProfile = async(req, res) => {
  try{
    const userId = req.userId;
    const { firstname, lastname } = req.body;
    console.log('First Nameee:', firstname);
    console.log('Last Nameeee:', lastname);
    await User.updateProfile(userId, firstname, lastname);
    res.json({ success: true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

exports.deleteAccount = async(req, res) => {
  try{
    const userId = req.userId;
    await User.deleteAccount(userId);
    res.json({ ok: true });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

exports.getEmail = async(req, res) => {
  try{
    const userId = req.userId;
    const email = await User.getEmail(userId);
    console.log('Email:', email);
    res.json(email);
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

exports.setPassword = async(req, res) => {
  try{
    const userId = req.userId;
    const { data } = req.body;
    console.log('data:', data);
    const password = await User.getPassword(userId);

    const { currentPassword, newPassword, confirmPassword } = data;

    if(!await bcryptjs.compare(currentPassword, password)){
      return res.json({ error: 'Current password is incorrect', ok: false });
    }
    
    if (newPassword !== confirmPassword) {
      return res.json({ error: 'Passwords do not match', ok: false });
    }

    if (currentPassword === newPassword) {
      return res.json({ error: 'New password cannot be the same as the current password', ok: false });
    }

    if (currentPassword === "" || newPassword === "" || confirmPassword === "") {
      return res.json({ error: 'Please fill in all fields', ok: false });
    }  

    // const password = newPassword;
    const newHashedPassword = await bcryptjs.hash(newPassword, 12);
    await User.updatePassword(userId, newHashedPassword);
    return res.json({ message: 'Password updated successfully', ok: true });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message, ok: false });
  }
}

exports.setThemeBackend = async(req, res) => {
  try{
    const userId = req.userId;
    const { theme } = req.body;
    await User.updateTheme(userId, theme);
    return res.json({ message: 'Theme updated successfully', ok: true });
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message, ok: false });
  }
}

exports.getThemeBackend = async(req, res) => {
  try{
    const userId = req.userId;
    const theme = await User.getTheme(userId);
    return res.json(theme);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message, ok: false });
  }
}

exports.fetchInterviewQuestions = async(req,res) => {
  try{
    const jobTitle = req.params.jobTitle;
    let interviewQuestions = [];
    if(jobTitle === 'frontend developer'){
      const [rows]= await FrontendQuestions.fetchAll();
      interviewQuestions = rows;
    }
    else if(jobTitle === 'react developer'){
      const [rows]= await ReactQuestions.fetchAll();
      interviewQuestions = rows;
    }
    else if(jobTitle === 'backend developer'){
      const [rows]= await BackendQuestions.fetchAll();
      interviewQuestions = rows;
    }
    else if(jobTitle === 'data scientist'){
      const [rows]= await DataScientistQuestions.fetchAll();
      interviewQuestions = rows;
    }
    else if(jobTitle === 'devops engineer'){
      const [rows]= await DevOpsQuestions.fetchAll();
      interviewQuestions = rows;
    }
    return res.json(interviewQuestions);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message, ok: false });
  }
}

exports.aiResponse = async(req, res) => {
  try{
    console.log('inside aiResponse');
    const { jobTitle, activeQuestion, input } = req.body;
    console.log('jobTitle:', jobTitle);
    console.log('activeQuestion:', activeQuestion.question);
    console.log('input:', input);

    const context = `
Job Role: ${jobTitle || "Interview Candidate"}
Interview Question: ${activeQuestion.question || "N/A"}
`;


    const completion = await groq_chatbot.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content: `You are an interview preparation assistant. Explain answers clearly with examples and simple language. ${context}`,
        },
        {
          role: "user",
          content: input,
        },
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    res.json(aiResponse);
  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message, ok: false });
  }
}

// const matchedJobs = [];

//     for (const job of uniqueJobs) {
// const prompt = `
// You are an Applicant Tracking System (ATS) that evaluates how well a resume matches a job description.

// TASK:
// Compare the resume and the job description and calculate a match score.

// SCORING RULES:
// - Score must be an integer from 0 to 10
// - Base the score on:
//   - Skill overlap (most important)
//   - Relevant experience
//   - Keywords and tools
// - Do NOT consider formatting or grammar
// - Do NOT invent information not present in the resume

// OUTPUT FORMAT:
// Return ONLY valid JSON.
// Do not include explanations, markdown, or extra text.

// JSON SCHEMA:
// {
//   "score": number,
//   "missing": string[],
//   "strengths": string[]
// }

// GUIDELINES:
// - "missing": list the most important missing skills or requirements (max 5)
// - "strengths": list the strongest matching skills or experiences (max 5)
// - Keep each item short (1 short sentence or phrase)

// RESUME:
// ${resume[0].raw_text.substring(0, 4000)}

// JOB DESCRIPTION:
// ${job.description.substring(0, 4000)}
// `;


//       const completion = await groq.chat.completions.create({
//         model: "llama-3.1-8b-instant",
//         messages: [{ role: "user", content: prompt }],
//         temperature: 0.2
//       });

//       const result = extractJSON(completion.choices[0].message.content);

//       matchedJobs.push({
//           ...job,
//           score: result.score,
//           missing: result.missing,
//           strengths: result.strengths
//         });
//     }
