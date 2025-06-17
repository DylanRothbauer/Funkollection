# (づ> v <)づ♡ Funkollection

Funkollection is your one-stop web application for tracking, organizing, and showcasing your Funko Pop collection. Whether you're a casual fan or a dedicated collector, this app is built to help you stay organized and inspired by your favorite characters.

---

## 🔍 Overview

As a Funko Pop collector, I realized there’s a Pop for everything I love — from TV shows to games to anime. But as my collection grew, it became harder to remember what I already owned. Funkollection was born to solve that — so you never accidentally buy a duplicate again.

---

## ✨ Features

- 📦 Add, edit, and remove Pops from your collection  
- 🧮 Filter, search, and sort your collection by franchise, exclusivity, or ID  
- 🧾 View total collection stats (planned)  
- 🌐 Responsive landing page with sections: About, Features, FAQ, Contact  
- 🎨 Styled with Tailwind CSS + PrimeVue components  
- 💬 FAQ section and About section included  
- 🔐 Authentication-ready (planned)

---

## 🧰 Tech Stack

- **Frontend Framework:** Vue 3 + Vite  
- **Styling:** Tailwind CSS, PrimeVue  
- **State Management:** Vue's built-in reactivity (Pinia or Vuex optional)  
- **Routing:** Vue Router (if multi-page)  
- **Backend:** (Planned) Node.js/Express + MongoDB or Firebase  
- **Version Control:** Git + Bitbucket  

---

## 📸 Screenshots

| Landing Page | Collection Table |
|--------------|------------------|
| ![Landing Page](./images/homeDemo.png) | ![Table Demo](./images/tableDemo.png) |

---

## 🚧 In Progress

- 🔒 User login and sign-up system  
- 📥 Pop wishlist  
- 💸 Estimated value tracker  
- 🧠 Duplicate detection  
- 📱 Mobile-first refinements  
- 🔁 Barcode scanning & auto-fill integration  

---

## 🐞 Known Bugs

- ❗ Pop images sometimes fail to load (CORS issue with test API)  
- 🧩 Responsive table overflow on smaller devices (WIP fix)  
- 🔍 Search occasionally returns inconsistent results (improving fuzzy logic)  

---

## 📁 Project Structure (simplified)
Funkollection/  
├── public/  
│ └── images/  
├── src/  
│ ├── assets/  
│ ├── components/  
│ ├── views/  
│ ├── App.vue  
│ └── main.js  
├── tailwind.config.js  
├── vite.config.js  
└── package.json  
