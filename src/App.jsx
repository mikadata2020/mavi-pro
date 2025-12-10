import React, { useState, useEffect, useRef } from 'react';
import SessionManager from './components/SessionManager';
import VideoWorkspace from './components/VideoWorkspace';
import Header from './components/Header';
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
import NewProjectDialog from './components/NewProjectDialog';
import OpenProjectDialog from './components/OpenProjectDialog';
import Login from './components/Login';
import StandardWorkCombinationSheet from './components/StandardWorkCombinationSheet';
import StatisticalAnalysis from './components/StatisticalAnalysis';
import MTMCalculator from './components/MTMCalculator';
import AllowanceCalculator from './components/AllowanceCalculator';
import YamazumiChart from './components/YamazumiChart';
import MultiAxialAnalysis from './components/MultiAxialAnalysis';
import MultiCameraFusion from './components/MultiCameraFusion';
import ManualCreation from './components/ManualCreation';
import VRTrainingMode from './components/VRTrainingMode';
import KnowledgeBase from './components/KnowledgeBase';
import ObjectTracking from './components/ObjectTracking';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import BroadcastManager from './components/features/BroadcastManager';
import BroadcastViewer from './components/features/BroadcastViewer';
import CollaborationOverlay from './components/features/CollaborationOverlay';
import BroadcastControls from './components/features/BroadcastControls';
import MachineLearningData from './components/MachineLearningData';
import ActionRecognition from './components/ActionRecognition';
import SpaghettiChart from './components/SpaghettiChart';
import WorkflowGuide from './components/WorkflowGuide';
import FileExplorer from './components/FileExplorer';
import { saveProject, getProjectByName, updateProject } from './utils/database';
import { importProject } from './utils/projectExport';
import StreamHandler from './utils/streamHandler';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('workflow-guide');
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
    // Check for "watch" query param
    const params = new URLSearchParams(window.location.search);
    const watchId = params.get('watch');
    if (watchId) {
      setWatchRoomId(watchId);
    }

    // Check for manual route from QR code scan (e.g., /#/manual/abc123?doc=...&title=...)
    const hash = window.location.hash;
    if (hash.startsWith('#/manual/')) {
      const manualPath = hash.substring(9); // Remove "#/manual/"
      const [manualId, queryString] = manualPath.split('?');
      if (manualId) {
        setQrManualId(manualId);
        setCurrentView('knowledge-base');
        // Clear hash after processing
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

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

  // Load video from Knowledge Base
  const handleLoadVideoFromKB = (videoUrl, videoTitle) => {
    setVideoSrc(videoUrl);
    setVideoName(videoTitle || 'Knowledge Base Video');
    setCurrentView('dashboard'); // Show VideoWorkspace
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
    return <BroadcastViewer roomId={watchRoomId} onClose={() => setWatchRoomId(null)} />;
  }

  // Public Manual Viewer - accessible without login via QR code
  if (qrManualId) {
    const PublicManualViewer = React.lazy(() => import('./components/PublicManualViewer'));
    return (
      <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}><p>Loading...</p></div>}>
        <PublicManualViewer
          manualId={qrManualId}
          onClose={() => {
            setQrManualId(null);
            // Don't require login, just show login page
          }}
        />
      </React.Suspense>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <LanguageProvider>
      <div className="app-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <CollaborationOverlay cursor={remoteCursor} lastDrawingAction={lastDrawingAction} />

        {/* Global Broadcast Controls */}
        <BroadcastControls
          isBroadcasting={isBroadcasting}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onStopBroadcast={handleStopBroadcast}
          userName="Host"
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
          {/* VideoWorkspace - Always rendered but hidden when not in dashboard */}
          <div
            className="workspace-area"
            style={{
              flex: 1,
              display: currentView === 'dashboard' ? 'flex' : 'none',
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

          {/* Persistent BroadcastManager (Hidden when not in broadcast view) */}
          <div style={{ display: currentView === 'broadcast' ? 'block' : 'none', flex: 1, padding: '10px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>📡 Broadcast Video</h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Share your video stream with other devices in real-time.
              </p>
              <div style={{
                padding: '15px',
                backgroundColor: 'rgba(0, 120, 212, 0.1)',
                border: '1px solid #0078d4',
                borderRadius: '8px',
                marginBottom: '15px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                💡 <strong>Tip:</strong> Make sure you have a video source active (file, webcam, or IP camera) before starting the broadcast.
              </div>
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


          {currentView === 'analysis' ? (
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
          ) : currentView === 'yamazumi' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <YamazumiChart measurements={measurements} />
            </div>
          ) : currentView === 'multi-axial' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <MultiAxialAnalysis />
            </div>
          ) : currentView === 'manual-creation' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <ManualCreation />
            </div>
          ) : currentView === 'ml-data' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <MachineLearningData videoSrc={videoSrc} />
            </div>
          ) : currentView === 'spaghetti-chart' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SpaghettiChart
                currentProject={currentProject}
                projectMeasurements={measurements}
              />
            </div>
          ) : currentView === 'multi-camera' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MultiCameraFusion />
            </div>
          ) : currentView === 'vr-training' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <VRTrainingMode
                measurements={measurements}
                videoSrc={videoSrc}
                videoName={videoName}
                currentProject={currentProject}
              />
            </div>
          ) : currentView === 'knowledge-base' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <KnowledgeBase onLoadVideo={handleLoadVideoFromKB} />
            </div>
          ) : currentView === 'action-recognition' ? (
            <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
              <ActionRecognition videoSrc={videoSrc} onActionsDetected={setMeasurements} />
            </div>
          ) : currentView === 'object-tracking' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ObjectTracking
                videoSrc={videoSrc}
                measurements={measurements}
                onUpdateMeasurements={setMeasurements}
              />
            </div>
          ) : currentView === 'predictive-maintenance' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PredictiveMaintenance
                measurements={measurements}
              />
            </div>
          ) : currentView === 'workflow-guide' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <WorkflowGuide onNavigate={(view) => setCurrentView(view)} />
            </div>
          ) : currentView === 'file-explorer' ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FileExplorer onNavigate={(view) => setCurrentView(view)} />
            </div>
          ) : null}
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
          sidebarCollapsed={sidebarCollapsed}
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
    </LanguageProvider >
  );
}

export default App;
