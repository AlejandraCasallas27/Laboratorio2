
USE football_lab;

-- Query 1: Matches with more than four goals in season 10/11
SELECT
    m.match_date,
    ht.team_name AS home_team,
    at.team_name AS away_team,
    m.home_goals,
    m.away_goals,
    (m.home_goals + m.away_goals) AS total_goals
FROM matches m
INNER JOIN seasons s ON m.season_id = s.season_id
INNER JOIN teams ht ON m.home_team_id = ht.team_id
INNER JOIN teams at ON m.away_team_id = at.team_id
WHERE s.season_name = '10/11'
    AND (m.home_goals + m.away_goals) > 4
ORDER BY total_goals DESC, m.match_date;


-- Query 2: Number of matches per season
SELECT
    s.season_name AS season,
    COUNT(m.match_id) AS total_matches
FROM seasons s
INNER JOIN matches m
    ON s.season_id = m.season_id
GROUP BY
    s.season_id,
    s.season_name
ORDER BY s.season_name;


-- Query 3: Matches with a goal difference of at least three
SELECT
    s.season_name AS season,
    m.match_date,
    home.team_name AS home_team,
    away.team_name AS away_team,
    m.home_goals,
    m.away_goals,
    ABS(m.home_goals - m.away_goals) AS goal_difference
FROM matches m
INNER JOIN seasons s
    ON m.season_id = s.season_id
INNER JOIN teams home
    ON m.home_team_id = home.team_id
INNER JOIN teams away
    ON m.away_team_id = away.team_id
WHERE s.season_name = '20/21'
    AND ABS(m.home_goals - m.away_goals) >= 3
ORDER BY goal_difference DESC, m.match_date;


-- Query 4: Total and average goals per season
SELECT
    s.season_name AS season,
    COUNT(m.match_id) AS total_matches,
    SUM(m.home_goals + m.away_goals) AS total_goals,
    ROUND(
        AVG(m.home_goals + m.away_goals),
        2
    ) AS average_goals_per_match
FROM seasons s
INNER JOIN matches m
    ON s.season_id = m.season_id
GROUP BY
    s.season_id,
    s.season_name
ORDER BY s.season_name;
