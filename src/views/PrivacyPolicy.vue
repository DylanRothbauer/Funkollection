<script setup>
const sections = [
  {
    number: '1',
    title: 'Information We Collect',
    content: 'When you sign in to Funkollection using Google Sign-In, we receive and store the following information from your Google account:',
    bullets: [
      'Email address',
      'Display name',
      'Profile photo URL (provided by Google)',
      'A unique user ID assigned by Google',
    ],
    footer: 'We do not collect passwords, payment information, or any other personal data beyond what is listed above.',
  },
  {
    number: '2',
    title: 'How We Use Your Information',
    content: 'We use the information we collect solely to:',
    bullets: [
      'Create and manage your Funkollection account',
      'Display your profile within the app',
      'Identify you when you return to the Service',
    ],
    footer: 'We do not sell, rent, or share your personal information with third parties for marketing purposes.',
  },
  {
    number: '3',
    title: 'How We Store Your Information',
    content: 'Your information is stored securely in Google Firebase Firestore, a cloud database provided by Google LLC. Firebase is subject to Google\'s own privacy and security standards. You can learn more at https://firebase.google.com/support/privacy.',
  },
  {
    number: '4',
    title: 'Google Sign-In',
    content: 'We use Google OAuth 2.0 for authentication. When you sign in with Google, you are agreeing to Google\'s Terms of Service and Privacy Policy. We only request the minimum permissions necessary to create your account (email, name, and profile photo).',
    footer: 'You can review Google\'s Privacy Policy at https://policies.google.com/privacy.',
  },
  {
    number: '5',
    title: 'Cookies and Tracking',
    content: 'We do not use tracking cookies or third-party analytics tools. Firebase may use session tokens to keep you signed in, which are stored locally in your browser.',
  },
  {
    number: '6',
    title: 'Data Retention',
    content: 'Your account data is retained for as long as your account is active. If you wish to have your data deleted, please contact us and we will remove your information from our systems within a reasonable timeframe.',
  },
  {
    number: '7',
    title: "Children's Privacy",
    content: 'Funkollection is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
  },
  {
    number: '8',
    title: 'Your Rights',
    content: 'Depending on your location, you may have the right to:',
    bullets: [
      'Access the personal data we hold about you',
      'Request correction of inaccurate data',
      'Request deletion of your data',
      'Withdraw consent at any time by discontinuing use of the Service',
    ],
    footer: 'To exercise any of these rights, please contact us using the information below.',
  },
  {
    number: '9',
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page. We encourage you to review this policy periodically. Continued use of the Service after any changes constitutes your acceptance of the updated policy.',
  },
  {
    number: '10',
    title: 'Contact Us',
    content: 'If you have any questions or concerns about this Privacy Policy, please contact us via our social media channels linked on the Funkollection website at funkollection.com.',
  },
]
</script>

<template>
  <div class="policy-page">
    <div class="policy-container">

      <!-- Back Button -->
      <RouterLink to="/" class="back-btn">
        <span class="back-arrow">←</span> Back
      </RouterLink>

      <!-- Header -->
      <div class="policy-header">
        <h1 class="policy-title">Privacy Policy</h1>
        <p class="policy-date">Effective Date: March 3, 2026</p>
      </div>

      <!-- Intro -->
      <p class="policy-intro">
        Welcome to Funkollection ("we," "our," or "us"). This Privacy Policy explains how we collect,
        use, and protect your information when you use our website at funkollection.com (the "Service").
        By using the Service, you agree to the practices described in this policy.
      </p>

      <!-- Sections -->
      <div class="policy-sections">
        <div v-for="section in sections" :key="section.number" class="policy-section">
          <div class="section-header">
            <span class="section-number">{{ section.number }}</span>
            <h2 class="section-title">{{ section.title }}</h2>
          </div>
          <div class="section-body">
            <p class="section-content">{{ section.content }}</p>
            <ul v-if="section.bullets" class="section-bullets">
              <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
            <p v-if="section.footer" class="section-content">{{ section.footer }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="policy-footer">
        <p>© 2025 Funkollection. All rights reserved.</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 6rem 1.5rem 4rem;
  font-family: 'Georgia', serif;
  display: flex;
  justify-content: center;
}
.policy-container {
  max-width: 780px;
  width: 100%;
}

/* Header */
.policy-header {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e5e5e5;
}

.policy-title {
  font-family: 'Playfair Display', serif;
  font-size: 3rem;
  font-weight: 900;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.policy-date {
  color: #888;
  font-size: 0.95rem;
  font-family: sans-serif;
}

/* Intro */
.policy-intro {
  font-size: 1.05rem;
  line-height: 1.85;
  color: #444;
  margin-bottom: 3rem;
}

/* Sections */
.policy-sections {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.policy-section {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #ececec;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc, #f472b6, #fbbf24);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: sans-serif;
  flex-shrink: 0;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.section-body {
  padding-left: 3.2rem;
}

.section-content {
  font-size: 0.97rem;
  line-height: 1.8;
  color: #555;
  margin-bottom: 0.75rem;
}

.section-bullets {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-bullets li {
  font-size: 0.97rem;
  line-height: 1.7;
  color: #555;
  padding-left: 1.25rem;
  position: relative;
}

.section-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6rem;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c084fc, #f472b6);
}

/* Footer */
.policy-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e5e5;
  text-align: center;
  color: #aaa;
  font-size: 0.85rem;
  font-family: sans-serif;
}

/* Responsive */
@media (max-width: 768px) {
  .policy-title {
    font-size: 2rem;
  }

  .policy-section {
    padding: 1.5rem;
  }

  .section-body {
    padding-left: 0;
  }

  .section-header {
    align-items: flex-start;
  }
}

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

.back-arrow {
  font-size: 1.1rem;
}
</style>