
require('dotenv').config();

const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

const filePath = './football_matches (1).csv';

const databaseConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306)
};

function readCsv() {
    return new Promise((resolve, reject) => {
        const rows = [];

        fs.createReadStream(filePath)
            .on('error', reject)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}

function requiredText(value, field, rowNumber) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(
            `Row ${rowNumber}: invalid ${field}`
        );
    }

    return value.trim();
}

function nonnegativeInteger(value, field, rowNumber) {
    const number = Number(value);

    if (
        value === '' ||
        !Number.isSafeInteger(number) ||
        number < 0
    ) {
        throw new Error(
            `Row ${rowNumber}: invalid ${field}`
        );
    }

    return number;
}

function possessionValue(value, field, rowNumber) {
    const number = Number(value);

    if (
        value === '' ||
        !Number.isFinite(number) ||
        number < 0 ||
        number > 100
    ) {
        throw new Error(
            `Row ${rowNumber}: invalid ${field}`
        );
    }

    return number;
}

function validateRow(row, rowNumber) {
    const season = requiredText(
        row.season, 'season', rowNumber
    );
    const date = requiredText(
        row.date, 'date', rowNumber
    );
    const homeTeam = requiredText(
        row.home_team, 'home_team', rowNumber
    );
    const awayTeam = requiredText(
        row.away_team, 'away_team', rowNumber
    );

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    ) {
        throw new Error(
            `Row ${rowNumber}: invalid date`
        );
    }

    if (homeTeam === awayTeam) {
        throw new Error(
            `Row ${rowNumber}: teams must be different`
        );
    }

    return {
        season,
        date,
        homeTeam,
        awayTeam,
        homeGoals: nonnegativeInteger(
            row.goal_home_ft, 'goal_home_ft', rowNumber
        ),
        awayGoals: nonnegativeInteger(
            row.goal_away_ft, 'goal_away_ft', rowNumber
        ),
        homePossession: possessionValue(
            row.home_possession, 'home_possession', rowNumber
        ),
        awayPossession: possessionValue(
            row.away_possession, 'away_possession', rowNumber
        ),
        homeShots: nonnegativeInteger(
            row.home_shots_on_target,
            'home_shots_on_target',
            rowNumber
        ),
        awayShots: nonnegativeInteger(
            row.away_shots_on_target,
            'away_shots_on_target',
            rowNumber
        ),
        homeRedCards: nonnegativeInteger(
            row.home_red_cards, 'home_red_cards', rowNumber
        ),
        awayRedCards: nonnegativeInteger(
            row.away_red_cards, 'away_red_cards', rowNumber
        )
    };
}

async function getOrCreateId(connection, table, nameColumn, value, idColumn) {
    const [result] = await connection.execute(
        `INSERT INTO ${table} (${nameColumn})
         VALUES (?)
         ON DUPLICATE KEY UPDATE
         ${idColumn} = LAST_INSERT_ID(${idColumn})`,
        [value]
    );

    return result.insertId;
}

async function loadData() {
    let connection;

    try {
        const rawRows = await readCsv();

        if (rawRows.length === 0) {
            throw new Error('CSV file is empty');
        }

        const rows = rawRows.map((row, index) =>
            validateRow(row, index + 2)
        );

        console.log(`Validated ${rows.length} matches`);

        connection = await mysql.createConnection(databaseConfig);
        await connection.beginTransaction();

        const teamCache = new Map();
        const seasonCache = new Map();

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];

            try {
                if (!seasonCache.has(row.season)) {
                    const id = await getOrCreateId(
                        connection,
                        'seasons',
                        'season_name',
                        row.season,
                        'season_id'
                    );
                    seasonCache.set(row.season, id);
                }

                for (const team of [row.homeTeam, row.awayTeam]) {
                    if (!teamCache.has(team)) {
                        const id = await getOrCreateId(
                            connection,
                            'teams',
                            'team_name',
                            team,
                            'team_id'
                        );
                        teamCache.set(team, id);
                    }
                }

                const seasonId = seasonCache.get(row.season);
                const homeId = teamCache.get(row.homeTeam);
                const awayId = teamCache.get(row.awayTeam);

                const [matchResult] = await connection.execute(
                    `INSERT INTO matches
                     (season_id, match_date, home_team_id,
                      away_team_id, home_goals, away_goals)
                     VALUES (?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                     match_id = LAST_INSERT_ID(match_id),
                     home_goals = VALUES(home_goals),
                     away_goals = VALUES(away_goals)`,
                    [
                        seasonId,
                        row.date,
                        homeId,
                        awayId,
                        row.homeGoals,
                        row.awayGoals
                    ]
                );

                const matchId = matchResult.insertId;

                const statistics = [
                    [
                        matchId, homeId, row.homePossession,
                        row.homeShots, row.homeRedCards
                    ],
                    [
                        matchId, awayId, row.awayPossession,
                        row.awayShots, row.awayRedCards
                    ]
                ];

                for (const stats of statistics) {
                    await connection.execute(
                        `INSERT INTO match_team_stats
                         (match_id, team_id, possession,
                          shots_on_target, red_cards)
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                         possession = VALUES(possession),
                         shots_on_target = VALUES(shots_on_target),
                         red_cards = VALUES(red_cards)`,
                        stats
                    );
                }

                if ((index + 1) % 500 === 0) {
                    console.log(`Processed ${index + 1} matches`);
                }
            } catch (error) {
                throw new Error(
                    `CSV row ${index + 2}: ${error.message}`
                );
            }
        }

        await connection.commit();

        console.log('Data load completed successfully');
        console.log(`Processed matches: ${rows.length}`);
        console.log(`Unique teams: ${teamCache.size}`);
        console.log(`Unique seasons: ${seasonCache.size}`);
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'Rollback failed:',
                    rollbackError.message
                );
            }
        }

        console.error('Data load failed:', error.message);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

loadData();
