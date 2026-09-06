# 🏠 BoardingHub (Mobile)

BoardingHub is a comprehensive mobile boarding place management and booking platform designed to help seekers easily find suitable boarding places while empowering boarding owners to efficiently manage their properties and direct tenant booking requests.

Built with a modern stack featuring **React Native (Expo)** for Mobile and **Spring Boot** with **PostgreSQL** for the backend REST API.

---

## 🚀 Project Vision

Finding a suitable boarding place is often challenging due to fragmented information, outdated listings, and lack of reliable booking systems.

**BoardingHub Mobile** provides a modern digital solution where:
- **Boarding Seekers** can search, filter, compare, and submit booking requests for boarding places according to their preferences with direct WhatsApp/Call contact options.
- **Boarding Owners** can register properties, manage availability, review booking requests, and interact directly with applicants.
- **System Administrators** can oversee platform activity, approve listings, manage users, and ensure system safety.

---

## ✨ Key Features

### 👤 Boarding Seeker
- **User Authentication**: Secure Registration (with WhatsApp number), Login, and JWT session management.
- **Search & Filters**: Search listings by location, price range, gender preference, and available amenities.
- **Property Details**: View detailed boarding information, room types, photos, reviews, and interactive map view.
- **Direct Owner Contact**: Call or chat with owners directly via WhatsApp.
- **Favorites & Bookmarks**: Save favorite boarding places for quick access.
- **Booking Request Management**: Submit booking requests, track real-time request statuses, and view booking history.
- **Ratings & Reviews**: Share feedback and rate boarding places.

### 🏠 Boarding Owner
- **Property Listing Management**: Add, edit, or remove boarding property listings with photos and details.
- **Room & Availability Management**: Track room capacity, occupant counts, and remaining space indicators.
- **Booking Request Control**: Accept or reject pending seeker booking requests with automatic room capacity deduction upon approval.
- **Direct Seeker Contact**: Connect directly with applicants via WhatsApp or phone call.
- **Owner Dashboard**: Track active listings, pending requests, and current occupancy.

### 🛡️ System Administrator
- **Listing Moderation**: Verify and approve new property submissions.
- **User Management**: Inspect and manage registered seeker and owner accounts.
- **System Analytics & Monitoring**: Monitor active bookings and platform metrics.

---

## 🛠️ Tech Stack

### 📱 Mobile Frontend
- **Framework**: React Native (Expo)
- **Navigation**: Custom State / Screen Router & Navigation Bar
- **Styling**: Modern React Native StyleSheet (Emerald `#1B4D3E` & Gold `#FFD700` palette)
- **HTTP Client**: Axios / React Context API

### ⚙️ Backend
- **Framework**: Java Spring Boot
- **Security**: Spring Security & JWT (JSON Web Tokens)
- **Data Access**: Spring Data JPA / Hibernate
- **Build Tool**: Maven
- **API Protocol**: RESTful Web Services

### 🗄️ Database
- **DBMS**: PostgreSQL
- **SQL Dialect**: PostgreSQL SQL
- **ORM / Persistence**: JPA / Hibernate

---

## 📂 Project Structure

```
boardinghub/
├── mobile/                   # React Native Mobile Application
│   ├── src/
│   │   ├── components/       # Reusable Mobile UI Components (HeaderBar, BottomNavBar, FilterModal, etc.)
│   │   ├── data/             # Mock Data (mockBoardings.js)
│   │   └── screens/          # Screen Views
│   │       ├── admin/        # Admin Screens (Dashboard, PendingProperties, UserManagement, etc.)
│   │       ├── auth/         # Login & Register Screens
│   │       ├── owner/        # Owner Screens (OwnerHome, AddProperty, RoomManagement, OwnerRequests, etc.)
│   │       └── seeker/       # Seeker Screens (Home, Search, Details, Bookings, MapView, Profile, etc.)
│   ├── App.js                # Central Router & Main Application Setup
│   ├── app.json / package.json
│   └── start-mobile.bat      # Script to launch mobile app dev server
│
├── backend/                  # Spring Boot REST API Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/boardinghub/
│   │   │   │   ├── controller/   # REST Controllers
│   │   │   │   ├── model/        # JPA Entities (User, Property, Room, BookingRequest, Review)
│   │   │   │   ├── repository/   # Spring Data Repositories
│   │   │   │   ├── service/      # Business Logic Services
│   │   │   │   └── security/     # JWT & Spring Security Config
│   │   │   └── resources/
│   │   │       └── application.properties
│   └── pom.xml               # Maven dependencies
│
├── docs/                     # SRS, Architecture & ER Diagrams
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js (v18+)** & **npm**
- **Expo Go App** (on iOS/Android) or Android Studio / iOS Simulator
- **Java Development Kit (JDK 17 or higher)**
- **PostgreSQL Database Server (v14+)**

---

### 1. 📱 Mobile Application Setup (React Native)

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the mobile development server:
   ```bash
   npm start
   ```
   *or run the provided batch script:*
   ```cmd
   start-mobile.bat
   ```
4. Scan the QR code with **Expo Go** on your mobile device to open the application.

---

### 2. 🗄️ Database Configuration (PostgreSQL)

Create a PostgreSQL database for the project:

```sql
CREATE DATABASE boardinghub_db;
```

Update your Spring Boot `application.properties` located in `backend/src/main/resources/`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/boardinghub_db
spring.datasource.username=postgres
spring.datasource.password=your_postgres_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=true
```

---

### 3. ⚙️ Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and run the Spring Boot application using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
   *or run the provided batch script:*
   ```cmd
   start-backend.bat
   ```
3. The REST API server will start on `http://localhost:8080`.

---

## 🔌 API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new Seeker / Owner | ❌ |
| `POST` | `/api/auth/login` | Authenticate & get JWT Token | ❌ |
| `GET` | `/api/boardings` | Get published boarding places | ❌ |
| `GET` | `/api/boardings/{id}` | Get boarding details by ID | ❌ |
| `POST` | `/api/boardings` | Create a new boarding listing | Owner |
| `PUT` | `/api/boardings/{id}` | Update boarding listing | Owner |
| `POST` | `/api/bookings` | Create a booking request | Seeker |
| `PATCH` | `/api/bookings/{id}/status` | Accept / Reject booking request | Owner |
| `POST` | `/api/reviews` | Submit rating & review for property | Seeker |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Sulari Gamage**  
*University of Moratuwa - Faculty of Information Technology*
