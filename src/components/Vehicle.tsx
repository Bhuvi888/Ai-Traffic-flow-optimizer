import React from 'react';
import { Car, Truck } from 'lucide-react';
import type { Vehicle as VehicleType } from '../types';

interface Props {
  vehicle: VehicleType;
}

export function Vehicle({ vehicle }: Props) {
  const Icon = vehicle.type === 'car' ? Car : Truck;
  
  return (
    <div 
      className={`absolute transform ${getRotation(vehicle.direction)}`}
      style={{
        ...getPosition(vehicle.direction, vehicle.position, vehicle.lane),
        transition: 'all 0.5s linear'
      }}
    >
      <Icon className="w-12 h-12 text-blue-600" />
    </div>
  );
}

function getRotation(direction: VehicleType['direction']) {
  switch (direction) {
    case 'north': return 'rotate-0';
    case 'south': return 'rotate-180';
    case 'east': return 'rotate-90';
    case 'west': return '-rotate-90';
  }
}

function getPosition(direction: VehicleType['direction'], position: number, lane: number) {
  const laneOffset = lane === 0 ? -25 : 25;
  
  switch (direction) {
    case 'north':
      return {
        bottom: `${position}%`,
        left: `calc(50% + ${laneOffset}px)`
      };
    case 'south':
      return {
        top: `${position}%`,
        right: `calc(50% + ${laneOffset}px)`
      };
    case 'east':
      return {
        left: `${position}%`,
        top: `calc(50% + ${laneOffset}px)`
      };
    case 'west':
      return {
        right: `${position}%`,
        bottom: `calc(50% + ${laneOffset}px)`
      };
  }
}