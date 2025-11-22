import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoWorkspace from './components/VideoWorkspace';
import FeatureMenu from './components/FeatureMenu';
import AnalysisDashboard from './components/AnalysisDashboard';
import ElementRearrangement from './components/ElementRearrangement';
import ComparisonDashboard from './components/ComparisonDashboard';
import SessionManager from './components/SessionManager';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'features', 'analysis'
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null); // Add video state at App level
  const [videoName, setVideoName] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFeatureSelect = (category, feature) => {
    setSelectedFeature({ category, feature });
  };

  const handleLoadSession = (session) => {
    setMeasurements(session.measurements);
    setCurrentView('dashboard');
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header
        videoName={videoName}
        onUpload={(file) => {
          const url = URL.createObjectURL(file);
          setVideoSrc(url);
          setVideoName(file.name);
        }}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSessionManager={() => setShowSessionManager(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="main-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {currentView === 'dashboard' ? (
          <div className="workspace-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px' }}>
            <VideoWorkspace
              onMeasurementsChange={setMeasurements}
              videoSrc={videoSrc}
              setVideoSrc={setVideoSrc}
              measurements={measurements}
            />
          </div>
        ) : currentView === 'analysis' ? (
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
            <AnalysisDashboard measurements={measurements} />
          </div>
        ) : currentView === 'rearrangement' ? (
          <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
            <ElementRearrangement
              measurements={measurements}
              videoSrc={videoSrc}
              onUpdateMeasurements={setMeasurements}
            />
          </div>
        ) : currentView === 'comparison' ? (
          <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
            <ComparisonDashboard />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', gap: '10px', padding: '10px' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <FeatureMenu onFeatureSelect={handleFeatureSelect} />
            </div>
            <div style={{ flex: 2, backgroundColor: 'var(--bg-secondary)', padding: '20px', overflowY: 'auto' }}>
              {selectedFeature ? (
                <div>
                  <h2 style={{ color: 'var(--accent-blue)', marginTop: 0 }}>{selectedFeature.category}</h2>
                  <h3 style={{ color: 'var(--text-primary)' }}>{selectedFeature.feature}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Fitur ini akan diimplementasikan. Silakan pilih fitur lain dari menu.
                  </p>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '50px' }}>
                  <h3>Selamat Datang di Menu Fitur</h3>
                  <p>Pilih kategori dan fitur dari menu di sebelah kiri untuk melihat detail.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Session Manager Modal */}
      {showSessionManager && (
        <SessionManager
          onLoadSession={handleLoadSession}
          onClose={() => setShowSessionManager(false)}
        />
      )}
    </div>
  );
}

export default App;
