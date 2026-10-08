# neXaro Pilot — Verifizierte Auftragsausführung

**Version:** Backend `execution-engine v19` · Weboberfläche `LUMEN 2026.10.08.20`
**Roadmap-Funktion:** `verified_autonomous_goal_execution` · P0 / Alpha bis zum authentifizierten Ende-zu-Ende-Test
**Leitgedanke:** Pilot liefert reale, überprüfbare Artefakte und arbeitet unter klaren Freigabegrenzen bis zum Ergebnis.

## Zustandslogik

1. **Start:** Ein angemeldeter Nutzer tippt auf „Nächsten Schritt ausführen“. Nur Aktionen aus seinem Ziel sind ausführbar. Vor Ausführung laufen die bestehenden Sicherheitsprüfungen.
2. **Ergebnis:** `execution-engine` startet die Arbeitskette, nutzt Zielgedächtnis, optional überprüfbare Recherche, GPT/Claude-Synthese, erstellt `results` und einen `verification_records`-Eintrag.
3. **Qualitätsgrenze:** Kein fertiges Ergebnis ohne bestandenen Quality Gate. Bei fehlender Quellenprüfung oder Risikobedenken wird der Lauf angehalten.
4. **Gemeinsame Entscheidungen:** `owner_type=joint|user` bzw. `recommended_mode=together` produziert einen überprüften Entwurf mit `review_kind=collaboration`. Status `review_required`, kein vorzeitiges Erledigt und kein bestätigter Gedächtniseintrag.
5. **Freigabe:** Der Nutzer sieht die vorgeschlagene Lösung, kann sie vollständig im Ergebnisbereich einsehen und bestätigt sie. `operation=confirm` prüft Authentifizierung, Zielzugehörigkeit, Risikoklasse `low` und bestandene Verifizierung. Nur dann wird Fortschritt gespeichert, das Ergebnis `final` und der Gedächtniseintrag verifiziert.
6. **Folgeautonomie:** Nach erfolgreichem Abschluss ruft die Oberfläche `operation=next` sequenziell auf. Der Server erlaubt ausschließlich `status=ready`, `owner_type=pilot`, `recommended_mode=do_it` und `blocking=false`. Die Benutzeroberfläche begrenzt die Sitzung auf **drei** weitere Schritte.
7. **Kontrollierter Stopp:** Nutzer kann „Nach diesem Schritt stoppen“ auslösen. Der aktuelle Auftrag wird sicher beendet; es wird kein neuer Auftrag begonnen.
8. **Ausschlüsse:** Gemeinsame Entscheidungen, fehlende Verifizierung, `review_required`, `waiting_approval`, `blocked`, `running` und nicht aktive Ziele werden nicht automatisch übergangen. Externe Schreibaktionen brauchen gesonderte Freigabe/Integration. `operation=confirm` kann keine risikoreiche externe Aktion freigeben.
9. **Wirkungsmessung:** Arbeitsschritt abgeschlossen bedeutet **nicht** Unternehmensziel erreicht. Die bestehende Erfolgsampel basiert weiter auf belegten Outcomes statt bloß generierten Texten.

## Datenschutz und Zuverlässigkeit

- Authentifizierte Eigentümerschaft für Status, Ausführung und Bestätigung serverseitig kontrollieren; bestehende RLS gelten weiter.
- Qualitätseinstufung `ready` nur nach Qualitätstest, menschlicher Entscheidung keine automatisierte Vermutung unterstellen.
- Retrys der Bestätigung prüfen bereits abgeschlossene Aktionszustände, ohne einen zusätzlichen progress-engine-Aufruf zu erzeugen.
- Keine autonome Wiederholung von Qualitätsfehlern oder risikoreichen Aktionen.
- Native Pilot-Flugfunktion v5 bleibt vom Start bis zum nächsten bedienbaren Button erhalten; sie dient der Prozessvisualisierung und nicht als Ersatz für echten Verarbeitungsstatus.
- Recherchen zu Versicherung, Fachkunde, Qualifikationsnachweis, Budget/Kapitalbedarf, Preisen und Markt werden nach Backend v19 explizit als **quellenpflichtige Recherche** klassifiziert.

## Abnahme und Grenzen

