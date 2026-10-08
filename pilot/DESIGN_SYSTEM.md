# neXaro Pilot — verbindliche LUMEN-Designrichtlinie

**Status:** Produktstandard (verbindlich für alle neuen und geänderten Pilot-Komponenten)
**Stand:** 2026-10-08 · LUMEN 2026.10.08.17
**Geltungsbereich:** Landing/Login, Zentrale, Ziele, Dokumente/Wissen, Ergebnisse/Lieferobjekte, Ausführung, Gestaltung, Einstellungen, Dialoge, Navigation, Entwicklungsplan und Adminwerkzeuge.

## Produktidentität

neXaro Pilot ist **ein intelligenter operativer Mitarbeiter**, nicht ein CRM, ERP, Vertriebs-Dashboard oder klassisches Office-Programm. Die Oberfläche soll eine ruhige, hochwertige, helle, futuristische **KI-Kommandozentrale** vermitteln.

- Helle Flächen, transparente Schichten, sanfte radiale Lichthöfe, sehr subtile Systemraster.
- **Neon-Grün** führt wichtige Interaktionen und positives Systemfeedback.
- **Neon-Orange** ist ein sparsames Signal für Abzweigungen, Aufmerksamkeit, Freigaben oder zweite Prozessstufe.
- Niemals dunkle Gaming-Cockpits, Neon-Überladung, unnötige Diagramme, KPI-Wände oder dekorative Animationen ohne Nutzwert.
- Visuelle Elemente transportieren eine **echte Systemfunktion oder einen belegten Zustand**. Kein vorgetäuschter Fortschritt.

## UX-Grundsätze

1. **Jede Ansicht hat eine Hauptaufgabe.** Zentrale = Auftrag beginnen; Ziele = Missionen; Dokumente = Wissensübergabe; Ergebnisse = Lieferobjekte; Ausführung = nachvollziehbare Arbeitsfolge.
2. **Auftrag beginnen bleibt in der Zentrale immer verfügbar**, unabhängig davon, ob bereits Ziele angelegt sind.
3. **Bestehender Arbeitskontext ist sichtbar, aber kompakt**: aktives Ziel, nächster Schritt und verifizierter Fortschritt. Details öffnen sich erst bei Bedarf.
4. Komplexe interne Systeme (Provider-Auswahl, KI-Synthese, Forschung, Telemetrie, Sicherheitsgate) arbeiten im Hintergrund; ihr Zustand wird nur bei tatsächlichem Nutzwert angezeigt.
5. **Klares, menschlich verständliches Deutsch**: „Auftrag beginnen“, „Nächste Aktion“, „Ergebnis prüfen“. Zukunftsanmutung durch Atmosphäre und Bewegung, nicht durch unverständlichen Jargon.
6. Daten- und Ausführungsstatus müssen wahrheitsgemäß sein. **0 % bleibt 0 %**; grün/„fertig“ erst nach bestandenen Pflichtprüfungen.
7. Kundendaten gehören zum zugewiesenen Ziel; Quell- und interne Modelldaten werden nicht ungefragt im Kundenbereich dargestellt.

## Komponenten

- **LUMEN Scene Header**: einmal je Unterbereich, kompakter einladender Einstieg und zurückhaltender animierter Intelligence-Core.
- **Mission**: leichtes Operationsband mit Fortschritt/Status statt Tabellen- und CRM-Kachel.
- **Wissen**: Aufnahme-/Verarbeitungsebene statt klassischer Dateiverwaltung; echte Upload-Funktionen und Zugriffsrechte bleiben erhalten.
- **Lieferobjekte**: Ergebnisvorschau und qualifizierte Statusanzeige statt Datenlisten; Feedback und Gestaltung bleiben funktional.
- **Prozessspur**: verifizierte Schritte mit echten Daten, Risiko- und Freigabestatus.
- **Systemdialoge**: helle neXaro-Modals, klare Frage und ein primärer Button, vollständige Tastaturbedienung, keine nativen Browser-Popups als Produkt-UI.
- **Navigation**: kompakte eindeutige fünf Kernbereiche; Experten-/Admin-Funktionen getrennt und geschützt.

## Visuelle Token & Motion

