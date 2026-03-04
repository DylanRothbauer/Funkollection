<script setup>
import flashImg from '../assets/img/funkoPop_Flash.png'
import obiImg from '../assets/img/funkoPop_Obi.png'

const images = [
  { src: flashImg, alt: 'Funko Pop Flash' },
  { src: obiImg, alt: 'Funko Pop Obi-Wan Kenobi' },
]

const stats = [
  { value: '1000+', label: 'Pops Tracked' },
  { value: '500+', label: 'Collectors' },
  { value: '100+', label: 'Categories' },
]

const values = [
  { icon: 'pi pi-heart', title: 'Passion', description: 'Built by a collector, for collectors. We understand the joy of the hunt and the pride of a growing collection.' },
  { icon: 'pi pi-shield', title: 'Simplicity', description: 'No clutter, no confusion. Funkollection keeps your collection organized and accessible in just a few clicks.' },
  { icon: 'pi pi-users', title: 'Community', description: 'Collectors around the world trust Funkollection to track and showcase what they love most.' },
]
</script>

<template>
  <div class="about-page">
    <div class="about-container">

      <!-- Back Button -->
      <RouterLink to="/" class="back-btn">
        <span class="back-arrow">←</span> Back
      </RouterLink>

      <!-- Hero -->
      <div class="about-hero">
        <div class="about-hero-left">
          <p class="about-eyebrow">Our Story</p>
          <h1 class="about-title">About Funkollection</h1>
          <p class="about-intro">
            My journey with Funko Pops started when I realized there was a Pop for almost
            everything I loved — from movies and games to shows and childhood icons. As my
            collection grew, so did the challenge of keeping track. I often found myself asking,
            "Do I already own this one?" That simple question became the inspiration behind
            Funkollection — a place to organize, showcase, and celebrate your collection with
            confidence. Whether you're just starting out or curating shelves of Pops,
            Funkollection is here to help you keep track of what you love.
          </p>
        </div>
        <div class="about-hero-right">
          <Carousel :value="images" :numVisible="1" :numScroll="1" circular>
            <template #item="slotProps">
              <div class="carousel-item">
                <img :src="slotProps.data.src" :alt="slotProps.data.alt" class="carousel-img" />
                <p class="carousel-label">{{ slotProps.data.alt }}</p>
              </div>
            </template>
          </Carousel>
        </div>
      </div>

      <!-- Stats -->
      <div class="about-stats">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <!-- Mission -->
      <div class="about-mission">
        <h2 class="section-title">Our Mission</h2>
        <p class="section-text">
          Funkollection was built with one goal in mind — to give collectors a simple, beautiful
          home for their Funko Pop collections. No spreadsheets, no guessing, no duplicate purchases.
          Just a clean, easy-to-use tool that lets you focus on what matters: the collection itself.
        </p>
      </div>

      <!-- Values -->
      <div class="about-values">
        <h2 class="section-title">What We Stand For</h2>
        <div class="values-grid">
          <div v-for="value in values" :key="value.title" class="value-card">
            <i :class="value.icon + ' value-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text'"></i>
            <h3 class="value-title">{{ value.title }}</h3>
            <p class="value-description">{{ value.description }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="about-cta">
        <h2 class="cta-title">Ready to Start Your Collection?</h2>
        <p class="cta-text">Join collectors around the world who are organizing and showcasing their Funko Pops in one place.</p>
        <RouterLink to="/" class="cta-btn">Get Started</RouterLink>
      </div>

    </div>
  </div>
</template>

<style scoped>
.about-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 6rem 1.5rem 4rem;
  font-family: 'Georgia', serif;
  display: flex;
  justify-content: center;
}

.about-container {
  max-width: 900px;
  width: 100%;
}

/* Back Button */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: #888;
  font-family: sans-serif;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #333;
}

/* Hero */
.about-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  margin-bottom: 5rem;
  padding-bottom: 4rem;
  border-bottom: 2px solid #e5e5e5;
}

.about-eyebrow {
  font-family: sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #c084fc, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.75rem;
}

.about-title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  line-height: 1.15;
}

.about-intro {
  font-size: 1.05rem;
  line-height: 1.9;
  color: #555;
}

.carousel-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.carousel-img {
  width: 100%;
  max-width: 22rem;
  height: 22rem;
  object-fit: contain;
}

.carousel-label {
  margin-top: 0.75rem;
  font-family: sans-serif;
  font-size: 0.9rem;
  color: #888;
}

/* Stats */
.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 5rem;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #c084fc, #f472b6, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-family: sans-serif;
  font-size: 0.9rem;
  color: #888;
  font-weight: 500;
}

/* Mission */
.about-mission {
  margin-bottom: 5rem;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 1.25rem;
}

.section-text {
  font-size: 1.05rem;
  line-height: 1.9;
  color: #555;
  max-width: 680px;
}

/* Values */
.about-values {
  margin-bottom: 5rem;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.value-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.value-icon {
  font-size: 2.5rem !important;
}

.value-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.value-description {
  font-family: sans-serif;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #666;
  margin: 0;
}

/* CTA */
.about-cta {
  background: linear-gradient(135deg, #c084fc22, #f472b622, #fbbf2422);
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 3.5rem;
  text-align: center;
}

.cta-title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.cta-text {
  font-family: sans-serif;
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.7;
}

.cta-btn {
  display: inline-block;
  background: #333;
  color: #fff;
  text-decoration: none;
  font-family: sans-serif;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.cta-btn:hover {
  background: #555;
}

/* Responsive */
@media (max-width: 768px) {
  .about-hero {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .about-title {
    font-size: 2rem;
  }

  .about-stats {
    grid-template-columns: 1fr;
  }

  .values-grid {
    grid-template-columns: 1fr;
  }

  .about-cta {
    padding: 2rem;
  }
}
</style>