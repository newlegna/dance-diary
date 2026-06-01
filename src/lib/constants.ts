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
    name: "7-Day Hip Hop Groove",
    description: "Build your bounce and rhythm every day.",
    goal: "Feel more comfortable grooving to hip hop music",
    duration: 7 as const,
    danceStyle: "hip-hop" as const,
  },
  {
    name: "14-Day Footwork Focus",
    description: "Sharpen your steps and weight shifts.",
    goal: "Improve footwork clarity and control",
    duration: 14 as const,
    danceStyle: "hip-hop" as const,
  },
  {
    name: "30-Day Confidence Challenge",
    description: "Show up daily and watch yourself grow.",
    goal: "Build confidence through consistent practice",
    duration: 30 as const,
    danceStyle: "hip-hop" as const,
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
    createdAt: "2026-05-20T18:00:00.000Z",
  },
  {
    id: "post-2",
    author: "Jordan K.",
    danceStyle: "hip-hop" as const,
    journeyName: "30-Day Bounce Builder",
    caption: "Day 1 vs Day 30 — my timing finally clicked.",
    dayFrom: 1,
    dayTo: 30,
    likes: 128,
    createdAt: "2026-05-18T12:30:00.000Z",
  },
  {
    id: "post-3",
    author: "Sam R.",
    danceStyle: "hip-hop" as const,
    journeyName: "7-Day Freestyle Warmup",
    caption: "One week of showing up. Still awkward, but moving!",
    dayFrom: 1,
    dayTo: 7,
    likes: 19,
    createdAt: "2026-05-15T09:15:00.000Z",
  },
];
