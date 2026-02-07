import React from 'react';
import { useState } from 'react';
import Toolbar from './Toolbar';
import Canvas from './Canvas';
import ThreeDView from './ThreeDView';
import AttributePanel from './AttributePanel';
import FloorNavigator from './FloorNavigator';
import NodeModal from './modals/NodeModal';
import CorridorModal from './modals/CorridorModal';
import AttentionModal from './modals/AttentionModal';
import FloorModal from './modals/FloorModal';
import ProjectIdModal from './modals/ProjectIdModal';
import JourneyReflectionModal from './modals/JourneyReflectionModal';

const Layout: React.FC = () => {
  const [currentView, setCurrentView] = useState<'2d' | '3d'>('2d');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <Toolbar currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-1 bg-gray-100 relative">
          {currentView === '2d' ? (
            <>
              <Canvas />
              <FloorNavigator />
            </>
          ) : (
            <ThreeDView />
          )}
        </div>

        {/* Attribute Panel */}
        {currentView === '2d' && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-lg">
            <AttributePanel />
          </div>
        )}
      </div>

      {/* Modals */}
      <NodeModal />
      <CorridorModal />
      <AttentionModal />
      <FloorModal />
      <ProjectIdModal />
      <JourneyReflectionModal />
    </div>
  );
};

export default Layout;