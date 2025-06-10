# SendGrid Seadistamise Juhend

SendGrid on ideaalne lahendus DigitalOcean SMTP blokeerimise probleemile. See kasutab HTTP API-t SMTP portide asemel.

## 🚀 Kiire Seadistamine

### 1. Loo SendGrid Konto
1. Mine: https://sendgrid.com/
2. Kliki "Start for Free"
3. Täida registreerimisform
4. Kinnita e-mail

### 2. Loo API Key
1. Logi SendGrid kontosse
2. Mine: Settings → API Keys
3. Kliki "Create API Key"
4. Vali "Restricted Access"
5. Anna nimi: "Uptime Tracker"
6. Luba õigused:
   - **Mail Send** → Full Access
7. Kliki "Create & View"
8. **KOPEERI API KEY KOHE** (ei näe enam hiljem!)

### 3. Verifitseeri Saatja E-mail
1. Mine: Settings → Sender Authentication
2. Kliki "Verify a Single Sender"
3. Täida vorm oma e-mailiga (joonas.magi@vikk.ee)
4. Kliki "Create"
5. Kontrolli e-maili ja kinnita

### 4. Seadista .env Fail
Asenda .env failis:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=joonas.magi@vikk.ee
SENDGRID_FROM_NAME=Uptime Tracker
```

### 5. Testi Seadistust
```bash
npm start
```

Peaks näitama:
```
📧 SendGrid mode enabled - emails will be sent via SendGrid API
📧 From: Uptime Tracker <joonas.magi@vikk.ee>
✅ SendGrid configuration verified
```

## 📊 SendGrid Eelised

✅ **Ei vaja SMTP porte** - töötab HTTP/HTTPS kaudu  
✅ **Tasuta kuni 100 e-maili/päev** - piisab enamikule  
✅ **Kiire seadistamine** - 5 minutit  
✅ **Usaldusväärsus** - 99.9% uptime  
✅ **Analüütika** - näed, kas e-mailid jõudsid kohale  
✅ **Spam kaitse** - väiksem tõenäosus spam kausta sattumiseks  

## 🔧 Probleemide Lahendamine

### API Key ei tööta
- Kontrolli, et kopeerisid täieliku API key
- Veendu, et "Mail Send" õigus on lubatud
- API key peab algama "SG."

### E-mailid ei lähe välja
- Kontrolli, et saatja e-mail on verifitseeritud
- Vaata SendGrid Activity Feed-i: Activity → Email Activity
- Kontrolli .env faili seadistusi

### "Sender not verified" viga
- Mine Settings → Sender Authentication
- Verifitseeri oma e-mail aadress
- Oota kinnituse e-maili

## 📈 Tasuta Limiidid

- **100 e-maili/päev** tasuta
- **40,000 e-maili esimese kuu** tasuta
- Pärast seda $14.95/kuu 50,000 e-maili eest

## 🔄 Tagasi SMTP-le

Kui tahad hiljem tagasi SMTP-le minna:
```env
EMAIL_PROVIDER=gmail
# või
EMAIL_PROVIDER=mailhog
```

## ✅ Valmis!

Pärast seadistamist saadab Uptime Tracker päris e-maile läbi SendGrid API ilma SMTP portide probleemideta!

**SendGrid töötab ideaalselt DigitalOcean-is! 🎉**
