# 21. Graceful shutdown and timeouts

## Why

Kubernetes sends SIGTERM. Without graceful shutdown you cut in-flight requests and leak connections.

```go
srv := &http.Server{
    Addr:              addr,
    Handler:           handler,
    ReadHeaderTimeout: 5 * time.Second,
}

go srv.ListenAndServe()

<-stop // SIGINT/SIGTERM
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
_ = srv.Shutdown(ctx)
pool.Close()
```

`Shutdown` stops new accepts and waits for handlers (until ctx deadline).

## Timeouts

| Knob | Role |
|------|------|
| `ReadHeaderTimeout` | mitigate slowloris |
| context in handlers | bound DB work |
| shutdown timeout | don't hang forever on drain |

## Checklist

- [ ] Signal handler calls `Shutdown`
- [ ] DB pool closed after HTTP drain

Next: [22. Lab: shutdown](22-lab-shutdown.md).
