import AuthPageLayout from '../../components/AuthPageLayout/AuthPageLayout'
import LoginForm from '../../components/LoginForm/LoginForm'

function LoginPage() {
  return (
    <AuthPageLayout
      eyebrow="Авитоша ждёт тебя"
      title="Возвращайся к своему питомцу"
      description="Продолжай выполнять задания, получать награды и обустраивать комнату."
    >
      <LoginForm />
    </AuthPageLayout>
  )
}

export default LoginPage
