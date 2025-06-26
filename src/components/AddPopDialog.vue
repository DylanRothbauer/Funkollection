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
  'Pop! 8-Bit',
  'Pop! Ad Icons',
  'Pop! Air Force',
  'Pop! Albums',
  'Pop! Animation',
  'Pop! Aquasox',
  'Pop! Army',
  'Pop! Around the World',
  'Pop! Artists',
  'Pop! Art Covers',
  'Pop! Art Series',
  'Pop! Asia',
  'Pop! Bape',
  'Pop! Basketball',
  'Pop! Board Games',
  'Pop! Books',
  'Pop! Boxing',
  'Pop! Broadway',
  'Pop! Build a Bear',
  'Pop! Candy',
  'Pop! Christmas',
  'Pop! Classics',
  'Pop! College',
  'Pop! Comedians',
  'Pop! Comic Covers',
  'Pop! Comics',
  'Pop! Conan',
  'Pop! Custom',
  'Pop! Deluxe',
  'Pop! Deluxe Moments',
  'Pop! Die-Cast',
  'Pop! Digital',
  'Pop! Disney',
  'Pop! Directors',
  'Pop! Drag Queens',
  'Pop! Fantastic Beasts',
  'Pop! Fashion',
  'Pop! Foodies',
  'Pop! Football',
  'Pop! Funko (Freddy Funko)',
  'Pop! Funko (Fantastik Plastik)',
  'Pop! Funko (Lance)',
  'Pop! Game of Thrones',
  'Pop! Games',
  'Pop! Game Covers',
  'Pop! Golf',
  'Pop! GPK',
  'Pop! Halo',
  'Pop! Harry Potter',
  'Pop! Heroes',
  'Pop! Hockey',
  'Pop! Holidays',
  'Pop! House of the Dragons',
  'Pop! Icons',
  'Pop! League of Legends',
  'Pop! Magic: The Gathering',
  'Pop! Marines',
  'Pop! Marvel',
  'Pop! Magazine Covers',
  'Pop! Minis',
  'Pop! MLB',
  'Pop! Moments',
  'Pop! Monsters',
  'Pop! Movie Posters',
  'Pop! Movies',
  'Pop! Muppets',
  'Pop! Myths',
  'Pop! My Little Pony',
  'Pop! NASCAR',
  'Pop! Navy',
  'Pop! NBA Mascots',
  'Pop! NFL',
  'Pop! Pets',
  'Pop! Pusheen',
  'Pop! Racing',
  'Pop! Retro Toys',
  'Pop! Rides',
  'Pop! Rocks',
  'Pop! Royals',
  'Pop! Sanrio',
  'Pop! Sci-Fi',
  'Pop! Sesame Street',
  'Pop! SNL',
  'Pop! South Park',
  'Special Edition Pop!',
  'Pop! Sports',
  'Pop! Sports Legends',
  'Pop! Stan Lee',
  'Pop! Star Wars',
  'Pop! Television',
  'Pop! Tennis',
  'Pop! The Vote',
  'Pop! Town',
  'Pop! Town Christmas',
  'Pop! Trading Cards',
  'Pop! Trains',
  'Pop! Trolls',
  'Pop! UFC',
  'Pop! Uglydoll',
  'Pop! Valiant',
  'Pop! Vans',
  'Pop! VHS Covers',
  'Pop! Wreck-It Ralph',
  'Pop! Wrestling',
  'Pop! WWE',
  'Pop! WWE Covers',
  'Pop! Zodiac',
]

const toast = useToast()
const funkoImage = ref('')
const seriesSuggestions = ref([])
const selectedSeries = ref('')
const user = ref(null)
const funkoName = ref('')
const funkoTitle = ref('')
const funkoID = ref('')
const error = ref('')
const success = ref('')
const imageFileName = ref('')

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
}

watch(
  () => props.visible,
  (val) => {
    if (!val) resetForm()
  },
)

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
    if (userFunkoSnap.exists()) {
      const prevQty = userFunkoSnap.data().quantity || 1
      await updateDoc(userFunkoRef, {
        quantity: prevQty + 1,
        lastAddedAt: new Date(),
        image: funkoImage.value || '',
      })
    } else {
      await setDoc(userFunkoRef, {
        quantity: 1,
        addedAt: new Date(),
        image: funkoImage.value || '',
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
    v-model:visible="props.visible"
    modal
    header="Add a Funko Pop"
    :style="{ width: '400px' }"
    @hide="resetForm"
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
