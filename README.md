# foto-gizle

Bir fotoğrafın içine mesaj saklayan küçük bir araç. Mesajı parolayla
şifreleyip fotoğrafın piksellerine gömüyor; aynı parolayı bilen de geri
çıkarıyor. Her şey tarayıcıda oluyor — sunucu yok, kayıt yok.

Canlı deneymek için `index.html`'i tarayıcıda açman yeterli.

## Nasıl çalışıyor

Yöntem LSB steganografisi: her pikselin kırmızı, yeşil ve mavi değerinin en
küçük biti, mesajın bitleriyle değiştiriliyor. Renk gözle fark edilmeyecek
kadar az oynuyor (örneğin mavi 182'den 183'e gidiyor) ama o son bit artık
mesajı taşıyor.

Mesaj gömülmeden önce parolandan türetilen bir anahtarla AES-256-GCM ile
şifreleniyor (anahtar PBKDF2 ile üretiliyor). Yani biri fotoğrafta gizli veri
olduğunu sezse bile, parola olmadan içeriği okuyamıyor.

Çıktı her zaman PNG: JPEG sıkıştırması son bitleri bozacağı için.

## Dosyalar

    index.html          sayfa
    css/stil.css        görünüm
    js/steganografi.js  çekirdek: şifreleme + gizleme/çözme
    js/arayuz.js        sayfa ile bağlantı (butonlar, dosya, sekmeler)

Mantık `js/steganografi.js` içinde duruyor ve sayfadan bağımsız: dışarıya
`window.Steganografi` üzerinden `karakterKapasitesi`, `mesajiGom` ve
`mesajiCikar` fonksiyonlarını veriyor. `js/arayuz.js` yalnızca bunları
butonlara bağlıyor.

