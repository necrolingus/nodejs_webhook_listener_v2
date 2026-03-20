// Sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('sidebarToggle');
  if (toggle) {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed) document.body.classList.add('sidebar-collapsed');

    toggle.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
    });
  }

  // Create endpoint form toggle
  const createBtn = document.getElementById('createEndpointBtn');
  const createForm = document.getElementById('createEndpointForm');
  const cancelBtn = document.getElementById('cancelEndpoint');
  const submitBtn = document.getElementById('submitEndpoint');

  if (createBtn && createForm) {
    createBtn.addEventListener('click', () => {
      const isHidden = createForm.style.display === 'none';
      createForm.style.display = isHidden ? 'block' : 'none';
      if (isHidden) document.getElementById('endpointLabel').focus();
    });
    cancelBtn.addEventListener('click', () => {
      createForm.style.display = 'none';
    });
    submitBtn.addEventListener('click', async () => {
      const label = document.getElementById('endpointLabel').value.trim();
      const responseCode = document.getElementById('endpointResponseCode')?.value || '200';
      const responseBody = document.getElementById('endpointResponseBody')?.value || '';
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, response_code: responseCode, response_body: responseBody }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create endpoint');
      }
    });
  }

  // Response config edit toggle on endpoint detail page
  const editResponseBtn = document.getElementById('editResponseBtn');
  const responseDisplay = document.getElementById('responseDisplay');
  const responseEditForm = document.getElementById('responseEditForm');
  const cancelResponseEdit = document.getElementById('cancelResponseEdit');

  if (editResponseBtn && responseEditForm) {
    editResponseBtn.addEventListener('click', () => {
      responseDisplay.style.display = 'none';
      responseEditForm.style.display = 'block';
      editResponseBtn.style.display = 'none';
    });
    cancelResponseEdit.addEventListener('click', () => {
      responseDisplay.style.display = '';
      responseEditForm.style.display = 'none';
      editResponseBtn.style.display = '';
    });
  }
});

// Save response config
async function saveResponseConfig(endpointKey) {
  const responseCode = document.getElementById('editResponseCode').value;
  const responseBody = document.getElementById('editResponseBody').value;
  const res = await fetch(`/api/endpoints/${endpointKey}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response_code: responseCode, response_body: responseBody }),
  });
  if (res.ok) {
    window.location.reload();
  } else {
    const data = await res.json();
    alert(data.error || 'Failed to update response config');
  }
}

// Copy to clipboard
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = el.nextElementSibling || el.closest('.token-display, .url-display')?.querySelector('.btn');
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }
  });
}

// Toggle webhook card
function toggleWebhook(header) {
  const card = header.closest('.webhook-card');
  const body = card.querySelector('.webhook-card__body');
  card.classList.toggle('open');
  body.style.display = body.style.display === 'none' ? 'block' : 'none';
}

// Delete endpoint
async function deleteEndpoint(key, redirect) {
  if (!confirm('Are you sure you want to delete this endpoint? All webhook data will be lost.')) return;
  const res = await fetch(`/api/endpoints/${key}`, { method: 'DELETE' });
  if (res.ok) {
    if (redirect) {
      window.location.href = '/dashboard';
    } else {
      window.location.reload();
    }
  } else {
    const data = await res.json();
    alert(data.error || 'Failed to delete endpoint');
  }
}

// Keep last N webhooks
async function keepLastWebhooks(endpointKey, count) {
  if (!confirm(`This will delete all but the last ${count} requests. Continue?`)) return;
  const res = await fetch(`/api/endpoints/${endpointKey}/webhooks/keep-last`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keep: count }),
  });
  if (res.ok) {
    window.location.reload();
  } else {
    alert('Failed to trim webhooks');
  }
}

// Refresh webhooks via AJAX (with 2-second cooldown)
function initRefreshButton() {
  const btn = document.getElementById('refreshWebhooksBtn');
  if (!btn) return;
  const endpointKey = btn.dataset.key;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add('btn--disabled');

    // Spin the refresh icon
    const icon = btn.querySelector('.refresh-icon');
    if (icon) icon.classList.add('spin');

    try {
      const page = new URLSearchParams(window.location.search).get('page') || '1';
      const res = await fetch(`/api/endpoints/${endpointKey}/webhooks?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      renderWebhookList(data, endpointKey);
    } catch {
      // Fallback to full reload if AJAX fails
      window.location.reload();
    }

    // 2-second cooldown
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('btn--disabled');
      if (icon) icon.classList.remove('spin');
    }, 2000);
  });
}

