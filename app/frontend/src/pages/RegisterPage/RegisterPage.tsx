import AuthPageLayout from '../../components/AuthPageLayout/AuthPageLayout'
import RegisterForm from '../../components/RegisterForm/RegisterForm'

function RegisterPage() {
  return (
    <AuthPageLayout
      eyebrow="Твой новый друг"
      title="Растёт вместе с твоей активностью"
      description="Выполняй задания, получай награды и обустраивай уютный дом."
    >
      <RegisterForm />
    </AuthPageLayout>
  )
}

export default RegisterPage
