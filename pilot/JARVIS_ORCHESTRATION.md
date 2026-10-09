# Jarvis in neXaro Pilot

Stand: 09.10.2026. Jarvis ist der interne Koordinator der bestehenden KI-Ausführung, kein angebundener Fremddienst und keine zweite Anwendung.

## Zusammenspiel

`pilot-intelligence` plant im bestehenden Auftrag. `execution-engine` übergibt Aufgabe, bestätigte Entscheidungen, frühere Ergebnisse und Quellen an `best-of-ai`. Dieser bestehende Endpunkt koordiniert nun als Jarvis die eingerichteten Anbieter über `ai-gateway`. Auslieferung, Ergebnisprüfung, Entscheidungen und Zielgedächtnis bleiben in ihren bisherigen Komponenten. Die Planungsanzeige übernimmt tatsächlich gemeldete Modelle statt einer fest eingetragenen Modellkombination.

Aktueller Ausbau: ausschließlich bestehende Anbieter. Zusätzliche Anbieter benötigen nun zusätzlich den ausdrücklich gesetzten globalen Schalter `PILOT_ADDITIONAL_PROVIDERS_ENABLED=true`; ohne ihn bleiben sie deaktiviert, auch wenn frühere einzelne Einstellungen vorliegen.

Ohne vorgegebenen Modus wählt Jarvis automatisch: Routine erhält einen Einzelaufruf mit Ersatz, komplexe Planung einen Vergleich, erkannte rechtliche/medizinische/finanzielle Aufgaben oder angeforderte menschliche Prüfung den strengeren Vergleich. Historische Ergebnisse ändern diese Auswahl nicht. Diese regelbasierte Einordnung ergänzt die bestehende Engine und ersetzt keine vollständige Risikoerkennung.

Routine (`fast_best`): ein validiertes Ergebnis, bei Ausfall höchstens ein anderer Anbieter. Vergleich (`best`): höchstens zwei Anbieter und höchstens eine Zusammenführung. `high_assurance` benötigt zwei tatsächlich unterschiedliche Anbieter und eine erfolgreiche Zusammenführung; andernfalls bleibt die Arbeit offen. Eine Strukturwertung ist kein Faktencheck. Widersprüche und unbelegte Aussagen müssen sichtbar unsicher bleiben. Bestehende Quellen- und Freigabeprüfungen gelten weiterhin.

Die getrennte `pilot-background`-Funktion behält ihren geprüften, eng begrenzten OpenAI-Kreativweg, Arbeitslease und Kostenreservierung. Keine neuen Anbieter werden heimlich in bereits genehmigte Hintergrundjobs eingeschleust. Sensible, externe und nicht unterstützte Aufgaben bleiben im interaktiven Ablauf. Jarvis ersetzt weder Recherche/Originalquellenprüfung noch Canva, Bildgenerierung, Marktportale oder die Hintergrund-Jobverwaltung.

## Anbieter

| Anbieter | Stand der Anbindung | Aktivierung |
| --- | --- | --- |
| OpenAI | Bestehende Responses- und Bildanalyse-Route erhalten | Bestehender `AI_PROVIDER_API_KEY` oder `OPENAI_API_KEY` |
| Claude | Bestehende Messages-Route erhalten | Bestehender `ANTHROPIC_API_KEY` |
| Google Gemini | Text-/JSON-Adapter integriert, isoliert getestet | `GEMINI_API_KEY`, Konfiguration unten |
| Mistral | Text-/JSON-Adapter integriert, isoliert getestet | `MISTRAL_API_KEY`, Konfiguration unten |
| DeepSeek | Text-/JSON-Adapter integriert, isoliert getestet | `DEEPSEEK_API_KEY`, Konfiguration unten |
| Grok | Text-/JSON-Adapter integriert, isoliert getestet | `XAI_API_KEY`, Konfiguration unten |

Für neue Anbieter sind jeweils `PILOT_<ANBIETER>_ENABLED=true`, `PILOT_<ANBIETER>_MODEL`, `PILOT_<ANBIETER>_INPUT_USD_PER_M` und `PILOT_<ANBIETER>_OUTPUT_USD_PER_M` erforderlich. Anbieterpräfixe: `GEMINI`, `MISTRAL`, `DEEPSEEK`, `XAI`. Modell und positive Kostensätze müssen zum freigeschalteten API-Modell passen. Keine automatischen Käufe, Konten, Schlüssel oder Aktivierungen. Schlüssel ausschließlich in serverseitigen Secrets verwalten.

