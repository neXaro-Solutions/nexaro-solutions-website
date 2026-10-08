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
