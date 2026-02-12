// MentionAutocomplete Component Tests
import { describe, it, expect } from 'vitest';
import { parseMentions } from '../../src/components/MentionAutocomplete';

describe('parseMentions', () => {
  it('returns original text when no mentions', () => {
    const result = parseMentions('Hello world');
    expect(result).toEqual(['Hello world']);
  });

  it('parses a single mention', () => {
    const result = parseMentions('Hello @john');
    expect(result.length).toBe(2);
    expect(result[0]).toBe('Hello ');
    expect(typeof result[1]).toBe('object'); // JSX element
  });

  it('parses multiple mentions', () => {
    const result = parseMentions('@alice and @bob are here');
    expect(result.length).toBe(4);
    // @alice, ' and ', @bob, ' are here'
    expect(typeof result[0]).toBe('object');
    expect(result[1]).toBe(' and ');
    expect(typeof result[2]).toBe('object');
    expect(result[3]).toBe(' are here');
  });

  it('handles mention at start of text', () => {
    const result = parseMentions('@admin says hi');
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe('object');
    expect(result[1]).toBe(' says hi');
  });

  it('handles mention at end of text', () => {
    const result = parseMentions('Hey @user');
    expect(result.length).toBe(2);
    expect(result[0]).toBe('Hey ');
    expect(typeof result[1]).toBe('object');
  });

  it('handles text with only a mention', () => {
    const result = parseMentions('@everyone');
    expect(result.length).toBe(1);
    expect(typeof result[0]).toBe('object');
  });

  it('handles consecutive mentions', () => {
    const result = parseMentions('@one@two');
    // Should match @one and @two as separate mentions
    expect(result.length).toBe(2);
  });

  it('handles empty string', () => {
    const result = parseMentions('');
    expect(result).toEqual(['']);
  });
});