- Hintergrund: #f6faf7 / helle Keramik-Fläche mit sehr weichem Grün-Radiallicht.
- Schrift/Hauptkontrast: #19251d; Sekundärtexte: #728175.
- Aktiv/Primär: #8cff29; sekundär Orange: #ff7721.
- Transparente Panelgrenze ca. rgba(110,151,107,.18), natürliche weiche Schatten.
- Rundungen: große Bühnen 25–34px; Controls 14–19px.
- **Animation = Systemfeedback:** gleichmäßiger Flug von der Mitte des Startbuttons zur Mitte des Zielbuttons, kontinuierliches requestAnimationFrame/translate3d, Landung vor Freigabe der nächsten Aktion; keine Teleportation.
- Weitere Animationen subtil und GPU-freundlich; mobile Safari zuerst. `prefers-reduced-motion` respektieren, kein ununterbrochenes starkes Blinken.
- Lesbarkeit und Tastaturfokus nicht für Optik opfern. Auf dem iPhone Controls ausreichend groß und außerhalb der Browserleisten nutzbar.

## Implementierungsregeln

- Live-Frontend liegt in `pilot/index.html` dieses Repositories.
- Jede neue Funktion übernimmt zuerst bestehende LUMEN-Komponenten/-Tokens. **Kein neues Fremddesign oder Bootstrap-/CRM-Standarddashboard.**
- IDs, data-Attribute und Event-Handler von Backend-, Auth-, Upload-, Freigabe- und Flugfunktionen beim Redesign unverändert erhalten oder nachweislich migrieren.
- Bei jedem UI-Release testen: leerer Arbeitsbereich, laufendes Ziel, kein offener Schritt, Kundenmodus, Adminmodus, iPhone/Safari, Navigation, Zielkontext, Sicherheitsdialoge und Ausführung.
- Designverifikationen: Code- und UI-Tests sowie echter Mobilgerätetest getrennt dokumentieren. **Ohne echten iPhone-Test nicht als vollständig abgeschlossen markieren.**
- Änderungen am visuellen System und funktionalen Verhalten gehören als Quellcode in GitHub, nicht als bloße Beispielbilder. Mockups sind keine Implementierung.
- Diese Richtlinie gilt verbindlich für zukünftige neXaro-Pilot-Entwicklung und ist bei Erweiterungen gemeinsam mit dem letzten Implementierungsstand zu lesen.

## Qualitätsziel

**Pilot darf intern komplex sein, soll nach außen aber einfach, lebendig, intelligent, intuitiv, vertrauenswürdig und klar futuristisch wirken.**


## LUMEN Depth & Interaction (ab 2026-10-08, Version .18)

Dieser Zusatz ist verbindlich für alle mobilen und Desktop-Oberflächen.

- **Tiefe statt weiterer Informationskästen:** Mehrschichtige Lichtflächen, natürliche Schlagschatten, reflektierte Akzente und unterschiedliche räumliche Ebenen – stets subtile Intensität und hohe Lesbarkeit.
- **Interaktion als wahrnehmbares Feedback:** Systemflächen reagieren auf Berührung mit einer sichtbaren, kurzen Rückmeldung. Auf Desktop darf ein dezenter 3D-Neigungs- und Spotlight-Effekt der Maus folgen, aber maximal wenige Grad und ohne störende Sprünge.
- **Mobile Navigation:** Zentrale, Ziele, Dokumente, Ergebnisse und Ausführung verwenden einheitliche 24×24 SVG-Vektorsymbole mit klarer Kontur. Auf iPhone ungefähr 29px sichtbare Icon-Größe in mindestens 43px großer visueller Icon-Fläche und circa 79px großen Navigationstasten. Aktivstatus ist eindeutig durch grünen Leuchtring, hinterlegtes Symbol und Unterstrich erkennbar.
- **Keine Schriftzeichen als Hauptnavigation:** Unicode-Piktogramme wie `⌂`, `◎`, `⌑`, `▣`, `↗` sind für die unteren Symbole nicht zulässig; echte SVG-Pfade sind Pflicht.
- **Animation bleibt funktional:** Nur echte Arbeitsphasen animieren. Karten-/Ansichtswechsel kurz und weich; dauerhafte Animation nur dezent. Die durchgängige Flugzeuganimation vom Startbutton zum Zielbutton darf nicht von der neuen räumlichen Oberfläche unterbrochen werden.
- **Barrierefreiheit:** `prefers-reduced-motion` respektieren; mobile Berührung darf keinen Hover-Zwang voraussetzen; Navigation hat `aria-label`, die aktive Ebene `aria-current="page"`; ausreichender Farbkontrast und große Touchflächen.
- **Performance:** `transform`/GPU-kompatible Änderungen statt teurer Layout-Updates; maximal begrenzte Anzahl von Interaktionsflächen je Ansicht. Mobile Safari und ältere Geräte schonen.
- **Regression:** Nach UI-Änderungen Startauftrag, Anhänge, Fortsetzen, Ausführung, Landeanimation, alle fünf Tabs, Dialoge und Kundenvorschau erneut testen. Quellcode-/Simulationstests und realer iPhone-Livetest sind separat abzunehmen.


