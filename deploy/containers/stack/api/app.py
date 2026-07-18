from flask import Flask, jsonify
import os
import redis

app = Flask(__name__)
r = redis.Redis(host=os.environ.get("REDIS_HOST", "redis"), port=6379, decode_responses=True)


@app.get("/health")
def health():
    r.ping()
    return jsonify(status="ok")


@app.get("/api/hits")
def hits():
    count = r.incr("hits")
    return jsonify(hits=count)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