Bereits simuliert: Start-/Review-/Stop-Zustände in Zentrale und Ausführung, drei erfolgreiche Folgeaktionen, Unterbrechung bei Nutzerentscheidung, Qualitätsschranke, externe Freigabe, Ende der Aufgabenliste und manueller Stopp. Edge-Funktion v19 aktiv und JWT-geschützt.

**Noch offen und nicht als erledigt behaupten:** Ein echter Ausführungslauf mit dem angemeldeten Pilot-Konto (erstes Ergebnis), die Bestätigung mit verifiziertem `goal_memories`- und Fortschrittseintrag sowie die tatsächlich ausgeführte sichere Folgeaktion. Ohne Zugriff auf die authentifizierte Sitzung wird kein Nutzerkonto impersoniert und kein Live-Ergebnis vorgetäuscht.

**Releaseprinzip:** Sobald alle Pflichtverifikationen live bestanden und gespeichert sind, darf die Roadmap-Funktion auf Grün (`ready`) wechseln. Neue autonome Fähigkeiten müssen immer die gleichen Sicherheits- und Qualitätsgrenzen erfüllen.


## Live-Debugging 2026-10-08 – korrektives Release LUMEN .22

- **09:22:** Recherche-Gateway verwendete undefinierte `base`-Variable → HTTP 500 statt JSON; interne Fehlermeldung erschien auf dem iPhone. Recherche-Gateway v13, Recherche-Intelligenz v11 und Ausführungs-Engine v20 haben Fehlerbehandlung und sichere Rückgaben erhalten.
- **09:27:** Zweiter Live-Test ergab `no_usable_sources`: Der gesamte Text aus Aktionstitel plus einer fachlich **unpassenden** Objective-Notiz wurde als lange Suchanfrage verwendet. Backend korrekt angehalten, kein fertiges Resultat erzeugt.
- **Quellensuche:** `research-gateway v16` verwendet kurze thematische Abfragen, Wikipedia REST mit Action-API-Rückfall, topic-diverse Source-Scoring und als letzte Option eine unabhängige Websuche. Letztere akzeptiert ausschließlich tatsächlich abrufbare öffentliche Seiten erlaubter vertrauenswürdiger Domains, nie frei erfundene URLs oder KI-Ausgabepassagen als Beleg. Fällt die Beschaffung aus, bleibt die Qualitätsprüfung gesperrt.
- **Planungsfehler:** `pilot-intelligence v30` überschrieb im ersten Geschäftsschritt den Aktionstitel mit einem generischen First-Action-Namen, obwohl Ziel und Meilenstein eine andere Arbeitsphase beschrieben. **Ab v31** wird bei inhaltlich abweichendem First-Action-Titel ein eigener Fundament-Schritt mit passendem Meilenstein erstellt, alle ursprünglichen Phasen bleiben getrennt erhalten.
- **Bestehender Pilot-Testauftrag:** Die eigene Aufgabe „Zielgruppe und konkreten Kundennutzen in einem Satz festlegen“ wurde mit passendem Ziel, Meilenstein und `ready`-Status angelegt. Die ursprüngliche Rechtsform-/Anmeldungsprüfung wurde auf ihren tatsächlichen Titel korrigiert und bleibt `pending`. Es gibt jetzt sieben statt sechs fachlich unterscheidbare Aktionen. Kein ursprünglicher Meilenstein ging verloren.
- **KI-Stabilität:** `best-of-ai v14` verarbeitet nicht-jsonförmige Modell-Gateway-Antworten kontrolliert und verlangt die erforderlichen Ergebnisfelder.
- **Frontend:** `LUMEN 2026.10.08.22` zeigt nur Fehler der *aktuell auszuführenden* Aktion als Retry-Hinweis und vermeidet, dass alte Fehlversuche den Status des gesamten Unternehmensziels als „fehlgeschlagen“ anzeigen.
- **Verifikation:** Produktionsfunktionen sind installiert und Code/DB-Konsistenz geprüft. Erneuter authentifizierter iPhone-Live-Test ist **noch offen**. Der Entwicklungsblock darf erst nach einer real gespeicherten und bestätigten Lieferung grün werden.