## Fluganimation V5 – iPhone-Flüssigkeit (2026-10-08)

- Native `Element.animate()` / Web Animations API mit vorberechneten `translate3d()`-Keyframes verwenden, um die Transformation dem Browser-Compositor zu überlassen. `requestAnimationFrame` dient nur als Fallback.
- Die reale Mitte des Startbuttons und die reale Mitte des nächsten Aktionsbuttons bleiben Start-/Landebahn. Nur **eine** Flugzeuginstanz pro Auftrag.
- Startflug verbindet seine Endposition und Endrichtung mit der Anfangsposition und Tangente der endlos wiederholbaren Orbit-Flugbahn (keine abrupten Zustandswechsel).
- Rundflug nutzt eine stetige, geschlossene elliptische Kurve mit keiner vollständig stehenden Flugphase.
- Der Landeanflug startet von der tatsächlichen animierten Position, orientiert sich an der aktuellen Bahntangente, verlangsamt sich stetig und endet mit verschwindender Endgeschwindigkeit exakt auf dem Zielbutton.
- Scrollen findet während des Rundflugs statt. Der Anflug beginnt erst nach Stabilisierung der Zielkoordinaten.
- Erst die abgeschlossene Landung löst das Einblenden und Freigeben der operativen Aktion aus. Danach erfolgt ein weiches Ausblenden.
- Teure Blur-/Filtereffekte auf bewegten Elementen minimieren. Kein `opacity:...!important` oder `transform:...!important` auf dem animierten Flugzeug, wenn native Keyframes diese Werte steuern.
- Die Flugfunktion bleibt im Entwicklungsplan `alpha`, solange die neue Version nicht in einer realen iPhone-Bildschirmaufnahme als flüssig bestätigt wurde.


## Produktkorrektur: Inline Decision Core statt großem Editor (LUMEN 2026.10.08.25)

**Verbindliche Korrektur des alten Editor-Modells:** Der Nutzer möchte **keinen** großen, modalen oder automatisch aufspringenden Editor. Bei gemeinsamen Pilot-Entscheidungen ist das bereits sichtbare, **kompakte, direkt bearbeitbare** Entscheidungsfeld der Standard. Frühere Anweisungen, beim Antippen einen eigenständigen bildschirmfüllenden Fokuseditor zu öffnen, sind hiermit aufgehoben.

- Abschnittstitel sind deutlich hervorgehobene, echte Labels **innerhalb einer einzigen zusammenhängenden Entscheidungsfläche**, darunter frei bearbeitbare Textabschnitte ohne separate Büro-Formularrahmen.
- Höhe der Entscheidungsfläche auf dem iPhone etwa 290px; intern auf-/abwärts scrollen, ohne Modaldialog, Seitenübernahme oder Tastatur-Zwang.
- Die Textfelder wachsen intern mit dem Inhalt. **Einziger vertikaler Scroll-Eigentümer ist die kompakte Entscheidungsfläche**, nicht ein konkurrierendes verschachteltes Textarea-Scrolling.
- Umgebung bleibt die helle futuristische LUMEN-Kommandozentrale: leichte holografische Ebenen, Neon-Grün/Orange, subtiles Systemraster, dezenter Glow, prägnante Typografie, sehr wenig Büro-/CRM-Formularoptik.
- Fokusfeedback ist unmittelbar sichtbar, aber minimal; keine großflächige Abblendung oder Verschiebung. Mobil-Safari bleibt vorrangig.
- Ein klarer Hauptbefehl `⚡ Entscheidung steht. Pilot übernimmt.`, keine doppelte Freigabe und kein unnötiges „vollständiges Ergebnis“ im Entscheidungsdialog.
- Die lokal bearbeiteten Abschnitte werden **nachweislich verlustfrei** zu einem Entscheidungstext zusammengesetzt und durch den vorhandenen sicheren Backend-Freigabeprozess verarbeitet.
- Jede künftige Gestaltung muss zuerst nach dem Grundsatz beurteilt werden: **futuristischer KI-Mitarbeiter statt herkömmlicher Office-Software**. Funktionalität, Lesbarkeit und visuelle Tiefe gleichzeitig bewahren.

