import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabaseClient } from '../lib/supabaseClient'

export function useRegisterPage(emit) {
  const router = useRouter()

  const fullName = ref('')
  const email = ref('')
  const phone = ref('+261 ')
  const cin = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const showPassword = ref(false)
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const registerComplete = ref(false)
  const redirectTimeout = ref(null)

  const passwordsMatch = computed(() => password.value === confirmPassword.value)
  const canSubmit = computed(
    () => fullName.value && email.value && phone.value.length === 17 && cin.value && password.value.length >= 6 && passwordsMatch.value && !loading.value,
  )

  function formatPhone(event) {
    let inputVal = event.target.value

    if (!inputVal.startsWith('+261 ')) {
      phone.value = '+261 '
      return
    }

    const rawNumbers = inputVal.substring(5).replace(/\D/g, '')
    const truncated = rawNumbers.substring(0, 9)

    let formatted = '+261 '

    if (truncated.length > 0) {
      formatted += truncated.substring(0, 2)
    }
    if (truncated.length > 2) {
      formatted += ' ' + truncated.substring(2, 4)
    }
    if (truncated.length > 4) {
      formatted += ' ' + truncated.substring(4, 7)
    }
    if (truncated.length > 7) {
      formatted += ' ' + truncated.substring(7, 9)
    }

    phone.value = formatted
  }

  watch(phone, (newVal) => {
    if (!newVal || newVal.length < 5) {
      phone.value = '+261 '
    }
  })

  function goHome() {
    router.push('/')
  }

  function goToLogin() {
    emit('show-login')
    router.push({ name: 'Login' })
  }

  async function submitRegister() {
    errorMessage.value = ''
    successMessage.value = ''
    registerComplete.value = false

    if (!canSubmit.value) {
      errorMessage.value = 'Verifiez les champs du formulaire avant de continuer.'
      return
    }

    loading.value = true

    try {
      const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            displayName: fullName.value,
          },
        },
      })

      if (authError) {
        throw authError
      }

      const userId = authData.user?.id
      if (!userId) {
        throw new Error('Impossible de recuperer l\'UID utilisateur.')
      }

      const { error: insertError } = await supabaseClient
        .from('info_user')
        .insert([
          {
            id_info_user: userId,
            n_et_p: fullName.value,
            numero: phone.value,
            cin: cin.value,
          },
        ])

      if (insertError) {
        throw insertError
      }

      registerComplete.value = true
      successMessage.value = 'Compte cree avec succes. Redirection vers la connexion...'
      redirectTimeout.value = setTimeout(() => goToLogin(), 3000)
    } catch (err) {
      errorMessage.value = err.message || 'Une erreur est survenue pendant l inscription.'
    } finally {
      loading.value = false
    }
  }

  onBeforeUnmount(() => {
    if (redirectTimeout.value) {
      clearTimeout(redirectTimeout.value)
    }
  })

  return {
    fullName,
    email,
    phone,
    cin,
    password,
    confirmPassword,
    showPassword,
    loading,
    errorMessage,
    successMessage,
    registerComplete,
    passwordsMatch,
    canSubmit,
    formatPhone,
    goHome,
    goToLogin,
    submitRegister,
  }
}
