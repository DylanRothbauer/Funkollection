<script setup>
const sections = [
  {
    number: '1',
    title: 'Eligibility',
    content: 'You must be at least 13 years of age to use the Service. By using Funkollection, you represent and warrant that you meet this age requirement. If you are under 18, you represent that you have your parent or guardian\'s permission to use the Service.',
  },
  {
    number: '2',
    title: 'Your Account',
    content: 'Funkollection uses Google Sign-In for authentication. By signing in, you agree to Google\'s Terms of Service. You are responsible for:',
    bullets: [
      'Maintaining the security of your Google account',
      'All activity that occurs under your account',
      'Notifying us immediately of any unauthorized use of your account',
    ],
    footer: 'We reserve the right to suspend or terminate accounts that violate these Terms.',
  },
  {
    number: '3',
    title: 'Use of the Service',
    content: 'You agree to use Funkollection only for lawful purposes and in accordance with these Terms. You agree not to:',
    bullets: [
      'Use the Service in any way that violates applicable laws or regulations',
      'Attempt to gain unauthorized access to any part of the Service or its related systems',
      'Interfere with or disrupt the integrity or performance of the Service',
      'Upload or transmit any harmful, offensive, or inappropriate content',
      'Use the Service to collect or harvest data about other users without their consent',
    ],
  },
  {
    number: '4',
    title: 'User Content',
    content: 'Funkollection allows you to add and manage your personal Funko Pop collection data ("User Content"). You retain ownership of your User Content. By submitting User Content, you grant us a limited, non-exclusive license to store and display it solely for the purpose of providing the Service to you.',
    footer: 'You are solely responsible for the accuracy and legality of any content you submit. We do not claim ownership over your collection data.',
  },
  {
    number: '5',
    title: 'Intellectual Property',
    content: 'The Funkollection name, logo, design, and all associated content (excluding User Content) are the intellectual property of Funkollection. You may not copy, reproduce, distribute, or create derivative works from any part of the Service without our prior written consent.',
    footer: 'Funko Pop is a registered trademark of Funko, LLC. Funkollection is an independent fan-made tool and is not affiliated with, endorsed by, or sponsored by Funko, LLC.',
  },
  {
    number: '6',
    title: 'Payments and Subscriptions',
    content: 'Funkollection may offer paid subscription plans. All payments are processed securely through Stripe. By subscribing, you agree to Stripe\'s Terms of Service available at https://stripe.com/legal.',
    footer: 'Subscription fees are billed on a recurring basis. You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. We do not offer refunds for partial billing periods unless required by applicable law.',
  },
  {
    number: '7',
    title: 'Disclaimers',
    content: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
    footer: 'We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We make no guarantees regarding the accuracy or completeness of any content on the Service.',
  },
  {
    number: '8',
    title: 'Limitation of Liability',
    content: 'TO THE FULLEST EXTENT PERMITTED BY LAW, FUNKOLLECTION SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
    footer: 'Our total liability to you for any claims arising from these Terms or your use of the Service shall not exceed the amount you paid us in the twelve (12) months prior to the claim.',
  },
  {
    number: '9',
    title: 'Third-Party Services',
    content: 'The Service integrates with third-party services including Google (authentication) and Firebase (data storage). Your use of these services is subject to their respective terms and privacy policies. We are not responsible for the practices of these third parties.',
  },
  {
    number: '10',
    title: 'Termination',
    content: 'We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, for any reason including violation of these Terms. Upon termination, your right to use the Service will immediately cease.',
    footer: 'You may stop using the Service at any time. If you wish to delete your account and associated data, please contact us using the information below.',
  },
  {
    number: '11',
    title: 'Changes to These Terms',
    content: 'We may update these Terms from time to time. When we do, we will update the effective date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the updated Terms. We encourage you to review these Terms periodically.',
  },
  {
    number: '12',
    title: 'Governing Law',
    content: 'These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the appropriate courts of the United States.',
  },
  {
    number: '13',
    title: 'Contact Us',
    content: 'If you have any questions about these Terms of Service, please contact us via our social media channels linked on the Funkollection website at funkollection.com.',
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
        <h1 class="policy-title">Terms of Service</h1>
        <p class="policy-date">Effective Date: March 3, 2026</p>
      </div>

      <!-- Intro -->
      <p class="policy-intro">
        Welcome to Funkollection. These Terms of Service ("Terms") govern your access to and use of
        the Funkollection website and services located at funkollection.com (the "Service"), operated
        by Funkollection ("we," "our," or "us"). By accessing or using the Service, you agree to be
        bound by these Terms. If you do not agree, please do not use the Service.
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

.policy-intro {
  font-size: 1.05rem;
  line-height: 1.85;
  color: #444;
  margin-bottom: 3rem;
}

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

.policy-footer {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e5e5;
  text-align: center;
  color: #aaa;
  font-size: 0.85rem;
  font-family: sans-serif;
}

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