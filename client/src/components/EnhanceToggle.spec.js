import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EnhanceToggle from './EnhanceToggle.vue';

describe('EnhanceToggle', () => {
  it('renders with label text', () => {
    const wrapper = mount(EnhanceToggle);
    expect(wrapper.text()).toContain('Enhance prompt');
  });

  it('renders hidden checkbox input', () => {
    const wrapper = mount(EnhanceToggle);
    const input = wrapper.find('input[type="checkbox"]');
    expect(input.exists()).toBe(true);
    expect(input.classes()).toContain('sr-only');
  });

  it('is unchecked by default', () => {
    const wrapper = mount(EnhanceToggle);
    const input = wrapper.find('input[type="checkbox"]');
    expect(input.element.checked).toBe(false);
  });

  it('respects modelValue prop', () => {
    const wrapper = mount(EnhanceToggle, {
      props: { modelValue: true }
    });
    const input = wrapper.find('input[type="checkbox"]');
    expect(input.element.checked).toBe(true);
  });

  it('emits toggled value on change', async () => {
    const wrapper = mount(EnhanceToggle, {
      props: { modelValue: false }
    });

    const input = wrapper.find('input[type="checkbox"]');
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
  });

  it('emits false when toggling off', async () => {
    const wrapper = mount(EnhanceToggle, {
      props: { modelValue: true }
    });

    const input = wrapper.find('input[type="checkbox"]');
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });

  it('has tooltip trigger button', () => {
    const wrapper = mount(EnhanceToggle);
    const tooltipBtn = wrapper.findAll('button').find(b => b.text() === '?');
    expect(tooltipBtn.exists()).toBe(true);
  });

  it('has tooltip element for help text', () => {
    const wrapper = mount(EnhanceToggle);
    const tooltip = wrapper.find('[class*="absolute left-full"]');
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.text()).toContain('AI Prompt Enhancement');
  });

  it('applies accent styling when enabled', () => {
    const wrapper = mount(EnhanceToggle, {
      props: { modelValue: true }
    });
    const toggle = wrapper.find('.bg-accent\\/20');
    expect(toggle.exists()).toBe(true);
  });
});
