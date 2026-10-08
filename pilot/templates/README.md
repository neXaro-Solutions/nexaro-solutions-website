# Pilot · LUMEN-Ausgabevorlagen (2026-10-08)
Nur für neXaro Pilot. **Keine** Veränderungen an der Unternehmenswebsite.
- `pilot-document.html`: eigenständige, druckbare Ergebnisansicht; mobile und A4. Platzhalter müssen durch verifizierte Auftragsdaten ersetzt werden. `body_html_sanitized` und `source_list_html_sanitized` dürfen ausschließlich aus HTML-Sanitizern stammen (niemals ungeprüfte Nutzereingaben einfügen).
- `pilot-email-confirmation.html`: kompatible Tabellen-E-Mail für die Pilot-Kontobestätigung. `email_escaped` und `confirmation_url_attr_escaped` müssen vor Einfügen kontextgerecht HTML-escaped werden. Keine Marketingbeweise oder erfundenen Systemfortschritte.
- Farbwerte, 3D-Glasflächen und Bildmotiv sind mit `pilot/lumen-depth.css` und `pilot/lumen-orb.svg` abgestimmt.
- **Integrationsstatus:** Vorlagen liegen als Quelldateien bereit; die bestehende Supabase-Versandfunktion `pilot-register` und externe E-Mail-/Dokumentdienste sind damit **noch nicht** umgestellt. Ein Live-Rollout benötigt eine gesonderte Änderung an der jeweiligen Ausgabe-Pipeline und End-to-End-Test.
- Bestehende PDF/DOCX/ZIP-Dateien werden durch das Frontend-Thema nicht rückwirkend umgestaltet. Das Layout muss beim Erstellen des Lieferobjekts angewendet werden.
