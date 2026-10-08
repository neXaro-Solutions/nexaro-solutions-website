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

### Diagnose 10:34 – OpenAI JSON-Ausgabemodus (Backend v25)

Beim erneuten iPhone-Test brach die Recherche **nicht** ab: zwei Quellen gefunden, ausreichender Evidence Gate. Die anschließende Generierung scheiterte mit `MODEL_OUTPUT_NOT_READY`. Der OpenAI-Log dokumentierte wörtlich: `Response input messages must contain the word 'json' in some form to use 'text.format' of type 'json_object'.` Claude scheiterte separat am Anbieter-Timeout. **Root Cause:** Die Systemanweisungen erwähnten JSON, die eigentliche Responses-API-Nutzernachricht enthielt diese Zeichenfolge aber nicht.

**Fix aktiv in `ai-gateway v25`:** Der Textkörper jeder normalen OpenAI-Anfrage mit `text.format=json_object` beginnt jetzt mit `JSON output required.` und enthält anschließend den ursprünglichen Aufgabeninhalt. Die Ausgabevalidierung, das Safety-Gate, die Zuordnung zum angemeldeten Benutzer sowie die Hochrisiko-Route bleiben unverändert. `best-of-ai v19` läuft mit OpenAI und bedingtem Claude-Fallback.

**Status:** Deployment und Prüfung des tatsächlich erzeugten Request-Bodys bestanden. Noch kein durchgeführter authentifizierter Provider-Retest nach v25, daher kein belegtes fertiges Ergebnis. Pilot-LUMEN-.29-Frontend ist unverändert kompatibel; der Qualitäts-/Performancepunkt bleibt Alpha.


## 2026-10-08 · 10:41 – Root Cause: OpenAI-Abrechnung und Claude-Latenz (LUMEN .30)

**Reale Produktionsdiagnose, verifiziert aus Edge-Logs:**
- Ausführung `8476349e-8102-44ba-9c35-eee794a42019` fehlgeschlagen: `UPSTREAM_best-of-ai_503_MODEL_OUTPUT_NOT_READY`.
- Die Quellenbeschaffung funktionierte erneut: drei gefunden, zwei für die Recherche ausgewählt, `RESEARCH_SOURCE_PACK` meldete `sufficient:true`. Das ist **keine** eigenständige fachliche Prüfung aller Aussagen.
- OpenAI `gpt-4.1-mini` gab eine eindeutige Account-Abrechnungsablehnung zurück: `429 Your account is not active, please check your billing details`. Diese Sperre kann nicht durch neue Prompt-Parameter oder erneute Requests repariert werden.
- Claude Sonnet 4.6 überschritt wiederum das Limit (`PROVIDER_TIMEOUT`). Es gab kein abgeschlossenes KI-Arbeitsartefakt.

**Technisch implementiert:**
- `best-of-ai v20`: Vor schnellem Routine-KI-Lauf die letzten 90 Minuten nach gespeicherten OpenAI-429-/Billing-Sperren des **gleichen Workspaces** abfragen; bei Sperre OpenAI nicht erneut belasten. Claude zuerst, OpenAI nur ohne aktuelle Sperre als Notfallback. Nach 90 Minuten wird OpenAI automatisch wieder prüfbar; keine unberechtigte Änderung an Zahlungsmitteln.
- `ai-gateway v28`: Für `execution_artifact` im interaktiven Lauf Claude Haiku 5.5 mit `output_config.effort=low`, deutlich kürzerem Arbeitskontext und modellgerechten Kosten verwenden, statt Sonnet 4.6 jedes Mal an die Timeouts laufen zu lassen. **Nur** bei explizitem Modellzugriffs-/Parameterfehler 400/404 von Haiku 5.5 einmal auf Haiku 4.5 zurückfallen. Hochqualitäts-/sonstige Modellrouten bleiben unverändert.
- Dauerhafte OpenAI-Billing-Fehler als `OPENAI_BILLING_INACTIVE` klassifizieren; andere 429 nicht als fälschlichen Arbeitserfolg behandeln.
- Modellantwort-Schema für `execution_artifact`: mindestens 90 Zeichen im fertigen `deliverable`, eine echte `verification` und eine konkrete `next_recommendation`; Pflichtfelder dürfen nicht nur mit Platzhalterwerten befüllt sein. Quellenbasierte Rechtsaussagen weiterhin nur mit passenden tatsächlichen Belegen.
- `pilot/index.html` LUMEN .30: Nur Administratoren sehen `✦ KI-Ausführung testen`. Das löst mit angemeldeter Sitzung einen **separaten kleinen** `best-of-ai`-Lauf aus (keine `actions`-, `results`- oder `progress`-Veränderung). Es prüft, ob ein Anbieter eine vollständige strukturierte Antwort liefern kann, und unterscheidet Fehler von Erfolg. Tests simulieren Erfolg, Provider-Ausfall und unvollständige Antwort.

