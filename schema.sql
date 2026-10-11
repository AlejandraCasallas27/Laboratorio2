CREATE DATABASE IF NOT EXISTS football_lab;
USE football_lab;

CREATE TABLE IF NOT EXISTS teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS seasons (
    season_id INT AUTO_INCREMENT PRIMARY KEY,
    season_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    season_id INT NOT NULL,
    match_date DATE NOT NULL,
    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    home_goals INT NOT NULL,
    away_goals INT NOT NULL,

    CONSTRAINT fk_matches_season
        FOREIGN KEY (season_id)
        REFERENCES seasons(season_id),

    CONSTRAINT fk_matches_home_team
        FOREIGN KEY (home_team_id)
        REFERENCES teams(team_id),

    CONSTRAINT fk_matches_away_team
        FOREIGN KEY (away_team_id)
        REFERENCES teams(team_id),

    CONSTRAINT chk_different_teams
        CHECK (home_team_id <> away_team_id),

    CONSTRAINT chk_nonnegative_goals
        CHECK (home_goals >= 0 AND away_goals >= 0),

    CONSTRAINT uq_match
        UNIQUE (season_id, match_date, home_team_id, away_team_id)
);

CREATE TABLE IF NOT EXISTS match_team_stats (
    match_id INT NOT NULL,
    team_id INT NOT NULL,
    possession DECIMAL(5,2),
    shots_on_target INT,
    red_cards INT,

    PRIMARY KEY (match_id, team_id),

    CONSTRAINT fk_stats_match
        FOREIGN KEY (match_id)
        REFERENCES matches(match_id),

    CONSTRAINT fk_stats_team
        FOREIGN KEY (team_id)
        REFERENCES teams(team_id),

    CONSTRAINT chk_possession
        CHECK (possession BETWEEN 0 AND 100),

    CONSTRAINT chk_shots
        CHECK (shots_on_target >= 0),

    CONSTRAINT chk_red_cards
        CHECK (red_cards >= 0)
);
