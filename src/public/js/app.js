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
      const res = await fetch('/api/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create endpoint');
      }
    });
  }
});

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
