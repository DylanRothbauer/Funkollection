<script setup>
import { ref, watch } from 'vue'
import { auth, db } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDocs, setDoc, updateDoc, collection } from 'firebase/firestore'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import { useUserFunkos } from '../composables/useUserFunkos'
const { addFunkoPop, incrementFunkoQuantity  } = useUserFunkos()

const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['update:visible', 'pop-added'])

const seriesOptions = [
  '8-Bit',
  'Ad Icons',
  'Air Force',
  'Albums',
  'Animation',
  'Aquasox',
  'Army',
  'Around the World',
  'Artists',
  'Art Covers',
  'Art Series',
  'Asia',
  'Bape',
  'Basketball',
  'Board Games',
  'Books',
  'Boxing',
  'Broadway',
  'Build a Bear',
  'Candy',
  'Christmas',
  'Classics',
  'College',
  'Comedians',
  'Comic Covers',
  'Comics',
  'Conan',
  'Custom',
  'Deluxe',
  'Deluxe Moments',
  'Die-Cast',
  'Digital',
  'Disney',
  'Directors',
  'Drag Queens',
  'Fantastic Beasts',
  'Fashion',
  'Foodies',
  'Football',
  'Funko (Freddy Funko)',
  'Funko (Fantastik Plastik)',
  'Funko (Lance)',
  'Game of Thrones',
  'Games',
  'Game Covers',
  'Golf',
  'GPK',
  'Halo',
  'Harry Potter',
  'Heroes',
  'Hockey',
  'Holidays',
  'House of the Dragons',
  'Icons',
  'League of Legends',
  'Magic: The Gathering',
  'Marines',
  'Marvel',
  'Magazine Covers',
  'Minis',
  'MLB',
  'Moments',
  'Monsters',
  'Movie Posters',
  'Movies',
  'Muppets',
  'Myths',
  'My Little Pony',
  'NASCAR',
  'Navy',
  'NBA Mascots',
  'NFL',
  'Pin',
  'Pets',
  'Pusheen',
  'Racing',
  'Retro Toys',
  'Rides',
  'Rocks',
  'Royals',
  'Sanrio',
  'Sci-Fi',
  'Sesame Street',
  'SNL',
  'South Park',
  'Special Edition',
  'Sports',
  'Sports Legends',
  'Stan Lee',
  'Star Wars',
  'Television',
  'Tennis',
  'The Vote',
  'Town',
  'Town Christmas',
  'Trading Cards',
  'Trains',
  'Trolls',
  'UFC',
  'Uglydoll',
  'Valiant',
  'Vans',
  'VHS Covers',
  'Wreck-It Ralph',
  'Wrestling',
  'WWE',
  'WWE Covers',
  'Zodiac',
]

const stickerOptions = [
  'Chase',
  'Target Exclusive',
  'TargetCon 2021 Limited Edition Exclusive',
  'Walmart Exclusive',
  'GameStop Exclusive',
  'Hot Topic Exclusive',
  'Amazon Exclusive',
  'BoxLunch Exclusive',
  'FYE Exclusive',
  'Glow in the Dark',
  'Flocked',
  'Metallic',
  'SDCC Exclusive',
  'NYCC Exclusive',
  'Entertainment Earth Exclusive',
  'Specialty Series',
  'Funko Special Edition',
  'Funko Exclusive',
  'Warner Bros. 100th Anniversary',
  'Funko Exclusive 2022 Fall Convention Limited Edition',
  'Funkon 2022 Limited Edition',
  'Funko Exclusive 2018 Spring Convention',
  'WWE Official Licensed Product',
  'Official Major League Baseball',
  'NFL',
  'Barnes & Noble Exclusive',
  'Scented',
  'Rubiks',
  'Special Edition',
  'BAM! Exclusive',
  '2022 Galactic Convention Exclusive',
  '2019 Galactic Convention Exclusive',
  'Real D 3D',
  'Regal Cinemas Exclusive',
  'PX Previews Exclusive'
]

const toast = useToast()
const funkoImage = ref('')
const seriesSuggestions = ref([])
const selectedSeries = ref('')
const user = ref(null)
const funkoName = ref('')
const funkoTitle = ref('')
const funkoID = ref('')
const purchasePrice = ref('')
const error = ref('')
const success = ref('')
const imageFileName = ref('')
const localVisible = ref(props.visible)
const selectedStickers = ref([])
const isDuplicate = ref(false)
const duplicateDocId = ref(null)

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
})

// Compress image to stay under Firestore's 1MB document limit
const compressImage = (dataUrl, maxWidth = 400) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.7)) // 70% quality JPEG
    }
    img.src = dataUrl
  })
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFileName.value = file.name
    const reader = new FileReader()
    reader.onload = async (e) => {
      funkoImage.value = await compressImage(e.target.result) // compress here
    }
    reader.readAsDataURL(file)
  } else {
    imageFileName.value = ''
    funkoImage.value = ''
  }
}

const search = (event) => {
  const query = event.query.toLowerCase()
  seriesSuggestions.value = seriesOptions.filter((option) => option.toLowerCase().includes(query))
}

