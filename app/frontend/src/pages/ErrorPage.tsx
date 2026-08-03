import { Link } from 'react-router-dom'

function ErrorPage() {
  return (
    <main>
      <h1>404</h1>
      <p>Страница не найдена</p>
      <Link to="/">Вернуться на главную</Link>
    </main>
  )
}

export default ErrorPage
