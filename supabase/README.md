# Pilot – Backend-Quellcode und Freigaben

Die produktive Supabase-Edge-Function `execution-engine` wurde am 08.10.2026 in **Version 45** nach `supabase/functions/execution-engine/index.ts` gespiegelt. Hier liegen keine Geheimnisse oder Benutzerinformationen; Schlüssel werden in der Laufzeitumgebung verwaltet.

## Änderungsprozess

1. **Versionierten Code aktualisieren**, nicht die produktive Engine unbemerkt überschreiben.
2. **Automatisierte Regressionstests** über `.github/workflows/pilot-engine-guards.yml` erfolgreich ausführen. Diese prüfen den echten Handler in einer isolierten Umgebung mit nachgebildeter Datenbank, ohne Produktivzugriffe oder KI-Kosten.
3. **Manuell eine kontrollierte Veröffentlichung** der konkreten Funktion auf das richtige Supabase-Projekt vornehmen; `verify_jwt = true` erhalten. Kein automatisches Produktionsdeployment beim bloßen GitHub-Push.
4. **Produktive Funktion erneut auslesen**, Quellcode und Versionsnummer vergleichen. Änderungen anderer Entwickler vor einem Deployment zusammenführen.
5. **Reale End-to-End-Tests** mit Testbenutzern und isolierten Testaufträgen ausführen, insbesondere Freigabe, Wiederaufnahme, Doppelklick, Qualitätsprüfung und tatsächlichen Ergebnisabschluss.

## Sicherheitsinvarianten

- Kein Schritt wird vor seinem Vorgänger ausgeführt, auch nicht über direkte API-Aufrufe.
- Entscheidungen mit menschlicher Verantwortung benötigen eine ausdrückliche Bestätigung.
- Externe Schreibaktionen werden nicht stillschweigend ausgeführt.
- Bei fehlgeschlagener Ausführungsinitialisierung darf kein endloser Status `running` verbleiben.
- Ein früherer blockierter Lauf darf nicht einen anderen, schon freigegebenen Schritt blockieren.
- Parallel gestartete Requests sollen dieselbe bestehende Ausführung verwenden und keine Duplikate produzieren.
- Zielerreichung ist erst nach überprüftem Ergebnis, nicht nur nach erledigter Checkliste, bestätigt.

Die Test-Suite ist ein technischer Regressionstest. Sie ersetzt **keinen** vollständigen produktiven Auftrags- oder Sicherheitstest.
