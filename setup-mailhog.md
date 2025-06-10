# MailHog Setup Guide

MailHog on suurepärane tööriist e-maili testimiseks arenduse ajal. See püüab kõik saadetud e-mailid kinni ja näitab neid mugavas web liideses.

## Kiire seadistamine

### 1. Installi MailHog

**Windows (Go-ga):**
```bash
go install github.com/mailhog/MailHog@latest
```

**Windows (ilma Go-ta):**
1. Lae alla MailHog: https://github.com/mailhog/MailHog/releases
2. Pane `MailHog.exe` PATH-i või projekti kausta

**macOS:**
```bash
brew install mailhog
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install golang-go
go install github.com/mailhog/MailHog@latest

# Või lae alla binary
wget https://github.com/mailhog/MailHog/releases/download/v1.0.1/MailHog_linux_amd64
chmod +x MailHog_linux_amd64
sudo mv MailHog_linux_amd64 /usr/local/bin/mailhog
```

### 2. Käivita MailHog

```bash
MailHog
```

Näed väljundit:
```
[HTTP] Binding to address: 0.0.0.0:8025
[SMTP] Binding to address: 0.0.0.0:1025
```

### 3. Seadista Uptime Tracker

Loo `.env` fail:
```bash
cp .env.example .env
```

Veendu, et `.env` failis on:
```env
EMAIL_PROVIDER=mailhog
```

### 4. Käivita Uptime Tracker

```bash
npm start
```

### 5. Testi e-maili saatmist

1. Mine: http://localhost:3000/settings/notifications
2. Sisesta suvaline e-mail (nt. `test@example.com`)
3. Vali saidid, mida jälgida
4. Salvesta seaded
5. Simuleeri saidikatkestust või oota, kuni mõni sait läheb alla

### 6. Vaata e-maile

Mine: http://localhost:8025

Näed kõiki saadetud e-maile koos:
- HTML ja teksti versioonidega
- Päistega
- Manustega (kui on)

## Eelised

✅ **Lokaalne** - ei vaja internetiühendust  
✅ **Kiire** - kohesed tulemused  
✅ **Turvaline** - e-mailid ei lähe kuhugi  
✅ **Mugav** - web liides  
✅ **Realistlik** - käitub nagu päris SMTP server  

## Probleemide lahendamine

**MailHog ei käivitu:**
- Kontrolli, kas port 1025 ja 8025 on vabad
- Proovi käivitada administraatori õigustega

**E-maile ei saabu:**
- Kontrolli, kas MailHog töötab (http://localhost:8025)
- Vaata Uptime Tracker konsooli logisid
- Veendu, et EMAIL_PROVIDER=mailhog

**Go ei ole installitud:**
- Installi Go: https://golang.org/dl/
- Või lae alla MailHog binary otse GitHubist
