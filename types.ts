
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  position: Point;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
}

export interface OptimizationResult {
  optimalScenarioId: number;
  justification: string;
}

export type AppStep = 1 | 2 | 3 | 4;