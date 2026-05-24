// ============================================================
//  tracking-app.js  –  Vue.js logic untuk tracking.html
//  Tugas Praktik 2 – SITTA UT
// ============================================================

var app = new Vue({
  el: '#app',

  // ─────────────────────────────────────────
  //  DATA
  // ─────────────────────────────────────────
  data: {
    pengirimanList: [
      { kode: "REG", nama: "JNE Reguler (3-5 hari)" },
      { kode: "EXP", nama: "JNE Express (1-2 hari)" }
    ],
    paket: [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar",  isi: ["EKMA4116", "EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar",  isi: ["BIOL4201", "FISIP4001"], harga: 140000 }
    ],

    // Array DO – diinisialisasi dari data dummy
    doList: [
      {
        nomorDO: "DO2025-0001",
        nim: "123456789",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "JNE Reguler (3-5 hari)",
        tanggalKirim: "2025-08-25",
        paketKode: "PAKET-UT-001",
        namaPaket: "PAKET IPS Dasar",
        isiPaket: ["EKMA4116", "EKMA4115"],
        total: 120000,
        perjalanan: [
          { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
          { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
        ]
      }
    ],

    // Expand/collapse detail
    expandedDO: null,

    // Modal form DO baru
    showModalDO: false,
    formDO: {
      nim: '', nama: '', ekspedisi: '', tanggalKirim: '', paketKode: ''
    },
    errorsDO: {},

    // Alert
    alertMsg: '',
    alertType: 'success'
  },

  // ─────────────────────────────────────────
  //  COMPUTED
  // ─────────────────────────────────────────
  computed: {
    /**
     * Generate nomor DO berikutnya secara otomatis.
     * Format: DO{TAHUN}-{4-digit sequence}
     * Contoh: DO2025-0002
     */
    nomorDOBerikutnya() {
      const tahun = new Date().getFullYear();
      // Cari sequence number terbesar dari doList yang ada
      let maxSeq = 0;
      this.doList.forEach(item => {
        const parts = item.nomorDO.split('-');
        if (parts.length === 2) {
          const seq = parseInt(parts[1], 10);
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });
      const nextSeq = String(maxSeq + 1).padStart(4, '0');
      return `DO${tahun}-${nextSeq}`;
    },

    /**
     * Objek paket yang sedang dipilih di form DO (dependent option).
     * Mengembalikan null jika belum dipilih.
     */
    paketDipilih() {
      if (!this.formDO.paketKode) return null;
      return this.paket.find(p => p.kode === this.formDO.paketKode) || null;
    },

    // Summary counts
    totalDO() {
      return this.doList.length;
    },
    totalDalamPerjalanan() {
      return this.doList.filter(d => d.status === 'Dalam Perjalanan').length;
    },
    totalTerkirim() {
      return this.doList.filter(d => d.status === 'Terkirim').length;
    },
    totalPending() {
      return this.doList.filter(d => d.status === 'Pending').length;
    }
  },

  // ─────────────────────────────────────────
  //  WATCH
  // ─────────────────────────────────────────
  watch: {
    /**
     * Watcher 1: Pantau perubahan paketKode di form.
     * Log untuk debugging dan bisa digunakan untuk pre-fill data lain.
     */
    'formDO.paketKode'(newKode) {
      if (newKode) {
        const p = this.paket.find(pk => pk.kode === newKode);
        console.log('[Watcher] Paket dipilih:', p ? p.nama : '-');
      }
    },

    /**
     * Watcher 2: Pantau doList secara mendalam.
     * Ketika DO baru ditambah atau status berubah, log jumlah DO aktif.
     */
    doList: {
      deep: true,
      handler(newList) {
        const aktif = newList.filter(d => d.status !== 'Terkirim').length;
        console.log('[Watcher] Jumlah DO aktif (belum terkirim):', aktif);
      }
    },

    /**
     * Watcher 3: Jika modal DO dibuka, otomatis isi tanggal hari ini.
     */
    showModalDO(val) {
      if (val && !this.formDO.tanggalKirim) {
        this.setHariIni();
      }
    }
  },

  // ─────────────────────────────────────────
  //  METHODS
  // ─────────────────────────────────────────
  methods: {
    formatRupiah(angka) {
      return 'Rp ' + angka.toLocaleString('id-ID');
    },

    tampilAlert(msg, type = 'success') {
      this.alertMsg = msg;
      this.alertType = type;
      setTimeout(() => { this.alertMsg = ''; }, 3500);
    },

    setHariIni() {
      // Ambil tanggal lokal dalam format YYYY-MM-DD
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      this.formDO.tanggalKirim = `${y}-${m}-${d}`;
    },

    toggleDetail(nomorDO) {
      this.expandedDO = this.expandedDO === nomorDO ? null : nomorDO;
    },

    // ── Modal DO ──
    bukaModalDO() {
      this.formDO = { nim: '', nama: '', ekspedisi: '', tanggalKirim: '', paketKode: '' };
      this.errorsDO = {};
      this.showModalDO = true;
    },

    tutupModalDO() {
      this.showModalDO = false;
    },

    validasiDO() {
      const e = {};
      if (!this.formDO.nim.trim())
        e.nim = 'NIM wajib diisi.';
      else if (!/^\d{6,12}$/.test(this.formDO.nim.trim()))
        e.nim = 'NIM harus berupa angka (6–12 digit).';
      if (!this.formDO.nama.trim())
        e.nama = 'Nama wajib diisi.';
      if (!this.formDO.ekspedisi)
        e.ekspedisi = 'Ekspedisi wajib dipilih.';
      if (!this.formDO.tanggalKirim)
        e.tanggalKirim = 'Tanggal kirim wajib diisi.';
      if (!this.formDO.paketKode)
        e.paketKode = 'Paket bahan ajar wajib dipilih.';
      this.errorsDO = e;
      return Object.keys(e).length === 0;
    },

    simpanDO() {
      if (!this.validasiDO()) return;
      const p = this.paket.find(pk => pk.kode === this.formDO.paketKode);
      const doBaru = {
        nomorDO: this.nomorDOBerikutnya,
        nim: this.formDO.nim.trim(),
        nama: this.formDO.nama.trim(),
        status: 'Pending',
        ekspedisi: this.formDO.ekspedisi,
        tanggalKirim: this.formDO.tanggalKirim,
        paketKode: this.formDO.paketKode,
        namaPaket: p ? p.nama : '-',
        isiPaket: p ? p.isi : [],
        total: p ? p.harga : 0,
        perjalanan: []
      };
      this.doList.push(doBaru);
      this.expandedDO = doBaru.nomorDO; // langsung expand DO baru
      this.tutupModalDO();
      this.tampilAlert('🚚 DO ' + doBaru.nomorDO + ' berhasil dibuat!');
    },

    /**
     * Update status DO secara progresif:
     * Pending → Dalam Perjalanan → Terkirim
     * Setiap update juga menambah entry perjalanan dengan timestamp.
     */
    updateStatus(nomorDO) {
      const idx = this.doList.findIndex(d => d.nomorDO === nomorDO);
      if (idx === -1) return;
      const item = this.doList[idx];

      let statusBaru = '';
      let keteranganBaru = '';
      const now = new Date();
      const ts = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0') + ':' +
        String(now.getSeconds()).padStart(2, '0');

      if (item.status === 'Pending') {
        statusBaru = 'Dalam Perjalanan';
        keteranganBaru = 'Paket dijemput kurir dan dalam perjalanan';
      } else if (item.status === 'Dalam Perjalanan') {
        statusBaru = 'Terkirim';
        keteranganBaru = 'Paket telah diterima penerima';
      } else {
        return;
      }

      // Vue.set untuk memastikan reaktivitas perubahan nested object
      const updated = Object.assign({}, item, {
        status: statusBaru,
        perjalanan: [...item.perjalanan, { waktu: ts, keterangan: keteranganBaru }]
      });
      Vue.set(this.doList, idx, updated);
      this.tampilAlert('✅ Status DO ' + nomorDO + ' diperbarui: ' + statusBaru);
    }
  }
});
