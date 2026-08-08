import './FrequentlyAskedQuestions.scss'

const questions = [
  {
    answer:
      'Откройте текущее задание, выполните указанное действие и дождитесь обновления прогресса. Награды начисляются автоматически.',
    question: 'Как выполнять задания?',
  },
  {
    answer:
      'Новые предметы открываются за прохождение заданий. Открытый предмет можно перетащить из коллекции в комнату и затем перемещать.',
    question: 'Как получить и разместить предмет?',
  },
  {
    answer:
      'Опыт начисляется за игровые действия и задания. Когда шкала XP заполнится, уровень Авитоши повысится автоматически.',
    question: 'Как повышается уровень Авитоши?',
  },
  {
    answer:
      'Нажмите на имя Авитоши в шапке, введите новое имя русскими буквами и сохраните изменения.',
    question: 'Как изменить имя питомца?',
  },
  {
    answer:
      'В лидерборде учитываются очки за выполненные игровые действия. Таблица обновляется вместе с прогрессом игры.',
    question: 'Как формируется лидерборд?',
  },
  {
    answer:
      'После скрытия цели Авитоша показывает отдельный совет по текущему заданию. Если нейросеть недоступна, вы получите безопасную локальную подсказку.',
    question: 'Как работают советы Авитоши?',
  },
]

function FrequentlyAskedQuestions() {
  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="faq__heading">
        <span>Помощь</span>
        <h2 id="faq-title">Частые вопросы</h2>
        <p>Коротко о заданиях, наградах и возможностях Авитоши.</p>
      </div>

      <div className="faq__list">
        {questions.map(({ answer, question }) => (
          <details className="faq-item" key={question}>
            <summary>
              <span>{question}</span>
              <i aria-hidden="true">+</i>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default FrequentlyAskedQuestions
