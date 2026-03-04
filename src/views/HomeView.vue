<script setup>
import { ref } from 'vue'
import flashImg from '../assets/img/funkoPop_Flash.png'
import obiImg from '../assets/img/funkoPop_Obi.png'

import { auth, provider } from '@/firebase.js'
import { getAuth, onAuthStateChanged, signInWithPopup } from 'firebase/auth'
import { db } from '@/firebase.js'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const router = useRouter()

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )

    router.push('/collection')
  } catch (error) {
    console.error(error)
  }
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
      <a @click="signInWithGoogle" class="signin">Sign In with Google</a>
    </div>
  </header>

  <main class="main-div w-screen h-screen items-center justify-center">
    <!-- Hero Section -->
    <div class="grid grid-col-1 md:grid-cols-6 gap-8 place-content-center py-16 md:py-32">

      <!-- Left -->
      <div class="grid w-full col-span-6 md:col-span-3 md:col-start-1 md:pr-12">
        <div>
          <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Collect.</h1>
          <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Organize.</h1>
          <h1 class="playfair-display-hometitle text-7xl landing-title font-bold">Showcase</h1>
          <p class="text-2xl home-text">
            The ultimate way to organize and showcase your <br />
            Funko Pop collection
          </p>
        </div>
      </div>
      <!-- Right -->
      <div class="hidden md:block grid w-full col-span-6 md:col-span-3 md:col-start-4 md:pl-12">
        <div class="pop-container">
          <div class="pop-circle bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"></div>
          <img class="pop-figure" src="../assets/img/funkoPop_Flash.png" />
        </div>
      </div>

    </div>

    <!-- Features -->
    <div class="grid grid-cols-1 md:grid-cols-6 gap-8 place-content-center py-16 md:py-32">
      <!-- Left -->
      <div class="hidden md:block grid w-full col-span-6 md:col-span-3 md:col-start-1 md:pr-12">
        <div class="pop-container">
          <div class="pop-circle bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"></div>
          <img class="pop-figure-obi" src="../assets/img/funkoPop_Obi.png" />
        </div>
      </div>
      <!-- Right -->
      <div class="grid w-full col-span-6 md:col-span-3 md:col-start-4 md:pl-12">
        <div class="justify-center items-center grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="flex items-center justify-center flex-col">
            <i
            class="pi pi-box feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text items-center">Collection Management</p>
          </div>

          <div class="flex items-center justify-center flex-col">
            <i
            class="pi pi-chart-bar feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text">Statistics & Graphs</p>
          </div>

          <div class="flex items-center justify-center flex-col">
            <i
            class="pi pi-search feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text">Search & Filter</p>
          </div>

          <div class="flex items-center justify-center flex-col">
            <i
            class="pi pi-user feature-icon bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text"
          ></i>
          <p class="feature-text">Authentication</p>
          </div>
        </div>
      </div>
    </div>

    <!-- About -->
    <div class="grid grid-cols-1 md:grid-cols-6 gap-8 place-content-center py-16 md:py-32">
      <!-- Left Column-->
      <div class="grid w-full col-span-6 md:col-span-3 md:col-start-1 md:pr-12">
        <h1 class="playfair-display-hometitle text-4xl md:text-7xl landing-title font-bold">About</h1>
        <p class="text-2xl/12 home-text">{{ aboutText }}</p>
      </div>

      <!-- Right Column -->
      <div class="grid w-full col-span-6 md:col-span-3 md:col-start-4 md:pl-12">
        <div>
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

    <!-- Testimonials  -->
    <div class="grid grid-cols-6 gap-8 place-content-center py-32">
        <h1
        class="playfair-display-hometitle text-7xl landing-title font-bold grid col-span-6 col-start-1"
        style="display: grid; place-items: center;"
      >
        Testimonials
      </h1>

      <div class="col-span-6 grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
        <div>
          <Card class="w-full">
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

        <div>
          <Card class="w-full">
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

        <div>
          <Card class="w-full">
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

    </div>

    <!-- FAQ -->
    <div class="grid grid-cols-6 gap-8 place-content-center py-16 md:py-32">
      <h1
        class="playfair-display-hometitle text-7xl landing-title font-bold grid col-span-6 col-start-1"
        style="display: grid; place-items: center;"
      >
        FAQs
      </h1>

      <div class="grid col-span-6 gap-4">
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

    <!-- CTA -->
    <div class="grid grid-cols-1 md:grid-cols-6 gap-8 place-content-center py-16 md:py-32">

      <!-- Left Column-->
      <div class="hidden md:block grid w-full col-span-1 md:col-span-3 md:col-start-1 pr-6 md:pr-12">
        <div class="pop-container">
          <div class="pop-circle bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-300"></div>
          <img class="pop-figure-obi" src="../assets/img/funkoPop_Obi.png" />
        </div>
      </div>

      <!-- Right Column -->
      <div class="grid w-full col-span-1 md:col-span-3 md:col-start-4 pl-6 md:pl-12">
        <h1 class="playfair-display-hometitle text-4xl md:text-7xl landing-title font-bold">
          Start Your Collection Today
        </h1>
        <p class="text-2xl/12 home-text">
          Join collectors around the world who are organizing, tracking, and showcasing their Funko
          Pop collections in one place.
        </p>
        <div class="auth-links w-fit" style="padding-top: 2rem">
          <a @click="signInWithGoogle" class="login google-btn signin">Sign In with Google</a>
        </div>
      </div>

    </div>

    <!-- Footer -->
     <footer>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 place-content-center py-16 md:py-32">
        <div>
          <p class="text-2xl/12 home-text">Funkollection</p>
          <p>
            Your one-stop app for organizing, tracking, and showcasing your Funko Pop collection.
          </p>
          <div class="flex gap-x-6 justify-start" style="padding-top: 2rem">
              <a class="pi pi-github" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-instagram" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-tiktok" href="/" target="_blank" rel="noopener noreferrer"></a>
              <a class="pi pi-youtube" href="/" target="_blank" rel="noopener noreferrer"></a>
            </div>
        </div>

        <div>
          <p class="text-2xl/12 home-text">Quick Links</p>
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

        <div>
           <p class="text-2xl/12 home-text">Company</p>
           <div class="flex-col">
            <div>
              <a href="/aboutus" class="footer-link">About Us</a>
            </div>

            <div>
              <a href="/termsofservice" class="footer-link">Terms of Use</a>
            </div>

            <div>
              <a href="/privacypolicy" class="footer-link">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div>
          <p class="text-2xl/12 home-text">Get in Touch</p>
          <p>
              Have feedback or questions? Reach out via social media!
            </p>
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
  /* margin-right: 12rem;
  padding-left: 12rem;
  padding-right: 12rem;
  padding-top: 15rem;
  width: 100%; */
  padding-top: 8rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

@media (min-width: 768px) {
  .main-div {
    padding-top: 15rem;
    padding-left: 12rem;
    padding-right: 12rem;
  }
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
  gap: 1rem;
}
.auth-links a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  padding: 1rem;
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
  width: 30rem;
  height: 30rem;
}

.pop-img {
  width: 42rem;
  height: 42rem;
  position: absolute;        /* Take it out of the circle's flow */
  top: -4rem;
  left: 50%;
  transform: translateX(-50%); /* Center it horizontally */
}

.pop-container {
  position: relative;
  width: 20rem;
  height: 20rem;
}

@media (min-width: 768px) {
  .pop-container {
    width: 40rem;
    height: 40rem;
  }
}

.pop-circle {
  width: 70%;
  height: 70%;
  border-radius: 50%;
}

.pop-figure {
  position: absolute;
  width: 130%;          /* Bigger than the circle */
  height: 130%;
  object-fit: contain;
  top: 50%;
  left: 50%;
  transform: translate(-65%, -62%);
}

.pop-figure-obi {
  position: absolute;
  width: 80%;          /* Bigger than the circle */
  height: 75%;
  object-fit: contain;
  top: 50%;
  left: 50%;
  transform: translate(-68%, -68%);
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
