DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  bio VARCHAR(255) NOT NULL
);