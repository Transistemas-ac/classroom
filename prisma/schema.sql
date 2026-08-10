-- Enums
CREATE TYPE "CredentialsType" AS ENUM ('teacher', 'student');

-- User table
CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    credentials "CredentialsType" NOT NULL DEFAULT 'student',
    pronouns VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    description TEXT,
    photo_url TEXT,
    link TEXT,
    team VARCHAR(255)
);

-- Course table
CREATE TABLE "Course" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    syllabus_url TEXT,
    subscription_url TEXT
);

-- Subscription table (junction table)
CREATE TABLE "Subscription" (
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    credentials "CredentialsType" NOT NULL DEFAULT 'student',
    PRIMARY KEY (user_id, course_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES "Course"(id) ON DELETE CASCADE
);
