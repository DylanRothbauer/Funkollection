<script setup>
import { ref } from 'vue'
import flashImg from '../assets/img/funkoPop_Flash.png'
import obiImg from '../assets/img/funkoPop_Obi.png'

import { auth, provider } from '../firebase.js'
import { getAuth, signInWithPopup } from 'firebase/auth'
import { db } from '../firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()

const singInWithGoogle = () => {
  signInWithPopup(getAuth(), provider)
    .then((result) => {
      console.log(result.user)
      router.push('/dashboard')
    })
    .catch((error) => {})
}

const images = [
  { src: flashImg, alt: 'Funko Pop Flash' },
  { src: obiImg, alt: 'Funko Pop Obi' },
]

const aboutText = `My journey with Funko Pops started when I realized there was a Pop for almost everything I loved —
from movies and games to shows and childhood icons. As my collection grew, so did the challenge of keeping track.
I often found myself asking, “Do I already own this one?” That simple question became the inspiration behind Funkollection —
a place to organize, showcase, and celebrate your collection with confidence. Whether you're just starting out or curating
shelves of Pops, Funkollection is here to help you keep track of what you love.`

const faqs = [
  {
    question: 'What is Funkollection?',
    answer:
      'Funkollection is a free tool that helps you organize, track, and showcase your Funko Pop collection online.',
  },
  {
    question: 'How do I add a Pop to my collection?',
    answer:
      'Once you’re signed in, you can use the “Add Pop” button to enter details like name, category, number, tile, and more!',
  },
  // Add more FAQs as needed

  // Test for stats
]
</script>

