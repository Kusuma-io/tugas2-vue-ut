// ============================================================
//  stok-app.js  –  Vue.js logic untuk stok.html
//  Tugas Praktik 2 – SITTA UT
// ============================================================

var app = new Vue({
  el: '#app',

  // ─────────────────────────────────────────
  //  DATA
  // ─────────────────────────────────────────
  data: {
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],

    stok: [
      {
        kode: "EKMA4116",
        judul: "Pengantar Manajemen",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A3",
        harga: 65000,
        qty: 28,
        safety: 20,
        catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
      },
      {
        kode: "EKMA4115",
        judul: "Pengantar Akuntansi",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A4",
        harga: 60000,
        qty: 7,
        safety: 15,
        catatanHTML: "<strong>Cover baru</strong>"
      },
      {
        kode: "BIOL4201",
        judul: "Biologi Umum (Praktikum)",
        kategori: "Praktikum",
        upbjj: "Surabaya",
        lokasiRak: "R3-B2",
        harga: 80000,
        qty: 12,
        safety: 10,
        catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
      },
      {
        kode: "FISIP4001",
        judul: "Dasar-Dasar Sosiologi",
        kategori: "MK Pilihan",
        upbjj: "Makassar",
        lokasiRak: "R2-C1",
        harga: 55000,
        qty: 2,
        safety: 8,
        catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
      }
    ],

    // ── Filter state ──
    filterUPBJJ: '',
    filterKategori: '',
    filterReorder: false,
    filterKosong: false,
    sortBy: '',

    // ── Modal Tambah ──
    showModalTambah: false,
    formTambah: {
      kode: '', judul: '', kategori: '', upbjj: '',
      lokasiRak: '', harga: null, qty: null, safety: null, catatanHTML: ''
    },
    errors: {},

    // ── Modal Edit ──
    showModalEdit: false,
    formEdit: null,
    editIndex: null,
    errorsEdit: {},

    // ── Alert ──
    alertMsg: '',
    alertType: 'success'
  },

  // ─────────────────────────────────────────
  //  COMPUTED  (tidak re-compute jika tidak ada perubahan relevan)
  // ─────────────────────────────────────────
  computed: {
    /**
     * Daftar stok yang sudah difilter dan diurutkan.
     * Vue.js computed property secara otomatis di-cache dan hanya
     * dihitung ulang ketika dependensi reaktif berubah.
     */
    filteredStok() {
      let result = this.stok.slice(); // salin array

      // 1. Filter UPBJJ
      if (this.filterUPBJJ) {
        result = result.filter(item => item.upbjj === this.filterUPBJJ);
      }

      // 2. Filter Kategori (dependent pada UPBJJ)
      if (this.filterUPBJJ && this.filterKategori) {
        result = result.filter(item => item.kategori === this.filterKategori);
      }

      // 3. Filter re-order: qty < safety ATAU qty = 0
      if (this.filterReorder) {
        result = result.filter(item => item.qty < item.safety);
      }

      // 4. Filter kosong saja
      if (this.filterKosong) {
        result = result.filter(item => item.qty === 0);
      }

      // 5. Sorting
      if (this.sortBy) {
        result = result.slice().sort((a, b) => {
          switch (this.sortBy) {
            case 'judul':      return a.judul.localeCompare(b.judul);
            case 'judulDesc':  return b.judul.localeCompare(a.judul);
            case 'qty':        return a.qty - b.qty;
            case 'qtyDesc':    return b.qty - a.qty;
            case 'harga':      return a.harga - b.harga;
            case 'hargaDesc':  return b.harga - a.harga;
            default:           return 0;
          }
        });
      }

      return result;
    },

    jumlahAman() {
      return this.stok.filter(i => i.qty >= i.safety).length;
    },
    jumlahMenipis() {
      return this.stok.filter(i => i.qty > 0 && i.qty < i.safety).length;
    },
    jumlahKosong() {
      return this.stok.filter(i => i.qty === 0).length;
    }
  },

  // ─────────────────────────────────────────
  //  WATCH (minimal 2 watcher sesuai syarat)
  // ─────────────────────────────────────────
  watch: {
    /**
     * Watcher 1: Ketika filterUPBJJ berubah, reset filterKategori
     * agar pilihan kategori tidak tertinggal dari daerah sebelumnya.
     */
    filterUPBJJ(newVal) {
      this.filterKategori = '';
      if (!newVal) {
        console.log('[Watcher] Filter UT-Daerah direset.');
      } else {
        console.log('[Watcher] Filter UT-Daerah diubah ke:', newVal);
      }
    },

    /**
     * Watcher 2: Pantau perubahan stok secara mendalam (deep watch).
     * Jika ada item yang stoknya turun di bawah safety, tampilkan alert.
     */
    stok: {
      deep: true,
      handler(newStok) {
        const kritis = newStok.filter(i => i.qty > 0 && i.qty < i.safety);
        if (kritis.length > 0) {
          console.log('[Watcher] Stok kritis terdeteksi:', kritis.map(i => i.kode));
        }
      }
    },

    /**
     * Watcher 3: Pantau filter re-order & kosong agar tidak aktif bersamaan
     * – jika filterKosong aktif, matikan filterReorder supaya tidak tumpang tindih.
     */
    filterKosong(val) {
      if (val && this.filterReorder) {
        this.filterReorder = false;
      }
    }
  },

  // ─────────────────────────────────────────
  //  METHODS
  // ─────────────────────────────────────────
  methods: {
    // ── Format Rupiah ──
    formatRupiah(angka) {
      return 'Rp ' + angka.toLocaleString('id-ID');
    },

    // ── Reset Filter ──
    resetFilter() {
      this.filterUPBJJ = '';
      this.filterKategori = '';
      this.filterReorder = false;
      this.filterKosong = false;
      this.sortBy = '';
    },

    // ── Alert helper ──
    tampilAlert(msg, type = 'success') {
      this.alertMsg = msg;
      this.alertType = type;
      setTimeout(() => { this.alertMsg = ''; }, 3500);
    },

    // ─────────────────────────────────
    //  MODAL TAMBAH
    // ─────────────────────────────────
    bukaModalTambah() {
      this.formTambah = {
        kode: '', judul: '', kategori: '', upbjj: '',
        lokasiRak: '', harga: null, qty: null, safety: null, catatanHTML: ''
      };
      this.errors = {};
      this.showModalTambah = true;
    },

    tutupModalTambah() {
      this.showModalTambah = false;
    },

    // Validasi form tambah
    validasiTambah() {
      const e = {};
      if (!this.formTambah.kode.trim())
        e.kode = 'Kode MK wajib diisi.';
      else if (this.stok.some(s => s.kode === this.formTambah.kode.trim()))
        e.kode = 'Kode MK sudah ada!';

      if (!this.formTambah.judul.trim())
        e.judul = 'Judul MK wajib diisi.';
      if (!this.formTambah.kategori)
        e.kategori = 'Kategori wajib dipilih.';
      if (!this.formTambah.upbjj)
        e.upbjj = 'UT-Daerah wajib dipilih.';
      if (!this.formTambah.lokasiRak.trim())
        e.lokasiRak = 'Lokasi Rak wajib diisi.';
      if (this.formTambah.harga === null || this.formTambah.harga < 0)
        e.harga = 'Harga harus diisi (minimal 0).';
      if (this.formTambah.qty === null || this.formTambah.qty < 0)
        e.qty = 'Jumlah stok harus diisi (minimal 0).';
      if (this.formTambah.safety === null || this.formTambah.safety < 0)
        e.safety = 'Safety stock harus diisi (minimal 0).';

      this.errors = e;
      return Object.keys(e).length === 0;
    },

    simpanTambah() {
      if (!this.validasiTambah()) return;
      this.stok.push({
        kode: this.formTambah.kode.trim(),
        judul: this.formTambah.judul.trim(),
        kategori: this.formTambah.kategori,
        upbjj: this.formTambah.upbjj,
        lokasiRak: this.formTambah.lokasiRak.trim(),
        harga: this.formTambah.harga,
        qty: this.formTambah.qty,
        safety: this.formTambah.safety,
        catatanHTML: this.formTambah.catatanHTML
      });
      this.tutupModalTambah();
      this.tampilAlert('✅ Bahan ajar ' + this.formTambah.kode + ' berhasil ditambahkan!');
    },

    // ─────────────────────────────────
    //  MODAL EDIT
    // ─────────────────────────────────
    bukaModalEdit(item) {
      // Temukan index asli di array stok
      this.editIndex = this.stok.findIndex(s => s.kode === item.kode);
      // Salin object agar tidak mutate langsung (two-way binding lewat modal)
      this.formEdit = Object.assign({}, item);
      this.errorsEdit = {};
      this.showModalEdit = true;
    },

    tutupModalEdit() {
      this.showModalEdit = false;
      this.formEdit = null;
    },

    validasiEdit() {
      const e = {};
      if (!this.formEdit.judul.trim())
        e.judul = 'Judul MK wajib diisi.';
      if (!this.formEdit.lokasiRak.trim())
        e.lokasiRak = 'Lokasi Rak wajib diisi.';
      if (this.formEdit.harga < 0)
        e.harga = 'Harga tidak boleh negatif.';
      if (this.formEdit.qty < 0)
        e.qty = 'Stok tidak boleh negatif.';
      if (this.formEdit.safety < 0)
        e.safety = 'Safety tidak boleh negatif.';
      this.errorsEdit = e;
      return Object.keys(e).length === 0;
    },

    simpanEdit() {
      if (!this.validasiEdit()) return;
      // Vue.set untuk memastikan reaktivitas saat mengganti object di array
      Vue.set(this.stok, this.editIndex, Object.assign({}, this.formEdit));
      this.tutupModalEdit();
      this.tampilAlert('✅ Data ' + this.formEdit.kode + ' berhasil diperbarui!');
    }
  }
});
