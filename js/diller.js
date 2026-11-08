/*
 * diller.js
 * Sayfanın iki dilli (English / Türkçe) çalışmasını sağlar.
 * Varsayılan dil İngilizce; Türkçe seçilebilir. Seçim localStorage'da ve
 * adres çubuğunda ?lang= olarak tutulur, böylece paylaşılan bağlantı da
 * doğru dili açar.
 *
 * Statik metinler HTML'de data-i18n (metin), data-i18n-ph (placeholder) ve
 * data-i18n-aria (aria-label) ile işaretlidir. Arayüzün çalışırken ürettiği
 * mesajlara ise js/arayuz.js, window.Dil.metin(anahtar) ile ulaşır.
 */
(function (global) {
  "use strict";

  var ceviriler = {
    en: {
      "meta.baslik": "Hidden Message — hide a message inside a photo",
      "meta.aciklama": "Hide your message inside a photo and lock it with a password. Everything happens in your browser; nothing is stored. Open source.",

      "nav.marka": "Hidden Message",

      "hero.baslik": "Hide a message inside a photo",
      "hero.alt": "The message you type is hidden inside the colors of a photo. The photo looks exactly the same; only someone who knows the password can open it. Everything happens on this page, in your browser.",
      "hero.gizleBtn": "Hide a message",
      "hero.nasilLink": "How does it work?",
      "hero.gorselAria": "A cyanotype landscape",
      "hero.altyazi": "This frame may hold a hidden message — you can't tell by looking.",

      "sekme.gizle": "Hide",
      "sekme.coz": "Reveal",

      "gizle.birak": "Choose a photo or drop it here",
      "gizle.birakIpucu": "PNG or JPG",
      "gizle.mesajLabel": "Message to hide",
      "gizle.mesajPh": "Type here…",
      "gizle.parolaLabel": "Password",
      "gizle.parolaPh": "This password will be needed to open it",
      "gizle.btn": "Hide and download",

      "coz.birak": "Choose the photo that carries a hidden message",
      "coz.birakIpucu": "usually gizli.png",
      "coz.parolaLabel": "Password",
      "coz.parolaPh": "The password used when hiding",
      "coz.btn": "Reveal the message",
      "coz.mesajLabel": "Hidden message",
      "coz.kopya": "copy",

      "nasil.baslik": "How does it work?",
      "nasil.p1": "A photo is made of millions of dots; each dot's color is stored as numbers. Changing the smallest digit of a number shifts the color too little for the eye to notice.",
      "nasil.p2": "The letters of your message are written into these smallest digits, one by one. First it is locked with your password, then embedded. The same password is needed to take it back out.",
      "nasil.svgAria": "The change of the smallest bit",
      "nasil.renk1": "blue: 182",
      "nasil.sonBasamak": "last digit: one bit of the message is written here",
      "nasil.renk2": "blue: 183",
      "nasil.figcaption": "The blue value goes from 182 to 183. The eye can't see the difference, but that last digit now carries the message.",

      "anlamak.baslik": "Is there a hidden message in a photo, and how can I tell?",
      "anlamak.p1": "Short answer: you can't tell by looking. A well-hidden message doesn't change the photo's colors by even a thousandth; put two photos side by side and you won't spot the difference. That's the whole point.",
      "anlamak.h1": "Signs that might still raise suspicion",
      "anlamak.li1": "The photo is a PNG and its file size is oddly large for its kind.",
      "anlamak.li2": "Someone keeps insisting on sending the photo “as a file, without compression.”",
      "anlamak.li3": "The photo's name or place doesn't fit the subject — a plain landscape named something like “gizli.png.”",
      "anlamak.h2": "How to be sure",
      "anlamak.p2": "Drop the photo into the “Reveal” section above and try the password. If there is a message and the password is right, it opens; otherwise it says there is no hidden message. Without the password you can't read the content, because the message is encrypted.",
      "anlamak.h3": "What do experts do?",
      "anlamak.p3": "A method called steganalysis looks at statistical traces in the pixels. In a normal photo the smallest digits are spread randomly; when a message is hidden, that spread is disturbed. This brings you closer to “is something hidden here,” but without the password it still won't reveal the message.",

      "gizlilik.baslik": "The photo and the message both stay with you",
      "gizlilik.p1": "This page connects to no server. The photo you pick, the message you write and your password never leave your computer — switch off your internet if you like, it still works. Nothing is stored, no trace is kept.",
      "gizlilik.p2": "The message is encrypted with AES-256 using a key derived from your password. The code is open; you can read it line by line if you wish.",
      "gizlilik.oku": "Read the code on GitHub",

      "sss.baslik": "Frequently asked",
      "sss.s1": "Why won't it open after I send the photo over WhatsApp?",
      "sss.c1": "Apps like WhatsApp and Instagram compress the photo, and that step wipes out the hidden digits. Send the photo as a “file/document,” not as a “photo.”",
      "sss.s2": "How secure is my message?",
      "sss.c2": "The message is encrypted with AES-256 using a key derived from your password. Someone without the password can't read the content, even if they sense a message is there.",
      "sss.s3": "Does my photo or message go anywhere?",
      "sss.c3": "No. Everything happens in your browser; no photo, message or password is ever sent or stored.",
      "sss.s4": "How long a message can I hide?",
      "sss.c4": "The bigger the photo, the more. When you pick a photo, the tool tells you how many characters will fit.",
      "sss.s5": "Why is the output always a PNG?",
      "sss.c5": "PNG is a lossless format, so the hidden digits aren't damaged. JPEG would erase the message, so the output is always a PNG.",

      "footer.metin": "Hidden Message — an open-source tool that runs in your browser.",

      "dyn.kapasite": "About {n} characters fit in this photo.",
      "dyn.gereken": "Photo, message and password are required.",
      "dyn.dogrulamaHata": "Verification failed, please try again.",
      "dyn.basari": "gizli.png was downloaded and the message was verified as readable. The other side can reveal it with the same password.",
      "dyn.cokUzun": "The message is too long for this photo. Pick a larger photo or shorten the message.",
      "dyn.tersGitti": "Something went wrong.",
      "dyn.cozGereken": "Photo and password are required.",
      "dyn.mesajYok": "There's no hidden message in this photo (or it was damaged during compression).",
      "dyn.parolaYanlis": "Wrong password.",
      "dyn.kopyalandi": "copied"
    },

    tr: {
      "meta.baslik": "Gizli Mesaj — bir fotoğrafın içine mesaj sakla",
      "meta.aciklama": "Mesajını bir fotoğrafın içine gizle, parolayla kilitle. Her şey tarayıcında olur; hiçbir şey kaydedilmez. Açık kaynak.",

      "nav.marka": "Gizli Mesaj",

      "hero.baslik": "Bir fotoğrafın içine mesaj sakla",
      "hero.alt": "Yazdığın mesaj, fotoğrafın renklerinin içine gizlenir. Fotoğraf olduğu gibi görünür; mesajı yalnızca parolayı bilen açar. Her şey bu sayfada, senin tarayıcında olur.",
      "hero.gizleBtn": "Mesajı gizle",
      "hero.nasilLink": "Nasıl çalışıyor?",
      "hero.gorselAria": "Siyanotip bir manzara",
      "hero.altyazi": "Bu karede saklı bir mesaj olabilir — bakınca anlaşılmaz.",

      "sekme.gizle": "Gizle",
      "sekme.coz": "Çöz",

      "gizle.birak": "Fotoğraf seç ya da buraya bırak",
      "gizle.birakIpucu": "PNG veya JPG",
      "gizle.mesajLabel": "Gizlenecek mesaj",
      "gizle.mesajPh": "Buraya yaz…",
      "gizle.parolaLabel": "Parola",
      "gizle.parolaPh": "Açarken bu parola gerekir",
      "gizle.btn": "Gizle ve indir",

      "coz.birak": "Gizli mesaj taşıyan fotoğrafı seç",
      "coz.birakIpucu": "genelde gizli.png",
      "coz.parolaLabel": "Parola",
      "coz.parolaPh": "Gizlerken kullanılan parola",
      "coz.btn": "Mesajı çöz",
      "coz.mesajLabel": "Gizli mesaj",
      "coz.kopya": "kopyala",

      "nasil.baslik": "Nasıl çalışıyor?",
      "nasil.p1": "Bir fotoğraf milyonlarca noktadan oluşur; her noktanın rengi sayılarla tutulur. Bir sayının en küçük basamağını değiştirmek, rengi gözün seçemeyeceği kadar az oynatır.",
      "nasil.p2": "Mesajın harfleri işte bu en küçük basamaklara, tek tek yazılır. Önce parolanla kilitlenir, sonra gömülür. Çıkarırken de aynı parola gerekir.",
      "nasil.svgAria": "En küçük bitin değişimi",
      "nasil.renk1": "mavi: 182",
      "nasil.sonBasamak": "son basamak: mesajın bir biti buraya yazılır",
      "nasil.renk2": "mavi: 183",
      "nasil.figcaption": "Mavinin değeri 182'den 183'e gider. Göz bu farkı görmez; ama o son basamak artık mesajı taşır.",

      "anlamak.baslik": "Bir fotoğrafta gizli mesaj var mı, nasıl anlarım?",
      "anlamak.p1": "Kısa cevap: gözle anlayamazsın. İyi gizlenmiş bir mesaj, fotoğrafın renklerini binde bir bile değiştirmez; iki fotoğrafı yan yana koysan farkı göremezsin. Amaç da budur.",
      "anlamak.h1": "Yine de şüphelendirebilecek işaretler",
      "anlamak.li1": "Fotoğraf PNG ve dosya boyutu benzerlerine göre tuhaf şekilde büyük.",
      "anlamak.li2": "Biri fotoğrafı ısrarla “dosya olarak, sıkıştırmadan” gönderiyor.",
      "anlamak.li3": "Fotoğrafın adı ya da yeri konuyla uyumsuz — sade bir manzaranın adı “gizli.png” gibi.",
      "anlamak.h2": "Emin olmanın yolu",
      "anlamak.p2": "Fotoğrafı yukarıdaki “Çöz” bölümüne bırak ve parolayı dene. Mesaj varsa ve parola doğruysa açılır; yoksa “gizli mesaj yok” der. Parolayı bilmiyorsan içeriği okuyamazsın, çünkü mesaj şifrelidir.",
      "anlamak.h3": "Uzmanlar ne yapar?",
      "anlamak.p3": "Steganaliz denen yöntemle piksellerdeki istatistiksel izlere bakılır. Normal bir fotoğrafta en küçük basamaklar rastgele dağılır; bir mesaj gizlenmişse bu dağılım bozulur. Bu, “bir şey gizli mi” sorusuna yaklaştırır ama parola olmadan mesajı okutmaz.",

      "gizlilik.baslik": "Fotoğrafın da, mesajın da sende kalır",
      "gizlilik.p1": "Bu sayfa hiçbir sunucuya bağlanmaz. Seçtiğin fotoğraf, yazdığın mesaj ve parolan bilgisayarından çıkmaz — istersen internet bağlantını kapat, yine çalışır. Hiçbir şey kaydedilmez, hiçbir iz tutulmaz.",
      "gizlilik.p2": "Mesaj, parolandan üretilen bir anahtarla AES-256 ile şifrelenir. Kod açıktır; dilersen satır satır okuyabilirsin.",
      "gizlilik.oku": "Kodu GitHub'da oku",

      "sss.baslik": "Sık sorulanlar",
      "sss.s1": "Fotoğrafı WhatsApp'tan atınca neden açılmıyor?",
      "sss.c1": "WhatsApp, Instagram gibi uygulamalar fotoğrafı sıkıştırır ve bu işlem gizli basamakları siler. Fotoğrafı “dosya/belge” olarak gönder; “fotoğraf” olarak değil.",
      "sss.s2": "Mesajım ne kadar güvenli?",
      "sss.c2": "Mesaj, parolandan üretilen bir anahtarla AES-256 ile şifrelenir. Parolayı bilmeyen, fotoğrafta bir mesaj olduğunu sezse bile içeriği okuyamaz.",
      "sss.s3": "Fotoğrafım ya da mesajım bir yere gidiyor mu?",
      "sss.c3": "Hayır. Her şey senin tarayıcında olur; hiçbir fotoğraf, mesaj ya da parola gönderilmez veya kaydedilmez.",
      "sss.s4": "Ne kadar uzun mesaj gizleyebilirim?",
      "sss.c4": "Fotoğraf ne kadar büyükse o kadar çok. Fotoğrafı seçince araç, kaç karakter sığacağını söyler.",
      "sss.s5": "Çıktı neden hep PNG?",
      "sss.c5": "PNG kayıpsız bir biçimdir; gizli basamaklar bozulmaz. JPEG mesajı silerdi, bu yüzden çıktı her zaman PNG olur.",

      "footer.metin": "Gizli Mesaj — tarayıcında çalışan, açık kaynak bir araç.",

      "dyn.kapasite": "Bu fotoğrafa yaklaşık {n} karakter sığar.",
      "dyn.gereken": "Fotoğraf, mesaj ve parola gerekli.",
      "dyn.dogrulamaHata": "Doğrulama başarısız, lütfen tekrar dene.",
      "dyn.basari": "gizli.png indirildi ve mesajın okunabildiği doğrulandı. Karşı taraf aynı parolayla çözebilir.",
      "dyn.cokUzun": "Mesaj bu fotoğraf için çok uzun. Daha büyük bir fotoğraf seç ya da mesajı kısalt.",
      "dyn.tersGitti": "Bir şeyler ters gitti.",
      "dyn.cozGereken": "Fotoğraf ve parola gerekli.",
      "dyn.mesajYok": "Bu fotoğrafta gizli mesaj yok (ya da fotoğraf sıkıştırılırken bozulmuş).",
      "dyn.parolaYanlis": "Parola yanlış.",
      "dyn.kopyalandi": "kopyalandı"
    }
  };

  var VARSAYILAN = "en";
  var SAKLAMA_ANAHTARI = "foto-gizle-dil";
  var aktifDil = VARSAYILAN;

  function desteklenen(kod) {
    return kod === "en" || kod === "tr";
  }

  // Başlangıç dilini belirle: önce adresteki ?lang=, sonra localStorage,
  // hiçbiri yoksa varsayılan (İngilizce).
  function baslangicDili() {
    try {
      var url = new URLSearchParams(location.search).get("lang");
      if (desteklenen(url)) return url;
    } catch (e) {}
    try {
      var kayitli = localStorage.getItem(SAKLAMA_ANAHTARI);
      if (desteklenen(kayitli)) return kayitli;
    } catch (e) {}
    return VARSAYILAN;
  }

  // Bir anahtarın aktif dildeki karşılığını verir ({n} gibi yer tutucuları
  // ikinci parametredeki değerlerle doldurur).
  function metin(anahtar, degerler) {
    var sozluk = ceviriler[aktifDil] || ceviriler[VARSAYILAN];
    var deger = sozluk[anahtar];
    if (deger === undefined) return anahtar;
    if (degerler) {
      Object.keys(degerler).forEach(function (ad) {
        deger = deger.replace("{" + ad + "}", degerler[ad]);
      });
    }
    return deger;
  }

  // Sayfadaki tüm işaretli metinleri aktif dile göre günceller.
  function uygula() {
    document.documentElement.lang = aktifDil;
    document.title = metin("meta.baslik");

    var aciklama = document.querySelector('meta[name="description"]');
    if (aciklama) aciklama.setAttribute("content", metin("meta.aciklama"));

    document.querySelectorAll("[data-i18n]").forEach(function (oge) {
      oge.textContent = metin(oge.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (oge) {
      oge.setAttribute("placeholder", metin(oge.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (oge) {
      oge.setAttribute("aria-label", metin(oge.getAttribute("data-i18n-aria")));
    });

    document.querySelectorAll("[data-dil]").forEach(function (dugme) {
      dugme.classList.toggle("etkin", dugme.getAttribute("data-dil") === aktifDil);
    });
  }

  // Dili değiştir: kaydet, adresi güncelle, sayfayı çevir ve arayüze haber ver.
  function ayarla(kod) {
    if (!desteklenen(kod)) return;
    aktifDil = kod;
    try {
      localStorage.setItem(SAKLAMA_ANAHTARI, kod);
    } catch (e) {}
    try {
      var url = new URL(location.href);
      url.searchParams.set("lang", kod);
      history.replaceState(null, "", url);
    } catch (e) {}
    uygula();
    document.dispatchEvent(new CustomEvent("dil-degisti", { detail: kod }));
  }

  function aktif() {
    return aktifDil;
  }

  // İlk yüklemede dili seç ve uygula. Dil düğmelerini de bağla.
  function baslat() {
    aktifDil = baslangicDili();
    uygula();
    document.querySelectorAll("[data-dil]").forEach(function (dugme) {
      dugme.addEventListener("click", function () {
        ayarla(dugme.getAttribute("data-dil"));
      });
    });
  }

  global.Dil = { aktif: aktif, ayarla: ayarla, metin: metin, uygula: uygula };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }
})(window);
