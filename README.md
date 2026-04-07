# Legacy AI — Digital Legacy Preservation
> A Cocapn Fleet vessel for estate planning and memoirs, built on accumulated context.

Your digital footprint will likely outlast your physical possessions, yet tools for managing it are often temporary or extractive. This project offers a different approach.

**Live URL:** https://legacy-ai.casey-digennaro.workers.dev

---

### How It Works
Most digital legacy services are subscriptions that can disappear. This is a runtime you own. Fork it, deploy it, and it belongs to you and the people you choose.

### What It Provides
*   **Your data, your control:** All memory and context lives in your own Cloudflare namespace. No central accounts, tracking, or login walls.
*   **Fork-first durability:** It works as long as your fork exists. There is no upstream service to discontinue.
*   **Zero runtime dependencies:** It runs on Cloudflare Workers with no external dependencies that can break.
*   **One honest limitation:** You must provide your own LLM API keys and manage your Cloudflare deployment. It's not a hosted service.

### Core Features
This agent is designed to accumulate context over time for legacy and estate planning purposes.
- **Persistent, append-only memory** builds a single body of your stories, values, and instructions.
- **Multi-provider LLM fallback** routes across four supported providers to maintain availability.
- **Estate planning guardrails** with prompts focused on legacy distillation and end-of-life planning.
- **Full Fleet compatibility** for native interaction with other Cocapn vessels.
- **Bring your own keys:** LLM credentials are stored only in your Cloudflare Secrets.
- **Repo-native sovereignty:** You control all code and data.

### Quick Start
1.  **Fork** this repository.
2.  Deploy it: `npx wrangler deploy`
3.  Visit your instance's `/setup` page to configure API keys. Add keys for any of the supported providers:
    - `DEEPSEEK_API_KEY`
    - `MOONSHOT_API_KEY`
    - `DEEPINFRA_API_KEY`
    - `SILICONFLOW_API_KEY`

### Contributing
This follows a fork-first philosophy. There is no single correct version. Adapt it for your needs. If you build something useful for others, consider a pull request.

**License:** MIT

---

Superinstance & Lucineer (DiGennaro et al.)

<div>
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> • 
  <a href="https://cocapn.ai">Cocapn</a>
</div>