-- SQLite port of schema.sql
-- Tables, columns, and PK/FK shape mirror the MySQL version.
-- Run on every boot via CREATE TABLE IF NOT EXISTS.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Venue (
  idVenue   INTEGER PRIMARY KEY AUTOINCREMENT,
  Email     TEXT NOT NULL UNIQUE,
  Password  TEXT,
  VenueName TEXT
);

CREATE TABLE IF NOT EXISTS Concert (
  idConcert   INTEGER PRIMARY KEY AUTOINCREMENT,
  ConcertName TEXT,
  StartDate   INTEGER NOT NULL,
  EndDate     INTEGER NOT NULL,
  LightColor  INTEGER,
  idVenue     INTEGER NOT NULL,
  LightMode   INTEGER,
  FOREIGN KEY (idVenue) REFERENCES Venue(idVenue)
);
CREATE INDEX IF NOT EXISTS idx_Concert_Venue ON Concert(idVenue);

CREATE TABLE IF NOT EXISTS User (
  idUser      INTEGER PRIMARY KEY AUTOINCREMENT,
  PhoneNumber TEXT NOT NULL,
  ScreenName  TEXT NOT NULL,
  Banned      TEXT,
  idConcert   INTEGER NOT NULL,
  FOREIGN KEY (idConcert) REFERENCES Concert(idConcert) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_User_Concert ON User(idConcert);

CREATE TABLE IF NOT EXISTS ChatMessage (
  idChatMessage INTEGER PRIMARY KEY AUTOINCREMENT,
  Message       TEXT,
  idUser        INTEGER,
  idConcert     INTEGER NOT NULL,
  Sent          DATETIME,
  Type          INTEGER NOT NULL,
  FOREIGN KEY (idUser)    REFERENCES User(idUser)       ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idConcert) REFERENCES Concert(idConcert) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ChatMessage_User    ON ChatMessage(idUser);
CREATE INDEX IF NOT EXISTS idx_ChatMessage_Concert ON ChatMessage(idConcert);
CREATE INDEX IF NOT EXISTS idx_ChatMessage_Sent    ON ChatMessage(Sent, idChatMessage);

CREATE TABLE IF NOT EXISTS Upvotes (
  idUser        INTEGER NOT NULL,
  idChatMessage INTEGER NOT NULL,
  PRIMARY KEY (idChatMessage, idUser),
  FOREIGN KEY (idUser)        REFERENCES User(idUser)              ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (idChatMessage) REFERENCES ChatMessage(idChatMessage) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Upvotes_ChatMessage ON Upvotes(idChatMessage);
