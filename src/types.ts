export type CredentialsType = "admin" | "teacher" | "student";

export const ROLE_LABELS: Record<CredentialsType, string> = {
  admin: "Admin",
  teacher: "Profe",
  student: "Estudiante",
};

export const ROLE_COLORS: Record<CredentialsType, string> = {
  admin: "green",
  teacher: "purple",
  student: "blue",
};

export const ROLE_ICONS: Record<CredentialsType, string> = {
  admin: "🛡️",
  teacher: "🎓",
  student: "📚",
};

export type Course = {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  syllabus_url?: string | null;
  subscription_url?: string | null;
  subscriptions?: Subscription[];
  enrolled?: boolean;
  can_manage?: boolean;
  status?: "active" | "archived";
  allow_late_submissions?: boolean;
  late_penalty_percent?: number | null;
  upcoming_due?: string | null;
  pending_submissions?: number | null;
  pending_grades?: number | null;
};

export type User = {
  id: number;
  username: string;
  email: string;
  credentials: CredentialsType;
  pronouns?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  description?: string | null;
  photo_url?: string | null;
  link?: string | null;
  team?: string | null;
  email_notifications?: boolean;
  subscriptions?: Subscription[];
  loggedIn?: boolean;
};

export type Subscription = {
  user_id: number;
  course_id: number;
  credentials: CredentialsType;
  user?: User;
  course?: Course;
};

export type PostType = "anuncio" | "tarea" | "material";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  anuncio: "Anuncio",
  tarea: "Tarea",
  material: "Material",
};

export const POST_TYPE_COLORS: Record<PostType, string> = {
  anuncio: "pink",
  tarea: "yellow",
  material: "purple",
};

export const POST_TYPE_ICONS: Record<PostType, string> = {
  anuncio: "📣",
  tarea: "📝",
  material: "📎",
};

export type Post = {
  id: number;
  course_id: number;
  author_id: number;
  type: PostType;
  title: string;
  body?: string | null;
  due_date?: string | null;
  max_score?: number | null;
  is_published?: boolean;
  publish_at?: string | null;
  allow_late_submissions?: boolean | null;
  late_penalty_percent?: number | null;
  rubric?: RubricCriterion[] | null;
  created_at: string;
  updated_at: string;
  author?: User;
  attachments?: Attachment[];
  _count?: { comments: number; submissions: number };
};

export type Submission = {
  id: number;
  post_id: number;
  user_id: number;
  body?: string | null;
  link?: string | null;
  submitted_at: string;
  late?: boolean;
  raw_score?: number | null;
  score?: number | null;
  penalty_percent?: number | null;
  feedback?: string | null;
  rubric_scores?: Record<string, number> | null;
  graded_at?: string | null;
  graded_by?: number | null;
  user?: User;
  attachments?: Attachment[];
};

export type Attachment = {
  id?: number;
  name: string;
  url: string;
  mime_type?: string | null;
  size?: number | null;
};

export type RubricCriterion = {
  title: string;
  description?: string | null;
  points: number;
};

export type CalendarEvent = {
  id: number;
  course_id: number;
  author_id: number;
  type: "clase" | "entrega" | "evento";
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
};

export type AttendanceRecord = {
  id: number;
  session_id: number;
  user_id: number;
  status: "present" | "absent" | "late" | "excused";
  note?: string | null;
  user?: User;
};

export type AttendanceSession = {
  id: number;
  course_id: number;
  title: string;
  session_at: string;
  records: AttendanceRecord[];
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  body: string;
  created_at: string;
  user?: User;
};
