
# Football Database Laboratory

## Description

This project implements a normalized MySQL database for
football match analysis using Node.js.

The dataset contains 4,070 matches from 11 seasons
and includes 37 different teams.

## Technologies

- MySQL 8
- Node.js
- mysql2
- csv-parser
- dotenv

## Database Structure

The database contains four tables:

- teams: Football team information.
- seasons: Season identifiers.
- matches: Match dates, teams, and final scores.
- match_team_stats: Possession, shots on target,
  and red cards for each team in a match.

## Installation

1. Clone or download this repository.
2. Open the project folder in a terminal.
3. Install dependencies:

   npm install

4. Create a `.env` file using `.env.example`
   as a template.
5. Configure the MySQL credentials in `.env`.

## Database Setup

1. Open MySQL Workbench.
2. Create a database named `football_lab`.
3. Execute `schema.sql` to create the tables.

## Data Import

Make sure the original CSV dataset is available
in the project folder.

Run:

   node loadData.js

## SQL Queries

The project includes two SQL files:

- `basic_queries.sql`: Four basic SQL queries.
- `analytical_queries.sql`: Four analytical
  queries focused on football statistics.

## Data Validation

After importing the dataset, the expected
record counts are:

| Table | Records |
|---|---:|
| teams | 37 |
| seasons | 11 |
| matches | 4070 |
| match_team_stats | 8140 |

## Security

Database credentials are stored in `.env`,
which is excluded from version control.

The `.env.example` file provides a safe
configuration template.