**Abnahmegrenzen und operativer Nutzerhinweis:**
- Live-Konto: OpenAI-API-Abrechnung muss separat von einem ChatGPT-Abo geprüft/aktiviert werden. Nur der Kontoinhaber kann dies in den OpenAI Platform Billing-Einstellungen ändern.
- Aktuelle Alpha-Versionen der Edge-Funktionen und Admin-Diagnostik sind installiert; **noch kein realer Haiku-5.5-Aufruf mit der Kundensitzung erfolgreich bestätigt.** Der KI-Kurztest geht vor einem erneuten vollständigen Auftragstest.
- Keine falsche Erfolgsmeldung und kein automatisches Erledigt, solange eine verifizierte Ergebnisspeicherung fehlt. Die Architektur darf rechtlich relevante Fragen nicht aufgrund von bloßen Wikipedia-Links als abschließend geklärt markieren.


## LUMEN 2026.10.08.31 – Mobile Admin-Kompaktmodus und API-Guthaben-Recovery

**UX:** Der iPhone-Screenshot um 10:55 zeigte zwei große Administrator-Kopfkarten hintereinander, abgeschnittene rechte KPI-Karten und überdimensionierte Buttons. `pilot/index.html` hat nun nur einen kompakt leuchtenden Admin-Kommandobereich statt `pilotScene` plus „Betreiber-Cockpit“. Fünf Kennzahlen stehen in responsiven `minmax(0,1fr)`-Zellen, Nutzer/Rollen/Trends und Ereignisse lassen sich in zwei nativen `details`-Sektionen öffnen. Auf dem Smartphone werden Benutzerrollen als handhabbare Karten statt als breite Desktop-Tabelle gezeigt. Frühere IDs (`refreshAdmin`, `data-role-user`) und Navigation (`roadmap`, `alpha`) sind erhalten; JavaScript sowie 11 Mock-Rendering-/Markup-/Berechtigungstests bestanden. Kein echter iPhone-Bildschirmtest nach Deployment.

**API-Guthaben:** Nutzer meldet, Guthaben wurde wieder aufgeladen. Die bisherige 90-Minuten-Sperre für eine ehemals inaktive OpenAI-API wäre nun unnötig lang gewesen. `best-of-ai v21` prüft deshalb höchstens fünf Minuten zurückliegende OpenAI-Abrechnungsblockaden und probiert anschließend wieder OpenAI, mit Claude als sicherem Ersatz. Bei frischer Sperre bleibt Claude vorrangig, bei erneuter Aktivierung kann OpenAI wieder antworten. **Das Guthaben wurde nicht über den Connector verifiziert, die API-Verfügbarkeit ist weiter durch einen kurzen echten Administratortest zu bestätigen**.

**Offene Abnahmen:** Admin-Cockpit auf dem echten iPhone visuell prüfen und die kurze `✦ KI-Ausführung testen`-Funktion in der Zentrale mit angemeldeter Admin-Sitzung starten. Danach erst vollständige Ausführung. Den Entwicklungsstatus weiterhin nicht auf Ready setzen, bevor die entsprechende Live-Abnahme bestanden ist.


## 2026-10-08 · Quellen-Föderation v2 – unabhängige Forschung, amtliche Dokumente, belegbare Ergebnisse

Auf Nutzerwunsch umgesetzte Erweiterung der **bestehenden** Pilot-Funktionen (keine größere Büro-/Admin-UI). Die helle LUMEN-.32-Oberfläche bleibt unverändert.

