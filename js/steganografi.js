/*
 * steganografi.js
 * Bir fotoğrafın piksellerine şifreli mesaj gömer ve geri çıkarır.
 * Tarayıcıda, sunucusuz çalışır. Dışa açılan tek şey aşağıdaki Steganografi
 * nesnesidir; arayüz kodu (arayuz.js) yalnızca onu kullanır.
 */
(function (global) {
  "use strict";

  // Gömülen verinin başına konan imza. Çözerken "bu resimde bizim paketimiz
  // var mı" sorusunu buna bakarak yanıtlıyoruz: 'S' ve 'G' harfleri.
  var IMZA = [0x53, 0x47];

  // Paketin yapısı (hepsi arka arkaya, bit bit piksellere yazılır):
  //
  //   [ imza 2 bayt ][ uzunluk 4 bayt ][ tuz 16 ][ iv 12 ][ şifreli metin ... ]
  //   \___ başlık: 6 bayt ___/          \_________ gövde __________________/
  //
  var BASLIK_BAYT = 2 + 4;   // imza + uzunluk alanı
  var TUZ_BAYT = 16;         // PBKDF2 için rastgele tuz
  var IV_BAYT = 12;          // AES-GCM için rastgele başlangıç vektörü
  var GOVDE_BASI = TUZ_BAYT + IV_BAYT; // şifreli metin bu bayttan sonra başlar

  var PBKDF2_TUR = 150000;   // parolayı anahtara çevirirken yapılan tur sayısı

  // --- Şifreleme katmanı -----------------------------------------------------

  // Parola + tuzdan AES-256 anahtarı üretir. Aynı parola bile farklı tuzla
  // farklı anahtar verir; bu yüzden tuzu her mesajda yeniden rastgele seçiyoruz.
  async function anahtarUret(parola, tuz) {
    var parolaBaytlari = new TextEncoder().encode(parola);

    var hamAnahtar = await crypto.subtle.importKey(
      "raw",
      parolaBaytlari,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: tuz,
        iterations: PBKDF2_TUR,
        hash: "SHA-256"
      },
      hamAnahtar,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Metni şifreler ve [ tuz | iv | şifreli metin ] biçiminde tek bir bayt
  // dizisi (gövde) döndürür. Çözerken tuz ve iv'yi bu gövdenin başından okuruz.
  async function mesajiSifrele(mesaj, parola) {
    var tuz = crypto.getRandomValues(new Uint8Array(TUZ_BAYT));
    var iv = crypto.getRandomValues(new Uint8Array(IV_BAYT));

    var anahtar = await anahtarUret(parola, tuz);

    var sifreliMetin = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        anahtar,
        new TextEncoder().encode(mesaj)
      )
    );

    var govde = new Uint8Array(GOVDE_BASI + sifreliMetin.length);
    govde.set(tuz, 0);
    govde.set(iv, TUZ_BAYT);
    govde.set(sifreliMetin, GOVDE_BASI);
    return govde;
  }

  // Gövdeyi geri çözer. Tuz ve iv baştaki sabit bayt sayısından okunur,
  // kalan kısım şifreli metindir. Parola yanlışsa AES-GCM burada hata fırlatır.
  async function mesajiSifreCoz(govde, parola) {
    var tuz = govde.slice(0, TUZ_BAYT);
    var iv = govde.slice(TUZ_BAYT, GOVDE_BASI);
    var sifreliMetin = govde.slice(GOVDE_BASI);

    var anahtar = await anahtarUret(parola, tuz);

    var cozulen = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      anahtar,
      sifreliMetin
    );

    return new TextDecoder().decode(cozulen);
  }

  // --- Piksel katmanı (LSB) --------------------------------------------------

  // Bu fotoğrafa kaç karakter sığar? Her pikselde R, G, B kanallarının son
  // bitini kullanıyoruz: piksel başına 3 bit, yani 3 bayt için 8 piksel.
  // Başlık + gövdenin payını da düşüyoruz.
  function karakterKapasitesi(resimVerisi) {
    var bitSayisi = resimVerisi.width * resimVerisi.height * 3;
    return Math.floor(bitSayisi / 8) - BASLIK_BAYT;
  }

  // Bir baytın istenen bitini (en soldaki = 7, en sağdaki = 0) döndürür.
  function baytinBiti(bayt, bitSira) {
    return (bayt >> (7 - bitSira)) & 1;
  }

  // Tek bir biti, piksel verisinin ilgili renk kanalının son bitine yazar.
  // RGBA sırası olduğundan her piksel 4 bayttır; alfa (saydamlık) atlanır.
  function bitiYaz(pikselVerisi, mutlakBitSira, bit) {
    var pikselSira = Math.floor(mutlakBitSira / 3);
    var kanal = mutlakBitSira % 3; // 0:R 1:G 2:B
    var dizin = pikselSira * 4 + kanal;
    pikselVerisi[dizin] = (pikselVerisi[dizin] & 0xfe) | bit;
  }

  // Aynı adres hesabıyla tek bir biti geri okur.
  function bitiOku(pikselVerisi, mutlakBitSira) {
    var pikselSira = Math.floor(mutlakBitSira / 3);
    var kanal = mutlakBitSira % 3;
    var dizin = pikselSira * 4 + kanal;
    return pikselVerisi[dizin] & 1;
  }

  // Başlık + gövdeyi tek bir pakete toplar. Uzunluk 4 bayta büyük-uçlu
  // (big-endian) yazılır, böylece çözerken kaç bayt okuyacağımızı biliriz.
  function paketHazirla(govde) {
    var paket = new Uint8Array(BASLIK_BAYT + govde.length);
    paket[0] = IMZA[0];
    paket[1] = IMZA[1];

    var uzunluk = govde.length;
    paket[2] = (uzunluk >>> 24) & 0xff;
    paket[3] = (uzunluk >>> 16) & 0xff;
    paket[4] = (uzunluk >>> 8) & 0xff;
    paket[5] = uzunluk & 0xff;

    paket.set(govde, BASLIK_BAYT);
    return paket;
  }

  // Bir dizi bayttan belirtilen sayıda bit okuyup yeni bir bayt dizisi kurar.
  // Başlığı ve ardından gövdeyi geri toplamak için kullanılır.
  function bitleriTopla(pikselVerisi, baslangicBiti, bitAdedi) {
    var cikti = new Uint8Array(bitAdedi / 8);
    for (var n = 0; n < bitAdedi; n++) {
      var bit = bitiOku(pikselVerisi, baslangicBiti + n);
      cikti[n >> 3] |= bit << (7 - (n & 7));
    }
    return cikti;
  }

  // --- Dışa açılan iki ana işlem ---------------------------------------------

  // Mesajı şifreler, paketler ve piksellerin son bitlerine gömer.
  // Gelen resim verisini yerinde değiştirir. Mesaj sığmazsa "kapasite" hatası
  // fırlatır. Ayrıca gömdüğümüz her pikselin alfasını 255 (tam opak) yaparız;
  // saydam pikseller PNG'ye yazılırken renk bitlerini bozabildiği için.
  async function mesajiGom(resimVerisi, mesaj, parola) {
    var govde = await mesajiSifrele(mesaj, parola);
    var paket = paketHazirla(govde);

    var veri = resimVerisi.data;
    var gerekenBit = paket.length * 8;
    var kullanilabilirBit = Math.floor(veri.length / 4) * 3;
    if (gerekenBit > kullanilabilirBit) {
      throw new Error("kapasite");
    }

    var yazilanBit = 0;
    for (var i = 0; i < veri.length; i += 4) {
      for (var kanal = 0; kanal < 3; kanal++) {
        if (yazilanBit < gerekenBit) {
          var bit = baytinBiti(paket[yazilanBit >> 3], yazilanBit & 7);
          veri[i + kanal] = (veri[i + kanal] & 0xfe) | bit;
          yazilanBit++;
        }
      }
      veri[i + 3] = 255; // alfa
    }

    return resimVerisi;
  }

  // Resimden paketi çıkarır ve mesajı döndürür.
  // Önce başlığı (48 bit) okur; imza tutmuyorsa "yok" hatası fırlatır. Sonra
  // uzunluk kadar gövdeyi okuyup şifreyi çözer.
  async function mesajiCikar(resimVerisi, parola) {
    var veri = resimVerisi.data;

    var baslik = bitleriTopla(veri, 0, BASLIK_BAYT * 8);
    if (baslik[0] !== IMZA[0] || baslik[1] !== IMZA[1]) {
      throw new Error("yok");
    }

    var uzunluk =
      (baslik[2] << 24) | (baslik[3] << 16) | (baslik[4] << 8) | baslik[5];

    var kullanilabilirBit = Math.floor(veri.length / 4) * 3;
    if (uzunluk <= 0 || BASLIK_BAYT * 8 + uzunluk * 8 > kullanilabilirBit) {
      throw new Error("yok");
    }

    var govde = bitleriTopla(veri, BASLIK_BAYT * 8, uzunluk * 8);
    return mesajiSifreCoz(govde, parola);
  }

  // Arayüzün ve testlerin eriştiği tek nokta.
  global.Steganografi = {
    karakterKapasitesi: karakterKapasitesi,
    mesajiGom: mesajiGom,
    mesajiCikar: mesajiCikar
  };
})(window);
