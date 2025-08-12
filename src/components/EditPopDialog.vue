<script setup>
import { ref, watch, computed } from 'vue'
import { db } from '../firebase.js'
import { doc, updateDoc } from 'firebase/firestore'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import AutoComplete from 'primevue/autocomplete'
import { useUserFunkos } from '../composables/useUserFunkos'
const { editFunkoPop } = useUserFunkos()

const props = defineProps({
  visible: Boolean,
  funko: Object,
  userId: String,
})
const emit = defineEmits(['update:visible', 'pop-edited'])

const funkoName = ref('')
const funkoTitle = ref('')
const funkoSeries = ref('')
const funkoImage = ref('')
const funkoID = computed(() => props.funko?.id || '')
const imageFileName = ref('')
const toast = useToast()
const localVisible = ref(props.visible)
const purchasePrice = ref('')

watch(
  () => props.visible,
  (val) => {
    localVisible.value = val
  },
)
watch(localVisible, (val) => {
  if (!val) emit('update:visible', false)
})
watch(
  [() => props.visible, () => props.funko],
  ([visible, funko]) => {
    if (visible && funko) {
      funkoName.value = funko.name || ''
      funkoTitle.value = funko.title || ''
      funkoSeries.value = funko.series || ''
      funkoImage.value = funko.image || ''
      imageFileName.value = ''
      purchasePrice.value =
        funko.purchasePrice !== undefined && funko.purchasePrice !== null ? funko.purchasePrice : ''
    }
  },
  { immediate: true },
)

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFileName.value = file.name
    const reader = new FileReader()
    reader.onload = (e) => {
      funkoImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveEditHandler = async () => {
  try {
    await editFunkoPop({
      id: funkoID.value,
      name: funkoName.value,
      title: funkoTitle.value,
      series: funkoSeries.value,
      image: funkoImage.value,
      purchasePrice: parseFloat(purchasePrice.value) || 0,
    })
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Funko Pop updated!' })
    emit('pop-edited')
    emit('update:visible', false)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update Funko Pop.' })
  }
}

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
const seriesSuggestions = ref([])

const search = (event) => {
  const query = event.query.toLowerCase()
  seriesSuggestions.value = seriesOptions.filter((option) => option.toLowerCase().includes(query))
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    header="Edit Funko Pop"
    :style="{ width: '400px' }"
    @hide="localVisible.value = false"
  >
    <form @submit.prevent="saveEdit" class="flex flex-col gap-4">
      <input v-model="funkoName" placeholder="Name" class="p-2 border rounded" required />
      <input v-model="funkoTitle" placeholder="Title" class="p-2 border rounded" required />
      <AutoComplete
        v-model="funkoSeries"
        :suggestions="seriesSuggestions"
        :dropdown="true"
        @complete="search"
        placeholder="Select or type series"
        required
        class="dropdown-select"
      />
      <div>
        <label
          for="edit-funko-image-upload"
          class="p-2 border rounded cursor-pointer bg-gray-100 hover:bg-gray-200 block text-center"
        >
          {{ imageFileName || 'Upload Image' }}
        </label>
        <input
          id="edit-funko-image-upload"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="hidden"
        />
      </div>
      <div v-if="funkoImage" class="mt-2">
        <img :src="funkoImage" alt="Preview" class="w-24 h-24 object-cover rounded mx-auto" />
      </div>
      <input v-model="funkoID" placeholder="ID" class="p-2 border rounded" required />
      <input
        v-model="purchasePrice"
        type="number"
        min="0"
        step="1"
        placeholder="Purchase Price ($)"
        class="p-2 border rounded"
      />
      <div class="flex justify-end gap-2">
        <button type="button" class="p-2 rounded border" @click="emit('update:visible', false)">
          Cancel
        </button>
        <button
          type="submit"
          class="p-2 text-white rounded"
          style="background: var(--p-button-primary-background)"
        >
          Save
        </button>
      </div>
    </form>
  </Dialog>
</template>
