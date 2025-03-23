import React from 'react';
import { Circle } from 'lucide-react';
import type { TrafficLight as TrafficLightType } from '../types';

interface TrafficLightProps {
  light: TrafficLightType;
  emergency: boolean;
  activeDirection?: string | null;
}

export function TrafficLight({ light, emergency, activeDirection }: TrafficLightProps) {
  return (
    <div className="flex flex-col gap-3 bg-gray-800 p-3 rounded-lg shadow-lg">
      <Circle 
        className={`w-8 h-8 ${light.state === 'red' ? 'text-red-500' : 'text-red-900'}`} 
        fill={light.state === 'red' ? 'currentColor' : 'none'} 
      />
      <Circle 
        className={`w-8 h-8 ${light.state === 'yellow' ? 'text-yellow-500' : 'text-yellow-900'}`}
        fill={light.state === 'yellow' ? 'currentColor' : 'none'}
      />
      <Circle 
        className={`w-8 h-8 ${light.state === 'green' ? 'text-green-500' : 'text-green-900'}`}
        fill={light.state === 'green' ? 'currentColor' : 'none'}
      />
      
      {/* Debug info */}
      <div className="text-white text-xs text-center">
        <p>Queue: {light.queueLength}</p>
        <p>Timer: {light.timer}s</p>
        <p>State: {light.state}</p>
      </div>
    </div>
  );
}