# neXaro Pilot · Angebotsintelligenz / Affiliate-Netzwerk

**Stand 2026-10-08.** Angebote über neutrale Preis-/Versandinformationen anzeigen und bei bestehender Partnerschaft korrekt gekennzeichnete Affiliate-Links verwenden. Keine erfundenen Quellen oder Preise.

## Tatsächlich implementiert
- Pilot-Oberfläche in pilot/index.html: Mehr → Angebote vergleichen. Direkte Preissuchbefehle gehen in die Angebotsuche, normale Arbeitsaufträge bleiben erhalten.
- Edge Function pilot-market: JWT-Authentifizierung, Benutzerprüfung via Supabase Auth, Admin-only Feed-Import, Server-Rate-Limit 12 Suchanfragen pro Minute.
- Datenbanktabellen pilot_market_sources, pilot_market_offers, pilot_market_rate mit aktivierter Row-Level-Security; kein direkter Zugriff für gewöhnliche Nutzer.
- eBay Browse API / DE / EUR: live nur, wenn EBAY_CLIENT_ID und EBAY_CLIENT_SECRET als Supabase-Secrets konfiguriert sind. Affiliate-Link nur mit EBAY_EPN_CAMPAIGN_ID und von eBay tatsächlich gelieferter itemAffiliateWebUrl.
- Gemeinsamer normalisierter Feed-Import für Awin, ADCELL, impact.com, CJ Affiliate, Tradedoubler, Webgains, Rakuten Advertising, Partnerize, belboon, Amazon PartnerNet und lizenzierte Vergleichspartner. Ein registrierter Anbieter bedeutet NICHT, dass seine Partnerschaft freigeschaltet ist.
- Preis: EUR, Anbieter, Händler, Prüfzeitpunkt und HTTPS-Link; Gesamtpreis nur bei bekannten Versandkosten. Nach 48 Stunden laufen indexierte Angebote automatisch aus.
- Keine automatische Bestellung. Provisionshöhe ist kein Rankingfaktor; Affiliate-Links tragen Werbelink und sponsored-Kennzeichnung.

## Aktivierung
1. Als Betreiber Publisher-Freigaben und ggf. Zulassungen einzelner Händler einholen.
2. eBay-API-Client und EPN-Kampagne anlegen; serverseitige Secrets setzen, niemals im Frontend oder GitHub.
3. Offizielle Awin- und Netzwerk-Produktfeeds über die authentifizierte Admin-Import-Operation in pilot-market normalisiert einspeisen. Beispiel-Payload: operation=import, source=awin, offers=[{external_id,name,merchant,url,price_eur,shipping_eur,affiliate,condition,keywords}]. Pro Request max. 150. Die automatische Feed-Synchronisation ist noch offen.
4. Vergleichsportale wie idealo, Geizhals und CHECK24 dürfen nur mit entsprechenden Partner- oder API-Rechten direkt angebunden werden. Kein unautorisiertes Scraping.

## Abnahme
Datenbank, Backend und Frontend sind im Projekt umgesetzt. Quelltext-/Vertragstests prüfen Routing, Syntax, Escape, Preis-/Versanddarstellung und Affiliate-Hinweise. Noch offen: echte Partnerdaten/Keys, produktiver Live-Suchlauf, Weiterleitungstest, provisionsfähige Testtransaktion, reale iOS/Android-Abnahme. Keine Behauptung globaler Bestpreise oder bestehender Provisionserträge. Die automatische Rechercheintegration in Businessplan-/Beschaffungs-Ergebnisse ist Folgeschritt.
