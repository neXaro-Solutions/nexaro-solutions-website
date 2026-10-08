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
