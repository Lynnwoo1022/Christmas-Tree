export type Phase = 'tree' | 'blooming' | 'nebula' | 'collapsing';

export enum GestureType {
  None = 'None',
  OpenPalm = 'Open_Palm',
  ClosedFist = 'Closed_Fist',
  PointingUp = 'Pointing_Up'
}

export interface PhotoData {
  url: string;
  id: number;
}