**Status:** Quellcode in `pilot/index.html`, LUMEN 2026.10.08.25. Funktionstests bestanden, echter iPhone-Scroll-/Eingabetest noch offen.


## LUMEN 2026.10.08.31 — kompakte Steuerzentrale, besonders auf dem iPhone

Aus dem iPhone-Praxistest (10:55) folgt eine neue verbindliche Designregel für alle Pilot-Bereiche, insbesondere für Administrations-, Roadmap- und Systemtest-Ansichten:

**Niemals mehrere große Einführungs-/Hero-Karten hintereinander anzeigen.** Der Administrator benötigt eine kompakte Kommandoübersicht, keine raumgreifende Office-/CRM-Startseite. Die helle futuristische LUMEN-Ästhetik bleibt bestehen, soll aber durch Lichttiefe und Mikrointeraktionen und nicht durch Größe wirken.

- Mobile Admin-Ansicht: **ein** kompaktes Hero/Command Strip mit einer klaren Hauptüberschrift und kurzer Erklärung; kein doppeltes „Systemadministration“ + „Betreiber-Cockpit“ mehr.
- Kurze, priorisierte Verwaltungsaktionen (Plan, Tests, Aktualisieren) in einer responsiven Zeile. Navigation und alle funktionalen IDs/Bindungen bleiben unverändert.
- Kennzahlen in einem mobilen Grid mit **minmax(0,1fr)**, kleineren Fonts und deutlich weniger Leerraum; keine horizontale Bildschirmüberbreite, kein Abschneiden der zweiten Spalte.
- Untergeordnete Administratorinhalte sind als zugängliche, native `details/summary`-Bereiche verfügbar. Das reduziert kognitive Belastung, ohne Rollen-, Analyse- oder Ereignisfunktionen zu entfernen.
- Nutzerverwaltung auf dem iPhone als kompakte zweispaltige Liste mit eigener 43px-Rollenauswahl statt einer mindestens 650px breiten Desktop-Tabelle; kein seitliches Scrollen der Gesamtseite.
- **Leichtes LUMEN, keine Bürosoftware:** weiß/mint, neon-grüne/orange Statussignale, dezente Raster, kurze Typografiehierarchie, zurückhaltender Glow. Keine neue große Animation als Dekoration.
- Für andere Admin-Bereiche die Kopfkarte auf dem iPhone ebenfalls verkleinern, ohne Prüf- und Bedienfunktionen zu verstecken.
- Erst nach realem iPhone-Test visuell als abgenommen markieren. Syntax- und Strukturtests sind technische Teilabnahme, ersetzen aber keine Prüfung des tatsächlichen mobilen Renderings.

**Umgesetzt** in `pilot/index.html`, LUMEN `2026.10.08.31`; GitHub-Commit `e5b4bdaecbf0fd9731ed6e9da1b867edf7258bc3`. Kompakte Darstellung, Admin-Berechtigungsprüfung, offene/geschlossene `details` und ursprüngliche Aktions-IDs wurden mit Mockdaten strukturell getestet.


## Feinschliff LUMEN 2026.10.08.32 – weniger visuelle Last, gleiche Fähigkeiten

Auf ausdrücklichen Nutzerwunsch wurde die bereits kompakte Admin-Oberfläche **noch einmal reduziert**: Nicht nur Kartenüberschriften und Abstände, sondern auch die Navigation müssen ruhig und zugänglich wirken.

- Administrationskopf nur noch etwa 20px statt 23px Titelgröße, kürzere Beschreibung und geringere Innenabstände.
- Fünf Kennzahlen auf dem iPhone in **zwei** niedrigen Reihen (3 + 2), nicht in drei großen Reihen. CSS `repeat(6,minmax(0,1fr))`, erste drei Werte je 2 Grid-Spalten, letzte zwei je 3.
- Verwaltungs-/System-Details bleiben aufklappbar; geschlossene Zeilen auf etwa 50px verdichtet. Freigabe- und Bedienfunktionen müssen erhalten bleiben.
- Admin-Schnellaktionen behalten **mindestens 44px Antippfläche**.
- Mobile Bottom-Dock wird schmaler (Navigationsziele etwa 66px hoch, Symbolflächen etwa 38px, SVG-Icons weiter deutlich erkennbar bei 26px). Schrift und Symboltrennbarkeit dürfen durch die Verkleinerung nicht verloren gehen.
- Administrationsunterseiten (Entwicklungsplan, Systemtest) bekommen geringere Kopfkartenhöhe; **keine Veränderung an eigentlichen Inhalten oder Berechtigungen**.
- Weiterhin hell, strukturiert, leichte LUMEN-Energie: reduzierte Schatten und ruhigere Flächen statt großer Office-Karten.
- **Test:** Quellcode-Syntax und 12 Mock-/DOM-Struktur-/Berechtigungsprüfungen bestanden. Echte iPhone-Abnahme bleibt offen und ist Voraussetzung für grünen Status.

