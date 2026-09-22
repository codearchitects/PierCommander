---
c4Id: 93121202-b9a1-a95b-2558-f2bf3abc8e4c
name: PierCommander
level: context
---

## Cronologia di costruzione del sistema — dall'inizio alla fine

Questa sezione registra come PierCommander è stato costruito: tre sessioni AI consecutive
il 2026-09-22, dalla richiesta iniziale al sistema funzionante end-to-end. Vive qui, sul
software system, perché attraversa entrambi i container: metterla su uno solo la renderebbe
invisibile dall'altro.

**Nota sulle fonti.** La sessione 3 è documentata in prima persona. Le sessioni 1 e 2 sono
ricostruite dalle loro tracce persistenti — il log di sessione del documento di progetto,
`requirements/filesystem-operations.feature.ai.log.yaml` e lo stato del modello — non dalla
memoria di chi scrive. Dove una traccia non registra un dato (per esempio quali sub-agenti
abbia usato la sessione 1), è detto esplicitamente invece di essere dedotto.

### Sessione 1 — Architettura · 14:08 → 14:13 · `claude-cli:sonnet` · `conv-mucqymk3-scze`

Richiesta dell'utente: *«voglio creare un norton commander in python con user interface
browser based con i comandi essenziali per gestire il filesystem. Crea Architettura,
container…»*. Due passaggi (`#1` e `#2`), entrambi chiusi `ok`, entrambi in modalità
`bypassPermissions`, effort medium.

Ne è uscito tutto ciò su cui le due sessioni successive hanno lavorato:

- il modello C4 — `User` (person), `PierCommander` (software system), e dentro di esso i due
  container `FilesystemApi` (service, python/fastapi) e `PierCommanderWeb` (web-application,
  react/typescript), con le relazioni User → Web → Api;
- i `targetProfile` di entrambi i container — la dichiarazione che ha poi permesso alle
  sessioni 2 e 3 di non inventare alcun comando di build o di test;
- i due documenti di requisiti: `filesystem-operations.feature` (11 scenari, ancorato a
  FilesystemApi) e `two-panel-navigation.feature` (10 scenari, ancorato a PierCommanderWeb).

Le tracce non registrano quali sub-agenti o skill siano stati usati in questa sessione.

### Sessione 2 — Backend · 14:17 → 14:30 · `/req-loop` · `claude-sonnet-5` · `conv-mucrcxpj-0cmu`

Coda dei requisiti `filesystem-operations` (FLSY-OPRT-SXK-010 … -110, 11 scenari). Esito `ok`.

| Stadio | Durata | Esito |
|---|---|---|
| preflight | 46 s | famiglie di tool confermate, nessun driver concorrente |
| intake | 7 s | prima implementazione: nessuna `backend/`, zero citazioni `§REQ` |
| implement | 536 s | 3 pack (4+4+3) via **`universal-developer`**, RED-first, baseline FastAPI scaffoldata |
| verify | 3 s | `compileall` exit 0 · `pytest` 20 passed exit 0 |
| close-stamp | 24 s | 11 requisiti verdi, `aiRevisionCount` 1 |

Ha prodotto `backend/` — `app.py`, `src/config.py`, `src/filesystem.py`, `src/routes.py` e
13 file di test — con gli otto endpoint HTTP che il client web avrebbe poi consumato.

### Sessione 3 — Frontend · 14:30 → 15:04 · `/req-loop` · `claude-opus-5` · `conv-mucru8dj-snx5`

Coda dei requisiti `two-panel-navigation` (TWO-PNL-NVGT-OOX-010 … -100, 10 scenari). Esito
`ok`, 10 su 10 verdi. Durata totale 33 min 27 s.

| Stadio | Durata | Esito |
|---|---|---|
| preflight | 58 s | contratto DoD letto dai `targetProfile`; baseline misurata senza fail-fast (backend 20 passed); `web/` inesistente → gate D |
| intake | 7 s | 10 requisiti tutti eleggibili, 0 scartati dalla coda; **lane = codice** |
| context | 7 s | livello container riletto; nessun buco architetturale da proporre |
| open-stamp | 14 s | `aiStartedAt` su tutti e 10 prima di leggere una riga di codice |
| implement | 1 493 s | 3 pack sequenziali via **`universal-developer`** |
| verify (1ª) | 75 s | **fallito** — vedi sotto |
| repair | 217 s | 1 passata su 5 disponibili, 2 correzioni |
| verify (2ª) | 9 s | web 41/41 + build exit 0 · backend 20 passed exit 0 |
| close-stamp | 51 s | 10 requisiti verdi, `aiProvider`/`aiModel` registrati |

I tre pack, ciascuno con un sub-agente fresco:

- **pack A** — gate D (scaffolding React+TS/Vite/Vitest in `web/`, comandi dichiarati provati
  *prima* del primo test RED) + requisiti `-010`, `-020`, `-030`;
- **pack B** — `-040`, `-050`, `-060`, `-070` (copia, spostamento, cancellazione con conferma
  esplicita, creazione cartella);
