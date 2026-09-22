# Essential filesystem operations exposed by the Python backend: list, navigate, create, rename, delete, copy, move and view.
# Qui ci metto le operazioni di base sul filesystem che il backend Python deve esporre.
@c4-id:be4cea64-db47-3743-5ba1-7607b9085693
Feature: Operazioni essenziali sul filesystem

  As a utente di PierCommander
  I want poter elencare, navigare, creare, rinominare, copiare, spostare, cancellare e visualizzare file e cartelle tramite API
  So that posso gestire il mio filesystem da browser come farei con un file manager desktop

  # Listing a folder's contents returns name, type, size and last-modified date for each entry.
  # Qui elenco cosa c'e' dentro una cartella.
  @id(FLSY-OPRT-SXK-010) @functional @c4-container
  Scenario: Elenco del contenuto di una cartella
    Given una cartella del filesystem contenente file e sottocartelle
    When l'utente richiede l'elenco del contenuto di quella cartella
    Then l'API restituisce nome, tipo, dimensione e data di ultima modifica di ogni elemento contenuto

  # Entering a subfolder makes it the current position and returns its contents.
  # Qui entro in una sottocartella.
  @id(FLSY-OPRT-SXK-020) @functional @c4-container
  Scenario: Navigazione in una sottocartella
    Given una cartella contenente una sottocartella
    When l'utente richiede di entrare nella sottocartella
    Then l'API restituisce il contenuto della sottocartella come nuova posizione corrente

  # Going up returns to the parent folder as the new current position.
  # Qui risalgo alla cartella superiore.
  @id(FLSY-OPRT-SXK-030) @functional @c4-container
  Scenario: Navigazione alla cartella superiore
    Given l'utente si trova in una cartella diversa dalla radice del filesystem consentito
    When l'utente richiede di risalire alla cartella superiore
    Then l'API restituisce il contenuto della cartella superiore come nuova posizione corrente

  # Creating a folder with a free name adds it under the target folder.
  # Qui creo una nuova cartella.
  @id(FLSY-OPRT-SXK-040) @functional @c4-container
  Scenario: Creazione di una nuova cartella
    Given una cartella del filesystem e un nome non ancora esistente al suo interno
    When l'utente richiede la creazione di una nuova cartella con quel nome
    Then la nuova cartella viene creata all'interno della cartella indicata
    And la nuova cartella compare nel successivo elenco del contenuto

  # Creating a folder whose name already exists is rejected and nothing changes.
  # Qui blocco la creazione se il nome esiste gia'.
  @id(FLSY-OPRT-SXK-050) @functional @c4-container
  Scenario: Rifiuto della creazione di una cartella con nome già esistente
    Given una cartella contenente già un elemento con un certo nome
    When l'utente richiede la creazione di una nuova cartella con lo stesso nome
    Then l'API rifiuta l'operazione
    And il contenuto della cartella resta invariato

  # Renaming a file or folder makes it accessible only under the new name.
  # Qui rinomino un file o una cartella.
  @id(FLSY-OPRT-SXK-060) @functional @c4-container
  Scenario: Rinomina di un file o di una cartella
    Given un file o una cartella esistente e un nuovo nome non in conflitto
    When l'utente richiede di rinominare l'elemento con il nuovo nome
    Then l'elemento risulta accessibile con il nuovo nome
    And non è più accessibile con il nome precedente

  # Deleting a file or folder removes it from its containing folder's listing.
  # Qui cancello un file o una cartella.
  @id(FLSY-OPRT-SXK-070) @functional @c4-container
  Scenario: Cancellazione di un file o di una cartella
    Given un file o una cartella esistente
    When l'utente richiede la cancellazione dell'elemento
    Then l'elemento non compare più nel contenuto della cartella che lo conteneva

  # Copying a file or folder duplicates it into the destination while leaving the source unchanged.
  # Qui copio un file o una cartella altrove.
  @id(FLSY-OPRT-SXK-080) @functional @c4-container
  Scenario: Copia di un file o di una cartella in un'altra posizione
    Given un file o una cartella esistente e una cartella di destinazione diversa da quella di origine
    When l'utente richiede la copia dell'elemento nella cartella di destinazione
    Then l'elemento compare anche nella cartella di destinazione
    And l'elemento originale resta invariato nella cartella di origine

  # Moving a file or folder relocates it to the destination and removes it from the source.
  # Qui sposto un file o una cartella altrove.
  @id(FLSY-OPRT-SXK-090) @functional @c4-container
  Scenario: Spostamento di un file o di una cartella in un'altra posizione
    Given un file o una cartella esistente e una cartella di destinazione diversa da quella di origine
    When l'utente richiede lo spostamento dell'elemento nella cartella di destinazione
    Then l'elemento compare nella cartella di destinazione
    And l'elemento non compare più nella cartella di origine

  # Viewing a text file returns its textual content.
  # Qui visualizzo il contenuto di un file di testo.
  @id(FLSY-OPRT-SXK-100) @functional @c4-container
  Scenario: Visualizzazione del contenuto testuale di un file
    Given un file di testo esistente nel filesystem
    When l'utente richiede la visualizzazione del contenuto del file
    Then l'API restituisce il contenuto testuale del file

  # Operations outside the user's configured filesystem root are rejected.
  # Qui mi assicuro che non si esca dalla radice consentita.
  @id(FLSY-OPRT-SXK-110) @non-functional @c4-container
  Scenario: Le operazioni sul filesystem restano confinate alla radice consentita
    Given una radice del filesystem configurata per l'utente
    When l'utente richiede un'operazione su un percorso esterno a quella radice
    Then l'API rifiuta l'operazione