**Neue Live-Provider (`research-gateway v21`):**
- **Crossref:** echte, nach DOI registrierte wissenschaftliche Veröffentlichungen; Suche über öffentliches REST-Metadaten-API, ohne zusätzliche API-Secrets. Titel, Publikationsjahr und – falls vorhanden – Auszüge werden mit DOI und Ursprung gespeichert. DOI allein belegt weder fachliche Richtigkeit noch Peer Review.
- **Europe PMC:** öffentliches fachwissenschaftliches Literaturregister für medizinische, biologische und verwandte Themen. Nur bei erkannten Life-Science-Fragen aktiv; Ergebnisse enthalten valide Artikel-ID, Jahr, Quellen-URL und – falls verfügbar – Inhaltsauszug.
- **Wikidata:** strukturierte Entitätsinformationen zur Begriffsklärung / Zuordnung, **nur Hintergrundquelle**; unabhängigem offiziellen Nachweis weder gleichgesetzt noch als Rechtsbeleg gewertet.
- **Brave Search:** optionale unabhängige Websuche nach **amtlichen** Webseiten via `BRAVE_SEARCH_API_KEY` als Supabase Secret. Ohne Schlüssel ist nur der Providerstatus `not_configured`, andere Quellen laufen unverändert weiter. Brave-Treffer gelten erst als mögliche Primärbelege nach echtem HTML-Abruf über HTTPS von einer festen Domain-Allowlist. Kein beliebiger URL-Abruf und keine Redirects. URLs aus Such-Snippets allein werden nicht als verifiziert ausgegeben.
- **Bestehend erhalten:** Wikipedia (Hintergrund), optionale Google Programmable Search (Discovery), offizieller Website-Rückfall über OpenAI Web Search, falls für regulierte Fragen keine amtliche Quelle gefunden wurde.

**Automatische intelligente Quellenauswahl und Geschwindigkeit:**
- Branchen- und frageabhängige Providersteuerung (allgemein, technisch/wissenschaftlich, Life Sciences, rechtlich reguliert); Fachprovider laufen nur, wenn die Frage zu ihrem Fachgebiet passt.
- Wikipedia-Varianten und neue unabhängige Provider werden parallel abgefragt, mit festen Timeouts und voneinander isolierten Providerfehlern.
- Ranking mit klarer Trennung von `official_candidate`, `academic_abstract`, `publication_metadata`, `background`, `discovery`; geringere Evidenzbewertung von reiner Literaturmetadaten-Information; Quoten je Provider und Themenfragment statt fünf ähnlicher Wikipedia-Treffer.
- **Keine Quellenwäsche:** Wikipedia-Links werden auch durch den amtlichen Website-Rückfall nie zur offiziellen Quelle. Nur vertrauenswürdige staatliche Seiten (z. B. DGUV, SVLFG, Bundesrecht, EU, IHK), die tatsächlich erfolgreich abgerufen werden konnten, kommen als offizielle Nachweise infrage.
- `research-intelligence v14` bildet nur eine vorläufige **Quellen-Evidenzprüfung**: Mindestens zwei echte unabhängige Herkunftsgruppen, für regulierte Pflichten eine amtlich abgerufene Quelle, bei Forschungsfragen ein substanzieller Abstract oder offizieller Fachtext. Wikipedia+Wikidata zählen als **ein** Wikimedia-Quellenökosystem. `independently_verified_claims:false` bleibt zwingend: Erst die fachliche Prüfung konkreter Aussagen ist echte Sachverifikation.
- `execution-engine v27` verwendet die sechs Quellenanbieter standardmäßig im bestehenden Aufgabenablauf und erhält die Qualitätsmetadaten, Quellen-IDs und Links. Ungeprüfte rechtliche/technische Aussagen müssen ausdrücklich offen bleiben; Quellenbelege werden nicht generiert.

**Abnahme:**
- Live deployed und JWT-geschützt: `research-gateway v21`, `research-intelligence v14`, `execution-engine v27`.
- Quellcode- und Routertests prüfen offizielles Host-Allowlisting, Ablehnung täuschender Domains, Rechts-/Wissenschafts-Kategorisierung, Quellenranking und Metadaten-Abwertung; zusätzliche Backend-Verdrahtung/Quality-Gate/Parallelisierungsprüfungen bestanden.
- **Noch offen:** echter authentifizierter Quellenvergleich aus mindestens zwei thematisch verschiedenen Pilot-Aufträgen auf dem iPhone einschließlich überprüfbarer Fundstellen und Seitenaufruf. Brave kann erst nach Hinterlegen von `BRAVE_SEARCH_API_KEY` mit echten Treffern abgenommen werden. Keine Behauptung, dass bisherige 24 gespeicherte Quellen aus diesen neuen Providern stammen.
- Grundregel unverändert: Pilot darf den Schritt nur als erledigt markieren, wenn belegte, geprüfte Ergebnisse vorliegen. Bei unvollständigen/konfligierenden Quellen muss Unsicherheit sichtbar bleiben und ggf. fachliche Freigabe verlangt werden.


