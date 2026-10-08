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
