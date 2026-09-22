# PierCommander

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/codearchitects/PierCommander/actions/workflows/ci.yml/badge.svg)](https://github.com/codearchitects/PierCommander/actions/workflows/ci.yml)

Un **Norton Commander per il browser**: due pannelli affiancati, la stessa
grammatica di sempre — scegli il pannello attivo, navighi, e i comandi
essenziali (copia, sposta, cancella, rinomina, nuova cartella) agiscono
*dal* pannello attivo *verso* l'altro.

Sotto ci sono due container: un backend **Python/FastAPI** che espone le
operazioni sul filesystem confinate a una radice consentita, e un client
**React/TypeScript** servito da Vite in sviluppo e da nginx in produzione.

| | |
|---|---|
| Backend | Python 3.12 · FastAPI · uvicorn · pytest — `backend/` |
| Frontend | React 19 · TypeScript · Vite · Vitest · oxlint — `web/` |
| Modello | C4 + requisiti Gherkin — `codegen/model/`, documentati in [`docs/`](docs/) |
| CI/CD | GitHub Actions → immagini su GHCR → deploy via Docker Compose |
| Licenza | [MIT](LICENSE) — open source, uso libero anche commerciale |

---

## Indice

1. [Avvio rapido](#avvio-rapido)
2. [Prerequisiti](#prerequisiti)
3. [Installazione](#installazione)
4. [Compilazione](#compilazione)
5. [Esecuzione](#esecuzione)
6. [Architettura](#architettura)
7. [Sviluppo](#sviluppo)
8. [Test e qualità](#test-e-qualità)
9. [Configurazione](#configurazione)
10. [API](#api)
11. [Docker](#docker)
12. [CI/CD](#cicd)
13. [Deployment](#deployment)
14. [Requisiti e tracciabilità](#requisiti-e-tracciabilità)
15. [Struttura del repository](#struttura-del-repository)
16. [Licenza](#licenza)

---

## Avvio rapido

### Con Docker (il modo più breve)

```bash
cp deploy/.env.example deploy/.env      # scegli FS_HOST_ROOT: è l'unica
                                        # cartella che PierCommander vedrà
docker compose -f deploy/docker-compose.yml up --build -d
open http://localhost:8080
```

### Senza Docker

Servono **Python ≥ 3.12** e **Node ≥ 20** (in CI: 3.12 e 22).

```bash
# terminale 1 — FilesystemApi su :8000
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[test]"
FS_ROOT=~/piercommander-sandbox uvicorn app:api --reload

# terminale 2 — PierCommanderWeb su :5173 (proxy /fs → :8000)
cd web
npm ci
npm start
```

Poi <http://localhost:5173>. Le versioni per esteso — con le varianti, le
porte e cosa fare quando non parte — sono in [Prerequisiti](#prerequisiti),
[Installazione](#installazione), [Compilazione](#compilazione) ed
[Esecuzione](#esecuzione).

> **Attenzione:** `FS_ROOT` è la radice consentita. PierCommander cancella e
> sposta file davvero. In sviluppo puntalo a una cartella sacrificabile —
> mai alla home o alla radice del disco.

---

## Prerequisiti

| Serve | Versione | Verifica | Perché |
|---|---|---|---|
| Python | ≥ 3.11, testato su **3.12** | `python3 --version` | backend |
| pip + venv | inclusi in Python | `python3 -m venv --help` | isolamento delle dipendenze |
| Node.js | ≥ 20, in CI **22** | `node --version` | frontend |
| npm | ≥ 10 | `npm --version` | arriva con Node |
| Docker + Compose v2 | qualsiasi recente | `docker compose version` | solo per immagini e deploy |
| Git | qualsiasi | `git --version` | |

Docker serve **solo** per il percorso a container: si sviluppa e si esegue
tutto anche senza. `pyproject.toml` dichiara `requires-python = ">=3.11"`,
ma la pipeline e le immagini usano 3.12: se lavori su 3.11 sei fuori da ciò
che la CI verifica.

Non serve niente altro: nessun database, nessun broker, nessun servizio
esterno. L'unica risorsa di runtime è una cartella su disco.

---

## Installazione

Una volta sola, dopo il clone. I due container si installano in modo
indipendente: puoi lavorare su uno solo.

### Backend — `backend/`

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -e ".[test]"           # runtime + pytest e httpx
```

`-e` (editable) fa sì che le modifiche a `src/` si vedano senza
reinstallare. Senza l'extra `[test]` ottieni solo FastAPI e uvicorn: il
codice gira ma `pytest` non c'è.

Verifica che sia andata:

```bash
python -c "import fastapi, src.routes; print('backend ok')"
```

### Frontend — `web/`

```bash
cd web
npm ci                             # NON npm install: rispetta il lockfile
```

`npm ci` cancella `node_modules` e installa esattamente ciò che
`package-lock.json` dichiara — è quello che fa la CI, ed è l'unico modo per
avere in locale le stesse versioni. Usa `npm install` solo quando stai
deliberatamente aggiungendo o aggiornando una dipendenza (e allora committa
il lockfile modificato).

Verifica:

```bash
npx vite --version
```

---

## Compilazione

Ogni container dichiara il proprio comando di build nel modello C4
(`targetProfile.build`); qui sotto ci sono quei comandi, non delle varianti.

### Backend

```bash
cd backend
python -m compileall -q src        # build dichiarato: fallisce su errori di sintassi
```

Python non produce un artefatto distribuibile in questo progetto: la
"compilazione" è il controllo che tutti i moduli si compilino a bytecode.
L'artefatto vero è l'immagine Docker (vedi [Docker](#docker)).

### Frontend

```bash
cd web
npm run build                      # = tsc -b && vite build
```

Due passi in uno, ed entrambi possono far fallire il build:

1. **`tsc -b`** — controllo dei tipi di tutto il progetto. Non emette il
   bundle: è il cancello che impedisce a un errore di tipo di arrivare in
   produzione. Da solo: `npx tsc -b` (e `npx tsc -b --clean` per azzerare
   la cache incrementale se ti dà risultati che non tornano).
2. **`vite build`** — il bundle di produzione in `web/dist/`: HTML, CSS e
   JS con hash nel nome, minificati.

Il risultato tipico è intorno ai 230 kB di JS (~71 kB gzipped). Per
ispezionare il bundle appena costruito, servito come in produzione:

```bash
npm run preview                    # serve web/dist/ su :4173
```

> ⚠️ **Il bundle congela `VITE_FS_API_URL`.** È una variabile di
> *compilazione*, non di runtime: cambiarla dopo il build non ha effetto,
> bisogna ricostruire. Se l'API sta su un'altra origine:
> `VITE_FS_API_URL=https://api.example.com npm run build`. Lasciandola
> vuota il client chiama la stessa origine da cui è stato servito, ed è il
> caso normale in produzione (nginx inoltra `/fs` all'API).

### Immagini Docker

```bash
docker build -t piercommander-api ./backend
docker build -t piercommander-web ./web
# oppure entrambe, dalla composizione:
docker compose -f deploy/docker-compose.yml build
```

---

## Esecuzione

### In sviluppo — due processi

Servono **due terminali**: il backend non serve il frontend, e il dev
server di Vite non esegue Python.

**Terminale 1 — FilesystemApi**

```bash
cd backend
source .venv/bin/activate
FS_ROOT=~/piercommander-sandbox uvicorn app:api --reload
```

- ascolta su `http://127.0.0.1:8000`;
- `--reload` riavvia a ogni salvataggio sotto `backend/`;
- `FS_ROOT` è la cartella (creata se non esiste) che PierCommander gestisce;
- la documentazione interattiva è su <http://localhost:8000/docs>.

Porta diversa, o raggiungibile da un altro dispositivo in rete:

```bash
uvicorn app:api --reload --host 0.0.0.0 --port 9000
```

Se cambi la porta dell'API, cambia anche il proxy in `web/vite.config.ts`,
altrimenti il frontend continua a bussare a 8000.

**Terminale 2 — PierCommanderWeb**

```bash
cd web
npm start                          # alias di `npm run dev`
```

- apre su `http://localhost:5173`, con hot module replacement;
- le chiamate a `/fs` vengono inoltrate a `http://127.0.0.1:8000` dal proxy
  configurato in `vite.config.ts` — per questo il browser non vede CORS;
- porta diversa o accesso dalla rete locale: `npm start -- --port 3000 --host`.

> Il modello dichiara `port: 4200` per questo container, ma
> `vite.config.ts` non fissa la porta e Vite usa la sua default (5173).
> Una delle due va allineata all'altra.

**Terminale 3, opzionale — i test in watch**

```bash
cd web && npm run test:watch
```

### In locale, ma come in produzione — Docker Compose

Un solo comando, niente Python e niente Node sulla macchina:

```bash
cp deploy/.env.example deploy/.env      # scegli FS_HOST_ROOT
docker compose -f deploy/docker-compose.yml up --build -d
```

- UI su <http://localhost:8080> (cambia `WEB_PORT` in `deploy/.env`);
- l'API **non** è esposta all'esterno: ci si arriva solo attraverso nginx,
  su `/fs` — è di proposito;
- `FS_HOST_ROOT` è la cartella dell'host montata su `/data` nel container.

Comandi di servizio:

```bash
docker compose -f deploy/docker-compose.yml logs -f       # i log dei due servizi
docker compose -f deploy/docker-compose.yml ps            # stato e healthcheck
docker compose -f deploy/docker-compose.yml restart api   # riavvia un servizio
docker compose -f deploy/docker-compose.yml down          # ferma tutto
docker compose -f deploy/docker-compose.yml down -v       # ferma e cancella i volumi
```

Per eseguire le immagini **già pubblicate** invece di costruirle:

```bash
IMAGE_TAG=v1.0.0 docker compose -f deploy/docker-compose.yml up -d
```

### Il bundle di produzione senza Docker

```bash
cd web && npm run build && npm run preview     # :4173, ma senza proxy verso l'API
```

`vite preview` non applica il proxy del dev server: serve solo a ispezionare
il bundle. Per un frontend di produzione che parla davvero con l'API usa
l'immagine Docker, dove il proxy lo fa nginx.

### Prima esecuzione: cosa aspettarsi

Con una `FS_ROOT` vuota i due pannelli sono vuoti — è corretto, non è un
errore. Crea una cartella dal pannello attivo, oppure metti qualche file
dentro `FS_ROOT` e ricarica.

### Se qualcosa non parte

| Sintomo | Causa quasi sempre |
|---|---|
| `502 Bad Gateway` su `/fs` sotto Docker | l'API sta ancora avviandosi: `docker compose ps` finché `api` è `healthy` |
| I pannelli restano vuoti e la console mostra errori su `/fs` | il backend non è in esecuzione, o è su una porta diversa da quella del proxy |
| `ModuleNotFoundError: No module named 'src'` | `uvicorn` lanciato fuori da `backend/`: il comando va dato da lì |
| `address already in use` da uvicorn | la 8000 è occupata: `lsof -i :8000`, poi `--port` diverso |
| La UI risponde su una porta che non avevi chiesto | Vite non fallisce se la porta è occupata: scivola sulla successiva e la stampa a video — leggi la riga `Local:` |
| `npm ci` fallisce su versioni | Node troppo vecchio: serve ≥ 20 |
| Il frontend chiama l'origine sbagliata dopo il build | `VITE_FS_API_URL` è compile-time: ricostruisci |

---

## Architettura

```
                    ┌──────────────────────────────┐
   Utente  ────────▶│  PierCommanderWeb            │   web-application
                    │  React SPA a due pannelli    │   :5173 dev · :80 prod
                    └──────────────┬───────────────┘
                                   │  HTTPS/JSON  (/fs)
                    ┌──────────────▼───────────────┐
                    │  FilesystemApi               │   service
                    │  FastAPI, confinato a FS_ROOT│   :8000
                    └──────────────┬───────────────┘
                                   │
                            ┌──────▼──────┐
                            │  FS_ROOT    │  l'unico filesystem visibile
                            └─────────────┘
```

Il modello C4 completo vive in `codegen/model/` e si apre con l'estensione
CAIP (**C4 Modeler**). Due container, una sola regola di confine: *ogni*
percorso che entra nell'API viene risolto e verificato contro `FS_ROOT`, e
quello che cade fuori viene rifiutato (`§REQ:FLSY-OPRT-SXK-110`).

Le responsabilità sono separate così:

- `backend/src/filesystem.py` — il dominio: le operazioni e il confinamento;
- `backend/src/routes.py` — il trasporto HTTP, nient'altro;
- `web/src/api/` — il client HTTP (il `fetch` è iniettato, quindi testabile);
- `web/src/state/` — lo stato dei pannelli e i comandi;
- `web/src/components/` — i pannelli e i dialog.

---

## Sviluppo

| Comando | Cosa fa |
|---|---|
| `cd backend && uvicorn app:api --reload` | API in hot reload su :8000 |
| `cd backend && python -m pytest` | la suite del backend |
| `cd backend && python -m compileall -q src` | il *build* dichiarato dal modello |
| `cd web && npm start` | Vite dev server su :5173, `/fs` in proxy |
| `cd web && npm test` | Vitest (una sola passata) |
| `cd web && npm run test:watch` | Vitest in watch |
| `cd web && npm run lint` | oxlint |
| `cd web && npm run build` | `tsc -b` + bundle di produzione in `dist/` |
| `python3 scripts/check_traceability.py` | la catena requisito ↔ codice ↔ test |

I comandi di build/test/run non sono convenzioni orali: sono dichiarati nel
modello (`targetProfile` di ogni container) ed è **quella** la fonte che CI
e strumenti leggono. Se cambi come si costruisce un container, aggiorna il
`targetProfile` con i tool del modeler, non solo la pipeline.

---

## Test e qualità

```bash
cd backend && python -m pytest -q          # 20 test
cd web && npx vitest run --coverage        # 41 test
```

I test del frontend girano su jsdom contro un doppio del backend
(`web/src/test/fakeBackend.ts`): niente rete, niente filesystem vero. I
test del backend usano una `FS_ROOT` temporanea iniettata via
`app.dependency_overrides`, quindi non toccano mai la macchina.

La qualità è sorvegliata da quattro cancelli, tutti in CI:

1. **pytest** sul backend;
2. **oxlint + tsc + vitest** sul frontend;
3. **tracciabilità** — nessuna citazione `§REQ:` orfana;
4. **immagini** — le due immagini si costruiscono e la coppia risponde davvero.

---

## Configurazione

### Backend

| Variabile | Default | Significato |
|---|---|---|
| `FS_ROOT` | `./data` | la radice consentita; tutto ciò che sta fuori è irraggiungibile |

### Frontend (compile-time, non runtime)

| Variabile | Default | Significato |
|---|---|---|
| `VITE_FS_API_URL` | `""` (stessa origine) | base URL dell'API |

Il bundle è statico: `VITE_FS_API_URL` viene **congelata al momento del
build**. In produzione lasciala vuota e lascia che nginx inoltri `/fs` al
container `api` (è quello che fa `web/nginx.conf`) — così il browser vede una
sola origine e non serve alcun CORS.

### Deploy (`deploy/.env`)

| Variabile | Default | Significato |
|---|---|---|
| `REGISTRY` | `ghcr.io` | registry delle immagini |
| `IMAGE_NAMESPACE` | `codearchitects/piercommander` | prefisso immagini |
| `IMAGE_TAG` | `latest` | tag da eseguire |
| `FS_HOST_ROOT` | `./data` | cartella dell'host gestita da PierCommander |
| `WEB_PORT` | `8080` | porta pubblica della UI |

---

## API

Tutti i percorsi sono **relativi a `FS_ROOT`**; `""` è la radice.

| Metodo | Endpoint | Cosa fa |
|---|---|---|
| `GET` | `/fs?path=<p>` | elenca il contenuto di una cartella |
| `GET` | `/fs/parent?path=<p>` | elenca la cartella superiore |
| `GET` | `/fs/content?path=<p>` | legge il contenuto di un file di testo |
| `POST` | `/fs/folders` | crea una cartella (`{path, name}`) |
| `PATCH` | `/fs` | rinomina un elemento (`{path, newName}`) |
| `DELETE` | `/fs?path=<p>` | cancella un file o una cartella |
| `POST` | `/fs/copy` | copia in un'altra cartella (`{sourcePath, destinationPath}`) |
| `POST` | `/fs/move` | sposta in un'altra cartella (stesso corpo) |

Con il backend in esecuzione, la documentazione interattiva generata da
FastAPI è su <http://localhost:8000/docs>.

---

## Docker

Due immagini, entrambe multi-stage e senza tooling di build nel runtime:

- `backend/Dockerfile` — venv costruita in un builder, runtime `python:3.12-slim`,
  utente non-root, `/data` come volume, healthcheck sull'endpoint di elenco;
- `web/Dockerfile` — bundle costruito con Node 22, servito da `nginx:1.27-alpine`
  con proxy `/fs` → `api:8000` e fallback SPA.

```bash
docker build -t piercommander-api ./backend
docker build -t piercommander-web ./web
docker compose -f deploy/docker-compose.yml up -d
```

> `deploy/docker-compose.yml` è l'artefatto di **deployment** e si modifica a
> mano. Non confonderlo con `.caep/docker-compose.yml`, che è **generato** dal
> modello C4 a ogni refresh: quello non va mai toccato a mano — si cambia il
> modello e il file segue.

---

## CI/CD

Quattro workflow in `.github/workflows/`:

### `ci.yml` — su ogni push e ogni PR

| Job | Contenuto |
|---|---|
| `backend` | install · `compileall` · `pytest` (+ report JUnit) |
| `web` | `npm ci` · oxlint · `tsc -b` · vitest con coverage · build (+ bundle come artifact) |
| `traceability` | `scripts/check_traceability.py` |
| `images` | costruisce le due immagini e fa girare la coppia: la UI risponde *e* l'API risponde attraverso il proxy |
| `ci` | il cancello unico da mettere come *required check* sul branch protetto |

### `release.yml` — su `main` e sui tag `v*.*.*`

Pubblica su GHCR `…-api` e `…-web` per `linux/amd64` **e** `linux/arm64`,
con provenance e SBOM. `main` produce il tag mobile `edge`; un tag git
produce la versione immutabile, `latest`, e una GitHub Release con le note
generate e le istruzioni di esecuzione.

### `deploy.yml` — su release pubblicata, o a mano

Copia `deploy/docker-compose.yml` e `deploy/remote-up.sh` sull'host, scrive
il `.env`, fa `docker compose pull && up -d` e **verifica che l'applicazione
risponda** prima di dichiarare il deploy riuscito. Se i secret non ci sono,
fallisce subito dicendo quali mancano, invece di rompersi a metà.

### `codeql.yml` — push, PR e ogni lunedì

Analisi statica di sicurezza su Python e TypeScript.

In più, `dependabot.yml` tiene aggiornati pip, npm, GitHub Actions e le
immagini base, raggruppando il toolchain di test in una sola PR.

---

## Deployment

### 1. Il repository

Il repository pubblico di riferimento è
`github.com/codearchitects/PierCommander`. Una volta creato:

```bash
git remote add origin https://github.com/codearchitects/PierCommander.git
git push -u origin main
```

Il primo push su `main` fa partire CI e `release.yml`, che pubblica
`ghcr.io/codearchitects/piercommander-api:edge` e `…-web:edge`.

Da configurare sul repository:

- **Branch protection** su `main` con il check richiesto `CI gate`;
- **Packages**: le immagini GHCR nascono private — rendile pubbliche dalle
  impostazioni del package se il deploy deve tirarle senza credenziali;
- la licenza è già nel repo (`LICENSE`, MIT): GitHub la riconosce da sola e
  la mostra accanto al nome del progetto, non serve configurare nulla.

### 2. L'ambiente `production`

In *Settings → Environments → production*:

| Tipo | Nome | Esempio |
|---|---|---|
| secret | `DEPLOY_HOST` | `piercommander.example.com` |
| secret | `DEPLOY_USER` | `deploy` |
| secret | `DEPLOY_SSH_KEY` | la chiave privata (PEM completo) |
| secret | `DEPLOY_PORT` *(opz.)* | `22` |
| secret | `GHCR_PULL_TOKEN` *(opz.)* | PAT `read:packages`, solo se le immagini restano private |
| variable | `DEPLOY_PATH` | `/opt/piercommander` |
| variable | `FS_HOST_ROOT` | `/srv/piercommander/data` |
| variable | `WEB_PORT` | `8080` |
| variable | `PUBLIC_URL` | `https://piercommander.example.com` |

Sull'host serve solo Docker con il plugin Compose, e l'utente `deploy` nel
gruppo `docker`.

### 3. Rilasciare

```bash
git tag v1.0.0 && git push origin v1.0.0
```

`release.yml` pubblica le immagini e la Release; `deploy.yml` parte sulla
release e porta quel tag in produzione. Per rimettere in linea una versione
precedente: *Actions → Deploy → Run workflow* con il tag voluto.

### Dove PierCommander **non** va messo

L'API espone operazioni distruttive sul filesystem e **non ha
autenticazione**: il confinamento a `FS_ROOT` è una barriera di percorso, non
un controllo d'accesso. Esponilo su Internet solo dietro un reverse proxy che
autentica, e monta una `FS_HOST_ROOT` dedicata.

---

## Requisiti e tracciabilità

Le funzionalità nascono come requisiti Gherkin in
`codegen/model/requirements/`, e ogni scenario ha un id (`@id(...)`) che il
codice e i test citano con il marcatore `§REQ:<id>`:

```python
# §REQ:FLSY-OPRT-SXK-110 ogni percorso viene risolto e confinato a FS_ROOT
```

Così la catena *requisito → codice → test* è percorribile in entrambe le
direzioni, e `scripts/check_traceability.py` la verifica:

```bash
python3 scripts/check_traceability.py            # fallisce sulle citazioni orfane
python3 scripts/check_traceability.py --strict   # fallisce anche sui requisiti non implementati
```

Stato al momento della scrittura: **21 requisiti su 21** implementati e
coperti da test — anche `--strict` passa. Il job di CI resta però in
modalità normale, quella che segnala senza bloccare: un requisito può
legittimamente essere scritto prima del codice che lo soddisfa, ed è così
che si lavora qui. Per rendere la copertura completa un vincolo di merge,
aggiungi `--strict` al comando nel job `traceability` di `ci.yml`.

Lo script ignora i mirror generati accanto ai `.feature` (`*.ai.log.yaml`,
`*.gherkin.yaml`, `*.changes.log.yaml`): lì gli id compaiono in prosa, ed è
narrazione, non una citazione.

La mappa completa requisito → codice → test, generata dalle citazioni
reali, è in [`docs/traceability.md`](docs/traceability.md); i requisiti
commentati uno per uno in [`docs/requirements.md`](docs/requirements.md).

Le regole complete (come si conia un id, chi cita chi) stanno in
`.claude/rules/` e valgono per chiunque lavori qui, umano o agente.

---

## Struttura del repository

```
PierCommander/
├── backend/              FilesystemApi — FastAPI
│   ├── app.py            entrypoint ASGI (uvicorn app:api)
│   ├── src/              config · filesystem (dominio) · routes (HTTP)
│   ├── tests/            pytest
│   └── Dockerfile
├── web/                  PierCommanderWeb — React SPA
│   ├── src/api/          client HTTP, fetch iniettato
│   ├── src/state/        stato dei pannelli e comandi
│   ├── src/components/   pannelli e dialog
│   ├── src/app/          composizione e test di comportamento
│   ├── nginx.conf        serve la SPA e inoltra /fs
│   └── Dockerfile
├── codegen/model/        modello C4 + requisiti Gherkin
├── docs/                 C4, requisiti e tracciabilità (diagrammi Mermaid)
├── deploy/               compose di deployment, .env.example, remote-up.sh
├── scripts/              check_traceability.py
├── LICENSE               MIT
├── .github/workflows/    ci · release · deploy · codeql
└── .caep/                stato degli strumenti CAIP (generato)
```

---

## Licenza

PierCommander è rilasciato sotto **licenza MIT** — il testo completo è in
[`LICENSE`](LICENSE).

È la licenza open source più permissiva in circolazione. In pratica:

| Puoi | Devi | Non hai |
|---|---|---|
| usarlo, anche in azienda e a scopo commerciale | conservare l'avviso di copyright e il testo della licenza nelle copie | nessuna garanzia: il software è fornito "così com'è" |
| modificarlo e ridistribuirlo, anche modificato | | nessuna responsabilità in capo agli autori |
| includerlo in un prodotto chiuso, senza pubblicare le tue modifiche | | |
| rilicenziarlo, anche con licenza diversa | | |

Non c'è copyleft: non sei obbligato a tenere aperto ciò che costruisci
sopra PierCommander, e non devi chiedere permesso a nessuno. L'unico
vincolo reale è l'attribuzione.

Il metadato viaggia con il codice: `backend/pyproject.toml` e
`web/package.json` dichiarano `MIT`, e le due immagini Docker portano
l'etichetta OCI `org.opencontainers.image.licenses=MIT`. Chi riceve solo
un artefatto, senza il repo, sa comunque sotto quali termini l'ha ricevuto.

> Una nota onesta: MIT **non** concede esplicitamente diritti di brevetto.
> Se Code Architects preferisce una garanzia esplicita anche su quel
> fronte, l'alternativa altrettanto libera e approvata OSI è Apache-2.0 —
> stessi permessi, in più la concessione di brevetto e la richiesta di
> segnalare le modifiche. Si cambia sostituendo `LICENSE` e i tre metadati.

Le dipendenze di terze parti restano sotto le proprie licenze. Quelle che
finiscono davvero nell'artefatto distribuito sono poche e tutte permissive:

| Dipendenza | Licenza |
|---|---|
| FastAPI, pydantic | MIT |
| uvicorn, starlette | BSD-3-Clause |
| react, react-dom, scheduler | MIT |

Il toolchain di build non viene ridistribuito, ma per completezza: Vite,
Vitest e oxlint sono MIT, TypeScript è Apache-2.0. Nessuna licenza
copyleft in tutta la catena, quindi niente vincola a riaprire il codice
di chi costruisce sopra PierCommander.

---

## Contribuire

1. Parti da un requisito: se il comportamento non è scritto in un `.feature`,
   scrivilo prima — è lì che si discute *cosa* deve succedere.
2. Prima il test che fallisce, poi il codice che lo fa passare.
3. Cita l'id: `§REQ:<id>` nel codice che lo soddisfa e nel test che lo verifica.
4. `python3 scripts/check_traceability.py` e i test dei due lane devono essere
   verdi prima di aprire la PR; il resto lo dice `CI gate`.
