export const scenes = [
  { id: "subway", title: "The subway struggle", image: "/jokes/subway.svg", alt: "A subway train waiting at a New York station", description: "A New York subway train at a platform, with an arrival board saying delayed.", starter: "When the 1 train says one minute for the fifth time." },
  { id: "library", title: "Library life", image: "/jokes/library.svg", alt: "A desk piled with books beside a late-night clock", description: "A library desk with a huge pile of books, a laptop, and a clock showing late at night.", starter: "Me opening the reading list the night before class." },
  { id: "bagel", title: "NYC on a budget", image: "/jokes/bagel.svg", alt: "A bagel and a coffee beside a surprisingly large receipt", description: "A bagel and coffee on a cafe table beside a long expensive receipt.", starter: "A Midwest kid discovering what a New York breakfast costs." },
  { id: "dorm", title: "Dorm energy", image: "/jokes/dorm.svg", alt: "A dorm room with laundry and a tiny bed", description: "A tiny college dorm room with laundry piled up and a small bed.", starter: "Calling my dorm a Manhattan studio apartment." },
] as const;

export const styles = ["Deadpan", "Chronically online", "Wholesome"] as const;
export type CaptionStyle = (typeof styles)[number];
export function getScene(id: string) { return scenes.find(scene => scene.id === id); }

const dailyPrompts = [
  { sceneId: "subway", prompt: "When the 1 train says one minute for the fifth time." },
  { sceneId: "library", prompt: "POV: you came to Butler to study and spent an hour choosing a seat." },
  { sceneId: "bagel", prompt: "A Midwest kid discovering what a New York breakfast costs." },
  { sceneId: "dorm", prompt: "Calling my dorm a Manhattan studio apartment." },
  { sceneId: "subway", prompt: "Planning a wholesome NYC weekend and accidentally taking the express." },
  { sceneId: "library", prompt: "The syllabus says optional reading. My anxiety says otherwise." },
  { sceneId: "bagel", prompt: "Treating myself after checking my dining dollars balance." },
];

export function getDailyPrompt(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [year, month, day] = date.split("-").map(Number);
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  return { ...dailyPrompts[dayIndex % dailyPrompts.length], date };
}
