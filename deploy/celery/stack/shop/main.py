from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from shop.celery_app import app as celery_app
from shop.tasks import ORDERS, add, generate_report, ping, process_order, send_welcome_email

app = FastAPI(title="Shop Celery Lab", version="1.0.0")


class OrderCreate(BaseModel):
    order_id: str = Field(min_length=1, max_length=64)
    amount: str = Field(default="10.00")


class WelcomeEmail(BaseModel):
    user_id: str
    email: str


class ReportRequest(BaseModel):
    report_type: str = "daily"


@app.get("/health/")
def health():
    return {"status": "ok", "framework": "celery-lab"}


@app.post("/tasks/ping/")
def trigger_ping():
    result = ping.delay()
    return {"task_id": result.id, "status": "queued"}


@app.post("/tasks/welcome-email/")
def trigger_welcome_email(body: WelcomeEmail):
    result = send_welcome_email.delay(body.user_id, body.email)
    return {"task_id": result.id, "status": "queued"}


@app.post("/orders/")
def create_order(body: OrderCreate):
    result = process_order.delay(body.order_id, body.amount)
    return {"task_id": result.id, "order_id": body.order_id, "status": "queued"}


@app.post("/reports/")
def trigger_report(body: ReportRequest):
    result = generate_report.delay(body.report_type)
    return {"task_id": result.id, "status": "queued"}


@app.post("/tasks/add/")
def trigger_add(x: int, y: int):
    result = add.delay(x, y)
    return {"task_id": result.id, "status": "queued"}


@app.get("/tasks/{task_id}/")
def get_task(task_id: str):
    async_result = celery_app.AsyncResult(task_id)
    payload = {
        "task_id": task_id,
        "state": async_result.state,
        "ready": async_result.ready(),
    }
    if async_result.failed():
        payload["error"] = str(async_result.result)
    elif async_result.successful():
        payload["result"] = async_result.result
    return payload


@app.get("/orders/{order_id}/")
def get_order(order_id: str):
    if order_id not in ORDERS:
        raise HTTPException(status_code=404, detail="Order not found or not processed yet")
    return ORDERS[order_id]
