import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoginStreakIndicator from './LoginStreakIndicator.vue'

vi.mock('../composables/useAuthUser.js', async () => {
  const { ref } = await import('vue')
  return {
    useAuthUser: () => ({ user: ref({ uid: 'user-1' }) }),
  }
})

vi.mock('../composables/useLoginStreak.js', async () => {
  const { ref } = await import('vue')
  return {
    useLoginStreak: () => ({
      loading: ref(false),
      error: ref(''),
      announcement: ref('New personal best: 7 days.'),
      newlyCredited: ref(true),
      currentStreak: ref(7),
      highestStreak: ref(7),
      creditedToday: ref(true),
      evaluateForUser: vi.fn(),
    }),
  }
})

describe('LoginStreakIndicator', () => {
  it('exposes the current streak and today status accessibly', () => {
    const wrapper = mount(LoginStreakIndicator)
    const trigger = wrapper.get('button')

    expect(trigger.attributes('aria-label')).toContain('Current login streak: 7 days')
    expect(trigger.attributes('aria-label')).toContain('Today has been counted')
    expect(trigger.classes()).toContain('streak-trigger--celebrate')
  })

  it('opens a keyboard and touch-accessible explanation', async () => {
    const wrapper = mount(LoginStreakIndicator)
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('[role="dialog"]').text()).toContain('7 days strong')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Personal best: 7 days')
    expect(wrapper.get('[role="dialog"]').text()).toContain('00:00 UTC')
  })
})
