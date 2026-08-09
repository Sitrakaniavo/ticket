import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabaseClient } from '../lib/supabaseClient'

export function useLoginPage() {
  const router = useRouter()

  const email = ref('')
  const password = ref('')
  const loading = ref(false)
  const errorMessage = ref('')

  const canSubmit = computed(
    () => email.value && password.value && !loading.value,
  )

  function goHome() {
    router.push('/')
  }

  async function login() {
    errorMessage.value = ''

    if (!canSubmit.value) {
      errorMessage.value = 'Veuillez renseigner votre e-mail et votre mot de passe.'
      return
    }

    loading.value = true

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value,
      })

      if (error) throw error

      const user = data.user
      if (!user) {
        throw new Error('Impossible de récupérer les données utilisateur.')
      }

      const { data: userInfo, error: dbError } = await supabaseClient
        .from('info_user')
        .select('n_et_p, cin')
        .eq('id_user', user.id)
        .maybeSingle()

      if (dbError) throw dbError

      const nameFromDb = userInfo?.n_et_p
      const nameFromMetadata = user.user_metadata?.full_name || user.user_metadata?.n_et_p
      const finalDisplayName = nameFromDb || nameFromMetadata || 'Voyageur'
      const finalCin = userInfo?.cin != null ? String(userInfo.cin) : null

      const sessionData = {
        ...data,
        id_user: user.id,
        id: user.id,
        userId: user.id,
        cin: finalCin,
        user: {
          ...user,
          id: user.id,
          id_user: user.id,
          displayName: finalDisplayName,
          cin: finalCin,
        },
      }

      localStorage.setItem('rail_user_session', JSON.stringify(sessionData))
      router.push({ name: 'Booking' })
    } catch (err) {
      errorMessage.value = err.message || 'Erreur de connexion. Veuillez réessayer.'
    } finally {
      loading.value = false
    }
  }

  return {
    email,
    password,
    loading,
    errorMessage,
    canSubmit,
    goHome,
    login,
  }
}
