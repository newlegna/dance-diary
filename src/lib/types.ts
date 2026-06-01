export type JourneyDuration = 7 | 14 | 30;

export type DanceStyle =
  | "hip-hop"
  | "waacking"
  | "house"
  | "heels"
  | "k-pop"
  | "popping"
  | "locking"
  | "salsa"
  | "freestyle";

export type SkillFocus =
  | "groove"
  | "arms"
  | "rhythm"
  | "musicality"
  | "footwork"
  | "confidence"
  | "choreography";

export interface Journey {
  id: string;
  name: string;
  description: string;
  goal: string;
  duration: JourneyDuration;
  danceStyle: DanceStyle;
  isPublic: boolean;
  createdAt: string;
}

export interface Clip {
  id: string;
  journeyId: string;
  dayNumber: number;
  durationSeconds: number;
  note?: string;
  skillFocus?: SkillFocus;
  videoId: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  danceStyle: DanceStyle;
  journeyName: string;
  caption: string;
  dayFrom: number;
  dayTo: number;
  likes: number;
  createdAt: string;
}

export type ExportTemplate = "side-by-side" | "before-after" | "timeline";