## Direkte Bearbeitung & Freigabe – LUMEN 2026.10.08.23 / execution-engine v22

Verbindliche UX-/Backend-Regel: Bei **gemeinsamen Entscheidungen** muss Pilot die entscheidungsrelevante Information in *verständlichem, direkt bearbeitbarem Text* anbieten. Keine langen Markdown-Exzerpte, kein zusätzlicher „Vollständiges Ergebnis ansehen“-Pfad als Pflichtschritt.

- **UI:** Vorschlag als übersichtlicher Klartext im editierbaren Textfeld (mobile Safari, Schriftgröße mindestens 16px für iOS), mit Zeichenanzeige und jederzeit sichtbarer Hauptaktion.
- **Kundensprache:** „So könnte dein Ergebnis aussehen. Du entscheidest ...“; Fachjargon und unerläuterte Annahmen zurücknehmen. Nicht bestätigte Fakten bleiben als Annahmen gekennzeichnet.
- **Aktionssprache:** `⚡ Entscheidung steht. Pilot übernimmt.` vermittelt klar, dass der Nutzer über das Ergebnis entscheidet und Pilot anschließend wieder arbeitet.
- **Echte Datenübergabe:** `operation=confirm` erhält den nutzerseitig editierten Text. Längenvalidierung 35–2500 Zeichen, explizites `approved:true`, Authentifizierung/Goal Ownership, Low-Risk- und Verified-Result-Grenze.
- **Sicherheitsgrenze:** Geänderte Inhalte müssen erneut durch das Safety Gate; Nutzeränderungen sind **nicht automatisch unabhängig fachlich verifiziert**, daher Ergebnis-Metadaten `verification_scope:original_ai_draft_only`, `edited_by_user`, `original_ai_content`, eindeutige user-decision. Keine falsche Faktensicherheit.
- **Persistenz:** Resultat und `goal_memories` speichern die letztendlich freigegebene Fassung; die originale KI-Fassung bleibt zur Historie/Prüfung erhalten. Danach Progress Engine und begrenzte Folgeautonomie.
- **Fehlerbehebung v22:** Ein ursprünglich bestandener KI-Quality-Gate wurde bei gemeinsamer Entscheidung fälschlich als `quality_status=failed` gespeichert. Künftig wird daraus `review_required`; die konkret bereits verifizierte Live-Entscheidung vom 2026-10-08 09:40 wurde anhand ihrer sechs bestandenen Prüfkriterien gezielt korrigiert, ohne neue Aussagen zu erfinden.
- **Abnahme:** Formular/Parser/Backend-Sicherheitszweig geprüft; tatsächliche Benutzerbearbeitung mit Freigabe und Zielgedächtnis-/Fortschrittskontrolle auf dem iPhone noch offen. Erst nach bestandenem Praxistest den Entwicklungsplan auf Grün setzen.


## LUMEN 2026.10.08.24 – iPhone-Fokusmodus für Entscheidungen

**Verbindliche Produktregel:** Bei einer Entscheidung bearbeitet der Nutzer einen verständlichen Vorschlag im vergrößerbaren, wirklich scrollbar bleibenden Editor. Eine lange unformatierte Textarea mit Überschriften im selben Fließtext ist nicht zulässig.

