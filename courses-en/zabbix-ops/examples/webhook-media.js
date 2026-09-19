// Paste into Alerts → Media types → Webhook → Script.
// Parameters: url, subject, message (values {ALERT.SUBJECT} / {ALERT.MESSAGE}).

try {
    var params = JSON.parse(value),
        req = new HttpRequest(),
        payload = JSON.stringify({
            subject: params.subject,
            message: params.message
        });

    req.addHeader('Content-Type: application/json');
    var resp = req.post(params.url, payload);
    return 'OK: ' + resp;
} catch (e) {
    throw 'Webhook failed: ' + e;
}
