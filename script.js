// Basic interactivity for Finhub: login modal, simple client-side login, and a mock chatbot.

// Helpers
const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

// Global runtime helpers: show a temporary banner for serious issues
function showGlobalError(msg){
  try{
    // prefer an existing banner
    let b = qs('#globalErrorBanner');
    if(!b){
      b = document.createElement('div');
      b.id = 'globalErrorBanner';
      b.className = 'global-error';
      const parent = qs('.container') || document.body;
      parent.insertAdjacentElement('afterbegin', b);
    }
    b.textContent = msg;
    // auto-dismiss
    setTimeout(()=>{ if(b && b.parentNode) b.remove(); }, 8000);
  }catch(e){ console.error('Failed to show global error banner', e); }
}

// Capture uncaught errors and unhandled promise rejections so they don't fail silently
window.addEventListener('error', (e)=>{
  console.error('Unhandled error', e.error || e.message || e);
  showGlobalError('An unexpected error occurred — please try again.');
});
window.addEventListener('unhandledrejection', (ev)=>{
  console.error('Unhandled promise rejection', ev.reason || ev);
  showGlobalError('A background task failed — some features may be unavailable.');
});

// Modal handling & user state
const openLoginBtn = qs('#openLogin');
const loginModal = qs('#loginModal');
const loginModalContent = qs('.modal-content');
const closeLoginBtn = qs('#closeLogin');
const getStartedBtn = qs('#getStarted');
const userInfoEl = qs('#userInfo');
const logoutBtn = qs('#logoutBtn');

let lastFocusedElement = null;
function openModal(){
  if(!loginModal) return; // guard
  lastFocusedElement = document.activeElement;
  loginModal.setAttribute('aria-hidden','false');
  // focus first input for convenience
  setTimeout(()=>{
    const first = loginModal.querySelector('input, select, button');
    if(first) first.focus();
  }, 50);
}
function closeModal(){
  if(!loginModal) return; // guard
  loginModal.setAttribute('aria-hidden','true');
  // restore focus
  if(lastFocusedElement) lastFocusedElement.focus();
} 
// close if click outside modal content
loginModal?.addEventListener('click', (e)=>{ if(e.target === loginModal) closeModal(); });
// close on close button
closeLoginBtn?.addEventListener('click', closeModal);
openLoginBtn?.addEventListener('click', openModal);
getStartedBtn?.addEventListener('click', openModal);
logoutBtn?.addEventListener('click', ()=>{ localStorage.removeItem('finhub_user'); updateUserUI(); });

function updateUserUI(){
  if(!userInfoEl) return; // guard
  const raw = localStorage.getItem('finhub_user');
  if(raw){
    const user = JSON.parse(raw);
    if(user && user.name){
      userInfoEl.innerHTML = `<span class="muted">Hi,</span> <strong>${user.name}</strong> <button id="logoutBtnInner" class="btn ghost small">Logout</button>`;
      const innerLogout = qs('#logoutBtnInner');
      innerLogout?.addEventListener('click', ()=>{ localStorage.removeItem('finhub_user'); updateUserUI(); });
      openLoginBtn?.classList.add('hidden');
      return;
    }
  }
  userInfoEl.textContent = '';
  openLoginBtn?.classList.remove('hidden');
}
// initialize on load
updateUserUI();

// Login (client-side demo with validation)
const loginForm = qs('#loginForm');
const loginMessage = qs('#loginMessage');

function validateEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameEl = qs('#name');
  const emailEl = qs('#email');
  const passwordEl = qs('#password');
  if(!nameEl || !emailEl || !passwordEl) return; // guard
  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  // reset states
  [nameEl, emailEl, passwordEl].filter(Boolean).forEach(el=> el.removeAttribute('aria-invalid'));
  loginMessage.textContent = '';

  if(!name){ nameEl.setAttribute('aria-invalid','true'); nameEl.focus(); loginMessage.textContent = 'Please enter your name.'; return; }
  if(!validateEmail(email)){ emailEl.setAttribute('aria-invalid','true'); emailEl.focus(); loginMessage.textContent = 'Please provide a valid email address.'; return; }
  if(password.length < 6){ passwordEl.setAttribute('aria-invalid','true'); passwordEl.focus(); loginMessage.textContent = 'Password should be at least 6 characters.'; return; }

  // store user info locally for demo purposes
  const user = { name, email, loggedAt: new Date().toISOString() };
  localStorage.setItem('finhub_user', JSON.stringify(user));
  loginMessage.textContent = `Welcome, ${name}! You're logged in (demo).`;
  updateUserUI();
  setTimeout(()=>{ closeModal(); }, 700);
});

// Chat functionality (mock bot)
const chatWidget = qs('#chatWidget');
const toggleChatBtn = qs('#toggleChat');
const clearChatBtn = qs('#clearChat');
const messagesEl = qs('#messages');
const chatInput = qs('#chatInput');
const sendBtn = qs('#sendBtn');

let chatOpen = true; // start open for demo
function toggleChat(){
  chatOpen = !chatOpen;
  chatWidget.style.height = chatOpen ? '420px' : '48px';
  if(chatOpen) chatInput?.focus();
}
toggleChatBtn?.addEventListener('click', toggleChat);

// Clear / end conversation flow
function clearChatHistory(){
  // remove messages from DOM and storage
  if(messagesEl) messagesEl.innerHTML = '';
  try{ localStorage.removeItem('finhub_chat_history'); }catch(e){}
  // notify user briefly
  appendMessage('Conversation ended — chat cleared.', 'bot', false);
}

clearChatBtn?.addEventListener('click', ()=>{
  // ask for confirmation via the chat Yes/No flow
  appendMessage({ text: 'Confirm ending the conversation and clearing all chat history.', action: 'clear' }, 'bot');
});

function appendMessage(content, who='bot', askMore=true){
  if(!messagesEl) return;
  const msg = document.createElement('div');
  msg.className = `message ${who}`;

  const isObject = (typeof content === 'object');
  const text = isObject ? (content.text || '') : (content || '');
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  textEl.textContent = text;
  msg.appendChild(textEl);

  // If content contains a moreInfo field, capture it
  const moreInfo = isObject && content.moreInfo ? content.moreInfo : null;

  // If this is a bot message and we should ask for more, render Yes/No actions
  if(who === 'bot' && askMore){
    const actions = document.createElement('div');
    actions.className = 'message-actions';



    const yes = document.createElement('button');
    yes.className = 'btn small';
    yes.type = 'button';
    yes.textContent = 'Yes';

    yes.addEventListener('click', ()=>{
      appendMessage('Yes', 'user', false);
      persistMessage('user','Yes');
      // show temporary loading
      const loadingMsg = appendMessage('Loading more info...', 'bot', false);
      // if we have a special action (e.g., clear), handle it
      setTimeout(()=>{
        // remove the loading indicator (last bot message with that exact text)
        const lastLoading = messagesEl.querySelector('.message.bot:last-child');
        if(lastLoading && lastLoading.textContent === 'Loading more info...') lastLoading.remove();

        if(isObject && content && content.action === 'clear'){
          // perform clear action
          clearChatHistory();
        } else if(moreInfo){
          appendMessage(moreInfo, 'bot', false);
          persistMessage('bot', (typeof moreInfo === 'object') ? (moreInfo.text || '') : moreInfo);
        } else {
          const reply = "Okay — let me know if you need anything else.";
          appendMessage(reply, 'bot', false);
          persistMessage('bot', reply);
        }
      }, 700);

      yes.disabled = true; no.disabled = true;
    });

    const no = document.createElement('button');
    no.className = 'btn small ghost';
    no.type = 'button';
    no.textContent = 'No';
    no.addEventListener('click', ()=>{
      appendMessage('No', 'user', false);
      persistMessage('user','No');
      const reply = "No problem — I'm here if you want anything else.";
      appendMessage(reply, 'bot', false);
      persistMessage('bot', reply);
      yes.disabled = true; no.disabled = true;
    });

    actions.appendChild(yes);
    actions.appendChild(no);
    msg.appendChild(actions);


  }

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return msg;
} 

