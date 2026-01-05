import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PromptInput from './PromptInput.vue';

describe('PromptInput', () => {
  it('renders with default placeholder', () => {
    const wrapper = mount(PromptInput);
    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('placeholder')).toBe('Describe the image you want to generate...');
  });

  it('renders with custom placeholder', () => {
    const wrapper = mount(PromptInput, {
      props: { placeholder: 'Custom placeholder' }
    });
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Custom placeholder');
  });

  it('displays character count', () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: 'Hello' }
    });
    expect(wrapper.text()).toContain('5/2000');
  });

  it('respects custom maxLength', () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: 'Hi', maxLength: 100 }
    });
    expect(wrapper.text()).toContain('2/100');
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('100');
  });

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(PromptInput);
    const textarea = wrapper.find('textarea');

    await textarea.setValue('New value');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['New value']);
  });

  it('shows warning color when near character limit', () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: 'x'.repeat(1850), maxLength: 2000 }
    });
    const counter = wrapper.find('.text-yellow-500');
    expect(counter.exists()).toBe(true);
  });

  it('shows muted color when not near limit', () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: 'short text', maxLength: 2000 }
    });
    const counter = wrapper.find('.text-text-muted');
    expect(counter.exists()).toBe(true);
  });
});
