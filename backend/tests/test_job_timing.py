from app.jobs import public_job


def job(key, duration, **values):
    return dict(
        id=key,
        kind="visual_asset",
        stage="ready",
        created_at="2026-10-06T12:00:00+00:00",
        updated_at=f"2026-10-06T12:0{duration}:00+00:00",
        payload={"tier": "Gen-2.5-Medium", "quality_override": 20000},
        private={"subscription_key": "never-public"},
        **values,
    )


def test_timing_uses_comparable_completed_jobs_and_keeps_secrets_private():
    current = job("current", 4)
    history = [job("one", 2), job("two", 3), job("failed", 1)]
    history[2]["stage"] = "failed"
    different = job("different", 5)
    different["payload"]["quality_override"] = 10000
    result = public_job(current, [*history, different, current])
    assert result["timing"]["sample_count"] == 2
    assert result["timing"]["observed_range_seconds"] == [120, 180]
    assert "private" not in result and "payload" not in result
    assert result["created_at"] == current["created_at"]
    assert public_job(current)["timing"]["observed_range_seconds"] is None