function mockBotResponse(input){
  input = (input || '').toLowerCase();

  // Student-focused: emergency & short-term safety
  if(/emerg|emergency|fund/.test(input)) return {
    text: 'Emergency funds are useful even for students — aim for at least 1 month of expenses while in school and 3+ months if you have steady bills.',
    moreInfo: 'Student emergency fund plan:\n1) List essential monthly costs (rent, food, transport, phone).\n2) Set a realistic mini-target (e.g., 1 month = $500–$1,500).\n3) Save small automatic amounts (e.g., $25/week).\n4) Use a high-yield savings or campus bank account to hold it.'
  };

  // Student budgeting methods and sample budgets
  if(/budget|50\/30\/20|zero-based|envelope|student budget|monthly budget|budgeting/.test(input)) return {
    text: 'For students, simple budgets work best: try a monthly or weekly plan that fits irregular income (allowance, part-time pay, or gig work).',
    moreInfo: 'Student sample monthly budget (example):\n- Income (part-time + allowance): $800\n- Rent/share: $300 (with roommate)\n- Food/meal plan: $150\n- Transport: $40\n- Textbooks/supplies: $50\n- Savings/emergency: $100\n- Fun/entertainment: $60\n\nTips: use the envelope or a simple app, automate $25–$50/week to savings, and track textbook costs early (buy used or share PDFs).' 
  };

  // Saving strategies for students
  if(/save|savings|student discount|textbook|scholarship|sinking/.test(input)) return {
    text: 'Students can save by leveraging discounts, buying used textbooks, and using campus resources (food banks, discounted transport).',
    moreInfo: 'Student savings ideas:\n- Always check for student discounts (software, subscriptions, transport).\n- Buy used textbooks or rent them; sell back at semester end.\n- Use campus meal plans strategically and cook in bulk with roommates.\n- Create sinking funds for big semester costs (tuition, laptop, travel).\n- Apply for scholarships, grants, and emergency funds offered by your institution.'
  };

  // Work, internships, and side hustles
  if(/intern|part-?time|gig|freelance|side job|work/.test(input)) return {
    text: 'Part-time jobs and internships are great for income and experience — prioritize roles that build skills related to your studies when possible.',
    moreInfo: 'Balancing work and study:\n- Try on-campus jobs (flexible hours).\n- Use paid internships to build skills and network.\n- Freelance or tutoring can be high-pay for flexible schedules.\n- Track taxes and keep receipts for any deductible expenses.'
  };

  // Student loans & debt specific
  if(/student loan|student loans|student debt|loan|defer|forbearance/.test(input)) return {
    text: 'Student loans are common; understand interest, your grace period, and repayment options before graduating.',
    moreInfo: 'Student loan checklist:\n- Know your lender and interest rate.\n- Check grace periods and when repayment starts.\n- Consider income-driven repayment plans if needed.\n- Pay small amounts during school if possible to reduce interest.\n- Look into loan forgiveness programs and refinancing after graduation.'
  };

  // Credit & building credit as a student
  if(/credit score|credit card|build credit|credit/.test(input)) return {
    text: 'Building credit as a student helps later — consider a student credit card or becoming an authorized user with a responsible family member.',
    moreInfo: 'Credit tips for students:\n- Use a student-friendly card with low limit and pay in full each month.\n- Keep utilization low (<30%).\n- Avoid cash advances and high-interest debt.\n- Check credit reports for errors once a year.'
  };

  // Scholarships, grants, and financial aid
  if(/scholarship|grant|financial aid|fafsa|aid/.test(input)) return {
    text: 'Search for scholarships by major, community, and extracurriculars — many small scholarships add up.',
    moreInfo: 'Scholarship search tips:\n- Use your school portal and scholarship databases.\n- Apply to multiple small awards; tailor essays to each.\n- Meet deadlines and keep a list of requirements.\n- Check departmental scholarships and work-study options.'
  };

  // Investing basics for students
  if(/invest|investment|etf|stock|dividend|index/.test(input)) return {
    text: 'If you have extra savings, consider starting small with low-cost index funds or ETFs — your time horizon is your biggest advantage.',
    moreInfo: 'Student investor tips:\n- Start with small, regular contributions (even $25/month).\n- Consider tax-advantaged accounts when available.\n- Learn about fees; prefer low-cost index funds.\n- Treat it as long-term; avoid frequent trading.'
  };

  // Quick prompts and short inputs
  if(input.length < 3) return "Please provide more details. For example: 'How do I start a student budget' or 'Best ways to save on textbooks'";

  // If user asks generally or unknown
  return {
    text: "I can help with student budgets, scholarships, part-time work, loans, and everyday student savings tips. Pick an area for a quick guide.",
    moreInfo: 'Student topics available:\n- Budgeting for students (sample budgets)\n- Emergency funds while in school\n- Saving on textbooks & meal costs\n- Part-time jobs and internships\n- Student loans & repayment options\n- Building credit safely as a student\n\nReply with a topic name (e.g., "textbooks") or click Yes for a short student-focused guide.'
  };
} 

