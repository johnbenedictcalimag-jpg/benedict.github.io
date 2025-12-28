# Finhub — Simple Finance Frontend

This is a lightweight, static front-end demo called **Finhub** with:

- A finance-themed front page
- Modal login (client-side demo, stores minimal user info in localStorage)
- Floating chatbot widget (mock responses + optional API integration point)

## Run locally

Options:

1. Quick: Open `index.html` in your browser (note: some features that use `fetch` may require serving over HTTP).

2. Local server (recommended):
   - With Python: `python -m http.server 8000` (then open `http://localhost:8000`)
   - With VS Code: Install **Live Server** and choose **Open with Live Server**

3. (Optional) Use a modern dev server like Vite. From the project folder:
   - `npm init -y`
   - `npm create vite@latest . -- --template vanilla`
   - `npm install`
   - `npm run dev`

## Chatbot API integration

The chat widget uses a small helper `callBotAPI(message)` in `script.js`. To integrate a real chatbot backend:

1. Add a global config in a script tag before `script.js` or via server-side injection:

```html
<script>
  window.FINHUB_BOT = {
    url: 'https://your-bot-endpoint.example.com/chat',
    apiKey: 'YOUR_API_KEY_IF_NEEDED',
    method: 'POST'
  };
</script>
```

2. `callBotAPI` expects the endpoint to accept `{ message }` in the request body and return JSON with a `reply` (or `answer`) field. The function handles an Authorization header if `apiKey` is provided.

3. For security, **do not** embed production API keys in client-side code. Instead, proxy requests through your server to keep keys secret.

## Chatbot topics (expanded)

The built-in chatbot now supports a wide range of finance topics and provides optional detailed tips via the **Yes / No** actions:

- Budgeting: methods (50/30/20, Zero-Based, Envelope), step-by-step setup
- Emergency Fund: how to calculate target and monthly contributions
- Savings strategies: automation, high-yield accounts, sinking funds, CDs
- Investing basics: index funds, ETFs, dollar-cost averaging, tax-advantaged accounts
- Debt management: snowball vs avalanche, refinancing, credit improvement tips
- Retirement: employer match, IRAs, 401(k) guidance
- Interest & compounding: examples and why time matters
- Cash flow & paycheck planning: tracking income/expenses and automations

When the bot offers a short guide it will show **Yes / No** buttons — click **Yes** to load a detailed step-by-step guide (the reply will be displayed in-chat). Click **No** to dismiss. The detailed content is also persisted in chat history.

## Notes & next steps

- The login is demo-only and stores user info in `localStorage` — do not use for production authentication.
- Accessibility improvements and responsive tweaks are included, but run manual QA for your target devices.

I added a Node Express proxy server that can forward requests to Finnhub (or other finance APIs).

To enable it:

1. Copy `.env.example` to `.env` and add your API key:

   FINNHUB_API_KEY=your_finnhub_api_key_here

2. Install server dependencies and start the proxy server:

   npm install
   npm run server

3. To preview the static pages locally you can use a simple static server (or use Live Server in VS Code):

   npx serve . -p 5000

4. The server exposes endpoints:
   - `GET /api/health` — quick health check
   - `GET /api/quote?symbol=AAPL` — returns Finnhub quote for the symbol (requires API key)
   - `GET /api/search?q=apple` — symbol lookup

Client-side, the chat Yes action can call `/api/quote?symbol=SYMBOL` to fetch live quotes. For security, keep API keys in the server environment and do not commit them to source control.

If you'd like, I can modify the chatbot to detect ticker questions (e.g., "AAPL price") and surface a message with a Yes button that fetches a live quote when clicked. Let me know if you want that behavior and I’ll implement it next.