- Die Übersicht zeigt **echte HTML-Abschnittsüberschriften** (z. B. „Für wen arbeiten wir?“ / „Das versprechen wir unseren Kunden:“), darunter jeweils den bearbeitbaren Inhalt. So sind die Überschriften sichtbar und müssen nicht selbst mitbearbeitet werden.
- Das Antippen eines Vorschlagtextes öffnet die iOS-freundliche, modal vergrößerte Bearbeitung auf `document.body`, außerhalb der mit `transform` animierten LUMEN-Karten. Der Hintergrund bleibt stabil und verdeckt.
- Ein zentraler, *eigener Scroll-Container* übernimmt das vertikale Touch-Scrolling. Textfelder wachsen auf ihre tatsächliche Inhaltshöhe und verursachen **kein konkurrierendes Scrollen** auf iPhone.
- Die Ansicht richtet sich mit `visualViewport.height` und `visualViewport.offsetTop` an der sichtbaren Bildschirmhöhe bei geöffneter iPhone-Tastatur aus. Das Feld wird **synchron auf den Antipp-Gesture fokussiert**, nicht nach `requestAnimationFrame`, damit Safari die Tastatur zuverlässig öffnet.
- Der Bearbeitungsmodus zeigt eine feste, erreichbare Fußleiste mit `⚡ Entscheidung steht. Pilot übernimmt.` und dem Zeichenstand. Ein deutliches `✓ Fertig` schließt die Ansicht und bewahrt sämtliche Änderungen; Escape unterstützt Desktop.
- Alle Änderungen werden in einem gemeinsamen Draft gehalten; Rückkehr in die Übersicht, modale Bearbeitung oder regulärer Neu-Render verlieren den Text nicht. Ein generischer einteiliger Editor bleibt für andere Branchen / Aufgabentypen bestehen.
- **Backend unverändert gesichert:** `execution-engine` empfängt den endgültigen zusammengesetzten Text als `edited_content`; Besitzerprüfung, explizite Freigabe, Validierung/Safety-Gate und Speicherung in Zielgedächtnis und Ergebnis bleiben aktiv.
- Technisch kontrolliert: Quelltext- und Syntaxprüfung, Überschriftenaufteilung, Roundtrip, Bearbeitungs-Persistenz, Modal außerhalb der animierten Oberfläche, viewport-sensible Tastaturbehandlung und Freigabepayload. Die reale Scroll-/Keyboard-Abnahme auf einem iPhone muss separat bestanden werden, bevor der Teilblock grün wird.


## LUMEN 2026.10.08.25 – direkte Entscheidungsfläche ohne Vollbild-Editor

Die zuvor implementierte modale Editor-Ansicht (.24) wurde **auf ausdrücklichen Nutzerwunsch entfernt**. Die Entscheidung bleibt in einer **kompakten, selbst scrollbar bleibenden LUMEN-Signalfläche** in der Zentrale. Kein zweites Fenster und kein Zusatz-Editor mehr.

Zwei fachliche Titel („Für wen arbeiten wir?“ und „Das versprechen wir unseren Kunden“) sind als sichtbare Label hervorzuheben; darunter werden die beiden Inhalte direkt bearbeitet. Der Inhalt wird im Draft zustandsstabil zusammengeführt und vor der Übergabe serverseitig geprüft. Für sonstige Aufträge wird weiterhin eine einzelne Abschnittsfläche verwendet. Am iPhone bildet der gemeinsame Rahmen den einzigen vertikalen Scrollbereich; die Textflächen wachsen mit ihrem Inhalt.

**Futuristisches Produktgebot:** Transparente Lichtschichten, subtile Raster und Neon-Energie statt Formular- und Bürosoftware-Optik. Hauptaktion bleibt „⚡ Entscheidung steht. Pilot übernimmt.“. Backend-Autorisierung und Sicherheitsprüfung bleiben unverändert.

**Prüfung:** JS kompiliert; neun Struktur-/Text-/UI-Checks bestanden. Reale iPhone-Bedienung und echte Bestätigung stehen noch zur Abnahme aus.


## LUMEN 2026.10.08.26 – Laufzeitoptimierung & echter Verarbeitungsstatus

**Auslöser:** Zwei echte iPhone-Ausführungsläufe des Baumpflege-Qualifikationsschritts brauchten jeweils rund 90 Sekunden und endeten ohne verwertbares Ergebnis. Supabase erfasste eine Recherchephase von ca. 41 Sekunden und eine zweite KI-Phase von 52–55 Sekunden. Ursachen: aufeinander folgende doppelte Best-of-AI-Synthese, GPT-Antwort außerhalb JSON-Format und OpenAI-Rate-Limit beim Fallback (429).

**Änderungen:**

