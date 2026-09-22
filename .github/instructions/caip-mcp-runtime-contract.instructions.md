---
applyTo: "**"
---

## MCP runtime contract

Tool names and argument examples in agents, skills and instructions describe intent;
the connected runtime's tool schema is authoritative for names, inputs and response
contracts. Preserve the task's role boundaries, permissions, domain rules and workflow.

1. Before using an MCP operation for the first time in a session, discover the authorized
   capability and read its current schema. When the runtime exposes the CAIP facade, use
   `caipListTools` → `caipDescribeTool` → `caipInvoke`, using each exposed schema to build
   its arguments. Otherwise use the client's native tool discovery and actual exposed
   tool schema; the facade is not available in every client. Do not invent a tool name,
   alias, parameter or facade wrapper from a template example.
2. Reuse that contract during the session. After a reconnect, tool-list change or
   unknown-tool/schema error, refresh the relevant discovery/schema once and reconstruct
   the call. Do not repeat the same invalid arguments or blindly retry writes. If a
   mutation times out or its outcome is uncertain, read the affected state before deciding
   whether a retry is needed; if the outcome cannot be established, report it.
3. Discovery is not permission. Invoke only operations allowed by the current role and
   task; a generic invocation tool does not expand that scope. Respect read-only and
   filtered tool surfaces. Do not widen allowlists or switch transports to bypass a denial.
4. Distinguish missing or policy-filtered capabilities from a disconnected transport.
   If the needed capability is absent after discovery, report the operation needed, the
   relevant exposed tools and the actual error or availability evidence. Request a server
   restart only when transport evidence supports it. Preserve MCP-only model/requirement
   access: unavailable tools do not authorize direct-file inspection or mutation.
