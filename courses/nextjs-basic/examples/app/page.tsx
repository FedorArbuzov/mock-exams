export default function HomePage() {
  return (
    <section>
      <h1>Shop — nextjs-basic</h1>
      <p className="muted">
        Fullstack-каталог на Next.js App Router. API — FastAPI на порту 8090.
      </p>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <p>
          Это стартовая страница курса. В лабах вы добавите каталог, SSR-страницы
          товаров, Route Handlers и Docker-деплой.
        </p>
      </div>
    </section>
  );
}
