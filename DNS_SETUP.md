# DNS-Verwaltung für ecrumedia.com

## 🎯 Setup-Übersicht

**DNS-Verwaltung:** Hetzner (primär)  
**Server/Hosting:** sPanel (78.46.76.56)  
**Nameserver:** `ns1.56.76.46.78.clients.your-server.de` & `ns2.56.76.46.78.clients.your-server.de`

---

## ⚠️ WICHTIG: Doppelte Verwaltung

Für neue Subdomains müssen Sie **BEIDE** Systeme konfigurieren:

### 1️⃣ Bei Hetzner DNS (DNS-Eintrag)
- Gehen Sie zu: https://dns.hetzner.com
- Wählen Sie Zone: `ecrumedia.com`
- Fügen Sie A-Record hinzu

### 2️⃣ In sPanel (Web-Konfiguration)
- Gehen Sie zu: https://dashboard.ecrumedia.com
- Domains → Subdomains → Neue Subdomain
- Konfigurieren Sie Verzeichnis, SSL, etc.

---

## 📋 Aktuelle DNS-Einträge (Hetzner)

### Haupt-Domain & Server
```
A       @                   78.46.76.56         (Hauptdomain)
A       www                 78.46.76.56         (WWW-Alias)
```

### Subdomains (Wichtig - NICHT löschen!)
```
A       dashboard           78.46.76.56         (sPanel-Zugang!)
A       ketchhub            78.46.76.56         (Projekt)
A       platform            78.46.76.56         (Projekt) ← NEU HINZUFÜGEN!
CNAME   cloud               ecrumedia.synology.me.  (Synology NAS)
CNAME   ecrumedia.com       custom-domain.linkdrip.com  (Linkdrip Service)
```

### Mail & Services
```
CNAME   autoconfig          mail.your-server.de.
SRV     _submission._tcp    0 100 587 mail.your-server.de.
SRV     _autodiscover._tcp  0 100 443 mail.your-server.de.
SRV     _pop3s._tcp         0 100 995 mail.your-server.de.
SRV     _imaps._tcp         0 100 993 mail.your-server.de.
```

### Nameserver
```
NS      @                   ns1.56.76.46.78.clients.your-server.de.
NS      @                   ns2.56.76.46.78.clients.your-server.de.
```

### Security (SPF, DKIM, DMARC)
```
TXT     @                   "v=spf1 +a +mx ?all"
TXT     default2501._domainkey  "v=DKIM1; p=MIIBIjANBgk..."
```

---

## 🆕 Neue Subdomain hinzufügen - Checkliste

### Schritt 1: Hetzner DNS
- [ ] Login: https://dns.hetzner.com
- [ ] Zone auswählen: `ecrumedia.com`
- [ ] Klick: "Add Record"
- [ ] Type: `A`
- [ ] Name: `subdomain` (z.B. `platform`)
- [ ] Value: `78.46.76.56`
- [ ] TTL: `7200`
- [ ] Speichern

### Schritt 2: sPanel
- [ ] Login: https://dashboard.ecrumedia.com
- [ ] Gehe zu: Domains → Subdomains
- [ ] Klick: "Create Subdomain"
- [ ] Name: `subdomain.ecrumedia.com`
- [ ] Document Root: `/home/site22570/subdomain`
- [ ] SSL: Auto (Let's Encrypt)
- [ ] Speichern

### Schritt 3: Warten & Testen
- [ ] Warte 5-10 Minuten (DNS-Propagation)
- [ ] Test: `dig subdomain.ecrumedia.com`
- [ ] Test: Browser öffnen `https://subdomain.ecrumedia.com`

---

## 🔧 Troubleshooting

### Problem: "ERR_NAME_NOT_RESOLVED"
**Ursache:** DNS-Eintrag fehlt bei Hetzner  
**Lösung:** A-Record bei Hetzner hinzufügen (siehe oben)

### Problem: "404 Not Found"
**Ursache:** Subdomain nicht in sPanel konfiguriert  
**Lösung:** Subdomain in sPanel anlegen

### Problem: "SSL Certificate Error"
**Ursache:** SSL noch nicht ausgestellt  
**Lösung:** In sPanel: SSL Manager → Let's Encrypt für Subdomain aktivieren

### Problem: DNS-Änderung dauert zu lange
**Test:** `dig @ns1.56.76.46.78.clients.your-server.de subdomain.ecrumedia.com`  
Wenn dort die IP erscheint, ist es nur Cache/Propagation → warten

---

## 📊 DNS-Propagation prüfen

```bash
# Lokaler DNS-Cache
dig platform.ecrumedia.com +short

# Direkt vom Nameserver
dig @ns1.56.76.46.78.clients.your-server.de platform.ecrumedia.com +short

# Google DNS
dig @8.8.8.8 platform.ecrumedia.com +short

# Cloudflare DNS
dig @1.1.1.1 platform.ecrumedia.com +short
```

---

## 🚀 Quick Commands

```bash
# Alle Subdomains anzeigen
dig ecrumedia.com ANY

# Nameserver prüfen
dig NS ecrumedia.com +short

# Subdomain testen
curl -I https://platform.ecrumedia.com

# DNS-Cache leeren (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## 📞 Support

- **Hetzner DNS:** https://dns.hetzner.com
- **sPanel:** https://dashboard.ecrumedia.com
- **Server IP:** 78.46.76.56
- **SSH Port:** 6543
