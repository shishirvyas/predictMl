const express = require('express');  
const cors = require('cors');  
const bodyParser = require('body-parser');  
const mongoose = require('mongoose');  
const axios = require('axios');  
  
const app = express();  
app.use(cors());  
app.use(bodyParser.json());  
  
// Connect to MongoDB (replace with your URI)  
mongoose.connect('mongodb://localhost:27017/dropoutDB', {  
  useNewUrlParser: true,  
  useUnifiedTopology: true,  
});  
  
// Schema Definitions  
const candidateSchema = new mongoose.Schema({  
  personalInfo: {  
    name: String,  
    email: String,  
    age: Number,  
    gender: String,  
    location: String,  
  },  
  enrollmentHistory: {  
    totalEnrolled: Number,  
    totalCompleted: Number,  
    averageDurationWeeks: Number,  
    dropoutReasons: [String],  
  },  
  educationBackground: {  
    highestQualification: String,  
    fieldOfStudy: String,  
    institutionType: String,  
    GPA: Number,  
  },  
  learningPreferences: {  
    learningStyle: String,  
    weeklyStudyHours: Number,  
  },  
  quizResponses: [{  
    questionId: String,  
    answer: String,  
  }],  
  dropoutRiskScore: Number,  
  riskCategory: String,  
});  
  
const Candidate = mongoose.model('Candidate', candidateSchema);  
  
// Example Quiz Questions stored in-memory (can move to DB)  
const quizQuestions = [  
  {  
    id: 'q1',  
    question: 'How often do you complete tasks on time?',  
    options: ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'],  
  },  
  {  
    id: 'q2',  
    question: 'If you face difficulty in a course, what do you usually do?',  
    options: [  
      'Seek help immediately',  
      'Try to figure it out myself',  
      'Ignore and move on',  
      'Drop the course',  
    ],  
  },  
  {  
    id: 'q3',  
    question: 'Rate your motivation level to complete online courses.',  
    options: ['Very High', 'High', 'Medium', 'Low', 'Very Low'],  
  },  
];  
  
// API to get quiz questions  
app.get('/api/quizzes', (req, res) => {  
  res.json(quizQuestions);  
});  
  
// API to submit candidate data and quiz responses  
app.post('/api/candidates', async (req, res) => {  
  try {  
    const candidateData = req.body;  
  
    // Save candidate info without risk initially  
    let candidate = new Candidate(candidateData);  
    await candidate.save();  
  
    // Call ML service for dropout prediction  
    const mlResponse = await axios.post('http://localhost:5000/predict', candidateData);  
  
    // Update candidate with risk score and category  
    candidate.dropoutRiskScore = mlResponse.data.dropoutRiskScore;  
    candidate.riskCategory = mlResponse.data.riskCategory;  
    await candidate.save();  
  
    res.json({  
      message: 'Candidate saved and prediction done',  
      dropoutRiskScore: candidate.dropoutRiskScore,  
      riskCategory: candidate.riskCategory,  
    });  
  } catch (error) {  
    console.error(error);  
    res.status(500).json({ error: 'Internal server error' });  
  }  
});  
  
// Start server  
const PORT = 4000;  
app.listen(PORT, () => {  
  console.log(`Backend server running on port ${PORT}`);  
});  
