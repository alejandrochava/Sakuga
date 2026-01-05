import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AspectRatioSelector from './AspectRatioSelector.vue';

describe('AspectRatioSelector', () => {
  it('renders all aspect ratio options', () => {
    const wrapper = mount(AspectRatioSelector);
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(5); // 1:1, 16:9, 9:16, 4:3, 3:4
  });

  it('displays correct labels', () => {
    const wrapper = mount(AspectRatioSelector);
    expect(wrapper.text()).toContain('1:1');
    expect(wrapper.text()).toContain('16:9');
    expect(wrapper.text()).toContain('9:16');
    expect(wrapper.text()).toContain('4:3');
    expect(wrapper.text()).toContain('3:4');
  });

  it('highlights selected ratio with accent color', () => {
    const wrapper = mount(AspectRatioSelector, {
      props: { modelValue: '16:9' }
    });
    const buttons = wrapper.findAll('button');
    const selected = buttons.find(btn => btn.text().includes('16:9'));
    expect(selected.classes()).toContain('text-accent');
  });

  it('emits update:modelValue when ratio is clicked', async () => {
    const wrapper = mount(AspectRatioSelector, {
      props: { modelValue: '1:1' }
    });

    const buttons = wrapper.findAll('button');
    const wideButton = buttons.find(btn => btn.text().includes('16:9'));
    await wideButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['16:9']);
  });

  it('defaults to 1:1 ratio', () => {
    const wrapper = mount(AspectRatioSelector);
    const buttons = wrapper.findAll('button');
    const squareButton = buttons.find(btn => btn.text().includes('1:1'));
    expect(squareButton.classes()).toContain('text-accent');
  });

  it('has touch-friendly minimum height', () => {
    const wrapper = mount(AspectRatioSelector);
    const button = wrapper.find('button');
    expect(button.classes()).toContain('min-h-[44px]');
  });
});
