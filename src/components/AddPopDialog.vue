<script setup>
import { ref, watch } from 'vue'
import { auth, db } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'

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

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
})

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      funkoImage.value = e.target.result
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

const addFunkoPop = async () => {
  if (!user.value) {
    error.value = 'You must be signed in.'
    return
  }
  try {
    const funkoDocRef = doc(db, 'FunkoPops', funkoID.value)
    const funkoDocSnap = await getDoc(funkoDocRef)
    if (!funkoDocSnap.exists()) {
      await setDoc(funkoDocRef, {
        name: funkoName.value,
        title: funkoTitle.value,
        series: selectedSeries.value || '',
        id: funkoID.value,
        createdAt: new Date(),
      })
    }
    const userFunkoRef = doc(db, 'users', user.value.uid, 'funkos', funkoID.value)
    const userFunkoSnap = await getDoc(userFunkoRef)
    const price = parseFloat(purchasePrice.value) || 0
    if (userFunkoSnap.exists()) {
      const prevQty = userFunkoSnap.data().quantity || 1
      await updateDoc(userFunkoRef, {
        quantity: prevQty + 1,
        lastAddedAt: new Date(),
        image: funkoImage.value || '',
        purchasePrice: price,
      })
    } else {
      await setDoc(userFunkoRef, {
        quantity: 1,
        addedAt: new Date(),
        image: funkoImage.value || '',
        purchasePrice: price,
      })
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Funko Pop added!', life: 3000 })
    emit('pop-added')
    emit('update:visible', false)
    resetForm()
  } catch (e) {
    error.value = 'Failed to add Funko Pop.'
    success.value = ''
  }
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    header="Add a Funko Pop"
    :style="{ width: '400px' }"
    @hide="localVisible.value = false"
  >
    <form @submit.prevent="addFunkoPop" class="flex flex-col gap-4">
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
      <input v-model="funkoID" placeholder="ID" class="p-2 border rounded" required />
      <input
        v-model="purchasePrice"
        type="number"
        min="0"
        step="1"
        placeholder="Purchase Price ($)"
        class="p-2 border rounded"
      />
      <div>
        <label
          for="funko-image-upload"
          class="p-2 border rounded cursor-pointer bg-gray-100 hover:bg-gray-200 block text-center"
        >
          {{ imageFileName || 'Upload Image' }}
        </label>
        <input
          id="funko-image-upload"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="hidden"
        />
      </div>
      <div v-if="funkoImage" class="mt-2">
        <img :src="funkoImage" alt="Preview" class="w-24 h-24 object-cover rounded mx-auto" />
      </div>
      <div v-if="error" class="text-red-600">{{ error }}</div>
      <div v-if="success" class="text-green-600">{{ success }}</div>
      <div class="flex justify-end gap-2">
        <button type="button" class="p-2 rounded border" @click="emit('update:visible', false)">
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
