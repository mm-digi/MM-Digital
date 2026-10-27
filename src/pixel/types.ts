export type StaffSlug = "max" | "tash" | "mariette" | "natasha";

export type Role = "admin" | "staff";

export type Status = "working" | "meeting" | "break" | "away" | "available";

export type HairStyle = "bob" | "sweep" | "curls" | "long" | "bun" | "pixie" | "spikes" | "braids";

export type EyeStyle = "round" | "soft" | "focused" | "happy" | "lashes";

export type OutfitId = "sweater" | "shirt" | "blazer" | "hoodie" | "dungarees" | "dress" | "mm-night";

export type ShoeId = "trainers" | "loafers" | "boots";

export type AccessoryId = "none" | "glasses" | "scarf" | "earrings" | "headphones";

export type HatId = "none" | "beanie" | "cap" | "beret" | "flower" | "frog";

export type Appearance = {
  hair: HairStyle;
  hairColour: string;
  skin: string;
  eyes: EyeStyle;
  eyeColour: string;
  outfit: OutfitId;
  outfitColour: string;
  shoes: ShoeId;
  shoeColour: string;
  accessory: AccessoryId;
  hat: HatId;
};

export type Priority = "low" | "normal" | "high" | "urgent";

export type TaskStatus = "todo" | "doing" | "done";

export type TaskKind = "task" | "meeting";

export type StaffPublic = {
  id: string;
  slug: StaffSlug;
  name: string;
  characterName: string;
  title: string;
  role: Role;
  accent: string;
  appearance: Appearance;
  creatorDone: boolean;
  xp: number;
  level: number;
  levelInto: number;
  levelNeed: number;
  status: Status;
  notes: string;
  gamification: boolean;
  sound: boolean;
  calm: boolean;
  plainMode: boolean;
  achievements: string[];
  online: boolean;
  x: number;
  y: number;
  sitting: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  detail: string;
  project: string;
  assignee: StaffSlug | null;
  assigneeName: string;
  priority: Priority;
  status: TaskStatus;
  kind: TaskKind;
  xp: number;
  source: "demo" | "notion";
  date: string;
  time: string | null;
  dueLabel: string;
  notionUrl: string | null;
  localPreview: boolean;
  overdue: boolean;
  today: boolean;
};

export type ProjectItem = {
  id: string;
  name: string;
  client: string;
  summary: string;
  colour: string;
  done: number;
  total: number;
};

export type Announcement = {
  id: string;
  authorSlug: StaffSlug;
  authorName: string;
  body: string;
  timeLabel: string;
};

export type NotionMapping = {
  tasksDatabaseId: string;
  titleProp: string;
  assigneeProp: string;
  dateProp: string;
  statusProp: string;
  priorityProp: string;
  projectProp: string;
  typeProp: string;
  doneValues: string;
  meetingValues: string;
  staff: Record<StaffSlug, string>;
};

export type NotionState = {
  configured: boolean;
  mode: "demo" | "live" | "stale";
  message: string | null;
  mapping: NotionMapping | null;
  cacheAgeSeconds: number | null;
};

export type Milestone = {
  count: number;
  next: number | null;
  label: string;
};

export type ClientLight = "green" | "amber" | "red";

export type ClientHealth = {
  slug: string;
  name: string;
  light: ClientLight;
};

export type ClientStanding = {
  slug: string;
  name: string;
  label: string;
};

export type ClientForm = {
  best: ClientStanding | null;
  worst: ClientStanding | null;
};

export type Snapshot = {
  me: StaffPublic;
  staff: StaffPublic[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  announcements: Announcement[];
  notion: NotionState;
  today: string;
  milestones: Milestone;
  clients: ClientHealth[];
  canEditLights: boolean;
  form: ClientForm;
};

export type Presence = {
  slug: StaffSlug;
  online: boolean;
  status: Status;
  x: number;
  y: number;
  sitting: boolean;
  appearance: Appearance;
  characterName: string;
};

export type ActionBody =
  | { type: "avatar"; characterName: string; appearance: Appearance }
  | { type: "complete"; taskId: string }
  | { type: "status"; status: Status }
  | { type: "notes"; notes: string }
  | { type: "announce"; body: string }
  | { type: "deleteAnnounce"; id: string }
  | {
      type: "preferences";
      gamification?: boolean;
      sound?: boolean;
      calm?: boolean;
      plainMode?: boolean;
    }
  | { type: "presence"; x?: number; y?: number; sitting?: boolean }
  | { type: "notionSave"; mapping: NotionMapping }
  | { type: "notionSchema"; databaseId: string }
  | { type: "notionRefresh" }
  | { type: "frank" }
  | { type: "clientLight"; slug: string; light: ClientLight };

export type NotionSchema = {
  properties: { name: string; type: string }[];
  users: { id: string; name: string }[];
};

export type ActionResult = {
  ok: boolean;
  status?: number;
  error?: string;
  toast?: string;
  celebrate?: boolean;
  snapshot?: Snapshot;
  schema?: NotionSchema;
  staff?: Presence[];
};

export type PanelId =
  | "day"
  | "quests"
  | "team"
  | "calendar"
  | "projects"
  | "desk"
  | "profile"
  | "notion"
  | "creator";
