# Kiet - Smart Library Management System

Kiet is a modern, AI-powered Library Management System (LMS) designed to enhance the experience for both students and administrators. It features real-time seat monitoring, an AI recommendation engine, and a seamless book borrowing workflow.

## 🚀 Key Features

### 1. 🤖 AI Recommendation Engine
- Powered by **Google Gemini**.
- Analyzes user's viewing history to suggest 3 personalized books from the catalog.
- Provides a "Librarian's Note" explaining *why* those books were chosen.

### 2. 🪑 Real-Time Seat Monitoring
- Visualizes library occupancy in real-time.
- Interactive **Seat Map** showing exact empty seats across 3 zones (Main Hall, Quiet Zone, Media Center).
- Simulated live data updates.

### 3. 📚 Smart Catalog & Management
- **Student Portal**: Browse books, search by title/author/genre, add to wishlist, and borrow/return books.
- **Admin Portal**: Manage inventory, add new books (with auto-fetched covers), and toggle stock status.
- **Wishlist**: Save books for later.

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript), Tailwind CSS
- **Icons**: Lucide React
- **AI**: Google Gemini API (`@google/genai`)
- **Animation**: CSS Transitions & Tailwind
- **Data**: Open Library API (for book covers)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/prbeech/libmanagement.git
   cd libmanagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## 🔐 Login Credentials (Demo)

- **Student Login**: Enter any name or ID (e.g., `S1024`).
- **Admin Login**:
  - Username: `admin`
  - Password: `admin`

---
© 2024 Kiet Group of Institutions