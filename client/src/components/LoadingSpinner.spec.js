import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingSpinner from './LoadingSpinner.vue';

describe('LoadingSpinner', () => {
  it('renders spinner SVG', () => {
    const wrapper = mount(LoadingSpinner);
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.classes()).toContain('animate-spin');
  });

  it('applies medium size by default', () => {
    const wrapper = mount(LoadingSpinner);
    const svg = wrapper.find('svg');
    expect(svg.classes()).toContain('w-8');
    expect(svg.classes()).toContain('h-8');
  });

  it('applies small size classes', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { size: 'sm' }
    });
    const svg = wrapper.find('svg');
    expect(svg.classes()).toContain('w-5');
    expect(svg.classes()).toContain('h-5');
  });

  it('applies large size classes', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { size: 'lg' }
    });
    const svg = wrapper.find('svg');
    expect(svg.classes()).toContain('w-12');
    expect(svg.classes()).toContain('h-12');
  });

  it('does not show text by default', () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('shows text when provided', () => {
    const wrapper = mount(LoadingSpinner, {
      props: { text: 'Loading images...' }
    });
    expect(wrapper.find('p').text()).toBe('Loading images...');
  });

  it('has accent color class on spinner', () => {
    const wrapper = mount(LoadingSpinner);
    expect(wrapper.find('svg').classes()).toContain('text-accent');
  });
});
