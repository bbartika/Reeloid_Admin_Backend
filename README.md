# 🎬 Reeloid Admin Backend

## 📌 Overview

Reeloid Admin Backend is a scalable **Node.js/Express backend system** designed for managing a short-video streaming platform.  
It enables administrators to manage movies, trailers, shorts, ads, and multilingual content while ensuring **high performance, scalability, and non-blocking operations**.

The system integrates **Tencent Cloud VOD** for media processing and uses **Redis + Bull Queue** for background job handling, ensuring smooth uploads and efficient processing of heavy media tasks.

---

## 🚀 Features

### 🎥 Media Management

- Upload and manage **movies, trailers, and short videos**
- Support for **multi-language audio uploads**
- Video/audio **transcoding via Tencent Cloud VOD**
- Device-friendly media URL generation

### ⚡ Background Processing

- Implemented **Redis + Bull Queue** for async job processing
- Handles **video uploads, transcoding, and audio processing** in background
- Ensures **non-blocking API performance**

### 🔄 Order Consistency System

- Maintains correct order of **shorts and audio files**
- Uses **index-based mapping** to prevent mismatch during async processing

### 📢 Advertisement System

- Dynamic **ad insertion system**
- Insert ads:
  - After a fixed number of reels
  - At custom positions
- Supports **custom ad management**

### 💳 Subscription System

- Manage premium plans
- Enable:
  - Ad-free viewing
  - Exclusive content access

### 🔔 Push Notification System

- Built using **Firebase**
- Supports:
  - Scheduled notifications
  - Recurring campaigns
  - Queue-based delivery

### 📊 Analytics Module

- Tracks:
  - User engagement
  - Watch time
  - Ad impressions
  - User activity
- Helps optimize **recommendations & revenue**

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB (Mongoose)

### Queue & Background Jobs
- Redis
- Bull Queue

### Cloud & Media Processing
- Tencent Cloud VOD
- Tencent COS (Object Storage)

### Notifications
- Firebase Cloud Messaging (FCM)

---

## ⚙️ Installation & Setup

## ⚙️ Installation & Setup

### Install Dependencies

npm install

PORT=5000

# MongoDB
MONGO_URI=your_mongodb_connection

# Tencent Cloud
SECRETID=your_secret_id
SECRETKEY=your_secret_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase
FIREBASE_SERVER_KEY=your_firebase_key



Start Server
npm start
## 🔁 Background Processing Flow

```text
Upload Request
   ↓
API Receives Data
   ↓
Push Job to Bull Queue
   ↓
Worker Processes Job (Async)
   ↓
Upload to Tencent Cloud (VOD/COS)
   ↓
Update Database with Media URLs

## 📞 Contact

- GitHub: https://github.com/bbartika
- Feel free to connect for collaboration or opportunities!
