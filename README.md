# User Health Tracker

**User Health Tracker** is a Node.js web application for managing users and tracking their health metrics over time.  
It started as a simple user registration and profile editor, and now includes **weight logging** with timestamps.  
The project currently supports **MySQL (relational)** and **MongoDB (NoSQL with Mongoose)**, giving flexibility for different use cases.

---

## Features
- **User Management**: Create, edit, and manage user profiles (email, address, balance, etc.).  
- **Weight Tracking**: Add multiple weight entries per user with a datetime stamp.  
- **Visualization (coming soon)**: Display user weight trends using charts.  
- **Authentication-ready**: Password hashing included; easy to extend with JWT sessions.  
- **RESTful APIs**: Expose user and weight data through JSON endpoints for frontend or third-party integration.  
- **Schema Documentation**: Both SQL and Mongo schemas documented for quick reference.  

---

## Tech Stack

- **Backend**: Node.js + Express  
- **Relational Database**: MySQL (InnoDB, utf8mb4)  
- **NoSQL Database**: MongoDB + Mongoose ODM  
- **API**: RESTful JSON endpoints  
- **Templating (UI)**: EJS (for server-rendered pages)  
- **Styling**: CSS (custom, Tailwind-ready)  

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- MongoDB 6+
- npm or yarn

### Clone and install
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install

# Database Schema Documentation

This project supports **two database backends**:

- **MySQL** (relational, InnoDB)  
- **MongoDB** (NoSQL, schema via Mongoose ODM)

---

## MySQL Schema

### Users Table
| Column     | Type         | Null | Notes                          |
|------------|--------------|------|--------------------------------|
| id         | INT PK       | NO   | AUTO_INCREMENT                 |
| email      | VARCHAR(255) | YES  | unique per user (add constraint later) |
| firstName  | VARCHAR(255) | YES  |                                |
| lastName   | VARCHAR(255) | YES  |                                |
| address    | VARCHAR(255) | YES  |                                |
| city       | VARCHAR(255) | YES  |                                |
| state      | VARCHAR(100) | YES  |                                |
| zipcode    | VARCHAR(10)  | YES  |                                |
| password   | VARCHAR(100) | YES  | hashed password                |
| created_at | DATETIME     | YES  | DEFAULT CURRENT_TIMESTAMP      |
| balance    | FLOAT        | YES  | consider DECIMAL for precision |

---

### UserWeights Table
| Column       | Type                  | Null | Notes                                |
|--------------|-----------------------|------|--------------------------------------|
| id           | BIGINT PK             | NO   | AUTO_INCREMENT                       |
| user_id      | INT FK                | NO   | References `Users.id`, ON DELETE CASCADE |
| weight_kg    | DECIMAL(6,2)          | NO   | stored in kilograms                  |
| taken_at_utc | DATETIME              | NO   | stored in UTC                        |
| source       | ENUM(manual,device,import) | NO | default `manual`                     |
| note         | VARCHAR(255)          | YES  | optional                              |
| created_at   | TIMESTAMP             | NO   | DEFAULT CURRENT_TIMESTAMP            |
| updated_at   | TIMESTAMP             | NO   | auto-updated                         |

**Indexes**
- `idx_user_time (user_id, taken_at_utc)` for quick time-based lookups  
- Foreign key: `user_id → Users.id` with **ON DELETE CASCADE**

---

### ER Diagram (MySQL)

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