- `research-intelligence v12` mit `sources_only:true`: liefert **tatsächlich gefundene Quellen** samt Quellensicherheit ohne die unnötige zweite KI-Synthese. Das ist *keine eigenständige Prüfung juristischer Aussagen*. Bei fehlenden oder schwachen Quellen bleibt die Fachprüfung offen.
- `best-of-ai v17` unterstützt `fast_best`: zuerst eine Qualitätsvalidierung über Claude; OpenAI nur bei ungültigem/nicht verfügbarem Ergebnis als Fallback. Hochrisiko-`high_assurance` behält die Dualanbieter-Prüfung. Ein Fast-Modell darf nie unvollständige Pflichtfelder als Ergebnis liefern. Pro Aufruf gilt eine begrenzte Wartezeit.
- `ai-gateway v23`: interactive-Modus mit nur einem Anbieter-Versuch (der übergeordnete Best-of-AI-Prozess steuert Fallback); zeitlich begrenzte Anfragen, kompaktere Ausgabe und OpenAI-JSON-Format über die Responses API. Die Standard-/High-Assurance-Routen bleiben bestehen.
- `execution-engine v25`: verwendet `sources_only`, `fast_best` für normale Aufgaben, kompaktes Zielgedächtnis und maximal fünf echte Quellen mit gekürzten Auszügen. Bei quellenpflichtigen Aussagen wird eine tatsächliche Quellenkennung wie `[S1]` im Ergebnis verlangt; ohne diese Verknüpfung wird die Arbeit nicht als überprüft abgeschlossen. Fehlende Quellenbelege lösen bei Pilot-eigenen, risikoarmen Aufgaben keine unauflösbare manuelle Warteschleife aus, sondern einen erkennbaren Qualitätsfehler.
- `pilot/index.html` LUMEN .26: Aktive Schritte werden aus `execution_steps` des eingeloggten Arbeitsbereichs abgefragt und mit einer realen Phasenanzeige dargestellt (Recherche, Erstellung, Speicherung, Prüfung, Fortschritt). Keine erfundenen Prozentwerte, kein starrer „Pilot hebt ab“-Text über die gesamte Bearbeitung, Startbutton gegen mehrfachen Start geschützt.
- **Flug ≠ alle Folgeschritte:** Das Flugzeug landet nach der gerade abgeschlossenen Aktion. Ein begrenzter autonomer Folgearbeitslauf wird unabhängig davon fortgesetzt; seine Stufe bleibt sichtbar und ist nach dem aktuellen Schritt stoppbar. Damit überdehnt ein langer Auftrag nicht mehr die Flugdauer.
- **UI-Sprache:** Der bestehende Live-Auftrag wird als „Qualifikation & Versicherungsschutz bei Baumpflege prüfen“ angezeigt; die ausführliche fachliche Aufgabe bleibt im `objective` erhalten.

**Abnahme:** Source-Syntax, API-Versionen und unveränderte Besitzer-/Qualitäts-Schranken geprüft. `execution-engine` v25, `research-intelligence` v12, `best-of-ai` v17, `ai-gateway` v23 aktiv. **Noch kein neuer authentifizierter Test nach diesem Release.** Vorheriger zweiter Baumpflegeauftrag: zwei Fehlversuche, kein fertiges Resultat, Status `ready`. Keine Aussage über tatsächlich erreichte Ladezeiten oder Funktionsabnahme, bevor der nächste iPhone-Live-Lauf beobachtet ist.


### Ergänzung: korrektes Ziel- und Wissenskontext-Mapping (execution-engine v25)

Beim abschließenden Quellcodevergleich fiel eine inkonsistente Datenabbildung auf: Der schnelle Prompt-Adapter griff auf `memory_type` statt `type` und auf `summary`/`content` statt des gespeicherten `statement` aus `pilot_internal_knowledge` zu. Dies wurde vor dem Praxistest korrigiert: `goal_memories` und echte, quellengestützte Brancheninformationen werden nun als kurze lesbare Texte mit ihren Quellenverweisen übergeben. **Fachinformationen wurden nicht erfunden.** Auch dieser Fix ist bisher nur technisch, nicht auf dem iPhone end-to-end bestätigt.


### Live-Fix 2026-10-08, 10:22 – Backend-Modus und Schema kompatibel (best-of-ai v18)

Der Authentifizierte-Testlauf `d8127ae2-509e-488b-98f0-352e68e2134a` benötigte etwa 9,3 s und brach **nach** der Quellensuche mit `UPSTREAM_best-of-ai_500_consensus_create_failed` ab. Die Quelle war bereits in ca. 5 s gefunden, `source_count=2` und `evidence_gate=passed`. Eine neue KI-Artefakt-Erstellung war noch nicht gestartet.

