import { useEffect, useCallback, useState } from 'react';
import { TrafficLight } from './TrafficLight';
import { Vehicle } from './Vehicle';
import type { IntersectionState, Vehicle as VehicleType, TrafficLight as TrafficLightType } from '../types';

const INITIAL_STATE: IntersectionState = {
  vehicles: [],
  lights: [
    { direction: 'north', state: 'red', timer: 0, queueLength: 0 },
    { direction: 'south', state: 'red', timer: 0, queueLength: 0 },
    { direction: 'east', state: 'green', timer: 30, queueLength: 0 },
    { direction: 'west', state: 'red', timer: 0, queueLength: 0 },
  ]
};

const INTERSECTION_START = 45;
const INTERSECTION_END = 55;
const BASE_GREEN_TIME = 30;
const YELLOW_TIME = 5;
const MIN_RED_TIME = 20;
const QUEUE_THRESHOLD = 3; // Switch if a lane has 3 more vehicles than the current green lane

export function Intersection() {
  const [state, setState] = useState<IntersectionState>(INITIAL_STATE);
  const [emergency, setEmergency] = useState(false);
  const [activeDirection, setActiveDirection] = useState<'north' | 'south' | 'east' | 'west' | null>(null);
  const [globalTimer, setGlobalTimer] = useState(0);

  // 🚗 Calculate queue lengths
  const calculateQueueLengths = useCallback((vehicles: VehicleType[]) => {
    const queues = {
      north: 0,
      south: 0,
      east: 0,
      west: 0
    };

    vehicles.forEach(vehicle => {
      if (vehicle.position <= INTERSECTION_START - 5) {
        queues[vehicle.direction]++;
      }
    });

    return queues;
  }, []);

  // 🚗 Check if all vehicles in the current green lane have cleared the intersection
  const areVehiclesCleared = useCallback(
    (vehicles: VehicleType[], activeDirection: string | null) => {
      if (!activeDirection) return true;
      return vehicles.every(
        (vehicle) =>
          vehicle.direction !== activeDirection || vehicle.position > INTERSECTION_END
      );
    },
    []
  );

  // 🚦 Should vehicle stop based on light
  const shouldVehicleStop = useCallback((vehicle: VehicleType, lights: TrafficLightType[]) => {
    const light = lights.find(l => l.direction === vehicle.direction);
    if (!light) return false;

    const isApproaching = vehicle.position >= INTERSECTION_START - 10 && vehicle.position <= INTERSECTION_END;
    const isRedOrYellow = light.state === 'red' || light.state === 'yellow';

    return isApproaching && isRedOrYellow;
  }, []);

  // 🚦 Switch signal to lane with the highest queue only if the lane is cleared
  const switchToLongestQueue = useCallback(
    (queues, lights, vehicles) => {
      let longestQueueDirection = null;
      let maxQueueLength = 0;

      // Find the lane with the highest queue
      for (const direction in queues) {
        if (queues[direction] > maxQueueLength) {
          maxQueueLength = queues[direction];
          longestQueueDirection = direction;
        }
      }

      // Get the current active green light
      const activeLight = lights.find((light) => light.state === 'green');
      if (!activeLight) return lights;

      // ✅ Only switch if all vehicles have cleared the current lane
      if (!areVehiclesCleared(vehicles, activeLight.direction)) {
        return lights; // 🚫 Do NOT switch if vehicles are still crossing
      }

      const currentGreenQueue = queues[activeLight.direction] || 0;

      // 🚦 Switch if the queue difference exceeds the threshold
      if (
        longestQueueDirection &&
        queues[longestQueueDirection] > currentGreenQueue + QUEUE_THRESHOLD
      ) {
        return lights.map((light) => ({
          ...light,
          state: light.direction === longestQueueDirection ? 'green' : 'red',
          timer: 0,
        }));
      }

      return lights.map((light) => {
        if (light.state === 'green') {
          return light;
        }
        return { ...light, state: 'red', timer: 0 };
      });
    },
    [areVehiclesCleared]
  );

  // 🚦 Traffic Light Control with Emergency and Dynamic Switching
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalTimer((prev) => prev + 1);

      setState((prev) => {
        let newLights = [...prev.lights];

        // 🚨 Emergency Override
        if (emergency && activeDirection) {
          return {
            ...prev,
            lights: newLights.map((light) => ({
              ...light,
              state: light.direction === activeDirection ? 'green' : 'red',
              timer: 0,
            })),
          };
        }

        // 🚦 Check queue and dynamically switch if necessary after clearing
        const queues = calculateQueueLengths(prev.vehicles);
        newLights = switchToLongestQueue(queues, prev.lights, prev.vehicles);

        // Normal cycle if no switch occurred
        if (newLights === prev.lights) {
          const cycleTime = BASE_GREEN_TIME + YELLOW_TIME + MIN_RED_TIME;
          const phaseTimer = globalTimer % cycleTime;

          newLights = newLights.map((light) => {
            if (light.state === 'green') {
              if (phaseTimer >= BASE_GREEN_TIME && phaseTimer < BASE_GREEN_TIME + YELLOW_TIME) {
                return { ...light, state: 'yellow', timer: phaseTimer };
              } else if (phaseTimer >= BASE_GREEN_TIME + YELLOW_TIME) {
                return { ...light, state: 'red', timer: 0 };
              }
            } else if (light.state === 'red' && phaseTimer >= cycleTime - MIN_RED_TIME) {
              return { ...light, state: 'green', timer: 0 };
            }
            return { ...light, timer: phaseTimer };
          });
        }

        return { ...prev, lights: newLights };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [emergency, activeDirection, globalTimer, calculateQueueLengths, switchToLongestQueue]);

  // 🚗 Update vehicle movements and check for stopping conditions
  const updateSimulation = useCallback(() => {
    setState((prev) => {
      const vehicles = prev.vehicles
        .map((vehicle) => {
          const mustStop = shouldVehicleStop(vehicle, prev.lights);
          let newPosition = vehicle.position;

          if (!mustStop) {
            newPosition = vehicle.position + 1;
          }

          return {
            ...vehicle,
            position: newPosition,
            waitingTime: mustStop ? vehicle.waitingTime + 1 : 0,
          };
        })
        .filter((vehicle) => vehicle.position <= 100);

      // 🚗 Add new vehicles randomly
      if (Math.random() < 0.05) {
        vehicles.push(generateNewVehicle());
      }

      // 🚥 Update queue lengths
      const queueLengths = calculateQueueLengths(vehicles);

      return {
        vehicles,
        lights: prev.lights.map((light) => ({
          ...light,
          queueLength: queueLengths[light.direction],
        })),
      };
    });
  }, [shouldVehicleStop, calculateQueueLengths]);

  useEffect(() => {
    const interval = setInterval(updateSimulation, 100);
    return () => clearInterval(interval);
  }, [updateSimulation]);

  // 🚑 Simulate emergency vehicles
  useEffect(() => {
    const emergencyInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        setEmergency(true);
        const directions: ('north' | 'south' | 'east' | 'west')[] = ['north', 'south', 'east', 'west'];
        setActiveDirection(directions[Math.floor(Math.random() * directions.length)]);

        setTimeout(() => {
          setEmergency(false);
          setActiveDirection(null);
        }, 30000); // Reset after 30 seconds
      }
    }, 60000);

    return () => clearInterval(emergencyInterval);
  }, []);

  return (
    <div className="relative w-[800px] h-[800px] bg-gray-200">
      {/* Roads */}
      <div className="absolute top-1/2 left-0 right-0 h-40 bg-gray-600 -translate-y-1/2" />
      <div className="absolute top-0 bottom-0 left-1/2 w-40 bg-gray-600 -translate-x-1/2" />

      {/* Traffic Lights */}
      {state.lights.map((light) => (
        <div
          key={light.direction}
          className={`absolute ${getTrafficLightPosition(light.direction)}`}
        >
          <TrafficLight
            light={light}
            emergency={emergency}
            activeDirection={activeDirection}
          />
        </div>
      ))}

      {/* Vehicles */}
      {state.vehicles.map((vehicle) => (
        <Vehicle key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

// 🚗 Generate new vehicles
function generateNewVehicle(): VehicleType {
  const directions: VehicleType['direction'][] = ['north', 'south', 'east', 'west'];
  const types: VehicleType['type'][] = ['car', 'truck'];

  return {
    id: Math.random().toString(36).substr(2, 9),
    direction: directions[Math.floor(Math.random() * directions.length)],
    type: types[Math.floor(Math.random() * types.length)],
    position: 0,
    lane: Math.random() > 0.5 ? 0 : 1,
    waitingTime: 0,
  };
}

// 🛑 Traffic light position on the UI
function getTrafficLightPosition(direction: string): string {
  switch (direction) {
    case 'north':
      return 'top-1/2 right-1/2 translate-x-24 -translate-y-24';
    case 'south':
      return 'bottom-1/2 left-1/2 -translate-x-24 translate-y-24';
    case 'east':
      return 'right-1/2 top-1/2 translate-y-24 translate-x-24';
    case 'west':
      return 'left-1/2 bottom-1/2 -translate-y-24 -translate-x-24';
    default:
      return '';
  }
}