## 2026-10-08 · Brave Search & Widerspruchsprüfung v3 (LUMEN .33)

**Live-Code implementiert:**
- `research-gateway v23`: Optionaler `BRAVE_SEARCH_API_KEY` aus **Supabase Edge Function Secrets** (nicht Frontend). Offizieller Brave-Endpunkt `/res/v1/web/search`, `X-Subscription-Token`, kontrollierte deutsche/lokale Suchanfragen, SafeSearch und Limit. 401/403, 429 und 5xx werden getrennt behandelt; Ausfall anderer Quellen wird dadurch nicht ausgelöst. Kein API-Schlüssel wird an Browser, Logs oder Datenbank zurückgegeben.
- Brave-Weg für **zwei unterschiedliche Evidenzklassen**: (1) Amtliche HTTPS-HTML-Seiten, deren Domain vorab auf statische Whitelist geprüft und deren Inhalt tatsächlich ohne Weiterleitung heruntergeladen wurde (`brave_official`, `verified_fetch:true`); (2) sonstige Brave-SERP-Titel/Snippets nur als nicht unabhängig überprüfte Entdeckung (`brave_discovery`, `verified_fetch:false`). **Keine willkürliche URL aufrufen** – SSRF-Schutz bleibt zwingend. Zu amtlichen Domains zählen neben Bund/EU/DGUV/SVLFG nun unter anderem `berlin.de`, `hamburg.de`, `bayern.de`, `service-bw.de`, `rki.de`, `zoll.de`. Quellenklassen haben verschiedene Scores/Providerquoten. Die Allgemeinsuche ist auch bei Marketing- und Businessaufträgen nützlich, ohne aus Schnippets behauptete Fakten abzuleiten.
- `research-intelligence v17`: Konservativer, **deterministischer** Vergleich von Quellenauszügen auf *potenziell widersprüchliche Pflicht-/Nachweisaussagen*. Nur inhaltstragende Textquellen, zwei unabhängige Herkunftsgruppen und mindestens zwei gemeinsame Fachbegriffe. Mehrere Subdomains derselben Institution werden als eine Herkunftsgruppe behandelt. Die Stellen werden mit Quellen-ID und kurzem echtem Originalauszug markiert. Kein definitiver Widerspruch ohne Abgleich von Rechtsgebiet, Zeitraum und Geltungsbereich.
- `execution-engine v28`: Kandidaten und Quelle-IDs gehen in den Modellkontext, die gespeicherten `results.structured_content` und den `verification_records.evidence` ein. Wenn Widersprüche offen bleiben, wird der Qualitätsstatus **nicht `passed`**; der Arbeitsgang wird nicht fälschlich als erledigt markiert. Freigabepflichtige Ausgaben zeigen Unsicherheit, statt vermeintlich definitiv rechtlich zu entscheiden.
- `research-gateway v23` bietet den nach Login verfügbaren, isolierten `operation=brave_diagnostic` (kein Konto-/Auftrags-/Fortschritts-Update). Ohne Schlüssel meldet er `not_configured`; `live_test=true` prüft genau eine bezahlte Brave-Suche und gibt nur Status und Ergebnisanzahlen zurück.
- `pilot/index.html` LUMEN `2026.10.08.33`: Im **bestehenden** Admin-Bereich `Systemtests` ist ein schmaler `⌕ Brave prüfen`-Button integriert. Keine neue große Karte oder separate Office-/CRM-Oberfläche.

**Tests:** Widerspruchserkennung mit 7/7 Fällen geprüft (echtes Kandidatenpaar, unterschiedliches Thema, gleiche Quelle, Metadaten, Quellen-ID, Auszüge), Brave-Admin-Test mit vier isolierten Mockfällen, Edge Deployments aktiv und JWT-geschützt, JS-Syntax korrekt. Echte externe Live-Provider-Anfrage **noch offen**, bis `BRAVE_SEARCH_API_KEY` sicher gesetzt ist. Reale Quellenwidersprüche müssen weiterhin fachlich/juristisch abgeglichen werden; Heuristik ist ein Vorsichtsindikator, keine Wahrheitsmaschine.