**Root cause verifiziert:** `best-of-ai v17` verwendete `fast_best` sowohl für die Laufzeitsteuerung als auch im INSERT-Feld `public.ai_consensus_runs.mode`. Der vorhandene Datenbank-CHECK erlaubt dort nur `best` und `high_assurance`.

**Korrektur deployed:** In `best-of-ai v18` bleibt `fast_best` ein Laufzeitmodus; persistent wird `mode=best` gespeichert und `decision=fast_verified_<provider>` dokumentiert die tatsächlich genutzte schnelle Route. Hochrisiko-`high_assurance` ist unverändert. Interne Datenbankfehlermeldungen werden nicht mehr als Klartext an den Nutzer weitergereicht. SQL-Verifikation: `best` und `high_assurance` zulässig, `fast_best` nicht. Keine Schema-Aufweichung vorgenommen.

**Status:** V18 aktiv mit JWT, Datenbank-Constraint und Quellensuche geprüft. Die Live-Aktion „Qualifikation & Versicherungsschutz bei Baumpflege prüfen“ ist weiterhin `ready`, kein laufender Job und noch kein abgeschlossenes Ergebnis. Erneute **echte** Benutzerabnahme ist offen; keine unbelegte Erfolgsbehauptung.


### Live-Fix 2026-10-08, 10:27 – Modell-Kompatibilität und Timeout (LUMEN .29)

Der echte iPhone-Lauf `34849feb-abeb-40e1-8417-83fc972a79ef` (ca. 32 Sekunden, Status `failed`) bestätigte: Recherche war nach 3,7 s abgeschlossen und erfolgreich; Fehlercode `UPSTREAM_best-of-ai_503_MODEL_OUTPUT_NOT_READY` im `reason`-Schritt. In `ai_requests` schlugen Claude nach ca. 19 s (`signal aborted`) und OpenAI nach 0,4 s (`OPENAI_400`) fehl. Kein verifizierbares Ausführungsergebnis wurde gespeichert.

**Veröffentlichte Korrekturen:**
- `ai-gateway v24`: Die interaktive OpenAI-Arbeitsroute verwendet standardmäßig `gpt-4.1-mini` statt des bisherigen `gpt-6-sol`-Profils, verzichtet bei diesem kompatibleren Modell auf den `reasoning`-Parameter und fordert ausdrücklich ein JSON-Objekt an. Andere Routen bleiben beim bisherigen Modellprofil. Das Modell ist über `PILOT_INTERACTIVE_OPENAI_MODEL` konfigurierbar, ohne einen geheimen Schlüssel zu ändern.
- `ai-gateway v24`: Interaktive Claude-Aufrufe dürfen bis zu 32 Sekunden benötigen; Verarbeitungs- und Moderationschecks bleiben unverändert. Modellanbietercodes werden in Logs diagnostisch protokolliert, nicht als ungefilterte Fehlermeldung angezeigt.
- `best-of-ai v19`: Im schnellen `fast_best`-Modus wird zunächst die JSON-kompatible OpenAI-Route verwendet (23-Sekunden-Grenze), Claude folgt nur bei fehlendem/ungültigem Ergebnis (35-Sekunden-Grenze). Beide Pfade prüfen Pflichtfelder; `high_assurance` behält das strengere Dualmodell-Prinzip.
- `pilot/index.html` LUMEN .29: verständliche, getrennte Meldung bei nicht verfügbaren Modellantworten, unverändertes Zielgedächtnis, Flugfunktion und Ein-Klick-Sperre gegen doppelte Ausführung.

**Prüfstatus:** Alle acht Quellcode-/Konfigurationsprüfungen sowie JavaScript-Syntax bestanden, Edge-Funktionen aktiv mit JWT; tatsächliche Modellantwort und End-to-End-Artefakt auf iPhone **noch nicht geprüft**. Bestehende Aufgabe `ready`, keine parallele Ausführung, vier protokollierte Fehlversuche, null Ergebnisse. Der Block bleibt Alpha und darf erst nach erfolgreicher Live-Durchführung auf Grün.