// Chat API integration helper
const BOT_CONFIG = window.FINHUB_BOT || null; // { url, apiKey (optional), model (optional) }
async function callBotAPI(message){
  if(!BOT_CONFIG || !BOT_CONFIG.url) return null;
  try{
    const payload = { message };
    const headers = { 'Content-Type':'application/json' };
    if(BOT_CONFIG.apiKey) headers['Authorization'] = `Bearer ${BOT_CONFIG.apiKey}`;
    const res = await fetch(BOT_CONFIG.url, { method: BOT_CONFIG.method || 'POST', headers, body: JSON.stringify(payload) });
    if(!res.ok) throw new Error('Bot API error');
    const json = await res.json();
    // expect { reply: '...' } or fallback
    return json.reply || json.answer || null;
  }catch(err){
    console.error('Bot API call failed', err);
    // notify the user via a banner and a brief bot message, then fallback to local mock handler
    try{ showGlobalError('External service unavailable — using local help.'); }catch(e){ /* ignore */ }
    try{ if(typeof appendMessage === 'function') appendMessage('Using local help — the online service is unavailable right now.', 'bot', false); }catch(e){ /* ignore */ }
    return null;
  }
}

async function sendMessage(){
  const text = (chatInput?.value || '').trim();
  if(!text) return;

  // detect end/clear command words and handle via confirmation flow
  const normalised = text.toLowerCase().trim();
  const endCommands = ['end','end conversation','clear','reset','erase chat'];
  if(endCommands.includes(normalised)){
    appendMessage({ text: 'Confirm ending the conversation and clearing all chat history.', action: 'clear' }, 'bot');
    chatInput.value = '';
    return;
  }

  appendMessage(text, 'user');
  persistMessage('user', text);
  chatInput.value = '';
  // loading indicator
  appendMessage('Thinking...', 'bot');
  const loadingEl = messagesEl?.querySelector('.message.bot:last-child');
  if(loadingEl) loadingEl.classList.add('loading');
  // disable input while awaiting
  if(chatInput) chatInput.disabled = true;
  if(sendBtn){ sendBtn.disabled = true; sendBtn.classList.add('disabled'); }

  let reply = null;
  // try API first, then fallback to mock
  try{
    const apiReply = await callBotAPI(text);
    if(apiReply) reply = apiReply;
  }catch(err){ console.error(err); }
  if(!reply) reply = mockBotResponse(text);

  // remove loading indicator and append reply
  const last = messagesEl?.querySelector('.message.bot:last-child');
  if(last && last.classList.contains('loading')) last.remove();
  appendMessage(reply, 'bot');
  // persist the textual content
  const replyText = (typeof reply === 'object') ? (reply.text || '') : reply;
  persistMessage('bot', replyText);

  // restore input
  if(chatInput){ chatInput.disabled = false; chatInput.focus(); }
  if(sendBtn){ sendBtn.disabled = false; sendBtn.classList.remove('disabled'); }
}

