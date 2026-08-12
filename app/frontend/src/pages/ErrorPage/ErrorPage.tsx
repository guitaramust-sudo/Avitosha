import { Link } from 'react-router-dom'

import avitoshaImage from '../../../images/Avitosha/idle/idle1.png'

import './ErrorPage.scss'

function ErrorPage() {
  return (
    <main className="error-page">
      <section className="error-page__card">
        <div className="error-page__content">
          <span className="error-page__code">Ошибка 404</span>
          <h1>Кажется, Авитоша здесь ничего не нашёл</h1>
          <p>
            Такой страницы нет или она переехала. Вернитесь домой — там вас ждут
            задания, награды и обустройство комнаты.
          </p>
          <div className="error-page__actions">
            <Link className="error-page__primary-action" to="/">
              Вернуться к Авитоше
            </Link>
            <Link className="error-page__secondary-action" to="/marketplace">
              Посмотреть объявления
            </Link>
          </div>
        </div>

        <div className="error-page__illustration" aria-hidden="true">
          <span className="error-page__number">404</span>
          <span className="error-page__bubble">Куда же делась страница?</span>
          <img src={avitoshaImage} alt="" />
        </div>
      </section>
    </main>
  )
}

export default ErrorPage
