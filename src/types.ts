export type CredentialsType = "teacher" | "student";

export type Course = {
  id: number;
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  syllabus_url?: string | null;
  subscription_url?: string | null;
  subscriptions?: Subscription[];
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
