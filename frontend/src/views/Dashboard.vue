<template>
  <div class="dashboard-page">
    <!-- Banner Utama -->
    <div class="banner-main">
      <div class="banner-content">
        <h1>Temukan Barang untuk Barter</h1>
        <p>Tukar barang yang tidak kamu pakai dengan apa yang kamu butuhkan. Tanpa uang, hanya nilai yang adil.</p>
      </div>
      <button class="btn-neo btn-scroll" @click="scrollToFilter">MULAI BARTER SEKARANG</button>
    </div>

    <!-- Filter Bar -->
    <div id="filter-bar" class="filter-bar">
      <div class="filter-group">
        <i class="fas fa-search"></i>
        <input type="text" v-model="searchQuery" placeholder="Cari barang idaman..." />
      </div>
      <select v-model="filterCategory" class="filter-select">
        <option value="">Semua Kategori</option>
        <option value="ELEKTRONIK">Elektronik</option>
        <option value="FURNITURE">Furniture</option>
        <option value="OTOMOTIF">Otomotif</option>
        <option value="PAKAIAN">Pakaian</option>
        <option value="PERTANIAN">Pertanian</option>
      </select>
      <select v-model="filterCondition" class="filter-select">
        <option value="">Kondisi</option>
        <option value="Baru">Baru</option>
        <option value="Bekas Bagus">Bekas Bagus</option>
        <option value="Bekas Cukup">Bekas Cukup</option>
      </select>
      <button class="btn-neo btn-filter" @click="resetFilters">RESET FILTER</button>
    </div>

    <!-- Grid Barang -->
    <div v-if="filteredItems.length === 0" class="empty-state">
      <i class="fas fa-layer-group"></i>
      <h3>Barang Tidak Ditemukan</h3>
      <p>Cobalah mengganti kata kunci pencarian Anda atau reset filter.</p>
    </div>
    <div v-else class="item-grid">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <div class="card-image">
          <img :src="item.image_url || placeholderImage" :alt="item.name" @error="e => e.target.src = placeholderImage" />
          <span class="category-tag" :class="categoryClass(item.category)">{{ item.category || 'Umum' }}</span>
        </div>
        <div class="card-body">
          <h3>{{ item.name }}</h3>
          <p>{{ item.description?.slice(0, 80) || 'Tidak ada deskripsi' }}</p>
          <div class="owner-row">
            <img 
              :src="item.owner_avatar || defaultAvatar" 
              class="owner-avatar" 
              @error="e => e.target.src = defaultAvatar"
            />
            <div>
              <span class="owner-name">{{ item.owner_name || 'Anonim' }}</span>
              <span class="owner-distance">{{ item.distance || '—' }}</span>
            </div>
            <span class="condition-badge">{{ item.condition || '-' }}</span>
          </div>
          <button class="btn-neo btn-trade" @click="openTradeModal(item)">AJUKAN BARTER</button>
        </div>
      </div>
    </div>

    <!-- Banner Bawah -->
    <div class="banner-bottom">
      <div>
        <h2>Punya Barang Tak Terpakai?</h2>
        <p>Jangan biarkan berdebu, jadikan barang baru lewat BarterYuk! Upload barang Anda dan mulailah berbarter.</p>
      </div>
      <button class="btn-neo btn-upload" @click="$router.push('/my-items')">UPLOAD BARANG SEKARANG</button>
    </div>

    <!-- Modal Ajukan Barter -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Ajukan Penawaran Barter</h3>
          <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="submitTrade">
          <div class="modal-body">
            <div class="target-item">
              <img :src="selectedItem?.image_url || placeholderImage" @error="e => e.target.src = placeholderImage" />
              <div>
                <span class="label">Barang yang diincar</span>
                <h4>{{ selectedItem?.name }}</h4>
                <p>Milik: <b>{{ selectedItem?.owner_name }}</b></p>
              </div>
            </div>
            <div class="swap-arrow"><i class="fas fa-arrow-left-right"></i></div>
            <div>
              <label>PILIH BARANG ANDA YANG INGIN DITAWARKAN:</label>
              <select v-model="selectedMyItem" class="modal-select" required>
                <option value="" disabled>-- Pilih barang --</option>
                <option v-for="item in myItems" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ item.category || 'Umum' }}) - {{ item.condition || '-' }}
                </option>
              </select>
              <div v-if="selectedMyItem" class="preview-item">
                <img :src="getSelectedItemImage" @error="e => e.target.src = placeholderImage" />
                <div>
                  <h5>{{ getSelectedItemName }}</h5>
                  <p>{{ getSelectedItemDesc }}</p>
                </div>
              </div>
            </div>
            <div>
              <label>PESAN TAMBAHAN (OPSIONAL):</label>
              <textarea v-model="tradeMessage" rows="3" placeholder="Contoh: Halo! Mau barter keyboard saya dengan kamera analog kamu?"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-neo-outline" @click="closeModal">Batal</button>
            <button type="submit" class="btn-neo" :disabled="!selectedMyItem">Ajukan Barter Sekarang</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useItemsStore } from '../stores/items'