<template>
  <header class="landing-header">
    <div class="app-name">Funkollection</div>
    <div class="auth-links">
      <!-- <a href="#" @click.prevent="signInWithGoogle" class="signin">Sign In with Google</a> -->
      <router-link to="/dashboard" @click="singInWithGoogle" class="signin"
        >Sign In with Google</router-link
      >
    </div>
  </header>
  <main class="main-div w-screen h-screen">
    <!-- Title -->
    <!-- Left Column-->
    <div class="section-div flex" id="home">
      <div class="flex-1">
        <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Collect.</h1>
        <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Organize.</h1>
        <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Showcase</h1>
        <p class="text-2xl home-text">
          The ultimate way to organize and showcase your <br />
          Funko Pop collection
        </p>
      </div>
      <!-- Right Column -->
      <div
        class="flex-1 relative w-64 h-64 flex items-center justify-center"
        style="padding-right: 0rem"
      >
        <div
          class="gradient-circle absolute w-96 h-96 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"
        ></div>
        <img
          class="pop-img relative w-96 h-96 object-contain z-10"
          src="../assets/img/funkoPop_Flash.png"
        />
      </div>
    </div>

    <!-- Features -->
    <div class="section-div flex flex-row" id="features">
      <!-- Left column: vertical stack -->
      <div class="flex-1 flex flex-col gap-y-4 relative w-64 h-64 flex items-left justify-center">
        <div
          class="gradient-circle absolute w-95 h-95 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"
        ></div>
        <img
          class="relative w-95 h-95 object-contain z-10"
          src="../assets/img/funkoPop_Obi.png"
          style="width: 27rem; height: 30rem"
        />
      </div>
      <!-- Right column: horizontal row inside -->
      <div class="flex-1 flex flex-row gap-x-4">
        <div class="flex-col flex-1 flex items-center justify-center">
          <i
            class="pi pi-box feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <div>
            <p class="feature-text items-center">Collection Management</p>
          </div>

          <i
            class="pi pi-chart-bar feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text">Statistics & Graphs</p>
        </div>

        <div class="flex-col flex-1 flex items-center justify-center">
          <i
            class="pi pi-search feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <div>
            <p class="feature-text">Search & Filter</p>
          </div>

          <i
            class="pi pi-user feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text">Authentication</p>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="section-div flex" id="about">
      <!-- Left Column: Text -->
      <div class="flex-col flex-1">
        <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">About</h1>
        <p class="text-2xl/12 home-text">{{ aboutText }}</p>
      </div>
      <!-- Right Column: Image -->
      <div class="flex-col flex-1" style="max-height: 32rem">
        <div class="about w-full flex flex-col items-center justify-start">
          <Carousel :value="images" :numVisible="1" :numScroll="1" circular>
            <template #item="slotProps">
              <div class="flex flex-col items-center justify-center">
                <img
                  :src="slotProps.data.src"
                  :alt="slotProps.data.alt"
                  class="w-80 h-80 object-contain"
                  style="width: 42rem; height: 42rem"
                />
                <p class="mt-2">{{ slotProps.data.alt }}</p>
              </div>
            </template>
          </Carousel>
        </div>
      </div>
    </div>

    <!-- Testimonials -->
    <div class="flex justify-center" id="testimonials">
      <h1
        class="playfair-display-hometitle text-7xl landing-title font-bold"
        style="align-items: center"
      >
        Testimonials
      </h1>
    </div>
    <div class="section-div flex">
      <div class="flex-col flex-1">
        <Card style="width: 25rem; overflow: hidden">
          <template #header>
            <img alt="user header" src="/src/assets/img/funkoPop_Flash.png" />
            <div class="flex justify-center gap-x-8">
              <i v-for="n in 5" :key="n" class="pi pi-star-fill star"> </i>
            </div>
          </template>
          <template #title>Advanced Card</template>
          <template #subtitle>Card subtitle</template>
          <template #content>
            <p class="m-0">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur
              error repudiandae numquam deserunt quisquam repellat libero asperiores earum nam
              nobis, culpa ratione quam perferendis esse, cupiditate neque quas!
            </p>
          </template>
          <template #footer> </template>
        </Card>
      </div>
      <div class="flex-col flex-1">
        <Card style="width: 25rem; overflow: hidden">
          <template #header>
            <img alt="user header" src="/src/assets/img/funkoPop_Flash.png" />
            <div class="flex justify-center gap-x-8">
              <i v-for="n in 5" :key="n" class="pi pi-star-fill star"> </i>
            </div>
          </template>
          <template #title>Advanced Card</template>
          <template #subtitle>Card subtitle</template>
          <template #content>
            <p class="m-0">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur
              error repudiandae numquam deserunt quisquam repellat libero asperiores earum nam
              nobis, culpa ratione quam perferendis esse, cupiditate neque quas!
            </p>
          </template>
          <template #footer> </template>
        </Card>
      </div>
      <div class="flex-col flex-1">
        <Card style="width: 25rem; overflow: hidden">
          <template #header>
            <img alt="user header" src="/src/assets/img/funkoPop_Flash.png" />
            <div class="flex justify-center gap-x-8">
              <i v-for="n in 5" :key="n" class="pi pi-star-fill star"> </i>
            </div>
          </template>
          <template #title>Advanced Card</template>
          <template #subtitle>Card subtitle</template>
          <template #content>
            <p class="m-0">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Inventore sed consequuntur
              error repudiandae numquam deserunt quisquam repellat libero asperiores earum nam
              nobis, culpa ratione quam perferendis esse, cupiditate neque quas!
            </p>
          </template>
          <template #footer> </template>
        </Card>
      </div>
    </div>

    <!-- FAQ -->
    <div class="flex justify-center" id="faq">
      <h1
        class="playfair-display-hometitle text-7xl landing-title font-bold"
        style="align-items: center"
      >
        FAQs
      </h1>
    </div>
    <div class="section-div flex">
      <div class="flex-1">
        <div class="card">
          <Accordion>
            <AccordionPanel v-for="(faq, i) in faqs" :key="i" :value="i" class="w-full flex-1">
              <AccordionHeader>
                <h1 class="faq-text-question">
                  {{ faq.question }}
                </h1>
              </AccordionHeader>
              <AccordionContent>
                <p class="">
                  {{ faq.answer }}
                </p>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="section-div flex">
      <div class="flex-col flex-1">
        <div class="flex-1 flex flex-col gap-y-4 relative flex items-left justify-center">
          <div
            class="gradient-circle absolute w-95 h-95 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"
          ></div>
          <img
            class="relative w-95 h-95 object-contain z-10"
            src="../assets/img/funkoPop_Obi.png"
            style="width: 27rem; height: 30rem"
          />
        </div>
      </div>

      <div class="flex-col flex-1">
        <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">
          Start Your Collection Today
        </h1>
        <p class="text-2xl/12 home-text">
          Join collectors around the world who are organizing, tracking, and showcasing their Funko
          Pop collections in one place.
        </p>
        <div class="auth-links" style="padding-top: 2rem">
          <a @click="signInWithGoogle" class="login google-btn signin">Sign In with Google</a>
        </div>
      </div>
    </div>
    <footer>
      <div class="section-div flex">
        <div class="flex-col flex-1">
          <p class="text-2xl/12 home-text">Funkollection</p>
          <p>
            Your one-stop app for organizing, tracking, and showcasing your Funko Pop collection.
          </p>
          <div class="flex-row">
            <div class="flex gap-x-6 justify-start" style="padding-top: 2rem">
              <a class="pi pi-github" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-instagram" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-tiktok" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-youtube" href="/" target="_blank" rel="noopener noreferrer"></a>
            </div>
          </div>
        </div>
        <div class="flex-col flex-1">
          <p class="text-2xl/12 home-text">Quick Links</p>
          <div class="flex-col">
            <div>
              <a href="#home" class="footer-link">Home</a>
            </div>

            <div>
              <a href="#features" class="footer-link">Features</a>
            </div>

            <div>
              <a href="#about" class="footer-link">About</a>
            </div>

            <div>
              <a href="#testimonials" class="footer-link">Testimonials</a>
            </div>

            <div>
              <a href="#faq" class="footer-link">FAQs</a>
            </div>
          </div>
        </div>
        <div class="flex-col flex-1">
          <p class="text-2xl/12 home-text">Company</p>
          <div class="flex-col">
            <div>
              <a href="/" class="footer-link">About Us</a>
            </div>

            <div>
              <a href="/" class="footer-link">Terms of Use</a>
            </div>

            <div>
              <a href="/" class="footer-link">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div class="flex-col flex-1">
          <p class="text-2xl/12 home-text">Get in Touch</p>
          <div class="flex-col">
            <p>
              Have feedback or questions? Reach out via social media or email us at:
              support@funkollection.app
            </p>
          </div>
        </div>
      </div>
      <Divider />
      <div class="flex-row flex-1">
        <p>@2025 Funkollection. All rights reserved.</p>
      </div>
    </footer>
  </main>