// persist chat history (simple storage)
function persistMessage(who, text){
  try{
    const raw = localStorage.getItem('finhub_chat_history');
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ who, text, t: new Date().toISOString() });
    // limit history
    const trimmed = arr.slice(-100);
    localStorage.setItem('finhub_chat_history', JSON.stringify(trimmed));
  }catch(e){ console.warn('Could not persist chat', e); }
}

// restore history on load
function loadHistory(){
  try{
    const raw = localStorage.getItem('finhub_chat_history');
    const arr = raw ? JSON.parse(raw) : [];
    arr.forEach(m=> appendMessage(m.text, m.who));
  }catch(e){ /* ignore */ }
}

loadHistory();

// enable/disable send button based on input
chatInput?.addEventListener('input', ()=>{
  if((chatInput.value||'').trim().length) sendBtn.disabled = false; else sendBtn.disabled = true;
});

// initialize state
sendBtn.disabled = true;

sendBtn?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') sendMessage(); });

// Welcome modal for chatbot topics (student-focused)
const welcomeModal = qs('#welcomeModal');
const welcomeClose = qs('#welcomeClose');
const topicBtns = qsa('.topic-btn');
const welcomeDontShow = qs('#welcomeDontShow');

function showWelcomeModal(){
  try{
    const suppressed = localStorage.getItem('finhub_welcome_suppress');
    if(suppressed === '1') return;
  }catch(e){}
  if(!welcomeModal) return;
  welcomeModal.setAttribute('aria-hidden','false');
  // focus first topic
  const first = qs('.topic-btn'); if(first) first.focus();
}

function hideWelcomeModal(){
  if(!welcomeModal) return;
  welcomeModal.setAttribute('aria-hidden','true');
  // restore focus to input
  if(chatInput) chatInput.focus();
}

welcomeClose?.addEventListener('click', ()=>{ hideWelcomeModal(); });
// clicking outside modal content hides it
welcomeModal?.addEventListener('click', (e)=>{ if(e.target === welcomeModal) hideWelcomeModal(); });

topicBtns.forEach(btn=> btn.addEventListener('click', (e)=>{
  const t = btn.getAttribute('data-topic') || btn.textContent;
  // if user wants, suppress future popups
  if(welcomeDontShow?.checked){ try{ localStorage.setItem('finhub_welcome_suppress','1'); }catch(e){} }
  hideWelcomeModal();
  // Navigate to dedicated topic page so the user can read and think before chatting
  const url = `topics/topic.html?topic=${encodeURIComponent(t)}`;
  window.location.href = url;
}));

// show modal or prefill input when the chat page loads
window.addEventListener('load', ()=>{
  const params = new URLSearchParams(window.location.search);
  const t = params.get('topic');
  if(t){
    // arrived from a topic page — prefill the chat input so the user can think and edit before sending
    if(chatInput){ chatInput.value = `${t} (student)`; chatInput.focus(); }
    appendMessage(`Prefilled your question about ${t}. Press send when ready.`, 'bot', false);
    return;
  }
  showWelcomeModal();
});
// (Removed duplicate placeholder) The real `callBotAPI` implementation is defined earlier and will be used if `window.FINHUB_BOT` is configured.

// small utility
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}

// initialize sample welcome message
appendMessage('Hello! I am your Finhub Advisor. Ask me about budgets, investing, or taxes.','bot');

// keep focus accessibility
chatWidget?.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ if(loginModal?.getAttribute('aria-hidden') === 'false') closeModal(); } });
