
USE football_lab;

-- Query 1: Historical points and efficiency by team
WITH team_results AS (
    SELECT
        home_team_id AS team_id,
        CASE
            WHEN home_goals > away_goals THEN 3
            WHEN home_goals = away_goals THEN 1
            ELSE 0
        END AS points
    FROM matches

    UNION ALL

    SELECT
        away_team_id AS team_id,
        CASE
            WHEN away_goals > home_goals THEN 3
            WHEN away_goals = home_goals THEN 1
            ELSE 0
        END AS points
    FROM matches
)
SELECT
    t.team_name AS team,
    COUNT(*) AS matches_played,
    SUM(r.points) AS total_points,
    ROUND(AVG(r.points), 3) AS points_per_match
FROM team_results r
INNER JOIN teams t
    ON r.team_id = t.team_id
GROUP BY
    t.team_id,
    t.team_name
ORDER BY
    total_points DESC,
    points_per_match DESC;


-- Query 2: Average possession and low-possession wins
WITH winning_matches AS (
    SELECT
        t.team_name,
        mts.possession
    FROM matches m
    INNER JOIN match_team_stats mts
        ON m.match_id = mts.match_id
    INNER JOIN teams t
        ON mts.team_id = t.team_id
    WHERE
        (mts.team_id = m.home_team_id
         AND m.home_goals > m.away_goals)
        OR
        (mts.team_id = m.away_team_id
         AND m.away_goals > m.home_goals)
)
SELECT
    team_name AS team,
    COUNT(*) AS total_wins,
    ROUND(AVG(possession), 2) AS average_possession,
    SUM(
        CASE
            WHEN possession < 50 THEN 1
            ELSE 0
        END
    ) AS wins_low_possession,
    ROUND(
        100.0 * SUM(
            CASE
                WHEN possession < 50 THEN 1
                ELSE 0
            END
        ) / COUNT(*),
        2
    ) AS low_possession_percentage
FROM winning_matches
GROUP BY team_name
ORDER BY average_possession DESC;


-- Query 3: Shots on target and offensive conversion
WITH team_season_stats AS (
    SELECT
        s.season_name,
        t.team_name,
        mts.shots_on_target,
        CASE
            WHEN mts.team_id = m.home_team_id
                THEN m.home_goals
            ELSE m.away_goals
        END AS goals_scored
    FROM matches m
    INNER JOIN seasons s
        ON m.season_id = s.season_id
    INNER JOIN match_team_stats mts
        ON m.match_id = mts.match_id
    INNER JOIN teams t
        ON mts.team_id = t.team_id
)
SELECT
    season_name AS season,
    team_name AS team,
    SUM(shots_on_target) AS total_shots_on_target,
    SUM(goals_scored) AS total_goals,
    SUM(shots_on_target) - SUM(goals_scored)
        AS shots_goals_difference,
    ROUND(
        100.0 * SUM(goals_scored)
        / NULLIF(SUM(shots_on_target), 0),
        2
    ) AS goal_conversion_percentage
FROM team_season_stats
GROUP BY
    season_name,
    team_name
ORDER BY
    shots_goals_difference DESC,
    season_name,
    team_name;


-- Query 4: Red cards and goals by season
WITH season_statistics AS (
    SELECT
        s.season_name,
        COUNT(DISTINCT m.match_id) AS total_matches,
        SUM(
            CASE
                WHEN mts.team_id = m.home_team_id
                    THEN m.home_goals
                ELSE m.away_goals
            END
        ) AS total_goals,
        SUM(mts.red_cards) AS total_red_cards
    FROM seasons s
    INNER JOIN matches m
        ON s.season_id = m.season_id
    INNER JOIN match_team_stats mts
        ON m.match_id = mts.match_id
    GROUP BY
        s.season_id,
        s.season_name
)
SELECT
    season_name AS season,
    total_matches,
    total_red_cards,
    total_goals,
    ROUND(
        total_red_cards * 1.0 / total_matches,
        3
    ) AS red_cards_per_match,
    ROUND(
        total_goals * 1.0 / total_matches,
        3
    ) AS goals_per_match
FROM season_statistics
ORDER BY
    total_red_cards DESC,
    season_name;
