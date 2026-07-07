<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  initialData: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['submit'])

const form = reactive({
  nom_voyageur: '',
  cin: '',
  mineur: false,
  classe: '2eme',
  ...props.initialData
})

// Synchroniser si les props changent
watch(() => props.initialData, (newData) => {
  Object.assign(form, newData)
}, { deep: true })

const submit = () => emit('submit', { ...form })
</script>

<template>
  <div class="booking-form-wrapper">
    <div class="form-group">
      <label>Nom du Voyageur</label>
      <input v-model="form.nom_voyageur" type="text" class="form-control" />
    </div>
    <!-- Ajoute ici exactement tous les champs de ton grand formulaire -->
    <div class="form-group">
      <label>Classe</label>
      <select v-model="form.classe" class="form-control">
        <option value="1ere">1ère Classe</option>
        <option value="2eme">2ème Classe</option>
      </select>
    </div>
    <button @click="submit" class="btn-primary">Enregistrer</button>
  </div>
</template>