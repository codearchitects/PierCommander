---
description: Compatibility alias for the host-owned /req-loop. Use CAIP AI Assistant with an OpenAI-compatible or VS Code LM model; external CLIs cannot start this host engine.
argument-hint: [--queue <path> | --document <documentId> | --scenario <id> --document <documentId>] | --resume | --status | --help
---

# /req-loop-beta — host-owned loop alias

Use **CAIP AI Assistant** in VS Code and select an **OpenAI-compatible** or **VS Code LM** model. `/req-loop` is the main entry point for this engine; `/req-loop-beta` remains an alias using the same checkpoint. With Claude selected, `/req-loop` retains its separate existing workflow.

Arguments: `$ARGUMENTS`

The CAIP Assistant host intercepts this command. It owns requirement selection, durable checkpoints, Gherkin MCP metadata, bounded plan/implement/verify packets and final outcomes. This Markdown is discovery/help content, not an orchestration procedure for the model to execute.

If you are reading this because an external CLI expanded the command, explain that the user must run it in CAIP AI Assistant. Do not simulate the host, launch the legacy loop, or claim a run started.

## Usage

```text
/req-loop-beta --help
/req-loop-beta --document purchase-approvals
/req-loop-beta --scenario <canonical-scenario-id> --document purchase-approvals
/req-loop-beta --queue .caep/req-loop/queue.json
/req-loop-beta --status
/req-loop-beta --resume
```

CAIP runs respect the C4 model and generated-code editing strategies. Universal runs use the workspace declared build/test targets. Both require verification evidence; a model response or a success phrase alone is never proof of completion.

The host automatically publishes each packet's stages, observed verification evidence, model usage when available, and final outcome to **AI Insights** under `req-loop-beta`. Stop and resume appear as separate attempts linked to the same packet. Models must not open duplicate pipeline runs or write insight verdicts themselves.

This is experimental functionality. Provisioning this command does not establish that an application run or production verification has passed.