</template>

<style>
.p-carousel-indicator-active .p-carousel-indicator-button {
  background: #00ff73 !important;
}

.playfair-display-hometitle {
  font-family: 'Playfair Display', serif;
  font-optical-sizing: auto;
  font-weight: 900;
  font-style: normal;
}

.main-div {
  margin-right: 12rem;
  padding-left: 12rem;
  padding-right: 12rem;
}

.landing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem 1rem 2rem;
  background: white;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}
.app-name {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}
.auth-links {
  display: flex;
  gap: 1rem;
}
.auth-links a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  transition: background 0.2s;
}
.auth-links a.login:hover {
  background: #f0f0f0;
}
.auth-links a.signin {
  background: #333;
  color: #fff;
}
.auth-links a.signin:hover {
  background: grey;
  cursor: pointer;
}

.landing-title {
  padding-bottom: 22px;
}

.home-text {
  color: #555;
}

.section-div {
  padding-bottom: 25rem;
  margin-left: 2rem;
  align-items: flex-start;
}

.feature-icon {
  font-size: 7rem !important;
}

.feature-text {
  font-weight: bold;
  font-size: 2rem;
}

.gradient-circle {
  width: 27rem;
  height: 27rem;
}

.pop-img {
  width: 42rem;
  height: 42rem;
}

.star {
  color: gold;
  border: black;
  font-size: 2rem !important; /* Overrides .pi font-size */
}

.faq-text-question {
  /* Same as feature card */
  font-size: var(--p-card-title-font-size);
  font-weight: var(--p-card-title-font-weight);
}

.footer-link {
  color: gray;
}

.footer-link:hover {
  text-decoration: underline;
}
</style>