**Verbindlicher Setup- und Abnahmeablauf:** Im Brave API Dashboard den Search-Plan aktivieren und einen API-Key erstellen (separate potenziell kostenpflichtige Nutzung); in Supabase Projekt `qfrylqxbqmuafyvnqkey` → Edge Functions → Secrets einen Secret-Eintrag **`BRAVE_SEARCH_API_KEY`** anlegen. Key niemals in Chat, GitHub, HTML, JavaScript-Quellcode oder Tickettext kopieren. Danach im Admin-Bereich `Systemtests` auf `⌕ Brave prüfen` klicken; erst bei nachgewiesenen Live-Treffern ist der Provider abgenommen. Anschließend zwei verschiedene Aufträge mit Fundstellen und eventuellen Widerspruchskandidaten testen, bevor Roadmap auf Grün geht.


## 2026-10-08 · 11:38 Brave Search Live-Verbindung bestätigt – Amtsquellen nachgeschärft

**Echte iPhone-Abnahme der API-Verbindung:** LUMEN .33 zeigt `Brave Search antwortet: 10 Suchtreffer, davon 0 überprüfte amtliche Seiten`. Der Server erhält gültige Brave-Suchergebnisse; Credential-/Konfigurationsprüfung und der echte Anbieter-Kurztest sind **bestanden**. Daraus folgt aber weder, dass die Fundstellen wirklich amtlich geprüft sind, noch dass die allgemeine Quellen-/Auftragsausführung abgeschlossen ist.

**Root cause / Produktverbesserung:** Die ursprüngliche allgemeine Anfrage `Baumpflege Qualifikation Arbeitsschutz` konnte zwar Suchergebnisse finden, aber keine abgerufene amtliche HTML-Seite erfolgreich als Fachbeleg einstufen. Dies kann an fehlenden Behörden-Treffern, PDF-Links, Schutz vor automatischem Zugriff oder zu generischer HTML-Extraktion liegen; ohne Detaildaten wird **keine** der Ursachen als bestätigt ausgegeben.

**Korrektur live in `research-gateway v25`:** Wenn ein reguliertes Thema nach der allgemeinen Brave-Suche keine abrufbare amtliche Quelle liefert, ist maximal **eine zusätzliche zielgerichtete Suche** erlaubt, z. B. für Baumarbeiten gezielt `site:svlfg.de Baumarbeiten Fachkunde Baumpflege`. Für andere Regulierungsfragen passende offizielle Hosts (`dguv.de`, `verwaltung.bund.de`). Metadaten und tatsächlich gefundene, hinreichend thematische Absätze aus real abgerufenen HTML-Seiten werden robuster extrahiert. Nur real abgerufene und relevante amtliche HTML-Texte gelten als `brave_official`. Bloße SERP-Titel/-Snippets bleiben `brave_discovery`; es gibt keinen unbegrenzten Crawler und keine beliebigen URL-Abrufe.

**Diagnosestufen:** Anstatt einen pauschalen Nullwert zu zeigen, liefert der abgesicherte Brave-Test `official_candidates`, `official_unverified`, `verified_official` und `focused_search_performed`. Im iPhone-Dialog unterscheidet LUMEN .34 zwischen „keine amtlichen Treffer“, „amtliche Treffer gefunden, aber Originalseite nicht erfolgreich abgerufen“ und „amtliche Originalseite tatsächlich abgerufen“. Der Begriff „abgerufen“ besagt **nicht**, dass sämtliche Aussagen fachlich wahr oder rechtlich abschließend geprüft sind.

**Prüfung:** Edge-V25 live, JWT erforderlich. 8 Code-/Sicherheitstests beim Deployment, 7 isolierte Quellenauswahl/Extraktions-/URL-Tests und 4 Dialogtests erfolgreich. Ein echter erneuter iPhone-Test der neuen amtlichen Fokussuche steht noch aus. Im Entwicklungsplan `pilot_federated_research_sources_v2` sind 9 Prüfungen grün, 2 Pflichtprüfungen offen (amtlicher Live-Beleg und vollständige Multiquellen-Ausführung). Keine Anpassungen an der bestätigten kompakten Administrationsoberfläche.


## 2026-10-08 · 11:47 Brave-Live-Test: 16 Treffer, 6 amtliche Links, 0 lesbare Originale (LUMEN .35)

Der erneute **authentifizierte iPhone-Test** liefert `Brave verbunden: 16 Treffer. 6 amtliche Fundstellen erkannt, aber keine Seite konnte bisher zuverlässig ausgelesen werden.` Der Server-Log um 09:46:58 UTC bestätigt `BRAVE_RESEARCH_QUALITY` mit `searched:16`, `official_candidates:6`, `verified_official:0`, `official_unverified:6`, `focused_search:"completed"`.

