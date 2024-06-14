# Client CRM Backend

## Installation Guide

Recomended Node Version v20.9.0

Install Client CRM Backend with yarn or npm. Recomended yarn

Delete yarn.lock file then run following command

```bash
  yarn
```

OR

```bash
  npm install
```

## Create New Schema/Database in mySql

Schema/Database Name:

```bash
client-crm
```

## Environment Variables

To run this project, you will need to add the environment variables to your .env file provided by Repo Owner.

Update .env following variables for your local database access

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_DATABASE=client-crm
DB_TYPE=mysql
```

## Run Project Command

```bash
yarn dev
```

## Access the Swagger Docs on browser

```bash
http://localhost:5000/docs

```


// 17th April, 2024

```sql
CREATE TABLE `applicant` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `userId` BIGINT NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `county` VARCHAR(255) NOT NULL,
  `postcode` VARCHAR(255) NOT NULL,
  `town` VARCHAR(255) NOT NULL,
  `desiredJob` VARCHAR(255) NOT NULL,
  `desiredMinSalary` DECIMAL(10,2) NOT NULL,
  `salaryRange` VARCHAR(255) NOT NULL,
  `jobType` VARCHAR(255) NOT NULL,
  `coverContent` TEXT NOT NULL,
  `autoApply` TINYINT(1) DEFAULT FALSE,
  `lastAppliedAt` DATE DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

```

```sql
CREATE TABLE `application` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `userId` BIGINT NOT NULL,
  `jobTitle` VARCHAR(255) NOT NULL,
  `applyCount` INT UNSIGNED DEFAULT 0,
  `source` ENUM('Reed', 'Total Jobs', 'CV Library') DEFAULT NULL,
  `date` DATE DEFAULT NULL,
  `applicantId` INT UNSIGNED NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `FK_application_applicant` FOREIGN KEY (`applicantId`) REFERENCES `applicant` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
);

```

Alter user table

```sql
ALTER TABLE user
ADD COLUMN targetSalary VARCHAR(255) DEFAULT NULL,
ADD COLUMN salary VARCHAR(255) DEFAULT NULL,
ADD COLUMN salesPerson VARCHAR(255) DEFAULT NULL,
ADD COLUMN source VARCHAR(255) DEFAULT 'Organic',
ADD COLUMN sector VARCHAR(255) DEFAULT NULL,
ADD COLUMN county VARCHAR(255) DEFAULT NULL,
ADD COLUMN package VARCHAR(255) DEFAULT NULL,
ADD COLUMN paymentType VARCHAR(255) DEFAULT NULL,
ADD COLUMN services VARCHAR(255) DEFAULT NULL,
ADD COLUMN referral VARCHAR(255) DEFAULT NULL,
ADD COLUMN discount VARCHAR(255) DEFAULT NULL;
```

```sql
CREATE TABLE TempClient (
    userId VARCHAR(255) PRIMARY KEY,
    firstName VARCHAR(255) DEFAULT 'first name',
    lastName VARCHAR(255) DEFAULT '',
    phone VARCHAR(255) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    portfolio TEXT DEFAULT '',
    profileSummary TEXT DEFAULT '',
    profileLink VARCHAR(255) DEFAULT '',
    workHistory TEXT,
    educations TEXT,
    trainings TEXT,
    certificates TEXT,
    volunteerings TEXT,
    publications TEXT,
    projects TEXT,
    memberships TEXT,
    patents TEXT,
    skills TEXT
);

```"# Cv-maker-bacend" 
