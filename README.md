# 🍱 CampusBite — Enterprise Event-Driven Campus Food Delivery Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20-339933.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v4-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-v7-DC382D.svg?logo=redis&logoColor=white)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-v3.5-231F20.svg?logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-v24-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CampusBite** is a high-performance, event-driven microservices food ordering and delivery ecosystem built for **NIT Jamshedpur**. It seamlessly connects campus students living in hostels with canteen kitchens, delivery partners, and university administrators in real-time.

---

## 🏛️ Professional Monorepo & Microservices Architecture

```
CampusBite/
│
├── frontend/
│   ├── student/                # Student Web Portal (Port 3000)
│   ├── canteen/                # Kitchen Staff Portal (Port 3001)
│   ├── admin/                  # Admin Console (Port 3002)
│   ├── src/                    # Shared UI Components & Utility Libraries
│   ├── public/                 # Platform Assets & Media Files
│   ├── package.json
│   └── ...
│
├── services/                   # All Backend Services & Microservices
│   ├── main-service/           # Core API Gateway & Primary Server - Port 4000
│   │   ├── src/
│   │   │   ├── controllers/    # Request & Response HTTP Controllers
│   │   │   ├── routes/         # RESTful API Routing Layers (/api/v1/*)
│   │   │   ├── models/         # Mongoose MongoDB Data Models
│   │   │   ├── services/       # Core Domain Business Logic & Pipelines
│   │   │   └── utils/          # PDF Invoice Generator & Helpers
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── canteen-service/        # Canteen Queue Service - Port 4001
│   ├── admin-service/          # Admin Metrics Service - Port 4002
│   ├── payment-service/        # Razorpay Service - Port 4003
│   └── notification-service/   # Email & WhatsApp Dispatcher
│
├── docker-compose.yml          # Production Container Orchestration
├── README.md                   # Platform Architecture & Manual
├── .gitignore
└── .env.example
```

---

## 🚀 Key Microservices & Core Features

### 1. 🔑 Google OAuth 2.0 & JWT Authentication
- Unified Google Sign-In (`POST /api/v1/auth/google`) for students, canteen staff, and administrators.
- Automatic account provisioning with password hash auto-repair in development mode.
- Access token & Refresh token rotation with RBAC access verification.

### 2. 🏪 7 Campus Canteens & 10+ Food Items Per Outlet
- Complete coverage of **NIT Jamshedpur** food outlets: `Main Canteen`, `Amba Canteen & Fast Food`, `Hostel I Canteen`, `Hostel K Canteen`, `Hostel F-G Canteen`, `H1 Hostel Canteen`, and `Library Café`.
- Each canteen is loaded with 10–12 food items featuring high-resolution food photography (Thalis, Dosa, Burgers, Momos, Parathas, Maggi, Espresso, Sandwiches, Brownies).

### 3. ⚡ Live Canteen Status Control (`Online`, `Rush Mode`, `Pause Queue`)
- Kitchen staff selector allows picking any canteen and toggling live operating status:
  - **`Online`** ➔ `● Open Now` (15m standard prep time).
  - **`Rush Mode`** ➔ `⚡ PEAK RUSH HOUR` (30m prep time, peak hour warning banner).
  - **`Pause Queue`** ➔ `🚫 Queue Paused` (Temporarily pauses new orders to clear kitchen queue).
- Updates synchronize across student Home, Canteen List, Canteen Detail, and Checkout pages in **2-second real-time intervals**.

### 4. 📊 Real-Time SVG Analytics Dashboard
- Live analytics dashboard (`http://localhost:3001/analytics`) powered by 2-second real-time auto-polling:
  - **🥧 Order Status Donut / Pie Chart** (`CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`).
  - **📈 Peak Hourly Revenue Bar Graph** (2-hour sales windows from 8 AM to 10 PM).
  - **🚴 Fulfillment Channel Ratio** (Hostel Room Delivery vs Counter Pickup).
  - **🔥 Top Bestselling Food Items Leaderboard**.

### 5. 💳 Ultra-Fast Payment Pipeline & Interactive Overlay
- Resilient **Razorpay Payment Gateway** integration (`POST /api/v1/payments/verify`).
- Non-blocking background notification pipeline (`setImmediate`) delivering payment responses in **< 50ms**.
- Interactive frosted-glass loading overlay on Checkout page during verification.

### 6. 📧 PDF Tax Invoice & WhatsApp Integration
- Automatic itemized HTML & PDF tax invoice delivered directly to student registered email.
- Real-time WhatsApp receipt notification dispatched to student registered phone number.

### 7. 🛵 Smart Group Delivery Algorithm
- Batches hostel delivery orders heading to the same hostel within 30-minute delivery windows.
- Dynamically reduces delivery charges from ₹20 down to ₹10–15 per order.

---

## 📊 Event-Driven Kafka Data Pipeline

```
  [ Student Browser ]
          │
          ▼  POST /api/v1/orders
  ┌─────────────────┐
  │   API Gateway   │ ──( Creates Order: PENDING_PAYMENT )
  └────────┬────────┘
           │
           ▼  POST /api/v1/payments/verify
  ┌─────────────────┐
  │ Payment Service │ ──( Verifies Payment Signature )
  └────────┬────────┘
           │
           │  Publishes: ORDER_CONFIRMED (Kafka Event)
           ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    Apache Kafka Event Bus                   │
  └────────┬──────────────────────┬──────────────────────┬──────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ Canteen Service    │ │ Notification Service│ │ Admin Analytics    │
│ (Kitchen Queue 2s) │ │ (Email & WhatsApp) │ │ (Live Dashboard)   │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running.
- [Node.js v20+](https://nodejs.org/) (optional for local testing).

### One-Command Full Stack Startup
Launch all microservices, frontends, MongoDB, Redis, Kafka, and Zookeeper in isolated Docker containers:

```bash
docker-compose up --build
```

### Active Service Ports:
| Service | Service Component | Access URL |
| :--- | :--- | :--- |
| **Student Web App** | Student Portal | `http://localhost:3000` |
| **Canteen Web App** | Kitchen Queue Portal | `http://localhost:3001` |
| **Admin Web App** | Admin Dashboard | `http://localhost:3002` |
| **API Gateway** | Express Backend REST API | `http://localhost:4000` |
| **Canteen Microservice** | Canteen Service | `http://localhost:4001` |
| **Admin Microservice** | Analytics Service | `http://localhost:4002` |
| **Payment Microservice** | Payment Gateway Service | `http://localhost:4003` |

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Allowed Portals |
| :--- | :--- | :--- | :--- |
| **Student** | `rahul@nitjsr.ac.in` | `Student@123` | `http://localhost:3000` |
| **Canteen Staff** | `main.canteen@nitjsr.ac.in` | `Staff@123` | `http://localhost:3001` |
| **Administrator** | `admin@nitjsr.ac.in` | `Admin@123` | `http://localhost:3002` |

---

## 📄 License
This project is licensed under the **MIT License**.
Built for **NIT Jamshedpur** campus community.
#   c a m p u s B i t e  
 