- **pack C** — `-080`, `-090`, `-100` (rinomina, anteprima testo, tasti funzione Norton
  Commander F3/F5/F6/Shift+F6/F7/F8).

**Il difetto che la suite non poteva vedere.** La prima `verify` è passata in verde su
entrambi i target e nonostante ciò è stata chiusa come fallita. Il brief che il driver aveva
scritto ai sub-agenti dichiarava il tipo di voce del filesystem come `"folder"`; il backend
reale emette `"directory"`. I sub-agenti hanno seguito fedelmente il brief, e il doppio di
test ha codificato lo stesso errore — perciò 41 test su 41 passavano mentre l'applicazione
reale non avrebbe aperto una sola cartella, che è esattamente l'osservabile del requisito
`-030`. A trovarlo è stato lo smoke sullo stack vivo, non la suite. La `repair` ha corretto
il lato web (il backend è autorevole e fuori slice) e, come seconda correzione, il layout che
spingeva barra comandi e barra dei tasti funzione sotto la piega.

**La lezione, che è già registrata come regola su PierCommanderWeb:** un doppio di test che
rispecchia l'assunzione del client invece del comportamento del server non può rilevare una
divergenza di contratto. Le forme dei payload si prendono dal sorgente del backend o da una
risposta viva, mai dalla prosa che le descrive.

**Prova end-to-end.** Entrambi i container avviati con i rispettivi comandi `run` dichiarati,
su una root reale: da tastiera, F7 → dialog «New folder» → `POST /fs/folders` → cartella
creata sul filesystem reale e comparsa nel pannello attivo.

### Agenti e skill usati

| Cosa | Dove | A che serviva |
|---|---|---|
| skill **`req-loop`** (`/req-loop --queue …`) | sessioni 2 e 3 | il loop autonomo: intake, RED gate, citazioni `§REQ`, stamp, verifica sui comandi dichiarati |
| sub-agente **`universal-developer`** | sessione 2 (×3 pack), sessione 3 (×3 pack) | l'unico agente che ha scritto codice; sei deleghe in tutto, tutte in foreground e attese |
| famiglia **`caipGherkin*`** | sessioni 2 e 3 | lettura e stamp dei metadati dei requisiti — mai editando i mirror a mano |
| famiglia **`caipC4Modeler*`** / **`caipGraph*`** | sessioni 1, 2, 3 | sessione 1 in scrittura (l'architettura); 2 e 3 in sola lettura, per i `targetProfile` e l'orientamento |
| famiglia **`caipPipeline*`** | sessioni 2 e 3 | il diario di esecuzione che ha reso possibile questa cronologia |
| **integrated browser** (`browser_*`) | sessione 3 | lo smoke sullo stack vivo: è ciò che ha trovato il difetto `folder`/`directory` |

Non sono stati usati: l'agente `universal-architect` (nessun requisito di questa coda era in
lane modello), l'agente `universal-analyst` (i requisiti esistevano già dalla sessione 1), e
nessun expertise pack — `.caep/expertise.json` non ne dichiara alcuno per lo stack react.

### Stato finale

Due container implementati e verdi sui comandi che il modello stesso dichiara: FilesystemApi
20 test, PierCommanderWeb 41 test, 21 requisiti su 21 con `aiGeneratedAt` valorizzato e
citazioni `§REQ` presenti sia nel codice sia nei test.

## Session log

### 2026-09-22T15:06:44.154Z — (session not started from the modeler)
- Session: conv-mucru8dj-snx5
- Outcome: Implementati e chiusi verdi i 10 requisiti di two-panel-navigation su PierCommanderWeb (base React/TS scaffoldata in web/, 41 test, build verde), con una passata di repair che ha allineato il vocabolario di wire al backend ("directory", non "folder"). Aggiunta al contesto di questo nodo la cronologia completa di costruzione del sistema — le tre sessioni del 2026-09-22 con stadi, durate ed esiti — e l'elenco degli agenti e delle skill usati in ciascuna; le sessioni 1 e 2 sono ricostruite dalle loro tracce persistenti, non dalla memoria.

## Tempi e costi di realizzazione — via AI e alternativa con team umano

### Cosa è misurato e cosa è stimato

Questa distinzione viene prima dei numeri, perché i due gruppi hanno affidabilità molto diversa.

**Misurato** (letto dai diari di esecuzione, non ricostruito): i tempi di parete di tutte e tre
le sessioni, stadio per stadio; i token consumati dai tre sub-agenti della sessione 3 —
91 505 + 93 770 + 115 713 = **300 988 token**, riportati dall'harness a fine delega.

**Stimato** (con le assunzioni dichiarate qui sotto, perché il dato non è stato registrato):
il consumo del driver in ciascuna sessione, i token delle sessioni 1 e 2, e la ripartizione
fra token di input e di output. Le sessioni 1 e 2 non hanno registrato alcun conteggio.

Per questo il costo AI è dato **come intervallo** e non come cifra secca. L'ordine di
grandezza è solido; la seconda cifra significativa non lo è.

### Via AI — tempi (misurati)

