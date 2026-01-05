import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ErrorState from './ErrorState.vue';

describe('ErrorState', () => {
  it('renders with default title and message', () => {
    const wrapper = mount(ErrorState);
    expect(wrapper.text()).toContain('Something went wrong');
    expect(wrapper.text()).toContain('An error occurred while loading data');
  });

  it('renders with custom title', () => {
    const wrapper = mount(ErrorState, {
      props: { title: 'Custom Error Title' }
    });
    expect(wrapper.text()).toContain('Custom Error Title');
  });

  it('renders with custom message', () => {
    const wrapper = mount(ErrorState, {
      props: { message: 'Network connection failed' }
    });
    expect(wrapper.text()).toContain('Network connection failed');
  });

  it('shows retry button by default', () => {
    const wrapper = mount(ErrorState);
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('Try Again');
  });

  it('hides retry button when showRetry is false', () => {
    const wrapper = mount(ErrorState, {
      props: { showRetry: false }
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('emits retry event when button is clicked', async () => {
    const wrapper = mount(ErrorState);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('retry')).toBeTruthy();
  });

  it('has warning icon', () => {
    const wrapper = mount(ErrorState);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('svg').classes()).toContain('text-red-400');
  });
});
