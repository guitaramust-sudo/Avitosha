import { Link } from 'react-router-dom'

import './ErrorPage.scss'

function ErrorPage() {
  return (
    <main className="error-page">
      <h1>404</h1>
      <p>Страница не найдена</p>
      <Link to="/">Вернуться на главную</Link>
    </main>
  )
}

export default ErrorPage