const resetForm = () => {
  funkoName.value = ''
  funkoTitle.value = ''
  selectedSeries.value = ''
  funkoID.value = ''
  funkoImage.value = ''
  error.value = ''
  success.value = ''
  purchasePrice.value = ''
  selectedStickers.value = []
  isDuplicate.value = false
  duplicateDocId.value = null
}

watch(
  () => props.visible,
  (val) => {
    localVisible.value = val
  },
)
watch(localVisible, (val) => {
  if (!val) emit('update:visible', false)
})

const addFunkoPopHandler = async () => {
  try {
    const funkosSnap = await getDocs(collection(db, 'users', user.value.uid, 'funkos'))
    const duplicate = funkosSnap.docs.find(d => {
      const data = d.data()
      const nameMatch = data.name?.toLowerCase() === funkoName.value.toLowerCase()
      const titleMatch = data.title?.toLowerCase() === funkoTitle.value.toLowerCase()
      const seriesMatch = data.series?.toLowerCase() === selectedSeries.value.toLowerCase()

      // If both have a non-empty funkoId, include it in the check
      // If either is missing/blank (e.g. "2 Pack"), match on name + title + series only
      const hasId = funkoID.value.trim() !== '' && data.funkoId?.trim() !== ''
      const idMatch = hasId ? data.funkoId === funkoID.value : true

      return nameMatch && titleMatch && seriesMatch && idMatch
    })

    if (duplicate && !isDuplicate.value) {
      // First attempt — warn user and store the docId
      isDuplicate.value = true
      duplicateDocId.value = duplicate.id
      error.value = `You already have ${funkoName.value} from ${funkoTitle.value}! Click Add again to increase the quantity.`
      return
    }

    if (isDuplicate.value && duplicateDocId.value) {
      // User confirmed — increment quantity on existing doc
      await incrementFunkoQuantity(duplicateDocId.value)
    } else {
      // Not a duplicate — add normally
      await addFunkoPop({
        id: funkoID.value,
        name: funkoName.value,
        title: funkoTitle.value,
        series: selectedSeries.value,
        image: funkoImage.value,
        purchasePrice: parseFloat(purchasePrice.value) || 0,
        stickers: selectedStickers.value,
      })
    }

    toast.add({ severity: 'success', summary: 'Success', detail: isDuplicate.value ? 'Quantity updated!' : 'Funko Pop added!' })
    emit('pop-added')
    emit('update:visible', false)
    resetForm()
  } catch (e) {
    error.value = e.message || 'Failed to add Funko Pop.'
  }
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    header="Add a Funko Pop"
    :style="{ width: '400px' }"
    @hide="() => { resetForm(); localVisible = false }"
    @pop-added="refreshCollection"
  >
    <form @submit.prevent="addFunkoPopHandler" class="flex flex-col gap-4">
      <input v-model="funkoName" placeholder="Name" class="p-2 border rounded" required />
      <input v-model="funkoTitle" placeholder="Title" class="p-2 border rounded" required />
      <AutoComplete
        v-model="selectedSeries"
        :suggestions="seriesSuggestions"
        :dropdown="true"
        @complete="search"
        placeholder="Select or type series"
        required
        class="dropdown-select"
      />
      <input v-model="funkoID" placeholder="ID" class="p-2 border rounded" />
      <input
        v-model="purchasePrice"
        type="number"
        min="0"
        step="1"
        placeholder="Purchase Price ($)"
        class="p-2 border rounded"
      />
      <div>
        <!-- Upload - input inside label -->
        <label class="upload-label">
          {{ imageFileName || 'Upload Image' }}
          <input
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="hidden"
          />
        </label>

        <!-- Camera - only shows on mobile -->
        <label class="camera-btn">
          <i class="pi pi-camera"></i> Take Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            @change="handleImageUpload"
            class="hidden"
          />
        </label>
      </div>
      <div v-if="funkoImage" class="mt-2">
        <img :src="funkoImage" alt="Preview" class="w-24 h-24 object-cover rounded mx-auto" />
      </div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
      <div v-if="success" class="text-green-600">{{ success }}</div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Stickers / Exclusives</label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="sticker in stickerOptions"
            :key="sticker"
            class="sticker-chip"
            :class="{ 'sticker-chip-selected': selectedStickers.includes(sticker) }"
          >
            <input
              type="checkbox"
              :value="sticker"
              v-model="selectedStickers"
              class="hidden"
            />
            {{ sticker }}
          </label>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="p-2 rounded border" @click="() => { resetForm(); emit('update:visible', false) }">
          Cancel
        </button>
        <button
          type="submit"
          class="p-2 text-white rounded"
          style="background: var(--p-button-primary-background)"
        >
          Add
        </button>
      </div>
    </form>
  </Dialog>
</template>

<style>
.upload-label {
  display: block;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  background: transparent;
  color: #aaa;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.upload-label:hover {
  background: #2a2a2a;
}

.camera-btn {
  display: none;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  background: transparent;
  color: #aaa;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.camera-btn:hover {
  background: #2a2a2a;
}

@media (max-width: 768px) {
  .camera-btn {
    display: block;
  }
}

</style>
