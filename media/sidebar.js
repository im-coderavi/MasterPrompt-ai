// PromptMaster AI - Sidebar Frontend Logic
(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const modeSelect = document.getElementById('mode-select');
  const rawPrompt = document.getElementById('raw-prompt');
  const enhanceBtn = document.getElementById('enhance-btn');
  const outputSection = document.getElementById('output-section');
  const enhancedOutput = document.getElementById('enhanced-output');
  const modeBadge = document.getElementById('mode-badge');
  const sourceBadge = document.getElementById('source-badge');
  const charCount = document.getElementById('char-count');
  const copyBtn = document.getElementById('copy-btn');

  const tagContextSection = document.getElementById('tag-context-section');
  const tagFilename = document.getElementById('tag-filename');
  const tagLines = document.getElementById('tag-lines');
  const taggedCodePreview = document.getElementById('tagged-code-preview');
  const removeTagBtn = document.getElementById('remove-tag-btn');

  const smartModeToggle = document.getElementById('smart-mode-toggle');
  const providerSelect = document.getElementById('provider-select');
  const apiKeyInput = document.getElementById('api-key-input');
  const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const keyStatus = document.getElementById('key-status');
  const modelInput = document.getElementById('model-input');
  const customEndpointSection = document.getElementById('custom-endpoint-section');
  const endpointInput = document.getElementById('endpoint-input');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const testConnectionBtn = document.getElementById('test-connection-btn');
  const clearKeyBtn = document.getElementById('clear-key-btn');
  const testResult = document.getElementById('test-result');
  const smartChatInput = document.getElementById('smart-chat-input');
  const smartChatSendBtn = document.getElementById('smart-chat-send-btn');
  const smartChatLog = document.getElementById('smart-chat-log');

  let lastEnhancedText = '';

  const DEFAULT_MODELS = {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-haiku-4-5-20251001',
    custom: '',
  };

  function setActiveTab(tab) {
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === 'tab-' + tab);
    });
  }

  function renderColorCodedPrompt(text) {
    const sectionMap = {
      '[CONTEXT]': 'context',
      '[TASK]': 'task',
      '[CODE]': 'code',
      '[SCOPE LOCK]': 'scope',
      '[OUTPUT]': 'output',
    };

    let html = '';
    let currentSection = '';
    const lines = text.split('\n');

    for (const line of lines) {
      let foundSection = false;
      for (const [marker, cls] of Object.entries(sectionMap)) {
        if (line.trim().startsWith(marker)) {
          currentSection = cls;
          html += `<span class="prompt-section-label prompt-section-${cls}">${escapeHtml(line)}</span>\n`;
          foundSection = true;
          break;
        }
      }

      if (!foundSection) {
        html += currentSection
          ? `<span class="prompt-section-${currentSection}">${escapeHtml(line)}</span>\n`
          : escapeHtml(line) + '\n';
      }
    }

    return html;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveTab(btn.getAttribute('data-tab'));
    });
  });

  enhanceBtn.addEventListener('click', () => {
    const prompt = rawPrompt.value.trim();
    const mode = modeSelect.value;
    vscode.postMessage({ command: 'enhance', rawPrompt: prompt, mode });
  });

  copyBtn.addEventListener('click', () => {
    if (lastEnhancedText) {
      vscode.postMessage({ command: 'copyPrompt', text: lastEnhancedText });
    }
  });

  removeTagBtn.addEventListener('click', () => {
    vscode.postMessage({ command: 'removeTag' });
  });

  smartModeToggle.addEventListener('change', () => {
    vscode.postMessage({ command: 'toggleSmartMode', enabled: smartModeToggle.checked });
  });

  providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    modelInput.placeholder = DEFAULT_MODELS[provider] || 'model name';
    customEndpointSection.classList.toggle('hidden', provider !== 'custom');
    keyStatus.textContent = 'Loading...';
    vscode.postMessage({ command: 'providerChanged', provider });
  });

  toggleKeyVisibility.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    toggleKeyVisibility.textContent = apiKeyInput.type === 'password' ? 'Show' : 'Hide';
  });

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model = modelInput.value.trim() || DEFAULT_MODELS[provider];
    const endpoint = endpointInput.value.trim();
    if (!key) {
      return;
    }
    vscode.postMessage({ command: 'saveApiKey', provider, key, model, endpoint });
  });

  saveSettingsBtn.addEventListener('click', () => {
    const provider = providerSelect.value;
    const model = modelInput.value.trim() || DEFAULT_MODELS[provider];
    const endpoint = endpointInput.value.trim();
    vscode.postMessage({ command: 'saveSettings', provider, model, endpoint });
  });

  testConnectionBtn.addEventListener('click', () => {
    testResult.classList.remove('hidden', 'success', 'error');
    testResult.textContent = 'Testing connection...';
    testResult.classList.add('success');
    vscode.postMessage({ command: 'testConnection' });
  });

  clearKeyBtn.addEventListener('click', () => {
    const provider = providerSelect.value;
    vscode.postMessage({ command: 'clearApiKey', provider });
    apiKeyInput.value = '';
    keyStatus.textContent = '';
  });

  smartChatSendBtn.addEventListener('click', () => {
    const prompt = smartChatInput.value.trim();
    if (!prompt) {
      return;
    }
    appendSmartChatMessage('user', prompt);
    vscode.postMessage({ command: 'smartChatEnhance', prompt });
  });

  smartChatInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      smartChatSendBtn.click();
    }
  });

  function appendSmartChatMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = 'smart-msg ' + role;
    bubble.textContent = text;
    smartChatLog.appendChild(bubble);
    smartChatLog.scrollTop = smartChatLog.scrollHeight;
  }

  window.addEventListener('message', event => {
    const msg = event.data;

    switch (msg.command) {
      case 'enhanceResult':
        lastEnhancedText = msg.prompt;
        outputSection.classList.remove('hidden');
        enhancedOutput.innerHTML = renderColorCodedPrompt(msg.prompt);
        modeBadge.textContent = msg.mode;
        sourceBadge.textContent = msg.source;
        sourceBadge.className = 'badge badge-source' + (msg.source === 'smart' ? ' smart' : '');
        charCount.textContent = `${msg.rawLength || '?'} -> ${msg.enhancedLength || msg.prompt.length} chars`;
        break;

      case 'enhanceError':
        lastEnhancedText = '';
        outputSection.classList.remove('hidden');
        enhancedOutput.innerHTML = `<span style="color: var(--pm-red);">${escapeHtml(msg.message)}</span>`;
        break;

      case 'loading':
        enhanceBtn.classList.toggle('loading', msg.state);
        enhanceBtn.disabled = msg.state;
        break;

      case 'tagUpdate':
        if (msg.hasTag) {
          tagContextSection.classList.remove('hidden');
          tagFilename.textContent = msg.fileName || 'unknown';
          tagLines.textContent = `Lines ${msg.lines || '?'}`;
          taggedCodePreview.textContent = msg.taggedCode || '';
        } else {
          tagContextSection.classList.add('hidden');
          taggedCodePreview.textContent = '';
        }
        break;

      case 'smartModeStatus':
        smartModeToggle.checked = msg.enabled;
        break;

      case 'settingsLoaded': {
        const settings = msg.settings;
        smartModeToggle.checked = settings.smartModeEnabled;
        providerSelect.value = settings.provider;
        modelInput.value = settings.model || '';
        modelInput.placeholder = DEFAULT_MODELS[settings.provider] || 'model name';
        endpointInput.value = settings.customEndpoint || '';
        customEndpointSection.classList.toggle('hidden', settings.provider !== 'custom');
        keyStatus.textContent = settings.hasApiKey ? 'Key saved for this provider' : 'No key saved for this provider';
        break;
      }

      case 'testResult':
        testResult.classList.remove('hidden', 'success', 'error');
        testResult.classList.add(msg.success ? 'success' : 'error');
        testResult.textContent = msg.message;
        break;

      case 'apiKeySaved':
        keyStatus.textContent = 'Key saved for this provider';
        apiKeyInput.value = '';
        smartModeToggle.checked = true;
        break;

      case 'apiKeyCleared':
        keyStatus.textContent = '';
        break;

      case 'switchTab':
        setActiveTab(msg.tab);
        break;

      case 'triggerEnhance': {
        const prompt = rawPrompt.value.trim();
        if (prompt) {
          vscode.postMessage({ command: 'enhance', rawPrompt: prompt, mode: modeSelect.value });
        }
        break;
      }

      case 'setPromptAndEnhance':
        rawPrompt.value = msg.prompt;
        vscode.postMessage({ command: 'enhance', rawPrompt: msg.prompt, mode: modeSelect.value });
        break;

      case 'smartChatLoading':
        smartChatSendBtn.classList.toggle('loading', msg.state);
        smartChatSendBtn.disabled = msg.state;
        break;

      case 'smartChatResult':
        appendSmartChatMessage('assistant', msg.prompt);
        smartChatInput.value = '';
        break;

      case 'smartChatError':
        appendSmartChatMessage('error', msg.message);
        break;
    }
  });

  rawPrompt.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      enhanceBtn.click();
    }
  });

  vscode.postMessage({ command: 'ready' });
})();