**Was tatsächlich funktioniert:** API-Credential, allgemeine Brave Search und die zusätzliche gezielte Suche nach amtlichen Fachseiten. Es ist **noch kein** Amtsquellen-HTML-Abruf bestanden. Der ursprüngliche Code verwarf alle Weiterleitungen (`redirect:error`), prüfte ausschließlich HTML-Content-Type und einen engen Suchbegriffabgleich. Ohne zusätzliche Fehlerdiagnose ist nicht belegbar, welche dieser Ursachen bei welchen sechs Quellen vorlagen.

**Korrektur live:** `research-gateway v26` nutzt nun sichere Weiterleitungen (`redirect:manual`, maximal zwei tatsächliche Redirects, jede Ziel-URL muss HTTPS und auf explizit freigegebener amtlicher Domain sein), lesen von HTML/XHTML/Text über einen maximal 310 KB großen Stream mit Abrufzeitlimit; PDF-Dateien bleiben unbestätigte Quellen mit dem klaren Diagnosecode `pdf_requires_reader` statt fälschlicher Beleg. Relevante Absätze/Listen/Meta-Texte werden robust auf baumpflege-, baumarbeiten- und fachkunde-nahe Begriffsstämme geprüft; fremde Inhalte dürfen die Fachrelevanz nicht künstlich erhöhen. Die weitere Suche ist weiterhin limitiert und überprüft keine willkürlichen Nutzer-/SERP-URLs.

**Neuer Operator-Status:** `tested_official`, `verification_failures` (z. B. HTTP 403, externe Redirects, PDF, Timeout, nicht zutreffender Text), `official_candidates` und `verified_official` sind getrennt. `pilot/index.html` LUMEN .35 meldet die beiden häufigsten diagnostizierten Ursachen für nicht bestätigte Originalseiten auf Deutsch. Freigegebenes kompaktes iPhone-LUMEN-Design beibehalten.

**Tests:** Backend aktiv mit JWT; 7 Sicherheit-/Quellcodechecks, 5 HTML-Extraktionsbeispiele, 3 Dialogvarianten (amtlicher Erfolg, nicht lesbare Kandidaten, fehlender Key) bestanden. Ein weiterer **realer** authentifizierter Brave-Test ist nötig, bevor amtliche Originalseiten als erfolgreich verifiziert markiert werden. Im Entwicklungsplan bleibt `pilot_federated_research_sources_v2` auf Alpha (10 bestandene technische/Verbindungstests, 2 ausstehende Praxisprüfungen). **Keine Aussage, dass die sechs aktuellen Fundstellen schon eingelesen wurden.**


## 2026-10-08 · 11:53 – Brave-Nachweis auf dem iPhone **bestanden**

LUMEN .35 im authentifizierten iPhone-Test zeigt: **16 Brave-Suchtreffer, eine amtliche Originalseite erfolgreich abgerufen**. Der unabhängige Edge-Log `BRAVE_RESEARCH_QUALITY` um 09:53:43 UTC bestätigt exakt: `searched=16`, `official_candidates=6`, `verified_official=1`, `official_unverified=5`, `attempted=3`, `focused_search=completed`, `failures.pdf_requires_reader=2`.

**Abnahme und Abgrenzung:** `brave_official_source_live_validation` im Entwicklungsplan `pilot_federated_research_sources_v2` auf **passed** gesetzt (11/12 Pflichtprüfungen bestanden). Mindestens eine behördliche HTTPS-Originalseite wurde unter geltenden Host-Sicherheitsregeln tatsächlich abgerufen und ein relevanter Textabschnitt extrahiert; dies beweist noch **nicht** die fachliche Richtigkeit ihrer einzelnen Aussagen. 2 der versuchten amtlichen Treffer sind PDFs, die der jetzige HTML-Reader bewusst als `pdf_requires_reader` zurückweist; offizielle PDF-Unterstützung ist ein sinnvoller zukünftiger Ausbauschritt mit Größen-, Herkunfts- und Textsicherheitsprüfungen.

**Noch offen:** `authenticated_multisource_executions` ist die letzte verpflichtende Praxisprüfung: ein echter angemeldeter Pilot-Auftrag muss daraus einen gespeicherten, durch Quellen-IDs nachvollziehbaren und fachlich zur Nutzerprüfung vorgelegten Ergebnisentwurf erzeugen. Vor dieser Abnahme **kein** vollständiger Feature-Abschluss, keine erfundenen Quellenbelege und kein verdeckter automatischer Erfolgseintrag.
