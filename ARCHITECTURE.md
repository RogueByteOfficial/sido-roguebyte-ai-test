# Autonomous Agent Architecture

## Modular Pipeline
```
LOCAL MODEL (Ollama / llama.cpp / Built-in Engine)
       ↓
   AGENT CORE
       ↓
    PLANNER
       ↓
 TASK EXECUTOR
       ↓
     TOOLS ──→ [Terminal, Browser, Filesystem, Git/GitHub, Vercel, PayPal]
       ↓
    MEMORY ──→ [Short-Term, Long-Term, Project Memory]
       ↓
OBSERVATION & ERROR RECOVERY
       ↓
RESULT VERIFICATION
```

## Error Recovery Loop
When an action fails:
1. `COMMAND FAILED`: Capture exit code and stderr/stdout.
2. `READ ERROR`: Parse failure trace and identify failure class.
3. `ANALYZE ERROR`: Map against known fault patterns.
4. `PROPOSE FIX`: Formulate corrective action (e.g. initialize missing git, create directory).
5. `APPLY FIX`: Execute remediation step.
6. `RUN AGAIN`: Retry original command with updated state (up to `maxRetries = 3`).
7. `VERIFY`: Validate operational status and save solution into persistent memory.
