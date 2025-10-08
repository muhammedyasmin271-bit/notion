import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppContext } from '../../context/AppContext';

const WorkerReports = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAppContext();
  
  const [project, setProject] = useState(null);
  const [report, setReport] = useState('');
  const [answers, setAnswers] = useState({
    question1: '',
    question2: '',
    question3: '',
    question4: '',
    question5: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const questions = [
    "How would you rate the overall progress of this project? (1-10)",
    "What are the main challenges you've encountered while working on this project?",
    "What resources or support do you need to complete this project successfully?",
    "How satisfied are you with the project requirements and clarity? (1-10)",
    "Any additional feedback or suggestions for improving this project?"
  ];

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`http://localhost:9000/api/projects/${projectId}`, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!report.trim()) {
      alert('Please write a report before submitting.');
      return;
    }

    setSaving(true);
    
    const reportData = {
      projectId,
      report: report.trim(),
      answers,
      submittedBy: user?.name || user?.username,
      submittedAt: new Date().toISOString()
    };

    try {
      console.log('Submitting report:', reportData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Report submitted successfully!');
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAnswerChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center`}>
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Worker Reports</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Project: {project?.title || project?.name || 'Unknown Project'}
            </p>
          </div>
        </div>

        <div className={`rounded-lg border p-6 mb-8 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Project Report</h2>
          </div>
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Write your detailed project report here. Include progress updates, challenges faced, accomplishments, and any other relevant information..."
            className={`w-full h-64 p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <div className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {report.length} characters
          </div>
        </div>

        <div className={`rounded-lg border p-6 mb-8 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-xl font-semibold mb-6">Analysis Questions</h2>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index}>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {index + 1}. {question}
                </label>
                <textarea
                  value={answers[`question${index + 1}`]}
                  onChange={(e) => handleAnswerChange(`question${index + 1}`, e.target.value)}
                  placeholder="Your answer..."
                  className={`w-full h-24 p-3 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={saving || !report.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              saving || !report.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerReports;