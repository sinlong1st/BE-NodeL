# Database Schema (MySQL)

## Conventions
- Timezone: store **UTC** in DATETIME columns; convert at edges.
- Units: weights stored in **kg**.
- Character set: **utf8mb4** for new tables.

## Tables

### Users
| Column      | Type          | Null | Notes                       |
|-------------|---------------|------|-----------------------------|
| id          | INT (PK)      | NO   | AUTO_INCREMENT              |
| email       | VARCHAR(255)  | YES  | Unique (add when needed)    |
| firstName   | VARCHAR(255)  | YES  |                             |
| lastName    | VARCHAR(255)  | YES  |                             |
| address     | VARCHAR(255)  | YES  |                             |
| city        | VARCHAR(255)  | YES  |                             |
| state       | VARCHAR(100)  | YES  |                             |
| zipcode     | VARCHAR(10)   | YES  |                             |
| password    | VARCHAR(100)  | YES  | hashed                      |
| created_at  | DATETIME      | YES  | DEFAULT CURRENT_TIMESTAMP   |
| balance     | FLOAT         | YES  | consider DECIMAL later      |

### UserWeights
| Column        | Type                  | Null | Notes                                |
|---------------|-----------------------|------|--------------------------------------|
| id            | BIGINT (PK)           | NO   | AUTO_INCREMENT                       |
| user_id       | INT (FK → Users.id)   | NO   | ON DELETE CASCADE                    |
| weight_kg     | DECIMAL(6,2)          | NO   | stored in kg                         |
| taken_at_utc  | DATETIME              | NO   | UTC                                  |
| source        | ENUM(manual,device,import) | NO | default manual                       |
| note          | VARCHAR(255)          | YES  | optional                              |
| created_at    | TIMESTAMP             | NO   | DEFAULT CURRENT_TIMESTAMP            |
| updated_at    | TIMESTAMP             | NO   | auto-updated                         |

### Indexes
- `UserWeights(user_id, taken_at_utc)` — recent charts and lookups.

## Relationships
- Users 1—* UserWeights

## ER Diagram

```mermaid
erDiagram
  Users ||--o{ UserWeights : has
  Users {
    INT id PK
    VARCHAR email
    VARCHAR firstName
    VARCHAR lastName
    VARCHAR address
    VARCHAR city
    VARCHAR state
    VARCHAR zipcode
    VARCHAR password
    DATETIME created_at
    FLOAT balance
  }
  UserWeights {
    BIGINT id PK
    INT user_id FK
    DECIMAL weight_kg
    DATETIME taken_at_utc
    ENUM source
    VARCHAR note
    TIMESTAMP created_at
    TIMESTAMP updated_at
  }