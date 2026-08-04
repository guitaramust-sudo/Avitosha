import './AchievementsPanel.scss'

const achievements = [
  {
    icon: '▰',
    title: 'Первое объявление',
    description: 'Разместили объявление',
    tone: 'orange',
  },
  {
    icon: '•••',
    title: 'Хорошая сделка',
    description: 'Написали в чат по объявлению',
    tone: 'purple',
  },
  {
    icon: '♥',
    title: 'Помогли другому',
    description: 'Оставили отзыв или оценку',
    tone: 'red',
  },
  {
    icon: '◆',
    title: 'Безопасность',
    description: 'Подключили Авито Доставку',
    tone: 'blue',
  },
  {
    icon: '▱',
    title: 'Первые покупки',
    description: 'Купили что-то на Авито',
    tone: 'green',
  },
]

function AchievementsPanel() {
  return (
    <aside className="achievements-panel">
      <section className="achievements-panel__main">
        <h2>Мои достижения</h2>

        <div className="achievement-list">
          {achievements.map((achievement) => (
            <article className="achievement" key={achievement.title}>
              <span
                className={`achievement__icon achievement__icon--${achievement.tone}`}
                aria-hidden="true"
              >
                {achievement.icon}
              </span>
              <div className="achievement__copy">
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
              </div>
              <span className="achievement__complete" aria-label="Выполнено">
                ✓
              </span>
            </article>
          ))}
        </div>

        <button className="achievements-panel__all" type="button">
          Смотреть все
          <span aria-hidden="true">›</span>
        </button>
      </section>

      <section className="streak-card">
        <div className="streak-card__title">
          <span aria-hidden="true">🔥</span>
          <div>
            <small>Серия дней</small>
            <strong>5 дней подряд!</strong>
          </div>
        </div>

        <ol className="streak-card__days" aria-label="Прогресс серии дней">
          {[1, 2, 3, 4, 5].map((day) => (
            <li className={day <= 3 ? 'is-complete' : ''} key={day}>
              {day <= 3 ? '✓' : day + 2}
            </li>
          ))}
        </ol>

        <p>Заходите каждый день и получайте больше наград!</p>
      </section>
    </aside>
  )
}

export default AchievementsPanel
