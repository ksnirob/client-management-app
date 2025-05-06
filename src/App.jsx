import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Finances from './pages/Finances';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/finances" element={<Finances />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  );
}

export default App; 