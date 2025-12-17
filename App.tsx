import React from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandTracker from './components/HandTracker';

const App = () => {
  return (
    <div className="relative w-full h-screen bg-[#050103] overflow-hidden text-white selection:bg-pink-500 selection:text-white">
      <Scene />
      <UI />
      <HandTracker />
    </div>
  );
};

export default App;