import api from '../services/api'
import { useToast } from 'vue-toastification'

const itemsStore = useItemsStore()
const toast = useToast()

const otherItems = ref([])
const myItems = ref([])
const searchQuery = ref('')
const filterCategory = ref('')
const filterCondition = ref('')
const showModal = ref(false)
const selectedItem = ref(null)
const selectedMyItem = ref(null)
const tradeMessage = ref('')
const placeholderImage = 'https://placehold.co/400x200/e9ecef/6c757d?text=No+Image'
const defaultAvatar = 'https://placehold.co/32x32/cccccc/000?text=User'

const filteredItems = computed(() => {
  return otherItems.value.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        (item.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = filterCategory.value ? item.category?.toUpperCase() === filterCategory.value : true
    const matchCondition = filterCondition.value ? item.condition === filterCondition.value : true
    return matchSearch && matchCategory && matchCondition
  })
})

const resetFilters = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  filterCondition.value = ''
  toast.info('Filter direset')
}

const scrollToFilter = () => {
  document.getElementById('filter-bar').scrollIntoView({ behavior: 'smooth' })
}

const categoryClass = (cat) => {
  const map = {
    'TECH': 'bg-tech',
    'FURNITURE': 'bg-furniture',
    'BOOKS': 'bg-books',
    'FASHION': 'bg-fashion',
    'GARDEN': 'bg-garden',
    'HOBBIES': 'bg-hobbies'
  }
  return map[cat?.toUpperCase()] || 'bg-default'
}

const openTradeModal = (item) => {
  if (myItems.value.length === 0) {
    toast.warning('Anda belum memiliki barang untuk ditawarkan. Tambahkan barang dulu!')
    return
  }
  selectedItem.value = item
  selectedMyItem.value = null
  tradeMessage.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
  selectedMyItem.value = null
}

const getSelectedItemImage = computed(() => {
  const item = myItems.value.find(i => i.id === selectedMyItem.value)
  return item?.image_url || placeholderImage
})
const getSelectedItemName = computed(() => {
  const item = myItems.value.find(i => i.id === selectedMyItem.value)
  return item?.name || ''
})
const getSelectedItemDesc = computed(() => {
  const item = myItems.value.find(i => i.id === selectedMyItem.value)
  return item?.description || ''
})

const submitTrade = async () => {
  if (!selectedMyItem.value) {
    toast.error('Pilih barang Anda yang akan ditawarkan')
    return
  }
  try {
    await api.post('/trades', {
      item_offered_id: selectedMyItem.value,
      item_requested_id: selectedItem.value.id,
      message: tradeMessage.value
    })
    toast.success('Permintaan barter berhasil dikirim!')
    closeModal()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Gagal mengirim permintaan barter')
  }
}

const fetchData = async () => {
  try {
    await itemsStore.fetchOtherItems()
    await itemsStore.fetchMyItems()
    otherItems.value = itemsStore.otherItems
    myItems.value = itemsStore.myItems
  } catch (error) {
    toast.error('Gagal memuat data barang')
  }
}

onMounted(fetchData)
</script>

<style scoped src="../assets/dashboard.css"></style>


