# Uptime Tracker - Kasutajalood

## Projekti ülevaade
Uptime tracker rakendus veebisaitide kättesaadavuse monitoorimiseks, arendatav TDD (Test-Driven Development) meetodil.

---

## 1. Veebisaidi monitooringu lisamine

**Kasutajalugu:** Kasutajana tahan lisada veebisaiti monitooringusse, et saaksin jälgida selle kättesaadavust.

### Aktsepteerimiskriteeriumid:
- [ ] Saan sisestada veebisaidi URL-i (nt. https://example.com)
- [ ] Saan määrata kontrolli intervalli (1 min, 5 min, 15 min, 30 min, 1 tund)
- [ ] Saan anda saidile nime/kirjelduse
- [ ] Süsteem valideerib URL-i formaadi õigsust
- [ ] Saan salvestada monitooringu konfiguratsiooni
- [ ] Kuvatakse kinnitus monitooringu edukast lisamisest

---

## 2. Reaalajas staatuse vaatamine

**Kasutajalugu:** Kasutajana tahan näha kõigi monitooritavate saitide praegust staatust, et teaksin kiiresti, mis on töökorras ja mis mitte.

### Aktsepteerimiskriteeriumid:
- [ ] Kuvatakse kõik monitooritavad saidid loendina
- [ ] Iga saidi juures on nähtav praegune staatus (ONLINE/OFFLINE/UNKNOWN)
- [ ] Kuvatakse viimase kontrolli aeg
- [ ] Kuvatakse vastuse aeg millisekundites
- [ ] Online saidid on roheliselt märgitud
- [ ] Offline saidid on punaselt märgitud
- [ ] Leht uueneb automaatselt iga 30 sekundi järel

---

## 3. Uptime statistika vaatamine

**Kasutajalugu:** Kasutajana tahan näha konkreetse saidi uptime statistikat erinevate ajaperioodide kohta, et saaksin hinnata selle usaldusväärsust.

### Aktsepteerimiskriteeriumid:
- [ ] Saan valida saidi klõpsates selle detailvaatesse
- [ ] Kuvatakse uptime protsent viimase 24 tunni, 7 päeva ja 30 päeva kohta
- [ ] Kuvatakse keskmine vastuse aeg valitud perioodil
- [ ] Kuvatakse katkestuste arv ja kogukestus
- [ ] Statistika arvutatakse õigesti monitooringu andmete põhjal
- [ ] Andmed kuvatakse selgelt loetavas formaadis

---

## 4. Sisenematu saidi teavitused

**Kasutajalugu:** Kasutajana tahan saada teavitust, kui mõni monitooritav sait muutub kättesaamatuks, et saaksin kiiresti reageerida.

### Aktsepteerimiskriteeriumid:
- [ ] Süsteem tuvastab, kui sait ei vasta 3 järjestikuse kontrolli jooksul
- [ ] Saan seadistada e-maili aadressi teavituste saamiseks
- [ ] Saan valida, milliste saitide kohta teavitusi saan
- [ ] Teavitus saadetakse 5 minuti jooksul pärast probleemi tuvastamist
- [ ] Teavituses on kirjas saidi nimi, URL ja probleem
- [ ] Saan hiljem teavituse, kui sait on taas kättesaadav

---

## 5. Monitooringu haldamine

**Kasutajalugu:** Kasutajana tahan hallata olemasolevaid monitooringe, et saaksin konfiguratsiooni muuta või mittevajalikke eemaldada.

### Aktsepteerimiskriteeriumid:
- [ ] Saan vaadata kõigi monitooringute nimekirja
- [ ] Saan muuta monitooringu nime ja kontrolli intervalli
- [ ] Saan monitooringu ajutiselt peatada ja taas käivitada
- [ ] Saan monitooringu jäädavalt kustutada
- [ ] Kustutamisel küsitakse kinnitust
- [ ] Muudatused jõustuvad koheselt
- [ ] Kuvatakse kinnitus muudatuste salvestamisest

---

## TDD Arendusprotsess

### Soovitatud järjekord implementeerimiseks:
1. **Veebisaidi monitooringu lisamine** - põhifunktsionaalsus
2. **Reaalajas staatuse vaatamine** - kasutajaliides ja andmete kuvamine
3. **Monitooringu haldamine** - CRUD operatsioonid
4. **Uptime statistika vaatamine** - andmeanalüüs ja aruandlus
5. **Sisenematu saidi teavitused** - teavituste süsteem

### TDD sammud iga kasutajaloo jaoks:
1. **Red** - Kirjuta test, mis ebaõnnestub
2. **Green** - Kirjuta minimaalne kood, et test läbiks
3. **Refactor** - Paranda koodi kvaliteeti, hoides teste rohelised

---

## Tehnilised märkused

- Kõik aktsepteerimiskriteeriumid peaksid olema kaetud automatiseeritud testidega
- Kasuta checkboxe märkimaks valmis kriteeriumeid
- Iga kasutajaloo võib jagada väiksemateks alamülesanneteks
- Dokumenteeri testijuhtumid ja nende tulemused