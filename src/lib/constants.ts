import type { DanceStyle, SkillFocus } from "./types";

export const APP_NAME = "Dance Diary";
export const TAGLINE = "See yourself become a better dancer.";
export const DEFAULT_STYLE: DanceStyle = "hip-hop";

export const DANCE_STYLES: { value: DanceStyle; label: string }[] = [
  { value: "hip-hop", label: "Hip Hop" },
  { value: "waacking", label: "Waacking" },
  { value: "house", label: "House" },
  { value: "heels", label: "Heels" },
  { value: "k-pop", label: "K-Pop" },
  { value: "popping", label: "Popping" },
  { value: "locking", label: "Locking" },
  { value: "salsa", label: "Salsa" },
  { value: "freestyle", label: "Freestyle" },
];

export const SKILL_FOCUSES: { value: SkillFocus; label: string }[] = [
  { value: "groove", label: "Groove" },
  { value: "arms", label: "Arms" },
  { value: "rhythm", label: "Rhythm" },
  { value: "musicality", label: "Musicality" },
  { value: "footwork", label: "Footwork" },
  { value: "confidence", label: "Confidence" },
  { value: "choreography", label: "Choreography" },
];

export const CLIP_DURATIONS = [10, 15, 20] as const;

export const PLAYBACK_SPEEDS = [0.5, 0.75, 1] as const;

export const JOURNEY_TEMPLATES = [
  {
    name: "7-Day Waacking Arm Control",
    description: "Practice clean lines, speed changes, and confident arms.",
    goal: "Improve arm control and confidence",
    duration: 7 as const,
    danceStyle: "waacking" as const,
  },
  {
    name: "14-Day K-Pop Combo",
    description: "Learn one short combo and make the details sharper.",
    goal: "Finish a 15-second choreography with cleaner timing",
    duration: 14 as const,
    danceStyle: "k-pop" as const,
  },
  {
    name: "30-Day Hip Hop Groove",
    description: "Build bounce, rhythm, and pocket through daily practice.",
    goal: "Feel more comfortable grooving to hip hop music",
    duration: 30 as const,
    danceStyle: "hip-hop" as const,
  },
  {
    name: "7-Day Freestyle Confidence",
    description: "Record short freestyle rounds without judging the take.",
    goal: "Move with more confidence and less self-consciousness",
    duration: 7 as const,
    danceStyle: "freestyle" as const,
  },
];

export const MOCK_COMMUNITY_POSTS = [
  {
    id: "post-1",
    author: "Maya G.",
    danceStyle: "hip-hop" as const,
    journeyName: "14-Day Groove Challenge",
    caption: "I didn't feel like I improved until I saw this side by side.",
    dayFrom: 1,
    dayTo: 14,
    likes: 42,
    comments: 8,
    createdAt: "2026-05-20T18:00:00.000Z",
  },
  {
    id: "post-2",
    author: "Jordan K.",
    danceStyle: "waacking" as const,
    journeyName: "30 Days of Waacking",
    caption: "Day 1 vs Day 30 - my arms finally look intentional.",
    dayFrom: 1,
    dayTo: 30,
    likes: 128,
    comments: 21,
    createdAt: "2026-05-18T12:30:00.000Z",
  },
  {
    id: "post-3",
    author: "Sam R.",
    danceStyle: "k-pop" as const,
    journeyName: "14-Day Chorus Clean-Up",
    caption: "The footwork still needs work, but I can finally see the shapes.",
    dayFrom: 1,
    dayTo: 14,
    likes: 19,
    comments: 5,
    createdAt: "2026-05-15T09:15:00.000Z",
  },
  {
    id: "post-4",
    author: "Ren A.",
    danceStyle: "freestyle" as const,
    journeyName: "7-Day Freestyle Confidence",
    caption: "Less freezing, more playing with the music.",
    dayFrom: 1,
    dayTo: 7,
    likes: 57,
    comments: 12,
    createdAt: "2026-05-12T20:45:00.000Z",
  },
];
