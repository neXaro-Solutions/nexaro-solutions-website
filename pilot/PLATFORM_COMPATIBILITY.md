# neXaro Pilot — Plattformkompatibilität

**Produktanforderung (verbindlich):** Die Pilot-Webanwendung muss ihre Kernfunktionen auf aktuellen unterstützten Browsern unter Android, iOS, macOS und Windows anbieten. Eine plattformübergreifende Weboberfläche ist keine installierte native App. Ein funktionierender Desktop-Browser ersetzt keinen realen iOS- oder Android-Gerätetest.

## Mindestumfang
- **Android:** aktuelle Chrome-Version, Smartphones und Tablets, Touch, Foto-/Dateiauswahl und Hoch-/Querformat.
- **iOS / iPadOS:** aktuelle Safari-Version, Touch, Tastatur/Autofill, dynamische Browserleisten, Safe Areas und Datei-/Fotoauswahl.
- **macOS:** aktuelle Safari- und Chrome-Version, Maus, Tastatur, Zoom, skalierbare Fenster.
- **Windows:** aktuelle Edge- und Chrome-Version, Maus, Tastatur, Zoom, unterschiedliche Bildschirmauflösungen.
- **Ergänzend:** Firefox als unabhängige Browser-Engine.

## Akzeptanzkriterien
1. Keine unerwartete horizontale Seitennavigation zwischen 320 und 1920 CSS-Pixeln. Lange Ergebnisse umbrechen; breite Detailtabellen bekommen eigene Scrollflächen.
2. Navigation, Aufträge, Prüfung und Bestätigung bleiben mit Touch **und** Tastatur bedienbar. Touchziele grundsätzlich mindestens 44 CSS-Pixel hoch, wenn möglich.
3. Die Tastatur verdeckt keine entscheidenden Formularaktionen. Mobile Eingaben haben mindestens 16 CSS-Pixel, um den unerwarteten Fokus-Zoom in iOS Safari zu vermeiden.
4. Safe Areas bei Geräten mit Notch/Home-Indikator und dynamische Viewport-Höhen werden berücksichtigt.
5. Flugzeug und Avatar reagieren auf Arbeitsstatus, nicht auf das Betriebssystem. Bei reduzierter Bewegung sind Animationen zurückgenommen.
6. Die Daten- und Auftragsverarbeitung darf nicht abhängig von Browser- oder Geräteerkennung sein. Eine Netzunterbrechung muss sichtbar behandelt werden; abgeschlossene Arbeit bleibt serverseitig erhalten.
7. Login, Zielanlage, Wiederaufnahme, Dateianhang, Freigabe, Ausführung, Ergebnis und Admin-Test werden auf **realen Geräten** vor einer uneingeschränkten Kompatibilitätsfreigabe geprüft.

## Automatisierter technischer Grundtest
`.github/workflows/pilot-compatibility.yml` startet bei Änderungen an Pilot und lässt
`pilot/tests/platform-smoke.mjs` auf Chromium (Linux und Windows), Firefox (Linux) sowie WebKit (Linux und macOS) laufen.

Geprüft werden JS-Syntax, nicht authentifizierte Startseite, Login-Dialog, Eingabefeldgrößen, Enter-Taste, responsive App-Shell und mobile Navigation. Breiten: 320, 390, 412, 768, 1024, 1366 und 1920 CSS-Pixel. Der Test verwendet einen **lokalen Stub für Supabase**, keine echten Zugangsdaten. Er prüft damit noch keine echten Anmeldungen oder produktiven Auftragsprozesse.

**Freigabekriterium:** Alle automatisierten Checks grün **plus** manuelle End-to-End-Tests auf echten Android-, iOS-, Windows- und macOS-Geräten. Erst dann darf die Plattformkompatibilität als vollständig verifiziert bezeichnet werden.

Änderungen in dieser Datei sind nur Dokumentation; maßgeblich sind technische Testergebnisse und reales Verhalten.
