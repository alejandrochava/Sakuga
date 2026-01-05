import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CostBadge from './CostBadge.vue';

describe('CostBadge', () => {
  it('renders nothing when cost is 0', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 0 }
    });
    expect(wrapper.find('span').exists()).toBe(false);
  });

  it('renders cost with dollar sign and 3 decimal places', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 0.025 }
    });
    expect(wrapper.text()).toContain('$0.025');
  });

  it('formats larger costs correctly', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 1.5 }
    });
    expect(wrapper.text()).toContain('$1.500');
  });

  it('applies small size classes by default', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 0.01 }
    });
    const span = wrapper.find('span');
    expect(span.classes()).toContain('px-2');
    expect(span.classes()).toContain('text-xs');
  });

  it('applies large size classes when size is lg', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 0.01, size: 'lg' }
    });
    const span = wrapper.find('span');
    expect(span.classes()).toContain('px-3');
    expect(span.classes()).toContain('text-sm');
  });

  it('contains an SVG icon', () => {
    const wrapper = mount(CostBadge, {
      props: { cost: 0.01 }
    });
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
