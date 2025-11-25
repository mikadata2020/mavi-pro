import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoWorkspace from './components/VideoWorkspace';
import FeatureMenu from './components/FeatureMenu';
import AnalysisDashboard from './components/AnalysisDashboard';
import ElementRearrangement from './components/ElementRearrangement';
import CycleTimeAnalysis from './components/CycleTimeAnalysis';
import CycleAggregation from './components/CycleAggregation';
import StandardTime from './components/StandardTime';
import WasteElimination from './components/WasteElimination';
import BestWorstCycle from './components/BestWorstCycle';
import VideoComparison from './components/VideoComparison';
import Help from './components/Help';
import TherbligAnalysis from './components/TherbligAnalysis';
import SessionManager from './components/SessionManager';
import NewProjectDialog from './components/NewProjectDialog';
import OpenProjectDialog from './components/OpenProjectDialog';
import Login from './components/Login';
import StandardWorkCombinationSheet from './components/StandardWorkCombinationSheet';
import StatisticalAnalysis from './components/StatisticalAnalysis';
import MTMCalculator from './components/MTMCalculator';
import AllowanceCalculator from './components/AllowanceCalculator';
import { saveProject, getProjectByName, updateProject } from './utils/database';
import { importProject } from './utils/projectExport';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  // Project management state
  const [currentProject, setCurrentProject] = useState(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showOpenProjectDialog, setShowOpenProjectDialog] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFeatureSelect = (category, feature) => {
    if (feature === 'Standard Work Combination Sheet') {
      setCurrentView('swcs');
      return;
    }
    setSelectedFeature({ category, feature });
  };

  const handleLoadSession = (session) => {
    setMeasurements(session.measurements);
    setCurrentView('dashboard');
  };

  // Authentication handlers
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
    // Reset application state
    setCurrentProject(null);
    setMeasurements([]);
    setVideoSrc(null);
    setVideoName('');
    setCurrentView('dashboard');
  };

  // Project management handlers
  const handleNewProject = async (projectName, videoFile) => {
    try {
      const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type });
      await saveProject(projectName, videoBlob, videoFile.name, [], null);

      setCurrentProject({ name: projectName });
      setVideoSrc(URL.createObjectURL(videoBlob));
      setVideoName(videoFile.name);
      setMeasurements([]);
      setShowNewProjectDialog(false);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Gagal membuat proyek: ' + error.message);
    }
  };

  const handleOpenProject = async (projectName) => {
    try {
      const project = await getProjectByName(projectName);
      if (!project) {
        alert('Proyek tidak ditemukan');
        return;
      }

      setCurrentProject({ name: projectName });
      setVideoSrc(URL.createObjectURL(project.videoBlob));
      setVideoName(project.videoName);
      setMeasurements(project.measurements || []);
      setShowOpenProjectDialog(false);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error opening project:', error);
      alert('Gagal membuka proyek: ' + error.message);
    }
  };

  const handleExportProject = async () => {
    if (!currentProject) {
      alert('Tidak ada proyek yang aktif');
      return;
    }

    try {
      const project = await getProjectByName(currentProject.name);
      const { exportProject } = await import('./utils/projectExport');
      await exportProject(project);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Gagal export proyek: ' + error.message);
    }
  };

  const handleImportProject = async (zipFile) => {
    try {
      const projectData = await importProject(zipFile);

      // Check if project name already exists
      const existing = await getProjectByName(projectData.projectName);
      if (existing) {
        const newName = prompt('Proyek sudah ada. Masukkan nama baru:', projectData.projectName + ' (imported)');
        if (!newName) return;
        projectData.projectName = newName;
      }

      // Save to IndexedDB
      await saveProject(
        projectData.projectName,
        projectData.videoBlob,
        projectData.videoName,
        projectData.measurements,
        projectData.narration
      );

      // Load project
      handleOpenProject(projectData.projectName);
    } catch (error) {
      console.error('Error importing project:', error);
      alert('Gagal import proyek: ' + error.message);
    }
  };

  // Auto-save project when measurements change
  useEffect(() => {
    if (!currentProject) return;

    const saveTimer = setTimeout(async () => {
      try {
        await updateProject(currentProject.name, {
          measurements,
          lastModified: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error auto-saving project:', error);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(saveTimer);
  }, [measurements, currentProject]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <LanguageProvider>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'row', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
        <div className="main-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {currentView === 'dashboard' ? (
            <div className="workspace-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px', gap: '10px' }}>
              <VideoWorkspace
                measurements={measurements}
                onUpdateMeasurements={setMeasurements}
                videoSrc={videoSrc}
                onVideoChange={setVideoSrc}
                videoName={videoName}
                onVideoNameChange={setVideoName}
                currentProject={currentProject}
                onNewProject={() => setShowNewProjectDialog(true)}
                onOpenProject={() => setShowOpenProjectDialog(true)}
                onExportProject={handleExportProject}
                onImportProject={handleImportProject}
                onLogout={handleLogout}
              />
            </div>
          ) : currentView === 'features' ? (
            <FeatureMenu onFeatureSelect={handleFeatureSelect} />
          ) : currentView === 'analysis' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <AnalysisDashboard measurements={measurements} />
            </div>
          ) : currentView === 'rearrangement' ? (
            <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
              <ElementRearrangement measurements={measurements} onUpdateMeasurements={setMeasurements} videoSrc={videoSrc} />
            </div>
          ) : currentView === 'cycle-analysis' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <CycleTimeAnalysis />
            </div>
          ) : currentView === 'swcs' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <StandardWorkCombinationSheet />
            </div>
          ) : currentView === 'aggregation' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <CycleAggregation measurements={measurements} />
            </div>
          ) : currentView === 'standard-time' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <StandardTime measurements={measurements} />
            </div>
          ) : currentView === 'waste-elimination' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <WasteElimination measurements={measurements} onUpdateMeasurements={setMeasurements} />
            </div>
          ) : currentView === 'best-worst' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <BestWorstCycle measurements={measurements} />
            </div>
          ) : currentView === 'video-comparison' ? (
            <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
              <VideoComparison />
            </div>
          ) : currentView === 'help' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Help />
            </div>
          ) : currentView === 'spaghetti' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <TherbligAnalysis measurements={measurements} />
            </div>
          ) : currentView === 'statistical-analysis' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <StatisticalAnalysis measurements={measurements} />
            </div>
          ) : currentView === 'mtm-calculator' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <MTMCalculator />
            </div>
          ) : currentView === 'allowance-calculator' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <AllowanceCalculator />
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

        {/* Session Manager Modal */}
        {showSessionManager && (
          <SessionManager
            onLoadSession={handleLoadSession}
            onClose={() => setShowSessionManager(false)}
          />
        )}

        {/* Project Management Dialogs */}
        <NewProjectDialog
          isOpen={showNewProjectDialog}
          onClose={() => setShowNewProjectDialog(false)}
          onSubmit={handleNewProject}
        />

        <OpenProjectDialog
          isOpen={showOpenProjectDialog}
          onClose={() => setShowOpenProjectDialog(false)}
          onOpenProject={handleOpenProject}
        />
      </div>
    </LanguageProvider>
  );
}

export default App;
