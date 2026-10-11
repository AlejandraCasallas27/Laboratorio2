
const fs = require('fs');
const csv = require('csv-parser');

const filePath = './football_matches (1).csv';
let count = 0;

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
        count++;

        if (count === 1) {
            console.log('CSV columns:');
            console.log(Object.keys(row));

            console.log('\nFirst match:');
            console.log({
                season: row.season,
                date: row.date,
                homeTeam: row.home_team,
                awayTeam: row.away_team,
                homeGoals: row.goal_home_ft,
                awayGoals: row.goal_away_ft,
                homePossession: row.home_possession,
                awayPossession: row.away_possession
            });
        }
    })
    .on('end', () => {
        console.log('\nTotal matches:', count);
    })
    .on('error', (error) => {
        console.error('CSV reading failed:', error.message);
        process.exitCode = 1;
    });
