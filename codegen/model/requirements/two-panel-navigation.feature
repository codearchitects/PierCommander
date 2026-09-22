# Norton-Commander-style two-panel browser UI for navigating and acting on the filesystem.
# Qui ci metto l'interfaccia a due pannelli in stile Norton Commander per navigare e lavorare sui file.
@c4-id:f6f303a3-7b2f-9935-2132-54e040412e5f
Feature: Navigazione a due pannelli

  As a utente di PierCommander
  I want navigare ed eseguire i comandi essenziali sul filesystem tramite un'interfaccia a due pannelli in stile Norton Commander
  So that posso orientarmi rapidamente tra due posizioni del filesystem e agire su file e cartelle senza lasciare il browser

  # Loading the page shows two independent panels, each with its own current folder.
  # Qui mostro i due pannelli all'apertura.
  @id(TWO-PNL-NVGT-OOX-010) @functional @c4-container
  Scenario: Visualizzazione del filesystem in due pannelli indipendenti
    Given l'utente apre PierCommander nel browser
    When la pagina viene caricata
    Then vengono mostrati due pannelli, ciascuno con il contenuto di una propria cartella corrente

  # Selecting a panel makes it the active target for subsequent commands.
  # Qui seleziono quale pannello e' attivo.
  @id(TWO-PNL-NVGT-OOX-020) @functional @c4-container
  Scenario: Selezione del pannello attivo
    Given due pannelli visibili con contenuti diversi
    When l'utente seleziona uno dei due pannelli
    Then quel pannello diventa il pannello attivo su cui agiscono i comandi successivi

  # Opening a subfolder in the active panel updates that panel's contents.
  # Qui apro una sottocartella nel pannello attivo.
  @id(TWO-PNL-NVGT-OOX-030) @functional @c4-container
  Scenario: Apertura di una sottocartella dal pannello attivo
    Given il pannello attivo mostra una cartella contenente una sottocartella
    When l'utente apre quella sottocartella nel pannello attivo
    Then il pannello attivo mostra il contenuto della sottocartella

  # Copying a selected item sends it to the folder shown in the other panel.
  # Qui copio verso l'altro pannello.
  @id(TWO-PNL-NVGT-OOX-040) @functional @c4-container
  Scenario: Copia di un elemento selezionato verso l'altro pannello
    Given un elemento selezionato nel pannello attivo e una cartella mostrata nell'altro pannello
    When l'utente avvia il comando di copia
    Then l'elemento viene copiato nella cartella mostrata nell'altro pannello
    And il pannello di destinazione aggiorna il proprio contenuto

  # Moving a selected item relocates it to the folder shown in the other panel.
  # Qui sposto verso l'altro pannello.
  @id(TWO-PNL-NVGT-OOX-050) @functional @c4-container
  Scenario: Spostamento di un elemento selezionato verso l'altro pannello
    Given un elemento selezionato nel pannello attivo e una cartella mostrata nell'altro pannello
    When l'utente avvia il comando di spostamento
    Then l'elemento viene spostato nella cartella mostrata nell'altro pannello
    And il pannello di origine aggiorna il proprio contenuto

  # Deleting a selected item requires explicit confirmation before it is removed.
  # Qui cancello ma solo dopo conferma.
  @id(TWO-PNL-NVGT-OOX-060) @functional @c4-container
  Scenario: Cancellazione di un elemento selezionato con richiesta di conferma
    Given un elemento selezionato nel pannello attivo
    When l'utente avvia il comando di cancellazione
    Then viene richiesta una conferma esplicita prima di procedere

  # Creating a folder from the active panel adds it to that panel's listing.
  # Qui creo una cartella dal pannello attivo.
  @id(TWO-PNL-NVGT-OOX-070) @functional @c4-container
  Scenario: Creazione di una nuova cartella dal pannello attivo
    Given il pannello attivo mostra una cartella
    When l'utente avvia il comando di creazione cartella e indica un nome
    Then la nuova cartella compare nel pannello attivo

  # Renaming a selected item updates its name in the active panel.
  # Qui rinomino un elemento selezionato.
  @id(TWO-PNL-NVGT-OOX-080) @functional @c4-container
  Scenario: Rinomina di un elemento selezionato
    Given un elemento selezionato nel pannello attivo
    When l'utente avvia il comando di rinomina e indica un nuovo nome
    Then l'elemento compare con il nuovo nome nel pannello attivo

  # Previewing a selected text file shows its textual content to the user.
  # Qui vedo l'anteprima di un file di testo.
  @id(TWO-PNL-NVGT-OOX-090) @functional @c4-container
  Scenario: Anteprima del contenuto di un file di testo selezionato
    Given un file di testo selezionato nel pannello attivo
    When l'utente avvia il comando di visualizzazione
    Then il contenuto testuale del file viene mostrato all'utente

  # Keyboard shortcuts trigger the essential commands without requiring the mouse.
  # Qui uso le scorciatoie da tastiera per i comandi essenziali.
  @id(TWO-PNL-NVGT-OOX-100) @non-functional @c4-container
  Scenario: Esecuzione dei comandi essenziali da tastiera
    Given un elemento selezionato in uno dei due pannelli
    When l'utente utilizza le scorciatoie da tastiera per copia, spostamento, cancellazione, rinomina o creazione cartella
    Then il comando corrispondente viene avviato senza richiedere l'uso del mouse