Umgesetzt in `pilot/index.html`, LUMEN `2026.10.08.32`, Commit `ef0b9ae26fcea9acdfb823f5123b0860a7a58aa6`.


## iPhone-Abnahme LUMEN 2026.10.08.32 — bestätigt

Der Nutzer hat die weiter verkleinerte LUMEN-.32-Oberfläche ausdrücklich akzeptiert: „So ist das super“. Die entsprechende Design-Abnahme ist im Entwicklungsplan abgeschlossen (3/3 Prüfungen bestanden, Featurestatus `ready`). **Künftige Quellen-/KI-Funktionen dürfen keine größeren Admin-Karten, zusätzlichen Pflichtdialoge oder neue Büro-Software-Anmutung erzwingen.** Recherche-/Quellenqualität wird im Backend erweitert und durch kompakte, optionale Evidenzhinweise in bestehenden Ergebnissen erklärt.


## LUMEN DEPTH 2026.10.08.41 — ruhiges, räumliches neXaro-Design

**Verbindliche Pilot-Ausführung:** `pilot/lumen-depth.css`, `pilot/lumen-orb.svg`, `pilot/templates/`.
Die separate Unternehmenswebsite und ihre zentralen Seiten bleiben unangetastet.

- **Bildintegrität:** Vom zuletzt freigegebenen Bildschirmmotiv wird ausschließlich der reale Flugzeug-Glaskern als zentriertes 3D-Motiv übernommen. Keine Bildschirmaufnahme als unbewegliche App; Überschriften, Aufgabenfeld, Upload, Starten, Sprachmenü und Navigation bleiben native, bedienbare Controls.
- **Farbhierarchie:** Weiße Keramik und sehr helles Mint dominieren. Dunkelgrüner Text gewährleistet Kontrast. Grün betont den einzigen Hauptbefehl, Orange nur einzelne Orientierungselemente. Keine flächige grelle Neonüberlagerung.
- **Tiefe:** Stufenweise Außen-/Kontaktschatten, innere Lichtkante, subtile Glasränder, ein weicher Bodenreflex unter dem Auftragsfeld. 3D-Effekt nur bei der zentralen Eingabe stärker. Verzicht auf Blend- und Dauerblinken.
- **Netzwerk:** Nur vier leise beschriftete Begriffe um das zentrale Motiv; Bild und Linien sind rein dekorativ und nicht klickbar. Wichtige Textpassagen und Handlungselemente liegen davor.
- **Alle eingebauten Ansichten:** Gemeinsamer CSS-Layer für Zentrale, Unterseiten, Auftragskarten, Dialogkonsistenz, Navigation und Print-Ansichten; die Partnerprofilseite im Pilot-Ordner verwendet dieselben Stilparameter.
- **Mobilgerät:** iOS, Android, macOS und Windows mit kleinen und großen Viewports; Text bleibt im DOM, Mindest-Touchflächen und `prefers-reduced-motion` erhalten. Hintergrunddarstellung darf keine Formulare blockieren.
- **Ausgabekanal:** Druckbares Pilot-Ergebnisdokument und tabellenbasiertes Bestätigungs-Mail-Layout sind als Vorlagen im Repository hinterlegt. Vorlagen dürfen Status niemals als verifiziert ausgeben, solange die fachliche Prüfung fehlt. Platzhalter sicher ersetzen.
- **Wichtige Grenze:** Das E-Mail-Versandsystem in Supabase sowie serverseitige Erzeuger für PDF, DOCX oder andere Formate verwenden die neuen Vorlagen **nicht automatisch**. Erst nach sicherer Pipeline-Integration und realer Testzustellung als vollständig umgesetzt einstufen.

**Technischer Status:** GitHub-Pilot-Frontend und Partnerunterseite angepasst, Artwork integriert, Dokument-/Mailvorlagen bereit. Code-/Strukturtest und echter iPhone-/Android- sowie Versandtest getrennt abnehmen.
