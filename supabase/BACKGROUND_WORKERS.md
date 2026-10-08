# Pilot – dauerhaft laufende Hintergrundaufträge (Oktober 2026)

## Produktversprechen und Grenzen

Ein expliziter Klick auf **Pilot starten** aktiviert eine serverseitige, dauerhafte
Auftragswarteschlange für das ausgewählte Ziel. Der Browser ist danach nur
Beobachter; Benutzer können Android, iOS, macOS und Windows schließen.
Der Job läuft bis zum nächsten Sicherheits-, Qualitäts-, Budget- oder
Freigabepunkt, nicht unbegrenzt oder unkontrolliert.

**Freigabe Version 1:** maximal 6 risikoarme Kreativtext-Aufgaben in
24 Stunden, 0,25 USD geschätztes KI-Kostenbudget, max. 1 reservierte
Modellanfrage gleichzeitig pro Job. Textliche Logo-Konzepte sind **keine
Grafikdateien**. Marktdaten, Rechts-, Steuer-, Gesundheits- oder
Finanzinformationen werden **nicht** autonom behauptet oder als amtlich
verifiziert markiert. Kein Bezahlen, Veröffentlichen, Versenden, Löschen,
Buchen oder sonstiger externer Schreibzugriff.

Benutzerentscheidungen bleiben im append-only Entscheidungsjournal;
ohne explizite Bestätigung kein Überschreiben. Gespeicherte Entscheidungen
werden nur im eigenen Projektkontext berücksichtigt.

## Technische Komponenten

- **DB** `public.pilot_background_jobs` hält Besitzer, Ziel, Status,
  Schritte, reserviertes/geschätztes Budget, Ablaufdatum und atomaren Lease.
  User dürfen ihre eigenen Jobs nur lesen (RLS), nicht in Eigenregie ändern.
- **Credential** `pilot_internal.worker_credentials` enthält einen
  vom Server generierten Zufallstoken, der niemals in den GitHub-Quellcode,
  Browser oder Protokoll-Ausgaben kopiert werden darf.
- **Cron** `pilot-background-dispatch` ruft die Edge Function jede Minute
  durch `pg_net` auf. Die SQL-Anweisung liest den Token nur serverseitig.
- **Service-RPCs** `pilot_background_verify_token`,
  `pilot_background_claim` und `pilot_background_reap` sind ausschließlich
  für `service_role` freigegeben. Eine abgelaufene Lease wird **nicht**
  automatisch kostenpflichtig wiederholt, sondern zur Prüfung angehalten.
- **Edge Function** `pilot-background` hat `verify_jwt=false`, weil
  Cron keinen Benutzer-JWT besitzt. **Wichtig:** Der Tick wird dennoch
  immer durch den geheimen Worker-Token und den beschränkten
  service-role-RPC geprüft; Benutzeraktionen verifizieren ihr eigenes JWT
  mit Supabase Auth **und** die Eigentümerschaft des Ziels.
- **Frontend** `pilot/index.html` registriert einen begrenzten
  Hintergrundjob beim bewussten Start, zeigt dessen Stand und bietet
  Pause/Fortsetzen. Status wird aus der Datenbank gelesen; bei
  Benutzerübergabe landet der Avatar.

## Zustände

`queued → running → queued` solange erlaubte Schritte und Budget offen sind;
`waiting_user` bei riskanten/externalen/unklaren Schritten,
Qualitätsmängeln, einem Konflikt oder unklarer Lease;
`completed` bei erschöpfter Freigabe, abgelaufenen 24h oder keiner Arbeit;
`paused` auf Nutzerwunsch.

Ein bereits begonnener oder auf Freigabe wartender Goal-Lauf sperrt
jede weitere parallele kostenpflichtige Hintergrundausführung.
Kosten werden **vor** jedem Modellaufruf konservativ reserviert.
Modellschritte werden bei Crash, Timeout oder unklarer Abrechnung
**nicht** blind erneut ausgeführt.

## Freigabeprüfung

1. `node pilot/tests/background-contract.mjs` und
   `node pilot/tests/engine-contract.mjs` via GitHub Actions.
2. Prüfen, dass `pg_cron` aktiv ist und `net._http_response.status_code=200`
   für die Tick-Aufrufe meldet; ein erfolgreicher Cron-SQL-Lauf
   **allein** beweist noch keinen erfolgreichen HTTP-Worker.
3. RLS und GRANTs kontrollieren: anon keine Job-Leserechte;
   authenticated nur SELECT im eigenen Ziel; Service-RPCs nur
   service_role.
4. Mit einem **separaten Testkonto** realen Start, 24h-Laufzeit,
   Pause, Wiederaufnahme, Sessionablauf, Doppelstart, Gerätewechsel,
   Quellen-/User-Freigabe, Modellausfall und Qualitätsprüfung testen.
   Die isolierte CI simuliert diese Umstände und ersetzt keine
   echten Produktivtests.
5. Die komplette allgemeine Execution Engine benutzt aktuell
   benutzergebundene Authentifizierung. Den Hintergrundmodus
   **nicht** einfach mit user JWT, refresh token oder Service-Key
   an diese Endpunkte anbinden. Für weitere autonome Fähigkeiten
   explizit delegierte, pro Aktion beschränkte Service-Operations
   mit eigenem Sicherheits- und Quality-Gate implementieren.

## Zukünftige Ausbaupunkte

Benachrichtigung bei erforderlichen Entscheidungen, echte grafische
Artefakte, Recherche mit belastbaren Quellen, weitere zulässige
Aktionstypen, vollständige E2E-Tests und belastbare
Provider-Kostenabrechnung. Keine dieser Funktionen wird durch
den gegenwärtigen Hintergrundmodus bereits zugesichert.