// Build webhook list HTML from API data
function renderWebhookList(data, endpointKey) {
  const container = document.getElementById('webhookListContainer');
  const countBadge = document.getElementById('webhookCount');
  const keepLastBtn = document.getElementById('keepLastBtn');
  if (!container) return;

  // Update count badge
  if (countBadge) countBadge.textContent = data.total;

  // Show/hide Keep Last 10 button
  if (keepLastBtn) {
    keepLastBtn.style.display = data.total > 10 ? '' : 'none';
  }

  if (!data.webhooks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>No webhooks received yet</h3>
        <p>Send a request to the webhook URL above to start capturing data.</p>
      </div>`;
    return;
  }

  const cards = data.webhooks.map(wh => {
    const method = wh.http_method.toUpperCase();
    const time = new Date(wh.received_at).toLocaleString();
    const headers = JSON.stringify(wh.headers, null, 2);
    const queryParams = wh.query_params && Object.keys(wh.query_params).length
      ? `<div class="webhook-data__section"><h4>Query Parameters</h4><pre class="json-display"><code>${escapeHtml(JSON.stringify(wh.query_params, null, 2))}</code></pre></div>` : '';
    const cookies = wh.cookies && Object.keys(wh.cookies).length
      ? `<div class="webhook-data__section"><h4>Cookies</h4><pre class="json-display"><code>${escapeHtml(JSON.stringify(wh.cookies, null, 2))}</code></pre></div>` : '';
    const body = wh.body && Object.keys(wh.body).length
      ? `<div class="webhook-data__section"><h4>Body</h4><pre class="json-display"><code>${escapeHtml(JSON.stringify(wh.body, null, 2))}</code></pre></div>` : '';

    return `
      <div class="webhook-card" data-id="${wh.id}">
        <div class="webhook-card__header" onclick="toggleWebhook(this)">
          <div class="webhook-card__meta">
            <span class="method-badge method-badge--${method.toLowerCase()}">${method}</span>
            <span class="webhook-card__host">${escapeHtml(wh.source_host || '')}</span>
            <span class="webhook-card__time">${time}</span>
          </div>
          <div class="webhook-card__actions">
            <button class="btn btn--sm btn--ghost" onclick="event.stopPropagation(); deleteWebhook('${endpointKey}', ${wh.id}, this)">Delete</button>
            <svg class="webhook-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
        <div class="webhook-card__body" style="display:none;">
          <div class="webhook-data">
            <div class="webhook-data__section"><h4>Headers</h4><pre class="json-display"><code>${escapeHtml(headers)}</code></pre></div>
            ${queryParams}${cookies}${body}
          </div>
        </div>
      </div>`;
  }).join('');

  // Build pagination
  let pagination = '';
  if (data.pages > 1) {
    const links = [];
    if (data.page > 1) links.push(`<a href="?page=${data.page - 1}" class="btn btn--sm btn--ghost">&laquo; Prev</a>`);
    for (let i = 1; i <= data.pages; i++) {
      links.push(`<a href="?page=${i}" class="btn btn--sm ${i === data.page ? 'btn--accent' : 'btn--ghost'}">${i}</a>`);
    }
    if (data.page < data.pages) links.push(`<a href="?page=${data.page + 1}" class="btn btn--sm btn--ghost">Next &raquo;</a>`);
    pagination = `<div class="pagination">${links.join('')}</div>`;
  }

  container.innerHTML = `<div class="webhook-list">${cards}</div>${pagination}`;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Init refresh button on page load
document.addEventListener('DOMContentLoaded', () => {
  initRefreshButton();
});

// Delete webhook
async function deleteWebhook(endpointKey, webhookId, btn) {
  if (!confirm('Delete this webhook entry?')) return;
  const res = await fetch(`/api/endpoints/${endpointKey}/webhooks/${webhookId}`, { method: 'DELETE' });
  if (res.ok) {
    const card = btn.closest('.webhook-card');
    card.remove();
  } else {
    alert('Failed to delete webhook');
  }
}