| Sessione | Modello | Durata |
|---|---|---|
| 1 — Architettura, modello C4 e 21 scenari Gherkin | `claude-cli:sonnet` | ~4 min |
| 2 — Backend FastAPI, 11 requisiti, 20 test | `claude-sonnet-5` | 12 min 51 s |
| 3 — Frontend React/TS, 10 requisiti, 41 test | `claude-opus-5` | 33 min 27 s |
| **Totale macchina** | | **~50 minuti** |

A questo va sommato il tempo umano effettivo: scrivere i prompt, lanciare le code, leggere i
report. Stimato in **1–2 ore** di supervisione, non misurato.

### Via AI — costi

Assunzioni, tutte sostituibili: listino API first-party Anthropic alla data della fonte
consultata (Opus 5 $5 / $25 per milione di token input / output; Sonnet 5 $2 / $10);
ripartizione ~90 % input e ~10 % output, tipica del lavoro agentico dove il contesto viene
rinviato a ogni turno; consumo del driver stimato fra 2× e 4× quello dei suoi sub-agenti.

| Sessione | Token stimati | Costo stimato |
|---|---|---|
| 1 | ~0,2–0,4 M (sonnet) | $0,5 – $1,5 |
| 2 | ~1,2–2,2 M (sonnet) | $3 – $6 |
| 3 | ~1,2–2,0 M (opus), di cui 0,30 M misurati | $9 – $20 |
| **Totale** | | **≈ $13 – $28** (≈ 12 – 26 €) |

Due avvertenze oneste. Il costo del *caching* dei prompt abbassa sensibilmente il conto
reale rispetto a questo calcolo, che applica la tariffa piena a tutto l'input: il valore vero
sta probabilmente verso il basso dell'intervallo. E se il lavoro passa da un abbonamento
Claude Code anziché dall'API a consumo, il costo marginale osservato è un'altra cosa ancora —
questi numeri sono il valore *equivalente a listino API*, non una fattura.

### Alternativa — team di sviluppatori di media seniority (stima)

Stima per lo **stesso perimetro** e **con la stessa disciplina**: test scritti prima del
codice, 61 test complessivi, tracciabilità `§REQ` fra requisiti, codice e test, architettura
C4 documentata. Sviluppatori di media seniority (3–6 anni), che conoscono lo stack ma non
questo dominio.

| Fase | gg/uomo |
|---|---|
| Analisi, modello C4, 21 scenari Gherkin scritti a questo standard | 3 – 5 |
| Backend FastAPI: 8 endpoint, confinamento della root, 20 test | 4 – 6 |
| Frontend: setup progetto, due pannelli, navigazione | 5 – 7 |
| Frontend: copia, spostamento, cancellazione con conferma, creazione, rinomina + dialog | 5 – 7 |
| Frontend: anteprima testo, layer tastiera, barra dei tasti funzione | 3 – 4 |
| Integrazione, debug, code review, cicli di PR | 4 – 6 |
| **Totale** | **24 – 35 gg/uomo** |

**Tempo di calendario:** ~5–7 settimane con una persona; ~3–4 settimane con due in parallelo,
tenendo conto del coordinamento. Non è divisibile linearmente: il frontend dipende dal
contratto del backend.

**Costo**, con tariffe italiane 2026 da sostituire con quelle reali dell'organizzazione:

| Scenario | Tariffa assunta | Costo |
|---|---|---|
| Costo interno pieno (RAL + oneri, ~220 gg lavorativi/anno) | ~280 €/gg | **6 700 – 9 800 €** |
| Consulenza / body rental | ~420 €/gg | **10 100 – 14 700 €** |

Se lo stesso perimetro venisse consegnato **senza** la disciplina test-first e senza
tracciabilità — che è come viene consegnato molto software — il conto scenderebbe a circa
**15–20 gg/uomo**. Il confronto qui sopra è a parità di rigore, non a parità di fretta.

### Confronto

| | Via AI | Team umano |
|---|---|---|
| Tempo macchina / lavoro | ~50 min | 24 – 35 gg/uomo |
| Tempo di calendario | ~1 ora | 3 – 7 settimane |
| Costo | ≈ 12 – 26 € | 6 700 – 14 700 € |
| Supervisione umana | 1 – 2 ore | — |

Gli ordini di grandezza: circa **250–350×** sul tempo di calendario e circa **300–1 000×**
sul costo. L'intervallo è ampio di proposito — è quanto la stima onestamente sopporta.

### Cosa non è incluso in nessuna delle due stime

Il perimetro consegnato è quello dei 21 requisiti, e nulla di più. Restano fuori da entrambe
le colonne, e quindi da sommare a entrambe se servissero: CORS e messa in sicurezza per un
deployment reale, autenticazione e autorizzazione, pipeline CI, containerizzazione e
rilascio, UX delle condizioni d'errore (collisione di nomi in copia, permessi negati), audit
di accessibilità oltre a ciò che i test già asseriscono, comportamento responsive, e
qualunque prova di carico. Nessuna delle due stime è un preventivo per "PierCommander in
produzione": sono entrambe il costo di *questi* requisiti, verificati.
