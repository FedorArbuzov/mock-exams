export default function HomePage() {
  return (
    <section>
      <h1>Shop — nextjs-basic</h1>
      <p className="muted">
        Fullstack catalog built on Next.js App Router. API — FastAPI on port 8090.
      </p>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <p>
          This is the course starter page. In the labs you'll add the catalog, SSR
          product pages, Route Handlers, and a Docker deployment.
        </p>
      </div>
    </section>
  );
}
