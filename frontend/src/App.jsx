import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import JobCard from './components/JobCard';
import SessionList from './components/SessionList';
import Chat from './pages/Chat';
import JobCardService from './components/JobCardService';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/sessions" element={<SessionList />} />
        <Route path="/jobcard" element={<JobCard />} />
        <Route path="/jobcardservice" element={<JobCardService />} />
      </Routes>
    </Router>
  );
}

export default App;