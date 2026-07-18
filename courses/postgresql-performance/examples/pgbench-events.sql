\set device_id random(1, 1000)
SELECT count(*) FROM perf.events WHERE device_id = :device_id;
