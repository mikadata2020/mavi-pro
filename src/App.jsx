import React, { useState, useEffect, useRef, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import SessionManager from './components/SessionManager';
import VideoWorkspace from './components/VideoWorkspace';
import Header from './components/Header';
import NewProjectDialog from './components/NewProjectDialog';
import OpenProjectDialog from './components/OpenProjectDialog';
import Login from './components/Login';
import CollaborationOverlay from './components/features/CollaborationOverlay';
import BroadcastControls from './components/features/BroadcastControls';
import { saveProject, getProjectByName, updateProject } from './utils/database';
import { importProject } from './utils/projectExport';
import StreamHandler from './utils/streamHandler';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

// Lazy load components
const AnalysisDashboard = React.lazy(() => import('./components/AnalysisDashboard'));
const ElementRearrangement = React.lazy(() => import('./components/ElementRearrangement'));
const CycleTimeAnalysis = React.lazy(() => import('./components/CycleTimeAnalysis'));
const CycleAggregation = React.lazy(() => import('./components/CycleAggregation'));
const StandardTime = React.lazy(() => import('./components/StandardTime'));
const WasteElimination = React.lazy(() => import('./components/WasteElimination'));
const BestWorstCycle = React.lazy(() => import('./components/BestWorstCycle'));
const VideoComparison = React.lazy(() => import('./components/VideoComparison'));
const Help = React.lazy(() => import('./components/Help'));
const TherbligAnalysis = React.lazy(() => import('./components/TherbligAnalysis'));
const StandardWorkCombinationSheet = React.lazy(() => import('./components/StandardWorkCombinationSheet'));
const StatisticalAnalysis = React.lazy(() => import('./components/StatisticalAnalysis'));
const MTMCalculator = React.lazy(() => import('./components/MTMCalculator'));
const AllowanceCalculator = React.lazy(() => import('./components/AllowanceCalculator'));
const YamazumiChart = React.lazy(() => import('./components/YamazumiChart'));
const MultiAxialAnalysis = React.lazy(() => import('./components/MultiAxialAnalysis'));
const MultiCameraFusion = React.lazy(() => import('./components/MultiCameraFusion'));
const ManualCreation = React.lazy(() => import('./components/ManualCreation'));
const VRTrainingMode = React.lazy(() => import('./components/VRTrainingMode'));
const KnowledgeBase = React.lazy(() => import('./components/KnowledgeBase'));
const ObjectTracking = React.lazy(() => import('./components/ObjectTracking'));
const PredictiveMaintenance = React.lazy(() => import('./components/PredictiveMaintenance'));
const BroadcastManager = React.lazy(() => import('./components/features/BroadcastManager'));
const BroadcastViewer = React.lazy(() => import('./components/features/BroadcastViewer'));
const MachineLearningData = React.lazy(() => import('./components/MachineLearningData'));
const ActionRecognition = React.lazy(() => import('./components/ActionRecognition'));
const SpaghettiChart = React.lazy(() => import('./components/SpaghettiChart'));
const WorkflowGuide = React.lazy(() => import('./components/WorkflowGuide'));
const FileExplorer = React.lazy(() => import('./components/FileExplorer'));
const PublicManualViewer = React.lazy(() => import('./components/PublicManualViewer'));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    color: 'var(--text-secondary)',
    flexDirection: 'column',
    gap: '15px'
  }}>
    <div className="spinner" style={{
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255,255,255,0.1)',
      borderLeftColor: 'var(--accent-blue)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <div>Loading...</div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function AppContent() {
  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

  // Broadcast state
  const [watchRoomId, setWatchRoomId] = useState(null);
  const videoRef = useRef(null);
  const [streamHandler] = useState(() => new StreamHandler());
  const [remoteCursor, setRemoteCursor] = useState({ x: null, y: null, label: null });
  const [lastDrawingAction, setLastDrawingAction] = useState(null);

  // Global broadcast/chat state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const broadcastManagerRef = useRef(null);

  // State for QR code manual viewing
  const [qrManualId, setQrManualId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    if (watchId) {
      setWatchRoomId(watchId);
    }

    const hash = window.location.hash;
    if (hash.startsWith('#/manual/')) {
      const manualPath = hash.substring(9);
      const [manualId] = manualPath.split('?');
      if (manualId) {
        setQrManualId(manualId);
        navigate('/knowledge-base');
      }
    }
  }, [navigate]);

  // Project management state
  const [currentProject, setCurrentProject] = useState(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showOpenProjectDialog, setShowOpenProjectDialog] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLoadSession = (session) => {
    setMeasurements(session.measurements);
    navigate('/');
  };

  const handleLoginSuccess = () => {
    navigate('/workflow-guide');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentProject(null);
    setMeasurements([]);
    setVideoSrc(null);
    setVideoName('');
    navigate('/');
  };

  const handleLoadVideoFromKB = (videoUrl, videoTitle) => {
    setVideoSrc(videoUrl);
    setVideoName(videoTitle || 'Knowledge Base Video');
    navigate('/');
  };

  const handleNewProject = async (projectName, videoFile) => {
    try {
      const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type });
      await saveProject(projectName, videoBlob, videoFile.name, [], null);

      setCurrentProject({ name: projectName });
      setVideoSrc(URL.createObjectURL(videoBlob));
      setVideoName(videoFile.name);
      setMeasurements([]);
      setShowNewProjectDialog(false);
      navigate('/');
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
      navigate('/');
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
      const existing = await getProjectByName(projectData.projectName);
      if (existing) {
        const newName = prompt('Proyek sudah ada. Masukkan nama baru:', projectData.projectName + ' (imported)');
        if (!newName) return;
        projectData.projectName = newName;
      }
      await saveProject(
        projectData.projectName,
        projectData.videoBlob,
        projectData.videoName,
        projectData.measurements,
        projectData.narration
      );
      handleOpenProject(projectData.projectName);
    } catch (error) {
      console.error('Error importing project:', error);
      alert('Gagal import proyek: ' + error.message);
    }
  };

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
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [measurements, currentProject]);

  const handleRemoteInteraction = (data) => {
    if (data.type === 'cursor') {
      setRemoteCursor({ x: data.x, y: data.y, label: 'Remote Viewer' });
    } else if (data.type === 'draw' || data.type === 'start' || data.type === 'end') {
      setLastDrawingAction(data);
    } else if (data.type === 'click') {
      console.log('Remote click at', data.x, data.y);
    }
  };

  const handleToggleMute = () => {
    if (broadcastManagerRef.current) {
      broadcastManagerRef.current.toggleMute();
    }
  };

  const handleSendMessage = (message) => {
    if (broadcastManagerRef.current) {
      broadcastManagerRef.current.sendChatMessage(message);
    }
  };

  const handleStopBroadcast = () => {
    if (broadcastManagerRef.current) {
      broadcastManagerRef.current.stopBroadcast();
    }
  };

  if (watchRoomId) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <BroadcastViewer roomId={watchRoomId} onClose={() => setWatchRoomId(null)} />
      </Suspense>
    );
  }

  if (qrManualId) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <PublicManualViewer
          manualId={qrManualId}
          onClose={() => setQrManualId(null)}
        />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isDashboard = location.pathname === '/';

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CollaborationOverlay cursor={remoteCursor} lastDrawingAction={lastDrawingAction} />

      <BroadcastControls
        isBroadcasting={isBroadcasting}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onStopBroadcast={handleStopBroadcast}
        userName={user?.email || "Host"}
      />

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{
          position: 'absolute',
          right: sidebarCollapsed ? '10px' : '70px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.2rem',
          zIndex: 1001,
          transition: 'right 0.3s ease',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.3)'
        }}
        title={sidebarCollapsed ? 'Show Menu' : 'Hide Menu'}
      >
        {sidebarCollapsed ? '◀' : '▶'}
      </button>

      <div className="main-content" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Persistent VideoWorkspace - hidden when not on dashboard */}
        <div
          className="workspace-area"
          style={{
            flex: 1,
            display: isDashboard ? 'flex' : 'none',
            flexDirection: 'column',
            padding: '10px',
            gap: '10px'
          }}
        >
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

        {/* Other Views Rendered via Routes with Lazy Loading */}
        <div style={{ flex: 1, display: isDashboard ? 'none' : 'block', overflow: 'hidden' }}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={null} /> {/* Handled by persistent div */}
              <Route path="/analysis" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><AnalysisDashboard measurements={measurements} /></div>} />
              <Route path="/rearrangement" element={<div style={{ padding: '10px', overflow: 'hidden', height: '100%' }}><ElementRearrangement measurements={measurements} onUpdateMeasurements={setMeasurements} videoSrc={videoSrc} /></div>} />
              <Route path="/cycle-analysis" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><CycleTimeAnalysis /></div>} />
              <Route path="/swcs" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><StandardWorkCombinationSheet /></div>} />
              <Route path="/aggregation" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><CycleAggregation measurements={measurements} /></div>} />
              <Route path="/standard-time" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><StandardTime measurements={measurements} /></div>} />
              <Route path="/waste-elimination" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><WasteElimination measurements={measurements} onUpdateMeasurements={setMeasurements} /></div>} />
              <Route path="/therblig" element={<div style={{ overflow: 'hidden', height: '100%' }}><TherbligAnalysis measurements={measurements} /></div>} />
              <Route path="/statistical-analysis" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><StatisticalAnalysis measurements={measurements} /></div>} />
              <Route path="/mtm" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><MTMCalculator /></div>} />
              <Route path="/allowance" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><AllowanceCalculator /></div>} />
              <Route path="/best-worst" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><BestWorstCycle measurements={measurements} /></div>} />
              <Route path="/yamazumi" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><YamazumiChart measurements={measurements} /></div>} />
              <Route path="/multi-axial" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><MultiAxialAnalysis /></div>} />
              <Route path="/manual-creation" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><ManualCreation /></div>} />
              <Route path="/spaghetti-chart" element={<div style={{ overflow: 'hidden', height: '100%' }}><SpaghettiChart currentProject={currentProject} projectMeasurements={measurements} /></div>} />
              <Route path="/ml-data" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><MachineLearningData videoSrc={videoSrc} /></div>} />
              <Route path="/object-tracking" element={<div style={{ overflow: 'hidden', height: '100%' }}><ObjectTracking videoSrc={videoSrc} measurements={measurements} onUpdateMeasurements={setMeasurements} /></div>} />
              <Route path="/predictive-maintenance" element={<div style={{ overflow: 'hidden', height: '100%' }}><PredictiveMaintenance measurements={measurements} /></div>} />
              <Route path="/comparison" element={<div style={{ padding: '10px', overflow: 'hidden', height: '100%' }}><VideoComparison /></div>} />
              <Route path="/help" element={<div style={{ overflow: 'hidden', height: '100%' }}><Help /></div>} />
              <Route path="/multi-camera" element={<div style={{ overflow: 'hidden', height: '100%' }}><MultiCameraFusion /></div>} />
              <Route path="/vr-training" element={<div style={{ overflow: 'hidden', height: '100%' }}><VRTrainingMode measurements={measurements} videoSrc={videoSrc} videoName={videoName} currentProject={currentProject} /></div>} />
              <Route path="/knowledge-base" element={<div style={{ overflow: 'hidden', height: '100%' }}><KnowledgeBase onLoadVideo={handleLoadVideoFromKB} /></div>} />
              <Route path="/broadcast" element={
                <div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}>
                  <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h2 style={{ color: 'var(--text-primary)' }}>📡 Broadcast Video</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Share your video stream with other devices in real-time.</p>
                    <BroadcastManager
                      ref={broadcastManagerRef}
                      onRemoteInteraction={handleRemoteInteraction}
                      isBroadcasting={isBroadcasting}
                      setIsBroadcasting={setIsBroadcasting}
                      isMuted={isMuted}
                      setIsMuted={setIsMuted}
                      chatMessages={chatMessages}
                      setChatMessages={setChatMessages}
                    />
                  </div>
                </div>
              } />
              <Route path="/action-recognition" element={<div style={{ padding: '10px', overflowY: 'auto', height: '100%' }}><ActionRecognition videoSrc={videoSrc} onActionsDetected={setMeasurements} /></div>} />

              {/* Workflow Guide */}
              <Route path="/workflow-guide" element={<div style={{ overflow: 'hidden', height: '100%' }}><WorkflowGuide /></div>} />

              {/* File Explorer */}
              <Route path="/files" element={<div style={{ overflow: 'hidden', height: '100%' }}><FileExplorer /></div>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>

      <Header
        videoName={videoName}
        onUpload={(file) => {
          const url = URL.createObjectURL(file);
          setVideoSrc(url);
          setVideoName(file.name);
        }}
        onOpenSessionManager={() => setShowSessionManager(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        sidebarCollapsed={sidebarCollapsed}
      />

      {showSessionManager && (
        <SessionManager
          onLoadSession={handleLoadSession}
          onClose={() => setShowSessionManager(false)}
        />
      )}

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
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
