import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Finances from './pages/Finances';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = (projectId) => {
    // For demo: just add to the project.files array in state
    // For real: upload to server, then update db.json or backend
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/finances" element={<Finances />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App; 