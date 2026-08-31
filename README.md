# 🏠 BoardingHub

BoardingHub is a comprehensive full-stack boarding place management and booking platform designed to help seekers easily find suitable boarding places while empowering boarding owners to efficiently manage their properties and bookings.

Built with a robust enterprise tech stack featuring **Spring Boot**, **React.js**, and **PostgreSQL**.

---

## 🚀 Project Vision

Finding a suitable boarding place is often challenging due to fragmented information, outdated listings, and lack of reliable booking systems.

**BoardingHub** provides a modern digital solution where:
- **Boarding Seekers** can search, filter, compare, and book boarding places according to their preferences.
- **Boarding Owners** can register properties, manage availability, review booking requests, and interact with tenants.
- **System Administrators** can oversee platform activity, approve listings, and ensure system security.

---

## ✨ Key Features

### 👤 Boarding Seeker
- **User Authentication**: Secure Registration, Login, and JWT Token-based session management.
- **Search & Filters**: Search listings by location, price range, gender preference, and available amenities.
- **Property Details**: View detailed boarding information, room types, photos, and owner contact details.
- **Interactive Map**: View boarding locations integrated with map services.
- **Favorites & Bookmarks**: Save favorite boarding places for quick access.
- **Booking Management**: Submit booking requests, view real-time booking status, and view booking history.
- **Ratings & Reviews**: Share feedback and rate boarding places after stay.

### 🏠 Boarding Owner
- **Property Listing Management**: Add, edit, or remove boarding property listings with details and pricing.
- **Image Gallery**: Upload and manage property photos.
- **Room & Availability Management**: Update available room counts, occupancy, and pricing tiers.
- **Booking Request Control**: Accept or reject pending seeker booking requests with custom notes.
- **Owner Dashboard**: Track active listings, pending requests, total earnings, and current tenants.

### 🛡️ System Administrator
- **Listing Moderation**: Verify and approve new property submissions.
- **User Management**: Manage registered seeker and owner accounts.
- **System Analytics**: View system metrics, total bookings, and user statistics.

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **Framework**: React.js
- **Routing**: React Router DOM
- **State & HTTP Client**: Axios / React Context API
- **Styling**: Modern Vanilla CSS / Tailwind CSS
- **Build Tool**: Vite / Create React App

### ⚙️ Backend
- **Framework**: Java Spring Boot
- **Security**: Spring Security & JWT (JSON Web Tokens)
- **Data Access**: Spring Data JPA / Hibernate
- **Build Tool**: Maven / Gradle
- **API Protocol**: RESTful Web Services

### 🗄️ Database
- **DBMS**: PostgreSQL
- **SQL Dialect**: PostgreSQL SQL
- **ORM / Persistence**: JPA / Hibernate

### 🌐 Third-Party Services & Tools
- **Image Storage**: Cloudinary / Firebase Storage
- **Maps API**: Google Maps API / Leaflet
- **API Testing & Documentation**: Postman / Swagger UI (Springdoc OpenAPI)

---

## 📂 Project Structure

```
boardinghub/
├── backend/                  # Spring Boot REST API Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/boardinghub/
│   │   │   │   ├── controller/   # REST Controllers / Endpoints
│   │   │   │   ├── model/        # JPA Entities (User, Property, Booking, Review)
│   │   │   │   ├── repository/   # Spring Data Repositories
│   │   │   │   ├── service/      # Business Logic Services
│   │   │   │   ├── security/     # JWT & Spring Security Config
│   │   │   │   └── dto/          # Data Transfer Objects
│   │   │   └── resources/
│   │   │       ├── application.yml / application.properties
│   │   │       └── db/migration/ # Flyway / Liquibase SQL migrations
│   └── pom.xml               # Maven dependencies
│
├── frontend/                 # React.js Web Application
│   ├── src/
│   │   ├── assets/           # Static images and styling assets
│   │   ├── components/       # Reusable UI Components
│   │   ├── pages/            # View Pages (Home, Search, Details, Dashboard)
│   │   ├── services/         # Axios API Services
│   │   ├── context/          # Auth Context & State Management
│   │   └── App.jsx           # Main Application & Router setup
│   ├── package.json
│   └── vite.config.js
│
├── docs/                     # SRS, Architecture & ER Diagrams
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- **Java Development Kit (JDK 17 or higher)**
- **Node.js (v18+)** & **npm**
- **PostgreSQL Database Server (v14+)**

---

### 1. 🗄️ Database Configuration (PostgreSQL)

Create a PostgreSQL database for the project:

```sql
CREATE DATABASE boardinghub_db;
```

Update your Spring Boot `application.properties` (or `application.yml`) located in `backend/src/main/resources/`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/boardinghub_db
spring.datasource.username=postgres
spring.datasource.password=your_postgres_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.show-sql=true
```

---

### 2. ⚙️ Backend Setup (Spring Boot)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and run the Spring Boot application using Maven:
   ```bash
   ./mvnw spring-boot:run
   ```
3. The REST API server will start on `http://localhost:8080`.

---

### 3. � Frontend Setup (React.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
4. Start the React development server:
   ```bash
   npm run dev
   ```
5. Open your browser and visit `http://localhost:5173`.

---

## 🔌 API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new User / Owner | ❌ |
| `POST` | `/api/auth/login` | Authenticate & get JWT Token | ❌ |
| `GET` | `/api/boardings` | Get all published boarding places | ❌ |
| `GET` | `/api/boardings/{id}` | Get boarding details by ID | ❌ |
| `POST` | `/api/boardings` | Create a new boarding listing | Owner |
| `PUT` | `/api/boardings/{id}` | Update boarding listing | Owner |
| `POST` | `/api/bookings` | Create a booking request | Seeker |
| `PATCH` | `/api/bookings/{id}/status` | Accept / Reject booking request | Owner |
| `POST` | `/api/reviews` | Submit rating & review for property | Seeker |

---

## 📖 Documentation

Additional technical documentation is maintained in the `/docs` folder:
- **Software Requirements Specification (SRS)**
- **Entity Relationship Diagram (ERD)**
- **System Architecture Diagram**
- **REST API Endpoint Specification**

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Sulari Gamage**  
*University of Moratuwa - Faculty of Information Technology*
