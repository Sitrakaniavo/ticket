// tests/integration/AuthIntegrationTest.kt
import org.junit.Test
import org.junit.Assert.*
import kotlinx.coroutines.test.runTest
import org.diatsara.app.viewmodel.AuthViewModel

class AuthIntegrationTest {
    @Test
    fun testLoginWithInvalidCredentials() = runTest {
        val viewModel = AuthViewModel()
        
        viewModel.login("invalid@example.com", "wrongpassword")
        
        // Vérification que le message d'erreur est affiché
        val state = viewModel.uiState.value
        assertTrue(state is AuthUiState.Error)
        assertNotNull((state as AuthUiState.Error).message)
    }
}