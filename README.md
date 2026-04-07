# Legacy AI — Your Stories, Your Control
> A Cocapn Fleet vessel that stores your conversational history in an append-only, permanent memory.

You don't lose context when you close a tab. This provides a persistent, private memory layer for your interactions. It runs on your infrastructure, so access depends only on you.

**Live demo:** https://legacy-ai.casey-digennaro.workers.dev

---

## Why This Exists
Most AI chats are ephemeral, stored in third-party systems you don't control. This provides a simple alternative: a private, persistent log of your conversations that you host. It's designed to accumulate context over time, building a searchable record of your discussions.

---

### Quick Start
1.  **Fork** this repository.
2.  Deploy with one command using your Cloudflare account: `npx wrangler deploy`
3.  Visit your worker's `/setup` endpoint to configure API keys for supported LLM providers. Keys are stored as secrets within your Cloudflare account.

**Supported Providers:** Deepseek, Moonshot, DeepInfra, SiliconFlow.

---

### How It Works
1.  **Persistent Context:** It stores your conversation history in Cloudflare KV. By default, nothing is deleted, allowing long-term context accumulation. You control pruning.
2.  **Direct Routing:** Your Worker communicates directly with your configured LLM provider. There is no intermediary server, analytics, or external tracking.
3.  **Fork-First Sovereignty:** You run your own instance. Changes to upstream services or pricing don't affect your deployment.

**A Specific Limitation:** Cloudflare KV is limited to 512MB per namespace. At an average of ~10KB per conversation turn, this allows for roughly 50,000 interactions before you need to implement archival or pruning logic.

---

### Architecture
A single Cloudflare Worker uses KV for storage. It handles requests and gracefully falls back among configured LLM providers if one is unavailable. It has zero npm dependencies.

### Features
- Append-only conversation history stored in your Cloudflare KV.
- Multi-provider support with automatic fallback.
- Prompts are designed to steer responses toward lasting insights rather than generic chat.
- Compatible with other Cocapn Fleet vessels.
- API keys stored only in your Cloudflare Secrets.
- Every user runs an independent, forked instance.

---

### Contributing
The project follows a fork-first model. You are encouraged to adapt it for your needs. If you build a broadly useful improvement, such as a new provider integration, please consider opening a pull request.

**License:** MIT

---

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>