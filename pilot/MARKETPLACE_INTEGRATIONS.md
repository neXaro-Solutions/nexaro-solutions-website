# neXaro Pilot | Angebots- und Affiliate-Engine

**Implementierungsstand:** 2026-10-08 — aktive Such-/Angebotsschnittstelle und Admin-Import für offizielle Partnerfeeds. **Keine aktive Partnerschaft oder Provision ohne Freischaltung annehmen.**

## Produktziel
Die Hauptseite bleibt ein einziges Auftragsfeld. „Vergleiche Preise für …“ wird an die Angebotsansicht geleitet; unter **Mehr → Angebote** kann derselbe Vorgang direkt begonnen werden. Der Nutzer sieht ausschließlich echte, zuordenbare Händlerangebote mit Preis, bekannter Liefergebühr, Quelle, Stand und einem transparent gekennzeichneten Werbelink. Die Sortierung erfolgt nach dem nachweisbaren Gesamtpreis, nie nach Provision.

## Bestehende Anbindung
- `pilot-market` Edge Function (JWT-pflichtig): eBay Browse API, sobald offizielle eBay-App-Zugangsdaten vorliegen. Optional EPN-Campaign-ID; nur die offizielle `itemAffiliateWebUrl` wird als Affiliate markiert.
- Authentifizierte Suche in der Datenbank nach nicht abgelaufenen validierten Produktfeeds.
- 12 vorbereitete Netzwerk-/Marktplatz-Kategorien: eBay, Awin, ADCELL, impact.com, CJ, Tradedoubler, Webgains, Rakuten, Partnerize, belboon, Amazon PartnerNet und lizenzierte Vergleichspartner. Diese Einträge **sind keine zwölf aktiven Verbindungen**.
- `pilot/feed-normalizer.mjs`: browserseitige Verarbeitung und Normalisierung genehmigter CSV-, TSV- und JSON-Produktfeeds, maximal 3 MB / 1.500 Zeilen je Datei. Gültige Datensätze werden in authentifizierten Batches zu höchstens 100 Angeboten importiert.
- **Admin-only**: Angebotsansicht → „Partnerdaten verbinden · Admin“ → Partnerquelle + offizieller Produktfeed → Import. Nie Zugangsschlüssel in CSV/URL oder Chat veröffentlichen.

## Anlieferungsstandard
Produktkennung, Produktname, tatsächlicher Händler, gültiger EUR-Artikelpreis, HTTPS-Produkt- oder Trackinglink. Unbekannte Versandkosten werden **nicht als 0 EUR** angezeigt. Fremdwährungen, unsichere URLs, unvollständige Produkte und nicht plausible Preise werden übersprungen. Affiliate-Tags müssen aus offizieller Partnerdatenquelle stammen.

## Technische Grenzen
- Ohne zugelassene API-Zugangsdaten oder aktuelle offizielle Produktfeeds gibt es keine Angebote; keine Preisbeispiele werden simuliert.
- Hochgeladene Angebote laufen nach 48 Stunden ab. **Regelmäßige automatische Feed-Erneuerung und Preisänderungs-Benachrichtigung sind noch nicht umgesetzt.**
- Partnerprogramme benötigen eigene Registrierung, Genehmigung sowie die jeweilige Berechtigung zur Produktdatennutzung. Ein Trackinglink oder eine Vermittlungsprovision kann nicht erfunden bzw. garantiert werden.
- Produktgleichheit/EAN, Warenverfügbarkeit, Rücksendebedingungen, regionale Steuern und Echtzeitpreise müssen für einen vollwertigen Bestpreisvergleich noch systematisch nachgewiesen werden. Nicht deckungsgleiche Produktmodelle dürfen nicht als identisch dargestellt werden.
- Partnerfeeds nur gemäß Nutzungsbedingungen importieren, keine verdeckten Scraper. Werbliche Links offenlegen; Provisionshöhe darf Ranking nicht verändern.
- Vom Produktpreis vollständig zu unterscheiden sind interne Modell-/Betriebskosten. Diese gehören nicht in die Nutzeransicht.

## Prüfungen
`node pilot/tests/market-contract.mjs` und `node pilot/tests/feed-normalizer-contract.mjs` sind Teil der CI. Ein bestandener Quellcode-/CI-Test ersetzt keinen authentifizierten Import eines echten Partnerfeeds und keinen iPhone-Test.

## Nächster Produktmeilenstein
1. **Einen** freigeschalteten Anbieter (vorzugsweise eBay Browse API oder Awin Produktfeed) mit gültigen Berechtigungen anbinden, reale Preise abrufen und erste getestete Weiterleitung nachweisen.
2. Freigegebene Feed-URLs serverseitig verschlüsselt verwalten und zeitlich gesteuert aktualisieren, mit Validierung, Fehlerbehandlung und Limits.
3. Exakte Produktzuordnung (EAN/GTIN/Modell), Versand nach Lieferregion, Preishistorie und automatische erneute Suche bei Preisänderung hinzufügen.
4. Erst danach weitere Marktplätze/Netzwerke skalieren; Admin-Tests strikt von Kundendaten trennen.