Neue Adapter verwenden feste offizielle HTTPS-Endpunkte; beliebige Proxyadressen werden nicht aus Nutzereingaben übernommen. Die konservative Kostenschätzung vor einem neuen Adapteraufruf darf `PILOT_MAX_PROVIDER_USD` nicht überschreiten (Standard 0,10 USD, maximal 1 USD). Fehlende Tokenzählung wird konservativ geschätzt und gekennzeichnet. Dies ist eine Anfragengrenze, kein Ersatz für das Budget eines Gesamtauftrags. Bestehende Anbieter behalten ihre bisherigen Kostenregeln.

Optionale serverseitige Reihenfolge: `PILOT_PROVIDER_ORDER_GENERAL`, `PILOT_PROVIDER_ORDER_CODE`, `PILOT_PROVIDER_ORDER_ANALYSIS` (kommagetrennte Anbieter-IDs). Nur vollständig eingerichtete Anbieter werden berücksichtigt. Die Reihenfolge ist eine Betriebseinstellung, kein belegtes Qualitätsranking. Jüngste Authentifizierungs-/Kontingentfehler führen zu einer fünfminütigen Pause je Organisation und Anbieter; ein neuer Erfolg hebt ältere Fehler auf.

Perplexity wird in dieser Version nicht als aktiv behauptet: Seine offizielle Dokumentation hat die Sonar-Anbindung auf die Agent API umgestellt. Eine Recherche-Erweiterung muss deren Quellen-/Werkzeugkosten und das bestehende Research-Gateway gesondert berücksichtigen. „Alle großen KIs“ bedeutet hier eine erweiterbare Anbietersteuerung, nicht Zugriff auf nicht eingerichtete Dienste oder eine Verschmelzung von Modellgewichten.

## Ehrliche Zustände und Datenschutz

Admin → Systemtests → Verbindungen & Einzeltests → **Jarvis · KI-Verbund** zeigt Einrichtung oder fehlenden Zugang, fehlendes Modell, fehlende Kostenkonfiguration beziehungsweise Deaktivierung. Die Abfrage ist nur für Admins, enthält keine Schlüssel und löst keine Modellkosten aus. „Eingerichtet“ ist ausdrücklich kein erfolgreicher Live-Test.

Ein expliziter Anbieteraufruf darf nicht unbemerkt zu einem anderen Anbieter wechseln. Vergleich und Abrechnung verwenden die tatsächlich gemeldete Identität. Sensible Aufgaben stoppen vor externer Übertragung auf diesen KI-Routen, bis ein geeigneter lokaler Weg besteht. Externe Aktionen, Versand, Buchungen und menschliche Entscheidungen erhalten keine neuen Berechtigungen.

## Prüfung und Alpha-Abnahme

`node pilot/tests/jarvis-contract.mjs` führt echte Handler mit isolierten Modellantworten und Datenbanken aus: Authentifizierung, Adminstatus, Ausfall/Ersatz, Abkühlzeit, strikte Anbieteridentität, unabhängiger Vergleich, Kosten, sensibles Material, JSON-Fehler und vier neue Adapter. Die vorhandenen Engine-, Kontinuitäts- und Hintergrundtests bleiben bestehen. Die CI prüft die neue Suite automatisch.

Kein produktiver Provider- oder Nutzer-Ende-zu-Ende-Test wird durch diese Simulation ersetzt. `model_routing`, `integration_layer` und die Ausführungs-Alpha bleiben bis zu einem authentifizierten realen Test Alpha. Die unveränderte bestehende `value-proposition-contract.mjs`-Suite scheitert bereits im Ausgangsstand an einer Erwartung zur Unternehmensseiten-Sprachauswahl; die Unternehmensseite wird für diese Arbeit nicht verändert.

Offizielle Schnittstellenreferenzen (geprüft 09.10.2026):

- https://ai.google.dev/gemini-api/docs/openai
- https://docs.mistral.ai/api
- https://api-docs.deepseek.com/en/
- https://docs.x.ai/developers/model-capabilities/legacy/chat-completions
- https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/overview
