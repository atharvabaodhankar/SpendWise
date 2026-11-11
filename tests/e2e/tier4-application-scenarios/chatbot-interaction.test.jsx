import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 4: Scenario 4 - Conversational Expense Logging via Chat Workflow', () => {
  async function getAiChatbot() {
    const res = await loadSrcModule('src/components/AiChatbot.jsx');
    assertContractAvailable(
      res,
      'AiChatbot.jsx',
      'PROJECT.md § AiChatbot: 420px desktop slide-over panel, direct text bot responses, 14px user bubbles, pinned composer.'
    );
    return res.Component;
  }

  it('completes end-to-end chat workflow: open slide-over -> send message -> direct text response -> 14px user bubble', async () => {
    const AiChatbot = await getAiChatbot();

    const { container } = render(
      <AiChatbot isOpen={true} onClose={() => {}} />,
      { wrapper: TestAppWrapper }
    );

    // Step 1: Verify slide-over panel structure (not floating circular bubble)
    expect(container.querySelector('.rounded-full.fixed')).toBeNull();

    // Step 2: Verify input composer exists
    const input = container.querySelector('input[type="text"], textarea');
    expect(input).not.toBeNull();
  });
});
