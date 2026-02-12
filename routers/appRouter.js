const express = require('express');
const appRouter = express.Router();
const multer = require('multer');

const appController = require('../controllers/appController');

// Configure file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

appRouter.post(
  "/api/resume/upload",
  appController.verifyToken,
  upload.single("resume"),
  appController.uploadResume
);
appRouter.get('/api/resume/my-resumes/:userId', appController.verifyToken, appController.getMyResumes);
appRouter.get('/api/resume/download/:resumeId/:userId', appController.verifyToken, appController.downloadResume);
appRouter.delete('/api/resume/delete/:resumeId', appController.verifyToken, appController.deleteResume);

appRouter.post('/api/analyze/extract-skills', appController.verifyToken, appController.extractSkills);
appRouter.post('/api/stats/update', appController.verifyToken, appController.updateStats);
appRouter.post('/api/analyze/match-job', appController.verifyToken, appController.analyzeJobs);

appRouter.post('/api/jobs/match-real', appController.verifyToken, appController.matchRealJobs);

appRouter.get('/api/user/name/:userId', appController.verifyToken, appController.getname);
appRouter.get('/api/user/first-name/:userId', appController.verifyToken, appController.getFirstName);
appRouter.get('/api/user/last-name/:userId', appController.verifyToken, appController.getLastName);
appRouter.get('/api/user/email/:userId', appController.verifyToken, appController.getEmail);
appRouter.post('/api/user/profile/update', appController.verifyToken, appController.updateProfile);
appRouter.delete('/api/user/delete/:userId', appController.verifyToken, appController.deleteAccount);

appRouter.post('/api/user/password', appController.verifyToken, appController.setPassword);

appRouter.post('/api/user/theme', appController.verifyToken, appController.setThemeBackend);
appRouter.get('/api/user/theme', appController.verifyToken, appController.getThemeBackend);


appRouter.get('/api/questions/:jobTitle', appController.verifyToken, appController.fetchInterviewQuestions);

appRouter.post('/api/ai-response', appController.verifyToken, appController.aiResponse);


module.exports = appRouter;