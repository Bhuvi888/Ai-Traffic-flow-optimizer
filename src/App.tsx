import React from 'react';
import { Intersection } from './components/Intersection';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">AI-Controlled Traffic Simulation</h1>
      <Intersection />
      <div className="mt-8 text-gray-600 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">How it works:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Traffic lights are controlled by an AI system that monitors traffic flow</li>
          <li>The AI adjusts green light duration based on queue length and waiting times</li>
          <li>Vehicles automatically stop at red and yellow lights</li>
          <li>The system ensures safe traffic flow by preventing conflicting green signals</li>
          <li>Queue length indicators show the number of waiting vehicles in each direction</li>
          <li>Emergency vehicle detection triggers priority signal changes</li>
        </ul>
      </div>
    </div>
  );
}

export default App