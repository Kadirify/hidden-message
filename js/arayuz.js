/*
 * arayuz.js
 * Sayfadaki butonları, dosya alanlarını ve sekmeleri steganografi çekirdeğine
 * bağlar. Gizleme/çözme işini kendisi yapmaz; onu steganografi.js yürütür.
 */
(function () {
  "use strict";

  var cekirdek = window.Steganografi;
  var secili = (id) => document.getElementById(id);

  // --- Küçük yardımcılar -----------------------------------------------------

  // Seçilen dosyayı bir <canvas>'a çizip piksel verisini (ImageData) çıkarır.
  // Önizleme için dosyanın geçici adresini de döndürür.
  function dosyadanResimVerisi(dosya) {
    return new Promise(function (coz, hata) {
      var resim = new Image();

      resim.onload = function () {
        var tuval = document.createElement("canvas");
        tuval.width = resim.naturalWidth;
        tuval.height = resim.naturalHeight;

        var baglam = tuval.getContext("2d", { willReadFrequently: true });
        baglam.drawImage(resim, 0, 0);

        coz({
          veri: baglam.getImageData(0, 0, tuval.width, tuval.height),
          adres: resim.src
        });
      };

      resim.onerror = function () {
        hata(new Error("okunamadı"));
      };

      resim.src = URL.createObjectURL(dosya);
    });
  }

  // Bir sonuç kutusuna durum mesajı yazar (iyi/kötü rengiyle).
  function durumGoster(kutuId, sinif, metin) {
    var kutu = secili(kutuId);
    kutu.className = "sonuc goster " + sinif;
    kutu.querySelector(".mt").textContent = metin;
  }

  // Bırakma alanına seçilen fotoğrafın önizlemesini koyar.
  function onizlemeGoster(alan, adres) {
    alan.classList.add("dolu");
    alan.innerHTML = "";
    var resim = document.createElement("img");
    resim.src = adres;
    alan.appendChild(resim);
  }

  // Bir "fotoğraf bırak" alanını tıklama, sürükle-bırak ve klavye ile çalışır
  // hâle getirir. Fotoğraf seçildiğinde verilen geri çağırımı tetikler.
  function birakmaAlaniBagla(alanId, dosyaId, dosyaSecildi) {
    var alan = secili(alanId);
    var dosya = secili(dosyaId);

    alan.addEventListener("click", function () {
      dosya.click();
    });

    alan.addEventListener("keydown", function (olay) {
      if (olay.key === "Enter" || olay.key === " ") {
        olay.preventDefault();
        dosya.click();
      }
    });

    alan.addEventListener("dragover", function (olay) {
      olay.preventDefault();
      alan.classList.add("uzerinde");
    });

    alan.addEventListener("dragleave", function () {
      alan.classList.remove("uzerinde");
    });

    alan.addEventListener("drop", function (olay) {
      olay.preventDefault();
      alan.classList.remove("uzerinde");
      var birakilan = olay.dataTransfer.files[0];
      if (birakilan) {
        dosya.files = olay.dataTransfer.files;
        dosyaSecildi(birakilan);
      }
    });

    dosya.addEventListener("change", function (olay) {
      if (olay.target.files[0]) {
        dosyaSecildi(olay.target.files[0]);
      }
    });
  }

  // --- Gizleme paneli --------------------------------------------------------

  var gizlenecekResim = null;

  birakmaAlaniBagla("gizleBirak", "gizleDosya", async function (dosya) {
    try {
      gizlenecekResim = await dosyadanResimVerisi(dosya);
      onizlemeGoster(secili("gizleBirak"), gizlenecekResim.adres);

      var kapasite = cekirdek.karakterKapasitesi(gizlenecekResim.veri);
      secili("kapasite").textContent =
        "Bu fotoğrafa yaklaşık " +
        kapasite.toLocaleString("tr-TR") +
        " karakter sığar.";

      secili("gizleBtn").disabled = false;
    } catch (e) {
      gizlenecekResim = null;
      secili("gizleBtn").disabled = true;
    }
  });

  secili("gizleBtn").addEventListener("click", async function () {
    var mesaj = secili("mesaj").value;
    var parola = secili("gizleParola").value;

    if (!gizlenecekResim || !mesaj || !parola) {
      durumGoster("gizleSonuc", "kotu", "Fotoğraf, mesaj ve parola gerekli.");
      return;
    }

    secili("gizleBtn").disabled = true;

    try {
      // Özgün veriyi bozmamak için bir kopya üstünde çalışıyoruz.
      var kaynak = gizlenecekResim.veri;
      var kopya = new ImageData(
        new Uint8ClampedArray(kaynak.data),
        kaynak.width,
        kaynak.height
      );

      await cekirdek.mesajiGom(kopya, mesaj, parola);

      // Değiştirilmiş pikselleri yeni bir PNG'ye döküyoruz.
      var tuval = document.createElement("canvas");
      tuval.width = kopya.width;
      tuval.height = kopya.height;
      tuval.getContext("2d").putImageData(kopya, 0, 0);

      var png = await new Promise(function (coz) {
        tuval.toBlob(coz, "image/png");
      });

      // İndirmeden önce doğrula: ürettiğimiz PNG'den mesajı geri okuyabiliyor
      // muyuz? Böylece "indi ama açılmıyor" durumunu baştan eliyoruz.
      var dogrulama = await dosyadanResimVerisi(png);
      var geriOkunan = "";
      try {
        geriOkunan = await cekirdek.mesajiCikar(dogrulama.veri, parola);
      } catch (e) {}

      if (geriOkunan !== mesaj) {
        durumGoster("gizleSonuc", "kotu", "Doğrulama başarısız, lütfen tekrar dene.");
        secili("gizleBtn").disabled = false;
        return;
      }

      var baglanti = document.createElement("a");
      baglanti.href = URL.createObjectURL(png);
      baglanti.download = "gizli.png";
      baglanti.click();

      durumGoster(
        "gizleSonuc",
        "iyi",
        "gizli.png indirildi ve mesajın okunabildiği doğrulandı. Karşı taraf aynı parolayla çözebilir."
      );
    } catch (hata) {
      var metin =
        hata.message === "kapasite"
          ? "Mesaj bu fotoğraf için çok uzun. Daha büyük bir fotoğraf seç ya da mesajı kısalt."
          : "Bir şeyler ters gitti.";
      durumGoster("gizleSonuc", "kotu", metin);
    }

    secili("gizleBtn").disabled = false;
  });

  // --- Çözme paneli ----------------------------------------------------------

  var cozulecekResim = null;

  birakmaAlaniBagla("cozBirak", "cozDosya", async function (dosya) {
    try {
      cozulecekResim = await dosyadanResimVerisi(dosya);
      onizlemeGoster(secili("cozBirak"), cozulecekResim.adres);

      secili("cozBtn").disabled = false;
      secili("cozMesajKutu").style.display = "none";
      secili("cozSonuc").className = "sonuc";
    } catch (e) {
      cozulecekResim = null;
      secili("cozBtn").disabled = true;
    }
  });

  secili("cozBtn").addEventListener("click", async function () {
    var parola = secili("cozParola").value;

    if (!cozulecekResim || !parola) {
      durumGoster("cozSonuc", "kotu", "Fotoğraf ve parola gerekli.");
      return;
    }

    try {
      var mesaj = await cekirdek.mesajiCikar(cozulecekResim.veri, parola);
      secili("cozSonuc").className = "sonuc";
      secili("cozMesaj").textContent = mesaj;
      secili("cozMesajKutu").style.display = "block";
    } catch (hata) {
      secili("cozMesajKutu").style.display = "none";
      var metin =
        hata.message === "yok"
          ? "Bu fotoğrafta gizli mesaj yok (ya da fotoğraf sıkıştırılırken bozulmuş)."
          : "Parola yanlış.";
      durumGoster("cozSonuc", "kotu", metin);
    }
  });

  secili("kopyaBtn").addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(secili("cozMesaj").textContent);
      secili("kopyaBtn").textContent = "kopyalandı";
      setTimeout(function () {
        secili("kopyaBtn").textContent = "kopyala";
      }, 1500);
    } catch (e) {}
  });

  // --- Sekmeler --------------------------------------------------------------

  function sekmeDegistir(gizleAcik) {
    secili("sekmeGizle").classList.toggle("etkin", gizleAcik);
    secili("sekmeCoz").classList.toggle("etkin", !gizleAcik);
    secili("panelGizle").style.display = gizleAcik ? "block" : "none";
    secili("panelCoz").style.display = gizleAcik ? "none" : "block";
  }

  secili("sekmeGizle").addEventListener("click", function () {
    sekmeDegistir(true);
  });
  secili("sekmeCoz").addEventListener("click", function () {
    sekmeDegistir(false);
  });
})();
