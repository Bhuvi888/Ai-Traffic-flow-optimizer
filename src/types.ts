export interface Vehicle {
  id: string;
  direction: 'north' | 'south' | 'east' | 'west';
  position: number; // 0-100 representing progress through lane
  type: 'car' | 'truck';
  lane: number; // 0 or 1 for left/right lanes
  waitingTime: number; // Time spent waiting at red light
}

export interface TrafficLight {
  direction: 'north' | 'south' | 'east' | 'west';
  state: 'red' | 'yellow' | 'green';
  timer: number;
  queueLength: number; // Number of vehicles waiting
}

export interface IntersectionState {
  vehicles: Vehicle[];
  lights: TrafficLight[];
}